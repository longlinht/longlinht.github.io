---
layout: post
cover: false
title: 解决TextView中emoji被截断的问题
date:  2020-04-21 20:54:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true
---

理论上TextView中包含emoji显示是没有问题的，问题出在如果TextView限制了宽度，且末尾包含了emoji字符，但是又不够显示，则会出现乱码的情况，原因是单个emoji由两个字符组成，TextView在截断字符时按单个字符截断，所以就有emoji的两个字符被截断后显示的情况，TexView自然无法正常显示。网上有很多解决办法，思路都是通过改变TextView的行为来规避这个问题，但都不理想，在一些特殊情况下仍然有问题。后来我改变了思路，不对TextView做任何更改，而是通过保证emoji本身不被截断来解决问题。

考虑这样一个场景，直播间顶部主播区域的主播昵称，肯定是有字数限制的，如果昵称中包含emoji，如何保证emoji不被截断，并且不丧失在昵称过长后需要...的功能?

代码如下:

```

private void setAnchorName(String nick) {
    if (TextUtils.isEmpty(nick)) {
        labelUserName.setText("");
        return;
    }
    int len = TextCharUtils.getCurLength(nick);
    if (len <= 8) {
        labelUserName.setText(nick);
        return;
    }
    String newNick = TextCharUtils.substring(nick, 6) + "...";
    labelUserName.setText(newNick);
}

```
思路很好理解，就是预先算出String的长度，来决定要不要做处理。 准确计算字符长度的工具类如下:

```
public class TextCharUtils {
    /**
     * 获取字符串中个数（汉字、emoji算2个长度，数字、英文算一个）
     *
     * @param source
     * @return
     */
    public static int getCurLength(String source) {
        if (TextUtils.isEmpty(source)) {
            return 0;
        }
        int codePointCount = source.codePointCount(0, source.length());
        int temp = 0;
        int size = 0;
        for (int i = 1; i <= codePointCount; i++) {
            int index = source.offsetByCodePoints(0, i);
            String sub = source.substring(temp, index);
            if ("".equals(sub)) {
                continue;
            }
            size += getCharSize(sub.charAt(0));
            temp = index;
        }
        return size;
    }

    /**
     * 截取字符串（汉字、emoji算2个长度，数字、英文算一个）
     *
     * @param source
     * @param end
     * @return
     */
    public static String substring(String source, int end) {
        if (TextUtils.isEmpty(source)) {
            return source;
        }
        StringBuffer sb = new StringBuffer();
        int codePointCount = source.codePointCount(0, source.length());
        int temp = 0;
        int size = 0;
        for (int i = 1; i <= codePointCount; i++) {
            int index = source.offsetByCodePoints(0, i);
            String sub = source.substring(temp, index);
            if (TextUtils.isEmpty(sub)) {
                continue;
            }
            size += getCharSize(sub.charAt(0));
            if (size > end) {
                break;
            }
            sb.append(sub);
            temp = index;
        }
        return sb.toString();
    }

    public static int getCharSize(char word) {
        return (isChineseChar(word) || isEmojiCharacter(word)) ? 2 : 1;
    }

    /**
     * 计算中文字符与表情字符
     */
    public static Pair<Integer, Integer> getSpecialCharNum(CharSequence sequence) {
        if (TextUtils.isEmpty(sequence)) {
            return new Pair<>(0, 0);
        }
        int chineseNum = 0, emojiNum = 0;
        for (int i = 0; i < sequence.length(); i++) {
            char word = sequence.charAt(i);
            if (isChineseChar(word)) {//中文
                chineseNum++;
            }

            if (isEmojiCharacter(word)) {
                emojiNum++;
            }
        }
        return new Pair<>(chineseNum, emojiNum / 2);
    }

    public static CharSequence getSubString(CharSequence sequence, int maxChar) {
        if (TextUtils.isEmpty(sequence)) {
            return sequence;
        }

        int size = 0;
        for (int i = 0; i < sequence.length(); i++) {
            char word = sequence.charAt(i);
            if (isChineseChar(word)) {
                size += 2;
            } else {
                size++;
            }

            if (size >= maxChar) {
                return sequence.subSequence(0, i + 1);
            }
        }

        return sequence;
    }

    /**
     * 判断是否是中文
     */
    public static boolean isChineseChar(char c) {
        Character.UnicodeBlock ub = Character.UnicodeBlock.of(c);
        return ub == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS
                || ub == Character.UnicodeBlock.CJK_COMPATIBILITY_IDEOGRAPHS
                || ub == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A
                || ub == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_B
                || ub == Character.UnicodeBlock.CJK_SYMBOLS_AND_PUNCTUATION
                || ub == Character.UnicodeBlock.HALFWIDTH_AND_FULLWIDTH_FORMS
                || ub == Character.UnicodeBlock.GENERAL_PUNCTUATION;
    }

    public static boolean isEmojiCharacter(char codePoint) {
        return !(codePoint == 0x0 || codePoint == 0x9 || codePoint == 0xA ||
                codePoint == 0xD || codePoint >= 0x20 && codePoint <= 0xD7FF);
    }
}

```

