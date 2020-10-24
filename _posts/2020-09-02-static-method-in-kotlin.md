---
layout: post
cover: false
title: Kotlin中的"静态" 方法和域
date:  2020-09-02 20:54:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

  最近开始尝试在现有的工程中使用Kotlin，刚开始使用时感觉语法简洁，代码量也少了很多，语法层面的防空，可以直接访问布局控件这些特性，都让人耳目一新，但是当我要定义静态方法和静态类时，不爽的体验一下子就上来了，所以通过此文来一探Kotlin"静态" 的究竟。
  先来看静态方法， 很遗憾，Kotlin中没有`static`关键字，需要将静态方法放在`companion object`中的代码块中，因此：

```
class Foo {
  public static int a() { return 1; }
}

```

就变成了这样:

```
class Foo {
  companion object {
     fun a() : Int = 1
  }
}

```
可以在Kotlin代码中这样使用该类:

```
Foo.a();

```

在Java代码中:

```
Foo.Companion.a();

```

如果你不喜欢使用`Companion`, 你可以对该静态方法添加`@JvmStatic`注解:

```

class Foo {
  companion object {
    @JvmStatic
    fun a() : Int = 1;
  }
}

```

也可以命名你的`companion`类:

```
class Foo {
  companion object Blah {
    fun a() : Int = 1;
  }
}

```
然后可以这样调用:

```
Foo.Blah.a() 

```

然后来看静态域， 比起静态方法，静态域的情况有所不同，虽然也可以这样定义:

```

class Foo {
  companion object {
    val MY_CONSTANT = "MY_CONSTANT"
  }
}

```
但是会自动为`MY_CONSTANT`生成getter和setter方法，相当于实例域访问，开销会比静态方法大，不推荐此种定义方法。可以这样定义:

```
object Foo {
    const val MY_CONSTANT = "MY_CONSTANT"
}

```

上面定义的object Foo可以全局访问:

```
Foo.MY_CONSTANT

```

而companion object中定义的`const var MY_CONSTANT`是不可以全局访问的。 当然了，静态域为了避免访问时的Companion，也可以在定义时添加`@StaticField`.


到此Kotlin中`静态`相关的部分基本已经覆盖到了，个人觉得这个companion object不是什么好的设计，远没有Java的static关键字来的简洁和表达力。
