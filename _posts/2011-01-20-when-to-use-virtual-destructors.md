---
layout: post
cover: false
title: When to use virtual destructors
date:   2011-01-20 19:40:32
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In C++, destructors are special member functions invoked when an object is destroyed. Understanding when to use virtual destructors is crucial for ensuring proper resource management, especially in the context of inheritance and polymorphism.

#### The Problem with Non-Virtual Destructors

Consider a base class `Base` and a derived class `Derived`:

```cpp
class Base {
public:
    ~Base() { std::cout << "Base Destructor" << std::endl; }
};

class Derived : public Base {
public:
    ~Derived() { std::cout << "Derived Destructor" << std::endl; }
};
```

If you delete an instance of `Derived` through a pointer to `Base`, only the destructor of `Base` is called:

```cpp
Base* obj = new Derived();
delete obj;
```

This results in undefined behavior because the destructor of `Derived` is not called, leading to resource leaks or other issues specific to `Derived`.

#### The Solution: Virtual Destructors

To ensure that the destructors of both `Base` and `Derived` are called, the destructor in the base class should be declared virtual:

```cpp
class Base {
public:
    virtual ~Base() { std::cout << "Base Destructor" << std::endl; }
};

class Derived : public Base {
public:
    ~Derived() { std::cout << "Derived Destructor" << std::endl; }
};
```

Now, when deleting an instance of `Derived` through a pointer to `Base`, both destructors are invoked:

```cpp
Base* obj = new Derived();
delete obj;
```

This correctly calls the `Derived` destructor followed by the `Base` destructor, ensuring proper cleanup.

#### When to Use Virtual Destructors

Use virtual destructors when:

1. **Polymorphism is involved**: If a class is intended to be a base class, and you expect it to be inherited by other classes, declare its destructor virtual.
2. **Dynamic allocation**: If objects are allocated dynamically and deleted via base class pointers, a virtual destructor ensures that the derived class's destructor is called.

#### Performance Considerations

There is a minor runtime overhead associated with virtual destructors due to the virtual table lookup. However, this overhead is generally negligible compared to the potential issues of not using virtual destructors in polymorphic base classes.

### Conclusion

Virtual destructors are essential in C++ for proper resource management in polymorphic base classes. By declaring destructors as virtual in base classes, you ensure that the destructors of derived classes are called correctly, preventing resource leaks and other cleanup issues. This practice is a key aspect of safe and effective C++ programming, particularly in complex systems involving inheritance and dynamic polymorphism.
