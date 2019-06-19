---
layout: post
cover: false
title: Android开发中的Java最佳实践
date:   2016-03-05 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

我本人其实是不想把这种在开发中的实践经验称作最佳实践的，英文叫做effective，不过国内翻译的很多技术类书籍也都这么翻译，就权且这样说吧。笔者之前一直在Windows下用C++做应用开发，最近已经转战大热的移动开发，一不小心已经做了快三个多月的Android开发了。作为一个技术转型的老C++程序员，想谈谈Java在Android开发中的一些实践经验，虽然Java之于我也是一门新的编程语言，但是并没那么陌生，相近的语言类型和语法习惯，还是非常容易上手，并且作为一个新手，可能还可以看到一些老Java程序员看到不到的地方，话不多说，下面就开始一些经验之谈。

* 适时使用构建模式

当你有个类的构造方法需要超过三个参数去构建一个对象的时候，使用构建者去构建这个对象。虽然写起来比较冗余，但是可扩展性和可读性比较好。如：

```
class Movie {
    static class Builder {
        String title;
        Builder withTitle(String title) {
            this.title = title;
            return this;
        }
        Movie build() {
            return new Movie(title);
        }
    }

    private Movie(String title) {
    [...] 
    }
}
// Use like this:
Movie matrix = new Movie.Builder().withTitle("The Matrix").build();

```

* 使用静态工厂方法

使用静态工厂方法和私有构造方法来替代new关键字加构造方法的方式，这些静态工厂方法都是明确命名的，不需要每次都返回一个实例对象，并且可以按需返回子类型对象。

```
class Movie {
    [...]
    public static Movie create(String title) {
        return new Movie(title);
    }
}

```

* 使用静态内部类

如果你定义一个内部类不依赖于外部类，不要忘记把它定义为static，如果忘了这么做，因为Java语法，非静态内部类默认会引用外部类，这也是导致很多Android应用内存泄漏的祸因。

* 返回空Collection，而不是null

当不得不返回一个list/Collection时，且没有数据的时候，尽量避免返回null，而是应该返回一个空的list/Collection. 返回一个空的容易，让使用者避免判空，并避开了意想不到的NPE. 在实际操作中应该返回同一个空的Collection, 而不是重新创建一个。

* 使用StringBuilder

在不得不进行字符串拼接时，最好不要直接使用 + 运算符拼接，尽量使用StringBuilder来拼接字符串。

```
String latestMovieOneLiner(List<Movie> movies) {
    StringBuilder sb = new StringBuilder();
    for (Movie movie : movies) {
        sb.append(movie);
    }
    return sb.toString();
}

```

* 强制不能实例化

如果想让一个类不能通过new关键字在堆上创建对象，可以将其构造方法设为private。 尤其一些工具类只包含静态方法，并不需要类的实例，因此可以通过这种方式避免意外发生。

* 避免可变性

保证一个对象在它的整个生命周期中状态都保持不变，这种方式使得对象简单，线程安全，可共享。

以上是我在做了三个多月Android开发的过程中积累的一些实践经验，后续如再有所得，会写新的post出来，欢迎大家在评论中谈谈自己的心得。














