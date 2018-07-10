---
layout: post
cover: false
title: 处理Gradle plugin版本问题小记
date:   2018-02-14 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

在编译Github上一些Android项目的时候, Gradle sync 总会抛出这样的一个提示:


>Configuration on demand is not supported by the current version of the Android Gradle plugin since you are using Gradle version 4.6 or above. Suggestion: disable configuration on demand by setting org.gradle.configureondemand=false in your gradle.properties file or use a Gradle version less than 4.6.


导致编译不能进行下去, 即使你将`org.gradle.configureondemand=false`设置了,  或者使用低版本的Gradle, 这个问题依旧存在.确实很恼人.但是问题终究要解决, 最后在网上找到了解决办法: **并不需要降级Gradle**, 两步解决:

1. 从gradle.properties 删除 org.gradle.configureondemand.

2. 在 Android Studio中,
如果是 Mac, `Preferences > Build, Execution, Deployment > Compiler` 去掉 the configure on demand 选中.
如果是 Linux/Windows  `File > Settings > Build, Execution, Deployment > Compiler` and uncheck the configure on demand.

 










