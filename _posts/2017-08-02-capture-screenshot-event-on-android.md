---
layout: post
cover: false
title:  捕获Android截屏事件
date:   2017-08-02 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

在Android平台上截屏事件没有对应的一个标准的事件和通知，所以应用App无法通过标准或统一的方式去捕获这个事件来满足自己的要求。
只能通过间接的方式捕获到这个事件，我因为要做一个微信的截屏图片分享的功能，所以对Android截屏事件做了一个调研，并且在开发中 
选用了其中的一种方式。 大体上，要解决这个问题，大概有以下几种方法，每种方法的可靠性和灵活性都不同。

#### 通过按键监听捕获截屏事件

这种方式最简单粗暴，但是存在两个巨大的麻烦，不易克服:

* Android机器厂商众多，ROM众多，多截屏按键的组合没有统一的标准，如果适配所有机型，几乎是无法完成的任务

* 事件准确捕获后，截屏这个动作完全结束时点需要应用自己去检查和获取

这两件事做起来都不容易，都很容易出错，所以这种方法基本上是四种办法里最不可靠的，基本不推荐这么做。


#### 通过监听系统截屏进程的运行和退出捕获截屏事件

这种方法需要有一个后台线程以一定的频率去检查系统截屏进程是否启动，运行，退出，并作出相应的逻辑，而这个频率其实很难把握，毕竟应用无法预期这个截屏动作，因此这种方法也不推荐，此种方法和上面的那种方法可能只适用于非常特定的场景。

#### 通过FileObserver间接捕获

这种方法其实是比较可靠和可控的，就是有一个问题, 一个FileObserver初始化的时候就得决定observe哪个目录，所以适配不同机型的过程就变成了适配所以可能的目录，这个是非常麻烦的事情，不过FileObserver总体来看是可以解决这个问题的，唯一比较难的就是要适配所有可能的机型对应的目录。最开始做这个功能的时候我实现了一版使用FileObserver的实现:

```java
public class ScreenshotObserver extends FileObserver {

  private static final String TAG = ScreenshotObserver.class.getSimpleName();
       private static final String PATH = Environment.getExternalStorageDirectory().toString() + "/Pictures/Screenshots/";

       private OnScreenshotTakenListener mListener;
       private String mLastTakenPath;

       public ScreenshotObserver(OnScreenshotTakenListener listener) {
            super(PATH, FileObserver.CLOSE_WRITE);
            mListener = listener;
       }

       @Override
       public void onEvent(int event, String path) {
            if (path==null || event!=FileObserver.CLOSE_WRITE)
                    Log.d(TAG, "Don't care.");
            else if (mLastTakenPath!=null && path.equalsIgnoreCase(mLastTakenPath))
                    Log.d(TAG, "This event has been observed before.");
            else {
                    mLastTakenPath = path;
                    File file = new File(PATH+path);
                    mListener.onScreenshotTaken(Uri.fromFile(file));
                    Log.d(TAG, "Send event to listener.");
            }
       }
  }

```

#### 通过ContentObserver间接捕获

这种方式算是目前最可靠，灵活性最好的方式了。实现起来先对其他几种方式要做的事也先对多一点，一下是我的实现，这个实现针对国内的一些手机做了适配，覆盖到了一些比较极端的情况:

