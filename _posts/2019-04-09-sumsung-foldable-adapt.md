---
layout: post
cover: false
title: 三星折叠屏适配小计
date:   2019-04-09 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

三星要在近期发布折叠屏手机，消息一出，我们就得抓紧做适配，也没有什么现成的经验作参考，尤其令人头疼的是还没有真机供我们测试。没办法，兵来将挡，水来土掩，进过一周多的调研和开发，终于做完了大部分App页面的适配工作，也因为做这个适配的过程踩了很多坑，特写下这篇小记。

在我们开始做适配前，首先要解决没有真机可做测试的问题，无法验证适配的效果，还好三星也想到了这个问题，在官网提供了一个模拟器应用，Foldable Emulator， 通过这个模拟器App可以在Fold和Unfold模式之间自由切换，验证适配效果。当我们适配工作结束后在真机上测试时发现，这个模拟器的仿真度极高，基本没有出现和真机上效果有出入的地方。

在解决了没有真机的问题之后，我们就开始着手真正的适配工作。首先遇到的问题就是折叠屏手机需要在Fold和Unfold之间频繁切换，而这种切换的效果和横竖屏切换是一样的，默认都会导致Activity重建，而Activity重建又会导致一系列的连锁反应，如需要恢复大量数据、重新建立网络连接或执行其他密集操作，因此在适配前就需要规划哪些页面(Activity)需要重建，哪些不需要重建，所以需要按Activity是否重建这两种情况来分析切屏的后果和应对方法。

* 重建Activity

因配置变更而引起的完全重启可能会给用户留下应用运行缓慢的体验。 此外，依靠系统通过onSaveInstanceState() 回调保存的 Bundle，可能无法完全恢复 Activity 状态，因为它并非设计用于携带大型对象（例如位图），而且其中的数据必须先序列化，再进行反序列化，这可能会消耗大量内存并使得配置变更速度缓慢。 在这种情况下，如果 Activity 因配置变更而重启，则可通过保留 Fragment 来减轻重新初始化 Activity 的负担。当 Android 系统因配置变更而关闭 Activity 时，不会销毁已标记为要保留的 Activity 的片段。 可以将此类片段添加到 Activity 以保留有状态的对象。
要在运行时配置变更期间将有状态的对象保留在片段中，请执行以下操作：

* 扩展 Fragment 类并声明对有状态对象的引用
* 在创建片段后调用 setRetainInstance(boolean)
* 将片段添加到 Activity
* 重启 Activity 后，使用 FragmentManager 检索片段

例如，按如下方式定义片段：

```
public class RetainedFragment extends Fragment {
 
    // 想要保存的数据
    private MyDataObject data;
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 保存这个fragment
        setRetainInstance(true);
    }
    public void setData(MyDataObject data) {
        this.data = data;
    }
 
    public MyDataObject getData() {
        return data;
    }
}

```

然后，使用 `FragmentManager` 将片段添加到 `Activity`。在运行时配置变更期间再次启动 `Activity` 时，可以获得片段中的数据对象。 例如，按如下方式定义 Activity：

```
public class MyActivity extends Activity {
    private RetainedFragment retainedFragment;
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
        // 在activity重启后，获取保留的fragment
        FragmentManager fm = getFragmentManager();
        retainedFragment = (RetainedFragment) fm.findFragmentByTag(“data”);
        // 首次创建
        if (retainedFragment == null) {
            // 添加fragment
            retainedFragment = new RetainedFragment();
            fm.beginTransaction().add(retainedFragment, “data”).commit();
            // 从网络获取data
            retainedFragment.setData(loadMyData());
        }
        // retainedFragment.getData()获取的数据可用
        ...
    }
 
    @Override
    public void onDestroy() {
        super.onDestroy();
        // store the data in the fragment
        retainedFragment.setData(collectMyLoadedData());
    }
}

```
 
onCreate() 添加了一个片段或恢复了对它的引用。此外，onCreate() 还将有状态的对象存储在片段实例内部。

>尽管Fragment内部可以存储任何对象，但是切勿传递与 Activity 绑定的对象，例如，Drawable、Adapter、View 或其他任何与 Context 关联的对象。否则，它将泄漏原始 Activity 实例的所有视图和资源。


* 不重建Activity

如果想不重新启动的情况下处理配置更改，则需要在清单中添加一个android：configChanges属性，例如：

```
<activity
    android:name="......CMVideoPlayerActivity"
    android:configChanges="screenSize|smallestScreenSize|screenLayout"
/>
```

需要手动更新视图布局并在onConfigurationChaged（）中重新加载资源

