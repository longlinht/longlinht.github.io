---
layout: post
cover: false
title: 解决闹人的can not found symbol BR问题
date:   2018-12-02 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

最近公司研发的这个App是我从零到一搭建的，在框架搭建时分别使用了Databinding和Room，今天在做新需求时需要向Room中的实体类新添加一个字段，在写完了所有相关的逻辑后，build工程，所有自动生成的Databinding类都报错，build log中并没有指向任何具体报错的Databinding类，这就令人很困惑，因为这个需求的添加并没有改动任何Databinding的类，在不知所以的情况下，那就尝试其他方法解决，之前我在一个技术博客上看到过一个Databinding类的Troubleshooting: 

**Troubleshooting the Issues with Binding Class**

- Make sure you have the proper dataBinding.enabled = true in gradle and trigger "Sync with Gradle"

- Open the layout file and ensure that the XML file is valid and is wrapped in a <layout> tag.

- Check the layout file for the correct name i.e activity_main.xml maps to ActivityMainBinding.java.

- Run File => Invalidate Caches  Restart to clear the caches.

- Run Project => Clean and Project => Re-Build to regenerate the class file.

- Restart Android Studio again and then try the above steps again.


对这几条Troubleshooting依次尝试后，报错依旧，这就非常恼人，然后我又怀疑是不是build log打印的信息不全，导致跑偏了定位问题的方向，因此在project Gradle中更改了错误信息的条数:

```
allprojects {
    gradle.projectsEvaluated {
        tasks.withType(JavaCompile) {
            options.compilerArgs << "-Xmaxerrs" << "4000"
            options.compilerArgs << "-Xmaxwarns" << "4000"
        }
    }
}

```
在打印更多错误信息以后，仍旧看不出错误的源头在哪里。排查到这一步，可能就需要最笨的办法了，倒推法，在依次回退了可能导致这个错误的代码后，算是定位到了出错的修改， 就是Room的实体类添加了一个新的字段导致的，这就很奇怪，添加一个字段不是非常正常的操作吗？就算添加的字段不符合规范，那也应该是Room报错，关Databinding什么事，一开始真是一头雾水，但是我猜想可能是Room和Databinding这两类组件都自动生成了很多代码，在生成Room代码的时候的出错导致Databinding类生成失败，所以编译时表现为Databinding类找不到，这下问题变得清晰起来，问题的源头应该还是Room导致的，最后发现其实就是一个小的细节导致的，在给Room实体类添加字段的时候是private的，但是并没有提供getter和setter方法，因此导致编译失败，只是错误的表现误导了我的思路。白白浪费了几个小时排查这种因为违反了组件使用规范的问题，以后必须引以为戒，再次重申这个恼人的细节:

```
@Entity(tableName = "messages")
public class ChatMessageEntity {

    @NonNull
    @PrimaryKey(autoGenerate = true)
    //common field
    private int id;

    @SerializedName("title")
    private String title;
    
    @NonNull
    public int getId() {
        return id;
    }

    public void setId(@NonNull int id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}

```

* 被注解为Entity的实体类添加字段，如果是private的必须提供getter和setter方法，或者修饰为public的

* 如果违反了这个规则，变异错误信息不一定会指向这个错误



