---
layout: post
cover: false
title: Flutter for Android Engineers
date:   2025-09-14 20:30:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

I wrote Android apps for about seven years. When I started learning Flutter this year, the hardest part was not Dart. Dart is easy if you know Java and Kotlin. The hard part was that every Flutter word looked like an Android word I already knew, and the match was almost right, but not quite.

So I made a table. Every time I met a new concept, I wrote down the Android thing it reminded me of, and then where the comparison breaks. This post is that table, cleaned up.

## The short version

| Flutter | Closest Android thing | Where it breaks |
|---|---|---|
| `Widget` | `View` / `ViewGroup` | A widget is cheap, immutable config. It is not the thing on screen. |
| `StatefulWidget` + `State` | A View plus the fields that drive it | The `State` object lives longer than the widget. |
| `setState()` | change a field + `invalidate()` | It schedules a rebuild for the next frame. It does not draw. |
| `BuildContext` | `Context` | It is a position in the tree, not an app-wide handle. |
| `Navigator.push` / `pop` | `startActivity` / `finish` | Routes are not Activities. One Activity hosts them all. |
| `InheritedWidget` / Provider | `ViewModel` + `LiveData` | Scoped to a subtree, not global. |
| `Future` / `async` / `await` | coroutines | No `Dispatchers.IO`. One thread per isolate. |
| `Stream` | `Flow` / `LiveData` | Close enough. |
| `AnimationController` / `Tween` | `ValueAnimator` / `TypeEvaluator` | Close enough. |
| Hot reload | Apply Changes | Much faster, and it keeps state. |

Now the details.

## Widget is not View

On Android a `View` is a real object that stays on screen. You hold a reference to it and change it: `textView.setText("Hello")`.

In Flutter you never do that. A `Text("Hello")` is just a description. It is immutable and very cheap. When the data changes, you build a new `Text("World")` and Flutter works out what to change on screen. You describe the UI as a function of state, and you stop thinking about references.

If you have used Jetpack Compose, this part is familiar. If you only wrote XML layouts and `findViewById`, this is the biggest mental change. It took me a few days before I stopped looking for "the reference to the text view".

`StatelessWidget` is for things that only depend on their constructor arguments. `StatefulWidget` is for things that have their own changing data.

## State, and why build lives there

A `StatefulWidget` comes with a separate `State` class, and `build()` is on the `State`, not on the widget. This looked strange to me at first.

The reason is lifetime. The widget is thrown away and rebuilt all the time. The `State` object stays, as long as the widget keeps its place in the tree. So the data that must survive, like a counter or a scroll position, lives in `State`, and `build()` reads from it.

```dart
class _CounterState extends State<Counter> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: () => setState(() => _count++),
      child: Text('$_count'),
    );
  }
}
```

`setState()` is like "change the field and call `invalidate()`", but there is a difference. It only marks this part of the tree as dirty. On the next frame Flutter calls `build()` again and compares the result with the old one. Nothing is drawn inside `setState()` itself.

One Android habit that transfers directly: after an async call, check that you are still alive before touching the UI. On Android I used to check `isAdded()` on a Fragment, or the lifecycle state. In Flutter it is `if (!mounted) return;` before calling `setState()`.

The lifecycle methods also map roughly:

- `initState()` is like `onCreate()`, but for this widget, not the whole screen.
- `dispose()` is like `onDestroy()`. Cancel controllers and subscriptions here.
- For the app going to background, there is `WidgetsBindingObserver` or `AppLifecycleListener`, which feel like `onPause()` and `onResume()`.

## BuildContext is not Context

This one confused me the most, because the name is so similar.

An Android `Context` is a handle to the app and the system. You use it to get resources, start Activities, get system services. Any `Context` from your app can do roughly the same things.

A `BuildContext` is the location of a widget in the tree. Under the hood it is the Element object (more on Elements in the next post). When you call `Theme.of(context)` or `Navigator.of(context)`, Flutter walks up the tree from that location and finds the nearest one.

So which `context` you use matters. A classic mistake: in the same `build()` method that creates a `Scaffold`, you call `Scaffold.of(context)`. It fails, because that `context` is above the `Scaffold`, not inside it. The fix is to use a `Builder`, or move the code into a child widget, so you get a context below it.

The other rule: don't keep a `BuildContext` after an `await` without checking `context.mounted`. The widget may be gone. This is the same kind of bug as holding an Activity `Context` too long on Android, just with a different symptom.

## Navigation

`Navigator.push()` and `pop()` work like a back stack. `pushReplacement()` is like `startActivity()` followed by `finish()`. Named routes feel like starting a screen with an Intent action or a deep link.

The difference: these routes are not Activities. A Flutter app usually runs inside one `FlutterActivity`, and all the screens are drawn by Flutter inside it. There is no system back stack per screen, no `launchMode`, and no process death per screen to think about. I found this simpler.

## Sharing state

My notes first said "`InheritedWidget` is like a singleton". That is not right. An `InheritedWidget` gives data to its **subtree**. Two different subtrees can have two different values. Widgets below that read it with `context.dependOnInheritedWidgetOfExactType()` are rebuilt when it changes.

A better match: Provider or Riverpod on top of a `ChangeNotifier` feels like `ViewModel` plus `LiveData`. You expose state, the UI listens, the UI rebuilds. The scoping is by tree position instead of by Activity or Fragment.

## Async: the part that really breaks

`Future` with `async` / `await` reads almost like a Kotlin `suspend` function. `Stream` is close to `Flow`, and `StreamBuilder` feels like observing `LiveData` in a Fragment.

But the threading model is different, and this is the one place where my Android instinct was wrong.

On Android, I would write `withContext(Dispatchers.IO) { ... }` and the work runs on another thread. In Dart, each isolate has one thread with an event loop. `await http.get(...)` does not block the UI, because the network IO itself is asynchronous and the result comes back as an event. But if you parse a huge JSON or resize an image in Dart code, that runs on the UI isolate and you will drop frames. There is no IO dispatcher to switch to.

For heavy CPU work you start another isolate, for example with `Isolate.run()` or `compute()`. Isolates do not share memory. You send data in and get data back. It feels closer to a separate process than a thread.

## Animation and tools

`AnimationController` is like `ValueAnimator`: it produces values over time. A `Tween` maps 0..1 to the values you want, like a `TypeEvaluator`. The `vsync` argument ties the controller to the screen refresh, similar to what `Choreographer` does on Android.

Hot reload deserves a line. It injects the new code and rebuilds the widgets while keeping the `State`. After years of waiting for Gradle, this changed how I worked. I tried small UI changes much more often because it cost a second.

## What I took away

- **Map the new words to the old ones, but write down where the map breaks.** The breaks are where the bugs are.
- **Widgets are descriptions, not objects on screen.** Once this clicked, most of Flutter made sense.
- **`BuildContext` is a position.** Most of my early errors were using the context from the wrong place.
- **Watch the threading.** `async` is not "off the main thread". Heavy work still needs an isolate.

The row "rebuild vs invalidate" in the table is the most misleading one. Flutter actually keeps three trees, and a rebuild is not a redraw. That is the next post.
