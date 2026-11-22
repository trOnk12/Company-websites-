---
title: A namespace per resource
short: Reading the fence, and the UTS and network namespaces
summary: Puzzles 2 and 3 fenced off process IDs and files. A program also reads its machine's name and talks through the network. Here's how to read, for any process, which fences it has, and what two more of them change.
takeaway: Each kind of namespace fences one resource, and /proc/PID/ns shows which ones a process is in: equal numbers mean the same namespace. Docker gives a container new PID, mount, UTS, network and IPC namespaces, so it has its own hostname and its own network interfaces, localhost included; it does not, by default, give it a user namespace.
---

## The problem

Puzzle 2 gave the container its own process IDs, and puzzle 3 its own file tree. But a program asks the kernel for more than that. It reads the machine's **hostname**, the name the machine calls itself, which programs put in logs and error reports. And it talks to the world through **network interfaces**: connections to a network, each with its own address, such as a Wi-Fi card or a cable.

Does the container get its own of those too, or share the host's? And more generally: given any process, how could you tell which fences it has, without trusting what Docker says?

## See it

```diagram ns-links
```

## The building block

The kernel has one kind of namespace for each resource it can fence. And it shows, for every process, which namespace of each kind it's in: the folder `/proc/PID/ns` holds one link per kind, and the number in each link names one namespace. Two processes with the same number are in the same namespace; different numbers, different namespaces. No guessing needed.

| Kind | What it fences | New for the container on the run behind this page? |
| --- | --- | --- |
| pid | process IDs (puzzle 2) | yes |
| mnt | the list of mounts (puzzle 3) | yes |
| uts | the hostname | yes |
| net | network interfaces, addresses, ports | yes |
| ipc | message queues and shared memory between processes | yes |
| time | two of the kernel's clocks | yes |
| user | user IDs (puzzle 5) | no: same number as the host |

There is one more link, for a resource-limit feature that puzzle 6 introduces; on the test machine it matched the host's too.

A **UTS namespace** holds the hostname. (UTS is an old Unix name; the kernel returns the hostname from the same system call as puzzle 1's `uname -r`.) Changing the hostname inside one changes it for that namespace only. Docker gives every container its own and sets the name to the start of the container's ID: here 7cd6333d62bd, while the host is called vm. `unshare --uts` shows the same thing by hand: a shell renames itself box, and the host's name stays vm.

A **network namespace** holds the network: its interfaces, their addresses, the routes between them and the ports programs listen on. The container's has two interfaces:

- lo, the loopback interface, address 127.0.0.1, also called localhost: a connection from the namespace to itself. Inside a container, localhost is the container, not the host. A program that expects a database on localhost finds nothing there unless that database runs in the same container.
- eth0, with address 172.17.0.2: the container's one way out. Its other end is on the host (the veth interface in the host's list). How packets travel from there, and how to reach a container's port from outside, is Module 5 (coming soon).

Because ports belong to a network namespace, two containers can both run a server on port 80 without colliding.

One more thing the links explain: `docker exec` doesn't create namespaces. It starts its program inside the container's existing ones (a system call, setns, joins a namespace), so its links show the same numbers as sleep's. That's why puzzle 0's `docker exec box ps` saw the container's processes.

## The analogy

Each flat's fences are separate fittings: its own house-number plate (UTS), its own letterbox and phone line (network), its own register (PID), its own furniture plan (mount). The caretaker's book lists, for each flat, which fittings are its own and which are shared with the building. In this building, every flat shares the building's staff list (user), which puzzle 5 shows is a problem.

## Run it yourself

With puzzle 0's container running (`docker run -d --name box alpine:3.20 sleep 1000`). Predict which lines will show equal numbers before you run the loop.

```sh
for n in pid mnt net uts user; do
  echo "$n $(readlink /proc/self/ns/$n) $(readlink /proc/$(pgrep -x sleep)/ns/$n)"
done
hostname; docker exec box hostname
docker exec box ip -4 -o addr
unshare --uts sh -c 'hostname box; hostname'; hostname
```

