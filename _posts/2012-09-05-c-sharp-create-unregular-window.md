---
layout: post
cover: false
title:  C#创建不规则窗体(控件)
date:   2012-09-05 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

创建不规则窗体和控件这个过程包含了大量的图形编程工作，不同的计算机因内存和显卡的不同可能会导致最终的效果有所不同 。创建不规则窗体具体步骤：

#### 先创建一个具有不规则形状的位图文件

1. 用任何画图程序创建不规则形状的位图。  

2. 用一种颜色画出一个不规则的区域作为程序的窗体，并用另一种颜色画出该位图的背景。

3．保存位图文件。

#### 下面创建窗体：在VS.net中创建一个新的工程

* 首先，设置窗体的背景从而建立窗体形状。

  * 将FormBorderStyle属性设置为None。

  * 将BackgroundImage属性设置为你创建的图片文件。

  * 将TransparencyKey属性设置为图片文件的背景颜色值。该属性使得位图的背景部分不可见，从而窗体就呈现出一个不规则形。

  * 保存工程,按Ctrl+F5可以运行此程序。

#### 实现关闭功能以及移动窗体的功能

* 实现窗体的关闭及移动：

    * 往窗体上拖放一个按钮控件。

    * 在属性对话框中，将该控件的Text属性设置为"关闭"。

    * 双击按钮添加一个Click事件处理函数，添加如下代码：

```
private void button1_Click(object sender, System.EventArgs e)
{
    this.Close();
}
```

    * 添加以下代码来创建一个Point对象，该对象（作为一个变量）决定在什么情况下移动窗体。

```
private Point mouse_offset; 
```

    * 创建窗体的MouseDown事件的事件处理函数。为该事件添加代码后，用户就可以在任何位置移动窗体了。代码如下

```
private void Form1_MouseDown(object sender, System.Windows.Forms.MouseEventArgs e)
{
       mouse_offset = new Point(-e.X, -e.Y);
}
```

    * 创建窗体的MouseMove事件的事件处理函数。当鼠标左键被按下，同时鼠标被移动时，窗体的Location属性就被设置为新的位置了，这样窗体就被用户拖动了。
```
private void Form1_MouseMove(object sender,
System.Windows.Forms.MouseEventArgs e)
{
    if (e.Button == MouseButtons.Left)
    {
       Point mousePos = Control.MousePosition;
       mousePos.Offset(mouse_offset.X, mouse_offset.Y);
       Location = mousePos;
    }
} 
```

#### 利用Windows API重绘窗体

所用到的函数：
```
        [ DllImportAttribute("gdi32.dll" )]
        public static extern IntPtr CreateRoundRectRgn(int nLeftRect, int nTopRect, int nRightRect, int nBottomRect, int nWidthEllipse, int nHeightEllipse);

        [ DllImportAttribute("gdi32.dll" )]
        static extern int CombineRgn( IntPtr hrgnDest, IntPtr hrgnSrc1, IntPtr hrgnSrc2, int fnCombineMode);

        [ DllImportAttribute("gdi32.dll" )]
        static extern int CombineRgn( IntPtr hrgnSrc1, IntPtr hrgnSrc2, int fnCombineMode);

        [ DllImportAttribute("user32.dll" )]
        public static extern int SetWindowRgn(IntPtr hWnd, IntPtr hRgn, bool bRedraw); 
```

在窗体的构造函数中添加如下定制代码：

```
        IntPtr smallRegion = CreateRoundRectRgn(6, 22, 149, 78, 20, 20);
        IntPtr largeRegion = CreateRoundRectRgn(3, 3, this .Width - 18, this.Height - 1, 20, 20);
        IntPtr destRegion = CreateRoundRectRgn(0, 0, this .Width, this.Height, 10, 10);
        int i = CombineRgn(destRegion, largeRegion, smallRegion, 2);
        SetWindowRgn( this.Handle, destRegion, true);
```

#### 创建不规则控件实现方法
   在窗体上画一个自定义形状的控件时，需要精确的告知窗体在什么位置以及如何画该控件。GraphicsPath类代表了一系列用来画图的直线和曲线。首先，指定一个GraphicsPath类的对象并告知它要画什么图形。然后，将控件的Region属性设置为上述GraphicsPath类的对象。这样就可以创建任何自定义形状的控件了。

