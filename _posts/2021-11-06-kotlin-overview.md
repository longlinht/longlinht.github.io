---
layout: post
cover: false
title: Kotlin使用小计
date:   2021-11-06 14:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true

---

此文记录一次对Kotlin的技术分享，显然无法对Kotlin的方方面面都涉及到，只将一些在实际工作中频繁涉及到的要点做一个梳理，以期对Kotlin这们JVM语言有一个整体的认识。


#### 为什么使用Kotlin
* 静态类型语言
* 同时支持面向对象和函数式编程范式
* 更强大语言表达能力
* 解决Java NPE问题，更安全
* 支持扩展函数
* 与Java的高互操作性

### 类和函数
* 我们只能继承声明为open 或 obstract的类
* Unit 类似Java中的void
* 每一个函数都返回一个值
* 函数参数支持默认值，类似C++

### 变量和属性
* 一切都是对象，包括基础类型，比Java更加彻底
* 对于var和val的使用，最佳实践是: 尽可能多的使用val
* Property类似java中的field，但更强大:

In Java:


```
public class Person {
   private String name;

   public String getName() {
     return name;
   }

  public void setName(String name) {
     this.name = name;
   }

}

Person person = new Person();
person.setName("name");
String name = person.getName();

```

In Kotlin:


```
class Person {
  var name: String = ""
}

val person = Person()
person.name = "name"
val name = person.name

```

定制getter，setter行为:

```
class Person {
  var name: String = ""
     get() = field.toUpperCase()
     set(value) {
       field = "Name: $value"
     }
}

```

#### Data Classes

强大的一种类，可以帮助我们避免一些模板代码和避免出错


```
data class Movie(var name: String, var studio: String, var rating: Float)

```


等价于Java Pojo:


```

public class Movie {

    private String name;
    private String studio;
    private float rating;
    
    public Movie(String name, String studio, float rating) {
        this.name = name;
        this.studio = studio;
        this.rating = rating;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStudio() {
        return studio;
    }

    public void setStudio(String studio) {
        this.studio = studio;
    }

    public float getRating() {
        return rating;
    }

    public void setRating(float rating) {
        this.rating = rating;
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        
        result = prime * result + ((name == null) ? 0 : name.hashCode());
        result = prime * result + Float.floatToIntBits(rating);
        result = prime * result + ((studio == null) ? 0 : studio.hashCode());
        
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        
        if (obj == null)
            return false;
        
        if (getClass() != obj.getClass())
            return false;
        
        Movie other = (Movie) obj;
        
        if (name == null) {
            if (other.name != null)
                return false;
            
        } else if (!name.equals(other.name))
            return false;
        
        if (Float.floatToIntBits(rating) != Float.floatToIntBits(other.rating))
            return false;
        
        if (studio == null) {
            if (other.studio != null)
                return false;
            
        } else if (!studio.equals(other.studio))
            return false;
        
        return true;
    }

    @Override
    public String toString() {
        return "Movie [name=" + name + ", studio=" + studio + ", rating=" + rating + "]";
    }
}

```

Copy数据类对象:

```
val f1 = Forecast(Date(), 27.5f, "Shiny day")
val f2 = f1.copy(temperature = 30f)

```

把一个对象的多个字段映射到多个变量中

```
val f1 = Forecast(Date(), 27.5f, "Shiny day")
val (date, temperature, details) = f1

```

#### 操作符重载

* 类似C++
* ===和!==不能被重载

#### Lambdas

* Java也支持，但是Kotlin中lambdas表达式可以变得非常简单，语法糖，便利的同时也要特别小心
* 在Kotlin中，函数可以作为一个类型
* 类似C++中的函数指针

#### Visibility Modifiers

* 默认的可见性是public
* private, protected, internal可见官方文档定义

#### 集合和函数操作

大概有如下几类操作,具体见官方文档


* Aggregate operations:

```

//any
val list = listOf(1, 2, 3, 4, 5, 6)
assertTrue(list.any { it % 2 == 0 })
assertFalse(list.any { it > 10 })

//all
assertTrue(list.all { it < 10 })
assertFalse(list.all { it % 2 == 0 })

...

```


* Filtering operations

* Mapping operations

* Elements operations

* Generation operations

* Ordering operations

#### Null safety in Kotlin

* 对臭名昭著的Java NPE有了解决方案

* 代码中如果大量充斥!!操作符将是一个很不好的信号

* 如果显示声明为非空变量后再赋值空对象，会导致运行时crash，需特别注意

* Kotlin和Java代码共存，并且互操作时要特别注意空指针问题

* Java可通过Nullable和NonNull注解来显式明晰变量的取值

#### Coroutine
可参见已有的一次技术分享: https://wiki.inn.bitcall.xyz/pages/viewpage.action?pageId=2232386

#### Anko

* Github: https://github.com/Kotlin/anko

* JetBrains开发的一个强大的类库

* 主要目的是使用代码来代替XML来生成UI布局

* 我们的项目在后期性能优化时可考虑引入使用

#### Kotlin vs. Java

<img src="{{ site.baseurl }}assets/images/java-vs-kotlin.png" />

