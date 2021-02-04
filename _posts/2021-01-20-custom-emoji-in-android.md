---
layout: post
cover: false
title: 在Android中定制Emoji的实现
date:   2021-01-15 14:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true

---

最近公司产品在评论输入中要加入定制emoji面板，因此趟了emoji这个浑水，现以此文记录期间踩过的坑和一些心得。要实现一个相对比较完善的emoji输入和显示的功能，需要解决两个主要的问题: 键盘和emoji表情的平滑切换和emoji的正确显示。前者其实和emoji本身不相关，因此放在后面讨论。先来探究定制emoji的实现方案。 

我们团队内部想到的最快的实现方案是定制googlefonts的NotoColorEmojiCompat.ttf, 使用EmojiCompact加载定制的ttf文件来显示我们定制的emoji。Google官方提供的NotoColorEmojiCompat的使用方法只有两种，一种方式是将NotoColorEmojiCompat.ttf文件放在assets目录，打入apk中使用，另一种方式是不打入apk，而是通过动态查询ContentProvider去查询获得，好处是不用将ttf文件打入apk包，坏处是查询到的ttf文件还是未定制的NotoColorEmojiCompat.ttf文件，实现不了定制的目的。我们的目标是在不打入这样一个7M的ttf文件的情况下实现定制目的，因此官方提供的这两种使用方式都不可取。因此就只剩下一条路，那就是app启动时下载我们定制的ttf文件，在EmojiCompat初始化时自己实现ttf的load过程，从而实现动态加载定制的emoji表情。

创建一个EmojiHelpler类来管理EmojiCompat的初始化和定制ttf的加载:

```

public class EmojiHelper {

    private static Context sContext;
    private static boolean sEmojiReady = false;

    public static void initCompat(Context context) {

        sContext = context;
        //EmojiCompat.Config config = new BundledEmojiCompatConfig(AppContext.get());
        EmojiCompat.Config config = new XLEmojiCompatConfig();

        config.setReplaceAll(true);
        config.registerInitCallback(new EmojiCompat.InitCallback() {
            @Override
            public void onInitialized() {
                super.onInitialized();
                Log.d("hetaod", "onInitialized");
                //XLog.d("onInitialized");
            }

            @Override
            public void onFailed(@Nullable Throwable throwable) {
                super.onFailed(throwable);
                Log.d("hetaod", "onFailed: " + throwable.getMessage());
                //XLog.printStackTrace(throwable);
            }
        });


        EmojiCompat.init(config);
    }

    public static CharSequence process(CharSequence text) {
        if (sEmojiReady) {
            return EmojiCompat.get().process(text);
        }
        return text;
    }

    private static class XLEmojiCompatConfig extends EmojiCompat.Config {
        XLEmojiCompatConfig() {
            super(new XLMetadataRepoLoader());
        }
    }

    private static class XLMetadataRepoLoader implements EmojiCompat.MetadataRepoLoader {

        @Override
        public void load(@NonNull EmojiCompat.MetadataRepoLoaderCallback loaderCallback) {
            //String filePath = sContext.getCacheDir().getAbsolutePath() + "/NotoColorrEmojiCompat.ttf";

            File file = new File("/sdcard/NotoColorEmojiCompat.ttf");
            FileInputStream fileInputStream = null;
            try {
                fileInputStream = new FileInputStream(file);
                loaderCallback.onLoaded(MetadataRepo.create(Typeface.createFromFile(file.getAbsolutePath()), fileInputStream));
            } catch (IOException e) {
                Log.d("hetaod", e.getMessage());
                //XLog.printStackTrace(e);
            } finally {
                //Util.safeClose(fileInputStream);
            }
        }
    }
}

```
加载定制ttf的关键是继承EmojiCompat和实现EmojiCompat.MetadataRepoLoader接口。在实现了初始化和加载定制ttf后，就剩最后一步，制作定制ttf文件，通过一些emoji的工具，可以轻松制作定制的emoji，我们的实现方式是使用未使用的unicode码来定义我们自己的emoji，在定制的ttf文件制作后以后，下载，初始化，加载，加载失败，卡在了加载这一步，我们定制的ttf文件加载失败，一直报如下的错误:

```
Cannot read metadata.

```

我们多次确认制作ttf的方法应该没有问题，但是仍旧加载失败，怀疑是Google做了限制，无法定制这个ttf文件，多次尝试无果后，我们放弃了这个方案。

