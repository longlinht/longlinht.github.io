---
layout: post
cover: false
title: 解决SharedPreferences导致的ANR
date:   2019-07-09 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---


这几天在Google Play的ANR实时报告中看到很多貌似与SharedPreferences相关的ANR，看了历史版本后发现，这个已经是一个老问题了，在历次版班的ANR中居高不下。今天实在忍不了，决定对这个问题一探究竟。

```

 at java.lang.Object.wait! (Native method)
- waiting on <0x0a351954> (a java.lang.Object)
  at java.lang.Thread.parkFor$ (Thread.java:1220)
- locked <0x0a351954> (a java.lang.Object)
  at sun.misc.Unsafe.park (Unsafe.java:299)
  at java.util.concurrent.locks.LockSupport.park (LockSupport.java:158)
  at java.util.concurrent.locks.AbstractQueuedSynchronizer.parkAndCheckInterrupt (AbstractQueuedSynchronizer.java:810)
  at java.util.concurrent.locks.AbstractQueuedSynchronizer.doAcquireSharedInterruptibly (AbstractQueuedSynchronizer.java:970)
  at java.util.concurrent.locks.AbstractQueuedSynchronizer.acquireSharedInterruptibly (AbstractQueuedSynchronizer.java:1278)
  at java.util.concurrent.CountDownLatch.await (CountDownLatch.java:203)
  at android.app.SharedPreferencesImpl$EditorImpl$1.run (SharedPreferencesImpl.java:366)
  at android.app.QueuedWork.waitToFinish (QueuedWork.java:88)
  at android.app.ActivityThread.handleServiceArgs (ActivityThread.java:3029)
  at android.app.ActivityThread.access$2200 (ActivityThread.java:155)
  at android.app.ActivityThread$H.handleMessage (ActivityThread.java:1450)
  at android.os.Handler.dispatchMessage (Handler.java:102)
  at android.os.Looper.loop (Looper.java:175)
  at android.app.ActivityThread.main (ActivityThread.java:5430)
  at java.lang.reflect.Method.invoke! (Native method)
  at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run (ZygoteInit.java:726)
  at com.android.internal.os.ZygoteInit.main (ZygoteInit.java:616)

```

这事Google Play提供的堆栈信息，信息非常有限，但是还是能观察到SharedPreferences的身影的，这个 ``` waitToFinish ``` 非常可疑，追踪到代码:

````
/**
 * Finishes or waits for async operations to complete.
 * (e.g. SharedPreferences$Editor#startCommit writes)
 *
 * Is called from the Activity base class's onPause(), after
 * BroadcastReceiver's onReceive, after Service command handling,
 * etc. (so async work is never lost)
 */
public static void waitToFinish() {
    Runnable toFinish;
    while ((toFinish = sPendingWorkFinishers.poll()) != null) {
        toFinish.run();
    }
}

```

这个方法的注释已经很清楚了，如果我们使用SharedPreference的apply方法, 虽然该方法可以很快返回， 并在其它线程里将键值对写入到文件系统， 但是当Activity, BroadcastReceiver和Service的一些回调方法被调用时，会等待写入到文件系统的任务完成，如果写入比较慢，主线程就会出现ANR问题。

另外，SharedPreference除了提供apply外还提供commit方法，源码如下所示，该方法直接在调用线程中执行，不会转入后台，但如果我们在UI线程commit，且磁盘写入较慢的情况下，ANR依然会发生。行文至此，问题应该描述的比较清楚了，可以理解为SharedPreferences的机制导致系统组件回调过程中的阻塞，触发了ANR。可以将这个问题视为Android一个bug，也可以将问题归咎于为使用SharedPreferences不当(在SharedPreferences里读写数据量太大), 但是问题终究要解决，所以下面提出解决方案，并且记录下解决过程中的实践经验。

* 方案一

考虑启动一个线程commit，不使用apply

* 方案二

Hook ActivityThread，拿到Handler变量，在调用QueuedWork.waitToFinish()之前，将其中保存的队列清空，防止ANR的发生

* 方案三

使用MMKV替代SharedPrferences

最后我们选用了第三种方案，对于我们现有的代码改动量最小。第一种方案可行，但是也有问题，会有线程同步，仍然需要管理其他线程，保证读写的一致性。第二种方案不好验证它的副作用，因此也没有采纳。

选用MMKV后也有一个问题需要解决，那就是数据迁移，因为不可能针对之前所有使用SharedPreferences的地方逐一进行迁移，因此写了一个MMKV的封装类来统一对外提供数据迁移和读写的接口，可以实现对现已代码最小改动的情况下完成替换和迁移。封装类如下:

```


