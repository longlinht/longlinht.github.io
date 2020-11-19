---
layout: post
cover: false
title: 用python脚本优雅的整理Kindle的标注和笔记
date:  2020-11-11 20:54:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

我是重度Kindle使用者，Kindle里面存满了各类书籍，经常会同时读两三本书，时间一长，多本书的标注和笔记都交叉记录在My Clippings.txt文本文件里，现在这个文件已经有几万行，每次手动去整理特定的一本书的标注和笔记时都极为头疼，还容易错漏，终于有一天实在忍不了了，就去网上找有没有整理kindle标注和笔记的服务，还真让我给找到了，clipping.io，在线服务，马上使用，上传My Clippings.txt文件，一切顺利，文件上传后开始分析整理文本，看到几本书的标注已经出来了，等全部整理结束后发现少了好几本书的，再次重新上传文件重试整理，问题依旧，空欢喜一场，依旧不能解决我的痛点，最近在读的两本书的标注和笔记恰好没有被整理出来，一怒之下，决定自己用python脚本来写一个这样的整理工具，还以为得花费一两天的时间，一不小心，两个小时不到的功夫写完了，调试了一番，完全满足我的需求，现在只需一条命令，传入书名就可以整理出指定的一本书的所有标注和笔记，脚本如下：


```

# coding=utf-8

import os
import sys

def main():
   filepath = sys.argv[1]
   bookName = sys.argv[2]

   if not os.path.isfile(filepath):
       print("File path {} does not exist. Exiting...".format(filepath))
       sys.exit()

   DELIMITER = "=========="
   TIME_MAKR = "- 您在第"
   lineNum = 0
   books = {}
  
   bag_of_words = {}
   with open(filepath) as fp:
       encounter = False
       delimiterCount = 0
       curBookName = ""
       for line in fp:
           if lineNum == 0:
               books[line] = []
               curBookName = line
               delimiterCount += 1
           else:
               if line.startswith(DELIMITER):
                   delimiterCount += 1
                   encounter = True
               else:
                   if encounter == True:
                       if line in books:
                           curBookName = line
                       else:
                           books[line] = []
                       encounter = False
                       curBookName = line
                   else:
                       books[curBookName].append(line)
           lineNum += 1
           #print(line)

       fp.close()            

   outFile = open("MyClippingOutput.txt", "w")
   for k in books:
       if k.startswith(bookName) :
           outFile.writelines(k)
           lines = books[k]
           for l in lines:
               if l.startswith(TIME_MAKR):
                   continue
               if l.startswith(bookName):
                   continue
               outFile.writelines(l)
   outFile.close()

if __name__ == '__main__':
    main()

```

目前这个脚本我只是自用，满足我个人的需求，我想肯定也有很多kindle的重度使用者有类似的需求，后续我准备把这个工具也做成在在线服务，使用方式类似clipping.io，做到比clipping.io的可定制型更强，能够适应更多的异常情况，因为我发现clipping.io对一些不规范的书名的容错性很差。期待这个服务上线！
