---
layout: post
cover: false
title: Understanding Java Garbage Collection
date:   2016-08-04 16:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

**stop-the-world** Stop-the-world means that the JVM is stopping the application from running to execute a GC. When stop-the-world occurs, every thread except for the threads needed for the GC will stop their tasks. The interrupted tasks will resume only after the GC task has completed. GC tuning often means reducing this stop-the-world time.

#### Generational Garbage Collection

Java does not explicitly specify a memory and remove it in the program code.Maybe there is to way to remove the memory explicitly :

* Sets the relevant object to null

* Use System.gc() method to remove the memory - will affect the system performance drastically

But nobody do that. GC responsible to finds the unnecessary objects to remove them. GC created based on the following two preconditions:

* Most objects soon become unreachable.

* References from old objects to young objects only exist in small numbers.

##### Young generation 

Most of the newly created objects are located here. Since most objects soon become unreachable, many objects are created in the young generation, then disappear. When objects disappear from this area, we say a "minor GC" has occurred.

##### Old generation

The objects that did not become unreachable and survived from the young generation are copied here. It is generally larger than the young generation. As it is bigger in size, the GC occurs less frequently than in the young generation. When objects disappear from the old generation, we say a "major GC" (or a "full GC") has occurred.

##### Permanent generation 

It stores classes or interned character strings. So, this area is definitely not for objects that survived from the old generation to stay permanently. A GC may occur in this area. The GC that took place here is still counted as a major GC.

#### Composition of the Young Generation
The young generation is divided into 3 spaces. 

* One Eden space

* Two Survivor spaces

There are 3 spaces in total, two of which are Survivor spaces. The order of execution process of each space is as below:

* The majority of newly created objects are located in the Eden space.

* After one GC in the Eden space, the surviving objects are moved to one of the Survivor spaces. 

* After a GC in the Eden space, the objects are piled up into the Survivor space, where other surviving objects already exist.

* Once a Survivor space is full, surviving objects are moved to the other Survivor space. Then, the Survivor space that is full will be changed to a state where there is no data at all.

* The objects that survived these steps that have been repeated a number of times are moved to the old generation.

##### GC for the Old Generation

The old generation basically performs a GC when the data is full. The execution procedure varies by the GC type, so it would be easier to understand if you know different types of GC.
According to JDK 7, there are 5 GC types.

* Serial GC

* Parallel GC

* Parallel Old GC (Parallel Compacting GC)

* Concurrent Mark & Sweep GC (or "CMS")

* Garbage First (G1) GC

This article will not introduce 5 GCs, if you interested in, please google it.
