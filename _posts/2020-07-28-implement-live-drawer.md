---
layout: post
cover: false
title: 基于DrawerLayout实现直播抽屉
date:  2020-07-28 20:54:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

  直播间里右侧的滑出抽屉现在几乎成了主流直播的标配，无论是映客还是Bigo，都很早就上线了抽屉。我所在的这个产品最近也要上同样的功能，因此需要简单实现一个。
  要实现一个简单的侧滑抽屉，最先想到的就是直接使用`DrawerLayout`，但是无法满足产品的一个手势要求: 在屏幕任何位置都可以调出和收起抽屉。`DrawerLayout` 的默认行为是只能从屏幕边缘调出。因此需要改变DrawerLayout的默认行为，使期能够从屏幕任何位置调出，这就需要通过反射修改drawerlayout的edgesize属性，因为drawerlayout还可以通过长按调出，我们的产品需求并不需要这个行为，因此也需要屏蔽掉，通过一个静态方法来统一实现：

```
public static void setDrawerLeftEdgeSize(DrawerLayout drawerLayout,
                                             float percent) {
    if (drawerLayout == null)
        return;
    try {
        //获取 ViewDragHelper，更改其 edgeSizeField 为 displayWidthPercentage*屏幕大小
        Field rightDraggerField = drawerLayout.getClass().getSuperclass().getDeclaredField("mRightDragger");
        rightDraggerField.setAccessible(true);
        ViewDragHelper rightDragger = (ViewDragHelper) rightDraggerField.get(drawerLayout);

        Field edgeSizeField = rightDragger.getClass().getDeclaredField("mEdgeSize");
        edgeSizeField.setAccessible(true);
        int edgeSize = edgeSizeField.getInt(rightDragger);

        edgeSizeField.setInt(rightDragger, Math.max(edgeSize, (int)(UIUtils.getScreenWidth() * percent)));

        //获取 Layout 的 ViewDragCallBack 实例“mLeftCallback”
        //更改其属性 mPeekRunnable
        Field rightCallbackField = drawerLayout.getClass().getSuperclass().getDeclaredField("mRightCallback");
        rightCallbackField.setAccessible(true);

        //因为无法直接访问私有内部类，所以该私有内部类实现的接口非常重要，通过多态的方式获取实例
        ViewDragHelper.Callback leftCallback = (ViewDragHelper.Callback) rightCallbackField.get(drawerLayout);

        Field peekRunnableField = leftCallback.getClass().getDeclaredField("mPeekRunnable");
        peekRunnableField.setAccessible(true);
        Runnable nullRunnable = new Runnable() {
            @Override
            public void run() {

            }
        };
        peekRunnableField.set(leftCallback, nullRunnable);
    } catch (Exception e) {
        e.printStackTrace();
    }
}

```

解决了edgsize和长按的问题后，马上又面临一个净屏页和抽屉的手势滑动冲突问题，并且还要注意两个UI元素的层级，基本的解决思路是根据滑动的方向和净屏页的状态在`DrawerLayout`子类的onInterceptTouchEvent里来处理事件拦截，改变`DrawerLayout`的默认行为，净屏页的逻辑不变，只向`DrawerLayout`提供状态的get方法，具体实现如下：

```

@Override
public boolean onInterceptTouchEvent(MotionEvent ev){
    Log.d("drawerLayout", "onInterceptTouchEvent, action: "
            + ev.getAction() + " x= " + ev.getX() + " y=" + ev.getY());

    boolean drawerOpen = this.isDrawerOpen(Gravity.RIGHT);
    boolean pureMode = contentView.isPureMode();

    switch(ev.getAction()) {
        case MotionEvent.ACTION_DOWN:
            mLastX = ev.getX();
            mLastY = ev.getY();

            /*
            final View touchedView = findTopChildUnder((int) mLastX, (int) mLastY);
            boolean isContent = isContentView(touchedView);


            if (!drawerOpen && isContent) {
                return false;
            }
              */

            break;
        case MotionEvent.ACTION_MOVE:
            float dx = ev.getX() - mLastX;
            float dy = ev.getY() - mLastY;

            boolean horizontal = Math.abs(dx) > Math.abs(dy);

            if (!pureMode && dx < 0 && horizontal) {

            } else if(!pureMode && dx > 0 && drawerOpen && horizontal){

            } else {
                return false;
            }

            break;
        default:
            break;
    }
    return super.onInterceptTouchEvent(ev);
}


```

这样用最小的开发成本完成了产品的需求，实现了主流直播产品的抽屉功能。唯一的小瑕疵是直播间上下滑动时不能自动收起抽屉，这个因为并不是产品很在意的点，再加上产品需求紧急，就没有深究。当然了，这个抽屉功能其实可以抽取出来做成一个通用的抽屉，提供不同的接口来满足定制要求。

tips：`DrawerLayout`显示区域穿透的问题可以这样解决：
将显示区域的clickable属性设置为true。
