---
layout: post
cover: false
title:  Capturing and Merging Window Screenshots in Windows
date:   2013-09-13 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

This essay discusses a program written in C++ that captures screenshots of multiple windows and merges them into a single image file using the GDI+ library in Windows. The main functionalities of this program include obtaining device contexts from windows, creating compatible bitmaps, and saving the merged image in PNG format. Let's delve into the details of each step and the code implementation.

#### Setting Up the Environment

The program begins by including necessary headers and namespaces. `windows.h` is included for Windows-specific functions, and `GdiPlus.h` for GDI+ graphics capabilities. GDI+ is initialized using `GdiplusStartupInput` and `GdiplusStartup`.

#### Structure Definition

A `BMP` structure is defined to hold the width, height, and handle to a bitmap (HBITMAP). This structure will be used to store information about each captured window.

```cpp
typedef struct
{
    int width;
    int height;
    HBITMAP hbmp;
} BMP;
```

#### Finding Image Encoder

The function `GetEncoderClsid` helps in finding the CLSID of the desired image encoder. This is essential for saving images in formats like PNG.

```cpp
int GetEncoderClsid(const WCHAR* format, CLSID* pClsid)
{
   UINT num = 0; //number of image encoders
   UINT size = 0; //size of the image encoder array in bytes

   ImageCodecInfo* pImageCodecInfo = NULL;

   GetImageEncodersSize (&num, &size);
   if (size == 0)
      return-1;//Failure

   pImageCodecInfo = (ImageCodecInfo *) (malloc (size));
   if (pImageCodecInfo == NULL)
      return-1;//Failure

   GetImageEncoders (num, size, pImageCodecInfo);

   for (UINT j = 0; j <num; ++ j)
   {
      if (wcscmp (pImageCodecInfo [j].MimeType, format) == 0)
      {
         *pClsid = pImageCodecInfo [j].Clsid;
         free (pImageCodecInfo);
         return j;//Success
      }   
   }

   free (pImageCodecInfo);
   return-1; //Failure
}
```

#### Capturing Window Screenshots

The function `getBitmaps` takes a vector of window handles and captures the content of each window. For each window, it retrieves the window size, creates a compatible device context (DC), and copies the window content to a bitmap.

```cpp
vector<BMP*> getBitmaps(vector<HWND> hWnds)
{
    vector<BMP*> bmps;
     if(hWnds.size() == 0)
        return bmps;
     int n = hWnds.size();
    
     for(int i = 0; i < n; i++)
    {
        // 获得窗口大小  
       RECT rect; 
       GetWindowRect(hWnds[i], &rect);
        int width = rect.right - rect.left;
        int height = rect.bottom - rect.top;
       
        // 复制窗口的DC并去除 bitmap
       HDC hdc, hdcTemp;
       HBITMAP hbmp, hbmpTemp;
       hdc = GetWindowDC(hWnds[i]);
       hdcTemp = CreateCompatibleDC(hdc);
       hbmp = CreateCompatibleBitmap(hdc, width, height);
       hbmpTemp = (HBITMAP)SelectObject(hdcTemp, hbmp);
       BitBlt(hdcTemp, 0, 0, width, height, hdc, 0, 0, SRCCOPY);
       hbmp = (HBITMAP)SelectObject(hdcTemp, hbmpTemp);
       
       BMP *bmp = new BMP();
       bmp->width = width;
       bmp->height = height;
       bmp->hbmp = hbmp;
       bmps.push_back(bmp);

       DeleteObject(hbmpTemp);
       DeleteDC(hdcTemp);
    }
    
     return bmps;
}
```

#### Merging Bitmaps

The `mergeBitmaps` function merges all the captured bitmaps into a single image. It calculates the total width and height required for the merged image, creates a new `Bitmap` object, and uses GDI+ `Graphics` to draw each bitmap at the appropriate position. The merged image is then saved as a PNG file.

```cpp
Bitmap* mergeBitmaps(vector<BMP*> bmps, WCHAR* dst)
{
    ULONG_PTR token;
    GdiplusStartupInput input;

    GdiplusStartup(&token, &input, NULL);

     int n = bmps.size();

     if(n == 0)
        return NULL;
    
     // 计算位图合并后的长宽，所有位图排列成一竖排，左对齐
     int width = 0;
     int height = 0;
     for(int i = 0; i < n; i++)
    {
        if(bmps[i]->width > width)
           width = bmps[i]->width;
       height += bmps[i]->height;
    }
    height += n - 1;

    Bitmap *dstBitmap = new Bitmap(width,height);
    Status rc;

    CLSID pngClsid;
    GetEncoderClsid(L "image/png", &pngClsid);

    vector<Bitmap*> bps;
    Graphics *g;

     int y = 0;
     for(int i = 0; i < n; i++)
    {
       Bitmap *bmp = new Bitmap(bmps[i]->hbmp,NULL);
       bps.push_back(bmp);
       g = Graphics::FromImage(dstBitmap);
       rc = g->DrawImage(bmp, 0, y);
       y += bmps[i]->height;
    }

    rc = dstBitmap->Save(dst, &pngClsid, NULL);

     if(g != NULL)
        delete g;

     for(int i=0;i<n;i++){
        if(bps[i] != NULL)      
            delete bps[i];
    }

    GdiplusShutdown(token);
    return dstBitmap;
}
```

#### Capturing Screen

```cpp

int captureScreen(WCHAR* dst, vector<HWND> hWnds)
{
int n = hWnds.size();
if(n == 0)
return NULL;

    vector<BMP*> bms = getBitmaps(hWnds);
    Bitmap *bmp = mergeBitmaps(bms,dst);
     return 0;
}

```

#### Main Function

The `main` function demonstrates the usage of the above functions. It finds the handles of specific windows (e.g., "ShineCloud Client", "Qt Creator", "Windows Task Manager"), stores them in a vector, and calls `printScreen` to capture and merge their screenshots.

```cpp
int main()
{
    HWND wnd = FindWindow(NULL, L"ShineCloud Client");
    HWND wnd1 = FindWindow(NULL, L"qtscc - Qt Creator");
    HWND wnd2 = FindWindow(NULL, L"Windows 任务管理器");
    vector<HWND> hWnds = {wnd, wnd1, wnd2};
    captureScreen(L"D:\\ShineWonder\\Workspace\\printscreen\\Debug\\1.png", hWnds);
    return 0;
}
```

### Conclusion

This program effectively captures screenshots of multiple windows and merges them into a single image using the GDI+ library. By leveraging the Windows API and GDI+, it provides a practical example of handling graphical data in a Windows environment. This approach can be extended for various applications requiring screenshot capturing and processing.


