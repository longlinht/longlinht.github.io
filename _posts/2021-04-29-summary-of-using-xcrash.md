---
layout: post
cover: false
title: xCrash运用小结
date:   2021-04-29 14:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true

---

公司在做海外产品，由于免费版firebase对native崩溃的捕获上报能力有限(无堆栈，无具体上下文信息)，因此对我们定位和降低native极为不利，当native崩溃总量进入top行列的时候，就不能对其视而不见了，因此我开始调研解决方案，最后决定接入爱奇艺推出的xCrash来捕获native崩溃，当然了，xCrash本身是不具备上报功能的，它只是将崩溃信息写入tombstone文件。因此需要在其基础之上添加上报功能。

要实现上报功能，就需要选择一个上报时机，在崩溃发生时或App再次启动时，我选择了在崩溃发生时即时上传tombstone文件，并与服务端约定上报协议，最终实现可在firebase后台通过设备ID来查看上传到服务器的tombstone文件。

具体实现如下：

在崩溃发生的回调中找到最新的tombstone文件，打包上传至服务器

```

public void init(Context context) {
    XCrash.init(context, new XCrash.InitParameters()
            .setAppVersion(BuildConfig.VERSION_NAME)
            .setLogDir(getCrashDir().getAbsolutePath())
            .setJavaRethrow(true)
            .setJavaLogCountMax(3)
            .setJavaDumpAllThreadsWhiteList(new String[]{"^main$", "^Binder:.*", ".*Finalizer.*"})
            .setJavaDumpAllThreadsCountMax(0)
            .setNativeRethrow(true)
            .setNativeLogCountMax(3)
            .setNativeDumpAllThreadsWhiteList(new String[]{"^Signal Catcher$", "^Jit thread pool$", ".*(R|r)ender.*", ".*Chrome.*"})
            .setNativeDumpAllThreadsCountMax(0)
            .setAnrRethrow(true)
            .setAnrLogCountMax(3)
            .setPlaceholderCountMax(0)
            .setLogFileMaintainDelayMs(1000)
            .setLogger(mLogger)
            .setLibLoader(new ILibLoader() {
                @Override public void loadLibrary(String libName) {
                    try {
                        ReLinker.loadLibrary(context, libName);
                    } catch (Exception e) {
                        printLog(e + " | " + libName);
                        System.loadLibrary(libName);
                    }
                }
            }).setAnrCallback(new ICrashCallback() {
                // ANR发生时的回调
                @Override public void onCrash(String logPath, String emergency) throws Exception {
                    catchANRLogDelay();
                }
            }).setJavaCallback(new ICrashCallback() {

                // Java崩溃发生时的回调
                @Override public void onCrash(String logPath, String emergency) throws Exception {
                    catchCrashLog();
                }
            }).setNativeCallback(new ICrashCallback() {
               //Native崩溃发生时的回调
                @Override public void onCrash(String logPath, String emergency) throws Exception {
                    catchCrashLog();
                }
            })
    );
}


// 打包上传tombstone文件
private void catchCrashLog() {
    crashZipId = generateCrashId();
    final File out = new File(AppInstances.getPathManager().getTmpFilePath() + crashZipId + ".gzip");

    try {
        List<File> files = Arrays.asList(getCrashDir().listFiles());
        if (ListUtils.isEmpty(files)) {
            return;
        }

        File crashFile = null;
        long lastModified = 0;
        for (File f : files) {
            if (f.lastModified() > lastModified) {
                lastModified = f.lastModified();
                crashFile = f;
            }
        }

        if (crashFile != null) {
            GZIPUtils.gzipFile(crashFile.getAbsolutePath(), out.getAbsolutePath());
        }

    } catch (Throwable e) {
        e.printStackTrace();
    }

    upload();
    try {
        Thread.sleep(5000);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
}

```
上面的代码有一点需要注意: 为了尽可能将崩溃日志成功上传至服务器，主线程sleep五秒，对于anr的情况则是在非UI线程中上传日志。

日志上传成功后，就可以在firebase的崩溃列表中查看某一个崩溃，在数据一栏找到设备ID来查询。因为我们有运营后台可以将设备ID和用户ID关联，因此就可以轻松查到每个用户的崩溃日志。

此即时上报的方案上线后虽然助力定位到了一些问题，但也有如下缺陷和问题

* 引入了新的问题，如OOM，ANR等问题。

* 由于上报依赖于全局的OkHttp Client，因此如果App在没有初始化OkHttp Client的情况下崩溃，则不会上报，就属漏报了。

* 崩溃和anr不能即时聚合到一处供查看

* ANR目前不能查询，但是已尝试使用firebase Event上报，但是貌似免费版无法查看Event的字段，上报的意义不大，后期考虑向服务端上报。

问题2和3其实可以很容易改善，但是问题1还有待进一步观察，同期因为我们代码的原因引入了一个严重的OOM问题，所以不太确定是不是xCrash受到了影响和牵连。这个OOM问题修复后准备再打开xCrash进一步验证。

目前观察到一个现象，Android 7以下的机器基本都没有成功上报，比较奇怪，但是本地测试Android 4的机器是可以上报的，此问题后续有待验证。
