---
layout: post
cover: false
title: A practical way to make sure the correctness of your algorithm
date:   2023-07-20 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

As programmers, it really frustrates us when we cannot 100 percent make sure the functions or algorithms we have written can produce the results we expected. Although we have passed many test cases, we are still not confident enough to say these functions can work and output correct values in all cases. It is impossible for us to have a test case system like Leecode wherever and whenever. It is not realistic. So we need to figure out a way to test our algorithm ourselves. Fortunately, there is indeed one.

As a fact, this method is based on comparing an existing solution to verify a new one. It sounds simple, right? What are we waiting for? Let us implement it step by step.

* Identify a function or algorithm you would like to test. For this example, it is a selection sort function we wrote.

```
public static void selectionSort(int[] arr) {
		if (arr == null || arr.length < 2) {
			return;
		}
		for (int i = 0; i < arr.length - 1; i++) {
			int minIndex = i;
			for (int j = i + 1; j < arr.length; j++) { 
				minIndex = arr[j] < arr[minIndex] ? j : minIndex;
			}
			swap(arr, i, minIndex);
		}
	}

```

* In order to compare, we need to implement a simple function, which also can sort the array using an existed and verified solutiion. In this case we using a Java API.

```
public static void comparator(int[] arr) {
    Arrays.sort(arr);
}

```

* Implement a random sample generator. 

```
public static int[] generateRandomArray(int maxSize, int maxValue) {
    int[] arr = new int[(int) (Math.random() * maxSize) + 1];
    arr[0] = (int) (Math.random() * maxValue) - (int) (Math.random() * maxValue);
    for (int i = 1; i < arr.length; i++) {
        do {
            arr[i] = (int) (Math.random() * maxValue) - (int) (Math.random() * maxValue);
        } while (arr[i] == arr[i - 1]);
    }
    return arr;
}
```

* Write a function to compare output.

```
public static boolean isEqual(int[] arr1, int[] arr2) {
    if ((arr1 == null && arr2 != null) || (arr1 != null && arr2 == null)) {
        return false;
    }
    if (arr1 == null && arr2 == null) {
        return true;
    }
    if (arr1.length != arr2.length) {
        return false;
    }
    for (int i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) {
            return false;
        }
    }
    return true;
}

```

* Using various size of sample to test the function we wrote and compare to the existed solution.

```
public static void main(String[] args) {
    int testTime = 500000;
    int maxSize = 100;
    int maxValue = 100;
    boolean succeed = true;
    for (int i = 0; i < testTime; i++) {
        int[] arr1 = generateRandomArray(maxSize, maxValue);
        int[] arr2 = copyArray(arr1);
        selectionSort(arr1);
        comparator(arr2);
        if (!isEqual(arr1, arr2)) {
            succeed = false;
            printArray(arr1);
            printArray(arr2);
            break;
        }
    }
    System.out.println(succeed ? "Nice!" : "Fucking fucked!");

    int[] arr = generateRandomArray(maxSize, maxValue);
    printArray(arr);
    selectionSort(arr);
    printArray(arr);
}

```

We can randomly set the test time and sample size to do loads of tests to make sure the function works and outputs correctly. If it can produce expected results after millions of tests. We can be sure of the correctness of this function. But if there is one time they are not equal, in other words, `selectionSort` produces outputs that are not equal, `comparator`. We have to say the new solution cannot be accepted; we should debug and test more to find the problem. As long as we use this sharp comparator more and more, we will have more confidence to write down more reliable algorithms.