##### 创建不规则控件具体步骤

    1. 创建一个GraphicsPath类的实例对象。

    2. 指定好该对象的各项细节（如大小、形状等等）。

    3. 将控件的Region属性设置为上面建立的GraphicsPath类的实例对象。

##### 下面举一个例子：创建一个像文本的按钮控件：

* 拖放一个按钮控件到窗体上。

* 在属性对话框中进行如下设置：

    * 将Name属性设置为CustomButton。

    * 将BackColor属性设置为一个和窗体背景颜色不同的颜色值。

    * 将其Text属性设置为空字符串。

* 添加窗体的Paint事件的事件处理函数。

* 添加以下代码，用GraphicsPath类的实例对象来画控件。下面的代码以一串字符串的形式画该按钮控件，同时，程序还设置了字符串的字体、大小、风格等属性。字符串被赋给GraphicsPath类的实例对象。然后，该实例对象就被设置为按钮控件的Region属性。这样一个自定义形状的控件就完成了。

```
private void CustomButton_Paint(object sender,
System.Windows.Forms.PaintEventArgs e)
{
    //初始化一个GraphicsPath类的对象
    System.Drawing.Drawing2D.GraphicsPath myGraphicsPath   = new
System.Drawing.Drawing2D.GraphicsPath();
    //确定一个字符串，该字符串就是控件的形状
    string stringText = Click Me!;
    //确定字符串的字体
    FontFamily family = new FontFamily(Arial);
    //确定字符串的风格
    int fontStyle = (int)FontStyle.Bold;
    //确定字符串的高度
    int emSize = 35;
    //确定字符串的起始位置，它是从控件开始计算而非窗体
    PointF origin = new PointF(0, 0);
    //一个StringFormat对象来确定字符串的字间距以及对齐方式
    StringFormat format = new StringFormat(StringFormat.GenericDefault);
    //用AddString方法创建字符串
    myGraphicsPath.AddString(stringText, family, fontStyle, emSize, origin, format);
    //将控件的Region属性设置为上面创建的GraphicsPath对象
    CustomButton.Region = new Region(myGraphicsPath);
}
```
* 创建按钮的Click事件的事件处理函数。添加该处理函数来改变控件的背景颜色，从而证实控件原来的那些功能没有被削减。

```
private void CustomButton_Click(object sender, System.EventArgs e)
{
    CustomButton.BackColor = Color.BlanchedAlmond;
}
```

##### 进一步优化效果

    以上我们运用了GraphicsPath类的实例对象来创建了自定义形状的一个按钮控件。不过我们用的是文本字符串形式的一个形状，是否可以用三角形或是圆形等形状呢？答案是肯定的。.Net Framework能为我们提供一些预先定义好了的形状以供我们在程序中使用。通过运用这些，你可以创造出几乎任意形状的控件，你还可以把它们结合起来使用以发挥更大的功能。  下面的实例就运用了四个椭圆，当它们被运用到控件上后，看起来就像人的眼睛，很有意思吧。

```
private void button1_Paint(object sender,
System.Windows.Forms.PaintEventArgs e)
{
    System.Drawing.Drawing2D.GraphicsPath myGraphicsPath   = new
System.Drawing.Drawing2D.GraphicsPath();
    myGraphicsPath.AddEllipse(new Rectangle(0, 0, 125, 125));
    myGraphicsPath.AddEllipse(new Rectangle(75, 75, 20, 20));
    myGraphicsPath.AddEllipse(new Rectangle(120, 0, 125, 125));
    myGraphicsPath.AddEllipse(new Rectangle(145, 75, 20, 20));
    //改变按钮的背景颜色使之能被容易辨认
    button1.BackColor = Color.Chartreuse;
    button1.Size = new System.Drawing.Size(256, 256);
    button1.Region = new Region(myGraphicsPath);
}
```

最后，你还得搞清楚窗体类是从System.Windows.Forms.Control类继承而来的。也就是说，由窗体设计器提供给你的窗体最终还是一个控件。因此，你能用位图文件创建一个不规则的窗体，你还能用GraphicsPath类对象来像创建自定义形状的控件那样创建不规则的窗体。有兴趣的读者不妨用此方法一试效果。 最后再举一个更好的例子：一个和微软的Windows Media Player 7的界面差不多的界面。创建步骤如下：

