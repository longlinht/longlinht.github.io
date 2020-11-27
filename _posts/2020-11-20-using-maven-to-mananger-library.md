---
layout: post
cover: false
title: Android module SDK化的实践
date:  2020-11-20 20:54:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

文章标题指的SDK化指的是将一个有多个module的Android工程中的特定module以aar的形式输出后被app模块依赖使用。那么如何在基本不改动代码的情况下实现这个要求，完成app模块对特定module的依赖呢?

最直接的想法就是把要SDK化的module输出为aar文件，然后在app模块添加对此aar文件的依赖。在解决完所有的编译错误以后，运行app后发生了crash，查看输出，是因为输出为aar的这个模块所依赖的一个类在运行时找不到，事实上就是这个远端依赖没有被打进apk包。很明显，直接输出aar然后依赖是不可行的。

远端依赖的类找不到，因为此module在输出为aar的时候并未将他的依赖打入aar包，那有没有办法将此module的所有依赖都打进aar包呢? 在线上搜索了一番后，还真找到了这样的一个gradle插件[fat-aar-android](https://github.com/kezong/fat-aar-android)来做这件事，接入到工程中很简单:


1. 应用插件

在project build gradle文件中加入如下代码:

```

buildscript {
    repositories {
        jcenter()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:xxx'
        classpath 'com.kezong:fat-aar:1.2.20'
    }
}

```

2. 使用插件关键字来嵌入依赖

将需要嵌入的依赖，修改implementation或api为embed

```
dependencies {
    implementation fileTree(dir: 'libs', include: '*.jar')
    // java dependency
    embed project(path: ':lib-java', configuration:'default')
    // aar dependency
    embed project(path: ':lib-aar', configuration:'default')
    // aar dependency
    embed project(path: ':lib-aar2', configuration:'default')
    // local full aar dependency, just build in flavor1
    flavor1Embed project(path: ':lib-aar-local', configuration:'default')
    // local full aar dependency, just build in debug
    debugEmbed (name:'lib-aar-local2',ext:'aar')
    // remote jar dependency
    embed 'com.google.guava:guava:20.0'
    // remote aar dependency
    embed 'com.facebook.fresco:fresco:1.11.0'
    // don't want to embed in
    // implementation is not recommended because the dependency may be different with the version in application, resulting in the R class not found.
    compileOnly 'com.android.support:appcompat-v7:27.1.1'
}

```

使用此插件除了会遇到资源冲突外，目前没有发现其他问题。但这个插件在github上的issue有点多，心里有点没底，所以还需要想其他的办法。

这两个方法被排除后，就想到用maven来管理依赖，更灵活，是更一般的做法。 将此module输出后上传到maven服务器，在app上添加对此module的远程依赖后，发现无法编译，找不到此module依赖中的类，这是因为没有在pom中添加依赖。将aar发布到maven和添加依赖配置的代码如下:

```
afterEvaluate {
    publishing {
        publications {
            release(MavenPublication) {
                artifact("$buildDir/outputs/aar/live-debug.aar") {
                    builtBy tasks.getByName("assembleDebug")
                }

                groupId = "com.overseas.android.live"
                artifactId = 'live'
                version = '1.0.8'

                pom.withXml {
                    def dependenciesNode = asNode().appendNode("dependencies")
                    configurations.compile.dependencies.forEach { dep -> addDependency(dependenciesNode, dep, "compile") }
                    configurations.api.dependencies.forEach { dep -> addDependency(dependenciesNode, dep, "compile") }
                    configurations.implementation.dependencies.forEach { dep -> addDependency(dependenciesNode, dep, "runtime") }
                }
            }
        }

        repositories {
            maven {
                url = uri("https://xxx/repository/android-release/")

                credentials {
                    username = "hetao"
                    password = "hetao"
                }
            }
        }
    }
}

```

在用maven管理依赖时需要注意一下几点:

* 需要关注发布的module是不是有远程依赖，有的话需要添加依赖配置

* 需要发布的module输出为debug版本，统一由app模块去做混淆

* 需要发布的module的混淆规则不能被遗漏，需要添加此配置:

```

defaultConfig {
    ...
    
    consumerProguardFiles 'proguard-rules.pro'
    
    ...

}

```

不然会有因为混淆而找不到类的问题。
