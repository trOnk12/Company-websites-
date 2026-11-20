# Sprints: pachulski.dev courses

How we work: short sprints, each with one goal. Every sprint runs the same loop:

**plan → build → check (lint, tests) → review (fresh learner + picture reviewer) → fix → ship → log**

## Definition of done (every sprint)

- `npm run lint:course` clean; `npm test` green.
- Fresh-learner review: every new or changed puzzle ≥ 8/10, no unsupported answers, no contradictions across puzzles.
- Picture review: every new or changed diagram ≥ 8/10.
- Facts checked against a primary source, quoted under "Sources".
- Scores and findings logged in the course's `REVIEW.md`; this file updated (done / next).
- Deployed, and the live URL checked.

## The principle every sprint serves

Deep content, built from small blocks, like mathematics: no idea before the ideas it stands on.
Every puzzle shows its **building blocks** (computed from the glossary, so they can't go stale) and the
shortest path to it from zero. Beginners walk the chain; people who know the basics jump in and check
only the blocks they're missing.

## Sprint 1: Building blocks (done 2026-11-16)

- [x] Compute each puzzle's direct building blocks from the glossary (`blocks()` in `lint-course.js`).
- [x] "Builds on" panel on every puzzle: each block's takeaway, ✓ when passed, the path from zero.
- [x] Overview: "Builds on 4, 6" under every puzzle.
- [ ] Review round on the 47 rewritten quiz questions and the BLE fixes (running).

## Sprint 2: Test out of a module (done 2026-11-16)

- [x] `check-N.html` per module: one question per puzzle; a right answer marks that puzzle passed, a wrong
  one names the puzzle to start with. Linked from each module on the overview ("Know this already?").
- [x] Test: the check marks passes and the overview shows the first missed puzzle as next.

## Sprint 3: Kotlin Multiplatform, module 1 (done 2026-11-16)

- [x] Course "Kotlin Multiplatform, from the compiler up": targets, source sets, expect/actual, the framework and its
  Objective-C header, what's lost in translation. Facts from kotlinlang.org, quoted.
- [x] Review round (text 6–8, pictures 6–7) and fixes. Re-score next sprint.

## Sprint 4: Encryption, module 1 (done 2026-11-16)

- [x] Course "Encryption, from the ground up": read/change/pretend, AES, key exchange, hashes, signatures and
  certificates, TLS. Facts from RFC 8446, NIST FIPS 197 and FIPS 180-4, quoted.
- [x] Review round (text 5–8, pictures 4–8): correctness fixes to TLS order, AEAD, signatures, AES modes. Re-review running.

## Sprint 5: iOS for Android developers, module 1 (done 2026-11-16)

- [x] Course "iOS for Android developers": suspended apps, the run loop, GCD, async/await and the main actor, ARC.
  Each puzzle starts from the Android block. Facts from Apple's documentation and the Swift book, quoted.
- [x] Cross-course building blocks: a puzzle that builds on another course says so, with a link.
- [x] Review round (text 6–8, pictures 5–7): actor reentrancy, await, background sessions fixed with sources.

## Sprint 6: KMP module 2, memory, threads, shipping, Compose Multiplatform (done 2026-11-16)

- [x] Five puzzles: a tracing GC meets ARC, Dispatchers.Main on iOS and cancellation from Swift, one umbrella
  framework, what Compose Multiplatform shares, how it draws on iOS (one canvas, the accessibility tree, UIKitView).
  Every claim quoted from kotlinlang.org, the kotlinx.coroutines API, the Skiko README or SKIE's docs.
- [x] Review round (correctness 6–9, clarity 7–9): ten fixes, all applied. Skills updated with the lessons.
- [ ] Module 3 (touch, scrolling, text input on iOS, SwiftUI interop, resources) stays in the course's upcoming list.

## Sprint 7: Take it with you (done 2026-11-16)

- [x] Obsidian vault per course (`course/<id>/<id>-obsidian.zip`, built with the pages): a course map, one note per
  puzzle linked to its building blocks (the graph view is the course map), the diagram as a GIF, every question
  as a `Question::Answer` flashcard for the Spaced Repetition plugin, and a glossary of flashcards.
- [x] "Continue with Claude": a button on each overview that builds a tutor prompt in the browser from the course
  (every puzzle's takeaway, the words taught, what's coming), your progress and your weak spots (questions you
  first got wrong, now remembered locally). Copied to the clipboard; nothing is sent anywhere.
- [x] Tests: the zip is real and has a note per puzzle; the prompt carries progress and weak spots.

## Sprint 8: Performance, under the hood, module 1 (done 2026-11-16)

- [x] New course, six puzzles: samples vs method tracing vs trace sections; call chart vs flame chart, self vs total;
  thread states (why slow isn't busy); FrameTimeline's expected vs actual; ART's TLAB, Concurrent Copying and young GCs;
  heap dumps, shallow vs retained size, GC roots and Activity leaks. Sources: simpleperf, Android Studio, AOSP ART
  and Perfetto docs, quoted.
- [x] Review round (correctness 6–9, clarity 8–9): twelve fixes applied. Home page now lists all six courses.
- [ ] Module 2 (Macrobenchmark, baseline profiles, startup end to end, Perfetto SQL) and module 3 (memory pressure).

## Sprint 9: Mobile system design, module 1 (done 2026-11-17)

- [x] New course, six puzzles: round trips vs bandwidth, handshakes and connection reuse (HTTP/2, one OkHttpClient),
  the radio's states and tail time (batching), HTTP caching (Cache-Control, ETag, 304), offline-first with the
  database as the source of truth, idempotency keys with backoff and jitter. Sources: High Performance Browser
  Networking, Android docs, MDN, RFC 8446/9110, OkHttp, Stripe, AWS.
- [x] Review round (correctness 6–9, clarity 8–9): eleven fixes applied.
- [ ] Module 2: push vs polling (FCM, WebSocket/SSE), pagination with cursors, sync conflicts, safe rollouts.

## Sprint 10: LLMs for mobile engineers, module 1 (done 2026-11-17)

- [x] New course, six puzzles: tokens and next-token prediction, streaming and time to first token, the stateless API
  and the context window, sampling and temperature, the API key on a proxy backend, on-device Gemini Nano via AICore.
  Sources: Anthropic docs, Android and ML Kit GenAI docs, Google Cloud key guidance.
- [x] Review round (correctness 6–9, clarity 8–9): fixes applied, Gemini Nano limits verified.
- [ ] Next puzzle: what a call costs and how it fails. Module 2: tools and agents.

## Sprint 11: No hidden gaps (done 2026-11-17)

- [x] Strict learner "gap hunt" on KMP: five new building-block puzzles, iOS-course references replaced, 3 modules.
- [x] Lint: `_course/jargon.json`, cross-course check (a baseline word another course teaches must be linked with
  glossary `from`, shown on the puzzle as "New to these?"), homonyms. Every course fixed to pass.
- [x] System design: new puzzle 0, What actually travels (packets, IP, TCP, TLS, HTTP), before TCP is used.
- [x] Music: calmer typography, analytics on music pages, a hand-drawn home button instead of a section.
- [ ] KMP splits: lost in translation (3 ideas), whose thread (dispatch vs cancellation), one framework, one canvas.
- [x] Gap hunt and fixes: system design (DNS, HTTP, TLS, timeouts: 11 puzzles), LLM (what a model is, your first
  call: 8), security (XOR toy cipher, man in the middle, MAC: 9), perf (threads take turns, what a trace is, who puts
  pixels on screen, what garbage is: 10 in 2 modules).
- [x] "Your learning" page: progress per course, weak spots, what to learn next, export/import, no login.
- [ ] Same gap hunt for Android, BLE, iOS.
- [ ] Splits of overloaded puzzles: sysdesign 5, 8, 10; LLM 03, 07; security 08.

## Sprint 12: Ready to self-study (from the strict-learner gap hunts of Android, iOS, BLE)

Verdicts: Android can be started today (puzzles 0–12 read alone, 8–9/10); 13–14 and 18–19 stall (4–5/10).
iOS is a good runtime-model bridge but can't start iOS work (no Swift, no app structure, no screen).
BLE is a sound primer but can't build a feature (no scan, connect, callback, permissions or parsing).

Done in this sprint:
- [x] Progress saved by puzzle slug, not number (inserting puzzles scrambled it); old saves migrate via
  `_course/progress-legacy.json`; test.
- [x] BLE: Heart Rate Measurement isn't readable (Notify only, HRS 1.0): the read example is now Battery Level
  (2A19); P00 sleep-length contradiction, title, truncated diagram label.
- [x] Android: "a dialog pauses the Activity" corrected; Android 12 Back on the root Activity (moves to background,
  not destroyed) noted in 18 and 19 with the source; 15 Q1 explanation; 14 "from step 3".
- [x] iOS: "every thread has a run loop" → "can have"; 03 Q1 explanation narrowed; two hint pointers.

To do, in order:
- [x] Android: new puzzles 03 "Threads share one house" (shared memory, race condition, lock vs one owner,
  thread-safe) and 13 "When memory runs out, who goes" (importance, foreground vs cached, low-memory killer);
  16 (main thread's queue) unloaded: windows and input channels now taught in 17, broken ActivityThread sentence
  rewritten; 22 puzzles. Android's old order added to progress-legacy.json so saved progress maps correctly.
- [x] Android: 18 "Slow work off the main thread, and back" (worker thread, post back, runOnUiThread; coroutines
  named as the same trip); the ViewModel puzzle's code now points to it. 23 puzzles.
- [ ] Android, still: "Objects live at addresses; only bytes travel" (before 15); split 15, 20, 21; teach Intent extras before 18. (Was: Android: new puzzles "Threads share one house" (02→03), "When memory runs out, who gets ended" (before 12),)
  "Objects live at addresses; only bytes travel" (before 13), "Windows and the touch line" (split from 14),
  "Slow work off the main thread, and back" (before 18). Split 13, 18, 19; teach Intent extras before 16.
- [ ] iOS: "Swift for Kotlin developers" (before 00), "Your app's front door: @main, scenes" (before 00),
  "A screen: UIViewController and SwiftUI View" (before 02), "Two meanings of async; Task { }" (split 03),
  "Value types are copied" (before 04). Clean the glossary baseline (no Swift whitelisting).
- [ ] BLE: "What's in a shout" (advertisement contents, ScanFilter), "Ask first" (permissions),
  "Can I read it?" (properties: split P03), "Bytes to a number" (parsing 2A37 flags, uint8/16, bits),
  "The Android call chain" (connectGatt → callbacks → close; one operation at a time). P04 API-33 note.
- [ ] Quizzes everywhere: replace the "What's the difference between X and Y" template where it only tests recall;
  no two-option questions; applied/numeric questions.

## Sprint 13 (planned): Depth, and KMP first

Owner's priorities (2026-11-18): KMP really deep, then a Compose Multiplatform course, then iOS (KMP needs it);
BLE paused; then UX and UI designer reviews; content first, UI after.

### The depth ladder (design)
Every course stays a straight path of puzzles, but any building block can open a floor below it.
- A puzzle can list **"Go deeper"** blocks in its frontmatter (`deeper: [cs/what-a-compiler-does, …]`), rendered as
  an optional box after the takeaway: never required to pass, never gating, tracked like any other puzzle.
- The floors live in foundation courses, written the same way: **"Computers from the ground up"** (bits and
  bytes, how a CPU runs instructions, memory and addresses, the stack and the heap, caches) and **"How code
  becomes a program"** (source → tokens → tree → bytecode or machine code, JIT vs AOT, linking, what LLVM is).
  The kernel, processes and threads already live in the Android course's module 1.
- The building-block graph gets a direction: "builds on" points down, "go deeper" points further down.
  "Your learning" shows depth reached per topic, not only puzzles passed.
- Rule: the main path must stay complete without the floors (no puzzle may need a floor to be understood); the
  floors answer "but how does *that* work?" for whoever asks.

### KMP deep: modules to add after module 3 (no renumbering of existing puzzles)
4. The build: the `kotlin { }` block and targets; the default hierarchy template and intermediate source sets
   (appleMain, iosMain); what commonMain can see; klibs and how a library publishes per-target variants.
5. Kotlin/Native under the hood: from IR to LLVM to a binary; framework vs XCFramework, static vs dynamic;
   debug symbols, crash reports and symbolication; build time and binary size.
6. Across the boundary: Objective-C export limits (generics, sealed classes, default arguments), `@Throws` and
   exceptions, suspend functions and Flow from Swift (cancellation, threads), SKIE and Swift export.
7. Shipping it to iOS: SPM / CocoaPods / direct integration, embedAndSign, versioning a shared module.
8. The common stack: Ktor engines, kotlinx.serialization, SQLDelight, settings/DataStore, Koin; ViewModel
   in commonMain (lifecycle-viewmodel KMP); testing in commonTest and on iOS.
Deeper floors to link: what a compiler does, what LLVM is, linking, ARC vs tracing GC (exists in KMP module 2).

### Compose Multiplatform (new course `cmp`, assumes KMP)
1. Compose underneath: compiler plugin, composition and recomposition, runtime vs UI vs Material.
2. CMP on iOS: Skia via Skiko, ComposeUIViewController, one Metal canvas, frame scheduling.
3. Living with UIKit: interop both ways, text input and the keyboard, accessibility, look and feel.
4. Shared app plumbing: resources, navigation, lifecycle/ViewModel; performance on iOS; testing; CMP vs SwiftUI.

### iOS (feeds KMP)
Swift for Kotlin developers; your app's front door (@main, scenes); a screen (UIViewController, SwiftUI View);
split the main-actor puzzle (async/await + Task; actors); values are copied; fixes listed in sprint 12.

### Then: UX and UI designer reviews of the course section (overview, tracking, path across courses, visual design)

## Backlog, in order

1. **Sprint 9: LLMs for mobile engineers.** What happens when your app calls a model: tokens, the context window,
   prefill vs decode (time to first token vs tokens per second), the KV cache, streaming and cancellation in the
   UI, cost, on-device models. Notes: the AI and AI-engineering tracks.
2. **Encryption module 2.** Keys on the phone: Android Keystore, encrypted storage, pinning.
3. **BLE module 2, fast and reliable.** MTU and the 20-byte payload, Data Length Extension, 2M PHY, throughput math;
   Android's one-GATT-operation-at-a-time rule and status 133.
4. **Android module 4, continued.** Context and why it leaks; tasks and the back stack.
5. **The map.** One page per course drawing the blocks as a graph, coloured by what you've passed.
6. **Quiz quality.** Done in part: two new lint rules (no "X; Y" shape only on the right answer, no "Because" only on the wrong ones; 64 questions fixed). Still: the right answer is the longest option too often.
7. **Later:** system design, data structures, as the sessions behind them land in the notes repo.

## Why these, for whom

Anthropic's own posts explain AI very well, once, for reading. What this site adds: a path with no gaps (building
blocks, mastery checks, test-out), the mobile engineer's angle across platforms (Android ↔ iOS ↔ KMP, block by
block), every fact proved from source code or a spec, and material you can take with you (Obsidian, flashcards, a
Claude tutor that knows what you've passed). And it improves from real learners: anonymous wrong-answer counts
show which puzzle is broken.

## Next stage: an AI engineering lab and verified learning log

The public learning log will publish small experiments about new AI tools, chat integrations and repeatable agent workflows. Each article starts from an engineering question, gives the reader the same inputs and a rerun command, reports what actually happened, and names what still needs testing.

1. **Text and evaluation.** The first lab compares TF-IDF and a pinned MiniLM model on the same synthetic help articles. The experiment records exact rankings and feeds two LLM course puzzles on retrieval and evidence. Extend it with exact identifiers, unseen cases, and unanswerable questions before generalizing.
2. **Chat and tool use.** Connect a chat to a read-only search tool in a disposable support workspace. Compare a chat using search manually, a chat using a typed tool call, and a repeatable skill that makes the full workflow explicit. Give the setups the same corpus and permissions. Record tool calls, evidence, answer support, errors, latency and visible costs. Use fixed expectations for tool call inputs and outputs. Test missing evidence, tool errors, and instructions embedded in retrieved text as inputs to ignore. Gate any write behind explicit user approval.
3. **Android and KMP.** Build a small shared Kotlin chat feature. Use fake tool and model adapters for deterministic shared tests, then compare streaming and cancellation in the real client. On Linux install an Android SDK and verify the build and JVM tests. Run Android device checks where a device or supported emulator is available. Use a macOS runner with Xcode for Apple-target builds, Simulator checks and iOS-specific behavior. Mark each result with the platform actually tested.
4. **Publishing threshold.** Keep test data synthetic or public. Pin tool and model versions, save raw outcomes and publish a source or replay wherever permissions permit. For a new tool version, rerun the same cases before updating the claim.

Implementation discussions can refer to the public articles. Credentials, real user data and paid services belong behind explicit access and scope decisions.

## JVM and backend practice — concurrent edits

Added a deterministic Java 21 shared-counter exercise and a Python/SQLite HTTP exercise for two editors. Each course now has a linked lesson, a four-step diagram and three prediction checks. The graduation extension asks learners to defend the same invariant across two service instances.

## Backend system design in English

Published a 15-lesson path through a parking reservation service, with three transfer cases, a Java/JDBC concurrency and restart lab, a queue model, module checkpoints and an offline vault. The design exam requires a capacity estimate, a failure timeline, reproducible evidence and a revised decision after an assumption changes.
