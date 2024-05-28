---
layout: post
cover: false
title:  Singleton Design Pattern in C++
date:   2011-03-10 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

The Singleton design pattern ensures a class has only one instance and provides a global point of access to it. Here's a concise summary of a C++ Singleton implementation and its considerations.

#### C++98 Singleton Implementation

In C++98, implementing a Singleton involved several steps to ensure lazy evaluation, guaranteed destruction, and thread safety. However, this approach wasn't inherently thread-safe:

```cpp
class S {
public:
    static S& getInstance() {
        static S instance; // Guaranteed to be destroyed, instantiated on first use
        return instance;
    }
private:
    S() {}                    // Constructor needed

    // C++98 method to prevent copying
    S(S const&);              // Don't Implement
    void operator=(S const&); // Don't implement
};
```

#### C++11 Singleton Implementation

With C++11, Singleton implementation became cleaner and inherently thread-safe using the `static` variable within the function scope, which is initialized in a thread-safe manner:

```cpp
class S {
public:
    static S& getInstance() {
        static S instance; // Guaranteed to be destroyed, instantiated on first use
        return instance;
    }
private:
    S() {} // Constructor needed

    // C++11 method to prevent copying
    S(S const&) = delete;
    void operator=(S const&) = delete;
};
```

In C++11, you can delete the copy constructor and copy assignment operator to prevent copying, ensuring a single instance.

#### Key Points

- **Lazy Evaluation**: The Singleton instance is created only when it is first accessed.
- **Guaranteed Destruction**: The instance is automatically destroyed when the program exits, ensuring resource cleanup.
- **Thread Safety**: C++11 ensures that the static local variable is initialized in a thread-safe manner.

#### Additional Resources

1. **When to Use a Singleton**: [Singleton: How should it be used](https://example.com)
2. **Initialization Order Issues**:
  - [Static variables initialization order](https://example.com)
  - [Finding C++ static initialization order problems](https://example.com)
3. **Lifetime of Static Variables**: [What is the lifetime of a static variable in a C++ function?](https://example.com)
4. **Threading Implications**: [Singleton instance declared as static variable of GetInstance method, is it thread-safe?](https://example.com)
5. **Double-Checked Locking Issue**: [C++ and The Perils of Double-Checked Locking](https://example.com)

Using the Singleton pattern sparingly and understanding its implications on multithreading and resource management are crucial for robust C++ programming.