readlink prints where a link points. Output from the run behind this page (your numbers will differ; the ip lines are cut to the interface and its address):

```
pid pid:[4026531836] pid:[4026532267]
mnt mnt:[4026531832] mnt:[4026532264]
net net:[4026531833] net:[4026532268]
uts uts:[4026531838] uts:[4026532265]
user user:[4026531837] user:[4026531837]
vm
7cd6333d62bd
lo 127.0.0.1/8
eth0 172.17.0.2/16
box
vm
```

## Check yourself

- A program in a container connects to localhost to reach a database that runs on the host, not in a container. Does it reach the database?::*No: localhost inside is the container's own lo||Yes: localhost always means the machine itself >> Each network namespace has its own lo, so localhost is the container. >> s5||Yes, because the container shares the host's kernel >> One kernel, but the network namespace is the container's own. >> s5::Inside a network namespace, localhost is that namespace.
- Two containers each set their hostname to web, at the same moment. What do the host and the two containers report?::*The host keeps its name, and each container is web in its own namespace||The second container's change is refused: web is taken >> Each changes the name in its own UTS namespace, so there's nothing to collide. >> s4||All three become web, since hostname is a kernel setting >> The kernel keeps one hostname per UTS namespace, not one per machine. >> s4::A hostname belongs to a UTS namespace.
- You compare `/proc/PID/ns` for sleep and for a ps started with `docker exec` in the same container. Which links match?::*All of them: docker exec joins the existing namespaces||Only user, as between the container and the host >> docker exec starts its program in the container's namespaces, so pid, mnt, net and uts match too. >> the-building-block||None: every new process gets new namespaces >> New namespaces are made only when asked for; docker exec joins the container's. >> the-building-block::docker exec enters the container's namespaces.

## Sources

- [Linux manual: namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html) ("Each process has a /proc/pid/ns/ subdirectory containing one entry for each namespace that supports being manipulated by setns(2)"; "If two processes are in the same namespace, then the device IDs and inode numbers of their /proc/pid/ns/xxx symbolic links will be the same"; "The setns(2) system call allows the calling process to join an existing namespace."; the table of namespace types: "UTS CLONE_NEWUTS uts_namespaces(7) Hostname and NIS domain name")
- [Linux manual: uts_namespaces(7)](https://man7.org/linux/man-pages/man7/uts_namespaces.7.html) ("UTS namespaces provide isolation of two system identifiers: the hostname and the NIS domain name."; "can be retrieved using uname(2)")
- [Linux manual: network_namespaces(7)](https://man7.org/linux/man-pages/man7/network_namespaces.7.html) ("Network namespaces provide isolation of the system resources associated with networking: network devices, IPv4 and IPv6 protocol stacks, IP routing tables, firewall rules"; "port numbers (sockets)")
- [Docker docs: docker container run, UTS settings](https://docs.docker.com/reference/cli/docker/container/run/) ("The UTS namespace is for setting the hostname and the domain that's visible to running processes in that namespace. By default, all containers, including those with --network=host , have their own UTS namespace.")
- [Docker docs: Networking overview](https://docs.docker.com/engine/network/) ("a container's hostname defaults to be the container's ID in Docker."; "DNS requests will be forwarded from the container's network namespace so, for example, --dns=127.0.0.1 refers to the container's own loopback address.")
- [Docker docs: Docker Engine security](https://docs.docker.com/engine/security/) ("Each container also gets its own network stack, meaning that a container doesn't get privileged access to the sockets or interfaces of another container.")
- The namespace numbers, hostnames, interface lists and addresses were read in this session with Docker Engine 29.9.2 and util-linux 2.39.3 on Linux 6.18.44; `docker exec box readlink /proc/self/ns/uts` printed uts:[4026532265], the same as sleep's.
