---
layout: post
cover: false
title: Rewriting Our Android Network Layer for HTTP/2
date:   2019-07-14 20:30:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In 2019 I worked on a live-streaming app with most users overseas, many in the Middle East. Two network problems kept coming back. Many requests failed with `UnknownHostException`, and entering a live room was slow because the room fires a burst of requests at the same moment.

I already wrote two posts in Chinese about this work. One is about [the DNS fallback chain](/connectivity-in-android.html), the other is about [HTTP/2 itself and how we measured it](/upgrade-to-http2.html). This post is about the part in between: how the new network layer was put together, and why some decisions were made the way they were.

## Where we started

The old network layer was built on `HttpURLConnection`. It only spoke HTTP/1.1. Almost every business request went through one class, `HttpManager`, with two entry points, `send` and `sendMsg`.

That was actually good news. If almost everything goes through one door, you can change what is behind the door without touching hundreds of call sites.

The goal was:

1. Use OkHttp and HTTP/2 when the server supports it.
2. Control DNS ourselves, with fallbacks.
3. Keep the HTTP/2 connection alive between requests.
4. Avoid IPs that keep failing.
5. Be able to turn every one of these off from the server, without a new release.

## One dispatcher, two protocol managers

We did not replace the old code. We put a dispatcher in front of it.

```
            HttpManager (dispatcher)
              /                \
HttpProtocol_1x_Manager   HttpProtocol_20_Manager
 (HttpURLConnection)          (OkHttp)
```

`HttpManager` kept its public API. Inside, it decides which manager handles each request. The HTTP/2 manager remembers, per host, which protocol the last response actually used. The next request to that host goes to the right manager directly.

Why keep the old path at all? Two reasons.

First, some requests were not a good fit. File upload, for example, was written by hand: parameters and file bytes were concatenated into one stream. It worked, it was not where HTTP/2 helps, and rewriting it was risk without benefit. So uploads stayed on HTTP/1.1.

Second, safety. If HTTP/2 caused trouble after release, we wanted to switch everything back to the old path with one remote switch. A rewrite you cannot roll back is a bet, not an upgrade.

One small cost: the new OkHttp version needed Java 8, so we had to raise the Java language level of the whole app. Not hard, but it touches everyone's build, so it is worth saying early.

## DNS: replace the resolver, not the URL

The first idea many people have for HttpDNS is simple. Resolve the IP yourself, then in an interceptor replace the host in the URL with the IP and add a `Host` header.

This does not work well. The host name in the URL is used in many places inside the HTTP client:

- **Cookies** are stored and looked up by domain.
- **Connection reuse** is keyed by host. Replace it with an IP and the pool is confused.
- **HTTPS** needs the host name for SNI and for certificate checking. With an IP in the URL, the TLS handshake asks for the wrong name, and certificate verification fails unless you write your own verifier.

The better place is the moment the socket connects. That is the only time an IP is really needed. OkHttp gives you exactly this hook: the `Dns` interface.

```java
OkHttpClient client = new OkHttpClient.Builder()
        .dns(new ChainDns())   // our own resolver
        .build();
```

The URL keeps its host name, so cookies, the connection pool, SNI and certificates all keep working. Only the address lookup changes.

Our `lookup()` walked a chain of four sources: an in-memory cache, the system DNS, a backup list of IPs, and Google's DNS over HTTPS. The details of the chain are in [the Chinese post](/connectivity-in-android.html). What matters here is that each layer could be switched on or off from our remote config system. That turned out to be very useful for testing too, which I will cover in the next post.

## The IP blacklist

DNS gives you a list of IPs. Some of them may be bad for a given user: blocked, hijacked, or just far away and slow.

We cached results with `host + ip` as the key and a small status object as the value. Every failed connection increased a counter. After more than five failures, that IP was treated as blacklisted and skipped.

A blacklist that only grows is dangerous. If the network is down for a minute, every IP fails, and soon every IP is blacklisted. Then the app can never recover, even after the network comes back. So we added two rules to clear it:

- **When the network type changes**, clear all the caches. A bad IP on mobile data may be fine on Wi-Fi.
- **When every DNS source fails for a host**, clear that host's entries. If nothing works, the blacklist is probably wrong, not the servers.

Adding things to a blacklist is easy. Deciding when to forget is the real design.

## Heartbeats that move out of the way

In the ideal case, HTTP/2 uses one connection per host. Most of our business requests went to one host. So if that connection stayed alive, almost every request would skip DNS, TCP and TLS.

But it is not a real long connection. If nothing is sent for a while, the connection is closed. So the HTTP/2 manager starts a heartbeat when it sees that a host supports HTTP/2.

The heartbeat is "postponed". Every real request pushes the next heartbeat further away. If the user is active, real requests keep the connection alive and no heartbeat is sent at all. Heartbeats only go out when the app is quiet.

```java
// generic sketch, not the production code
void onRequestFinished(String host) {
    handler.removeCallbacks(heartbeatTask);
    handler.postDelayed(heartbeatTask, HEARTBEAT_INTERVAL_MS);
}
```

The heartbeat result is also a cheap health check. A failed heartbeat counts against that IP, so the blacklist can react before a user request hits the bad IP. We also hoped it could help detect a weak network and a hijacked domain, by seeing that one IP keeps failing while another works.

We added a log every time a new connection was created. If the heartbeat works, that log should be rare. That gave us a simple way to see whether the heartbeat was doing its job.

## What HTTP/2 changed for the live room

Before HTTP/2, entering a live room fired many requests at once. To avoid too many parallel HTTP/1.1 connections, the old code merged requests through a queue, with at most four running at a time. The rest waited.

With HTTP/2 the requests run at the same time on one connection, without waiting for a free slot. When we compared the timelines of entering a room, the difference was clear. The merge queue (`HttpBatchBlockingQueue`) stayed, but the rule changed: as soon as four requests are collected, send the batch right away instead of waiting.

One thing surprised me. The number of IPs a domain resolves to decides how many connections you end up with. HTTP/2 can only reuse a connection if requests go to the same place. So DNS and HTTP/2 are not two separate topics. They are one design.

## What I took away

- **Find the one door first.** Because almost all requests went through `HttpManager`, the whole rewrite was possible without touching business code.
- **Keep the old path, behind a switch.** Every new piece (HTTP/2, each DNS layer) could be turned off remotely. That is what made it safe to ship.
- **Change the resolver, not the URL.** Host names are used for cookies, pooling and TLS. Give the client an IP only at connect time.
- **A blacklist needs a way to forget.** Clear it on network change and when everything fails.
- **Heartbeats should get out of the way.** Postpone them on every real request.

Shipping the design was half the work. The other half was proving it worked. That is the next post.
