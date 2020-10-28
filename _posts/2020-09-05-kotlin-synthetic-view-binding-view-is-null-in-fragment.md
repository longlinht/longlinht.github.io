---
layout: post
cover: false
title: Kotlin synthetic binding view is null in Fragment 
date:   2020-09-08 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

Kotlin provide a handy and concise way to access views in xml layout from code, it works well, but When I create a subclass of `DialogFragment`, in its method `onCreateView`, I access synthetic binding view, it seems all is fine, but when run these code, app crash. In logcat, I got this `NullPointerException`:

>Caused by: java.lang.NullPointerException: Attempt to invoke virtual method 'android.view.View android.view.View.findViewById(int)' on a null object reference

I'm sure synthetic statement is imported and view id is right, it confused me a bit. So I Google Kotlin synthetic binding view related web pages, finally I found a solution:

Just move accessing syntheic binding view statement from `onCreateView` to `onViewCreated`.

The problem is that I am accessing it too soon, When I delay the chance to access view, all works well. Magic! But it’s nothing magical, if you decompile the bytecode (By going toTools -> Kotlin -> Show Kotlin Bytecode and then selecting Decompile in the pane) and take a look at the generated java class, you’ll see that all it does is call findViewById() for us. Although this is a simple problem, but it is useful to record it.




























