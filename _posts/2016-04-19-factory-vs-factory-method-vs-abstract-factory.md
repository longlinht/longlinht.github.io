---
layout: post
cover: false
title: 简单工厂模式vs.工厂方法vs.抽象工厂 
date:   2016-04-19 20:54:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

开始从事编程这一行以来，一直对设计模式这块不是很重视，也许在研发过程中已经不知不觉得遇到或者使用过一些常用的设计模式，也边看边用过一些，但是一直未曾系统的学习过一些经典的，常见的设计模式，于是最近抽空开始看一些专门讲设计模式的书，不知不觉也复习了不下十个设计模式，在复习到工厂模式时，连看了好几遍，感觉还是对简单工厂模式，工厂方法，抽象工厂的概念无法清晰的区分和准确辨别其使用场景。看了很多文章和资料，经过自己的总结和思考后有所得，并且希望能通过很简练的方式把这个问题说清楚，巩固复习成果，于是便有了此文。

先说三种设计模式的相同点，之后再来逐个看三者的区别。相同点很明显, 有以下几点:

* 这三种设计模式都是创建类模式，均可以称之为"smart constructor”
* 三者都隐藏了实例化的逻辑， 换句或说就是封装了对象的创建过程
* 都有一个创建的工厂类来创建相应的对象

以下来谈谈不同点：

简单工厂模式

* 有一个工厂类来创建一个或多个类型的对象
* 这个工厂类是一个普通的类，没有实现任何的接口，意味着没有做任何抽象
* 这个工厂类有一个或多个返回具体对象的方法
* 负责创建对象的方法通常以对象类型为参数，返回值便是传入类型要求创建的对象

使用场景: 当客户端需要一个对象，并且希望由工厂来决定对象的创建并且根据客户端的类型要求返回合适的对象

工厂方法模式

* 定义了由子类去实现的”create”方法的接口或协议
* 每一个子类意味着一个新的对象类型
* 实现接口的子类决定了返回具体对象的类型
* 一个工厂类只生产一种类型的对象
使用场景：当客户端需要的对象的创建需要很多依赖和配置的时候，推荐工厂方法模式

抽象工厂模式

* 创建对象族，或者说一个工厂生产一族产品
* 可以被称为工厂的工厂
* 抽象了生产一类产品的工厂
* 通常用来做依赖注入

使用场景: 客户端需要创建多个对象(产品)族

以上可以说是非常凝练的提取出了三者的区别，但没有给出实例代码，我的考虑是，这类代码网上随处可见，单纯看代码也不一定能够提炼出对这三种设计模式的异同，掌握本质，能够用简练的语言表述出来，才可见真知。