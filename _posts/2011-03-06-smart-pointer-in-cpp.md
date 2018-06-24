---
layout: post
cover: false
title:  Smart Pointer in C++
date:   2011-03-06 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In C++, there is a uncommnon conception named smart pointer, it is rarely seen in other programming lauguages. So, what's it? We could simply define it. **A smart pointer is a class that wraps a 'raw' (or 'bare') C++ pointer, to manage the lifetime of the object being pointed to**.

Thinking about this defination for a while, why we need a smart pointer class? Please consider a block code below:

```c++ 
MyObject* ptr = new MyObject(); 
ptr->doSomething(); // Use the object in some way
delete ptr; // Destroy the object. Done with it.
```
Most C++ programmer are familiar with this code snippet. Many freshman finish their job like this, they may not recognize that they would be in a trap and danger. Where is danger? Freshman would ask. But I ask them to think about this situation: If the calling `ptr->doSomething` throw a exception, the memory will leak, the object `ptr` point to will never be destroied. How can we avoid this bad result? Maybe we need a class to automatically to destroy the object instead of deleting it explicitly. What's the class look like? How we design it?  

It actually that the STL and Boost provide us smart pointer template class. We could use it convinently. Generally, using smart pointer template class like this:

```c++
SomeSmartPtr<MyObject> ptr(new MyObject());
ptr->DoSomething(); // Use the object in some way.
```
You still have to create the object, but you no longer have to worry about destroying it. Simple and clean code, exception safe. Until here, we must introduce some usefull and smart pointer class.

* Scoped smart pointer  

    * it can't be copied. 

    * Scoped pointers are useful when you want to tie the lifetime of the object to a particular block of code, or if you embedded it as member data inside another object, the lifetime of that other object. The object exists until the containing block of code is exited, or until the containing object is itself destroyed.

Implementations : `std::unique_ptr`, `boost::scoped_ptr`. 

```c++
void f()
{
    {
       boost::scoped_ptr<MyObject> ptr(new MyObject());
       ptr->doSomethingUseful();
    } // boost::scopted_ptr goes out of scope -- 
      // the MyObject is automatically destroyed.

    // ptr->doOtherThing(); // Compile error: "ptr" not defined
                            // since it is no longer in scope.
}
```

* Reference counting smart pointer 

Implementations: `std::share_ptr`, `boost::share_ptr`

    * It can be copied.

    * It is very useful when the lifetime of your object is much more complicated, and is not tied directly to a particular section of code or to another object.

    * There is one drawback - create the smart pointer on the heap, possibity of creating a dangling reference.

```c++
// Create the smart pointer on the heap
MyObjectPtr* pp = new MyObjectPtr(new MyObject())
// Hmm, we forgot to destroy the smart pointer,
// because of that, the object is never destroyed!
```

    * Possibity to create circular reference.
```
struct Owner {
   boost::shared_ptr<Owner> other;
};

boost::shared_ptr<Owner> p1 (new Owner());
boost::shared_ptr<Owner> p2 (new Owner());
p1->other = p2; // p1 references p2
p2->other = p1; // p2 references p1

// Oops, the reference count of of p1 and p2 never goes to zero!
// The objects are never destroyed!
```

To work around this problem, both Boost and C++11 have defined a `weak_ptr` to define a weak (uncounted) reference to a `shared_ptr`.

**Conclusion**: You should favour the use of `std::unique_ptr`, `std::shared_ptr` and `std::weak_ptr`, shouldn't use `std::auto_ptr`(deprecated), use the `std::unique_ptr` instead.

