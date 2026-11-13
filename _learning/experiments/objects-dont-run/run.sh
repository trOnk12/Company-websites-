#!/usr/bin/env bash
# Reproduces the claim in _learning/objects-dont-run-threads-do.md. Needs a JDK.
set -eu
cd "$(dirname "$0")"
javac -d .out Clerk.java
java -cp .out Clerk
