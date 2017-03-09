---
layout: post
cover: false
title: Using Duilib to build GUI
date:   2015-01-03 19:20:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
---

Duilib is a free open source DirectUI library on Windows , because its simple and expandable design and stable and efficient implementation, accepted generally by the major Internet companies  widely used in IM, video client, stock market software, navigation software, mobile phone support Software, security software and many PC client software in other industries. When We developed a IM in a company I worked, we even use this library to replace Qt GUI part we used in our code.

#### Basic principle
The native Windows user interface is composed of multiple WND, each WND has its own Handle and WndProc, while the DirectUI is directly drawn on the parent window (Paint on parent DC). That is, the child window is not created in the form of a window handle (windowless), but a logical window, using the GDI function to draw on the parent window. There is no extra WND, so the controls are all virtual, do not have their own message loop, they are using WND message loop. When the WND receives the message, it will locate the control and then passes the message to the specific control, which will response this message.

### Class architecture of library
![](https://dl.dropboxusercontent.com/u/83663714/Figures/duilib_arch.png)
#### Basic library

##### Tool library

DUILib is not depends on any other external library, so it implement basic tool library internally to support this project.

* UI related: CPoint, CSize, CDuiRect

* Simple Container: CStdPtrArray, CStdValArray, CStdString, CStdStringPtrMap

##### Control library

Control library has two parts to be implemented seperately in DUILib.

* Core - contains common parts all controls used and basic class.

* Control - contains all real(instantiaed) controls.

### Message process mechanism

#### Basic process

![](https://dl.dropboxusercontent.com/u/83663714/Figures/duilib_typical_process.png)

The DUILib framework's basic message process similar to create window process in WIN32.

```c++
int APIENTRY WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow)
{
    CPaintManagerUI::SetInstance(hInstance);        // 1, Instantiate handle and attach to render
    CPaintManagerUI::SetResourcePath(CPaintManagerUI::GetInstancePath() + _T("skin"));
    HRESULT Hr = ::CoInitialize(NULL);              // 2,Initialize COM, and support to load COM
    if( FAILED(Hr) ) return 0;
    CMainFrameWnd* pFrame = new CMainFrameWnd();    // 3,Create window class
    if( pFrame == NULL ) return 0;
    pFrame->Create(NULL, _T("Main"), UI_WNDSTYLE_FRAME, 0L, 0, 0, 800, 600); // 4, Register window class and create window instance.
    // Actually call Create to create a Win32 WND, do these operations internally:
    //  -> RegisterSuperclass (Register a super class)
    //  -> RegisterWindowClass （Register window class）
    //  -> ::CreateWindowEx (Create window，trigger WM_CREATE)
    //  -> HandleMessage  ( WM_CREATE process OnCreate)

    pFrame->CenterWindow();          // 5, Center window
    ::ShowWindow(*pFrame, SW_SHOW);
    CPaintManagerUI::MessageLoop(); // 6, Process message loop
    ::CoUninitialize();            // 7, Exit program and release COM
    return 0;
}
```

* Main message loop - CPaintManagerUI::MessageLoop, message will be first received by CPaintManagerUI's TranslateMessage.

```c++
 void CPaintManagerUI::MessageLoop()
 {
     MSG msg = { 0 };
     while( ::GetMessage(&msg, NULL, 0, 0) ) {    
         if( !CPaintManagerUI::TranslateMessage(&msg) ) { 
             ::TranslateMessage(&msg);
             ::DispatchMessage(&msg); 
         }
     }
 }
 ```
* Create window - call CWindowWnd::Create to create window, and finish operations below:

    * If subclass system control(not DUILib control), set `__ControlProc` function as callback function.

    * If not subclass, set `__WndProc` function as callback function.

    * Use CreateWindowEx to create window instance.


* `__WndProc` 

```c++
LRESULT CALLBACK CWindowWnd::__WndProc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
    CWindowWnd* pThis = NULL;
    if( uMsg == WM_NCCREATE ) { // Bind class and window in this message
        LPCREATESTRUCT lpcs = reinterpret_cast<LPCREATESTRUCT>(lParam);   // From CreateWindowEx's last parameter( ptr to CWindowWnd )
        pThis = static_cast<CWindowWnd*>(lpcs->lpCreateParams);
        pThis->m_hWnd = hWnd;
        ::SetWindowLongPtr(hWnd, GWLP_USERDATA, reinterpret_cast<LPARAM>(pThis)); // Set to window's user data
    }
    else {
        pThis = reinterpret_cast<CWindowWnd*>(::GetWindowLongPtr(hWnd, GWLP_USERDATA));
        if( uMsg == WM_NCDESTROY && pThis != NULL ) {
            LRESULT lRes = ::CallWindowProc(pThis->m_OldWndProc, hWnd, uMsg, wParam, lParam);    
            ::SetWindowLongPtr(pThis->m_hWnd, GWLP_USERDATA, 0L);    // Cancel class and window's bind relation
            if( pThis->m_bSubclassed ) pThis->Unsubclass();
            pThis->m_hWnd = NULL;
            pThis->OnFinalMessage(hWnd);
            return lRes;
        }
    }
    if( pThis != NULL ) {
        return pThis->HandleMessage(uMsg, wParam, lParam);  // Call subclass's messge process function
    }
    else {
        return ::DefWindowProc(hWnd, uMsg, wParam, lParam); 
    }
}
```
* Call CWindowWnd virtual function to subclass message.

* Event - DUILlib encapsulated message to be event and dispatch it to control.

* Notify - If want window to process some control's message, call this function, let control notify window, while window will register itself in Notify receiver queue in its OnCreate.

### Using tips
* Inheriting the `WindowImplBase` class, then implement its unimplemented virtual metheds to satify specified situation;

* `WindowImplBase` class already deal with some windows message by default,if some can't satify specified situation,override it;

* If some windows messages have been not dealt with by WindowImplBase class, deal with in `HandleCustomMessage` method;

* To use `DUI_DECLARE_MESSAGE_MAP` macro  map message functon;

* Using `CDialogBuilder` to create custom control or container from xml file;

* Remember this point : Control and custom UI in xml file always a good choice in most of case;

* Organizing whole UI element in separated xml files and do not conflit with C++ class inheritance through CreateControl method;