1．将某种颜色设置为窗体的背景颜色，然后将窗体的TransparenceKey属性设置为那种颜色，同时将窗体的FormBorderStyle属性设置为None。

2．重载`Form_Paint()`函数：

```
protected override void OnPaint(PaintEventArgs e)
```

或是
```
this.Paint += new System.Windows.Form.PaintEventHandler(Form_Paint)。
```

 3．程序的主体部分的函数如下：
```
private void Form_Paint(object sender, PaintEventArgs e) {
    Graphics g = e.Graphics;
    Rectangle mainRect = new Rectangle(0, 0, 695, 278);
    Region mainRegion = new Region(mainRect);
    e.Graphics.SetClip(mainRegion, CombineMode.Replace);
    Point point1 = new Point(0, 32);
    Point point2 = new Point(9, 20);
    Point point3 = new Point(21, 13);
    Point point4 = new Point(34, 9);
    // 创建一个以点为元素的数组
    Point[] curvePoints = { point1, point2, point3, point4 };
    // 创建一个GraphicsPath对象并添加一条曲线
    GraphicsPath myPath = new GraphicsPath();
    myPath.AddCurve(curvePoints, 0, 3, 0.8f);
    myPath.AddLine(36, 9, 378, 9);
    point1.X=378;point1.Y=9;
    point2.X=387;point2.Y=5;
    point3.X=394;point3.Y=0;
    Point[] curvePoints2 = { point1, point2, point3 };
    myPath.AddCurve(curvePoints2, 0, 2, 0.8f);
    myPath.AddLine(394, 0, 0, 0);
    Region ExcludeRegion3 = new Region(myPath);
    e.Graphics.ExcludeClip(ExcludeRegion3);

    GraphicsPath myPath3 = new GraphicsPath();
      point1.X=0;point1.Y=180;
      point2.X=19;point2.Y=198;
      point3.X=62;point3.Y=204;
      point4.X=83;point4.Y=221;
      Point point5 = new Point(93, 248);
      Point point6 = new Point(102, 267);
      Point point7 = new Point(125, 278);
      Point[] curvePoints3 = { point1, point2, point3, point4,
point5, point6, point7 };
      myPath3.AddCurve(curvePoints3, 0, 6, 0.8f);
      myPath3.AddLine(125, 278, 90, 300);
      myPath3.AddLine(90, 300, 0, 300);
      Region ExcludeRegion2 = new Region(myPath3);
      e.Graphics.ExcludeClip(ExcludeRegion2);
      point1.X=454;point1.Y=0;
      point2.X=470;point2.Y=12;
      point3.X=481;point3.Y=34;
      Point[] curvePoints4 = { point1, point2, point3 };
      GraphicsPath myPath2 = new GraphicsPath();
      myPath2.AddCurve(curvePoints4, 0, 2, 0.8f);
      myPath2.AddLine(481, 30, 481, 76);
      myPath2.AddLine(481, 76, 495, 76);
      myPath2.AddLine(495, 76, 495, 0);
      Region ExcludeRegion4 = new Region(myPath2);
      e.Graphics.ExcludeClip(ExcludeRegion4);
      GraphicsPath myPath5 = new GraphicsPath();
      point1.X=481;point1.Y=76;
      point2.X=494;point2.Y=115;
      point3.X=481;point3.Y=158;
      Point[] curvePoints5 = { point1, point2, point3 };
      myPath5.AddCurve(curvePoints5, 0, 2, 0.8f);
      myPath5.AddLine(481, 158, 481, 279);
      myPath5.AddLine(481, 255, 495, 279);
      myPath5.AddLine(495, 279, 495, 0);
      Region ExcludeRegion6 = new Region(myPath5);
      e.Graphics.ExcludeClip(ExcludeRegion6);

      point1.X=480;point1.Y=250;
      point2.X=469;point2.Y=264;
      point3.X=446;point3.Y=278;
      Point[] curvePoints6 = { point1, point2, point3 };
      GraphicsPath myPath4 = new GraphicsPath();
      myPath4.AddCurve(curvePoints6, 0, 2, 0.8f);
      myPath4.AddLine(450, 277, 495, 279);
      Region ExcludeRegion5 = new Region(myPath4);
      e.Graphics.ExcludeClip(ExcludeRegion5);

      e.Graphics.DrawImage(img, 0, 0, 695,278);

      // 重设剪切好的区域
      e.Graphics.ResetClip();
}
```
