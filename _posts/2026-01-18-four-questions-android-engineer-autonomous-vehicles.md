---
layout: post
cover: false
title: "Four Questions an Android Engineer Asked When Switching to Autonomous Vehicles"
date:   2026-01-18 21:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

I wrote C++ for a few years, then Android for about seven, then more mobile work in Dubai and Abu Dhabi. At the end of 2025 I moved to a research job at a university lab in Abu Dhabi. One of the projects is autonomous racing.

The first weeks felt strange. I could read the code. I could build it. But I did not really understand why the stack was split the way it was. Words like "path", "trajectory", "pose" and "frame" were used all the time, and everybody seemed to agree on what they meant except me.

So I did what I used to do with Android source: I wrote down the questions that kept blocking me, and I worked through them one by one until the answer was short enough to remember. There were four.

## 1. Does planning output a path or a trajectory?

I used both words as if they were the same. They are not.

- A **path** is geometry. A curve in space, `x(s), y(s)`, parameterized by distance along the curve. It answers: *where should I go?*
- A **trajectory** is a path with time. `x(t), y(t), heading(t), v(t), a(t)`. It answers: *where should I be at each moment, and how fast?*

The rule of thumb I now use: does the output include time, or velocity? If no, it is a path. If yes, it is a trajectory.

Why does it matter? Because a controller needs time. It computes an error between where the car is and where it should be *now*. With only a path, "now" is not defined. The controller does not know how fast to go or when to brake.

In a typical stack, the global planner gives a path (a route along the map, no timing). The local or motion planner turns that into a trajectory, with speed and acceleration limits and obstacles. The controller tracks the trajectory.

Small mobile robots often hide this. In ROS Nav2, for example, the global planner outputs a path and the local planner computes velocity commands on the fly. The path-to-trajectory step is still there. It is just inside one module.

At racing speed you cannot hide it. You cannot decide speed only at the last moment in the controller. Speed has to be planned together with the curve.

The Android comparison that helped me: a path is the shape of an animation, a trajectory is the shape plus the interpolator and the duration. Without the time part, nothing moves.

## 2. Where is the boundary between perception and localization?

Both use the same sensors: camera, LiDAR, IMU, GNSS. Sometimes even the same features. So where is the line?

The answer that finally worked for me is: **what is the subject of the estimate?**

- Perception estimates the state of the world: other cars, their positions and speeds, lanes, free space.
- Localization estimates the state of *me*: my position, heading and velocity in the map.

Or in transform language: if a module estimates `T_map_base`, it is localization. If it estimates `T_base_object`, it is perception.

Perception says "there is a car 12 meters ahead". Localization says "I am at this point in the map". Without localization, the perception output is floating. It is relative to a car whose position nobody knows.

Some things sit on the line. SLAM builds a map (perception of structure) and estimates the pose (localization) at the same time. Lane detection is perception, but matching those lanes to an HD map to correct your pose is localization. Same raw data, different question.

For me this was the same lesson as layering an app: don't split modules by *what data they read*, split them by *what they are responsible for producing*.

## 3. Why is the TF tree so important?

In Android, coordinates were mostly a UI problem. A view has its own coordinates, the parent has others, the screen has others. You convert, and if you get it wrong a button is drawn a few pixels off.

In a car the same mistake moves an obstacle by a meter.

Every module lives in some frame. A typical tree looks like this:

```
map
 └── odom
      └── base_link
           ├── lidar
           ├── camera_front
           └── imu
```

The LiDAR sees a car at `(8.2, 1.1)` in the LiDAR frame. The planner needs it in the map frame. So you chain the transforms: map to base (from localization), base to LiDAR (from calibration), LiDAR to object (from perception). If any link is wrong, objects shift, lanes don't line up, and the planner plans around things that are not there.

The part I underestimated was **time**. Transforms change every moment, so you need the transform *at the timestamp of the measurement*. A small delay is harmless when you are slow. At 1 m/s, a 100 ms error is 10 cm. At 30 m/s, the same 100 ms is 3 meters.

People say most "mysterious" bugs in robotics are TF bugs. After a few weeks I started to believe them.

## 4. What does a vehicle controller actually take as input?

I expected a long list. In the end it is three things:

1. **Where I should be.** The reference trajectory from the planner: positions, headings, speeds, sometimes acceleration, with timestamps.
2. **Where I am.** The state estimate: pose, velocity, yaw rate, steering angle.
3. **What I am allowed to do.** Vehicle parameters (wheelbase, max steering angle, max acceleration) and limits (steering rate, jerk, speed caps).

Plus some mode information, like whether we are in emergency braking.

What the controller does **not** take is just as useful to know: no camera images, no point clouds, no list of detected objects. All of that is already turned into a trajectory upstream. The controller lives in a much simpler world. It assumes the trajectory it gets is safe and feasible.

Controllers are also often split in two:

- **Lateral** (steering) needs curvature, heading error, cross-track error, and current speed. Speed matters because the same steering angle does very different things at 20 km/h and at 200 km/h.
- **Longitudinal** (throttle and brake) needs the reference speed and acceleration and the current speed.

This split is clean on paper. In racing it is not, because tires have a limited amount of grip, and braking and turning both use it. But that is a topic for another post.

## What I took away

- **Ask "what does it output?" before "how does it work?"** Every one of these four questions became easy once I looked at a module's output, not its algorithm.
- **Time is part of the data.** Paths without time and transforms without timestamps both look fine until the car moves fast.
- **Old habits still work.** Reading Android source taught me to draw the data flow first. It is the same here, only the data is in meters instead of pixels.
- **Write the questions down.** They felt too basic to ask out loud. Written down, they had short answers, and those answers became the map I still use.
