# Docker from the kernel up: the road to expert

The learner: an Android and Kotlin engineer who has run `docker run` at work and knows what a program and a file are,
but has never looked under Docker. They have not taken the Android internals, JVM or backend courses here.
The goal ("Docker: everything complete", Mateusz, 22 November 2026): someone who can build small, secure,
reproducible images, debug a container that won't start or gets killed, and run and operate containers in production,
including the parts that only bite at scale (logs filling a disk, a registry rate limit, a daemon upgrade).

Rules: one core idea per puzzle, 5–9 puzzles per module, foundation first (no module uses an idea a later module
teaches). Every output on a page comes from a real run or is quoted from official docs and marked as such. The test
machine so far: Docker Engine 29.9.2, runc 1.5.2, an Ubuntu 24.04 userland in a Firecracker microVM (custom kernel
6.18.44, cgroup v1). **cgroup v2 is the main path in the text** (the default on current distributions; v1 is
deprecated in Docker 29); v1 file names appear only as what the test machine printed. Sources: docs.docker.com,
man7.org, docs.kernel.org, the OCI runtime and image specs (pinned to a tag). Status: **done**, *next*, or planned.

Picture world: the kernel is the ground (or a brown layer); a process is a card with its command and PID; a
container's fence is a dashed blue frame; programs in a chain are lifelines. Analogy world: an apartment block
(the caretaker is the kernel, a flat is a container, frosted windows are namespaces, the meter and fuse are the cgroup).

