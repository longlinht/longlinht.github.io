---
layout: post
cover: false
title: What a Native Crash Reporter Does While the Process Is Dying
date:   2021-05-16 20:30:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In 2021 I worked on an overseas short-video and live-streaming app. Native crashes climbed into our top crash list, and the free crash tool we used gave us almost nothing for them: no native stack, no context. So I integrated xCrash, an open-source crash catcher, and added our own upload on top. I wrote [a short summary of that in Chinese](/summary-of-using-xcrash.html).

That post is about using the library. This one is about what I learned reading how it works. A crash reporter has a strange job. It must do careful work at the worst possible moment, inside a process that is already broken. Almost every design choice in it comes from that.

## What happens when native code crashes

When native code reads a bad address, divides by zero or calls `abort()`, the kernel sends a signal to the thread that did it: `SIGSEGV`, `SIGBUS`, `SIGFPE`, `SIGILL`, `SIGABRT`, `SIGTRAP` and a few others. By default the process dies. On Android, the system's crash daemon writes a tombstone to `/data/tombstones` and prints the crash to logcat. But your app cannot read that tombstone on a normal device.

So a crash reporter installs its own handler with `sigaction()` for those signals. When the crash happens, the kernel stops the faulting thread at whatever instruction it was on and jumps into the handler, on the same thread.

That last part is the whole problem. The handler runs on top of a thread that was interrupted at an unknown point, in a process whose memory may already be corrupt.

## Rule 1: no heap, almost no libc

Think about what the crashed thread might have been doing. Maybe it was inside `malloc()`. Many native crashes actually happen inside `malloc()` or `free()`, because some other code corrupted the heap earlier. In that case the allocator may be holding its lock, or its data structures are broken.

Now the handler calls `malloc()`. It either waits forever for a lock that will never be released, or it walks the same broken heap and crashes again.

This is why POSIX defines a short list of **async-signal-safe** functions. Only those can be called safely from a signal handler. The list includes `open`, `read`, `write`, `close`, `waitpid`, `execve`, `_exit` and `sigaction`. It does not include `malloc`, `printf`, `fopen`, or anything that might take a lock or touch the heap. C++ `new`, `std::string` and calling into Java through JNI are all off the table too.

So a good crash handler:

- uses only memory it reserved before the crash (static buffers, stack buffers, or pages it mapped at init time);
- writes with `write()` on a file descriptor, never with `stdio`;
- does as little as possible itself.

Breakpad, Google's crash reporter, is a good example. On Linux it does not use `malloc()` on the crash path. It has its own small page allocator built directly on `mmap()`, and it calls system calls directly instead of going through libc.

## Rule 2: have your own stack

Not all crashes are bad pointers. A common one is stack overflow: deep recursion, or a huge array on the stack. The thread grows its stack until it touches the guard page below it, and the kernel sends `SIGSEGV`.

To run a handler, the kernel must push a signal frame onto the stack. But the stack is exactly what just ran out. There is no room. The handler cannot run, and the process dies with no report.

The fix is `sigaltstack()`. You give the kernel a separate block of memory to use as the stack for signal handlers, and you install the handler with the `SA_ONSTACK` flag:

```c
// generic sketch
static char alt_stack[64 * 1024];   // reserved up front, not malloc'd at crash time

stack_t ss = {0};
ss.ss_sp = alt_stack;
ss.ss_size = sizeof(alt_stack);
sigaltstack(&ss, NULL);

struct sigaction act = {0};
act.sa_sigaction = crash_handler;
act.sa_flags = SA_SIGINFO | SA_ONSTACK;
sigemptyset(&act.sa_mask);
sigaction(SIGSEGV, &act, &old_act);
```

`SA_SIGINFO` is also important. It makes the kernel pass a `siginfo_t` (the fault address, the signal code) and a `ucontext` (the registers at the moment of the crash). That is the raw material for the report.

