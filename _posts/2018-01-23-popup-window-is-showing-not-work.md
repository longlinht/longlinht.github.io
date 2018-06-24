---
layout: post
cover: false
title: 踩坑小计-PopupWindow的isShowing不工作
date:   2018-01-23 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

PopupWindow在Android中是比较常用的一种控件，一个成熟的商业级app几乎不可能不用到它,最近在做的一个音乐播放列表的弹窗就是用PopupWindow实现的，做起来也没什么困难，就是有一个恼人的问题，不知道算不算SDK的一个bug.


### 问题描述

创建了一个PopuWindow将其show出来以后，调用其isShowing()方法后一直返回false，代码如下：

```java

// show
musicPopup = new RoomMusicPopupWindow(this);
musicPopup.show(mGameCenter);


// want to decide if popup is showing, isShowing always return false
if(null != musicPopup && musicPopup.isShowing()) {

}

```

### 解决方法

```java

musicPopup.setFocusable(true);

```

