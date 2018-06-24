---
layout: post
cover: false
title: Android开发中二维码库的选用
date:   2017-08-20 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

在现今的移动App开发中，二维码的使用场景变得越来越普遍，最近我要开发的一个需求就必须生成二维码，自然就面临二维码库选用的问题，因为大名鼎鼎的ZXing的存在，这也本不是什么特别需要考虑的问题。但是因为ZXing的大而全，要在一款只是将二维码作为一个特定使用场景下的一个功能的App，完全引入ZXing就有点过了，所以就面临了ZXing库的裁剪问题。但是裁剪这样一个大而全的多平台支持的库也不是什么简单的事情，所以我也顺便调研了其他的二维码库作为参考:

* OnBarCode http://www.onbarcode.com/products/android_barcode/barcodes/qrcode.html#intro

* Barcode4j http://barcode4j.sourceforge.net/

* QRGenerator 

  * https://github.com/androidmads/QRGenerator

  * https://androidmads.blogspot.com/2016/07/qr-code-generator-library.html

当然了，这些库实现我的需求都是没有问题的，但是最终我还是在我的项目中选用了ZXing,一来是因为它在业界的广泛使用得到了充分的验证，二来是因为我们项目组其他的同事也会在未来的需求中使用到，所以必须选用一个长期的可靠的的解决方案。当然了，我是选用了一版裁剪后的ZXing库。至于这个库的使用其实没有什么好说的，因为使用起来非常简单，简单的几个事例就能明白如何应用。
