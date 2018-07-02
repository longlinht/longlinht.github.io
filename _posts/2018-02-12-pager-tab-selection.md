---
layout: post
cover: false
title: Android开发中标签指示器的选用
date:   2018-02-12 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---


在Android实际的开发过程中,几乎都会用到标签指示器和ViewPager的联动使用,ViewPager,毫无疑问就直接选用系统提供的, 但是和它联动的标签指示器就有非常多的选择, 我在开发的过程中使用了两个比较常见的实现,也是Github上star较多的两个项目.

### PagerSlidingTabTrip

基本使用:

* 添加依赖

```
implementation 'com.astuetz:pagerslidingtabstrip:1.0.1'

```


* 在布局文件中添加`PagerSlidingTabTrip`

```xml

<com.astuetz.PagerSlidingTabStrip
        android:id="@+id/tabs"
        android:layout_width="match_parent"
        android:layout_height="48dip"
        android:layout_gravity="center_horizontal"
        android:background="@color/tabsBackgroundColor"
        android:textColor="@color/tabsTextColor"
        app:pstsIndicatorColor="@color/tabsIndicatorColor"/>

```

在布局文件中设置`app:pstsShouldExpand="true"`会导致崩溃,原因是无法inflate,这个问题没有细究


* 初始化设置

```

tabs = contentView.findViewById(R.id.tabs);
tabs.setShouldExpand(true);  //在这里设置就没有问题
tabs.setIndicatorColorResource(R.color.fp_room_music_tab_indicator);
tabs.setIndicatorHeight((int)resources.getDimension(R.dimen.room_music_tab_indicator_height));
tabs.setAllCaps(false);
tabs.setTextSize((int)resources.getDimension(R.dimen.room_music_tab_text));

```

这个使用起来非常方便,但是有一两个问题:

* 指示器未选中项和选中项文字的颜色不能设置,这个不符合项目的要求

* 在布局文件中设置有些属性的时候不生效, 设置有些属性会导致崩溃(崩溃原因不确定)


因为上面的两个问题, 我最后在项目中选用了MagicIndicator


### MagicIndicator

MagicIndicator可以设置选中和未选中项文字的颜色,并且有些属性的设置相对灵活

基本使用:

* 添加依赖

```
implementation 'com.github.hackware1993:MagicIndicator:1.5.0'

```

* 在布局文件中添加

```
<net.lucode.hackware.magicindicator.MagicIndicator
            android:id="@+id/magic_indicator"
            android:layout_width="match_parent"
            android:layout_height="40dp"
            android:layout_below="@id/title"
            android:layout_marginTop="14dp"
            />

```

* 初始化

```

magicIndicator = contentView.findViewById(R.id.magic_indicator);
commonNavigator = new CommonNavigator(context);

```

* 数据绑定和属性动态设置

```

commonNavigator.setAdapter(new CommonNavigatorAdapter() {

          @Override
          public int getCount() {
              return mc == null ? 0 : mc.size();
          }

          @Override
          public IPagerTitleView getTitleView(Context context, final int index) {

              ColorTransitionPagerTitleView colorTransitionPagerTitleView = new ColorTransitionPagerTitleView(context);
              colorTransitionPagerTitleView.setNormalColor(resources.getColor(R.color.fp_room_music_tab_text));
              colorTransitionPagerTitleView.setSelectedColor(resources.getColor(R.color.fp_purple_1st));
              colorTransitionPagerTitleView.setText(mc.get(index).categoryName);
              colorTransitionPagerTitleView.setOnClickListener(new View.OnClickListener() {
                  @Override
                  public void onClick(View view) {
                      pager.setCurrentItem(index);
                  }
              });
              return colorTransitionPagerTitleView;
          }

          @Override
          public IPagerIndicator getIndicator(Context context) {
              LinePagerIndicator indicator = new LinePagerIndicator(context);
              indicator.setMode(LinePagerIndicator.MODE_MATCH_EDGE);
              indicator.setColors(resources.getColor(R.color.fp_purple_1st));
              return indicator;
          }
      });
      commonNavigator.setAdjustMode(true);
      magicIndicator.setNavigator(commonNavigator);
      
      // pager is a ViewPager
      ViewPagerHelper.bind(magicIndicator, pager);

```

其中的pager变量是一个ViewPager

MagicIndicator基本满足项目的全部要求,使用的过程中也没有发现什么问题.除了这两个,其他第三方的实现也非常多, 系统提供的TabLayout也同样能实现类似的功能,这里就不一一列举了.













