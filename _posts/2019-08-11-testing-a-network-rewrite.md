---
layout: post
cover: false
title: "Testing a Network Rewrite, and What to Measure on Every Request"
date:   2019-08-11 21:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In [the last post](/rewriting-the-android-network-layer-for-http2.html) I described how we rebuilt the Android network layer of a live-streaming app: HTTP/2 through OkHttp, our own DNS chain, an IP blacklist, a heartbeat, and remote switches for all of it.

That kind of change is scary to ship. It sits under every request in the app. If it breaks, it does not break one screen, it breaks everything. And in a lab with good Wi-Fi it will almost always look fine.

So before handing it to QA, we wrote two lists. The first was "what could this change break". The second was "how will we know, from real users, that it works". This post is both lists, plus a few tools that helped.

## List 1: what could break

For each thing the new layer touches, write one line. Then QA can turn each line into test cases.

**The old behaviour must not change.**

1. Every call to `HttpManager.send` and `sendMsg` still works. Almost all business requests go through these two, so this is basically "the whole app".
2. Retry on failure still behaves the same.
3. Redirects still work.
4. Both HTTP and HTTPS work, on both the test and production environments.
5. Callbacks come at the same moment as before. If a callback suddenly arrives earlier or later, code that depends on the order can break in strange ways.

**The new features must do what they claim.**

6. If a domain is hijacked, the heartbeat results should help us find another working IP.
7. After an IP fails several times, it goes into the blacklist.
8. When the network type changes, all caches are cleared.
9. When every DNS source fails for a domain, that domain's cache is cleared, so a wrong blacklist cannot lock the user out.
10. The DNS chain can be configured, and each combination behaves correctly.

The first five are the ones people forget. A new feature gets tested because everyone is excited about it. The old behaviour gets tested only if someone writes it down.

## Turning switches into test cases

This is where the remote switches paid off a second time. We built them for safety in production. But they also made testing much easier, because QA could change the behaviour of a build without a new build.

The test points we gave QA:

1. **DNS combinations.** Use the remote config to turn each DNS layer on and off: local cache, system DNS, backup IPs, Google's DNS. Test the combinations where some are available and some are not.
2. **Bad networks.** No network, weak network, no network to network, network to no network. The app should behave the same as the previous version.
3. **Network type changes.** Wi-Fi to mobile and back.
4. **Downgrade.** Turn HTTP/2 off remotely and check that everything falls back to HTTP/1.1.
5. **Soft downgrade.** Make requests fail on purpose and check that the IP goes into the blacklist.
6. **Reporting.** Check that every new analytics event is actually reported.

The last one is easy to skip, and it is the one you cannot fix later. If the events are wrong in the release, you have no data for that release. I listed the weak network tools (2G-only SIM settings, a Raspberry Pi network box, Charles throttling) in [an earlier Chinese post](/upgrade-to-http2.html), so I won't repeat them here.

## How to see HTTP/2 with your own eyes

"It works" is not enough for a protocol change. You want to see that the request really used HTTP/2 and really reused the connection. Two tools helped.

**Charles.** For each request it shows:

- the **ALPN** result, which tells you if `h2` was negotiated;
- whether the TLS **session was resumed**, which tells you if the connection was reused;
- the **timing**. On a reused connection, the DNS, connect and TLS times are empty.

**Wireshark (or tcpdump).** Filter TLS handshakes to your server:

```
ip.addr == <server-ip> && tcp.port == 443 && ssl.handshake
```

With HTTP/2 and a working heartbeat, you should see one handshake, and then nothing, even while the app sends many requests. If you see a handshake every few seconds, something is closing the connection.

## List 2: what to measure on every request

Testing tells you it works on a few phones. Metrics tell you what happens on all of them. We had to decide them before the release, because you cannot go back and collect data for a version that is already out.

The old layer already recorded a few timestamps for each request:

| Field | Meaning |
|---|---|
| start | request started |
| connected | connection established |
| read content | started reading the response |
| end | response finished |
| content length | size of the body |
| success | success or failure flag |

From these, and from the new layer, we picked the metrics:

1. **Total time (we called it RTT).** From start to finish, for successful requests.
2. **Connect time.** How long to set up the connection.
3. **DNS time.** How long the lookup took.
4. **Time to first byte.** When the response headers arrived.
5. **Speed.** Bytes received divided by the time to receive them.
6. **Success rate.** Successful requests divided by all requests.

In the Chinese post I described how we split total time into buckets and compared versions. Here I want to talk about the other kind of metric, the ones that check the design itself.

## Metrics that check the design

Some numbers are not about user experience. They exist only to prove that one part of the design does what it should. For our design:

- **Total requests and HTTP/2 requests.** How much traffic actually moved to HTTP/2. This catches the case where the server or the protocol cache silently sends everything back to HTTP/1.1.
- **Connections created (handshakes) and heartbeats sent.** Together with total requests, this gives the connection reuse rate. If the heartbeat works, requests per connection goes up. If it doesn't, the heartbeat is just wasted traffic.
- **The protocol field** on each report, so every number can be split by HTTP/1.1 and HTTP/2.
- **DNS events.** Which DNS source answered, and when an IP enters the blacklist. Each event also carries the current remote config, so we know which layers were switched on for that user.
- **SSL handshake failures** when connecting to an IP directly, with the domain and the IP. A spike here means the IP list or the certificate setup is wrong.

These counters were updated when each request finished, and reported in a batch, by default every 50 seconds. On the test environment we also printed them to the log, so QA could check them without waiting for the dashboard.

## What I took away

- **Write down what must not change.** New features get tested anyway. Old behaviour, like callback timing and retries, only gets tested if it is on the list.
- **Remote switches are also test tools.** The same switch that lets you roll back in production lets QA test every combination on one build.
- **Look at the wire.** ALPN, session reuse and the handshake count tell you more than any log line.
- **Decide metrics before the release.** You cannot collect data for a version that already shipped.
- **Measure the design, not only the result.** Reuse rate, HTTP/2 share and blacklist events tell you *why* the total time changed.
