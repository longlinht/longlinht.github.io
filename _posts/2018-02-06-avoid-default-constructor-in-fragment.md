---
layout: post
cover: false
title: 为什么要避免使用Fragment的默认构造函数
date:   2018-02-06 19:25:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

今天在项目中需要用到Fragment, 但是在代码写完后碰到了这样一个警告:

>Avoid non-default constructors in fragments: use a default constructor plus Fragment#setArguments(Bundle) instead

后来发现是因为自己使用了Fragment的非默认构造函数, 在构造函数里传递了参数, Fragment之前也用了很多次, 可能都忽略了这个警告, 因此并没有发现这个问题, 这次既然遇到了就想一探究竟, 看看到底是为什么. 查看了网上可找到的相关的信息后, 终于明白其中原由, 避免使用默认构造函数的原因如下:

* 系统在重新创建Fragment的时候调用的是默认构造函数.

* 系统在恢复Fragment的时候会自动恢复你通过`setArguments(Bundle bundle)` 传递的`bundle`, 你可以在`onCreate`, `onCreateView`中读取恢复的`bundle`中的值,这种方式可以保证正确的恢复你最开始传递的bundle. 

因为这是一个警告, 不是错误，所以你也可以使用非默认构造函数，但是你得确保在非默认构造函数中初始化`bundle`中的参数,并在`onCreate`, `onCreateView`读取.

当然了，创建一个Fragment,并且传递参数的推荐方式是这样的:

```
public static MyFragment newInstance(int someInt) {
    MyFragment myFragment = new MyFragment();

    Bundle args = new Bundle();
    args.putInt("someInt", someInt);
    myFragment.setArguments(args);

    return myFragment;
}

```



