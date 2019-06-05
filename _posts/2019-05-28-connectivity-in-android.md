---
layout: post
cover: false
title: 优化App网络连通性问题
date:  2019-05-28 20:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
---

最近遇到一个棘手的问题，我们开发的一款App在中东那边出现大量的`UnknownHostException`, 导致App在中东那边体验很糟，很快这个问题就被抛给了我们技术优化组，我和另外一名同事就开始定位问题的原因并且试图提出一个可行的解决方案。一般理解，出现`UnkownHostException`就是DNS失败了，在我们开始解决这个问题的时候，App的网络库已逐渐开始使用OkHttp，我们想到自定义DNS过程，在系统DNS失败的情况下再尝试其他DNS方式，降低`UnknownHostException`出现的频率，优化App网络连通性。
为了实现我们的技术方案，我们针对OkHttp的DNS做了如下几件事:

* 创建OkHttpClient时自定义DNS

```
OkHttpClient.Builder builder = new OkHttpClient.Builder()
    // 实现OKHttp DNS接口, 改变默认的DNS行为
    .dns(OkHttpDns.getInstance())
```

上面的OkHttpDns须实现Dns接口

* 实现自定义DNS

目前我们的设计是使用责任链模式实现四层DNS的lookup: 

```

Local Cache --> System DNS --> GA --> Google DNS


```

其中第一层是本地DNS缓存(Local Cache)，整个缓存只是内存缓存，DNS过程开始时，先去本地缓存找，如果在缓存中没有命中，就走系统DNS， 系统DNS如果也失败，整个链条就继续往下，到GA，到Google DNS，如果到Google DNS还没有解析成功，仍旧抛出`UnknownHostException`，DNS过程失败。基本的代码逻辑如下:

``` 
private OkHttpDns() {

  //使用责任链模式实现四层DNS的lookup: Local Cache --> System DNS --> GA --> Google DNS
  mDnsChain = new CacheDnsHandler();

  SystemDnsHandler okhttp = new SystemDnsHandler();
  GADnsHandler ga = new GADnsHandler();
  GoogleHttpDnsHandler google = new GoogleHttpDnsHandler();

  mDnsChain.setTarget(okhttp);
  okhttp.setTarget(ga);
  ga.setTarget(google);
}

@Override
public List<InetAddress> lookup(String hostname) throws UnknownHostException {
  // IP直连的情况,直接返回
  if (InetAddressValidator.isIPAddress(hostname)) {
      return Arrays.asList(InetAddress.getAllByName(hostname));
  }

  List<InetAddress> allDNSResult = new ArrayList<>();
  List<InetAddress> list = mDnsChain.lookup(hostname, allDNSResult);

  if (list == null) {

      // DNS完全失败后,清空黑名单,删除local cache相应的条目
      IPStatusCache.getInstance().clear();

      if (allDNSResult.isEmpty()) {
          throw new UnknownHostException("Broken system behaviour for dns lookup of " + hostname);
      } else {
          return allDNSResult;
      }
  }
  return list;
}

```

* 添加黑名单机制，进一步优化DNS
一次连接成功后缓存DNS结果，host+ip为key，IPStatus为value，连接失败后会更新DNS缓存的失败次数，超过5次则认为进入了黑名单，在每次DNS完全失败后清空本地DNS缓存，防止所有的缓存都进入黑名单，缓存失效。

* 处理IP直连的情况
这种情况的处理很简单，检查传入的host是不是ip，如果是就直接返回。

经过这样的优化以后，`UnknownHostException`在请求失败中的比重和请求的总失败率大幅下降，验证了我们这个技术方案的合理性，可以说网络连通性大大提高，再次回顾这个方案，突然发现它其实一个通用的解决方案，虽然我们这次解决的是海外，如中东地区的连通性问题，其实这个方案完全可以移植到国内，只要将Google HttpDNS换成国内的HttpDNS即可，整体的DNS流程可以不做任何改动即可成为一个完整的App DNS解决方案。












