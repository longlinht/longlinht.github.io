---
layout: post
cover: false
title: 使用Booster解决ANR的实践
date:   2021-01-24 14:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true

---

SharedPreferences一直备受诟病，不论是因为开发者的不当使用还是其自身的问题，SharedPreferences都给开发者造成了不少困扰, 尤以ANR最甚。面对由SharedPreferences引起的ANR，我们通常的做法是引入MMKV来替代SP，规避SP本身的缺陷。但是MMKV虽然可以解决App自身由于使用SP导致的ANR，但是无法解决App中第三方库使用SP导致的ANR，因此，虽然MMKV性能优秀，可做数据迁移，久经验证，依然不能彻底解决SP的问题。因此需要考虑其他解决方案，后来找到了滴滴开源的Booster项目，算是找到一个相对彻底的解决方案。

Booster是什么? 请注意，和著名的C++库Boost没半毛钱关系，且看官方介绍:

>Booster 通过 Gradle Plugin 的形式为 Android 工程质量把控提供了一套完整的框架，无论是代码、资源、动态库、依赖关系、包体积、性能等监控，都可以通过 Booster 来完成

简单理解，Booster就是一个Gradle插件，但它不是一个简单的plugin，而是一个框架，提供了诸多不同功能的模块，可按需在项目构建的时候注入不同的功能模块。下面就以使用Booster SharedPreferences功能模块解决SP相关ANR为例来介绍Booster的基本用法:

1. 添加依赖，apply插件:

```

allprojects { project ->
    buildscript {
        ext.booster_version = '3.1.0'
        repositories {
            mavenLocal()
            google()
            mavenCentral()
            jcenter()
            maven { url 'https://oss.sonatype.org/content/repositories/public' }
        }
        dependencies {
            classpath "com.didiglobal.booster:booster-gradle-plugin:$booster_version"
            // 使用SharedPreferences功能模块
            classpath "com.didiglobal.booster:booster-transform-shared-preferences:$booster_version"
        }
    }
    repositories {
        mavenLocal()
        google()
        mavenCentral()
        jcenter()
        maven { url 'https://oss.sonatype.org/content/repositories/public' }
    }
    project.afterEvaluate {
        if (project.extensions.findByName('android') != null) {
            project.apply plugin: 'com.didiglobal.booster'
        }
    }
}

```

2. 添加到项目的构建流程中去

可以使用-I输入到构建流程中，也可将上述gradle脚本直接集成进project gradle文件，皆可达到目的。

```

// init.gradle即为上面的这段gradle脚本
./gradlew -I init.gradle :app:assembleDebug


```

在项目构建的过程中输入这段脚本，输出的apk就已使用Booster的SP模块来解决ANR了。使用起来是不是感觉非常简洁，接入很优雅，因为想使用Booster任何一个功能模块，只要简单的添加一句依赖即可，如SP:

```
// 使用SharedPreferences功能模块
classpath "com.didiglobal.booster:booster-transform-shared-preferences:$booster_version"

```

如此优雅的框架，是什么原理呢? 还以SP为例来简单聊聊:

根本的原理就是Booster通过 SharedPreferencesTransformer 将所有调用 Context.getSharedPreferences(String, int) 的指令替换成 ShadowSharedPreferences.getSharedPreferences(Context, String, int)，代码如下：

```
public class ShadowSharedPreferences {

    public static SharedPreferences getSharedPreferences(final Context context, String name, final int mode) {
        if (TextUtils.isEmpty(name)) {
            name = "null";
        }
        return BoosterSharedPreferences.getSharedPreferences(name);
    }

    public static SharedPreferences getPreferences(final Activity activity, final int mode) {
        return getSharedPreferences(activity.getApplicationContext(), activity.getLocalClassName(), mode);
    }

}
```

通过自定义 SharedPreferences 避开 QueuedWork 在 onPause(), onDestroy() 等生命周期回调时在主线程中的同步操作。如果对Booster有基本了解，对Booster这种指令替换的操作应该不陌生。如Booster在解决系统Bug的办法也是通过自定义类来替换有问题的系统类。如果我们使用Android Studio Profiler来查看我们App的内存情况，就可以搜到ShadowSharedPreferences类，此类就是系统SharedPreferences的替换类。

Booster还有其他强大的功能模块有待探索和使用，后续用到后再来聊！

