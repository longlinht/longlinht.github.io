---
layout: post
cover: false
title: 最简LeakCanary原理解析
date:   2019-11-10 20:54:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

LeakCanary现在几乎成了Android开发过程中的一个标配，使用起来非常简单，能够帮助开发者发现和规避大部分的内存泄露问题。虽然大部分的开发者都或多或少，或深或浅的接触过LeakCanary，说起来是比较熟悉的一个第三方框架了，但是谈到LeakCanary的原理可能就会陌生很多。虽然网上也有非常多的讲解LeakCanary的文章，但是很多博文要么陷入无止境的代码细节中，要么就泛泛而谈，都不能很清楚的将LeakCanary的原理讲清楚。这篇文章尽力规避前两种文章的问题，用最小的篇幅把LeakCanary的原理讲清楚。

#### LeakCanary到底是怎么工作的?

LeakCanary能够准确，及时地检测到内存泄露，有以下几个关键点

* 检测保留的实例

LeakCanary能够工作的基石是一个叫做ObjectWatcher的库，它hook了Android中Activity和Fragment的生命周期，能够自动检测到Activity和Fragment的销毁和将要被GC，这些被检测到的Activity和Fragment的实例被传给了`ObjectWatcher`，`ObjectWatcher`以WeakReference持有他们。如果这些WeakReference在5秒后或者一次GC周期以后还没有被清理，那么LeakCanary认为这些实例被保留了，没有被回收，泄露发生了。检测没有被回收的实例是LeakCanary能够工作起来的基石，也是后续处理的基础，这一点非常重要。

* Dump 堆

这一步需要对检测到的泄露进行处理，当然也不是检测到一个实例就会触发dump，而是有一个阈值，当达到一定数量实例的泄露后就会触发LeakCanary将Java堆内存dump到`.hprof`文件中去，当然了，这个文件存储在Android文件系统中。这个触发dump的阈值是如何确定的呢？如果App还可见，那这个阈值默认是5，如果App不可见，阈值默认是1。

* 分析Java 堆

LeakCanary使用`Shark`来分析`.hprof`文件，找出阻止实例被回收的引用链:leak trace.其实leak trace的另一个名字是GC Root到被引用实例的最短强引用路径。一旦leak trace确定了，LeakCanary会根据内置的对Android的知识库来推断出leak trace上哪个实例泄露了。

* Leak分组

LeakCanary使用泄露的状态信息，将引用链缩小为可能引起泄露的子引用链，并且在界面上显示出来，也就是我们在LeakCanary界面上看到的信息。有的泄露可能不相关，但是引用链相同，也会被认为是同一个引用链，所以泄露会根据相同的子引用链分组。

以上就是LeakCanary基本原理的关键点，相信也是最简单的对LeakCanary原理的描述了吧!
