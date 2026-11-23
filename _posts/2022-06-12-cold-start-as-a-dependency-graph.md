---
layout: post
cover: false
title: "Cold Start as a Dependency Graph: 350 ms to 190 ms"
date:   2022-06-12 21:30:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

Every time we cold-started our messaging app, the home screen "jumped". The conversation list showed up empty for a moment, then filled in. It was small, but you saw it every single time you opened the app. And a messaging app is opened many times a day.

This post is how we fixed it, and why the fix ended up being a dependency graph.

## What was wrong

Two things.

First, `Application.onCreate()` took about **350 ms**. Many of the tasks in it blocked the UI thread: Firebase, MMKV and a long list of others.

Second, the jump itself. The home screen was shown before the chat database was ready. The list rendered empty, then the data arrived and the list rendered again.

So the goal was also two things:

1. The chat database must be fully initialized **before** we enter the home screen. Even better, preload the conversation list into a memory cache, so the home screen reads it straight from memory.
2. Split the initialization work into tasks, find the real dependencies between them, and run the independent ones in parallel.

## Why it was not easy

- `onCreate()` was messy. Over the years everybody had added "just one line" to it. Some of those lines did not need to run at startup at all: emoji setup, WebView config, a PNG fix, report initialization.
- We used a component architecture ([I wrote about it here](/super-app-architecture-v1-to-v2.html)). Each module had its own init steps, and **all of them** needed the login entry first. So there was a hidden dependency that everything waited on.
- Some tasks inside one module could run in parallel but were written to run one after another. For example, the chat module had several key-value stores (extras, images, stickers) that were opened in sequence.

## Choosing a tool

We compared three options.

**Jetpack App Startup.** The official one. It runs initializers through a `ContentProvider` before `Application.onCreate()`, and it sorts them by declared dependencies. It is great for SDK authors who want the application `Context` injected for free. But all initializers run on the main thread. For us, the whole point was to move work off the main thread, so this did not fit.

**AndroidStartup** (a third-party library built on App Startup). It adds async tasks and uses annotations for dependencies. Nice design, but it was brand new and almost nobody used it. Startup is the last place I want to be an early adopter.

**AppStartFaster** (another third-party library). It also supports async tasks, uses `CountDownLatch` to wait for dependencies, and had about 1.4K stars. It does not use App Startup. It just runs in `Application.onCreate()`, the traditional way.

We picked **AppStartFaster**. It was stable, and the mechanism was simple enough that we could read all of it and fully control it. If something goes wrong at startup, I want to understand every line in the stack trace.

## The graph

We split the old `onCreate()` into tasks and wrote the dependencies down. The chain looked like this:

```
CommonLibInit -> ARouterInit -> MMKVInit -> NetworkInit
  -> WallpaperInit -> OtherUIInit -> E2EESdkInit -> AccountInit
  -> CommonUserDataInit
  -> ChatExtraStorageInit / ChatImageStorageInit
     / ChatMessageStorageInit / ChatStickerStorageInit
  -> VoipInit -> UserSetting
```

Written as a list it looks linear, but it is not. Each task only declares what it truly needs. The library runs everything whose dependencies are done, in parallel, on a thread pool. The four chat stores, for example, only need the account to be ready. They do not need each other.

Here is the shape of one task:

```java
public class ChatMessageStorageInitTask extends AppStartTask {

    @Override
    public void run() {
        // open the message DB and warm the conversation cache
    }

    @Override
    public List<Class<? extends AppStartTask>> getDependsTaskList() {
        return Arrays.asList(AccountInitTask.class);
    }

    @Override
    public boolean isRunOnMainThread() {
        return false;
    }
}
```

The main thread waits only for the tasks that the home screen really needs. Everything else continues in the background.

## A small trick for "later"

Some tasks are not important at startup at all, but they still have to run at some point. We added an empty task, `EmptyWaitingInitTask`, that does nothing except depend on the chat database being ready. Then all the "not important" tasks depend on `EmptyWaitingInitTask`.

The effect: low-priority work starts only after the critical path is done. You don't need a separate "delayed init" system. It is one more node in the same graph.

## Results

Measured on a Huawei Mate 30:

| | Before | After |
|---|---|---|
| Cold start init, logged in | 350 ms | **190 ms** |
| Cold start init, logged out | 250 ms | **160 ms** |
| Home screen jump | every time | **gone** |

The jump was the part users could feel. The conversation list is now there when the home screen appears.

The code also got better. Before, `onCreate()` was a long list of lines, and nobody knew which ones could move. Now every task has a name and its dependencies are written down. When someone adds a new SDK, the question is no longer "where do I put this line?" but "what does this task depend on?" That question has an answer.

## What I took away

- **Startup is a graph problem.** Once you write the dependencies down, half of the optimization is obvious.
- **Find the hidden dependency.** For us it was login. Everything waited on it, and nobody had written that down.
- **Prefer boring tools at startup.** The most elegant library was not the one we picked. We picked the one we could read in an afternoon.
- **Fix what users can see.** 160 ms saved is nice. The list not jumping is what people actually notice.
