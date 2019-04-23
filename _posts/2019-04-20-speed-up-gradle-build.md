---
layout: post
cover: false
title: 加速Gradle构建
date:   2019-03-09 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

  最近刚换工作，来这家新公司没几天，还在熟悉和适应阶段，leader也没安排什么特别的事情，只是说有空可以看看我们工程Gradle Build速度慢的问题。总算接到一个方向比较明确的任务，正好可以从工程的构建流程入手，可以一窥整个工程的结构和依赖。因为Gradle构建速度慢这个问题，其实有一些常见的排查方法，解决问题第一步，还是用最快的排查法，首先排除一些最常见的造成构建速度缓慢的原因。但是要找出构建速度慢的问题也需要将问题分情况来看，分两种情况，一种是在开发过程中的构建和正式发版上线的构建，这两种构建通常是相同的，但有时为了节约开发过程中的构建时间，会做一些特殊的设置和开启关闭一些选项来加速开发过程中的构建，因此，这两种情况面临的问题其实是类似的，因为还不是很清楚leader更在意的是开发过程中的构建时间还是发布上线的构建，因此我决定把这两种情况合二为一，罗列出所有的加速建议:
  
* 检查是否使用了最新的Android Gradle Plugin

当然了，这个排查不是硬性的，得看实际情况，但是如果能升到最新的插件版本，建议升级，随着插件的逐步完善，性能也会有很大提升

* 尽量少用Module

有技术博文称Module的构建时间可能是jar和aar的4倍（有待验证）

* 使用Property选项

在gradle.property文件中添加如下两行代码：

```
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true

// 这些值可以按实际情况设置
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

```

* 避免在 minSdkVersion < 21 时使用Multidex
  
* Disable Multi-APK(限开发中的构建)
  
如果你没有使用ABI或者Density splits， 你可以略过，如果你使用了，可以通过在Gradle文件里添加如下代码关闭这个选项，可以节省开发中的很多构建时间:

```
android {
   if (project.hasProperty(‘devBuild’)){
      splits.abi.enable = false
      splits.density.enable = false
   }
}

```

* 最小化打包资源(限开发中的构建)

在开发过程中，其实没必要打包所有App用到的资源，我们可以通过配置来控制开发构建中要打包的资源, 可在Gradle文件中加入如下代码:

```
productFlavors {
  development {
    minSdkVersion 21
    //only package english translations, and xxhdpi resources   
    resConfigs (“en”, “xxhdpi”)
  }
}

```
别小看这点改动，可能节省你很多开发中的构建时间

* Disable PNG 优化 

PNG优化是默认开启的，但是在开发中的构建没什么必要，建议关闭 :

```
android {
  if (project.hasProperty(‘devBuild’)){
    aaptOptions.cruncherEnabled = false
  }
}

```

* 使用Instant Run

虽然这个功能有时会有一些问题，但是在加速构建方面还是很有用的

* 避免很耗时的计算

```
def buildDateTime = new Date().format(‘yyMMddHHmm’).toInteger()
android {
  defaultConfig {
    versionCode buildDateTime
 }
}

```

这种代码在开发构建种就不要出现了， 因为每次构建都要重新一次额外的处理和打包，可以改为这样:

```

def buildDateTime = project.hasProperty(‘devBuild’) ? 100 : new Date().format(‘yyMMddHHmm’).toInteger()
android {
  defaultConfig {
    versionCode buildDateTime
 }
}

```

还有一个陷阱是Crashlytics build IDs, Crashlytics在每一次构建时都会产生一个新的id，一行代码就可将这个选项关闭:

```
apply plugin: ‘io.fabric’
android {
  buildTypes {
    debug {
      ext.alwaysUpdateBuildId = false
    }
  }
}

```

* 避免使用动态的依赖版本号

使用动态的依赖版本号会导致Gradle检查新的依赖版本，导致解析时间加长, 严重拖慢构建速度

* 开启Gradle Cache

```
org.gradle.caching=true

```

在将这些建议和排查方法逐一的排查验证了一遍以后，发现这些Tips公司的工程都已采纳，一些坑也都完美的躲过，要想在这种情况下再去加速Gradle的构建速度，可就没那么容易了，必须通过一些方法，细化整个构建过程，找出一些耗时过长的操作，幸运的是，Gradle已经提供了这种功能，可以输出一个Gradle构建的profile报告，只要在苟建时添加一个参数即可。

```
./gradlew :android:assembleDebug --profile

```
构建结束后会在build的子目录下生成一个html文件的报告：

![](https://wx2.sinaimg.cn/mw690/7033bf1dly1g295fu83jyj20lz0ccabp.jpg)

整个报告里面会比较详细的列出构建过程中Configuration，Dependency Resolution， Task Execution的具体耗时，非常详细和直观，有助于分析构建每个阶段的耗时。建议在分析构建过程的时候用起来。我就用这个选项也为公司的工程打了这样一份报告出来，并没有什么特别的发现，主要的耗时还好在app模块。那这样下去还是不能解决问题，因为我们的发布和上线构建是在Jekins上打包，看了打包脚本也并没有太多特殊的地方，于是我想到用Gradle build scan插件来进一步审视构建内部的情况。

为自己的工程创建build scan其实比较简单，具体步骤如下:

1. 在Project的build.gradle文件添加下面几行代码：

```
buildscript {
    repositories {
        google()
        jcenter()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:3.0.0'

        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}

// 这7行是添加的
plugins {
    id 'com.gradle.build-scan' version '1.16'
}
buildScan {                     
    licenseAgreementUrl = 'https://gradle.com/terms-of-service'
    licenseAgree = 'yes'
}

allprojects {
    repositories {
        google()
        jcenter()
    }
}

```

2. 在控制台执行命令 

```
./gradlew build --scan

```

3. 命令执行完后会给出一个网址，打开网址根据提示就可以得到相应的构建审核内容，如下图:

![](https://wx1.sinaimg.cn/mw690/7033bf1dly1g297i2yza3j20zh0ff41e.jpg)

经过这个插件工具的分析，也仍旧没有发现什么异常，看来公司的工程就是因为太大了，每个版本的自然增长导致当前的构建比很早一个版本的慢，虽然这次的调研没有提升打包速度，但是整个调研的构成让我了解了很多与Gradle有关的东西，也算是收获不少, 没有白忙活。
















  
  
  
