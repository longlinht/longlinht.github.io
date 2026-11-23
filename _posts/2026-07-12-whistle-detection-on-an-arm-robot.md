---
layout: post
cover: false
title: "Hearing the Referee: Whistle Detection on an ARM Robot"
date:   2026-07-12 21:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In RoboCup humanoid soccer, the referee uses a whistle. For some game state changes, like kick-off going from "set" to "playing", robots are expected to hear the whistle themselves. The official GameController sends the same "playing" signal too, but with a delay. A robot that hears the whistle can start moving earlier.

So our robot needed ears. The pipeline is simple to describe:

```
microphone (ALSA)
  -> AlsaWhistleDetector
  -> TFLiteWhistleDetection (features + small neural net)
  -> whistle_detector_node publishes /whistle_detection/detected
  -> brain node subscribes
  -> behavior / game state
```

Making it actually work on the robot took much longer than writing that diagram. Almost none of the problems were about the neural network.

## Problem 1: the library was the wrong CPU

The detector code came with TensorFlow Lite bundled as static libraries. For `x86_64`. Our workstations are `x86_64`. The robot is `aarch64`.

So it built and ran on my laptop, and the robot build failed at CMake configure. On the robot there was no system TensorFlow Lite either. Nothing under `/usr` or `/usr/local`.

The fix was to build the TensorFlow Lite C API for ARM64 myself, as a shared library, and keep it inside the repository:

1. On an Ubuntu `x86_64` machine, install the AArch64 cross toolchain and Bazelisk.
2. Clone TensorFlow and pin a release branch.
3. Run `./configure` with CUDA, ROCm, Android and iOS all off.
4. Build only the C library:

```bash
bazel build --config=elinux_aarch64 -c opt \
  //tensorflow/lite/c:libtensorflowlite_c.so
```

5. Check that what you built is really what you think:

```bash
file libtensorflowlite_c.so
readelf -h libtensorflowlite_c.so | grep Machine   # AArch64
readelf -d libtensorflowlite_c.so | grep NEEDED    # only libc, libm, libstdc++...
```

6. Copy the `.so` and the C headers into the package's `3rdparty` folder under an `aarch64` directory.

Then CMake picks the backend by architecture. There was one more trap. The build had a **stub fallback**: if no TensorFlow Lite was found, it built a detector that compiles, runs, and never detects anything. Good for keeping the build green. Terrible on a robot, because everything looks fine.

So on the robot we build with the stub explicitly disabled:

```bash
colcon build --packages-select whistle_detector --symlink-install \
  --cmake-args -DWHISTLE_DETECTOR_ALLOW_STUB_FALLBACK=OFF
```

and look for one line in the output: `using repo TensorFlow Lite library: .../aarch64/libtensorflowlite_c.so`. If it says "disabled stub", stop.

## Problem 2: two Python environments

To build TensorFlow I created a Python virtual environment. Later I ran `colcon build` for the ROS workspace from the same shell. ROS message generation failed with:

```
ModuleNotFoundError: No module named 'em'
```

`colcon` had picked the virtualenv's `python3`, which did not have ROS's Python dependencies. Nothing wrong with the code. Wrong shell.

The rule now: the TensorFlow build shell is only for TensorFlow. ROS builds happen in a clean ROS shell.

## Problem 3: who starts the detector?

At first the detector was started by the brain's launch file, as a child. The start script did not make that clear, and the stop script did not stop the detector at all. So you could end up with an old detector still holding the microphone.

We changed it to two independent processes. The brain only subscribes to the topic. It never touches the microphone, and it does not spawn the detector. There is a script to start everything, one to start only the detector, one to start only the brain, and the stop script stops both.

It is a small change, but now "is the detector running?" has one answer, and you can test each side alone.

## Problem 4: "the microphone is open" is not "the microphone works"

ALSA can open a device successfully and then deliver no audio. Or deliver audio from the wrong device. On a robot with several audio routes, `default` is not always what you want.

The detector expects a very specific format: capture, interleaved, `S16_LE`, 2 channels, 44100 Hz. It does not resample or remap channels. So the first test is outside ROS:

```bash
arecord -l
arecord -D default -f S16_LE -c 2 -r 44100 -d 3 /tmp/whistle_test.wav
```

Then I added logs that separate the states that used to look the same:

- device opened,
- device opened but no frames yet,
- **microphone input is active, received N frames**,
- overrun, recovering.

Only the third one counts as "microphone online". Two other small ALSA fixes came from comparing with a known-good capture example: call `snd_pcm_prepare()` explicitly before the read loop, and use `snd_pcm_drop()` instead of `snd_pcm_drain()` when closing a capture device.

## Problem 5: a cooldown that never cooled down

After a detection, the node waits for a cooldown before publishing again. The "last publish" time was initialised to `steady_clock::time_point::min()`.

That looks reasonable: "long, long ago". But `now() - min()` overflows a signed 64-bit duration. My reading is that the cooldown check got a garbage value and never let the first detection through. Initialising it to `now() - cooldown - 1ms` fixed it.

One more small crash in the same area: `cooldown_ms` was declared as a `double` parameter, and the launch file passed `1500`. ROS 2 is strict about parameter types and threw `InvalidParameterTypeException`. It had to be `1500.0`.

## Two logs that tell you everything

The most useful thing I added was two log lines, one on each side of the topic:

- detector: `upstream whistle detector hit: published detection with confidence ...`
- brain: `whistleDetectionCallback triggered: whistle detected at ... s`

Now the diagnosis is a table:

| Detector log | Brain log | Meaning |
|---|---|---|
| no | no | detector not triggering, not running, or on the stub |
| yes | no | detection works, brain is not receiving it |
| yes | yes | the chain is connected |

`grep` on two log files answers a question that used to take a lot of guessing.

## What tests can and can't tell you

I added unit tests for the detector: a whistle-like tone should be detected, silence and an off-band tone should be rejected, and `reset()` should clear the streaming state. They pass.

They test the model and the windowing logic. They do not test the microphone. Synthetic tones are not a referee in a noisy hall. In real testing we saw false positives even with a strict confidence threshold, so threshold tuning with real field recordings is still open work.

And there was a bigger lesson. In a game test, the whistle was detected, but the robot was not in the ready or playing behavior we expected. The ears worked. The state handling around them did not, and we have not fully closed that yet.

That changed how I think about the feature. Hearing correctly is not the hard part. Deciding **who is allowed to change the game state** is. The GameController is the official source of game state. If the whistle can also change it, you now have two referees inside one robot, and they will sometimes disagree. My plan from here is to keep the GameController as the authority, and treat the whistle as an extra signal that is logged and checked, until we can prove the two never fight.

## What I took away

- **The model was the easy part.** Cross-compiling, Python environments, process ownership and audio routing took most of the time.
- **Never let a stub pass silently.** A fallback that compiles but does nothing must be turned off on the real target.
- **Log the boundaries.** One log line on each side of a topic turns debugging into a lookup table.
- **Opened is not working.** Only count a sensor as online when real data arrives.
- **Detection is not authority.** Before a signal changes the robot's state, decide who owns that state.
