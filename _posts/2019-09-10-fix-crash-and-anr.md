---
layout: post
cover: false
title: 修复崩溃ANR小记 
date:   2019-09-10 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

最近一直在集中精力解决Bugly的崩溃，到现在基本上把可以解决的已经都解决完了，剩下的都是一些特定系统版本和特定机型的崩溃，暂时没有太好的思路去排查，其中系统4.4版本的崩溃尤为特殊，有几个崩溃几乎都只出现在4.4版本的机器上，这些特定版本和特定机型的问题暂不谈论，下面来小结一下最近成功解决过的一些崩溃和ANR。

* 复写父类方法要当心，注意父类的方法约定(崩溃)

```
# main(1)
java.lang.NullPointerException
Attempt to invoke virtual method 'android.graphics.Rect android.graphics.drawable.Drawable.getBounds()' on a null object reference
1 android.text.style.DynamicDrawableSpan.getSize(DynamicDrawableSpan.java:78)
2 android.text.TextLine.handleReplacement(TextLine.java:813)
3 android.text.TextLine.handleRun(TextLine.java:908)
4 android.text.TextLine.measureRun(TextLine.java:387)
5 android.text.TextLine.measure(TextLine.java:277)

...

暂略

```
堆栈太长，底下的暂略，这个崩溃乍一看，没啥线索，崩到了系统类DynamicDrawableSpan，然后就看工程中有没有用到DynamicDrawableSpan，果然发现我们的类EmojiTextSpan继承了这个类，那可以缩小问题范围了，从崩溃处逆推调用栈，可以发现我们的类复写了：

```
private Drawable getCachedDrawable() {
    if (mDrawableRef == null || mDrawableRef.get() == null) {
        mDrawableRef = new WeakReference<Drawable>(getDrawable());
    }
    return mDrawableRef.get();
}

```

而DynamicDrawableSpan的方法实现如下:

```
private Drawable getCachedDrawable() {
    WeakReference<Drawable> wr = mDrawableRef;
    Drawable d = null;

    if (wr != null) {
        d = wr.get();
    }

    if (d == null) {
        d = getDrawable();
        mDrawableRef = new WeakReference<Drawable>(d);
    }

    return d;
}

```

很明显我们的类做了一个蠢事，其实不用去复写父类的方法，反而不会有问题，这个问题的根本原因是我们没有详细了解这个类，至少是没有了解这个方法的约定。只要删除我们的复写方法即可解决问题。当然，系统代码也不严谨，drawable在调用getBounds方法时没有判空。

* 主线程切不可进行IO操作(ANR)

```
public class GameBgmService extends Service {

    ...
    ...

    @Override
    public void onCreate() {
        super.onCreate();
        ...
        ...

        PathUtil.findAllKV(BGM_PATH, mBgmMap);
    }
}

```

根据ANR的堆栈，可以追踪到是

```

PathUtil.findAllKV(BGM_PATH, mBgmMap);

```
的调用导致了ANR，而这个方法是一个典型的IO操作，而这种操作不应该在系统组件的生命周期方法里调用。解决方法也很简单，就是将这种操作放到子线程去。

* 有时需要频繁IO操作，可考虑建立内存缓存，避免ANR

这个ANR和上面的类似，也是要进行一个IO操作，并且和上面不一样的是，这个操作需要同步进行，不能异步，因此我们采取建立内存缓存的方式来解决。这个IO操作其实是通过解析文件中的json，创建出一个对象列表返回，而这个操作在App进入首页的时候就在子线程中操作过一次，但是并没有在这个时机去建立内存缓存，因此这个问题的最简单解决方式就是建立内存缓存，在之前需要IO操作的地方直接操作内存，并且保证文件和内存的内容一致即可。

* 使用RxJava需要注意Backpressure(崩溃)

```
# main(1)

io.reactivex.exceptions.MissingBackpressureException

Can't deliver value 9440 due to lack of requests

1 io.liuliu.music.repair.CrashUtil$Up1Throwable:io.reactivex.exceptions.OnErrorNotImplementedException: The exception was not handled due to missing onError handler in the subscribe() method call. Further reading: https://github.com/ReactiveX/RxJava/wiki/Error-Handling | io.reactivex.exceptions.MissingBackpressureException: Can't deliver value 9440 due to lack of requests
2 io.liuliu.music.repair.CrashUtil.lambda$initRxCrash$0(CrashUtil.java:160)
3 ......
4 Caused by:
5 io.reactivex.exceptions.MissingBackpressureException:Can't deliver value 9440 due to lack of requests
6 io.reactivex.internal.operators.flowable.FlowableIntervalRange$IntervalRangeSubscriber.run(FlowableIntervalRange.java:117)
7 io.reactivex.internal.schedulers.ScheduledDirectPeriodicTask.run(ScheduledDirectPeriodicTask.java:38)
8 java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:458)
9 java.util.concurrent.FutureTask.runAndReset(FutureTask.java:307)
10 java.util.concurrent.ScheduledThreadPoolExecutor$ScheduledFutureTask.run(ScheduledThreadPoolExecutor.java:302)
11 java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1167)
12 java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:641)
13 java.lang.Thread.run(Thread.java:784)

```

