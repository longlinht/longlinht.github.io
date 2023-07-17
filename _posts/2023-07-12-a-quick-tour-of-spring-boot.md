---
layout: post
cover: false
title: A quick tour of Spring Boot
date:   2023-07-12 18:20:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

As an Android developer currently, I have always dreamed of becoming a full-stack developer, so I started to learn Java backend programming. During the past two weeks, I have read one book and watched a series of tutorial videos on Spring Boot. So I am going to summarize what I have learned and write down my thoughts.

I have to admit that I had never heard of Spring Boot before I started learning it. After I effortlessly started up a simple project and ran it successfully following the steps the book describes, I have to say it is pretty easy to create and run an application. It just takes one or two minutes to start a runnable program without any extra effort. It just works.

So the first question is what such a powerful Spring Boot is. Actually, it is not a mysterious thing. You can treat it as an enhanced Spring, which simplifies the complicated configurations and makes dependency management unprecedentedly easy. Let us compare the differences between Spring and Spring Boot in configurations to experience the attractions of Spring Boot for developers.

for Spring applications:

* We have to manually add dependency in pom.xml
* We have to manually program the Web3.0 configuration class.
* We have to manually write the Spring/Spring MVC configuration class.

while for Spring Boot applications:

We only need to check a dependency to add it or manually add it, not manually write a configuration class anymore. Writing business controllers and designing data models become the only things we need to do. It significantly speeds up the process of development. No configurations, no worry about dependencies, especially dependency versions—it sounds amazing. We cannot stop asking, How did Spring Boot make it? The answer is that these configurations and dependencies are embedded into Spring Boot. The starter is the key point. Spring Boot has embedded most dependencies we need and organized every dependency with the most matched versions. For example, if we need Spring Web, we just add lines like below:

```

<dependencies>

...

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
...

<dependencies>
```

You may have noticed that the dependency didn't specify the version and that the name of artifactId contains `starter`. The version is not necessary any more; Spring Boot helps us figure out all embedded dependencies with the proper version based on the Spring Boot version. This saves us much time and effort in finding the matched versions of dependencies. As an Android developer, I have to say that Android developers also need a framework like this, which can do the most dirty work for us.

Spring Boot also helps us avoid writing boilerplate code like the Spring MVC configuration class. I think it makes the most use of the annotation and the reflection of Java to implement. It is not uncommon to find that almost all production-grade frameworks written in Java use these Java features to fulfill complicated tasks.

Another obvious difference between Spring and Spring Boot in the work flow is that Spring Boot has embedded a Tomcat, so I do not need to configure one manually any more. When you are in the process of development, you even forget its existence. You just run and wait for the result. 

Although Spring Boot has helped us get rid of annoying XML configurations, it still has configurations. Several styles of configuration files are supported. But the style of yaml is preferred.

```
spring:
  thymeleaf:
    cache: false
```
Yaml differs from traditional property files, which consist of key=value lines. The reason for choosing yaml instead of property files is that property files cannot represent structured configuration well.

Before going to the most exciting part of Spring Boot, let us go on a whirlwind REST tour.
If we would like to locate a resource through a URI (path) and do different operations on it, we usually define different paths to complete different tasks.

```
http://localhost/user/saveUser
http://localhost/user/delete?id=1
http://localhost/user/updateUser
http://localhost/user/getById?id=1
http://localhost/user/getAll

```
While adopting REST style, we can do this more elegantly:

```
http://localhost/user/users
http://localhost/user/users/1
http://localhost/user/users
http://localhost/user/users/1
http://localhost/user/users

```
On first sight, it is hard to tell the difference among these paths. In fact, Spring Boot has provided us with several annotations to specify every action each path stands for. The first path with the GET action will make a request for all users, while the third path with the POST action will save a user. Concise and elegant, right? Next, we will step into the key part of Spring Boot that can show its power. 

Spring Boot has been evolving quickly since it appeared. Until now, it has been seamlessly integrated with most mainstream third-party technologies like JUnit(for testing), MyBatis(for persistence), Druid(for data source), Simple(for cache). Actually, it supports most of them directly. Introducing them to your project becomes quick and effortless. I have tried to integrate several of them into my trivial project and found a general routine to complete the integration task. When you want to introduce a technology (library) for a specific purpose to your project, generally speaking, you should do these three steps:

1. Import the starter of this library.
2. Turn on this library, which means letting Spring Boot know you want to use this library or technology.
3. Using it in your business code.

For example, if we want to introduce Simple for cache, we will follow these 3 steps:


1.Import

```

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>

```
2.Turn on

```

@SpringBootApplication
@EnableCaching
public class TacoCloudApplication implements WebMvcConfigurer {
    public static void main(String[] args) {
        SpringApplication.run(TacoCloudApplication.class, args);
    }
}

```
3.Using

```
@Cachable(value="cacheSpace",key="#id")
public User getById(Integer id) {
  return userDao.selectById(id);
}

```

After these 3 steps, we can already use all the cache capabilities that Simple has provided for us. Other 3rd-party libraries are directly supported by Spring Boot nearly all can be introduced like above. The quick tour of Spring Boot has to end now. This article is just a summary and whirlwind tour; next I will dive deep into a specific technology often used in Spring Boot.

