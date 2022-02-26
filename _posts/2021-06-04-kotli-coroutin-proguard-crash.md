---
layout: post
cover: false
title: 升级Kotlin版本导致的coroutine崩溃ANR小记
date:   2021-06-04 14:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true

---

最近公司的项目在最新的版本中升级了kotlin版本，使用CI打包后的版本启动都或闪退，或ANR，看崩溃日志和ANR日志，矛头都指向了coroutine，并且Release版本崩溃而Debug版本没有问题，初步断定就是混淆的问题了。因此搜索相关Proguard rules，在Kotlin官方Github中找到coroutines.pro文件:

```

# Allow R8 to optimize away the FastServiceLoader.
# Together with ServiceLoader optimization in R8
# this results in direct instantiation when loading Dispatchers.Main
-assumenosideeffects class kotlinx.coroutines.internal.MainDispatcherLoader {
    boolean FAST_SERVICE_LOADER_ENABLED return false;
}

-assumenosideeffects class kotlinx.coroutines.internal.FastServiceLoaderKt {
    boolean ANDROID_DETECTED return true;
}

-keep class kotlinx.coroutines.android.AndroidDispatcherFactory {*;}

# Disable support for "Missing Main Dispatcher", since we always have Android main dispatcher
-assumenosideeffects class kotlinx.coroutines.internal.MainDispatchersKt {
    boolean SUPPORT_MISSING return false;
}

# Statically turn off all debugging facilities and assertions
-assumenosideeffects class kotlinx.coroutines.DebugKt {
    boolean getASSERTIONS_ENABLED() return false;
    boolean getDEBUG() return false;
    boolean getRECOVER_STACK_TRACES() return false;
}

```
添加此混淆规则后重新打包，崩溃和ANR成功修复。


