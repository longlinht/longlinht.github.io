---
layout: post
cover: false
title: "The Robot Saw the Ball and Didn't Move"
date:   2026-10-04 20:30:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

Last week we had a Booster K1 on the field, running the full soccer behavior tree. The robot turned its head and followed the ball. Vision was clearly working. And the robot stood there. It did not walk to the ball.

It took two days to understand. The direct cause was one condition. But on the way there we found four other problems that looked like the same problem. This post is about separating them.

## The symptoms, all at once

When we started, everything was mixed together:

- At first, the vision and brain nodes sometimes failed to start or crashed.
- With a simple "chase" tree, the robot turned its head but didn't move its body.
- With the full game tree, the status log showed the control state set, but the game state empty.
- At one point the camera RGB topic had no publisher at all.
- Our nodes and the vendor's nodes sometimes could not see each other on the ROS 2 network.

It is very tempting to look for one root cause that explains all of this. There wasn't one. These were different layers failing in different ways, and some of them at the same time.

## The direct cause: two conditions, not one

The soccer behavior tree we run has two separate pieces of state:

- **control state**: is the robot under autonomous control?
- **game state**: what does the referee say? INITIAL, READY, SET, PLAY, END.

When the game tree starts, it sets the control state to "autonomous". That part was fine. But the normal striker and goalkeeper behavior also requires the game state to be **PLAY**. And nobody had told the robot the game was playing.

So the robot did everything a robot should do before kick-off. It looked for the ball. It tracked it with its head. It did not walk, because the game had not started. From the outside, that looks exactly like a bug in the chase logic.

The brain also listens to a simple external control topic with string commands: `locate`, `ready`, `play`, `stop`. Each one sets both pieces of state together. Sending `play` sets the control state and the game state to PLAY (and also marks the kick-off as ours).

After a restart, we started the game tree and sent `play`. In the log, the brain received the command, the state changed to PLAY, and about two seconds later the first non-zero turn command appeared. A few seconds after that, the first forward walk command. The robot found the ball and went for it.

Nothing in the chase algorithm or the speed parameters had changed. Only the game state.

## Head tracking is not proof of play

This is the lesson I most want to keep. A robot tracking the ball with its head tells you:

- the camera works,
- vision detects the ball,
- the brain receives detections.

It does **not** tell you that the play behavior is running. Head tracking can happen before PLAY. A correct control mode can happen before PLAY. Both are necessary, neither is sufficient.

Also, a manual `play` is a test tool. It is not the referee. In a real game, the GameController sends the game state. Getting the robot to move with a manual command proves the behavior works. It does not prove the referee path works. That has to be tested separately.

## The other four problems

While chasing the main issue we found and noted the others. I keep them separate because each has a different fix and a different level of "solved".

**The camera.** The RGB topic had no publisher. On the firmware version we had, the head camera has to be switched into the right mode through a vendor service call. After that, RGB and detections both came back at a steady rate. This is specific to that firmware. After a firmware update, I check the vendor docs again before assuming the same call works.

**The vendor stack.** A restart brought back the motion, camera, vision and agent services. A restart is a good cleanup. It is not a fix. If it happens again, we need to know why.

**DDS discovery.** The Fast DDS profile listed network addresses that were not the ones actually active on the robot that day. That is a good explanation for nodes sometimes not discovering each other. But it is an explanation, not a proven root cause, and it is still open. When nodes are "missing", I now check three things separately: is the process alive, is the ROS participant discovered, and do messages actually flow.

**Startup robustness.** We added some hardening: the start script checks that the behavior tree file is installed before stopping the old processes; the launch file checks the tree file name, that it exists, and that the XML parses; the vision node finds its model in the installed package and keeps the error instead of crashing with a null pointer if the model fails to load. None of this was the cause of the "doesn't move" problem. All of it made the next test less confusing.

## A field order I now follow

From this I wrote a short field debug guide. The order is the important part. Each step only makes sense if the step before it is green:

1. **Record versions.** Firmware version file and code commit. Without this, any result is hard to compare later.
2. **Vendor services.** Are the motion, camera, vision and agent processes actually running? List nodes with `--no-daemon`, so you don't read a stale cache.
3. **Camera.** Does the RGB topic have a publisher? What is the rate?
4. **Vision.** Are detections published, and at what rate?
5. **Brain.** Is it running the tree you think it is?
6. **Game state.** Is it PLAY? Who set it?
7. **Velocity output.** Are non-zero commands coming out?
8. **Motion.** Only now look at whether the robot moves.

It is very easy to stare at step 8 and guess about steps 2 to 7. That is where the time goes.

## What I'd like to have next time

- A low-frequency, structured log of brain state changes. Finding "received play" among thousands of debug lines is slow.
- A regression list I actually run: robot stays still with no game state; starts after PLAY; returns to zero after STOP; manual path and referee path tested separately; one change at a time.

## What I took away

- **Many symptoms, many causes.** Don't force one story onto five problems.
- **Know every gate on the path to motion.** Control mode and game state were two gates, and I only knew about one.
- **Head tracking proves perception, not behavior.**
- **A restart is cleanup, not a fix.** Write down what it cleaned up.
- **Debug from the bottom up.** Services, camera, vision, brain, game state, velocity, then motion. In that order.