放弃了上面这个方案后，我们选择了Github上的一个开源实现，简单易用，通过实现一个提供定制表情的provider就可以达到定制的目的。

Github地址: https://github.com/vanniktech/Emoji

使用方法：

1. 添加依赖：

```
implementation 'com.vanniktech:emoji:0.7.0'

```

2. 实现EmojiProvider接口:

```
//实现EmojiProvider接口
public class CocoEmojiProvider implements EmojiProvider {
    @Override @NonNull
    public EmojiCategory[] getCategories() {
        return new EmojiCategory[] {
                new SimpleCategory()
        };
    }
}


//emoji分类
public class SimpleCategory implements EmojiCategory {
    private static final CocoEmoji[] EMOJIS = CategoryUtils.concatAll(SimpleCategoryChunk0.get());

    @Override @NonNull
    public CocoEmoji[] getEmojis() {
        return EMOJIS;
    }

    @Override @DrawableRes
    public int getIcon() {
        return 0;
    }

    @Override @StringRes
    public int getCategoryName() {
        return 0;
    }
}


// 定制emoji列表定义
final class SimpleCategoryChunk0 {
    @SuppressWarnings("PMD.ExcessiveMethodLength") static CocoEmoji[] get() {
        return new CocoEmoji[] {
                new CocoEmoji(0x1F580, new String[]{"Hehe"}, 0, 0, false),
                new CocoEmoji(0x1F581, new String[]{"Mesume"}, 0, 1, false),
                new CocoEmoji(0x1F582, new String[]{"Ngenes"}, 0, 2, false),
                new CocoEmoji(0x1F583, new String[]{"Apaan sih"}, 0, 3, false),
                new CocoEmoji(0x1F584, new String[]{"Ngupil"}, 0, 4, false),
                new CocoEmoji(0x1F585, new String[]{"Bodo"}, 0, 5, false),
                new CocoEmoji(0x1F586, new String[]{"Berdoa"}, 0, 6, false),
                new CocoEmoji(0x1F588, new String[]{"Lempar tai"}, 0, 7, false),
                new CocoEmoji(0x1F589, new String[]{"Bengek"}, 0, 8, false),
                new CocoEmoji(0x1F58E, new String[]{"Jempol"}, 0, 9, false),
                new CocoEmoji(0x1F58F, new String[]{"tepuk tangan"}, 0, 10, false),
                new CocoEmoji(0x1F591, new String[]{"love"}, 0, 11, false),
        };
    }

    private SimpleCategoryChunk0() {
        // No instances.
    }
}

```

3. 在布局中使用支持emoji的控件:

```

<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:padding="10dp"
    android:orientation="horizontal">

    <com.vanniktech.emoji.EmojiTextView
        android:layout_width="match_parent"
        android:layout_height="30dp"
        android:id="@+id/quick_textview"
        android:textColor="@color/CO_T1"
        android:textSize="25sp"
        android:gravity="center_horizontal"
        />

</RelativeLayout>

```

在此方案中仍旧是使用未使用的unicode来定义我们定制的emoji，而不是去定一个固定形式的字符串来定义。因此存在兼容老版本的问题，因为我们app的老版本未使用任何定制emoji，这个问题我们目前是简单的通过服务端替换来解决。

解决了emoji的显示问题，就该着手解决emoji面板和键盘平滑切换的问题了。需要键盘和其他面板切换的输入场景下一般的解决方案是使用KPSwitch实现。但是KPSwitch切换界面在嵌入到一个单独的view里面后，切换时有跳闪，体验不是很好，所以这种方案虽然实现起来最快，但是不符合交互要求，所以首先pass，还有一个方案是把emoji面板，键盘都整体做到一个透明的Activity中，和app其他的业务逻辑分离，吊起键盘相当于启动一个透明的activity，和输入相关的功能逻辑都封装到activity中。这种方案虽然隔离性很好，也相对独立，但是需要管理生命周期的问题，对我们现有的输入功能改动较大，所以也pass。排除了两种可行的方案后，要想改动最小，又能实现平滑的体验，就需要做到两点:

1. 这个输入功能还是得实现为一个自定义View，而不是一个Activity，这样对现有代码改动最小，影响最小。
2. 要在不使用KPSwitch的情况下实现平滑切换。

第一个要求好实现，不在赘述。要实现第二个要求也不是那么难，关键点如下:

