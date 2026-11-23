---
layout: post
cover: false
title: "A Tour of AVLite, a Simplified AV Stack"
date:   2026-05-10 20:30:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

A full autonomous driving stack is too big to read in one go. Autoware has hundreds of packages. You open it, you read the launch files for a day, and you still don't know where one loop iteration starts and ends.

AVLite is the opposite. It is a simplified AV stack in Python: perception, localization, planning, control, a simulator bridge and a GUI, small enough to hold in your head. I spent some time reading it with one goal: follow one control step from start to end, and write down the map.

This post is that map.

## The layout

The top-level modules are numbered, which I liked immediately:

```
c10_perception     perception, localization, HD map interfaces
c20_planning       global and local planning
c30_control        controller interface and implementations
c40_execution      runtime wiring, execution loop, world bridges
c50_visualization  GUI
c60_common         settings, reload helpers, capability enums
extensions/        plugin-style extensions
```

The numbers tell you the order data flows through the system. It is a small thing, but when you open the folder you already see the architecture. I wish more codebases did this.

The entry point starts a Tkinter GUI. So AVLite is GUI-first. You run it and you watch the car, which is exactly what you want when you are learning or trying a new planner.

## The most important file

If you want to understand how the system boots, don't start from `main`. Start from the factory in `c40_execution`.

The factory is where everything is assembled. It:

- loads extensions,
- picks the strategies named in the config from registries,
- loads the global plan,
- creates one shared `PerceptionModel`,
- wires planner, controller, world bridge, localization and perception together,
- returns the selected executor.

After reading this one file, the rest of the code made sense. Before reading it, every module looked like it floated on its own.

## How modules are plugged in

AVLite uses subclass auto-registration. You write a subclass of, say, a controller base class, you import it, and it becomes selectable by name in the config.

That is very good for research. Want to compare two lateral controllers? Write the second one, change one string in the config, run again. No wiring code to touch.

The cost is the usual cost of string-based wiring. A typo in the config is only found at runtime. And as the number of plugins grows, "which class is actually running?" becomes a real question. I learned to always check the effective class at startup, not just the default in the config file.

## The key abstractions

There are only a handful, and each has one job:

- **GlobalPlan.** Loaded from a JSON track file: reference XY path, reference speed profile, left and right boundaries. The static backbone of the drive.
- **PerceptionModel.** The shared environment memory: ego vehicle, other vehicles, optional HD map, predictions, occupancy grids. Several modules read from it and write into it.
- **WorldBridge.** The interface to the outside world. A simple built-in simulator, or bridges to CARLA or Gazebo. It gives the current ego state, sensor data and ground truth, and it accepts control commands.
- **LocalPlanner.** Generates and selects a short-term maneuver.
- **Controller.** Takes the ego state and a trajectory, returns a control command.
- **Executor.** The loop that calls all of the above in order.

## One step of the loop

This is the part I most wanted to understand. In the synchronous executor, one step goes like this:

1. **Read the ego state from the world.** `world.get_ego_state()` is the source of truth for this instant: x, y, heading, speed.
2. **Replan if it is time.** A `replan_dt` setting decides how often. The default local planner is a greedy lattice planner. It samples nodes in Frenet coordinates (distance along the track, and offset from it), builds candidate edges, rejects edges that collide or curve too much, and keeps the best chain as the selected local plan.
3. **Advance the planner with the current pose.** The planner updates where the car is on the global and local trajectory. This keeps planner and controller in agreement about "where are we on the plan".
4. **Run the controller.** The default is a Stanley controller. It computes cross-track error and heading error against the local trajectory, reads the target speed from it, and produces steering and speed commands.
5. **Send the command to the world.**
6. **Run localization and perception, if enabled.** They update the shared model for the next step.

Written as one line:

```
WorldBridge -> LocalPlanner (replan, step) -> Controller -> WorldBridge
                     ^                                         |
                     +---- PerceptionModel <-- perception -----+
```

The nice detail is that localization and perception are optional. In a simple simulator you can use ground truth and turn them off, and the rest of the loop does not change. When you want to test a localization algorithm, you turn it on and nothing else has to know.

## A debugging checklist that falls out of the map

Once the loop is clear, debugging becomes a question of *which transformation failed*:

- Was the world state read correctly?
- Is the perception model fresh, or stale from an earlier step?
- Did the planner generate reasonable candidates?
- Is the planner's idea of "where am I on the plan" aligned with the real pose?
- Is the controller tracking the trajectory it was given?
- Was the command actually applied by the world bridge?

When the car does something strange, I go down this list in order. It is much faster than staring at the GUI.

## Rough edges

AVLite is research code and it shows in a few places:

- The factory does a lot. It is the best place to start reading, and also the file most likely to grow into a god object.
- Timing deserves attention. Sim time versus control time, and sync versus async execution, are where modular stacks usually start to break.
- Naming is a bit rough here and there (`Executer`, `ControlComand`). Not a real problem, but it tells you nobody has done a cleanup pass yet.

None of this stops it from being useful. For learning and quick experiments, a stack you can fully read beats a stack you can only configure.

## What I took away

- **Find the assembly point first.** In AVLite it is the factory. In an Android app it was `Application.onCreate()`. Same idea: read where things are wired before reading what they do.
- **One loop iteration is the real architecture.** Folder structure tells you the intent. The loop tells you the truth.
- **Small stacks teach big ones.** Every abstraction here, the world bridge, the shared model, the planner/controller split, exists in the large stacks too. They are just easier to see when there are six of them instead of six hundred.
- **Real modularity versus apparent modularity.** Registries make everything look pluggable. The question to ask is whether timing and capability assumptions still hold when you swap something in.