## Module 1: What a container really is (**done**, puzzles 0–8)
0. A container is a process: the host's ps lists it with its own PID; the image is files; the fence. Before you start: Docker Engine, sudo or the docker group.
1. One kernel, or many: system calls, `uname -r` inside equals outside, VM and hypervisor, Docker Desktop's Linux VM (Mac, Windows, and Linux).
2. Whose PID 1: namespaces, the PID namespace, NSpid, /proc, seeing inward only, PID 1's exit ends the namespace, PID 1's signal protection.
3. A file tree of its own: mounts, the mount namespace and propagation, the root filesystem, pivot_root versus chroot.
4. A namespace per resource: /proc/PID/ns links, UTS, network (lo is the container's localhost; veth), time and cgroup namespaces by version, docker exec joins.
5. Root in the container is root on the host: UIDs, root, capabilities and DAC_OVERRIDE, no user namespace by default, UID maps, `--user`, userns-remap.
6. How much memory may it use: cgroups, memory.max, the kill at the line (exit 137 only when PID 1 dies; OOMKilled either way), free shows the host.
7. How much processor time: the CPU quota, cpu.max, throttling counters, threads sharing one quota, shares versus quota.
8. Who builds the container: docker → dockerd → containerd → shim → runc → kernel; config.json and the OCI runtime spec; the three daemon errors.

## Module 2: Images (*next*)
1. What's in an image: layers as tar archives of file changes; `docker save` and looking inside one.
2. The union filesystem: overlayfs lower and upper directories, the merged view, copy-up on write, whiteout files for deletes.
3. Where images live: the classic overlay2 storage driver versus the containerd image store and its snapshotters (the default for new Docker 29 installations), and how to tell which one `docker info` reports.
4. The container's writable layer: what survives `docker stop`, what `docker rm` throws away, why the image never changes.
5. Content addressing: SHA-256 digests of layers and configs, why the same bytes give the same name everywhere.
6. Tags versus digests: a tag is a movable label, a digest is a fixed name; `image@sha256:…` and what "latest" really means.
7. Registries and pulling: repository, tag, manifest, the pull as blobs fetched by digest; authentication, credential helpers, mirrors and Docker Hub's rate limits.
8. The OCI image spec: index (one image, many platforms), manifest, config (the command, env, user), layers, and referrers (signatures and attestations attached to an image).

## Module 3: The Dockerfile and the build
1. Instructions to layers: which instructions add a layer (RUN, COPY, ADD) and which only change the config (CMD, ENV, USER).
2. The build context and .dockerignore: what gets sent to the builder, and secrets that leak in by accident.
3. The build cache: the rules for a hit, why one changed line rebuilds everything after it.
4. Multi-stage builds: build in one stage, copy only the result into a small final image.
5. BuildKit: parallel stages, cache mounts, secret mounts that never land in a layer, a remote build cache (registry and CI caches), `docker buildx bake` for several targets.
6. Reproducible builds: pinning the base by digest, pinning package versions, timestamps, `SOURCE_DATE_EPOCH`.
7. What the build says about itself: BuildKit provenance and SBOM attestations, SLSA levels, and how they travel with the image.

## Module 4: Running a container well
1. PID 1 and signals: SIGTERM, SIGKILL, why PID 1 ignores signals it has no handler for (puzzle 2's protection, in depth).
2. Exec form versus shell form: `CMD ["java", …]` versus `CMD java …`, and the shell that swallows SIGTERM.
3. `docker stop` and its grace period; `--init` (tini) as a reaper of orphaned processes.
4. Exit codes: 0, 1, 125–127, 128 + signal (137 = SIGKILL, 143 = SIGTERM), OOMKilled next to the code, and how to read them. (The one place in the course that teaches exit codes.)
5. Restart policies and health checks: no, on-failure, always, unless-stopped; HEALTHCHECK and unhealthy.
6. Logs: stdout and stderr, the json-file driver (unbounded unless max-size is set) versus the local driver, rotation, what remote drivers hide from `docker logs`, and why a container should not write log files.
7. ulimits: open files and processes per container, and the daemon's defaults.

## Module 5: Data and networking
1. Volumes versus bind mounts versus tmpfs: who owns the data, what survives the container.
2. The bridge network: docker0, veth pairs, the container's eth0, addresses and prefixes (puzzle 4's /16, explained).
3. Publishing ports: `-p 8080:80`, the packet-filter rules Docker writes (iptables or nftables), why localhost inside is not the host.
4. User-defined networks and the embedded DNS server at 127.0.0.11: containers by name.
5. The other network drivers: host, none, macvlan; IPv6 on Docker networks.
6. Compose: one file for several containers, their networks and volumes, startup order and its limits.
7. Rootless networking: why a rootless daemon can't make veth pairs on the host, and the user-space network driver (gvisor-tap-vsock, the default for rootless since Docker 29.5).

## Module 6: Limits and failures (cgroup v2 first)
1. The OOM kill in depth: memory.events (oom, oom_kill), memory.oom.group, reading the kernel's log, why a child's death leaves the container running. (Exit codes themselves are Module 4.)
2. Memory that counts: page cache, kernel memory, tmpfs in the limit; swap and `--memory-swap`; memory.high as a soft brake before memory.max.
3. Pressure stall information (PSI): memory.pressure, cpu.pressure, io.pressure, and seeing trouble before the kill.
4. CPU: shares (cpu.weight) versus quota, throttling counters, and why a "0.5 CPU" service has long pauses.
5. I/O limits: io.max and io.weight, and a noisy neighbour on one disk.
6. A JVM in a container: container support, MaxRAMPercentage, how the heap is sized from the cgroup, native memory, thread counts from the CPU quota.
7. PIDs limit and fork bombs; disk space: the writable layer, logs, build cache, and `docker system df` and prune.

## Module 7: Security
1. Root versus a non-root user: USER in the image, file ownership, the common breakages.
2. Capabilities: Docker's default set, `--cap-drop ALL`, `--privileged` and why it removes nearly every fence, `no-new-privileges`.
3. seccomp: which system calls a container may make, and writing a profile.
4. AppArmor and SELinux: the second checks the kernel makes, and the volume relabelling flags.
5. Devices: `--device`, the device cgroup, and what a container can do with /dev.
6. Read-only root filesystem with tmpfs for scratch space.
7. Rootless mode and userns-remap, revisited with Module 1's user namespace; idmapped mounts.
8. Secrets: why environment variables and `docker inspect` show them, build secrets, and secrets that must never end up in a layer.
9. Supply chain: image scanning and SBOMs; signing and verifying with cosign or Notation (Docker Content Trust was removed from the CLI in Docker 29); verifying provenance.
10. The Docker socket: why mounting /var/run/docker.sock is root on the host.

## Module 8: Small, fast images, and Docker in your own work
1. Base image choices: distroless, Alpine (musl versus glibc), slim Debian; what each costs to debug.
2. Layer ordering for cache hits and for pulls.
3. Multi-architecture images: buildx, QEMU emulation versus native builders, the index from Module 2.
4. An Android and Gradle build in a container: SDK layers, Gradle caches, a CI image that stays small.
5. Testcontainers for Kotlin and JVM tests: real databases in tests, how it talks to the daemon, and ryuk's cleanup.
6. Docker in CI: Docker-in-Docker versus mounting the host's socket, and what each one risks.
7. Docker Desktop for Mac users: the VM, file sharing and its speed, `host.docker.internal`, and resource settings.

## Module 9: To production
1. Promoting an image by digest from test to production, with signatures verified on the way.
2. A bridge to Kubernetes: a pod is containers sharing namespaces (puzzle 4's links, again), requests and limits as cgroups, CRI.
3. Debugging a running container: exec, inspect, logs, `nsenter` into one namespace, a debug container sharing the PID namespace.
4. A container that won't start: the checklist from daemon error to runc error to the program's own exit code.
5. Operating the daemon: live restore and daemon upgrades without stopping containers, daemon.json, storage and log settings.
6. Upgrades and drift: rebuilding for base-image security fixes, pinning versus updating.

## Expert floor (optional, never gating)
- How the kernel implements a namespace (struct nsproxy) and clone(2) flags.
- cgroup v2's single hierarchy, delegation and the systemd cgroup driver.
- containerd internals: CRI, snapshotters, the shim API.
- seccomp profile authoring and testing.
- idmapped mounts in depth.
- CDI (Container Device Interface) and GPUs in containers.
- BuildKit's LLB: the build graph underneath a Dockerfile.
- How a hypervisor uses the processor's virtualization extensions.
