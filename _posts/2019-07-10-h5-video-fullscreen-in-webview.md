---
layout: post
cover: false
title: 在WebView中支持视频全屏
date:   2019-07-10 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

最近感觉和WebView杠上了，刚解决完在WebView中使用Android相机拍照和录像的问题，又遇到在WebView中视频无法全屏，和之前相机拍照和视频的问题一样，iOS和其他浏览器都没有问题，独WebView出错。通过网上查阅一些资料，最终顺利解决，虽不是什么难搞的东西，但是真要弄起来，也需要一些心力，所以通过此篇记录下整个过程。

解决整个问题其实很程式化，先按部就班保证视频能够正常播放:

1. 在AndroidManifest.xml中声明hardwareAccelerate属性

```
 <application android:hardwareAccelerated ="true">

```

2. 在Activity中声明

```
<activity android:hardwareAccelerated="true" >

```

3. 在代码中设置

```
getWindow.setFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);

```

然后来实现全屏, 而能够全屏的关键在于重写WebChromeClient的onShowCustomView()和onHideCustomView()方法, 在Activity中实现自定义的WebChromeClient，在onShowCustomView中横屏，隐藏WebView,并将得到的View添加到FrameLayout中显示。在onHideCustomView中隐藏View，显示WebView，并竖屏.



```

private View mCustomView;
private WebChromeClient.CustomViewCallback mCustomViewCallback;

@Override
public void onShowCustomView(View view, WebChromeClient.CustomViewCallback callback) {
    if (mCustomView != null) {
        callback.onCustomViewHidden();
        return;
    }
    mCustomView = view;
    webViewContainer.addView(mCustomView);
    mCustomViewCallback = callback;
    mWebView.setVisibility(View.GONE);
    mTitle.setVisibility(View.GONE);
    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
}

@Override
public void onHideCustomView() {
    mWebView.setVisibility(View.VISIBLE);
    mTitle.setVisibility(View.VISIBLE);
    if (mCustomView == null) {
        return;
    }
    mCustomView.setVisibility(View.GONE);
    webViewContainer.removeView(mCustomView);
    mCustomViewCallback.onCustomViewHidden();
    mCustomView = null;
    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
}

```

代码中mCustomView和 mCustomViewCallback 需要保存下来，WebView的父容器在实现中也很重要。


需要注意的问题

如果H5工程师在html中使用了iframe, 那需要H5工程师配合在其中中加入一些属性才能对视频进行操作，

```
allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true"

```
