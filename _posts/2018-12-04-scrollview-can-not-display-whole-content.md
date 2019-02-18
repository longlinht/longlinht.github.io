---
layout: post
cover: false
title: 解决ScrollView内容显示不全
date:   2018-12-04 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

这个问题其实只要使用过`ScrollView`，可能都有机会遇到，问题的表现就是`ScrollView`包裹内容的高度超过`ScrollView`可视高度的话，被包裹的内容就会显示不全，最底部的内容永远也看不到了，这种情况肯定是无法接受的， 解决这个问题比较简单，其实就是简单的一句设置语句:

```
android:fillViewport="true"

```

虽然这样可以解决问题，但是还是心中还有疑惑，我放在`ScrollView`中的`LinearLayout`是的高度是设置了`mactch_parent` 属性的，现在看来并没有生效，我猜测可能是`ScrollView`重写了测量方法导致的，于是去看`ScrollView`的`onMeasure` 方法:

```
@Override
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
  super.onMeasure(widthMeasureSpec, heightMeasureSpec);

  if (!mFillViewport) {
      return;
  }

  final int heightMode = MeasureSpec.getMode(heightMeasureSpec);
  if (heightMode == MeasureSpec.UNSPECIFIED) {
      return;
  }

  if (getChildCount() > 0) {
      final View child = getChildAt(0);
      final int widthPadding;
      final int heightPadding;
      final int targetSdkVersion = getContext().getApplicationInfo().targetSdkVersion;
      final FrameLayout.LayoutParams lp = (LayoutParams) child.getLayoutParams();
      if (targetSdkVersion >= VERSION_CODES.M) {
          widthPadding = mPaddingLeft + mPaddingRight + lp.leftMargin + lp.rightMargin;
          heightPadding = mPaddingTop + mPaddingBottom + lp.topMargin + lp.bottomMargin;
      } else {
          widthPadding = mPaddingLeft + mPaddingRight;
          heightPadding = mPaddingTop + mPaddingBottom;
      }

      final int desiredHeight = getMeasuredHeight() - heightPadding;
      if (child.getMeasuredHeight() < desiredHeight) {
          final int childWidthMeasureSpec = getChildMeasureSpec(
                  widthMeasureSpec, widthPadding, lp.width);
          final int childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(
                  desiredHeight, MeasureSpec.EXACTLY);
          child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
      }
  }
}

```

很明显，在没有设置fillViewport属性为true时，`ScrollView`并没有去测量子View的高度，这就导致超过一屏内容的`View`的高度无法正确测量。解决了这个问题以后PM又提了一个底部内容有一部分被遮挡，滑不出的问题，布局代码是这样的:

```
<ScrollView
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:fillViewport="true"
    android:layout_below="@id/tv_title"
    android:layout_marginBottom="84dp"
    >

  <com.zhy.view.flowlayout.TagFlowLayout
      android:id="@+id/tfl_label"
      zhy:max_select="-1"
      android:layout_width="match_parent"
      android:layout_height="wrap_content"
      android:layout_marginTop="14dp"
      android:layout_marginStart="12dp"
      android:layout_marginEnd="12dp"
      >
  </com.zhy.view.flowlayout.TagFlowLayout>

</ScrollView>

```

看了代码后发现被遮挡区域的高度差不多就是这个`TagFlowLayout`的`layout_marginTop`的值，当我去掉这个属性的设置后，遮挡的问题没有了，换作`paddingTop`后也没有问题，就是不能用`marginTop`，好吧，这个`ScrollView`的默认设定也是很奇葩啊！