```

@Override
public void onConfigurationChanged(Configuration newConfig) {
   super.onConfigurationChanged(newConfig);
   if ((newConfig.screenLayout & Configuration.SCREENLAYOUT_LONG_MASK) == Configuration.SCREENLAYOUT_LONG_YES) {

   }
   if ((newConfig.screenLayout & Configuration.SCREENLAYOUT_LONG_MASK ) == Configuration.SCREENLAYOUT_LONG_NO) {

   }
}

```

在遵循上述基本原则以后，就要应对实际的适配问题了，整个适配的工作主要涉及以下几个问题的解决:

#### 检测设备是否可折叠,当前是Fold状态还是Unfold，并且能够在切屏时通知到需要对切屏事件作出处理的页面

为了统一解决这个问题，设计了一个单例类来统一管理

```

public class FoldObserable extends Observable {

    public static final int SCREEN_LARGE_WIDTH = 1536;

    public static final int SCREEN_LARGE = 0;
    public static final int SCREEN_SMALL = 1;

    private static class SINGLE {
        public static FoldObserable INSTANCE = new FoldObserable();
    }

    private FoldObserable() {
        String model = android.os.Build.MODEL;
        if (model.contains("SM-F9000")) {
            canFlod = true;
            if (isLargeScreen()) {
                screenType = SCREEN_LARGE;
            } else {
                screenType = SCREEN_SMALL;
            }
        }
    }
    //大屏无statusbar 小屏有statusbar，根据此来判断是是否减bar
    private int screenType;
    private boolean canFlod;

    public static FoldObserable getInstance() {
        return SINGLE.INSTANCE;
    }

    public void setScreenType(int screenType) {
        this.screenType = screenType;
        setChanged();
        notifyObservers();
    }

    public int getScreenType() {
        return screenType;
    }

    /**
     * 是否是折叠屏
     * @return
     */
    public boolean getCanFlod() {
        return canFlod;
    }

    private boolean isLargeScreen() {
        WindowManager wm = (WindowManager) BloodEyeApplication.getInstance().getSystemService(Context.WINDOW_SERVICE);
        Display display = wm.getDefaultDisplay();
        Point pp = new Point();
        display.getSize(pp);
        return pp.x == FoldObserable.SCREEN_LARGE_WIDTH;
    }
}

```

因为要通过这个单例还通知需要响应切屏事件的页面，所以需要在App的所有Activity基类的onConfigurationChanged中调用setScreenType来通知所有的观察者，这些观察者就是需要相应切屏事件的Activigty和Fragment。代码如下:

```
@Override
public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    if (FoldObserable.getInstance().getCanFlod()) {
        UiProcessTask.updateScreenSize();
        boolean isLargeScreen = isLargeScreen();
        if (isLargeScreen) {
            FoldObserable.getInstance().setScreenType(FoldObserable.SCREEN_LARGE);
        } else {
            FoldObserable.getInstance().setScreenType(FoldObserable.SCREEN_SMALL);
        }
    }
}

```

将需要响应切屏的页面注册为观察者:

```
@Override
public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    FoldObserable.getInstance().addObserver(this);
}

@Override
public void onDestroy() {
  super.onDestroy();
  FoldObserable.getInstance().deleteObserver(this);
}

// 处理切屏事件
@Override
public void update(Observable o, Object arg) {
  if (o instanceof FoldObserable) {
      mAdapter.notifyDataSetChanged();
  }
}

```

#### 处理实际的可能因为各种原因导致的适配问题

经过模拟器的测试发现App种有很多页面在Fold和Unfold切换后出现适配问题，总结起来有如下几种情况:

* 代码中为了提高测量和绘制View的性能，缓存了屏幕的宽度，导致一些用了屏幕宽度的地方使用了切换前的屏幕宽度的旧值，导致宽度适配错误。

解决方法：在屏幕切换的时候更新缓存

* 有些没有重建的页面，RecyclerView的Adapter在Fold和Unfold切换以后没有重新回调onBindView，导致Item的大小适配错误。

解决方法: 在屏幕切换时手动调用Adapter的notifyDataSetChanged()去刷新列表

* 布局xml文件中写死了一些控件的宽度，导致适配问题

解决方法：尽量不要使用写死的值，推荐使用match_parent + margin或padding来应对这种情况

* 在切屏时未能及时更新与界面宽高相关的全局变量

解决办法: 在Application的onConfigurationChanged中更新相关变量

```
public static void updateScreenSize() {

}


// 在Application中调用
@Override
public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    updateScreenSize();
}

```

在适配的过程中具体的问题可能都不一样，但是都跑不出这几类，只要抓住本质，一般都能得到很好的解决。比较麻烦的适配工作可算搞完了，第二天就得到三星跳票的消息，也是服气！










