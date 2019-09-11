---
layout: post
cover: false
title: Android防空指南
date:   2019-09-06 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

最近集中进行了一段时间降低公司App崩溃率的工作，现在App的崩溃率控制在了万一与万三之间，整体来说还比较顺利，有必要将其中的方法和经验做一个沉淀。由于空指针异常导致的崩溃对App整体的崩溃率贡献巨大，日常的崩溃修复总是少不了几个空指针异常，虽然明显的空指针异常修复很容易，但是发出去的版本会持续崩溃，影响留存和体验，因此在积极修复空指针崩溃的同时也需要未雨绸缪，在开发阶段就把空指针拒之门外，对于事前防空的讨论非常多，也有大量的文章总结和分析这件事情，此文可能会提及这些讨论，但是主要还是总结我实践过的一些防空措施：

### 编写不空的代码

这个是基础，也是第一道防线，如果这一步没有做好，后面的一些措施可能负担更重。编写不空的代码其实就是要求我们在编写具体的方法和接口时尽量保证不返回null值，以及一些编程语言特性来避免空指针，也就是从根源上杜绝client代码不经意间去dereference一个空对象，具体的办法，或者说一些规约如下：

* 对于数组，比如Point，返回空对象，return new Point[0];
* 对于容器，比如ArraryList,返回空对象。如果需要泛型支持，retrun Collections.emptyList(); 如果不需要泛型支持，则 return Collections.EMPTY_LIST;
* 对于字符串String,返回空对象， return “”; 而不是return null;
* 这一条用语言不好表达，直接看代码

```
// wrong way - may cause NullPointerException
if (unknownObj.equals("unknownObj")) {
}
// right way - avoid NPE even if unknownObj is null
if ("unknownObj".equals(unknownObj) {
}

```
* 更加偏好使用valueOf()，而不是toString()
* 避免没有必要的boxing和unboxing
* 遵守约定，定义有意义的default(初始)对象
* 如果必须返回null值，则用@Nullable注解标注，并在Android Studio中打开此类注解的警告开关，如遇警告，积极修复此类警告后再继续编码。
* 进行双重入参校验
* 使用Java8新特性，Optional

以上这些措施需要在代码编写时真正去遵守和实践，长期坚持下来会有不错的效果。如果以上措施是事前，那下面的措施就算是事后防空屏障了。

### 通过静态检测工具检查编译阶段代码

在不胜其烦的修复了很多Bugly上的空指针以后，我决定一定要找出一个能在编译阶段就能发现空指针风险的办法，于是就想到了通过静态代码检测工具来做这个事情。最先想到的就是findbugs，还找到了一个叫SpotBug的插件，但是这两个插件都没有针对性，毕竟我最优先要解决的是空指针异常的问题。又开始重新找寻，最后找到了由Uber公司研发的Nullaway检查器，它需要配合ErrorProne插件一起使用。因为Nullaway在Gradle里的配置，github上的README有点语焉不详，至少下面两个问题就很让人疑惑:
* 那些配置语句到底写在project的build.gradle文件里还是app下的build.gradle？ （当然如果你的工程只有一个app模块的话不存在这个问题)
* 在多模块的情况下是否可以统一在project的build.gradle文件里配置，还是需要在每个模块里配置一遍？

所以我决定记录下我的采坑过程:  
#### 配置ErrorProne插件和Nullaway检查器

