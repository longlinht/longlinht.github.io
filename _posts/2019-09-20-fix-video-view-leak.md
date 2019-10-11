---
layout: post
cover: false
title: 修复VideoView引起的内存泄露小计
date:   2019-09-20 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

最近写了非常简单的新手引导视频页面，逻辑很简单，就是新手用户在第一次使用App时可以点击引导视频入口，然后进入一个视频播放页面，为了快速实现功能，就直接使用了VideoView，从需求开发到交付也都没什么问题，需求上线后我打开LeakCanary，想观察下最近有没有新增的内存泄露，竟然发现这个视频页面竟然泄露了。排查了一圈也没有发现有什么会阻止Activity销毁。但是LeakCanary打出了引用链，发现和VideoView有关，通过Google发现，竟然是VideoView自身的bug！这种情况也不是第一次遇见，那也得解决啊，所以开始想办法。

首先显明确是谁导致了Activity的销毁，通过查看VideoView的源码，发现罪魁祸首是AudioManager，它可能会长期持有Context(即泄露的Activity)。很明显是因为生命周期不一致导致的泄露，因此最先想到的就是在创建VideoView时不要传Activity的Context，传给它ApplicationContext。当然了，在布局中创建的VideoView传入的就是Activity的Context，所以需要用代码动态创建:

```
mVideoView = new VideoView(getApplicationContext());
RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(
        RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.WRAP_CONTENT);

layoutParams.addRule(RelativeLayout.CENTER_IN_PARENT);
mContainer.addView(mVideoView, layoutParams);

```

这样修改后还是会有内存泄露，只是引用链变了，需要在Activity的onDestroy回调中做一些处理

```
@Override
protected void onDestroy() {
  super.onDestroy();

  if (mVideoView != null) {
      mVideoView.stopPlayback();
      mVideoView.setOnCompletionListener(null);
      mVideoView.setOnPreparedListener(null);
      mVideoView.setOnErrorListener(null);
      mVideoView = null;
  }

  if (mContainer != null) {
      mContainer.removeAllViews();
  }

```
以上解决办法需要注意三点：

* 给VideoView设置的Listener都要分别置空，否则仍然会泄露
* VideoView的父容器要删掉VideoView，光置空VideoView不够
* 需设置VideoView的OnErrorListener且返回true，防止弹出弹窗使用ApplicationContext导致崩溃 


传递ApplicationContext还有人提出另一种方法，但是我test发现没有效果，这种方法我也贴出来:


```
// Override Activity的attachBaseContext的行为
@Override
protected void attachBaseContext(Context newBase) {
    super.attachBaseContext(new ContextWrapper(newBase){
        @Override
        public Object getSystemService(String name) {
            if(Context.AUDIO_SERVICE.equals(name)){
                return getApplicationContext().getSystemService(name);
            }
            return super.getSystemService(name);
        }
    });
}

```

去规避系统API的bug真是很烦人的一件事，既不优雅，也不安全！





