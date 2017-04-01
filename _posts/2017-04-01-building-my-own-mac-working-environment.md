---
layout: post
cover: false
title:  Building My Own Mac Working Environment
date:   2017-04-01 22:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
---

In recent 2 years, I have switched my own working environment from Windows to Ubuntu and Mac. For the reason that I switched C/C++ development for Windows to Java development for Android. But I still prefer C++, so I won't give up C/C++ programming. In this article I will write down detail steps that how I build working environment. This working environment on Mac is a general working environment, not just for Android development but also C/C++ development. Let's start!

First, I would install some universal tools.

### Universal Tools

#### Install and configure Oh my zsh

* Install via curl or wget

**via curl**

```
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
```
**via wget**

```
sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"
``` 

* Configure my prefer feature via edit .zshrc file

Add this line to .zshrc file
```
plugins=(git vi-mode adb)
```
#### Install and configure iTerm

* Install lastest release dmg

* Clone solarized git project from github and import color scheme for iTerm2
```
git clone https://github.com/altercation/solarized.git
cd iterm2-colors-solarized
./Solarized Dark.itermcolors
```
#### Install userful command line tools
* Install brew - `ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`

* Install ctags - `brew install ctags`

* Install cscope - `brew install cscope`

* Install ag - `brew install ag`

* Install grip - `brew install grip`

#### Install and configure Vim

* Install vim via source
```
git clone https://github.com/vim/vim.git
cd vim 
./configure --with-features=huge --enable-gui=gnome2 --enable-pythoninterp=yes --enable-cscope --enable-gui=auto \ --enable-gtk2-check --enable-gnome-check \ --enable-fail-if-missing --enable-multibyte --enable-fontset \ --with-x --with-compiledby="Tao He"
make
sudo make install
```
* Configure vim
```
cd ~
git clone https://github.com/longlinht/vimrc.git ~/.vim_runtime
sh ~/.vim_runtime/install_awesome_vimrc.sh
```
### Utilities

* Install Alfred

* Install Dropbox

* Install NutsCloud

### Install IDE

#### Install and configure Android Studio

* Install Android Studio via dmg

* Install and configure ideavim plugin 
```
Install ideavim in Android Studio
git clone https://github.com/longlinht/VimForIDEs.git
In Android Studio -> File ->Import Settings -> Choose VimForIDEs/ideavim/monokai/settings.jar
```

There are some userful application I have installed, but I don't want to list them becasue their easy installation. Until now, I work comfortably in this woking environment. Maybe I will develop a script to automate this process in the future. If I make it done, I would update this article and supply this script.
