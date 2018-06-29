---
layout: post
cover: false
title: 多样式 TextView 小记
date:   2018-02-02 19:25:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---


所谓多样式 `TextView`, 就是在同一个 `TextView`中不同部分的text展示不同的颜色,字体大小,字体,字体Style,这种需求其实在很多App中都存在, 能够直接的给每一部分Text赋予不同的外观, 既可以在布局中少添加几个`TextView`, 也可以使以后需求变动后能够灵活的做出改动, 我在实际的开发中也经常碰到这种需求,很多次都是临时Google下, 实现了以后也就作罢了, 等后面又遇到的时候,貌似又记得不太清楚了, 又需要去查, 很没有效率, 所以写下这篇小记.

要想给TextView的不同部分设置不同的属性,通常有两种做法:

#### 使用SpannableString

这种方法需要用到`Spannable`借口, 一般做法如下:

```java

String text = "Hello World";
TextView tvTitle = new TextView(context);

Spannable spannable = SpannableString(text);

// set different text color
spannable.setSpan(new ForegroundColorSpan(context.getResouces().getColor(android.R.color.black)), 0, 5, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
spannable.setSpan(new ForegroundColorSpan(context.getResouces().getColor(android.R.color.white)), 5, text.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);

// set different background color
spannable.setSpan(new BackgroundColorSpan(android.R.color.black), 0, 5, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);

// set different text size
int largeSize = getResources().getDimensionPixelSize(R.dimen.larage);
int smallSize = getResources().getDimensionPixelSize(R.dimen.small);
spannable.setSpan(new AbsoluteSizeSpan(largeSize), 0, 5, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
spannable.setSpan(new AbsoluteSizeSpan(smallSize), 5, text.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);

// set relative size 
spannable.setSpan(new RelativeSizeSpan(2f), 0, 5, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);

// set different font style
spannable.setSpan(new StyleSpan(android.graphics.Typeface.ITALIC), 0, 5, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
spannable.setSpan(new StyleSpan(android.graphics.Typeface.BOLD), 5, text.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
tvTitle.setText(spannable);

```

使用`Spannable`接口还是比较灵活和已于理解的.

#### 使用Html Tags

`TextView`支持常见的Html tags来标记text的外观,一般做法如下：

```

TextView textview = new TextView(context);
textView.setText(Html.fromHtml("<b>" + title + "</b>" +  "<br />" + 
            "<small>" + description + "</small>" + "<br />" + 
            "<small>" + DateAdded + "</small>"));


```

例如也可以在strings.xml中这样定义:


```xml
<string name="my_text">
  <![CDATA[
    <b>Autor:</b> Tao<br/>
    <b>Contact:</b> myemail@gmail.com<br/>
    <i>Copyright © 2011-2012 </i>
  ]]>
</string> 

```
这样定义就比上面那种方式更好一点,可以对string资源统一管理, 当然了Html的这种方式支持很多其他的tag, 同样可以做到Spannable接口可以做到的, 这里就不一一列举了. 不过有一点需要注意, 就是在`setText`的时候要调用`Html.fromHtml`才生效. 这个主题琐碎,但对于工程师来说什么事不琐碎呢? 注意细节, 提高效率, 每次记录下一些需要反复使用到的技术点, 也是一种修行.
