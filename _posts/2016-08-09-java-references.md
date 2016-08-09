---
layout: post
cover: false
title: Java References
date:  2016-08-09 16:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
---

Before JDK 1.2, if a object isn't referenced by any variable, it can't be used any more.Since JDK 1.2, Java has four reference types.In order from strongest to weakest these references are: Strong, Soft, Weak, Phantom. 

#### Strong reference

Below code is regular object reference:

```java
Sample sample = new Sample();
```

The variable `sample` holds a strong reference to a Sample object. Before you stop reading there is a point to this: objects that are reachable through any chain of strong references are not eligible for garbage collection. Even JVM throw `OutOfMemoryError` to terminate the program, it will not to reclaim the memory that strong reference hold.

#### Soft reference

Soft references are cleared at the discretion of the garbage collector in response to memory demand. The virtual machine guarantees that all soft references to softly-reachable objects will have been cleared before it would ever throw an `OutOfMemoryError`.

#### Weak reference

This code snippets is regular weak reference:

```java
WeakReference<Cacheable> weakData = new WeakReference<Cacheable>(data);
```
To access data call weakData.get(). This call to get may return `null` if the weak reference was garbage collected: you must check the returned value to avoid `NullPointerException`s.

An object that is identified as only weakly reachable will be collected at the next GC cycle.

If you pass a `ReferenceQueue` into the constructor for a weak reference then the garbage collector will append that weak reference to the `ReferenceQueue` when it is no longer needed. You can periodically process this queue and deal with dead references.

The difference between `SoftReference` and `WeakReference` is:

* A soft reference is exactly like a weak reference, except that it is less eager to throw away the object to which it refers. 

* An object which is only weakly reachable (the strongest references to it are WeakReferences) will be discarded at the next garbage collection cycle, but an object which is softly reachable will generally stick around for a while.

* `SoftReferences` aren't required to behave any differently than `WeakReferences`, but in practice softly reachable objects are generally retained as long as memory is in plentiful supply. This makes them an excellent foundation for a cache, such as the image cache described above, since you can let the garbage collector worry about both how reachable the objects are (a strongly reachable object will never be removed from the cache) and how badly it needs the memory they are consuming.

* Garbage collector uses algorithms to decide whether or not to reclaim a softly reachable object, but always reclaims a weakly reachable object.

#### Phantom reference

Phantom references are the most tenuous of all reference types: calling get will always return null.
When you construct a phantom reference you must always pass in a `ReferenceQueue`. 

```java
ReferenceQueue queue = new ReferenceQueue ();
PhantomReference pr = new PhantomReference (object, queue);
```

This indicates that you can use a phantom reference to see when your object is GC’d. The phantom reference is enqueued after it has been physically removed from memory — as opposed to weak references which are enqueued before they’re finalized or GC’d.
