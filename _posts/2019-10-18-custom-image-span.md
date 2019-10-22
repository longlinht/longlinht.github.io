---
layout: post
cover: false
title: ImageSpan的定制使用
date:   2019-10-18 20:54:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

最近在做一个具体业务需求时，为了实现UI设计的要求，需要实现在同一段文字中，有一段文字是需要有形状的背景色，有一段文字中还有网络图片的插入，如果要达到这两个要求，简单的使用SpannableStringBuilder肯定是达不到要求的，虽然SpannableStringBuilder可以设置背景色，但是并不能绘制形状，说白了就是只能设置颜色，不能设置文字的背景图片。想要在文字中插入图片，可以直接使用ImageSpan，但是ImageSpan并不能加载网络图片。因此这种简单的使用方式都是行不通的，需要考虑去定制ImageSpan实现我们特殊的要求。

* 实现给同一段文字的一部分文字区域设置背景图片

这个功能的实现还是要继承ImageSpan，将我们的背景图片传进去，并且override ImageSpan的draw方法，根据对文字区域的测量，分别绘制出背景和文字。实现代码如下:

```
// BgImageSpan

public class BgImageSpan extends ImageSpan {

    private int textSize = 20;
    private int color = Color.GRAY;
    private TextView mTextView;
    static float textboundhight;
    static float textY;
    String mText;

    public BgImageSpan(Drawable d, TextView tv, String text) {
        super(d);
        mTextView = tv;
        mText = text;
        textSize = (int) mTextView.getTextSize();
    }


    @Override
    public void draw(Canvas canvas, CharSequence text, int start, int end, float x, int top, int y,
                     int bottom, Paint paint) {

        String str = mText;
        Rect bounds = new Rect();
        paint.setTextSize(textSize);
        paint.getTextBounds(str, 0, str.length(), bounds);
        int textHeight = bounds.height();
        int textWidth = bounds.width();

        getDrawable().setBounds(0, top, (int)(bounds.width() * 1.3) , bottom);
        super.draw(canvas, str, start, end, x, top, y, bottom, paint);
        paint.setColor(mTextView.getTextColors().getDefaultColor());
        paint.setTypeface(Typeface.create("normal", Typeface.NORMAL));

        Rect bounds1 = getDrawable().getBounds();

        float textX = x + bounds1.width() / 2 - bounds.width() / 2;
        if (textboundhight == 0) {
            textboundhight = bounds.height();
            textY = (bounds1.height()) / 2 + textboundhight / 2;
        }
        canvas.drawText(str, textX, textY, paint);
    }
}

```

使用方法和ImageSpan并没有什么区别:

```

String username = "用户名：";
String message = "哈哈，我是一个天才";

SpannableStringBuilder ssb = new SpannableStringBuilder(username);
ssb.append(message);

Rect bounds = new Rect();
Paint paint = mContent.getPaint();
paint.getTextBounds(username, 0, username.length(), bounds);

Drawable bgDrawable = getDrawable(R.drawable.round_rect);
bgDrawable.setBounds(0, 0, (int)(bounds.width() * 1.3), bounds.height());

ImageSpan nameBgSpan = new BgImageSpan(bgDrawable, mContent, username);
ssb.setSpan(nameBgSpan, 0, username.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);

ForegroundColorSpan contentColorSpan = new ForegroundColorSpan(Color.parseColor("#ffc800"));
ssb.setSpan(contentColorSpan, username.length(), username.length() + message.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);

mContent.setText(ssb);
mContent.postInvalidate();

```

使用代码需要注意一下几点:

1. 传给BgImageSpan的Drawable需要设置Bounds，然后再传进去，否则可能会出现字符重叠的问题。
2. 如果设置了Bounds还有字符重叠错乱的问题，可以调用TextView的postInvalidate重绘。


* 第二种实现同一段文字的一部分文字区域设置背景图片

这种实现的思路很简单，就是通过inflate一个单独的布局，然后用这个inflate好的view生成图片，然后传给一个ImageSpan，即可完成，代码如下:

```
View view = LayoutInflater.from(this).inflate(R.layout.container, null);
TextView textView = view.findViewById(R.id.tv_value);
textView.setText(username);

view.measure(View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
        View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED));
view.layout(0, 0, view.getMeasuredWidth(), view.getMeasuredHeight());
view.buildDrawingCache();
Bitmap bitmap = view.getDrawingCache();

ImageSpan nameBgSpan = new ImageSpan(this, bitmap);
ssb.setSpan(nameBgSpan, 0, username.length(), Spanned.SPAN_EXCLUSIVE_INCLUSIVE);

```

* 实现一段文字中插入网络图片

插入网络图片和插入本地图片其实没有本质区别，要插入网络图片，就得先获取到网络图片后再设置到ImageSpan中去。代码如下：

```
String url = "http://img2.imgtn.bdimg.com/it/u=1467875646,1039972052&fm=26&gp=0.jpg";
RequestOptions options = new RequestOptions()
        .dontAnimate()
        .diskCacheStrategy(DiskCacheStrategy.NONE);

Glide.with(this)
        .load(url)
        .apply(options)
        .into(new CustomTarget<Drawable>() {
            @Override
            public void onResourceReady(@NonNull Drawable resource, @Nullable Transition<? super Drawable> transition) {
                if (resource instanceof BitmapDrawable) {
                    resource.setBounds(0, 0, 50, 50);

                    ImageSpan iconSpan = new ImageSpan(resource);
                    ssb.setSpan(iconSpan, username.length(), username.length() + 2, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);

                    mContent.setText(ssb);
                    mContent.postInvalidate();
                }
            }

            @Override
            public void onLoadCleared(@Nullable Drawable placeholder) {

            }
        });

```

使用起来需要注意的问题和上面的BgImageSpan相同，也是先要设置Drawable的Bounds。

虽然这两个实现看起来也没有什么难度，但是还是需要把这种解决过的，不那么常规的方法记录下来，以后遇到同样的问题可节省很多调研和调试的事件。
