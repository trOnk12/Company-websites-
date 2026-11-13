#!/usr/bin/env bash
# Reproduces the claims in _learning/robolectric-runs-the-real-framework.md.
# Needs a JDK. Downloads about 215 MB from Maven Central into .jars/ the first time.
set -eu
cd "$(dirname "$0")"
M=https://repo1.maven.org/maven2
ALL=16-robolectric-13921718-2   # Robolectric's android-all for Android 16 (API 36)
mkdir -p .jars
[ -f .jars/stub.jar ] || curl -fsS -o .jars/stub.jar $M/com/google/android/android/4.1.1.4/android-4.1.1.4.jar
[ -f .jars/all.jar ]  || curl -fsS -o .jars/all.jar  $M/org/robolectric/android-all/$ALL/android-all-$ALL.jar

echo "== TextUtils.isEmpty bytecode in the stub jar"
javap -c -cp .jars/stub.jar android.text.TextUtils | grep -A6 'boolean isEmpty'
echo "== TextUtils.isEmpty bytecode in android-all"
javap -c -cp .jars/all.jar android.text.TextUtils | grep -A10 'boolean isEmpty'
echo "== native methods declared by android.graphics.Bitmap in android-all"
javap -p -cp .jars/all.jar android.graphics.Bitmap | grep -c ' native '

for j in stub all; do
  echo "== Probe on a plain JVM with $j.jar"
  javac -cp .jars/$j.jar -d .jars/out-$j Probe.java
  java -cp .jars/$j.jar:.jars/out-$j Probe
done
