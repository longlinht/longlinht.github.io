---
layout: post
cover: false
title: "Two Open-Source RoboCup Stacks on One Small Humanoid: B-Human vs HTWK on the Booster K1"
date:   2026-10-30 21:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

The Booster K1 is a small humanoid that many RoboCup teams now use. Two of the strongest teams have published software that can run on it, and they took very different paths.

- **HTWK** (Leipzig) published HTWK Gym, a reinforcement learning framework for training walking policies for the Booster T1 and K1. You bring the rest of the soccer stack.
- **B-Human** (Bremen) published its 2026 code release: a complete robot soccer program, perception to motion, now for the K1 and T1 only.

I have been working with both this autumn. My K1 work started on the HTWK route: a walking policy trained in HTWK Gym, connected through a bridge to a ROS 2 behavior-tree soccer stack. This week I also installed the B-Human release on a K1. This post compares the two, as architecture. It is not a benchmark. Neither is "better". They answer different questions.

## Shape: one program versus many nodes

**B-Human** is one C++ program, about 150,000 lines. Vision, localization, behavior and motion all live inside it, in threads: camera, motion at 500 Hz, audio, cognition, debug. All motions are RL policies: walk, kick and get-up, running at 50 Hz through ONNX Runtime.

**The HTWK route** is a set of pieces. HTWK Gym trains a 12-output lower-body walking policy (ParameterWalk, 54 inputs). On the robot, a bridge runs that policy next to separate ROS 2 nodes for vision and behavior. Get-up and other skills stay with the Booster firmware.

The trade-off is the usual one. One program is easier to make consistent: one clock, one set of frames, one place to debug. Separate nodes are easier to swap and to mix with the vendor's own stack, but every boundary is a place where timing and ownership can go wrong.

## Who owns the robot

This was the biggest difference for me.

**B-Human never gives control back to the vendor during play.** It runs the whole time in Booster's CUSTOM mode. Its own "prepare" and "walk" are states *inside* CUSTOM, not Booster's PREP and WALK. A parent watchdog process starts the control program. If the control program dies, the watchdog switches the robot to damping and saves a trace. The emergency button (F1) is always handled by the watchdog, so it still works when the control program misbehaves. No robot data for 50 ms counts as an emergency.

**The HTWK route leans on the firmware.** The firmware's standing posture is the safe home. The bridge hands over from firmware to the RL policy, and hands back to the firmware's PREP mode when it releases. I wrote about that handover in the [motion owner post](/exactly-one-motion-owner.html).

Both models end in the same place on a fault: damping. And damping drops a standing robot in either stack. That is worth remembering whichever one you pick.

## The installer is part of the architecture

B-Human's installer is invasive, and that is a design choice, not a flaw. To be the only one who sees the buttons and the gamepad, it patches two Booster binaries so the original topic names are no longer published. It turns off several Booster services, including the vendor's camera service, and installs its own camera streaming service on the head board. It changes the password and network settings.

The consequence: once installed, anything that listens on Booster's original button or gamepad topics, like SDK samples or a ROS 2 soccer stack, gets nothing. There is an uninstall option that restores the patched files, but not every change is undone.

So in practice, **you can't casually run both stacks on one robot.** B-Human's release is tested on Booster firmware 1.7.1 and says 1.8.0 does not behave as intended. My HTWK-route robot runs a 1.8 firmware. Switching one robot between stacks means uninstalling, maybe changing firmware, and checking what is left behind. Where possible, I give each stack its own robot.

## Walking policies

The walking inputs show two very different bets:

- **HTWK ParameterWalk**: 54 inputs to 12 outputs. Compact, current state plus commands.
- **B-Human walk**: 344 inputs on the K1, with a history of 10 steps (200 ms), 12 leg outputs, and an extra output that adjusts the gait frequency. B-Human credits the history and the learned frequency for straighter legs.

I don't know yet which matters more on our robots. But it is a concrete thing to try in HTWK Gym: add history, let the policy pick its frequency, and compare.

## Kicking

Another clear difference:

- **B-Human** has two RL kick policies, and the kick policy also does the **final approach** to the ball. Its inputs include ball velocity, kick direction and strength, and the previous ball position.
- **HTWK Gym** has a kicking task with 44 inputs, built around a robot that is already standing in a tight window behind the ball.

Handing the last steps to the kick policy is a big design choice. It means "walk to the ball" and "kick" are not two separate skills with a handover in between. If kicking becomes a priority for us, B-Human's input design is the reference I'd start from.

## Small details that bite

- **Frames.** B-Human's torso frame origin is between the hip pitch joints. Booster's is 77 mm higher. If you compare or exchange any pose data between the stacks, convert first.
- **Build machine.** B-Human's Linux docs target Ubuntu 26.04 with recent clang, CMake and Qt. My workstation runs 22.04. Instead of upgrading it, I built in a Docker image and cross-compiled for the robot there. SimRobot, their simulator and debugging tool, also runs in a container and connects to the robot remotely.
- **Build type.** B-Human's Develop build is the useful middle: fast enough on the robot, and it can still connect to SimRobot. Release can't connect. Debug is too slow on the real robot.
- **Licenses.** B-Human's code is released publicly every year. The HTWK Gym snapshot I looked at had no license file, and its README limits competition use of pretrained models to cases agreed with HTWK. Ask before reusing.

## So which one?

For now, both, on separate robots.

The HTWK route fits a team that already has a ROS 2 soccer stack and wants to add learned locomotion without replacing everything. Its cost is the handover between firmware and policy, which you have to design and test very carefully.

The B-Human route is a complete, consistent system with years of competition behind it. Its cost is that it takes over the robot, and you accept its architecture, its firmware version and its tools.

Reading both side by side has been the best robotics education I've had this year. Each one makes the other's assumptions visible.

## What I took away

- **Compare ownership models, not features.** Who owns the joints, the buttons and the safe state tells you more than any feature list.
- **An installer can be architecture.** What it disables and patches is part of the design.
- **One robot per stack.** Firmware versions and patched binaries make sharing expensive.
- **Read the inputs.** The input vector of a policy tells you what its authors believed mattered.
- **Open source in RoboCup is a gift.** Both teams published years of work. The least I can do is read it carefully before I change it.
