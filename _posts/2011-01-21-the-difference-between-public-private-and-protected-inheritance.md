---
layout: post
cover: false
title: The difference between public private and protected inheritance
date:   2011-01-21 19:40:32
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

Understanding the differences between public, private, and protected inheritance in C++ is crucial for designing robust and maintainable object-oriented systems. Here’s a the most concise explanation of these concepts and their implications, using code segments.

```cpp

class A 
{
    public:
       int x;
    protected:
       int y;
    private:
       int z;
};

class B : public A
{
    // x is public
    // y is protected
    // z is not accessible from B
};

class C : protected A
{
    // x is protected
    // y is protected
    // z is not accessible from C
};

class D : private A    // 'private' is default for classes
{
    // x is private
    // y is private
    // z is not accessible from D
};

```



