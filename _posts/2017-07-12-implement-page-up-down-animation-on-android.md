---
layout: post
cover: false
title:  在Android上实现无限翻页轮播动画效果
date:   2017-07-12 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

最近在工作中遇到一个需求，要求在一个Dialog的标题上显示两行字，但是这行字如果同时出现的话会非常难看，设计出了套方案，类似无限翻页轮播这两行字，要有翻书的效果。
刚开始实现的时候，动画的效果也出来了，但是拿去给设计验收的时候设计总感觉怪怪的，始终达不到设计最终想要的结果。后来通过好多次的调试和验证，发现问题出现在两个
View的动画播放时序和旋转轴的问题上，解决了这两个问题后再拿去给设计看的时候，一切都完美了。 现在这个比较好的设计也已上线， 也因为这个调试和验证的过程感觉对
Android动画的一些细节碰触的较多，所以写下此文记录下这个过程。

#### 基本原理

通过`ObjectAnimation`操作`View`的`RotationY`属性，再利用动态改变`PivotY`的值和动画播放时序的不同来模拟出无限翻页轮播的动画效果

#### ObjectAnimation

```

// 上面的View翻下去的动画

private static ObjectAnimator aboveViewPageDownAnim;

// 下面的View翻上去的动画

private static ObjectAnimator belowViewPageUpAnim;

// 上面的View翻上去的动画

private static ObjectAnimator aboveViewPageUpAnim;

// 下面的View翻下去的动画

private static ObjectAnimator belowViewPageDownAnim;

```

#### 关键的常量

```
// 翻页动画的播放时长

private static int pageUpDownDurition = 500;

// 翻下播放结束前100翻上就开始播放

private static int pageUpBeforeDownEnd = 400;

// 翻上播放完后停留时间

private static int belowViewStayInterval = 800;

// 在Y轴底部翻转

private static int pageUpPivotY = 100;

// 在Y近顶部的位置翻转

private static int pageDownPivotY = 70;

```

#### 具体实现

```

public static void startPageUpDownAnimation(final View aboveView, final View belowView) {

    aboveViewPageDownAnim = ObjectAnimator.ofPropertyValuesHolder(aboveView,
            PropertyValuesHolder.ofFloat(View.ROTATION_X, 0, 90));

    aboveViewPageDownAnim.setDuration(pageUpDownDurition);
    aboveViewPageDownAnim.setInterpolator(new LinearInterpolator());
    aboveViewPageDownAnim.addListener(new Animator.AnimatorListener() {
        @Override
        public void onAnimationStart(Animator animator) {
            aboveView.setPivotY(pageDownPivotY);
            belowView.setVisibility(View.GONE);
            belowView.postDelayed(new Runnable() {
                @Override
                public void run() {
                    belowViewPageUpAnim.start();
                }
            }, pageUpBeforeDownEnd);
        }

        @Override
        public void onAnimationEnd(Animator animator) {

        }

        @Override
        public void onAnimationCancel(Animator animator) {

        }

        @Override
        public void onAnimationRepeat(Animator animator) {

        }
    });

    belowViewPageUpAnim = ObjectAnimator.ofPropertyValuesHolder(belowView,
    PropertyValuesHolder.ofFloat(View.ROTATION_X, -90, 0));
    belowViewPageUpAnim.setDuration(pageUpDownDurition);
    belowViewPageUpAnim.setInterpolator(new LinearInterpolator());
    belowViewPageUpAnim.addListener(new Animator.AnimatorListener() {
        @Override
        public void onAnimationStart(Animator animator) {
            belowView.setVisibility(View.VISIBLE);
            belowView.setPivotY(pageUpPivotY);
        }

        @Override
        public void onAnimationEnd(Animator animator) {
            belowView.postDelayed(new Runnable() {
                @Override
                public void run() {
                    belowViewPageDownAnim.start();
                }
            }, belowViewStayInterval);
        }

        @Override
        public void onAnimationCancel(Animator animator) {

        }

        @Override
        public void onAnimationRepeat(Animator animator) {

        }
    });

    belowViewPageDownAnim = ObjectAnimator.ofPropertyValuesHolder(belowView,
            PropertyValuesHolder.ofFloat(View.ROTATION_X, 0, 90));

    belowViewPageDownAnim.setDuration(pageUpDownDurition);
    belowViewPageDownAnim.setInterpolator(new LinearInterpolator());
    belowViewPageDownAnim.addListener(new Animator.AnimatorListener() {

        @Override
        public void onAnimationStart(Animator animator) {
            belowView.setPivotY(pageDownPivotY);
            aboveView.setVisibility(View.GONE);
            aboveView.postDelayed(new Runnable() {
                @Override
                public void run() {
                    aboveViewPageUpAnim.start();
                }
            }, pageUpBeforeDownEnd);
        }

        @Override
        public void onAnimationEnd(Animator animator) {

        }

        @Override
        public void onAnimationCancel(Animator animator) {

        }

        @Override
        public void onAnimationRepeat(Animator animator) {

        }
    });

    aboveViewPageUpAnim = ObjectAnimator.ofPropertyValuesHolder(aboveView,
            PropertyValuesHolder.ofFloat(View.ROTATION_X, -90, 0));
    aboveViewPageUpAnim.setDuration(pageUpDownDurition);
    aboveViewPageUpAnim.setInterpolator(new LinearInterpolator());
    aboveViewPageUpAnim.addListener(new Animator.AnimatorListener() {
        @Override
        public void onAnimationStart(Animator animator) {
            aboveView.setVisibility(View.VISIBLE);
            aboveView.setPivotY(pageUpPivotY);
        }

        @Override
        public void onAnimationEnd(Animator animator) {
            aboveView.postDelayed(new Runnable() {
                @Override
                public void run() {
                    aboveViewPageDownAnim.start();
                }
            }, belowViewStayInterval);
        }

        @Override
        public void onAnimationCancel(Animator animator) {

        }

        @Override
        public void onAnimationRepeat(Animator animator) {

        }
    });

    aboveViewPageDownAnim.start();
}
```

其实这个实现已经是一个基本比较通用的翻页动画了，不仅可以用于TextView，ImageView应该也没有问题。
