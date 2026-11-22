# Docker course: review log

| Date | Version | Lint | Scores | Found → changed |
| --- | --- | --- | --- | --- |
| 2026-11-22 | Module 1 (puzzles 0–7), first draft | clean | Diagram rubric (author's self-score, /20): process 19, kernel-vm 18, pid-ns 18, mount-ns 18, ns-links 19, user-ns 19, cgroup-limits 18, run-sequence 18. Fresh-learner (pass 2), picture (2b) and expert (2d) reviews: **not yet run**. | Picture check of `.shots/docker/strips/`: the container hid behind the VM box in kernel-vm step 6 → drawn on top, VM label moved above the box; "UID 1000 on host" touched its arrow → boxes widened; "no such process" overlapped a card → moved into the gap. Facts: Android-emulator, Mac `uname`, Kata and userns-remap claims without a fetched quote → removed or replaced by quoted text. Lint: terms that collided with other courses' baselines (process, kernel, image, UID, interface) → linked under "from" or renamed (container image, network interface). |

Smallest SVG text: class d-tiny, 15 px in the 640-wide viewBox, about 11.3 px on the 480 px phone stage.
Real output: every command output on the pages was produced on 22 November 2026 (Docker Engine 29.9.2, containerd
b7a25261, runc 1.5.2, util-linux 2.39.3, Linux 6.18.44, Ubuntu 24.04 host, cgroup v1). cgroup v2 file names and the
Docker Desktop on Mac behaviour are quoted from documentation, not run, and the pages say so.
