---
layout: post
cover: false
title: "Exactly One Motion Owner: Running an RL Policy Next to Vendor Firmware"
date:   2026-10-17 21:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

A Booster K1 comes with firmware that can already stand, walk, get up and kick. It is a complete product. For RoboCup we wanted to try our own walking: a reinforcement learning policy, trained in simulation, running on the robot and sending joint targets.

The tempting plan is: train the policy, export it, run it, publish joint commands. Done.

The real problem turned out to be something else. Not "how do I run a policy", but **who is moving the legs right now?** The firmware can move them. The policy can move them. The soccer behavior sends walk requests. If two of these think they are in charge at the same time, the robot falls.

So the rule we designed around is simple to say: **at any moment, exactly one thing owns the motion.** This post is what that rule means in practice.

## The modes you have to respect

The K1 manual describes a small set of modes:

- **DAMP**: joints resist motion but do not hold a posture. Safe for the motors. Not safe for a standing robot, it will fold.
- **PREP**: standing posture, but no active balance.
- **WALK**: the firmware's own walking and predefined actions.
- **CUSTOM**: developer control. Low-level joint commands from the SDK only take effect here.
- **PROTECT**: entered automatically after errors like a fall.

And the transitions are restricted. CUSTOM can only be entered from PREP or DAMP, and can only go back to PREP or DAMP.

So an RL policy lives in CUSTOM. The firmware's walking lives in WALK. You cannot jump between them directly. Every switch is a handover, and handovers are where robots fall.

## Don't change the soccer code, put a proxy in front

The soccer behavior (a ROS 2 "brain" node with a behavior tree) already sends locomotion requests to the firmware: "walk with this velocity", "move the head", "kick", "get up". We did not want to fork it.

ROS 2 topic remapping gave us a clean option. At launch, the brain's request topic is remapped to a bridge. The bridge decides where each request goes:

```
brain (behavior tree)
   |  locomotion requests (remapped)
   v
bridge
   Firmware owns:  forward request to the firmware
   RL owns:        walk velocity  -> policy input
                   head request   -> head joint targets
                   joint targets  -> single low-level publisher
```

The brain does not need to know which one is walking. It keeps sending "walk forward at this speed". The bridge turns that into either a firmware request or a policy command.

One catch: if anyone starts the brain the old way, without the remap, it talks to the firmware directly and bypasses the bridge. So the bridge checks for other publishers on the firmware request topic and on the joint command topic before it takes over. A second writer is a fault, not a warning.

## Handing over: firmware to RL

This is the part with the most steps, and each step exists because something can go wrong there:

1. **Warm up the policy first.** Run inference on live robot state for a short time while the firmware is still in charge. If inference can't keep up now, it won't keep up later.
2. **Ask the firmware to stand still.** Zero velocity.
3. **Preload a hold command** with the current joint positions. When control switches, the first command the motors see is "stay where you are", not some default pose.
4. **Create the one and only joint publisher**, and confirm nobody else is publishing.
5. **Warm up again under load**, now with the high-rate publishing running. If a deadline is missed here, abort and stay with the firmware.
6. **Request CUSTOM once and wait for confirmation.** Don't spam the mode request.
7. **Check that the robot state is fresh.**
8. **Ramp in** over a couple of seconds from the hold pose to the policy's output.
9. **Only now** accept walk commands from the brain.

The policy runs at 50 Hz. Joint commands go out at 500 Hz. Targets are slew-limited, and a velocity command that is not refreshed in time is set back to zero.

## Handing back: RL to firmware

The reverse is shorter, and the order matters:

1. Mask the brain's velocity.
2. Hold a zero command for a moment so the robot settles.
3. Switch to PREP and **confirm** the switch.
4. Remove the joint publisher.

Stopping the publisher and confirming the mode are two different things. If you only stop publishing, the motors keep the last command and you don't know who is in charge. If you confirm the mode first, you know.

Firmware skills like get-up go through this path too. The bridge first gives control back, confirms it, and only then forwards the skill request. After a firmware skill, the policy does not take over again automatically. Somebody has to enable it again on purpose.

## When things go wrong: damping

The fault path is one direction only: request DAMP, then remove the publisher. Faults include:

- robot state is stale,
- unsafe posture or a fall,
- motor error or over-temperature,
- a second writer appears,
- the firmware leaves CUSTOM on its own (someone pressed the emergency button),
- inference misses its deadline.

Damping protects the motors. But remember the first section: a standing robot in damping folds to the ground. So "fault means damping" is the right rule for the hardware, and it is also why a person must be ready to catch or support the robot during these tests. There is no software-only safe stop for a standing humanoid.

## The rules I would not relax

Some numbers in this design are tempting to loosen when a check fails: the publish rate, the inference deadline, the maximum age of robot state. Each of those exists because something real depends on it. If a check fails, the check found a problem. Loosening the threshold to make it pass only hides it.

I wrote this down as a rule in the runbook, because on a long test day it is very easy to forget.

## What is still open

The bridge knows who owns the motion. The behavior tree does not. It sends a kick request and doesn't know that the bridge must first hand back to the firmware, or that RL will not resume afterwards. A clean interface that tells the behavior tree "firmware, RL, kick, get-up, fault" is the next piece, and it is still design work.

## What I took away

- **Ownership is the real interface.** Running the policy was a small part. Deciding and proving who owns the joints was most of the work.
- **One writer, always checked.** Never assume you are the only publisher. Check, and treat a second one as a fault.
- **Confirm, don't assume.** A mode request is not a mode change until the robot says so.
- **Put a proxy in front instead of forking.** Topic remapping let us change routing without touching the soccer code.
- **Damping is safe for motors, not for people or robots standing up.** Plan the physical side of a fault, not only the software side.