1. 自定义View的特殊布局
2. 关键的几个布局控制方法

先来看布局:

```

<LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        >

        <!--键盘弹起后上，屏幕剩余部分-->
        <View
            android:id="@+id/layout_input_empty"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1"
            />

        <!--键盘及其他交互UI部分-->
        <LinearLayout
            android:id="@+id/ll_bottom"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:focusable="true"
            android:clickable="true"
            android:focusableInTouchMode="true"
            android:gravity="center_vertical"

            >

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                >

                <cn.xiaochuankeji.zuiyouLite.widget.listener.FrameListenerLayout
                    android:id="@+id/publisher_top_listener"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_gravity="center_vertical"
                    android:paddingLeft="15dp"
                    android:paddingTop="5dp"
                    android:paddingRight="15dp"
                    android:background="@drawable/replay_comment_bg"
                    >

                    <RelativeLayout
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:gravity="center_vertical">

                        <cn.xiaochuankeji.zuiyouLite.widget.publisher.ReplaySomeoneTipView
                            android:id="@+id/replay_someone_tip_view"
                            android:layout_width="match_parent"
                            android:layout_height="wrap_content"
                            android:layout_marginTop="14dp"
                            android:layout_marginBottom="3dp"
                            android:visibility="gone" />


                        <cn.xiaochuankeji.zuiyouLite.widget.publisher.QuickReplayView
                            android:id="@+id/quick_replay_view"
                            android:layout_width="match_parent"
                            android:layout_height="wrap_content"
                            android:layout_below="@+id/replay_someone_tip_view"
                            android:layout_marginTop="11dp" />

                        <LinearLayout
                            android:id="@+id/edit_scroll"
                            android:layout_width="match_parent"
                            android:layout_height="wrap_content"
                            android:orientation="vertical"
                            android:background="@drawable/comment_edit_bg"
                            android:padding="8dp"
                            android:layout_below="@+id/quick_replay_view"
                            android:layout_toLeftOf="@+id/publisher_send_new"
                            android:layout_marginBottom="12dp"
                            >

                            <cn.xiaochuankeji.zuiyouLite.widget.publisher.PostCommentEditText
                                android:id="@+id/publisher_edit"
                                android:layout_width="match_parent"
                                android:layout_height="wrap_content"
                                android:background="@color/CO_B3"
                                android:hint="@string/comment_input_comment"
                                android:lineSpacingExtra="2.4dp"
                                android:maxLength="2000"
                                android:maxLines="3"
                                android:minLines="1"
                                android:textColor="@color/CO_T1"
                                android:textColorHint="@color/CO_T3"
                                android:textCursorDrawable="@drawable/cursor_yellow"
                                android:textSize="13sp" />
                            <!-- 选中的 视频/图片 文件列表 -->
                            <androidx.recyclerview.widget.RecyclerView
                                android:id="@+id/publisher_select_media_list"
                                android:layout_below="@+id/publisher_edit"
                                android:layout_width="wrap_content"
                                android:layout_height="match_parent"
                                android:layout_alignLeft="@+id/publisher_edit"
                                android:layout_alignRight="@+id/publisher_edit"
                                android:layout_marginTop="7dp"
                                android:visibility="gone" />
                        </LinearLayout>


                        <androidx.appcompat.widget.AppCompatImageView
                            android:id="@+id/publisher_send_new"
                            android:layout_width="24dp"
                            android:layout_height="24dp"
                            android:layout_marginLeft="15dp"
                            android:layout_alignBottom="@id/edit_scroll"
                            android:layout_marginBottom="4dp"
                            android:layout_alignParentRight="true"
                            android:background="@drawable/selector_chat_send" />


                        <androidx.appcompat.widget.AppCompatImageView
                            android:id="@+id/publisher_image_new"
                            android:layout_width="36dp"
                            android:layout_height="36dp"
                            android:paddingRight="12dp"
                            android:paddingBottom="12dp"
                            android:layout_below="@+id/edit_scroll"
                            android:src="@drawable/ic_comment_select_image" />

                        <androidx.appcompat.widget.AppCompatImageView
                            android:id="@+id/publisher_emoji"
                            android:layout_width="36dp"
                            android:layout_height="36dp"
                            android:layout_below="@+id/edit_scroll"
                            android:layout_toRightOf="@id/publisher_image_new"
                            android:paddingLeft="12dp"
                            android:paddingBottom="12dp"
                            android:src="@drawable/ic_comment_cocoemoji" />

                        <androidx.appcompat.widget.AppCompatImageView
                            android:id="@+id/publisher_at_new"
                            android:layout_width="36dp"
                            android:layout_height="36dp"
                            android:layout_below="@id/edit_scroll"
                            android:layout_toRightOf="@id/publisher_emoji"
                            android:layout_marginLeft="12dp"
                            android:paddingLeft="12dp"
                            android:paddingBottom="12dp"
                            android:src="@drawable/ic_comment_at" />

                    </RelativeLayout>


                </cn.xiaochuankeji.zuiyouLite.widget.listener.FrameListenerLayout>


                <!--emoji面板-->
                <FrameLayout
                    android:id="@+id/fl_bottom"
                    android:layout_width="match_parent"
                    android:layout_height="300dp"
                    android:background="#f5f7fa"
                    android:visibility="gone"
                    >
                    
                    <androidx.recyclerview.widget.RecyclerView
                        android:id="@+id/rv_emoji"
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:paddingTop="5dp"
                        android:paddingLeft="5dp"
                        android:paddingRight="5dp"
                        />
                    
                    <androidx.appcompat.widget.AppCompatImageView
                        android:id="@+id/iv_emoji_delete"
                        android:layout_width="54dp"
                        android:layout_height="40dp"
                        android:src="@drawable/ic_comment_delete"
                        android:scaleType="centerInside"
                        android:layout_gravity="bottom|right"
                        android:layout_marginRight="15dp"
                        android:layout_marginBottom="15dp"
                        android:shadowColor="#33000000"
                        android:shadowDx="3.0"
                        android:background="@drawable/emoji_delete_bg"
                        />


                </FrameLayout>

            </LinearLayout>
        </LinearLayout>
    </LinearLayout>

```

