---
layout: post
cover: false
title: "Week One for Interns: Git, ROS 2 and a Real Humanoid"
date:   2026-06-21 20:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

This summer our lab had a group of interns joining the RoboCup humanoid soccer work. The robot is a Booster T1. The software is ROS 2 on Ubuntu.

I prepared the material for the first week. This post is how I planned it and why it is in that order.

## The goal of week one

Not "learn robotics". That takes years.

The goal was smaller: **by the end of the week, every intern can change code in a shared robot repository without breaking anything for anybody else.** If they can do that, everything after week one is learning. If they can't, everything after week one is cleaning up.

So the order was:

1. Git, for real teamwork.
2. ROS 2 installation and core concepts.
3. A tour of the actual RoboCup project.
4. A small hands-on ROS 2 project, done with Git.

The robot itself comes last on purpose.

## Git first, not ROS first

It is tempting to start with the exciting part. A humanoid robot is right there in the room.

But on a robot team, the most common way a new person causes damage is not a bad algorithm. It is `git add .` with build artifacts, a log file and a debug change mixed in. Or a commit directly on `main` the day before a test.

So the Git session was not a list of commands. It was organised around one mental model and a list of real mistakes.

The mental model is four places: the working directory (what you are editing), the staging area (what goes into the next commit), the local repository (saved history), and the remote (the shared copy on GitHub). Almost every Git confusion is "which of the four places is my change in right now?"

The habit I pushed hardest is `git status`. Before add, before commit, before pull, before push. It costs nothing and it answers the question above.

Then the common mistakes, one per topic:

- Committing with messages like `update`, `fix`, `final`.
- Huge commits that mix unrelated changes.
- Working directly on `main`.
- Switching branches with uncommitted work and getting lost.
- Pulling with many uncommitted local changes.
- Force pushing a shared branch without asking.
- `git reset --hard` without knowing what it throws away.
- Keeping important work only in a stash for days.

I find mistakes teach better than rules. "Never commit build artifacts" is easy to agree with and easy to forget. A concrete picture of what goes wrong is harder to forget.

## A Git practice repository

Slides are not enough for Git. You need to feel a merge conflict once in a safe place.

So I made a small practice repository. It has a README, a file for intern information, a robot startup checklist, a safety rules file, a small Python script and a `.gitignore`. Each task asks the intern to change one of them, on their own branch, and open a pull request.

The content of the files is not random. The startup checklist asks things like "verify battery level, check network connection, confirm emergency stop status". The safety rules file asks for at least three rules in professional language. So while practising Git, they are also writing the first version of habits they will need next to a real robot.

Interns could work alone or in small groups. Either way, the rule was the same: never on `main`, always a named branch, always a pull request.

## ROS 2: four ideas and a few commands

For ROS 2 we used Ubuntu 22.04 and ROS 2 Humble, the same as the robot project. I wrote an installation guide for that exact setup, including the errors students usually hit, like a missing `rosidl_default_generators` package.

The concepts session was kept to four communication ideas:

- **Topics** for continuous data, like camera images and robot state.
- **Services** for quick request and response.
- **Actions** for long goals with feedback and cancel, like navigation.
- **Parameters** for runtime configuration, instead of constants in code.

Each idea came with the command to see it on a running system: `ros2 topic list`, `ros2 topic echo`, `ros2 service list`, `ros2 param get`. I wanted them to look at a live ROS graph before they write a node.

Then workspaces and packages: `src`, `build`, `install`, `log`, and the one rule that saves the most time in the first week: **source the workspace after you build.**

## A tour of the real project

After the basics, we walked through the RoboCup software as it actually is. The stack has layers:

```
RoboCup application
ROS 2 middleware
Booster SDK
Robot OS / drivers
Robot hardware
```

The key point for new people: application code uses the supported ROS 2 interfaces and SDK APIs. It does not talk to the hardware directly.

The application itself is a few nodes. Vision detects the ball and the field. A game controller node receives the referee's game state. A whistle detector listens to the referee. A central "brain" node combines all of this, runs the behavior, and sends motion requests down to the SDK.

I also told them where bugs usually live on a robot. Most of them are not in the algorithm. They are sensor, timing, network, configuration or state machine problems. On a distributed robot, the DDS network configuration is part of the runtime, not something you set once and forget.

## The hands-on project

The last part tied everything together. Each intern cloned a starter repository, created a branch with their name, and built a ROS 2 Python package with two nodes: a `talker` that publishes a string on a topic, and a `listener` that subscribes and prints it.

Then they had to inspect their own system with the CLI tools, commit, push, and open a pull request.

It is the most basic ROS 2 example there is. That is the point. It touches every step of the real workflow once: workspace, package, build, source, run, inspect, commit, push, review. When they later work on the vision or behavior code, the steps are the same. Only the code inside is harder.

## What I took away

- **Teach the workflow before the robot.** The robot is the reward. The workflow is what keeps the robot running for everybody.
- **Teach mistakes, not commands.** Every Git command in the slides came with the way people misuse it.
- **Make practice files useful.** A startup checklist and safety rules are better practice content than "hello world" text.
- **Keep the first ROS project tiny.** A talker and a listener are enough to walk through the whole pipeline once.
- **Show where real bugs live.** New people expect bugs in algorithms. On a robot, they are mostly in timing, networking and configuration.
