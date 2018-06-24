---
layout: post
cover: false
title: 记一次Android系统源代码技术分享
date:   2017-11-23 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

今年年后换了工作，决定继续做Android开发，到了公司一段时间后，受架构组同学之邀，做一次技术分享，当时感觉很头疼，因为我在Android技术组，如果分享这几年C++的技术经验，显然不合时宜，也对组里的同事没有什么帮助，如果分享Android应用的开发，貌似又在班门弄斧，自己在Android方面本来就是半路出家，实在没有什么可分享的干货，正在为难之际，突然想到在之前的公司有段时间一直在阅读Android系统源代码，一直试图能更深入的了解系统的结构和原理，因此也有了一些心得，正好可以与同事分享，也对大家的开发有所帮助，所以有了这篇小记。
   
这篇小记有点类似一个ppt，其实就是那次分享我用markdown格式写的一个ppt，是一个我要讲述的一个提纲，防止我讲跑题了。


### 如何概览？

* 要见代码 - 要了解如何通过源代码构建Android系统, 了解Android系统的一些基础设施

* 要读代码 - 通过阅读代码，理解Android系统的基本结构和特点

> Reading the fucking source code

#### 下载，编译和运行Android系统源代码

##### 工程环境

* 推荐Ubuntu系统

* Git

* Java SDK

* 依赖包

```
sudo apt-get install flex bison gperf libsdl-dev libesd0-dev libwxgtk2.6-dev build-essential zip curl
```

##### 下载Android系统源代码

* repo工具

* 参见Google官方文档

##### 编译Android系统源代码

**make it**

**哪有那么顺利，如果编译错误请Google错误信息，逐个解决之**

**编译成功后，会在out/target/product/generic/ 目录下生成多个img文件**

##### 运行Android模拟器

* 镜像文件 - zImage system.img userdata.img ramdisk.img

* 设置环境变量

* 运行模拟器

```
emulator
```

##### 下载，编译和运行Android内核源代码


#### JNI

* Java call Native

* Native call Java

* 静态注册

    * 先编写Java代码，然后编译生成.class文件
    
    * javah -o output packagename.classname

* 动态注册

> MediaScanner.java

```
private static native final void native_init()
```

> android_media_MediaScanner.cpp

```
static void android_media_MediaScanner_native_init(JNIEnv *env)

static JNINativeMethod gMethods[]
```

#### 天字号进程 - init

* Linux系统中用户空间的第一个进程

* 创建zygote

* 属性服务

> init.c

```
int main(int argc, char **argv)

void service_start(struct service *svc, const char *dynamic_args)

```

> parser.c

```
int parse_config_file(const char *fn)
```

> keywords.h

> init.rc

> builtins.c

```
int do_class_start(int nargs, char **args)
```

> property_service.c

```
void property_init(void)
```

> libc_init_dynamic.c

> system_properties.c

> properties.c

#### Java世界的盘古 - Zygote

* zygote - app_process

* apk程序，其父都是zygote

* startVm

* startReg

> app_main.cpp

```
int main(int argc, const char* const argv[])

```

> AndroidRuntime.cpp

```
void AndroidRuntime::start(const char* className, const bool startSystemSerever)
```

> ZygoteInit.java


```
public static void main(String argv[])

private static void registerZygoteSocket()

// preloaded-classes file
private static void preloadClasses()

private static void preloadResources() {

```

#### Zygot的嫡长子 -system_server

* Java世界半边天

* Java世界的核心Service都在这里启动

> dalvik_system_zygote.c

```
static void Dalvik_dalvik_system_Zygote_forkAndSpecialize(const u4* args, JValue* pResult)
    
static void Dalvik_dalvik_system_Zygote_forkSystemServer(const u4* args, JValue* pResult) 
 
static void setSignalHandler() 

static void sigchldHandler(int s)

```

> RuntimeInit.java

```
public static final void zygoteInit(String[] argv) throws ZygoteInit.MethodAndArgsCaller {
```

> System_Server.java

```
public static void main(String[] args) {

native public static void init1(String[] args);

public static final void init2() {

```
> com_android_server_SystemServer.cpp

```
static void android_server_SystemServer_init1(JNIEnv* env, jobject clazz)

```

> system_init.c

```
extern "C" status_t system_init()

```

> ActivityManagerService.java

```
private final void startProcessLocked(ProcessRecord app,

```

> Process.java

```
public static final int start(final String processClass,
                                  final String niceName,
                                  int uid, int gid, int[] gids,
                                  int debugFlags,
                                  String[] zygoteArgs)

private static int startViaZygote(final String processClass,
                                  final String niceName,
                                  final int uid, final int gid,
                                  final int[] gids,
                                  int debugFlags,
                                  String[] extraArgs)
                                  throws ZygoteStartFailedEx {

private static int zygoteSendArgsAndGetPid(ArrayList<String> args)
            throws ZygoteStartFailedEx {
```

> ZygoteConnection.java 

```
boolean runOnce() throws ZygoteInit.MethodAndArgsCaller {

```

#### 智能指针 - RefBase sp wp
