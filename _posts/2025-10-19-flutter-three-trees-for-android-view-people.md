---
layout: post
cover: false
title: Flutter's Three Trees, for People Who Wrote Android Views
date:   2025-10-19 20:40:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In the [last post](/flutter-for-android-engineers.html) I mapped Flutter words to Android words. One row in that table was wrong in a useful way: "`setState()` is like `invalidate()`". It is not. To see why, you need Flutter's three trees.

On Android there is one tree. A `View` is the configuration, the state and the thing that measures and draws, all in one object. You call `requestLayout()` when the size may change and `invalidate()` when the pixels change. I wrote custom Views for years with this model in my head.

Flutter splits that one object into three.

## Three trees, three jobs

**Widget.** An immutable description. `Padding(padding: 8, child: ...)` is just data. It is created on every build and thrown away. Creating one is very cheap.

**Element.** The live instance at one position in the tree. It holds a reference to the current widget, to its parent and children, and, for a `StatefulWidget`, the `State` object. The `BuildContext` you get in `build()` is the Element. This is the part that lives long.

**RenderObject.** The part that does layout, paint and hit testing. If you know `onMeasure()`, `onLayout()` and `onDraw()`, this is where they live: `performLayout()` and `paint()`.

My notes first said "every widget has one Element and one RenderObject". That is not quite right, and the difference matters:

- Every widget creates one Element.
- Only **RenderObjectWidgets** create a RenderObject. `Padding`, `Align`, `RichText`, `CustomPaint` are examples.
- `StatelessWidget` and `StatefulWidget` only compose other widgets. Their Elements have no RenderObject of their own.

For example, `Text` is a `StatelessWidget`. Its `build()` returns a `RichText`, and the `RichText` creates a `RenderParagraph`. So the render tree is much smaller than the widget tree. Most of the widgets you write are just glue.

## What happens on setState

Say a counter changes from 1 to 2.

1. `setState()` runs your callback and calls `markNeedsBuild()` on this Element. The Element is added to a dirty list, and a frame is scheduled. Nothing else happens yet.
2. On the next frame, Flutter calls `build()` on each dirty Element. Your `build()` returns a new `Text('2')`.
3. For each child, Flutter compares the old widget with the new one. If they can be matched (rules below), the old Element is kept and gets the new widget through `update()`.
4. Down the tree, `RichText` calls `updateRenderObject()`. It sets the new text on the existing `RenderParagraph`.
5. The RenderObject's setter checks if the value really changed. If yes, it calls `markNeedsLayout()` or `markNeedsPaint()`.
6. Later in the same frame, only the marked RenderObjects run layout and paint.

So `setState()` is not `invalidate()`. `markNeedsPaint()` is the real `invalidate()`, and `markNeedsLayout()` is the real `requestLayout()`. Rebuild is an extra step that Android Views do not have. The closest Android thing is recomposition in Jetpack Compose.

## Element reuse

Step 3 is where performance and state are decided. The rule is in `Widget.canUpdate()`: an old Element can take a new widget if the two widgets have **the same runtime type and the same key**. That's all.

Children without keys are matched by position. Children with keys are matched by key. If the parent Element is replaced, all its children are replaced too.

Two cases taught me why this matters.

**Changing the type at a position loses state.**

```dart
// before
child: MyForm()
// after, a condition wraps it
child: isWide ? Padding(padding: p, child: MyForm()) : MyForm()
```

When `isWide` flips, the widget at that position changes from `MyForm` to `Padding`. Different type, so the old Element is thrown away, and with it the `State` of `MyForm`. Whatever the user typed is gone. The fix is to keep the tree shape stable, for example always wrap with `Padding` and change only the padding value.

**Reordering without keys moves the wrong thing.**

My notes said that if you swap two `Text` widgets without keys, both are destroyed and rebuilt. That is not what happens. The types match at each position, so both Elements are **reused**. Each one just gets the other widget's config. For `Text` this is fine, the screen looks correct.

The real problem is with stateful children. Say a list of two items, each with a checkbox state inside its own `State`. The user checks the first one, then you swap the items. The Elements stay in place, and so do their `State` objects. The labels move, but the checked state does not. Now the wrong item looks checked.