public class SharedPreferencesStore {
    public static final String TAG = SharedPreferencesStore.class.getSimpleName();

    private MMKV mMMKV;

    private SharedPreferencesStore(MMKV mmkv) {
        mMMKV = mmkv;
    }

    // 初始化，必须在使用前调用
    public static void initialize(Context context) {
        String rootDir = MMKV.initialize(context);
        ApplicationDelegate.log(TAG + " MMKV root directory=" + rootDir);
    }

    // 获取全局SharedPreferencesStore, 不需要迁移老的SharedPreferences数据的情况下调用
    public static SharedPreferencesStore getGlobal() {
        MMKV mmkv = MMKV.defaultMMKV();
        return new SharedPreferencesStore(mmkv);
    }

    // 获取全局SharedPreferencesStore, 需要迁移老的SharedPreferences数据的情况下调用
    public static SharedPreferencesStore getGlobalWithMigration(Context context) {
        MMKV mmkv = MMKV.defaultMMKV();
        importFromDefaultSharePreferences(mmkv, context);
        return new SharedPreferencesStore(mmkv);
    }

    // 获取特定SharedPreferencesStore, 不需要迁移老的SharedPreferences数据的情况下调用
    public static SharedPreferencesStore getByName(final String name) {
        MMKV mmkv = MMKV.mmkvWithID(name);
        return new SharedPreferencesStore(mmkv);
    }

    // 获取特定SharedPreferencesStore, 需要迁移老的SharedPreferences数据的情况下调用
    public static SharedPreferencesStore getByNameWithMigration(Context context, final String name) {
        MMKV mmkv = MMKV.mmkvWithID(name);
        importFromSharePreferences(mmkv, context, name);
        return new SharedPreferencesStore(mmkv);
    }

    // 需要多进程访问, 不需要迁移老的SharedPreferences数据的情况下调用
    public static SharedPreferencesStore getMultiProcessByName(final String name) {
        MMKV mmkv = MMKV.mmkvWithID(name, MMKV.MULTI_PROCESS_MODE);
        return new SharedPreferencesStore(mmkv);
    }

    // 需要多进程访问, 需要迁移老的SharedPreferences数据的情况下调用
    public static SharedPreferencesStore getMultiProcessByNameWithMigration(Context context, final String name) {
        MMKV mmkv = MMKV.mmkvWithID(name, MMKV.MULTI_PROCESS_MODE);
        importFromSharePreferencesMultiProcess(mmkv, context, name);
        return new SharedPreferencesStore(mmkv);
    }

    public void put(final String key, boolean value) {
        mMMKV.encode(key, value);
    }

    public boolean getBoolean(final String key, boolean defValue) {
        return mMMKV.decodeBool(key, defValue);
    }

    public void put(final String key, int value) {
        mMMKV.encode(key, value);
    }

    public int getInt(final String key, int defValue) {
        return mMMKV.decodeInt(key, defValue);
    }

    public void put(final String key, long value) {
        mMMKV.encode(key, value);
    }

    public long getLong(final String key, long defValue) {
        return mMMKV.decodeLong(key, defValue);
    }

    public void put(final String key, float value) {
        mMMKV.encode(key, value);
    }

    public float getFloat(final String key, float defValue) {
        return mMMKV.decodeFloat(key, defValue);
    }

    public void put(final String key, double value) {
        mMMKV.encode(key, value);
    }

    public double getDouble(final String key, double defValue) {
        return mMMKV.decodeDouble(key, defValue);
    }

    public void put(final String key, final String value) {
        mMMKV.encode(key, value);
    }

    public String getString(final String key, final String defValue) {
        return mMMKV.decodeString(key, defValue);
    }

    public void put(final String key, final byte[] value) {
        mMMKV.encode(key, value);
    }

    public byte[] getBytes(final String key) {
        return mMMKV.decodeBytes(key);
    }

    public Map<String, ?> getAll() {
        return mMMKV.getAll();
    }

    public void remove(final String key) {
        mMMKV.remove(key);
    }

    public void removeForKey(final String key) {
        mMMKV.removeValueForKey(key);
    }

    public void removeForKeys(final String[] keys) {
        mMMKV.removeValuesForKeys(keys);
    }

    public boolean contains(final String key) {
        return mMMKV.contains(key);
    }

    public boolean containsKey(final String key) {
        return mMMKV.containsKey(key);
    }

    public SharedPreferences.Editor edit() {
        return mMMKV.edit();
    }