One detail that is easy to miss: the alternate stack belongs to a **thread**, not to the process. Calling `sigaltstack()` once at init covers only the thread that called it. On Android this is less of a worry, because bionic, Android's libc, already gives each thread it creates its own alternate signal stack. xCrash also registers one when it installs its handlers.

## Rule 3: reserve a file descriptor before you need it

Every process has a limit on open file descriptors. A leak of sockets or files, which is a real bug on Android, can push the process to that limit. And sometimes that is exactly the bug that leads to the crash.

If the fd table is full when the crash comes, `open()` for the crash log fails with `EMFILE`. You did everything right with memory and stack, and you still have nowhere to write.

xCrash solves this in a simple way. At init it opens `/dev/null` and keeps that descriptor. It does nothing with it. It only holds a slot. At crash time, if opening the real log file fails, the handler closes the placeholder and tries again. `open()` always returns the lowest free descriptor number, so the slot that was just released is there for the log file.

It is a small trick, but it shows the mindset: anything the crash path needs, take it while the process is still healthy.

## Rule 4: do the heavy work in another process

Even with these rules, a full report needs a lot of work: stop all threads, read their registers and memory, unwind every stack, read `/proc/self/maps`, the open fds, logcat lines. Doing all of that inside a signal handler, in a broken process, is asking for trouble.

So xCrash does very little in the handler itself. Its main job is to start a child process:

1. The handler creates a child with `clone()`.
2. The child runs `execl()` on a separate dumper program that ships inside the APK. It is named like a library (`libxcrash_dumper.so`) so it gets installed with the other native libs, but it is a normal executable with a `main()`.
3. The parent passes the crash details (pid, crashed tid, `siginfo`, `ucontext`) to the dumper through a pipe on its stdin.
4. The parent waits with `waitpid()`.

The dumper is a fresh process. It has a clean heap and its own working libc, so it can use `malloc()` freely. It uses `ptrace` to attach to the crashed process, suspends its threads, reads registers and memory, unwinds the stacks, and writes the tombstone. It also calls `alarm(30)` at the start, so if something hangs, the dumper is killed instead of staying around.

There is a second reason for a separate process. A process cannot `ptrace` its own threads. To inspect itself from the outside, it needs an outside. Breakpad on Linux uses the same idea: it clones a child, and the child ptraces the crashed process to write the minidump.

When the dumper is done, xCrash still has to tell the Java side. The handler cannot call into Java. Instead it writes to an `eventfd`, which is just a `write()`, so it is safe. A native thread that was started at init time is blocked on that `eventfd`. It wakes up and calls the Java callback from its normal thread context.

Finally, because we set `setNativeRethrow(true)`, the original signal is passed on to the previous handler. The system crash daemon still gets its turn, so you don't lose the system tombstone or the normal crash behaviour.

## Looking back at my own integration

Reading all this made me look at our upload code with different eyes. The C part of xCrash is built with great care for a dying process. Our part was a Java callback that found the newest tombstone, gzipped it, uploaded it with the app's global OkHttp client, and then slept five seconds to give the upload time to finish.

All of that runs while the process is on its way out. In the Chinese post I listed the problems we saw: we suspected new OOM and ANR issues, a crash before the OkHttp client was ready meant no upload, and devices below Android 7 almost never reported. I can't say the callback caused all of these. But it is the opposite of everything the native side does: it allocates, it takes locks, it depends on app state that may already be gone.

The alternative is to write the tombstone at crash time and upload it on the next launch, when the process is healthy. You lose a little freshness, but the crash path becomes much smaller.

## What I took away

- **The crash handler runs at the worst moment.** Assume the heap is corrupt, a lock is held and the stack is full.
- **Only async-signal-safe calls in the handler.** No `malloc`, no `printf`, no JNI.
- **Reserve everything in advance.** An alternate stack, memory, even a file descriptor.
- **Move heavy work out of the dying process.** A child process with `ptrace` can look at the crash from outside, with a clean heap.
- **Your own code in the callback is part of the crash path too.** The library can be perfect and your upload code can still be the weak part.
