---
layout: post
cover: false
title: Parcelable vs Serializable
date:   2019-09-18 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

在实际的Android开发中Serializable和Parcelable我们都会用到，只是需要区分使用场景。刚开始遇到这两个接口的时候比较疑惑，貌似都是用来做序列化的，虽然能分得清什么时候用哪个，但是对这两个接口并没有清晰的认识，要是冷不丁的问我这俩有什么区别，可能还无法清晰的界定和阐述。因此有必要用一篇文章来彻底捋清这些东西。

### 相同点

相同点其实很明显，主要有如下两点:

* 都可以序列化反序列化

* 都可以通过Intent传递

### 区别

* Serializable是Java API，Parcelable是Android SDK API，设计目的不同。Serializable是一个通用的序列化机制，通过将文件保存到本地文件、网络流等实现便数据的传递，这种数据传递不仅可以在单个程序中进行，也可以在两个不同的程序中进行；Parcelable是Android SDK API,为了在同个程序的不同组件之间和不同程序（AIDL）之间高效的传输数据，是通过IBinder通信的消息的载体。从设计目的上可以看出Parcelable就是为了Android高效传输数据而生的。


* Serializable序列化过程使用反射机制，速度慢，且产生很多临时对象，容易触发GC；Parcelable是直接在内存中读写的，自已实现封送和解封（marshalled &unmarshalled）操作，将一个完整的对象分解成Intent所支持的数据类型，不需要使用反射，所以Parcelable具有效率高，内存开销小的优点。

* Serializable是通用的序列化机制，将数据存储在磁盘，可以做到有限持久化保存，文件的生命周期不受程序影响，Parcelable的序列化操作完全由底层实现，不同版本的Android是实现方式可能不相同，所以不能进行持久化存储。

* 使用场景不同。Parcelable 是 Android 中的序列化方式，因此更适合于 Android 平台上，它的缺点是使用起来稍微麻烦点，但它的效率很高，这是 Android 推荐的序列化方式，因此我们要首选 Parcelable。但 Serializable 也不是在 Android 上无用武之地，下面两种情况就发日常适合 Serializable：
   1. 需要将对象序列化到设备；
   2. 对象序列化后需要网络传输。

这样一一列举了两者的相同点和区别，对两者的认识清晰了很多！积跬步，共勉！



