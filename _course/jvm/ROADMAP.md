# JVM internals: the path to expert

Goal: a Kotlin or Android engineer who finishes this course can read bytecode, predict what the JIT and the
garbage collector will do, reason about concurrency with the Java Memory Model, and diagnose a slow or
out-of-memory JVM process from evidence (thread dumps, recordings, heap dumps), without searching elsewhere.
Rules: AGREEMENTS.md, the course-author and course-clarity skills (pass 2f: no return trips). Modules are
written in this order; each puzzle has one core idea and uses only what earlier puzzles taught.

## Module 1: From source to a live object (written, puzzles 00–04)
Class file, frame, reference, reachability, shared counter.

## Module 2: Reading bytecode (written, puzzles 05–10)
1. The operand stack does the arithmetic: `iload`, `iadd`, `istore`, step by step.
2. The constant pool: names and numbers a class file refers to, and why instructions point into it.
3. Five ways to call a method: invokestatic, invokespecial, invokevirtual, invokeinterface, invokedynamic.
4. Reading `javap -c` on your own Kotlin: what a property, a companion object and a default argument become.
5. Lambdas and inline functions: invokedynamic and LambdaMetafactory vs code copied at the call site.
6. Virtual dispatch: the method table, and why `final` (and Kotlin's default) matters less than you think.

## Module 3: Loading and linking code (written, puzzles 11–18)
1. A class is loaded when first needed: loading, linking (verify, prepare, resolve), initialisation.
2. Static initialisation order and its trap (a static read before it's set).
3. When static code throws: ExceptionInInitializerError, then NoClassDefFoundError; Exception vs Error.
4. Class loaders and delegation: bootstrap, platform, application; why two loaders mean two classes.
5. The class path: `ClassNotFoundException` vs `NoClassDefFoundError`.
6. The module path: requires lines checked before main runs.
7. Metaspace: where class metadata lives, and how a class-loader leak fills it.
8. Bridge: what Android does differently (DEX, ART, JIT and profiles, dex2oat), linking to the Android course.

## Module 4: How the JVM makes code fast (written, puzzles 19–25)
1. The interpreter, and why the first thousand calls are slow (template interpreter, invocation counter, code cache; Xint vs default, measured).
2. Profiling counters and tiered compilation (C1, C2): levels 0–4, method profile, on-stack replacement, read from PrintCompilation.
3. Inlining: the optimization every other one depends on; type profile, monomorphic/bimorphic/megamorphic, inline caches (PrintInlining).
4. Escape analysis: objects that never reach the heap (scalar replacement; 240 MB per round with it off, measured).
5. Deoptimization: class hierarchy analysis, recorded dependencies, uncommon traps, class checks; Kotlin's final-by-default answered (puzzle 10's cut material, now linked from 10).
6. Warm-up and measuring honestly: naive timing vs JMH (dead code elimination, Blackhole, forks), JMH 1.37 run.
7. Starting faster: class data sharing (default and dynamic archives, measured), AOT cache JDK 24/25 and AOT code JDK 28 (JEP 544), from the JEPs.

## Module 5: Memory and the garbage collector
1. The heap's regions and the generational hypothesis.
2. Allocation: TLABs and bump pointers.
3. Marking from roots, and why a collector needs safepoints.
4. Copying, compacting, and what a pause is made of.
5. Choosing a collector: Serial, Parallel, G1, ZGC; latency vs throughput vs memory.
6. Reading a GC log.
7. Soft, weak and phantom references; finalisation's problems; Cleaner.
8. Memory outside the heap: direct buffers, metaspace, thread stacks; why a container kills a "healthy" JVM.

## Module 6: The Java Memory Model
1. Why another thread can see stale values: caches and reordering (Go deeper: how a CPU cache works).
2. Happens-before: the one rule everything else follows from.
3. `volatile`: visibility and ordering, not atomicity.
4. `synchronized` and monitors: mutual exclusion plus visibility.
5. `final` fields and safe publication.
6. Atomics and compare-and-set (builds on module 1, puzzle 4); when CAS loops spin.
7. Locks, conditions and deadlock: how to read one in a thread dump.

## Module 7: Threads at scale
1. Thread pools and queues: why a pool runs out, and what back pressure is.
2. Virtual threads: carrier threads, mounting, and pinning.
3. Structured concurrency, and how Kotlin coroutines map onto JVM threads.
4. ThreadLocal and context across async boundaries.

## Module 8: Diagnosing a running JVM
1. `jcmd` and the attach mechanism.
2. Reading a thread dump: states, locks, the decisive stack.
3. Java Flight Recorder: what a recording holds and how to read it.
4. Sampling profilers and flame graphs (link: the performance course).
5. Heap dumps and the dominator tree: proving a leak.
6. `OutOfMemoryError`'s kinds and what each one tells you.
7. Capstone: a slow service, from symptom to the one changed cause (the labs/jvm fixtures).

## Go deeper floors (optional, never gating)
- How a CPU runs instructions and how its caches work (for modules 4 and 6).
- How code becomes a program: compilers, intermediate representations, JIT vs AOT (for modules 2 and 4).
