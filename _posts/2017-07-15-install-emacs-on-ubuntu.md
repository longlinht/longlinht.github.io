---
layout: post
cover: false
title: Intall Emacs on Ubuntu
date:   2017-07-15 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
---

Install Emacs 25 on Ubuntu from source is very easy, follow these steps below could achieve it.

* Open terminal (Ctrl+Alt+T) and run command to install build tools:

```
sudo apt install build-essential checkinstall
```

* Then install the build dependencies via command:

```
sudo apt-get build-dep emacs24
```

* Now download the source at ftp.gnu.org/gnu/emacs/, then extract:


* Open terminal and navigate to the "emacs-25.1" folder via command (or select "Open in terminal" from its context menu):

```
cd ~/Downloads/emacs-25.1
```

* In the same terminal window, once you’re in the source folder, run the commands below one by one:

```
./configure
make
```

* Finally use checkinstall command to create .deb and install Emacs 25.1:

```
sudo checkinstall

```

While running the command, answer on screen questions, e.g., install docs, type package description, change package name, version, etc.

Once done, Emacs is installed on your system and you can remove it anytime by running the command in the prompt with sudo privilege:

In my case it’s:

```
sudo dpkg -r emacs-25

```
And the last command create a .deb package in the source folder, and it can be used in another Ubuntu machine to install Emacs(need to manually install dependencies via step 2).

Finally, run command emacs to launch the text editor, or launch it from Unity Dash (App Launcher) at next login (or next boot).

