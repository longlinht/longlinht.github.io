---
layout: post
cover: false
title: Define Userful Android Drawables
date:   2016-07-05 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

We can define many useful drawables in Android, in this article, I collected some of definations I ever used.

#### Define a round corner drawable

```xml
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#ffffffff"/>
    <stroke android:width="0dp"
            android:color="#ffffffff" />
    <padding android:left="1dp"
             android:top="1dp"
             android:right="1dp"
             android:bottom="1dp" />
    <corners android:bottomRightRadius="4dp"
             android:bottomLeftRadius="4dp"
             android:topLeftRadius="0dp"
             android:topRightRadius="0dp"/>
</shape>
```

#### Define a circle

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
   <solid
       android:color="#66000000"/>
</shape>
```

#### Define a ring

```xml
<shape
    android:shape="ring"
    android:thickness="2.5dp"
    android:useLevel="true">
    <solid android:color="#979797"/>
</shape>
```
#### Define a drawable with state

```xml
<?xml version="1.0" encoding="utf-8"?>
<selector xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@drawable/qq_login_button_bg_pressed" android:state_pressed="true"/>
    <item android:drawable="@drawable/qq_login_button_bg_normal"/>
</selector>
```

#### Define a ring as progressbar background
```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:id="@android:id/secondaryProgress">
        <shape
            android:shape="ring"
            android:thickness="2.5dp"
            android:useLevel="true">
            <solid android:color="#979797"/>
        </shape>
    </item>

    <item android:id="@android:id/progress">
        <rotate
            android:fromDegrees="270"
            android:pivotX="50%"
            android:pivotY="50%"
            android:toDegrees="270">

            <shape
                android:shape="ring"
                android:thickness="2.5dp"
                android:useLevel="true">

                <rotate
                    android:fromDegrees="0"
                    android:pivotX="50%"
                    android:pivotY="50%"
                    android:toDegrees="360" />
                <solid android:color="#ffffffff"/>
            </shape>
        </rotate>
    </item>
</layer-list>
```
