---
layout: post
cover: false
title: 踩坑小计-SeekBar宽度显示不全
date:   2018-01-20 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---


最近开始一个全新的Android项目，突然感觉很多之前忽略掉的一些不大不小的问题和细节渐渐的浮出了水面，虽不是什么大问题，通过搜索，查找，自己判断改进也都能顺利解决，但终归要查，要找，凭空浪费很多时间，于是决定不论多么琐碎的问题，但凡违反一般性，需要特殊处理的都详细记录下来，避免下次忘记时再踩坑。今天就就记录下一个SeekBar的问题，真的算上不上是一个问题，只是SeekBar这个默认显示的宽度的确与一般View的显示结果不同。


### 问题描述


在布局文件里添加这样一个Seekbar:

```xml
<SeekBar
    android:id="@+id/playlist_seekbar"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:maxHeight="1dp"
    android:minHeight="1dp"
    android:paddingStart="0dp"
    android:paddingEnd="0dp"
    android:thumbOffset="0dp"
    android:progressDrawable="@drawable/playlist_seekbar"
    android:progress="50"
    android:thumb="@drawable/seekbar_thumb" />

```


虽然设置了width是`match_parent`,但是SeekBar得宽度在左右两侧还是留有一定空间,并不是我们直觉所想的那样。当设置了
`android:paddingStart="0dp", android:paddingEnd="0dp"` 以后就是我们想要的宽度了。至于这个控件为什么是这样的默认设定，不得而知，查看SeekBar的源码则看到了这样的继承关系：

```
SeekBar -> AbsSeekBar -> ProgressBar
```

并且在ProgressBar的drawTrack方法中有这么一段代码：

```java
if (isLayoutRtl() && mMirrorForRtl) {
    canvas.translate(getWidth() - mPaddingRight, mPaddingTop);
    canvas.scale(-1.0f, 1.0f);
} else {
    canvas.translate(mPaddingLeft, mPaddingTop);
}

```

这个问题网上也有人说在xml中设置并不生效，但是在代码中调用`seekBar.setPadding(0,0,0,0)`就可以,真是一个琐碎的问题，究其原因就是它违反了一般性，让我们错误的认为它应该和其它的View的特性是一样的，都应该是我们去主动的设置Padding.