```
//build.gradle

buildscript {
    dependencies {
        classpath deps.gradlePlugin
        classpath deps.butterKnife
        classpath deps.wallePlugin
        classpath deps.sensorsPlugin
        
        classpath deps.realmPlugin

        // 配置ErrorProne插件和Nullaway检查器
        classpath deps.spotBugPlugin
        classpath deps.errorPronePlugin
    }
    repositories {
        google()
        jcenter()
    }
}


// check.gradle

apply plugin: 'net.ltgt.errorprone'
tasks.withType(JavaCompile) {
    // remove the if condition if you want to run NullAway on test code
    if (!name.toLowerCase().contains("test")) {
        // remove "-Xep:NullAway:ERROR" to have NullAway only emit warnings
        options.compilerArgs += ["-Xep:NullAway:WARN",
                                 //"-XepAllErrorsAsWarnings",
                                 "-XepExcludedPaths:.*/build/generated/.*",
                                 "-Xep:UnusedVariable:OFF",
                                 "-Xep:UnusedMethod:OFF",
                                 "-Xep:UnnecessaryParentheses:OFF",
                                 "-Xep:CatchAndPrintStackTrace:OFF",
                                 "-Xep:DefaultCharset:OFF",
                                 "-Xep:JdkObsolete:OFF",
                                 "-Xep:ClassCanBeStatic:OFF",
                                 "-Xep:MissingOverride:OFF",
                                 "-Xep:FragmentNotInstantiable:OFF",
                                 "-Xep:VariableNameSameAsType:OFF",
                                 "-Xep:FallThrough:OFF",
                                 "-Xep:FutureReturnValueIgnored:OFF",
                                 "-Xep:OperatorPrecedence:OFF",
                                 "-Xep:UndefinedEquals:OFF",
                                 "-Xep:RxReturnValueIgnored:OFF",
                                 "-Xep:StringSplitter:OFF",
                                 "-Xep:EqualsHashCode:OFF",
                                 "-Xep:EqualsGetClass:OFF",
                                 "-Xep:ComplexBooleanConstant:OFF",
                                 "-Xep:DoubleBraceInitialization:OFF",
                                 "-Xep:InconsistentCapitalization:OFF",
                                 "-Xep:HidingField:OFF",
                                 "-Xep:EqualsUnsafeCast:OFF",
                                 "-XepOpt:NullAway:AnnotatedPackages=com.inyuapp,io.liuliu"]
    }
}

// 因为我们的工程有很多个模块，因此我在每个module的build.gradle如下配置:

apply plugin: 'com.android.library'
apply from: '../../check.gradle'

```

这个配置之后基本就可以正常使用了，但是还是需要特别注意几个问题，也是我在集成的过程中踩过的坑:

* 在project的build.gradle中统一配置的方式会报Nullaway找不到的问题，这个目前无解，就只能通过在每个module分别配置，不过可以通过统一写一个check.gradle，在每个module的build.gradle中apply，如上
* 可以配置ErrorProne每个检查器的编译错误级别，分别有ERROR，WARN，OFF，如果某个检查器配置为ERROR级别，那么此检查器如果在代码中发现此类问题，就会导致整个build失败，如果对特定的错误很关注，可设为ERROR级别，限制处理完此类问题才能build成功。
* Nullaway检查器需要配置要检查的包，多个源代码包可通过”,"分割
* Nullaway的检查都是基于@Nullable注解，因此在类中的字段，方法返回值，入参上适当使用@Nullable才能使Nullaway检查器很好工作
* 此类代码不会通过Nullaway检查

```
if (ControllerHelper.getTopLineModel() != null) {
    ControllerHelper.getTopLineModel().setUserLifeShow(false);
    ControllerHelper.getTopLineModel().setCoinNumberShow(true);
}
```

在开启了ErrorProne和Nullable检查器后，公司的工程出现了大量无法通过检查器的代码，出现问题最多的错误如下：

```
dereferenced expression is @Nullable
```
而此类错误就是很多Bugly上空指针异常的罪魁祸首，需重点排查。

实际上Nullaway可以检查很多情况的问题，Nullaway的文档显示有诸如以下致空的情况：

* dereferenced expression is @Nullable
* returning @Nullable expression from method with @NonNull return type
* passing @Nullable parameter where @NonNull is required
* assigning @Nullable expression to @NonNull field
* method returns @Nullable, but superclass method returns @NonNull
* referenced method returns @Nullable, but functional interface method returns @NonNull
* parameter is @NonNull, but parameter in superclass method is @Nullable
* parameter is @NonNull, but parameter in functional interface method is @Nullable
* unbound instance method reference cannot be used, as first parameter of functional interface method is @Nullable
* initializer method does not guarantee @NonNull field is initialized / @NonNull field not initialized
* read of @NonNull field before initialization

现在公司的工程只开启了两个module作为试点，如果能有好的防空效果，会逐步应用到整个工程。目前的主要防空措施就是这些，当然在调研的过程中也引入了一个类似findbugs的工具SpotBug，此插件也已集成好，只要通过一个简单的命令即可开始一次检查

```
./gradlew check
```

检查的结果可以通过输出的本地html文件查看

用了这么多工具，又是插件，又是检查器，又是注解，说以前道一万，这些都是辅助措施，要真正减少空指针，降低崩溃率，还是要通过编写高质量的代码来实现，上面提到的那个代码片段，实在不能容忍，肯定要喷，必须要改，共勉！
