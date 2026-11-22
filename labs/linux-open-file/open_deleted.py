#!/usr/bin/env python3
"""Reproduce a deleted file that remains open, using only Python's standard library."""

import os
import tempfile
from pathlib import Path


PAYLOAD_BYTES = 4 * 1024 * 1024


def run() -> None:
    with tempfile.TemporaryDirectory(prefix="course-open-file-") as directory:
        path = Path(directory) / "incident.log"
        descriptor = os.open(path, os.O_CREAT | os.O_RDWR, 0o600)
        proc_entry = Path(f"/proc/{os.getpid()}/fd/{descriptor}")
        try:
            os.write(descriptor, b"x" * PAYLOAD_BYTES)
            os.fsync(descriptor)
            path.unlink()

            target = os.readlink(proc_entry)
            held = os.fstat(descriptor)
            assert not path.exists()
            assert target.endswith(" (deleted)"), target
            assert held.st_nlink == 0, held.st_nlink
            assert held.st_size == PAYLOAD_BYTES, held.st_size

            print("after unlink")
            print("  pathname: missing")
            print(f"  descriptor target: {target}")
            print(f"  descriptor bytes: {held.st_size}")
            print(f"  hard links: {held.st_nlink}")
        finally:
            os.close(descriptor)

        assert not proc_entry.exists()
        print("after close")
        print("  descriptor entry: missing")
        print("verified: the failure and release boundary behaved as predicted")


if __name__ == "__main__":
    if not Path("/proc/self/fd").is_dir():
        raise SystemExit("This experiment needs Linux procfs mounted at /proc.")
    run()
