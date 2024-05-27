---
layout: post
cover: false
title: Why can templates only be implemented in the header file
date:   2010-12-15 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

The primary reason C++ templates are implemented in header files is due to the way templates are instantiated by the compiler. Here’s a detailed explanation:

1. **Template Instantiation**:
   Templates in C++ are not actual classes or functions but blueprints for creating them. When a template is used with a specific type (e.g., `MyTemplate<int>`), the compiler generates a concrete instance of the template for that type. This process is called instantiation.

2. **Visibility**:
   For the compiler to instantiate a template, it needs to see the complete definition of the template. This includes both the declaration and the implementation. If the implementation were in a separate .cpp file, the compiler wouldn’t have access to it when it tries to instantiate the template in different translation units.

3. **One Definition Rule (ODR)**:
   Including template definitions in header files ensures that the template implementation is available wherever the header is included. This prevents multiple definition errors and ensures that each translation unit can instantiate the template independently.

4. **Linking Issues**:
   If templates were implemented in .cpp files, linking issues could arise. Since each instantiation must be unique across the entire program, managing instantiations across different .cpp files would be cumbersome and error-prone. The linker would struggle to resolve which instantiation to use, leading to potential duplicate symbols or unresolved references.

5. **Workarounds**:
   There are workarounds to keep template definitions out of headers, but they involve explicit instantiation. In this approach, specific instances of the template are instantiated in a .cpp file. For example:

   ```cpp
   // MyTemplate.h
   template<typename T>
   class MyTemplate {
   public:
       void doSomething();
   };

   // MyTemplate.cpp
   #include "MyTemplate.h"
   template<typename T>
   void MyTemplate<T>::doSomething() {
       // Implementation
   }

   // Explicit instantiation
   template class MyTemplate<int>;
   ```

   This method works but requires anticipating all the types that will be used with the template, which can be limiting and impractical for generic libraries.

### Conclusion

The necessity of implementing templates in header files in C++ stems from the need for the compiler to have full visibility of the template definitions at the point of instantiation. While alternative approaches exist, they are generally more complex and less flexible than simply including template implementations in headers. This design choice helps ensure that template-based code is both efficient and straightforward to compile and link.