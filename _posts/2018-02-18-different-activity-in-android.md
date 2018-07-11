---
layout: post
cover: false
title: Activity vs FragmentActivity vs AppCompatActivity
date:   2018-02-18 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

`Activity`应该是每一个Android开发者第一个遇到的类吧，后来又看到了`FragmentActivity`，再后来又碰到了`AppCompatActivity`和`ActionBarActivity`，也许我们在开发者中会在不同的场景中使用以上不同的Activity类，但是要让我们清楚的说出它们的联系和区别，可能都会被这个问题懵一下，现在我们就来把他们的关系理清楚.

这几个类有一个基本的继承关系

```java

Activity <- FragmentActivity <- AppCompatActivity <- ActionBarActivity


```

需要注意的是`ActionBarActivity`已经废弃了. 从上面的这个继承关系也大概可以了解这几个类的基本关系，`Activity` 是以上这各类的基类，所有的`Activity`子类都直接或间接的继承自`Activity`类.

`FragmentActivity` 是在support-v4和support-v13库中用来向后兼容`Fragment`的.`AppCompatActivity` 是在appcompat-v7库, 原则上它提供了对action bar的向后兼容. 在考虑什么场景具体使用哪个类时可以参考一下三个原则:

* 如果你想向后兼容Material Design的外观，继承`AppCompatActivity`.

* 如果不考虑Material Design，但是你想使用嵌套的`Fragment`, 继承`FragmentActivity`.

* 如果没有以上需求，则继承`Activity`.

因为`AppCompatActivity` 继承自`FragmentActivity` ,如果你需要`FragmentActivity`的特性，原则上都可以使用`AppCompatActivity`.


