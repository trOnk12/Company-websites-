# Docker course: review log

| Date | Version | Lint | Scores | Found → changed |
| --- | --- | --- | --- | --- |
| 2026-11-22 | Module 1 (puzzles 0–7), first draft | clean | Diagram rubric (author's self-score, /20): process 19, kernel-vm 18, pid-ns 18, mount-ns 18, ns-links 19, user-ns 19, cgroup-limits 18, run-sequence 18. Fresh-learner (pass 2), picture (2b) and expert (2d) reviews: **not yet run**. | Picture check of `.shots/docker/strips/`: the container hid behind the VM box in kernel-vm step 6 → drawn on top, VM label moved above the box; "UID 1000 on host" touched its arrow → boxes widened; "no such process" overlapped a card → moved into the gap. Facts: Android-emulator, Mac `uname`, Kata and userns-remap claims without a fetched quote → removed or replaced by quoted text. Lint: terms that collided with other courses' baselines (process, kernel, image, UID, interface) → linked under "from" or renamed (container image, network interface). |

Smallest SVG text: class d-tiny, 15 px in the 640-wide viewBox, about 11.3 px on the 480 px phone stage.
Real output: every command output on the pages was produced on 22 November 2026 (Docker Engine 29.9.2, containerd
b7a25261, runc 1.5.2, util-linux 2.39.3, Linux 6.18.44, Ubuntu 24.04 host, cgroup v1). cgroup v2 file names and the
Docker Desktop on Mac behaviour are quoted from documentation, not run, and the pages say so.

| Date | Version | Lint | Scores | Found → changed |
| --- | --- | --- | --- | --- |
| 2026-11-22 | Module 1 after the independent strict review (now puzzles 0–8) | clean | Self-scored rubric /20: process 19, kernel-vm 18, pid-ns 18, mount-ns 18, ns-links 19, user-ns 19, memory-limit 18, cpu-quota 18, run-sequence 18. | Exit 137 only when PID 1 is killed (reproduced: child killed → exit 0, OOMKilled true); kernel-vm step 6 now shows the macOS kernel and the VM's version, Docker Desktop on Linux also runs a VM; "root" made a documented homonym (root filesystem vs root user) with a paragraph in 05 and a note in 08; cgroup v2 is the main text, portable commands for v1/v2, dmesg added; Before you start in 00 (Engine install, Multipass, docker group, the permission-denied error, reproduced); 04 table gains time (29.5+) and the cgroup-namespace row; capabilities and DAC_OVERRIDE in 05 with a --cap-drop run; pivot_root vs chroot and propagation in 03; old 06 split into 06 memory and 07 CPU quota (new cpu.stat throttling run), old 07 renumbered to 08; four copyable questions reworked into predictions; roadmap extended to expert and course.json synced. |
