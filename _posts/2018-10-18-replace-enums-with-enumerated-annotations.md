---
layout: post
cover: false
title: 用枚举注解替代枚举 
date:  2018-10-18 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

在日常的Java开发中使用enum是很稀松平常的事，但是在Android应用的开发中使用enum时事情就没那么简单了。以下是Google官方给出的建议:

> "Enums often require more than twice as much memory as static constants. You should strictly avoid using enums on Android."

看来Google非常不建议在Android应用开发中使用enum，那么遇到要使用enum的场景时我们有什么选择呢？也许你很快会想出使用若干常量的定义来代替enum的定义，如定义若干int常量:

```
public class ItemTypeDescriptor {
  public static final int TYPE_MUSIC = 0;
  public static final int TYPE_PHOTO = 1;
  public static final int TYPE_TEXT = 2;

  public final int itemType;

  public ItemTypeDescriptor(int itemType) {
    this.itemType = itemType;
  }
}

```

这样定义咋一看也没有什么问题，但是如果我在创建ItemTypeDescriptor类型对象时传入3或4，代码可以编译通过，也可以运行，但是对于我们的ItemTypeDescriptor类型的对象来说，3和4没有意义，这暴露出我们设计的ItemTypeDescriptor类没有校验参数的能力，无法在编译阶段杜绝非法参数的输入，显然这样的设计存在缺陷，那么在不能直接使用enum的情况下，有没有方法来间接实现enum的功能呢?

答案是肯定的，通过注解就可轻松实现。

#### IntDef

使用IntDef来实现上述定义:

```
public class ItemTypeDescriptor {

  public final int itemType;

  // Describes when the annotation will be discarded
  @Retention(RetentionPolicy.SOURCE)
  // Enumerate valid values for this interface
  @IntDef({TYPE_MUSIC, TYPE_PHOTO, TYPE_TEXT})
  // Create an interface for validating int types
  public @interface ItemTypeDef {}
  // Declare the constants
  public static final int TYPE_MUSIC = 0;
  public static final int TYPE_PHOTO = 1;
  public static final int TYPE_TEXT = 2;

  // Mark the argument as restricted to these enumerated types
  public ItemTypeDescriptor(@ItemTypeDef int itemType) {
    this.itemType = itemType;
  }
}

```
这样实现以后，在创建ItemTypeDescriptor对象时如果传入3或4将通不过编译，必须传入ItemTypeDef定义的值，实现了对传入参数的校验，等同于使用enum. 除了使用IntDef以外，最常用的就是用StringDef来替代String类型的enum. 如下面的这个例子:

```
public class FilterColorDescriptor {
  public static final String FILTER_BLUE = "blue";
  public static final String FILTER_RED = "red";
  public static final String FILTER_GRAY = "gray";

  public final String filterColor;

  public FilterColorDescriptor(String filterColor) {
    this.filterColor = filterColor;
  }
}

```

就可以通过StringDef注解来替代:

```

public class FilterColorDescriptor {
  // ... type definitions
  // Describes when the annotation will be discarded
  @Retention(RetentionPolicy.SOURCE)
  // Enumerate valid values for this interface
  @StringDef({FILTER_BLUE, FILTER_RED, FILTER_GRAY})
  // Create an interface for validating String types
  public @interface FilterColorDef {}
  // Declare the constants
  public static final String FILTER_BLUE = "blue";
  public static final String FILTER_RED = "red";
  public static final String FILTER_GRAY = "gray";

  // Mark the argument as restricted to these enumerated types
  public FilterColorDescriptor(@FilterColorDef String filterColor) {
    this.filterColor = filterColor;
  }
}

```

这两种注解可以覆盖大部分需要使用enum的场景，使用起来也更直观，可以对传入的参数在编译阶段进行校验，所以赶快在项目中用起来吧！


















