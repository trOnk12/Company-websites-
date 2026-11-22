---
title: Stacking layers into one tree
short: The overlay filesystem, copy-up and whiteouts
summary: Puzzle 9's image is a stack of separate layers, yet the container sees one ordinary file tree that it can even write to. Here's the kernel feature that stacks them, and what really happens when a container changes or deletes a file the image provides.
takeaway: The overlay filesystem shows read-only lower directories (the image's unpacked layers) and one writable upper directory as one merged tree. New files land in upper; the first write to a file from a lower layer copies the whole file up first; a deletion becomes a whiteout in upper. The lower layers never change, which is why one image can serve many containers.
---

## The problem

Puzzle 9 left an image as a stack of layers: Alpine's 517 files, then a layer that adds notes.txt and whites out motd. A container doesn't see a stack. It sees one /, where notes.txt exists, /etc/motd doesn't, and every file can be written, even though the layers must never change (puzzle 0: ten containers share one image). Who builds that one tree, and where do the container's writes go?

## See it

```diagram overlay
```

## The building block

The kernel does it, with a filesystem made for exactly this. The **overlay filesystem** (OverlayFS) takes several directories and shows them, stacked, as one: the merged view. The ones underneath are each a **lower directory**: read-only, here one unpacked layer each. On top sits one **upper directory**, the only writable one. When a name exists in both, the upper one wins. The process only ever sees merged.

The run behind this page built one by hand, in /tmp/ov:

```
$ echo "from the image" > lower/motd; echo "keep me" > lower/os-release
$ mount -t overlay overlay -o lowerdir=lower,upperdir=upper,workdir=work merged
$ echo hello > merged/notes.txt; echo changed > merged/os-release; rm merged/motd
$ ls -l upper
total 8
c--------- 2 root root 0, 0 Nov 22 22:21 motd
-rw-r--r-- 1 root root    6 Nov 22 22:21 notes.txt
-rw-r--r-- 1 root root    8 Nov 22 22:21 os-release
$ cat lower/os-release; ls merged
keep me
notes.txt
os-release
```

(workdir is an empty scratch directory the kernel needs next to upper.) Each command changed only upper:

- A new file, notes.txt, is created in upper.
- os-release existed only in lower. Lower is read-only, so on the first write the kernel copies the whole file into upper and changes the copy. That is a **copy-up**. The original in lower still says "keep me".
- motd can't be removed from lower, so the kernel puts a whiteout in upper. Inside the kernel a whiteout is a special device file numbered 0,0 (the c at the start of its ls -l line); in a layer's tar it is the .wh. file of puzzle 9. Docker converts one form into the other when it packs or unpacks a layer.

A container's root filesystem is the same mount with more lower directories. Inside puzzle 3's box, the first line of /proc/mounts lists them, separated by colons, with the top one first:

```
overlay / overlay rw,relatime,lowerdir=…/snapshots/81/fs:…/snapshots/80/fs:…/snapshots/76/fs:…/snapshots/1/fs,upperdir=…/snapshots/82/fs,workdir=…/snapshots/82/work
```

The lower directories are the image's layers, plus small read-only ones that Docker adds for the container; the upper directory is the container's own (puzzle 11). Every container from the image gets its own upper and shares the same lowers, which is why the image never changes.

Copy-up has a cost: it copies the whole file, even to change one byte. A container that writes to a large file from its image pays for copying it first, and the copy then takes space in upper. Data a program writes a lot belongs outside the container's tree, in a volume (Module 5, coming soon).

## The analogy

The flat's furniture plan is printed on paper the tenant may not touch. Over it lies a sheet of tracing paper. The tenant draws a new desk on the tracing paper. To move the sofa, the tenant first traces the whole sofa onto the sheet, then redraws it there. To get rid of the lamp, the tenant paints a white patch over it on the tracing paper. Looking down, the tenant sees one plan; the printed sheet underneath is the same for every flat.

## Run it yourself

As the administrator on a Linux machine (no Docker needed). Before the ls -l upper, predict which three names will be there, and what kind of file motd will be.

```sh
mkdir -p /tmp/ov && cd /tmp/ov && mkdir -p lower upper work merged
echo "from the image" > lower/motd; echo "keep me" > lower/os-release
sudo mount -t overlay overlay -o lowerdir=lower,upperdir=upper,workdir=work merged
echo hello | sudo tee merged/notes.txt >/dev/null
echo changed | sudo tee merged/os-release >/dev/null
sudo rm merged/motd
ls -l upper; cat lower/os-release; ls merged
sudo umount merged
```

Output from the run behind this page, from ls -l upper on:

```
total 8
c--------- 2 root root 0, 0 Nov 22 22:21 motd
-rw-r--r-- 1 root root    6 Nov 22 22:21 notes.txt
-rw-r--r-- 1 root root    8 Nov 22 22:21 os-release
keep me
notes.txt
os-release
```

## Check yourself

- A container from an image with a 1 GB database file in a lower layer appends one line to that file. What happens on disk?::*The whole 1 GB file is copied into upper, then changed||Only the new line is written, into upper >> The overlay filesystem copies whole files, not changed parts. >> s5||The line is written into the lower layer's file >> Lower directories are read-only; every change lands in upper. >> s3::Copy-up copies the whole file before the first write.
- Two containers from notes:v1 both run, and one deletes /notes.txt. Does the other still see it?::*Yes: the whiteout is in the first container's own upper||No: the file is gone from the image's layer >> Lower layers never change; the deletion is a whiteout in one upper. >> s6||No: both containers share one upper directory >> Each container has its own upper; they share only the lowers. >> the-building-block::Changes are per container; layers are shared.
- A file exists in a lower layer and in the upper directory, with different contents. Which one does the process read?::*The one in upper||The one in lower, because the image comes first >> When a name exists in both, the upper one wins. >> the-building-block||Both, joined into one file >> Files are never joined: merged shows exactly one, the upper one. >> s5::Upper wins.

## Sources

- [Linux kernel docs: Overlay Filesystem](https://docs.kernel.org/filesystems/overlayfs.html) ("An overlay filesystem combines two filesystems - an ‘upper’ filesystem and a ‘lower’ filesystem. When a name exists in both filesystems, the object in the ‘upper’ filesystem is visible while the object in the ‘lower’ filesystem is either hidden or, in the case of directories, merged with the ‘upper’ object."; "whiteout is created as a character device with 0/0 device number or as a zero-size regular file with the xattr “trusted.overlay.whiteout”."; "Multiple lower layers can now be given using the colon (“:”) as a separator character between the directory names.")
- [Docker docs: OverlayFS storage driver](https://docs.docker.com/engine/storage/drivers/overlayfs-driver/) ("OverlayFS layers two directories on a single Linux host and presents them as a single directory. These directories are called layers, and the unification process is referred to as a union mount."; "The overlay2 driver performs a copy_up operation to copy the file from the image ( lowerdir ) to the container ( upperdir ). The container then writes the changes to the new copy of the file in the container layer."; "When a file is deleted within a container, a whiteout file is created in the container ( upperdir ). The version of the file in the image layer ( lowerdir ) is not deleted (because the lowerdir is read-only).")
- [OCI image spec v1.1.1: Image Layer Filesystem Changeset](https://github.com/opencontainers/image-spec/blob/v1.1.1/layer.md) ("A whiteout filename consists of the prefix .wh. plus the basename of the path to be deleted.")
- The overlay mount and the container's /proc/mounts line (shortened with …, the directory numbers as printed) were produced in this session on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1) with Docker Engine 29.9.2.
