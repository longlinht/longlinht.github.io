---
layout: post
cover: false
title:  Understanding `std::string` and `std::wstring` in C++
date:   2014-07-09 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

When working with C++ strings, it's essential to understand the difference between `std::string` and `std::wstring`, and the character types `char` and `wchar_t` on which they are based.

#### `std::string` vs. `std::wstring`
`std::string` is a template instantiation of `basic_string` with `char`, while `std::wstring` uses `wchar_t`. The difference between these two types lies in the size and encoding of the characters they hold.

#### `char` vs. `wchar_t`
The `char` type typically holds an 8-bit character, sufficient for ASCII characters. On the other hand, `wchar_t` is intended for wide characters. Its size varies by platform: 4 bytes on Linux and 2 bytes on Windows.

#### Unicode and Character Encoding
Neither `char` nor `wchar_t` are directly tied to Unicode, which adds complexity. For instance, on Linux systems like Ubuntu, `char` strings are natively encoded in UTF-8, allowing them to handle Unicode characters seamlessly. This means a `std::string` on Linux can hold Unicode strings, as illustrated in the following code:

```cpp
#include <cstring>
#include <iostream>

int main() {
    const char text[] = "olé";

    std::cout << "sizeof(char)    : " << sizeof(char) << "\n";
    std::cout << "text            : " << text << "\n";
    std::cout << "sizeof(text)    : " << sizeof(text) << "\n";
    std::cout << "strlen(text)    : " << strlen(text) << "\n";

    std::cout << "text(ordinals)  :";
    for(size_t i = 0, iMax = strlen(text); i < iMax; ++i) {
        unsigned char c = static_cast<unsigned char>(text[i]);
        std::cout << " " << static_cast<unsigned int>(c);
    }
    std::cout << "\n\n";

    const wchar_t wtext[] = L"olé";

    std::cout << "sizeof(wchar_t) : " << sizeof(wchar_t) << "\n";
    std::cout << "wtext           : UNABLE TO CONVERT NATIVELY.\n";
    std::wcout << L"wtext           : " << wtext << "\n";

    std::cout << "sizeof(wtext)   : " << sizeof(wtext) << "\n";
    std::cout << "wcslen(wtext)   : " << wcslen(wtext) << "\n";

    std::cout << "wtext(ordinals) :";
    for(size_t i = 0, iMax = wcslen(wtext); i < iMax; ++i) {
        unsigned short wc = static_cast<unsigned short>(wtext[i]);
        std::cout << " " << static_cast<unsigned int>(wc);
    }
    std::cout << "\n\n";
}
```

The output demonstrates that `std::string` in Linux handles UTF-8 encoded Unicode strings, though the character count might differ due to multi-byte characters.

#### Windows Encoding
Windows handles encoding differently. Historical applications use `char` with various code pages, not necessarily UTF-8. Unicode applications use `wchar_t` encoded in UTF-16. Therefore, using `std::wstring` on Windows is more appropriate for Unicode, though conversions between `char` and `wchar_t` strings are often necessary.

#### Memory Considerations
UTF-32 always uses 4 bytes per character, while UTF-8 and UTF-16 are more memory-efficient for most languages. UTF-8 usually uses less memory than UTF-16 for Western languages but can be more for others, such as Chinese or Japanese.

#### Conclusion
Choosing between `std::string` and `std::wstring` depends on the platform:
- On Linux, prefer `std::string` due to native UTF-8 support.
- On Windows, prefer `std::wstring` for Unicode applications.

For cross-platform code, the choice depends on the toolkit or framework used. Understanding these differences ensures efficient and correct handling of text in C++ applications.