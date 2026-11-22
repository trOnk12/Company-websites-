# A deleted log still occupies storage

This Linux experiment creates a four-MiB file, opens it, removes its pathname and inspects the descriptor that still refers to it. It then closes the descriptor and verifies that the corresponding procfs entry disappears.

Before running it, predict these observations:

1. Does the pathname still exist after `unlink`?
2. What does `/proc/<pid>/fd/<number>` point to?
3. What size and link count does `fstat` report?
4. Which observation changes only after `close`?

Run it with Python 3 on Linux:

```sh
python3 open_deleted.py
```

The script uses a private temporary directory, removes it on exit and contains assertions for every claimed boundary. It needs Linux procfs mounted at `/proc`.

In a real incident, identify the process and descriptor before acting. Preserve data that still matters, then close the owning descriptor through the application's supported reopen or shutdown path. Test log rotation so the application closes the old file before treating deletion as recovery.

Sources:

- [Linux kernel procfs documentation](https://docs.kernel.org/filesystems/proc.html#proc-pid-fd-list-of-symlinks-to-open-files)
- [Linux `unlink(2)` manual](https://man7.org/linux/man-pages/man2/unlink.2.html)
