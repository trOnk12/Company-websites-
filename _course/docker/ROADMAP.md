# Docker from the kernel up: the road to expert

The learner: an Android and Kotlin engineer who has run `docker run` at work and knows what a program and a file are,
but has never looked under Docker. They have not taken the Android internals, JVM or backend courses here.
The goal ("Docker: everything complete", Mateusz, 22 November 2026): someone who can build small, secure,
reproducible images, debug a container that won't start or gets killed, and run containers in production.

Rules: one core idea per puzzle, 5–8 puzzles per module, foundation first (no module uses an idea a later module
teaches). Every output on a page comes from a real run (Docker Engine 29.9.2, runc 1.5.2, Linux 6.18.44, cgroup v1
on the test machine) or is quoted from official docs and marked as such. Sources: docs.docker.com, man7.org,
docs.kernel.org, the OCI runtime and image specs (pinned to a tag). Status: **done**, *next*, or planned.

Picture world: the kernel is the ground (or a brown layer); a process is a card with its command and PID; a
container's fence is a dashed blue frame; programs in a chain are lifelines. Analogy world: an apartment block
(the caretaker is the kernel, a flat is a container, frosted windows are namespaces, the meter and fuse are the cgroup).

## Module 1: What a container really is (**done**, puzzles 0–7)
0. A container is a process: the host's ps lists it with its own PID; the image is files; the fence.
1. One kernel, or many: system calls, `uname -r` inside equals outside, VM and hypervisor, Docker Desktop's Linux VM.
2. Whose PID 1: namespaces, the PID namespace, NSpid, /proc, seeing inward only, PID 1's exit ends the namespace.
3. A file tree of its own: mounts, the mount namespace, the root filesystem from the image, /proc/PID/root.
4. A namespace per resource: /proc/PID/ns links, UTS (hostname), network (lo is the container's localhost), docker exec joins.
5. Root in the container is root on the host: UIDs, root, no user namespace by default, UID maps, `--user`, userns-remap.
6. How much may it use: cgroups, the memory limit and the kill at it (exit 137), free shows the host, the CPU quota, v1 vs v2 files.
7. Who builds the container: docker → dockerd → containerd → shim → runc → kernel; config.json and the OCI runtime spec.

## Module 2: Images (*next*)
1. What's in an image: layers as tar archives of file changes; `docker save` and looking inside one.
2. The union filesystem: overlayfs lower and upper directories, the merged view, copy-up on write, whiteout files for deletes.
3. The container's writable layer: what survives `docker stop`, what `docker rm` throws away, why the image never changes.
4. Content addressing: SHA-256 digests of layers and configs, why the same bytes give the same name everywhere.
5. Tags versus digests: a tag is a movable label, a digest is a fixed name; `image@sha256:…` and what "latest" really means.
6. Registries and pulling: repository, tag, manifest, the pull as a list of blobs fetched by digest, layer sharing on disk.
7. The OCI image spec: index (one image, many platforms), manifest, config (the command, env, user), layers.

## Module 3: The Dockerfile and the build
1. Instructions to layers: which instructions add a layer (RUN, COPY, ADD) and which only change the config (CMD, ENV, USER).
2. The build context and .dockerignore: what gets sent to the builder, and secrets that leak in by accident.
3. The build cache: the rules for a hit, why one changed line rebuilds everything after it.
4. Multi-stage builds: build in one stage, copy only the result into a small final image.
5. BuildKit: parallel stages, cache mounts, secret mounts that never land in a layer.
6. Reproducible builds: pinning the base by digest, pinning package versions, timestamps, `SOURCE_DATE_EPOCH`.

## Module 4: Running a container well
1. PID 1 and signals: SIGTERM, SIGKILL, why PID 1 ignores signals it has no handler for (pid_namespaces(7)).
2. Exec form versus shell form: `CMD ["java", …]` versus `CMD java …`, and the shell that swallows SIGTERM.
3. `docker stop` and its grace period; `--init` (tini) as a reaper of orphaned processes.
4. Exit codes: 0, 1, 125–127, 128 + signal (137 = SIGKILL, 143 = SIGTERM), and how to read them.
5. Restart policies and health checks: no, on-failure, always, unless-stopped; HEALTHCHECK and unhealthy.
6. Logs: stdout and stderr, the json-file driver, rotation, why a container should not write log files.

## Module 5: Data and networking
1. Volumes versus bind mounts versus tmpfs: who owns the data, what survives the container.
2. The bridge network: docker0, veth pairs, the container's eth0 (puzzle 4's veth, explained).
3. Publishing ports: `-p 8080:80`, NAT rules, why localhost inside is not the host.
4. User-defined networks and DNS between containers by name.
5. Compose: one file for several containers, their networks and volumes, startup order and its limits.

## Module 6: Limits and failures
1. The OOM kill in depth: memory.events, OOMKilled, exit 137 versus a crash, reading the kernel's log.
2. Memory that counts: page cache, kernel memory, tmpfs in the limit; swap and `--memory-swap`.
3. CPU shares versus quota, throttling (cpu.stat), and why a "0.5 CPU" service has long pauses.
4. A JVM in a container: container support, MaxRAMPercentage, how the heap is sized from the cgroup, native memory.
5. PIDs limit and fork bombs; disk space and the writable layer.

## Module 7: Security
1. Root versus a non-root user: USER in the image, file ownership, the common breakages.
2. Capabilities: root split into pieces, Docker's default set, `--cap-drop ALL`.
3. seccomp and AppArmor: which system calls a container may make.
4. Read-only root filesystem with tmpfs for scratch space.
5. Rootless mode and userns-remap, revisited with Module 1's user namespace.
6. Image scanning and SBOMs; secrets that must never end up in a layer (and how they do).
7. The Docker socket: why mounting /var/run/docker.sock is root on the host.

## Module 8: Small, fast images
1. Base image choices: distroless, Alpine (musl versus glibc), slim Debian; what each costs to debug.
2. Layer ordering for cache hits and for pulls.
3. Multi-architecture images: buildx, QEMU emulation versus native builders, the index from Module 2.
4. An Android and Gradle build in a container: SDK layers, Gradle caches, a CI image that stays small.

## Module 9: To production
1. Promoting an image by digest from test to production; signing and verifying.
2. A bridge to Kubernetes: a pod is containers sharing namespaces (puzzle 4's links, again), requests and limits as cgroups.
3. Debugging a running container: exec, inspect, logs, `nsenter` into one namespace, a debug container sharing the PID namespace.
4. A container that won't start: the checklist from daemon error to runc error to the program's own exit code.
5. Upgrades and drift: rebuilding for base-image security fixes, pinning versus updating.

## Going deeper floors (optional, never gating)
- How the kernel implements a namespace (struct nsproxy) and clone(2) flags.
- cgroup v2's single hierarchy and the systemd cgroup driver.
- How a hypervisor uses the processor's virtualization extensions.
