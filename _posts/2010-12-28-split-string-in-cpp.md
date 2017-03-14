---
layout: post
cover: false
title: Split a String in C++
date:   2010-12-28 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
---

There are many ways to split a string in C++, but what's the most elegant way to split a string in C++? May be we can find it step by step. The most simple and direct way is use `istringstream` to split.

If the delimiter is whitespace, we could simply code like thie and print substrings:

```
std::string s("Split a string in C++");
std::istringstream iss(s);

do 
{
    std::string sub;
    iss >> sub;
    if(!sub.empty())
        std::cout << "Substring: " << sub << std::endl;
} while (iss);
```
While when the delimiter is not whitespace, we need think about other way to resolve this problem. If you ever have used vector container in C++ STL, you can combine it figure out more general solution. We could create a function like this:

```
typedef std::vector<std::string> StringVector;

StringVector& splitString(const std::string &s, char delim, StringVector &elems)
{
    std::stringstream ss(s);
    std::string item;
    while (std::getline(ss, item, delim))
    {
        elems.push_back(item);
    }
    return elems;
}
```
May be above solution is more elegent then first one, but it still use `stringstream`, while structure and some string class's method, the STL's power is not incarnated. The later solution will embody the elegence and power of STL's design.
```
string sentence = "Split a string in C++";
istringstream iss(sentence);
copy(istream_iterator<string>(iss),
     istream_iterator<string>(),
     ostream_iterator<string>(cout, "\n"));
```
Instead of copying the extracted tokens to an output stream, one could insert them into a container, using the same generic copy algorithm.
```
vector<string> tokens;
copy(istream_iterator<string>(iss),
     istream_iterator<string>(),
     back_inserter(tokens));
```
So simple code, it seems elegent, but its delimiter must be whitespace, it's not a general solution.

Conclusion: There is not a standard solution in C++, neither in STL, so usual and common operation on string, why C++ not provide a method in string class.


