---
layout: post
cover: false
title: 在WebView中调用Android相机拍照录像
date:   2019-06-28 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

最近公司App需要以H5的方式接入七鱼客服，根据他们的开发文档接入起来还是很容易，成本很低。理论上如果以native的方式接入的话，用户体验会更好，但是接入后增加的包体积是无法接受的，遂改用H5的方式，整个接入过程还算顺利，有相对详尽的接入文档和demo，只是在最后接入完成后，因为沟通不畅，忽略了客服聊天界面在Android上无法发图片和发视频的问题。同一份html，iOS就是正常的，Android上就死活没反应。后来才恍然大悟，WebView是不支持JS去直接操作Android相机的，必须通过回调到native，由native完成照片的选择，拍摄和录像后将数据返回给JS才能完成一次照片和视频的发送。清楚了问题所在，就需要实现WebView的标准接口来实现这个回调到native的功能，在代码实现前，需要先厘清一些WebView的基本概念和原理。

像发送图片和视频这样的操作，涉及到了定制WebView的一些默认行为，理论上如果要做定制，就需要了解WebSettings、JavaScriptInterface、WebViewClient以及WebChromeClient，一般而言，通过配置WebSettings，使用JavasScriptInterface，重写WebViewClient和WebChromeClient对象的相关方法，就可以实现一些我们想要的行为。发图片和发视频就是通过重写WebChromeClient对象的几个方法来实现的。

```

// 重写WebChromeClient的特定方法来实现图片和视频的发送
mWebView.setWebChromeClient(new WebChromeClient() {
    // For Android >=3.0
    public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType) {
        if(acceptType.equals("image/*")) {
            if (mUploadMessage != null) {
                mUploadMessage.onReceiveValue(null);
                return;
            }
            mUploadMessage = uploadMsg;
            selectImage();
        } else {
            onReceiveValue();
        }
    }

    // For Android < 3.0
    public void openFileChooser(ValueCallback<Uri> uploadMsg) {
        openFileChooser(uploadMsg, "image/*");
    }

    // For Android  >= 4.1.1
    public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType, String capture) {
        openFileChooser(uploadMsg, acceptType);
    }

    // For Android  >= 5.0
    @Override
    @SuppressLint("NewApi")
    public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
        if (fileChooserParams != null && fileChooserParams.getAcceptTypes() != null
                && fileChooserParams.getAcceptTypes().length > 0 && fileChooserParams.getAcceptTypes()[0].equals("image/*")) {
            if (mUploadMessageArray != null) {
                mUploadMessageArray.onReceiveValue(null);
            }
            mUploadMessageArray = filePathCallback;
            selectImage();
        } else if (fileChooserParams != null && fileChooserParams.getAcceptTypes() != null
                && fileChooserParams.getAcceptTypes().length > 0 && fileChooserParams.getAcceptTypes()[0].equals("video/*")){

            if (mUploadMessageArray != null) {
                mUploadMessageArray.onReceiveValue(null);
            }
            mUploadMessageArray = filePathCallback;
            PermissionUtil.requestPermission(QiyuWebViewActivity.this, PermissionUtil.PERMISSIONS_CAMERA_RECORD_AUDIO, PermissionUtil.REQUEST_CAMERA_RECORD_AUDIO);
        } else {
            onReceiveValue();
        }
        return true;
    }
});

```

需要注意的是，这几个回调方法，需要针对不同Android版本分别做处理，在onShowFileChooser方法中需要区分是图片还是视频，并且无论是在相册中选取还是拍摄照片，录像都需要申请相应的权限，这个一定不能少，网上很多的demo都是没有权限申请环节的，代码根本不可用。

在正确的回调到onShowFileChooser后，就要区分图片和视频的情况下走正常的选取，拍照，录像的流程，并且把获取到的图片，视频数据回传给JS调用，这样就完成了桥接调用。虽然现在看起来挺简单的，但是还是有些点容易成为坑点，让人走很多弯路:

* 需要的配置一定要设定

```
mWebView.getSettings().setJavaScriptEnabled(true);
mWebView.getSettings().setDomStorageEnabled(true);

```

* 动态权限申请一定不能少

* 正确区分图片和视频

```
// "video/* 为视频"
fileChooserParams.getAcceptTypes()[0].equals("image/*")

```

总结一下，在WebView的JS调用系统相机的关键是重写WebChromeClient的特定方法来实现的。















