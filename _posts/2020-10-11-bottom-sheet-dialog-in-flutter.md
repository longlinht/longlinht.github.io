---
layout: post
cover: false
title: 在Flutter中实现一个类似Android中的BottomSheetDialog
date:   2020-10-11 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

从屏幕底部滑出的这种弹窗实在是太普遍的需求了，所以Flutter不可能不提供，一查文档，果然有一个API直接就可以调出Dialog: showModalBottomSheet, 这个API有很多入参，但是如果不需要对Dialog的外观和行为有特殊的定制需求的话，值传递前两个参数就可以了。 API看起来非常简单，但是我看到网上有些blog文章对这个API的使用是错误的，所以我贴出我实现了上方圆角dialog的代码:

```
void openBottomSheet(context) {
  showModalBottomSheet(
    backgroundColor: Colors.white,
    context: context,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.only(topLeft: Radius.circular(18), topRight: Radius.circular(18))
  ),

  builder: (builder) {
      return new Container(
        child: Wrap(
          children: <Widget>[
            getListTile(Icons.more, Colors.black45, "More", context),
            getListTile(Icons.favorite, Colors.pink, "Favourites", context),
            getListTile(Icons.account_box, Colors.blue, "Profile", context),
            new Divider(
              thickness: 2.0,
              height: 10.0,
            ),
            getListTile(Icons.exit_to_app, null, "Logout", context),
          ],
        ),
      );
    },
  );
}

```

这个圆角的实现，其实可以直接传入`backgroundColorback`和`shape`参数，不用额外去添加一层i`Container`，如果想实现圆角背景，通过`Container`也可以实现，就是把`backgroundColor`设置成透明，多了一道工序，没必要。背景阴影的效果通过`barrierColor`来设置。很简单的一api，如果错误使用，不但不能优雅的实现功能，反而额外做了很多工作，却不能实现预期。看到的几个demo都没有正确使用这个API，所以特意为这个问题做此小记。
