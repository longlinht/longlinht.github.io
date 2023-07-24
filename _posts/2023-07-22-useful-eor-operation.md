---
layout: post
cover: false
title: Userful EOR operations in algorithm design
date:   2023-07-22 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

The EOR is a short form of Exclusive OR, which is a logic operator and satisfies the commutative law and the associative law. It means:

```
0 ^ N == N
N ^ N == 0

A ^ B == B ^ A
A ^ B ^ C == A ^ (B ^ C)

```

With these properties, EOR can be useful to efficiently solve some questions. Let us start with a simple one:

> Given an integer array with only one integer appearing odd times and others appearing even times, print the odd-times one.

At first glance, you could have several solutions to this question. But trust me, you might not have an elegant solution like the one below:

```
public static void printOddTimesNumber1(int[] array) {
    int eor = 0;
    for(int i=0; i < array.length; i++) {
        eor ^= array[i];
    }
    System.out.println(eor);
}

```

With just few lines of code, it's done. It utilizes the basic properties of EOR pretty well. EOR operation on even-time numbers always 0 while only one odd-times number `^` 0 always itself. 

One more difficult question:

> Given an integer array with only two integers appearing odd times and others appearing event times, print the two odd-time numbers.

We give the solution directly and explain the code later.

```
public static void printOddTimesNumber2(int[] array) {
    int eor = 0;
    for(int i=0; i < array.length; i++) {
        eor ^= array[i];
    }
    
    int rightOne = eor & (~eor + 1);
    onlyOne = 0;
    for(int i=0; i < array.length; i++) {
        if(array[i] & rightOne != 0) {
            onlyOne ^= array[i];
        }
    }
    
    int zeroOne = eor ^ onlyOne;
    System.out.println(onlyOne, eor ^ onlyOne);
}

```

The code seems complex, especially this segment `eor & (~eor + 1)`. The expression gets an integer whose only bit is the same as the most right 1 bit of eor and the rest is 0. 

Assume that these two numbers are A and B. The first part of the code was figured out: eor = A ^ B. We know A != B. So there must be a bit of A and B that is different. If the bit of A is 1 and the bit of B is 0, We need to figure out this bit. Then the complex expression above helped. Having the `rightOne`, we can iterate the array to find which number's this bit is 1. After iteration, we get it as `onlyOne` which is A. Finally, we also get the `zeroOne` which is B.