```java

public class ScreenshotManager {

    private OnScreenshotTakenListener mListener;
    private String mLastTakenPath;
    private Context mContext;
    private Timer mCheckImageTimer;
    private int mCount = 0;

    /**
     * Internal storage observer
     */
    private ScreenshotObserver mInternalObserver;

    /**
     * External storage observer
     */

    private ScreenshotObserver mExternalObserver;

    private HandlerThread mHandlerThread;
    private Handler mContenHandler;


    private static final String[] MEDIA_PROJECTIONS =  {
            MediaStore.Images.ImageColumns.DATA,
            MediaStore.Images.ImageColumns.DATE_TAKEN,
    };

    private static final String[] KEYWORDS = {
            "screenshot", "screen_shot", "screen-shot", "screen shot",
            "screencapture", "screen_capture", "screen-capture", "screen capture",
            "screencap", "screen_cap", "screen-cap", "screen cap", "截屏"
    };


    public ScreenshotManager(Context context, OnScreenshotTakenListener listener) {
        mContext = context;
        mListener = listener;
        mLastTakenPath = getLastTakenPath();

        mHandlerThread = new HandlerThread("Screenshot_Observer");
        mHandlerThread.start();
        mContenHandler = new Handler(mHandlerThread.getLooper());

        mInternalObserver = new ScreenshotObserver(mContenHandler, MediaStore.Images.Media.INTERNAL_CONTENT_URI);
        mExternalObserver = new ScreenshotObserver(mContenHandler, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
    }

    public void startScreenshotObserver() {
        mContext.getContentResolver().registerContentObserver(
                MediaStore.Images.Media.INTERNAL_CONTENT_URI,
                false,
                mInternalObserver
        );
        mContext.getContentResolver().registerContentObserver(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                false,
                mExternalObserver
        );
    }

    public void stopScreenshotObserver() {
        mContext.getContentResolver().unregisterContentObserver(mInternalObserver);
        mContext.getContentResolver().unregisterContentObserver(mExternalObserver);
        releaseTimer();
    }

    private void handleMediaContentChange(Uri contentUri) {
        Cursor cursor = null;
        try {
            // 数据改变时查询数据库中最后加入的一条数据
            cursor = mContext.getContentResolver().query(
                    contentUri,
                    MEDIA_PROJECTIONS,
                    null,
                    null,
                    MediaStore.Images.ImageColumns.DATE_ADDED + " desc limit 1"
            );

            if (cursor == null) {
                return;
            }
            if (!cursor.moveToFirst()) {
                return;
            }

            // 获取各列的索引
            int dataIndex = cursor.getColumnIndex(MediaStore.Images.ImageColumns.DATA);
            int dateTakenIndex = cursor.getColumnIndex(MediaStore.Images.ImageColumns.DATE_TAKEN);

            // 获取行数据
            String data = cursor.getString(dataIndex);
            long dateTaken = cursor.getLong(dateTakenIndex);

            // 处理获取到的第一行数据
            handleMediaRowData(data, dateTaken);

        } catch (Exception e) {
            e.printStackTrace();

        } finally {
            if (cursor != null && !cursor.isClosed()) {
                cursor.close();
            }
        }
    }

    private void handleMediaRowData(String data, long dateTaken) {
        if (TextUtils.isEmpty(data))
            return;

        if (checkScreenShot(data, dateTaken)) {
            if (!data.equals(mLastTakenPath)) {
                mLastTakenPath = data;
                final File file = new File(data);
                if(null == BitmapFactory.decodeFile(file.getPath())) {
                    if (mCheckImageTimer == null) {
                        mCheckImageTimer = new Timer();
                    }
                    mCheckImageTimer.schedule(new TimerTask() {
                        @Override
                        public void run() {
                            if (mCount > 10) {
                                mCheckImageTimer.cancel();
                                mCheckImageTimer = null;
                                return;
                            }
                            Bitmap image = BitmapFactory.decodeFile(mLastTakenPath);
                            if(image != null) {
                                mListener.onScreenshotTaken(mLastTakenPath);
                                mCheckImageTimer.cancel();
                                mCheckImageTimer = null;
                                mCount = 0;
                            } else {
                                mCount++;
                            }
                        }
                    }, 0, 1000);
                } else {
                    mListener.onScreenshotTaken(mLastTakenPath);
                }
            }
            mLastTakenPath = data;
        }
    }

    private boolean checkScreenShot(String data, long dateTaken) {

        data = data.toLowerCase();
        // 判断图片路径是否含有指定的关键字之一, 如果有, 则认为当前截屏了
        for (String keyWork : KEYWORDS) {
            if (data.contains(keyWork)) {
                return true;
            }
        }
        return false;
    }

    private String getLastTakenPath() {
        Cursor cursor = null;
        String path = "";
        try {
            // 数据改变时查询数据库中最后加入的一条数据
            cursor = mContext.getContentResolver().query(
                    MediaStore.Images.Media.INTERNAL_CONTENT_URI,
                    MEDIA_PROJECTIONS,
                    null,
                    null,
                    MediaStore.Images.ImageColumns.DATE_ADDED + " desc limit 1"
            );

            if (cursor == null) {
                return "";
            }
            if (!cursor.moveToFirst()) {
                return "";
            }

            int dataIndex = cursor.getColumnIndex(MediaStore.Images.ImageColumns.DATA);
            int dateTakenIndex = cursor.getColumnIndex(MediaStore.Images.ImageColumns.DATE_TAKEN);

            path = cursor.getString(dataIndex);

            cursor = mContext.getContentResolver().query(
                    MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                    MEDIA_PROJECTIONS,
                    null,
                    null,
                    MediaStore.Images.ImageColumns.DATE_ADDED + " desc limit 1"
            );

            if (cursor == null) {
                return "";
            }
            if (!cursor.moveToFirst()) {
                return "";
            }

            dataIndex = cursor.getColumnIndex(MediaStore.Images.ImageColumns.DATA);
            int index = cursor.getColumnIndex(MediaStore.Images.ImageColumns.DATE_TAKEN);
            if (index > dateTakenIndex) {
                path = cursor.getString(dataIndex);
            }

        } catch (Exception e) {
            e.printStackTrace();

        } finally {
            if (cursor != null && !cursor.isClosed()) {
                cursor.close();
            }
        }
        return path;
    }

    private void releaseTimer() {
        if (mCheckImageTimer != null) {
            mCheckImageTimer.cancel();
            mCheckImageTimer = null;
        }
    }


    public interface OnScreenshotTakenListener {
        void onScreenshotTaken(String path);
    }

    private class ScreenshotObserver extends ContentObserver {
        private Uri mContentUri;
        public ScreenshotObserver(Handler handler, Uri contentUri) {
            super(handler);
            mContentUri = contentUri;
        }

        @Override
        public void onChange(boolean selfChange) {
            super.onChange(selfChange);
            handleMediaContentChange(mContentUri);
        }
    }
}

```

这种方式比起FileObserver有一个明显的不同，就是FileObserver得在截屏之前就得知道哪些目录需要监听，而ContentObserver则是在文件系统发生变化的时候去查特定的目录和存储位置，适配起来就相对灵活，只要枚举出这些目录即可。综上，ContentObserver应该是最优的一种实现方式。