这个崩溃根据堆栈可追溯到RxJava中的intervalRange操作符，工程中有多处使用，找到一个典型使用:

```
private void startCountDown(String order, String text, long time) {
    if (time > 0) {
        if (mDisposable != null && !mDisposable.isDisposed()) {
            mDisposable.dispose();
            mDisposable = null;
        }
        mDisposable = Flowable.intervalRange(0, time + 1, 0, 1, TimeUnit.SECONDS)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(new Consumer<Long>() {
                    @Override
                    public void accept(Long aLong) throws Exception {
                        if (mKillerAreaTop != null) {
                            if (aLong == time) {
                                mKillerAreaTop.setText(String.format("【%s号】%s", order, text));
                            } else {
                                mKillerAreaTop.setText(String.format(Locale.CHINA,
                                        "【%s号】%s(%d)", order, text, time - aLong));
                            }
                        }
                    }
                });

    }
}

```
这个问题RxJava在GitHub上的issue已解决，添加流量控制，在调用intervalRange后紧接着调用onBackpressDrop即可。

* RxJava和ButterKnife混用时先clear disposable后unbind

```
# main(1)

java.lang.NullPointerException

Attempt to invoke virtual method 'void io.liuliu.music.widget.resource.ResourceView.setVisibility(int)' on a null object reference

1 io.liuliu.music.repair.CrashUtil$Up1Throwable:java.lang.NullPointerException: Attempt to invoke virtual method 'void io.liuliu.music.widget.resource.ResourceView.setVisibility(int)' on a null object reference
2 io.liuliu.music.repair.CrashUtil.lambda$initRxCrash$0(CrashUtil.java:160)
3 ......
4 Caused by:
5 java.lang.NullPointerException:Attempt to invoke virtual method 'void io.liuliu.music.widget.resource.ResourceView.setVisibility(int)' on a null object reference
6 io.liuliu.music.hall.hall.widget.UserInfoView$1.onStartDownload(UserInfoView.java:159)
7 io.liuliu.music.resource.GoodsResProvider.lambda$startEffect$3(GoodsResProvider.java:121)
8 io.liuliu.music.resource.-$$Lambda$GoodsResProvider$o_C6H-o_OQTCEa45A-3wRHNQygg.accept(Unknown Source:10)
9 io.reactivex.internal.observers.ConsumerSingleObserver.onSuccess(ConsumerSingleObserver.java:62)

......

```

看似一个很普通的一个崩溃，对这个View对象使用前判空就完事了，但是实际问题没那么简单，很多页面使用了这个机制，难道要每个页面的每个View在使用前都要判空吗？必须从机制上保证在RxJava的异步回调中View对象不为空，检查代码后发现的确是有这个保证的，就是在View要销毁时clear掉RxJava的异步回调，问题出在先后顺序上，写代码时并没有注意到这个先后顺序，unbind都在clear disposable之前，导致了这种崩溃有概率发生。

* Fragment has not been attached yet 崩溃

这个崩溃时因为Fragmegnt还没有Attach到Activity就调用了getChildFragmnetManager()导致，可通过添加isAdded判断，或在attach和detach时加一个标志来判断当前fragment的状态。


* 多线程没有同步导致的崩溃

这种问题比较常见了，虽然一个移动端App不需要很大量的并发，但是多个线程同时存在，并且操作共享变量的情况也不少，在这次修复崩溃的过程中就遇到很多例，都是因为对共享变量没有保护，导致其中一个线程已经把变量置空，而其他线程还在dereference这个变量而导致崩溃。这类问题，可根据实际情况采取不同的同步策略。

* 在UI线程中start，reset，release MediaPlayer导致的ANR

只要用到MediaPlayer的工程可能都避免不了这个问题吧，最好的解决办法就是将这些操作都放在一个非UI线程里，而把一些事件回调调度回UI线程，这样既不会有ANR，也将MediaPlayer的使用变得比较简单。典型的做法是对MediaPlayer进行封装，使用两个Handler和一个HandlerThread，将对MediaPlayer的操作都放在HandlerThread中，事件回调都通过其中一个Handler调度回主线程。

以上就是最近解决的一些典型的崩溃和ANR，作此小计，积跬步。