动态代码中几个关键的方法:

```

/**
  * 锁定内容View以防止跳闪
  */
public void lockContentViewHeight() {
    LinearLayout.LayoutParams layoutParams =
            (LinearLayout.LayoutParams) layout_input_empty.getLayoutParams();
    layoutParams.height = layout_input_empty.getHeight();
    layoutParams.weight = 0;
    layout_input_empty.requestLayout();
}

/**
  * 释放锁定的内容View
  */
public void unlockContentViewHeight() {
    postDelayed(() -> {
        LinearLayout.LayoutParams layoutParams =
                (LinearLayout.LayoutParams) layout_input_empty.getLayoutParams();
        layoutParams.height = 0;
        layoutParams.weight = 1;
        //rc_content.requestLayout();
        ll_bottom.requestLayout();
        //requestLayout();
    }, 200);
}


public void hideEmoji() {
    iv_emoji.setImageResource(R.drawable.ic_comment_cocoemoji);
    lockContentViewHeight();
    rv_emoji.setVisibility(View.GONE);
    fl_bottom.setVisibility(GONE);
    unlockContentViewHeight();
    presentStatus = PublisherStatus.文字编辑;
    emojiVisible = false;
}

public void showEmoji(boolean animate) {
    iv_emoji.setImageResource(R.drawable.ic_comment_keyboard);
    if (!animate) {
        lockContentViewHeight();
        rv_emoji.setVisibility(View.VISIBLE);
        fl_bottom.setVisibility(VISIBLE);
        unlockContentViewHeight();
    } else {
        rv_emoji.setVisibility(View.VISIBLE);
        fl_bottom.setVisibility(VISIBLE);
    }
    //UIUtils.hideSoftInput((Activity) getContext());
    AndroidPlatformUtil.hideSoftInput((Activity) getContext());
    presentStatus = PublisherStatus.EMOJI;
    emojiVisible = true;
}


```

如何调用：

```
private void onEmojiClick() {
    if (rv_emoji.getVisibility() == View.VISIBLE) {
        lockContentViewHeight();
        hideEmoji();
        unlockContentViewHeight();
        //UIUtils.showSoftInput(et_comment, getContext());
        AndroidPlatformUtil.showSoftInput(et_comment, getContext());
    } else {
        showEmoji(false);
    }
}

```

其实实现这个方案后，我也有点惊讶，KPSwitch那么复杂的逻辑，竟然可以简单的以这种方式实现。说明做一切事情都不可拘泥于过去成功的方案，应该大胆尝试新的方法，说不定就能收获到惊喜呢！

