---
layout: post
cover: false
title: Memory Leak in Android Development
date:   2016-08-01 14:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

When programming Android, although java has GC mechanism, some our wrong code way and personal habits still cause memory leak, GC also can't fix it.

#### Senario 1: When programming a single instance

* Error way:

```java
public class Sample{      
    private static Sample sample;
    private Context mContext; 
    private Sample(Context mContext){
         this.mContext = mContext;
    }
    public static Sample getInstance(Context mContext){
         if(sample == null)
              sample = new Sample(mContext);
         return sample;
    }
    public void otherAction(){
         mContext.act();
    }
}
```

* Error reason:

If we use ``Sample.getInstance()`` in Acitivity A, pass ``this`` to Sample's ``getInstatnce`` static method, because Sample is static single instance, it exists untill application exit. But Sample's member variable still hold reference to Activity A, it causes Activity A can't be destroied. If we pass applicationContext, it doesn't cause this problem.

* Right way:

```java
public class Sample{
     private static Sample sample;
     private Context mContext;
     private Sample(Context mContext){
          this.mContext = mContext;
     }
     public static Sample getInstance(Context mContext){
          if(sample == null)
               sample = new Sample(mContext.getApplicationContext());
          return sample;
     }
     public void otherAction(){
          mContext.act();
     }
}
```
     
#### Senario 2: When use anonymous inner class

* Error way:
```java
public class SampleActivity extends Activity{
     private TextView textView;          
     private Handler handler = new Handler(){
          @override
          public void handlerMessage(Message msg){

          }
     };

     @override
     public void onCreate(Bundle bundle){
          super.onCreate(bundle);
          setContextView(R.layout.activity_sample_layout);
          textView = (TextView)findViewById(R.id.textView);
          handler.postDelayed(new Runnable(){

               @override
               public void run(){
                    textView.setText("ok");
               };

          },1000 * 60 * 10);
     }
}
```

* Error reason:

When execute the ``SampleAcitvity``'s ``finish`` method, the delayed messages will exist in main thread for 10 minutes before be processed, while this message contains reference to Handler, Handler is a anonymous inner class, it hold reference to external SampleAcivity, so cause SampleAcivity can't be recycled. Above ``Runnable`` also is a anonymous inner class, it also prevent SampleActivity to be recycled.

* Right way:

**A static anonymous inner class instance will not hold reference to external class.**

```java
public class SampleActivity extends Activity{
     private TextView textView;
     private static class MyHandler extends Handler {

     private final WeakReference<SampleActivity> mActivity;
     public MyHandler(SampleActivity activity) {
          mActivity = new WeakReference<SampleActivity>(activity);
     }

     @Override
     public void handleMessage(Message msg) {
          SampleActivity activity = mActivity.get();
               if (activity != null) {

               }
          }
     }

     private final MyHandler handler = new MyHandler(this);

     @override
     public void onCreate(Bundle bundle){
          super.onCreate(bundle);
          setContextView(R.layout.activity_sample_layout);
          textView = (TextView)findViewById(R.id.textView);
          handler.postDelayed(new MyRunnable(textView),1000 * 60 * 10);
     }

     private static class MyRunnable implements Runnable{
        
        // use WeakReference to hold external class's member variables.
        private WeakReference<TextView> textViewWeakReference;
        public MyRunnable(TextView textView){
             textViewWeakReference = new WeakReference<TextView>(textView);
        }

        @override
        public void run(){
              final TextView textView = textViewWeakReference.get();
              if(textView != null){
                   textView.setText("OK");
              }

        };
     }
}
```

#### Senario 3: Forgot call removeCallbacksAndMessages after use handler

* Right way:

In onDestroy call this method:

```java
     handler.removeCallbacksAndMessages(null);
```

This call passed null will destroy all Runnable and Message related to handler.

#### Conclude

* Don't let object whose lifecycle longer then Acivity hold reference to Acivity.

* Prefer to use Application's Context rather than Activity's Context.

* Prefer to use static anonymous inner class rather than non-static.

* Use weak reference to hold external class's member variables.

* GC can't fix memory leak.

#### Reference

>In Android, Handler classes should be static or leaks might occur, Messages enqueued on the application thread’s MessageQueue also retain their target Handler. If the Handler is an inner class, its outer class will be retained as well. To avoid leaking the outer class, declare the Handler as a static nested class with a WeakReference to its outer class

>When an Android application first starts, the framework creates a Looper object for the application’s main thread. A Looper implements a simple message queue, processing Message objects in a loop one after another. All major application framework events (such as Activity lifecycle method calls, button clicks, etc.) are contained inside Message objects, which are added to the Looper’s message queue and are processed one-by-one. The main thread’s Looper exists throughout the application’s lifecycle.

>When a Handler is instantiated on the main thread, it is associated with the Looper’s message queue. Messages posted to the message queue will hold a reference to the Handler so that the framework can call Handler#handleMessage(Message) when the Looper eventually processes the message.

>In Java, non-static inner and anonymous classes hold an implicit reference to their outer class. Static inner classes, on the other hand, do not.


