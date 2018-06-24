---
layout: post
cover: false
title: Similarities and Differences between Java and C++
date:   2012-01-15 14:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

* Java does not support typedefs, defines, or a preprocessor. 

* Java does not support enums but does support named constants through use of the final keyword.

* Java supports classes, but does not support structures or unions.

* There are no stand-alone functions in Java, all function or method definitions in Java are contained within the class definition. 

* All classes in Java ultimately inherit from the Object class. This is significantly different from C++ where it is possible to create inheritance trees that are completely unrelated to one another.

* Both C++ and Java support class (static) methods or functions that can be called without the requirement to instantiate an object of the class.

* Java does not support multiple inheritance, while the interface concept is not supported by C++.

* Java does not support the goto statement (but goto is a reserved word). However, it does support labeled break and continue statements, a feature not supported by C++. 

* Java does not support operator overloading.

* Java does not support automatic type conversions (except where guaranteed safe).

* Unlike C++, Java provides true arrays as first-class objects, true boolean type and has a String type.

* Java does not support pointers(at least it does not allow you to modify the address contained in a pointer or to perform pointer arithmetic).

* A class definition in Java looks similar to a class definition in C++, but there is no closing semicolon. Also forward reference declarations that are sometimes required in C++ are not required in Java.

* The scope resolution operator (::) required in C++ is not used in Java. 

* In C++, static data members and functions are called using the name of the class and the name of the static member connected by the scope resolution operator. In Java, the dot is used for this purpose.

* Like C++, Java has primitive types such as int, float, etc. Unlike C++, the size of each primitive type is the same regardless of the platform. There is no unsigned integer type in Java. Type checking and type requirements are much tighter in Java than in C++.

* Conditional expressions in Java must evaluate to boolean rather than to integer, as is the case in C++.

* The char type in C++ is an 8-bit type that maps to the ASCII (or extended ASCII) character set. The char type in Java is a 16-bit type and uses the Unicode character set 

* Unlike C++, the >> operator in Java is a "signed" right bit shift, inserting the sign bit into the vacated bit position. Java adds an operator that inserts zeros into the vacated bit positions.

* C++ allows the instantiation of variables or objects of all types either at compile time in static memory or at run time using dynamic memory. However, Java requires all variables of primitive types to be instantiated at compile time, and requires all objects to be instantiated in dynamic memory at runtime. Wrapper classes are provided for all primitive types except byte and short to allow them to be instantiated as objects in dynamic memory at runtime if needed.

* C++ requires that classes and functions be declared before they are used. This is not necessary in Java.

* The "namespace" issues prevalent in C++ are handled in Java by including everything in a class, and collecting classes into packages.

* In C++, unless you specifically initialize variables of primitive types, they will contain garbage. Although local variables of primitive types can be initialized in the declaration, primitive data members of a class cannot be initialized in the class definition in C++.

* Like C++, Java supports constructors that may be overloaded. 

* All objects in Java are passed by reference, eliminating the need for the copy constructor used in C++.

* There are no destructors in Java.

* Like C++, Java allows you to overload functions. However, default arguments are not supported by Java.

* Unlike C++, Java does not support templates. Thus, there are no generic functions or classes.

* Unlike C++, several "data structure" classes are contained in the "standard" version of Java. 

* Multithreading is a standard feature of the Java language.

* Although Java uses the same keywords as C++ for access control: private, public, and protected, the interpretation of these keywords is significantly different between Java and C++. 

* There is no virtual keyword in Java. All non-static methods always use dynamic binding, so the virtual keyword isn't needed for the same purpose that it is used in C++.

* Java provides the final keyword that can be used to specify that a method cannot be overridden and that it can be statically bound. (The compiler may elect to make it inline in this case.)

* The detailed implementation of the exception handling system in Java is significantly different from that in C++.

* As in C++, Java applications can call functions written in another language.

* Unlike C++, Java has built-in support for program documentation.
