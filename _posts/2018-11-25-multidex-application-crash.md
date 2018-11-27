---
layout: post
cover: false
title: MultidexApplication相关的一个crash
date:   2018-11-25 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

最近在内测的一个App在内测开始后有用户反馈启动就crash的问题，后来拿到用户的信息后发现几个crash的机器都是4.4的机器，因为现在真实用户使用4.4系统的用户真的是不多了，就没怎么在意，但是在阿里云移动测试平台进行兼容性测试的时候，这个问题必现，并且都出现在4.4的机器上，查看兼容性测试报告，都是同一个crash，崩溃的堆栈记录了下来:

```
FATAL EXCEPTION: main Process: com.ross.android, PID: 9282 java.lang.RuntimeException: Unable to get provider com.readystatesoftware.chuck.internal.data.ChuckContentProvider: 
java.lang.ClassNotFoundException: Didn't find class "com.readystatesoftware.chuck.internal.data.ChuckContentProvider" on path: DexPathList[[zip file "/data/app/com.ross.android-1.apk"],nativeLibraryDirectories=[/data/app-lib/com.ross.android-1, /vendor/lib, /system/lib]] 
at android.app.ActivityThread.installProvider(ActivityThread.java:5060) 
at android.app.ActivityThread.installContentProviders(ActivityThread.java:4631) 
at android.app.ActivityThread.handleBindApplication(ActivityThread.java:4571) 
at android.app.ActivityThread.access$1500(ActivityThread.java:155) 
at android.app.ActivityThread$H.handleMessage(ActivityThread.java:1406) 
at android.os.Handler.dispatchMessage(Handler.java:110) 
at android.os.Looper.loop(Looper.java:193)
at android.app.ActivityThread.main(ActivityThread.java:5341) 
at java.lang.reflect.Method.invokeNative(Native Method) 
at java.lang.reflect.Method.invoke(Method.java:515) 
at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:830) 
at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:646) 
at dalvik.system.NativeStart.main(Native Method) Caused by: java.lang.ClassNotFoundException: Didn't find class "com.readystatesoftware.chuck.internal.data.ChuckContentProvider" on path: DexPathList[[zip file "/data/app/com.ross.android-1.apk"],nativeLibraryDirectories=[/data/app-lib/com.ross.android-1, /vendor/lib, /system/lib]] at dalvik.system.BaseDexClassLoader.findClass(BaseDexClassLoader.java:56) 
at java.lang.ClassLoader.loadClass(ClassLoader.java:497) 
at java.lang.ClassLoader.loadClass(ClassLoader.java:457)
at android.app.ActivityThread.installProvider(ActivityThread.java:5045) 
at android.app.ActivityThread.installContentProviders(ActivityThread.java:4631)
at android.app.ActivityThread.handleBindApplication(ActivityThread.java:4571) 
at android.app.ActivityThread.access$1500(ActivityThread.java:155) 
at android.app.ActivityThread$H.handleMessage(ActivityThread.java:1406) 
at android.os.Handler.dispatchMessage(Handler.java:110) 
at android.os.Looper.loop(Looper.java:193) 
at android.app.ActivityThread.main(ActivityThread.java:5341) 
at java.lang.reflect.Method.invokeNative(Native Method) at java.lang.reflect.Method.invoke(Method.java:515)
at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:830) 
at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:646) 
at dalvik.system.NativeStart.main(Native Method)

```

看到这个崩溃的记录后，赶紧去查看到了build.gradle中multiDexEnabled选项，果然是true，处于打开状态，然后看了本App的Application竟然并没有继承自`MultiDexApplication`，在`Application`的onCreate的方法中也没有调用`MultiDex.install(this)`, 这也就难怪在4.4中出现这个崩溃了，因为貌似这个崩溃只出现在 api<21 的情况下, 因为我平时的开发机都是8.0的系统，所以这个问题一直没有暴露出来, 直到将这个App安装在用户的机器上，崩溃出现了，这个问题解决起来其实很简单，要么将本App的Application继承自`MultiDexApplication`, 要么在Application中的onCreate中调用`MultiDex.install(this)`。就是这么简单,那这么简单的一个问题为什么要专写一篇来记录呢？其实也是因为这次这个内测阶段的crash的问题很典型，它就是在开发工程中被忽略，或者现有环境没有覆盖到，导致崩溃出现在了用户的机器上，其实这类问题是可以在发布版本前就能避免的，算是一次很好的教训。 解决方案再明确下:

* 方法一 

```
TestApplcation extends MultiDexApplication {


}


```

* 方法二

```
TestApplcation extends Application {

    @Override
	public void onCreate() {
		super.onCreate();

        MultiDex.install(this);
    }

}

```




