---
layout: post
cover: false
title: Java中的HashMap 
date:   2017-07-10 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

如果你是个Java程序员，那么你不可能对HashMap视而不见，因为你会经常遇到使用它的场景，因此对HashMap的充分了解非常有必要，对我们写出高效可靠的代码很有帮助。

在对HashMap进行深入了解之前，得先清楚HashMap到底是个什么样的存在！

#### What's HashMap

让我来罗列一些点逐步勾勒出HashMap的轮廓:

* HashMap就是将key做hash算法，然后将hash所对应的数据映射到内存地址，直接取得key所对应的数据。

* 底层为哈希数组，数组的每个元素都是一个单链表的头结点

* 基于`Map`接口实现，提供了map操作的泛型类

* 允许`null` values and the `null` key 

* 实现了Serializable和Cloneable接口，支持序列化，能被克隆


轮廓已出，但是仍旧对HashMap感到陌生,甚至都不清楚与Hashtable的区别，因此与Hashtable做一个简单的对比，来辨识出一些HashMap的重要特性。

#### HashMap vs. Hashtable

* Hashtable是线程安全的，HashMap不是

* HashMap 允许`null` values and the `null` key, Hashtable不允许

* 如果想要预测遍历次序，使用HashMap, Hashtable不易实现

通过这些概念和理论的梳理，大概对HashMap有了一定感觉，也肯定能够在正确的场景下使用HashMap，但是要说起对HashMap的很多细节时，光知道这些是不够的，需要刨根问底了。
要深入了解HashMap，没有比看其原代码更直接的方式了，但是HashMap的源代码是在太长，如果全部贴进来进行分析和解释，实在没有必要，因此只节选部分关键代码来帮助理解
HashMap的实现和原理。

#### HashMap的原理与实现

##### HashMap存储结构

HashMap的底层存储结构是哈希数组，数组的每个元素都是一个单链表的头节点，链表是用来解决冲突的，如果不同的key映射到了数组的同一位置处，就将其放入单链表中。
链表中节点的数据结构:

```
static class Entry<K,V> implements Map.Entry<K,V> {    
    final K key;    
    V value;    
    // 指向下一个节点    
    Entry<K,V> next;    
    final int hash;    
  
    // 构造函数。    
    // 输入参数包括"哈希值(h)", "键(k)", "值(v)", "下一节点(n)"    
    Entry(int h, K k, V v, Entry<K,V> n) {    
        value = v;    
        next = n;    
        key = k;    
        hash = h;    
    }    
  
    public final K getKey() {    
        return key;    
    }    
  
    public final V getValue() {    
        return value;    
    }    
  
    public final V setValue(V newValue) {    
        V oldValue = value;    
        value = newValue;    
        return oldValue;    
    }    
  
    // 判断两个Entry是否相等    
    // 若两个Entry的“key”和“value”都相等，则返回true。    
    // 否则，返回false    
    public final boolean equals(Object o) {    
        if (!(o instanceof Map.Entry))    
            return false;    
        Map.Entry e = (Map.Entry)o;    
        Object k1 = getKey();    
        Object k2 = e.getKey();    
        if (k1 == k2 || (k1 != null && k1.equals(k2))) {    
            Object v1 = getValue();    
            Object v2 = e.getValue();    
            if (v1 == v2 || (v1 != null && v1.equals(v2)))    
                return true;    
        }    
        return false;    
    }    
  
    // 实现hashCode()    
    public final int hashCode() {    
        return (key==null   ? 0 : key.hashCode()) ^    
               (value==null ? 0 : value.hashCode());    
    }    
  
    public final String toString() {    
        return getKey() + "=" + getValue();    
    }    
  
    // 当向HashMap中添加元素时，绘调用recordAccess()。    
    // 这里不做任何处理    
    void recordAccess(HashMap<K,V> m) {    
    }  
  
    // 当从HashMap中删除元素时，绘调用recordRemoval()。    
    // 这里不做任何处理    
    void recordRemoval(HashMap<K,V> m) {    
    }
} 

```

* `Entry`是单向链表

* 它是 `HashMap`链式存储法对应的链表


##### HashMap几个重要的属性

```
public class HashMap<K,V>    
    extends AbstractMap<K,V>    
    implements Map<K,V>, Cloneable, Serializable    
{    
   
    static final int DEFAULT_INITIAL_CAPACITY = 16;    
   
    static final int MAXIMUM_CAPACITY = 1 << 30;    
   
    static final float DEFAULT_LOAD_FACTOR = 0.75f;    
   
    // 存储数据的Entry数组，长度是2的幂。    
    // HashMap采用链表法解决冲突，每一个Entry本质上是一个单向链表    
    transient Entry[] table;    
   
    // HashMap的底层数组中已用槽的数量    
    transient int size;    
   
    int threshold;
   
    final float loadFactor;    
   
    // HashMap被改变的次数    
    transient volatile int modCount; 
    
    ...
}

```

* `DEFAULT_INITIAL_CAPACITY` - 默认的初始容量（容量为HashMap中槽的数目）是16，且实际容量必须是2的整数次幂

* `MAXIMUM_CAPACITY` - 最大容量（必须是2的幂且小于2的30次方，传入容量过大将被这个值替换）

* `loadFactor` - 加载因子, 默认为0.75

* `threshold` - HashMap的阈值，用于判断是否需要调整HashMap的容量（threshold = 容量*加载因子）

其中初始容量和加载因子是影响HashMap性能的重要参数。如果这两个测试设置得当，则HashMap可以表现出很好的性能。到此，关于HashMap
的一些关键部分都已和盘托出,更加细节的部分再次就不进一步讨论了。








