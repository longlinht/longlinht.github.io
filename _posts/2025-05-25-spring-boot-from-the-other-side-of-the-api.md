---
layout: post
cover: false
title: Spring Boot from the Other Side of the API
date:   2025-05-25 20:15:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

Two years ago I wrote [a quick tour of Spring Boot](/a-quick-tour-of-spring-boot.html). It was about the surface: starters, YAML config, REST style, how easy it is to add a library. This spring I went back to Java backend, this time slower and with a plan.

I am an Android engineer. For years I have been on the client side of the API: calling endpoints, parsing JSON, retrying when the network is bad. This time I wanted to understand the other side. This post is about what I could reuse from Android, and what I had to learn from zero.

## The plan

I wrote a seven-day plan to get the whole map first and the details later:

1. Java basics from a backend view: collections, thread pools, Java 8 streams and `Optional`. Plus HTTP itself.
2. Spring Boot and IoC/DI.
3. Spring MVC and a small REST API.
4. Persistence: JDBC, JPA, MyBatis.
5. AOP, transactions, Spring Security basics.
6. Redis, message queues, the basic ideas of distributed systems.
7. Build and deploy: Maven, a runnable jar, Docker, logs.

Seven days was too short, of course. The plan gave me the order. Then I spent the next weeks going through a Spring Boot course and taking notes: auto-configuration, bean scanning, a custom starter, JWT, `ThreadLocal`, testing, the data layer, caching.

The rule I set for myself was simple: for every new thing, ask "what is this on Android?" Sometimes the answer was very close. Sometimes there was no answer at all.

## What transferred

**Dependency injection.** If you have used Dagger or Hilt, Spring's IoC container is not new. `@Service` and `@Repository` are like `@Inject`-able classes, `@Configuration` with `@Bean` methods is like a Hilt module with `@Provides`. Constructor injection is the recommended style in both.

The difference is when the wiring happens. Dagger generates code at compile time, so a missing dependency is a build error. Spring scans the classpath and builds the graph at startup with reflection and proxies, so a missing bean is a startup error. Both work. Spring is more flexible, Dagger tells you earlier.

**HTTP, seen from the mirror.** On Android I wrote Retrofit interfaces like this:

```java
@GET("users/{id}")
Call<User> getUser(@Path("id") long id);
```

The Spring side is almost the same shape:

```java
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) {
    return userService.findById(id);
}
```

I already knew methods, headers, status codes and JSON. What changed is that now I choose them. Should creating a user return 200 or 201? What does a missing user return, 404 or an empty body? When I was the client, I complained about these choices. Now I had to make them.

**Interceptors.** An OkHttp `Interceptor` that adds an `Authorization` header has a mirror on the server: a filter that reads the header and checks the token. On Android I stored the JWT and attached it to every request. In Spring I wrote the other half: parse the token, verify it, reject the request if it is wrong. Spring Security is a chain of these filters. Once I saw it as "OkHttp interceptors, but on the receiving end", it was much less scary.

**Persistence.** Room was my reference. MyBatis felt closest: you write the SQL yourself, in annotations or XML, and map the result to objects, like Room's `@Query`. Spring Data JPA is further away. You declare `findByName(String name)` on an interface and the query is generated from the method name. It is convenient for simple queries and a bit magic for anything else.

**The language.** Java streams and `Optional` were easy after Kotlin's collection functions and nullable types. Maven was new, but after years of Gradle the idea of a dependency tree and a parent version set was familiar.

## What did not transfer

**The threading model.** This was the biggest change in how I think.

On Android there is one rule: don't block the main thread. All my instincts are about moving work off one special thread.

On a server there is no special thread. In a classic Spring MVC app on Tomcat, each request is handled by one thread from a pool (200 by default). Blocking in a request is normal. You call the database and wait. The danger is somewhere else: many threads running the same code **at the same time**.

And by default, every Spring bean is a singleton. On Android a singleton holding mutable data already makes me nervous. On a server, one `UserService` instance is used by all request threads at once. So a field like this is a bug:

```java
@Service
public class OrderService {
    private Order current; // shared by every request. Never do this.
}
```

Beans should be stateless. Per-request data goes in method parameters, or in a `ThreadLocal`. I used `ThreadLocal` to keep the current user after the JWT filter parsed the token, so the service layer can read it without passing it everywhere. But the threads are pooled and reused. If you don't call `remove()` at the end of the request, the next request on that thread can see the previous user. On Android I almost never used `ThreadLocal`. Here it was in my notes in the first week, with a warning.

**Transactions.** Room has `@Transaction`, and I used it a few times. But on a phone there is one user, and the database is small and local. On a server, many users write the same tables at the same time, and a half-finished write can be seen by everyone.

`@Transactional` in Spring looks simple, but two details surprised me:

- By default it rolls back only on unchecked exceptions (`RuntimeException` and `Error`). A checked exception commits the transaction unless you say `rollbackFor`.
- It works through a proxy. If a method in the same class calls another `@Transactional` method directly, the call does not go through the proxy, and the annotation on the inner method is ignored.

Both are easy to miss when you read the code, because the annotation is right there.

**More than one copy of your app.** An Android app runs once per phone. A backend service runs as several instances behind a load balancer. That changes many small decisions. You can't keep a session in memory, because the next request may go to another instance. That is one reason tokens like JWT are popular: the server doesn't need to remember anything. A cache like Redis sits outside the app so all instances share it.

I took some Spring Cloud notes back in 2023: service registry with Eureka and Nacos, load balancing, Feign clients, a gateway. At that time they were a list of names. This time, after thinking about "more than one copy", I could see which problem each one solves. A registry answers "where are the other services". A gateway is one door in front of many services. Feign makes a remote call look like an interface call, a bit like Retrofit between services.

**Shipping.** On Android, you upload a build to the store, the rollout is slow, and you watch crash reports. On a server, you build a jar, put it in a Docker image, and it is live in minutes. Logs, health checks and metrics are how you see it. The feedback is much faster, and so are the mistakes.

## What I took away

- **Asking "what is this on Android?" gets you most of the way.** DI, HTTP, interceptors and data mapping all have a close match.
- **The rest is about concurrency and scale.** Shared singletons, pooled threads, transactions and many instances. My Android instincts had nothing to say there, and that is exactly the part to study slowly.
- **Being the client for years helps.** I know what a confusing API feels like from the outside. Now I can try not to build one.
- **Annotations hide a lot.** `@Transactional`, `@Autowired`, auto-configuration. Spring is easy to start because of them, and hard to debug for the same reason. Reading what they do underneath was the most useful part of these weeks.
