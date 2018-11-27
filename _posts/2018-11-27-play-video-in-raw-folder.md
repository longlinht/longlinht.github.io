---
layout: post
cover: false
title: 使用VideoView实现视频开屏页
date:   2018-11-27 17:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

今天PM提了一个视频开屏页的需求，需要在用户第一次使用时播放一个开屏视频，乍一看，挺简单一需求，但是也或多或少碰到了一些坑，也发现了Android资源编译的一个问题，本着研发之事无小事的原则，还是要记录下踩坑经验和发现的问题。整个实现过程一共两三个小时，逐步解决了以下问题:

#### 视频全屏

看到这个问题的第一反应就是把`VideoView` 的宽高设置为`match_parent`, 并且保证父容器也是`match_parent` 根布局, 但是事实没那么简单，视频播放后并没有完全全屏，在我的开发机上视频底部有一条细细的白边，很明显视频没有完全全屏。后来又想到设置`MediaPlayer`的视频缩放模式:

```

mPlayer.setVideoScalingMode(MediaPlayer.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING);


```

设置了两种模式以后都没有效果，这说明`VideoView`本身没有全屏，没有铺满整个屏幕，所以需要根据屏幕大小动态设置`VideoView`的尺寸，所以用自定义View实现。
自定义一个继承自`VideoView`的类来满足要求，具体实现如下:

```
public class FullScreenVideoView extends VideoView {
    public FullScreenVideoView(Context context) {
        super(context);
    }

    public FullScreenVideoView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public FullScreenVideoView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int width = getDefaultSize(0, widthMeasureSpec);
        int height = getDefaultSize(0, heightMeasureSpec);
        setMeasuredDimension(width, height);
    }
}

```
这样比较顺利的实现了全屏，接下来需要解决第二个问题:

#### 循环播放

这个比较容易，几乎就是一行代码，是对播放器的设置:

```
mBinding.vvSplash.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
    @Override
    public void onPrepared(MediaPlayer mp) {
        mPlayer = mp;
        mPlayer.setLooping(true);
        mPlayer.setVideoScalingMode(MediaPlayer.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING);
        mPlayer.start();

        mPlayer.setVideoScalingMode();
    }
});

```

第三个问题:

#### 音量切换

这个问题也比较简单，主要是对播放器的操作，虽然简单但是需要注意以下几个问题:

* 要保证操作的播放器一直是同一个
* 调用setVolume以后不需要再调用start
* 恢复音量时最好的方式是通过系统服务(AudioManager)去获取当前音量，但是这个需求只要设置为1就可以了

到此，问题都逐一解决了，最后需要记录下一个Android资源编译的问题，问题如下:

>我的工程目录res/drawable下有一个图片文件名为splash.png，开屏视频的MP4文件在res/raw下，名为splash.mp4，编译工程运行后一直报错：
>`无法播放此视频`

当时还以为我代码哪里写错了，检查发现没有错误，后来怀疑路径是不是错了，但断点调试也没问题，就很纳闷，后来拷贝了其它视频播放，发现是正常的，我才想到可能是资源文件名字冲突了，我给开屏视频文件重命名以后一切OK了，冲突在编译期间竟然没有报错，感觉有点坑，这样看来Android在编译资源时并没有区分res/drawable目录和res/raw目录，这个问题需要重视起来，不然会比较恼人。









