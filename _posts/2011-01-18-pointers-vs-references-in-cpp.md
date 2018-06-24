---
layout: post
cover: false
title: References vs. Pointers in C++
date:   2011-01-18 19:40:32
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In C++, references provide many of the same capabilities as pointers. In real development, we prefer to use references to avoid the complex and error prone of pointers. But in some situations, our choices're not clear. As a good C++ developer, we shouldn't ignore this confusion, this hesitation, so we need make it clear, more clear.

* The references can't be re-assigned, but pointers can be.

* A pointer has its own memory address and size on the stack (4 bytes on x86), whereas a reference shares the same memory address (with the original variable) but also takes up some space on the stack. Since a reference has the same address as the original variable itself, it is safe to think of a reference as another name for the same variable. 
```
int x = 0;
int &r = x;
int *p = &x;
int *p2 = &r;
bool equal = p == p2; // equal is true
```
* You can have pointers to pointers to pointers offering extra levels of indirection. Whereas references only offer one level of indirection.

* Pointer can be assigned `nullptr` or `NULL` directly, whereas reference cannot.

* Pointers can iterate over an array, you can use ++ to go to the next item that a pointer is pointing to, and + 4 to go to the 5th element. This is no matter what size the object is that the pointer points to.

* A pointer needs to be dereferenced with * to access the memory location it points to, whereas a reference can be used directly. A pointer to a class/struct uses `->` to access it's members whereas a reference uses a `.`.

* A pointer is a variable that holds a memory address. Regardless of how a reference is implemented, a reference has the same memory address as the item it references.

* References cannot be stuffed into an array, whereas pointers can be.

* Const references can be bound to temporaries. Pointers cannot (not without some indirection):
```
const int &x = int(12); //legal C++
int *y = &int(12); //illegal to dereference a temporary.
```
This makes const& safer for use in argument lists and so forth.
