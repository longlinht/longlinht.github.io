---
layout: post
cover: false
title: Booster使用小结
date:   2021-02-20 14:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true

---

使用Booster去修复SharedPreferences导致的ANR的版本已全量上架Google Play，SP导致的ANR几乎绝迹，但是随之全量版本的逐步铺开，firebase崩溃后台却出现了Booster所导致的两个比较多的崩溃:

一个是NPE，触发的基本环境如下:

System version 6.0.1

Java version 8

Gradle version 6.6.1

Android Gradle plugin version 4.0.0

Booster version 3.1.0

主要的崩溃机型:Galaxy J2 Prime(76%), Galaxy Grand Neo, Galaxy J3(2016), MAXTRON U22

```
Fatal Exception: java.lang.NullPointerException
Attempt to invoke virtual method 'java.lang.String java.io.File.getParent()' on a null object reference
com.didiglobal.booster.instrument.sharedpreferences.SharedPreferencesManager.<init> (SharedPreferencesManager.java:36)
com.didiglobal.booster.instrument.sharedpreferences.BoosterSharedPreferences.<init> (BoosterSharedPreferences.java:42)
com.didiglobal.booster.instrument.sharedpreferences.BoosterSharedPreferences.getSharedPreferences (BoosterSharedPreferences.java:58)
com.didiglobal.booster.instrument.ShadowSharedPreferences.getSharedPreferences (ShadowSharedPreferences.java:15)
com.google.android.gms.internal.ads.zzabb.initialize (zzabb.java:33)
com.google.android.gms.internal.ads.zzabf.zzi (zzabf.java:15)
com.google.android.gms.internal.ads.zzabe.get (zzabe.java)
com.google.android.gms.ads.internal.util.zzbu.zza (zzbu.java:13)
com.google.android.gms.internal.ads.zzabf.initialize (zzabf.java:1)
com.google.android.gms.internal.ads.zzanc.run (zzanc.java:2)
java.lang.Thread.run (Thread.java:818)

```

此问题已经在github上提issue给开源团队，经过几次沟通，确定是Booster的bug，开源团队响应极快，在3.3.1版本已修复此问题。

另一个问题Class Cast Exception，基本环境与上面相同，主要发生在 Samsung Android 4, 4.2.2 

```
Caused by java.lang.ClassCastException
java.lang.Integer cannot be cast to java.lang.Boolean

com.didiglobal.booster.instrument.sharedpreferences.BoosterSharedPreferences.getBoolean (BoosterSharedPreferences.java:120)
cn.xiaochuankeji.zuiyouLite.common.instance.SelectGenderDlgManager.<init> (SelectGenderDlgManager.java:95)
cn.xiaochuankeji.zuiyouLite.common.instance.SelectGenderDlgManager.getInstance (SelectGenderDlgManager.java:71)
cn.xiaochuankeji.zuiyouLite.ui.main.MainActivity.onCreate (MainActivity.java:236)
android.app.Activity.performCreate (Activity.java:5112)
android.app.Instrumentation.callActivityOnCreate (Instrumentation.java:1080)
android.app.ActivityThread.performLaunchActivity (ActivityThread.java:2214)
android.app.ActivityThread.handleLaunchActivity (ActivityThread.java:2300)
android.app.ActivityThread.access$700 (ActivityThread.java:156)
android.app.ActivityThread$H.handleMessage (ActivityThread.java:1298)
android.os.Handler.dispatchMessage (Handler.java:99)
android.os.Looper.loop (Looper.java:137)
android.app.ActivityThread.main (ActivityThread.java:5211)
java.lang.reflect.Method.invokeNative (Method.java)
java.lang.reflect.Method.invoke (Method.java:511)
com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run (ZygoteInit.java:815)
com.android.internal.os.ZygoteInit.main (ZygoteInit.java:582)
dalvik.system.NativeStart.main (NativeStart.java)

```

此问题目前还未被修复。除了这两个比较崩溃，目前Booster未引入新的问题，并且实实在在的解决了SP的ANR问题，使用线程池优化模块的版本也已上线，目前未发现问题，后续会统计对减少创建线程导致的OOM的贡献。引入Booster也是担着一定的风险，对于一个百万级日活的App，如果出现一个因为第三方工具导致的问题，很有可能导致线上事故，因此在引入前一定要对其做足了调研和评估。

Booster的这种解决问题的方式真的是可谓优雅，不需你更改一行代码，在你使用它提供的gradle插件构建你的工程后，它已默默的为你修复了诸多问题，并且可以根据你的实际情况选择使用不同的功能模块。使用booster以来真的给我很多启发:

* 系统问题也不是不可解决，也许换个思路，就有了办法
* 开发工具，一定要让它易用，直观，易于理解
* 开发的功能一定要相对独立，模块化
* 引入第三方工具钱，一定要做足调研和评估
* 使用了以后也要做好权衡，如它带来的利是否远大于弊











