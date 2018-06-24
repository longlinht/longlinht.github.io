---
layout: post
cover: false
title: Userful command line in Android development 
date:   2016-07-09 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---
## 

Over the years, these are the Android development tools I’ve found most useful. I consistently use these tools to build apps. I recommend you take a look at them and see whether they’re a good fit for your tool chain.

#### View SQLite log

```
adb shell setprop log.tag.SQLiteLog V
adb shell setprop log.tag.SQLiteStatements V

```

#### Tcpdump packet capture

```
adb shell /data/local/tcpdump -i any -p -s 0 -w /sdcard/capture.pcap

```

#### View Signature

```
keytool -list -v -keystore release.jks

```

#### View Important System Log Tag

```
// View Acitivity switch
adb logcat -v time | grep ActivityManager
// View Crash info 
adb logcat -v time | grep AndroidRuntime
// View Dalvik info
adb logcat -v time | grep "D\/Dalvik"
// View art info
adb logcat -v time | grep "I\/art"

```
#### View application running time

```
adb logcat -v time | grep TAG

```

#### View sytem service and status

```
// SERVICE maybe activity, cpuinfo, window, meminfo, alarm, statusbar, usagestatus
dumpsys | grep "DUMP OF SERVICE"

```

#### Bugreport command

```
adb bugreport > main.log

```

#### Monkey parameters

```
adb shell monkey -p -s 1000 --ignore-crashes --ignore-timeouts --ignore-security-exceptions --pct-trackball 0 --pct-nav 0 --pct-majornav 0 --pct-anyevent 0  -v --throttle 300 1200000000 

```



