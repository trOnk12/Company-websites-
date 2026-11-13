#!/usr/bin/env bash
# Reproduces the claims in the learning cards
#   _learning/gradle-api-vs-implementation.md
#   _learning/gradle-test-fixtures.md
# Needs only a JDK and Gradle (checked with Gradle 8.14.3); no downloads, no test framework.
set -u
cd "$(dirname "$0")"

run() {
  if gradle -q "$@" >out.txt 2>&1; then echo "  -> BUILD OK"
  else echo "  -> BUILD FAILED"; grep -m1 -E "error:" out.txt; fi
}

echo "1) pricing uses implementation(:money); invoice also depends on :money"
run :invoice:compileJava -Pscope=implementation
echo "2) pricing uses implementation(:money); checkout depends only on :pricing"
run :checkout:compileJava -Pscope=implementation
echo "3) pricing uses api(:money); checkout"
run :checkout:compileJava -Pscope=api
echo "4) checkout's tests use FakePricing from pricing's testFixtures"
run :checkout:compileTestJava -Pscope=api
echo "5) checkout's main code tries to use FakePricing"
echo 'package demo; class Leak { Pricing p = new FakePricing(); }' > checkout/src/main/java/demo/Leak.java
run :checkout:compileJava -Pscope=api
rm checkout/src/main/java/demo/Leak.java
echo "6) what each pricing jar contains"
gradle -q :pricing:jar :pricing:testFixturesJar -Pscope=api
for j in pricing/build/libs/*.jar; do
  echo "  $(basename "$j"): $(unzip -Z1 "$j" | grep '\.class$' | tr '\n' ' ')"
done
rm -f out.txt
