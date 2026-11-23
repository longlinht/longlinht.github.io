---
layout: post
cover: false
title: Two Versions of a Super App Architecture
date:   2022-03-20 20:10:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In 2021 I moved from Beijing to Dubai and joined the Android team of a messaging super app. Chat, voice and video calls, payments, official accounts, end-to-end encryption, all in one app. The codebase was large and growing, and the team was growing too.

One of the first things we did was write down the architecture. Not a slide for management, but a document that a new engineer could read on day one and know where his code should go. We ended up writing it twice. This post is about the two versions and what changed between them.

## Why components at all

Before the details, the reason. When an app does many unrelated things, the worst outcome is that every feature can see every other feature. Then one change breaks three screens, the build gets slower every month, and nobody can own anything.

So we split the project by function: user, chat, voip, payment, and so on. Each piece is a component with its own Gradle module. The benefits we were looking for were very practical:

1. **Faster builds.** A component can be compiled and run on its own. Less code, faster build.
2. **Clear ownership.** Each engineer owns a few components. A new person only needs to learn the components he works on. QA can focus on the components that changed.
3. **Reuse.** A base component works like a third-party library. A new business line can start with the existing base instead of copying code.

## Version 1: four layers

The first version had four layers, from bottom to top.

**SDK layer.** All internal SDKs. Each one wraps atomic operations and knows nothing about the business.

- `library_base`: things that have nothing to do with this app. HTTP, event bus, downloads, logging, utils. The plan was to publish it as a standalone Maven library one day.
- `Push`: the long-connection SDK.
- `Storage`: the database SDK, with a three-level cache and encryption.
- `sdk_e2ee`: end-to-end encryption.

**Base components.** Things that do belong to this app but are shared by all features.

- `library_common`: `BaseApplication`, `BaseActivity`, `BaseFragment`, a customized request type on top of `library_base`.
- `library_baseUi`: colors, styles, strings, shared dialogs and views.
- `library_media`, `library_picker`, `library_payment`, `library_fts` (search).

**Business components.** `module_main`, `module_user`, `module_chat`, `module_voip`, `module_discover`, `module_official_account`, `module_payment`. Each can run on its own for development and testing.

**App layer.** Just a shell: the package name, the launch entry and application initialization.

A single flag in `gradle.properties` switched between the two modes:

```properties
# false: one project, all modules linked into the app
# true:  each business module builds as its own application
isBuildModule=false
```

```groovy
// module build.gradle
if (isBuildModule.toBoolean()) {
    apply plugin: 'com.android.application'
} else {
    apply plugin: 'com.android.library'
}
```

This worked. But after some months of real development, two problems were clear.

The first: the line between "SDK" and "business" was blurry. Some business logic, like how a chat message is sent and stored, lived in the business modules. Other parts lived in SDK modules. People were not sure where new code should go.

The second: the components still needed to call each other. Chat needs to open a user profile. Voip needs user data. If `module_chat` depends on `module_user` directly, we are back to a ball of mud.

## Version 2: business layer and SDK layer

Version 2 drew one hard line through the project. Above the line is the **business layer**: UI and product flows. Below the line is the **SDK layer**: the real implementation of IM, users, payment and calls. We also kept in mind that one day we might want to give the SDK to other teams, or even outside the company. If that day came, the SDK had to stand on its own.

### Business layer

```
app
api_lib
lib_common
module_main  module_user  module_chat  module_voip  module_discover  module_payment
```

- `app` is the entry. It initializes the app, the communication between modules and the SDKs. Nothing else. No feature code in `app`.
- `lib_common` holds shared resources and a few shared UI widgets, like a user name view or an avatar view. Nothing else is allowed here. To be honest, in practice this module kept attracting code that did not belong there. A "common" module is a magnet. You have to keep saying no.
- `api_lib` is how the business modules talk to each other. More on it below.

### Talking without depending

The business modules do not depend on each other at all. They all depend on `api_lib`. Inside it there is a `ModuleApiFactory` with a provider interface:

```java
// in api_lib
public final class ModuleApiFactory {
    private static ModuleApiProvider provider;

    public static void installApiProvider(ModuleApiProvider p) {
        provider = p;
    }

    public static UserApi getUserApi() {
        return provider.getUserApi();
    }
    // getChatApi(), getVoipApi(), ...
}
```

The `app` module, which is the only place that can see every module, installs the real implementation at startup:

```java
// in app, SuperApplication.onCreate()
ModuleApiFactory.installApiProvider(new ModuleApiProviderImpl());
```

And then chat can open a profile page without knowing that `module_user` exists:

```java
ModuleApiFactory.getUserApi().gotoUserProfileActivity(context, uid);
```

This is nothing new. It is dependency inversion with a service locator. But it is simple, everyone can read it, and the compiler stops you if you try to import a class from another module.

### SDK layer

The SDK layer is split by responsibility:

- **SDK modules**: `sdk_chat`, `sdk_user`, `sdk_payment`, `sdk_voip`. These map to the four main features: IM, accounts, payment and calls.
- **SDK base libraries**: `sdk_storage`, `sdk_e2ee`, `sdk_push`, `sdk_media`, networking. They serve all SDK modules. For example, encryption serves both chat and voip, and storage serves almost everything. These should never appear in the public API.
- **General base libraries**: the old `baseLib` and `baseUi`. Utils, loading views, dialogs, permissions. No business meaning at all, so they sit at the very bottom and anyone can use them. Still, we tried to keep things like encryption utils out of the business layer. If the business layer needs to encrypt something by hand, the SDK is missing an API.
- **`sdk_api`**: the only door into the SDK layer.

`sdk_api` uses the same pattern as `api_lib`. A `SdkFactory` gives you each SDK:

```java
SdkFactory.getUserSdk().getContactInfo(userHid, new CommonDataCallback<ContactInfo>() {
    @Override
    public void onSuccess(ContactInfo contactInfo) {
        // show it
    }
});
```

`sdk_api` also holds the beans, listeners, callbacks and HTTP interface definitions that the business layer is allowed to see.

## What I took away

- **Write the architecture down early, and expect to rewrite it.** Version 1 was not wrong. It was what we understood at the time. Version 2 came from a few months of seeing where people actually got confused.
- **One hard line is better than many soft ones.** Four layers with fuzzy rules caused more debate than two layers with a clear rule: "UI and flow above, implementation below".
- **Modules talk through interfaces, and only the app knows the wiring.** Once this was in place, nobody had to ask "can I depend on that module?" The answer was always no, and there was always a way around it.
- **Watch the "common" module.** It will grow if you let it.

The rules for what a good SDK API looks like deserve their own post. That is next.
