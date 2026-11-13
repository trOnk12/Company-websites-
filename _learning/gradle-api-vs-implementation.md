---
title: A green build doesn't prove implementation() is right
date: 2026-11-13
status: budding
tags: [gradle, modularisation]
summary: If a module's public API uses a type from another module, that dependency has to be api(). The modules that use it today can hide the mistake.
---

## The gap

I knew that `api()` dependencies are visible to consumers and `implementation()` ones aren't. What I couldn't say was when `api()` is *required*, or why CI stayed green when I picked the wrong one.

## The pieces

- `implementation(X)` puts X on my module's compile classpath only. Modules that depend on me can't see X.
- `api(X)` puts X on my consumers' compile classpath as well.
- A type in my public API (a return type, a parameter, a supertype, a public property) is something every consumer has to compile against.
- The same question of who can see what, for test code: [[gradle-test-fixtures]].

## The click

A public signature is a promise about types. If `Pricing.price()` returns `Money`, every caller has to know what `Money` is. `implementation(":money")` hides `Money` from them, so the promise mentions a type they can't see.

It still compiles while every current consumer also depends on `:money` directly. The mistake waits for the first consumer that doesn't.

## How I checked it

A four-module project on Gradle 8.14.3: `money`, `pricing` (exposes `Money price(String sku)`), `checkout` (depends only on `pricing`) and `invoice` (depends on `pricing` and `money`).

- With `implementation(":money")` in `pricing`: `invoice` builds, and `checkout` fails with `error: cannot access Money`.
- With `api(":money")`: `checkout` builds.

The project and a script that reruns it are in [this site's repository](https://github.com/trOnk12/Company-websites-/tree/main/_learning/experiments/gradle-scope).

## Check yourself

- Can `pricing` use `Money` internally, outside its public signatures, with `implementation(":money")`?::Yes. Only types in the public API have to reach consumers.
- A consumer builds fine with `implementation`. Does that prove the scope is right?::No. That consumer may depend on the providing module itself. The next one that doesn't will fail to compile.
- Which should be the default, and why?::`implementation`. Gradle's docs list a smaller classpath and fewer recompilations for consumers. Use `api` only for types in your public API.

## Sources

- [Gradle: API and implementation separation](https://docs.gradle.org/current/userguide/java_library_plugin.html#sec:java_library_separation)
- [Gradle: making the difference between API and implementation](https://docs.gradle.org/current/userguide/java_library_plugin.html#sec:example_making_the_difference_between_api_and_implementation)