    public static void importFromSharePreferences(MMKV mmkv, final Context context, final String name) {
        if (null == context) {
            return;
        }
        SharedPreferences sp = context.getSharedPreferences(name, Context.MODE_PRIVATE);
        doImport(mmkv, sp, name);
    }

    public static void importFromSharePreferencesMultiProcess(MMKV mmkv, final Context context, final String name) {
        if (context == null) {
            return;
        }
        SharedPreferences sp = context.getSharedPreferences(name, Context.MODE_MULTI_PROCESS);
        doImport(mmkv, sp, name);
    }

    public static void importFromDefaultSharePreferences(MMKV mmkv, final Context context) {
        if (context == null) {
            return;
        }
        SharedPreferences sp = PreferenceManager.getDefaultSharedPreferences(context);
        doImport(mmkv, sp, context.getPackageName() + "_preferences");
    }

    private static void doImport(MMKV mmkv, SharedPreferences sp, final String name) {
        ApplicationDelegate.log(TAG + " ------" + name + "-----SharedPreferences迁移开始-----------");
        if (sp.getAll() == null || sp.getAll().size() == 0) {
            ApplicationDelegate.log(TAG + " " + name + " SharedPreferences 为空，不需要迁移");
            return;
        }

        int oldSize = sp.getAll().size();
        ApplicationDelegate.log(TAG + " old size: " + oldSize);

        Map<String, ?> map = sp.getAll();

        Map<String, String> keyTypes = new HashMap<>();

        ApplicationDelegate.log(TAG + " ---old data: ");
        for (Map.Entry<String, ?> entry : map.entrySet()) {
            Object obj = entry.getValue();
            if (obj instanceof Boolean) {
                keyTypes.put(entry.getKey(), "Boolean");
            } else if (obj instanceof Integer) {
                keyTypes.put(entry.getKey(), "Integer");
            } else if (obj instanceof Long) {
                keyTypes.put(entry.getKey(), "Long");
            } else if (obj instanceof Float) {
                keyTypes.put(entry.getKey(), "Float");
            } else if (obj instanceof Double) {
                keyTypes.put(entry.getKey(), "Double");
            } else if (obj instanceof String) {
                keyTypes.put(entry.getKey(), "String");
            }
            ApplicationDelegate.log(TAG + " key: " + entry.getKey() + " value: " + entry.getValue());
        }


        int imported = mmkv.importFromSharedPreferences(sp);
        ApplicationDelegate.log(TAG + " imported size: " + imported);

        if (BuildConfig.DEBUG) {
            ApplicationDelegate.log(TAG +  " ---imported data: ");

            String[] keys = mmkv.allKeys();
            for (int i = 0; i < keys.length; i++) {

                String type = keyTypes.get(keys[i]);
                if (type == null) {
                    continue;
                }

                switch (type) {
                    case "Boolean":
                        ApplicationDelegate.log(TAG + " key: " + keys[i] + " value: " + mmkv.decodeBool(keys[i]));
                        break;
                    case "Integer":
                        ApplicationDelegate.log(TAG + " key: " + keys[i] + " value: " + mmkv.decodeInt(keys[i]));
                        break;
                    case "Long":
                        ApplicationDelegate.log(TAG + " key: " + keys[i] + " value: " + mmkv.decodeLong(keys[i]));
                        break;
                    case "Float":
                        ApplicationDelegate.log(TAG + " key: " + keys[i] + " value: " + mmkv.decodeFloat(keys[i]));
                        break;
                    case "Double":
                        ApplicationDelegate.log(TAG + " key: " + keys[i] + " value: " + mmkv.decodeDouble(keys[i]));
                        break;
                    case "String":
                        ApplicationDelegate.log(TAG + " key: " + keys[i] + " value: " + mmkv.decodeString(keys[i]));
                        break;
                    default:
                        ApplicationDelegate.log(TAG + " key: " + keys[i] + " value: unknown type");
                        break;
                }
            }
        }


        if (imported > 0 && oldSize == imported) {
            sp.edit().clear().apply();
        }

        if (oldSize != imported) {
            ApplicationDelegate.log(TAG + " SharedPreferences 迁移失败, name=" + name);
            ApplicationDelegate.bugTrace(ApplicationDelegate.MAIN_CODE_MMKV_IMPORT_FAIL, 0,
                    "name=" + name + ", old size=" + oldSize + ", import size=" + imported);
        }
        ApplicationDelegate.log(TAG +  " ------" + name + "-----SharedPreferences迁移结束-----------");
    }
}

```

这次替换和迁移目前已经上线验证 ，目前只发现在API 19的机器上出现崩溃，报java.lang.UnsatisfiedLinkError，MMKV的官网上有次问题的解答，可以参考解决。







