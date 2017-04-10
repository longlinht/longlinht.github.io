---
layout: post
cover: false
title:  Dimension Units in Android
date:   2017-04-07 12:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
---

When I start develop application for Android, I am confused about the dimension units many times. So I decide to figure out it clearly through this article.

Android is a mobile operating system that compatible many devices, because of its compatibility, we must think about vary size, density, shape of device's screen. The **density independence** is a important conception here. Later, I will explain detail about it. Now, we need give the defination of the dimension units and explain the relation of them.

### Dimension Unit

#### Defination

* **px** - An actual pixel on the screen.

* **in** - A physical inch on the screen.

* **mm** - A physical millimeter on the screen.

* **pt** - A point, a common font size unit, on the screen. 

* **dp** - An abstract unit that is based on the physical density of the screen. These units are relative to a 160 dpi (dots per inch) screen, on which 1dp is roughly equal to 1px. 

* **sp** - A scale independent pixel, specially designated for text sizes. 

#### Relation

```
+----------------+----------------+---------------+-------------------------------+
| Density Bucket | Screen Density | Physical Size | Pixel Size                    | 
+----------------+----------------+---------------+-------------------------------+
| ldpi           | 120 dpi        | 0.5 x 0.5 in  | 0.5 in * 120 dpi = 60x60 px   | 
+----------------+----------------+---------------+-------------------------------+
| mdpi           | 160 dpi        | 0.5 x 0.5 in  | 0.5 in * 160 dpi = 80x80 px   | 
+----------------+----------------+---------------+-------------------------------+
| hdpi           | 240 dpi        | 0.5 x 0.5 in  | 0.5 in * 240 dpi = 120x120 px | 
+----------------+----------------+---------------+-------------------------------+
| xhdpi          | 320 dpi        | 0.5 x 0.5 in  | 0.5 in * 320 dpi = 160x160 px | 
+----------------+----------------+---------------+-------------------------------+
| xxhdpi         | 480 dpi        | 0.5 x 0.5 in  | 0.5 in * 480 dpi = 240x240 px | 
+----------------+----------------+---------------+-------------------------------+
| xxxhdpi        | 640 dpi        | 0.5 x 0.5 in  | 0.5 in * 640 dpi = 320x320 px | 
+----------------+----------------+---------------+-------------------------------+

+---------+-------------+---------------+-------------+--------------------+
| Unit    | Description | Units Per     | Density     | Same Physical Size | 
|         |             | Physical Inch | Independent | On Every Screen    | 
+---------+-------------+---------------+-------------+--------------------+
| px      | Pixels      | Varies        | No          | No                 | 
+---------+-------------+---------------+-------------+--------------------+
| in      | Inches      | 1             | Yes         | Yes                | 
+---------+-------------+---------------+-------------+--------------------+
| mm      | Millimeters | 25.4          | Yes         | Yes                | 
+---------+-------------+---------------+-------------+--------------------+
| pt      | Points      | 72            | Yes         | Yes                | 
+---------+-------------+---------------+-------------+--------------------+
| dp      | Density     | ~160          | Yes         | No                 | 
|         | Independent |               |             |                    | 
|         | Pixels      |               |             |                    | 
+---------+-------------+---------------+-------------+--------------------+
| sp      | Scale       | ~160          | Yes         | No                 | 
|         | Independent |               |             |                    | 
|         | Pixels      |               |             |                    | 
+---------+-------------+---------------+-------------+--------------------+
```

### Density Independence

**Screen Density**

Screen density is a ratio of resolution and display size, which can be quantified as dots per inch, or **dpi**. The higher the dpi, the smaller each individual pixel is, and the greater clarity.

**Density Independence** means the physical size of a dimension unit is only approximately the same on every screen density. The **dp, sp, pt, mm, in** are all density independence. The number of pixels these translate to varies depending on screen density and the **density bucket** the device falls into.

**Density Bucket**

> There is a myriad of Android devices with varying screen densities, which can range from 100 dpi to over 480 dpi. In order to optimize images for all these screen densities, images need to be created at different resolutions. However, trying to optimize every image resource for every possible density would be incredibly tedious, cause app sizes to be enormous, and simply is not a feasible solution. As a compromise, Android uses density "buckets" that are used to group devices together within certain screen density ranges. This way, apps are only required to optimize images for each density bucket, instead of every possible density. This keeps the workload reasonable for designers and developer, and also prevents the application size from ballooning. Of course, there is a tradeoff, leading to variance in the physical rendered size of images depending on device density.

### Using Tips:

* Try to use dp in xml file as much as possiable.

* Use sp for font size.

* Don't use px as much as possiable.
