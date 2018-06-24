---
layout: post
cover: false
title: Android Thread Related Stuff
date:   2016-08-05 19:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

It's widely known that it's illegal to update UI components directly from threads other than main thread in android. This a rule in Android world, we can't violate it. But, so many situations we need 
update UI when we finish something in separated thread. This is a basic problem, it will refer more important concepts related thread.

#### `Looper`

* Class used to run a message loop for a thread.

* The `Looper` class maintains a synchronized `MessageQueue`, which contains a list messages.It reads and processes items from a `MessageQueue`.

* Threads by default do not have a message loop associated with them, to create one, call `prepare()` in the thread that is to run the loop, and then `loop()` to have it process messages until the loop is stopped.

* It's associated with the thread within which the `Looper` is created. This association is kept forever and can't be broken nor changed. Also note that a thread can't be associated with more than one Looper. 

* The `Looper` class is usually used in conjunction with a `HandlerThread` (a subclass of Thread).

* There are 2 methods to terminate a Looper:

    * Looper.quit()

    * Looper.quitSafely() 

* Most interaction with a message loop is through the `Handler` class.

#### `Handler`

* Allow you send and process `Message` and `Runnable` objects associated with a thread's `MessageQueue`. 

* Each `Handler` instance is associated with a single thread and that thread's message queue. Multiple Handler instances can be bound to the same thread.

* It is bound to the thread / message queue of the thread that is creating it.

* There are two main uses for a Handler: 

    * To schedule messages and runnables to be executed as some point in the future. 

    * To enqueue an action to be performed on a different thread than your own.
    
#### `Message`

* Defines a message containing a description and arbitrary data object that can be sent to a Handler. This object contains two extra int fields and an extra object field that allow you to not do allocations in many cases.

* While the constructor of Message is public, the best way to get one of these is to call `Message.obtain()` or one of the `Handler.obtainMessage()` methods, which will pull them from a pool of recycled objects.


#### `HandlerThread`

* `HandlerThread` is a handy class for starting a new thread that has a Looper.prepare(), Looper. 

* You generally need a thread attached with a Looper when you want sequential execution of tasks without race conditions and keep a thread alive even after a particular task is completed so that it can be reused so that you don’t have to create new thread instances.

Once a HandlerThread is started, it sets up queuing through a Looper and MessageQueue and waits for incoming messages to process:

```java

HandlerThread handlerThread = new HandlerThread("HandlerThread");
handlerThread.start();

// Create a handler attached to the HandlerThread's Looper
mHandler = new Handler(handlerThread.getLooper()) {
    @Override
    public void handleMessage(Message msg) {
        // Process messages here
    }
};
 
// Now send messages using mHandler.sendMessage()

```