```dart
children: items.map((item) => TodoTile(
  key: ValueKey(item.id),
  item: item,
)).toList(),
```

With a `ValueKey`, Flutter matches by key. The Element, and its `State`, moves together with the item. This is the same idea as giving stable IDs to `RecyclerView` items, so the adapter knows which row is which.

A `GlobalKey` goes one step further. It lets an Element keep its state even when it moves to a different parent. It is also more expensive, so I only use it when I really need that, or to reach a `State` from outside, like a `FormState`.

## Rebuild is not repaint

Once the three trees are clear, this follows:

- **Rebuild** happens in the Widget and Element trees. `build()` runs, new widgets are compared with old ones.
- **Repaint** happens in the RenderObject tree. `paint()` runs and records drawing commands into a layer.

They are independent. A rebuild where nothing really changed ends at step 5 above: the setters see the same values and do not mark anything. No layout, no paint.

And a repaint can happen without any rebuild. A `CustomPainter` can take a `repaint:` listenable, like an `AnimationController`. When the animation ticks, only `paint()` runs again. No `build()`, no diff. For a smooth animation this is the cheapest path.

One note I had to correct: "rebuild costs CPU, repaint costs GPU". It is not that clean. Build, layout and paint all run on the UI thread, on the CPU. Paint only records commands. The GPU work happens later, when the raster thread turns the layers into pixels. Both rebuild and repaint cost CPU time on the UI thread, and that is the budget you have to stay inside, about 16ms per frame at 60Hz.

## RepaintBoundary

By default a RenderObject paints into the same layer as its parent. If the parent repaints, the children repaint too.

`RepaintBoundary` gives a subtree its own layer. If something next to it repaints, the boundary's layer can be reused as is. If something inside it repaints, the work stays inside the boundary. A spinning loader next to a complex chart is a good case: put each in its own boundary and the chart is not repainted 60 times a second.

It is not free. Every layer costs memory and compositing time. To check if it helps, turn on `debugRepaintRainbowEnabled`. Each repainted area changes color, so you can see what repaints when it should not.

## When to write your own RenderObject

On Android, when the standard layouts were not enough, I wrote a custom `ViewGroup`. In Flutter the equivalent is a custom RenderObject. But it is lower level than a custom View, and usually you don't need it. I try these first, in order:

1. Compose existing widgets.
2. `CustomPaint` for custom drawing.
3. `CustomMultiChildLayout` or `Flow` for custom positioning.

A custom RenderObject makes sense for a layout the standard ones can't express, like a real waterfall layout, or for a custom hit test, like a round or polygon-shaped button. The pattern has two parts: a widget that creates and updates the RenderObject, and the RenderObject itself. The part that is easy to get wrong is the setter:

```dart
class RenderBar extends RenderBox {
  RenderBar(this._factor);

  double _factor;
  set factor(double value) {
    if (value == _factor) return;
    _factor = value;
    markNeedsLayout(); // size depends on it
  }

  @override
  void performLayout() {
    size = constraints.constrain(Size(100 * _factor, 50));
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    context.canvas.drawRect(offset & size, Paint()..color = const Color(0xFF2196F3));
  }
}

class Bar extends LeafRenderObjectWidget {
  const Bar({super.key, required this.factor});
  final double factor;

  @override
  RenderBar createRenderObject(BuildContext context) => RenderBar(factor);

  @override
  void updateRenderObject(BuildContext context, RenderBar renderObject) {
    renderObject.factor = factor;
  }
}
```

If the setter just assigns the field and forgets `markNeedsLayout()`, the new value is stored but nothing on screen changes. If it always marks, even for the same value, you lose the "rebuild without repaint" benefit. The early return is what makes rebuilds cheap.

## What I took away

- **Android's one View is Flutter's three objects.** Widget is the config, Element is the instance with state, RenderObject is the measure-layout-draw part.
- **`markNeedsPaint()` is `invalidate()`. `setState()` is not.** Rebuild is a separate, earlier step.
- **Type and key decide if state survives.** Keep the tree shape stable, and give list items keys.
- **Rebuild is not repaint.** Many rebuilds are cheap because nothing below them changes. Most real cost is in what you do inside `build()`.
- **Custom RenderObjects are the last tool, not the first.** Composition and `CustomPaint` cover most cases.
