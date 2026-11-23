---
layout: post
cover: false
title: What Makes a Good SDK API
date:   2022-09-18 20:45:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In our messaging app the code was split into a business layer and an SDK layer ([background here](/super-app-architecture-v1-to-v2.html)). The business layer draws screens. The SDK layer does the real work: network, storage, encryption, sync.

That split only pays off if the SDK API is good. If it is not, the business layer starts doing the SDK's job, and after a year you have two layers that are both half-SDK.

We wrote a short standard to judge whether an SDK API is "done". For one complete feature, check five things:

1. Simple input, simple output.
2. One call, not several APIs working together.
3. The caller does not need to know how it works inside.
4. Data inside and outside the SDK is separated, and the SDK checks itself.
5. One calling style everywhere.

## 1 & 3. Simple in, simple out, no peeking inside

A real API call may involve the network, the local database and data conversion. The job of the SDK is to hide all that, so every call takes standard parameters and returns a standard result through one standard flow.

For each feature, ask:

- Are the parameters simple?
- Is the result simple?
- Are errors handled?
- Is there a gap in the flow that the caller has to fill?
- Are there threading problems the caller has to think about?

If the caller has to manage storage or network steps by hand, the API is not finished.

## 2. One call

Getting a contact's info is a complex flow: check the local DB, maybe ask the server, store the result, then return it. A good SDK API takes a uid and gives you the user. That's it.

```java
SdkFactory.getUserSdk().getContactInfo(uid, callback);
```

When a feature needs several APIs together, first ask whether they belong to the same feature. If they do, they should probably become one API.

Two examples we found in our own code:

**"Is this user in the group?"** The ideal API takes a uid and returns a boolean. What we had: fetch all group members, then search the list in the business layer. The search is not hard, but it means the API is missing.

**Login with a verification code.** Our flow was: call the code-login API, then call auto-login by hand. Both steps lived in the business layer. That exposed the internal login logic to every caller. The right API takes a phone number and a code and returns a logged-in result.

```java
// before: the caller knows how login works inside
userSdk.loginWithCode(phone, code, result -> {
    userSdk.autoLogin(result.getToken(), ...);
});

// after: one call
userSdk.loginWithCode(phone, code, loginCallback);
```

## 4. Two data models, and self-checks

This was the rule that caused the most discussion, so it is worth explaining.

Inside the SDK, data is produced, stored and sent over the network. In the business layer, data is mostly displayed, edited a little, and passed into the next API call. These are very different jobs.

- **Safety.** From creation to disk, SDK data must follow a closed, correct path. If the SDK and the UI hold the **same object**, the UI can change a field, and now what is stored is not what the SDK expected.
- **Shape.** SDK beans have many fields. Some are about storage, some are tied to the DB schema or the wire format. They are hard to change. UI data is simpler: what you need to show, nothing else.
- **Coupling.** If both layers share one bean class, the code drifts together over time. Nobody knows every module. When an API is not quite complete, it is very easy to write a bit of code that sits between the two layers, and that code is how coupling starts.

So the rule is: **two data carriers**. The SDK keeps its own models. At the end of an API flow it builds a **new** business-layer model and hands that out. The SDK does not care what the UI does with it, and nothing the UI does can affect the SDK's internal state. As a bonus, internal or sensitive fields never leak out.

Yes, this means mapping code. I think it is the cheapest insurance you can buy.

**Self-checks.** A reliable SDK checks itself:

1. If an API must run on a specific thread, check the thread.
2. Check parameters: nulls, ranges, preconditions. Mark whether a result can be null. If a value is a fixed set, restrict it to that set.
3. Handle internal exceptions, so the caller never receives broken data, or receives it at the wrong time.

## 5. One style

- One entry point for everything.
- Group APIs by type: `SdkFactory.getUserSdk().getAccountService().xxx()`.
- Don't go too deep. Four levels at most. Every extra level is something the caller has to learn and type.

## Why bother

None of this is new. It is what every good library already does. The point of writing it down was to give code review a shared vocabulary. "This needs two calls" or "the UI is holding an SDK bean" is a much easier conversation than "I don't like this API".

It also changed how I review SDK code in general. Before reading the implementation, I write the call site I wish I had. If the real API can't be called that way, the problem is usually not the implementation.
