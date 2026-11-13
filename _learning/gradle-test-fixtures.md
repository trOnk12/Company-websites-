---
title: testFixtures share fakes between modules without shipping them
date: 2026-11-13
status: budding
tags: [gradle, testing, modularisation]
summary: The java-test-fixtures plugin gives a module a third source set for fakes and builders. Other modules' tests can use it, and it stays out of the production jar.
---

## The gap

The same fake repository was copied into the tests of several modules. Putting it in `main` would ship test code, and copying it meant every interface change broke it in several places.

## The pieces

- The `java-test-fixtures` plugin adds a `src/testFixtures/` source set to a module.
- Code in there can see the module's own `main` code.
- Another module's tests use it with `testImplementation(testFixtures(project(":pricing")))`.
- Libraries the fixtures themselves need go in `testFixturesApi(...)` or `testFixturesImplementation(...)`. That's the same split as in [[gradle-api-vs-implementation]].

## The click

Test fixtures are a small extra library, published next to the real one and used only by tests. The fake for an interface sits in the same module as the interface, so when the interface changes, the fake breaks there, once, and not in every module's test folder.

## How I checked it

In the same Gradle 8.14.3 project as the `api()` card, `pricing` has `FakePricing` in `src/testFixtures/`:

- `checkout`'s tests compile against `FakePricing`.
- `checkout`'s main code referencing `FakePricing` fails with `error: cannot find symbol`.
- `pricing.jar` contains only `Pricing.class`. `FakePricing.class` is in a separate `pricing-test-fixtures.jar`.

This was on plain JVM modules. Android library modules switch test fixtures on through the Android Gradle plugin, which I haven't checked here.

The project and a script that reruns it are in [this site's repository](https://github.com/trOnk12/Company-websites-/tree/main/_learning/experiments/gradle-scope).

## Check yourself

- Can production code in `checkout` use `FakePricing`?::No. Test fixtures are only on the consumer's test classpath, so main code fails with `cannot find symbol`.
- Does the fake end up in the production jar?::No. It goes into a separate `-test-fixtures` jar.
- Where does a library that only the fakes need belong?::In the providing module, under `testFixturesImplementation(...)`, or `testFixturesApi(...)` if consumers' tests need to see it too.

## Sources

- [Gradle: using test fixtures](https://docs.gradle.org/current/userguide/java_testing.html#sec:java_test_fixtures)
- [Gradle: declaring dependencies of test fixtures](https://docs.gradle.org/current/userguide/java_testing.html#sec:declaring_dependencies_of_test_fixtures)
