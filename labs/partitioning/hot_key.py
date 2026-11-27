#!/usr/bin/env python3
"""Compare a safe hot partition with an unsafe balanced request route."""

from argparse import ArgumentParser
from collections import Counter

OTHER_LOTS = 15


def inputs(total: int, west: int, owners: int) -> list[str]:
    if owners < 2:
        raise ValueError("owners must be at least 2")
    if not 0 <= west <= total:
        raise ValueError("west must be between 0 and total")
    result = ["west"] * west
    for n in range(total - west):
        result.append(f"lot-{n % OTHER_LOTS + 1}")
    return result


def owner_for_lot(lot_id: str, owners: int) -> int:
    if lot_id == "west":
        return 0
    return 1 + (int(lot_id.split("-")[1]) - 1) % (owners - 1)


def consume_last_space(routes: list[int]) -> int:
    """Broken model: each owner has an independent copy saying one remains."""
    free_by_owner = {owner: 1 for owner in set(routes)}
    grants = 0
    for owner in routes:
        if free_by_owner[owner] == 1:
            free_by_owner[owner] = 0
            grants += 1
    return grants


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("--total", type=int, default=1000)
    parser.add_argument("--west", type=int, default=700)
    parser.add_argument("--owners", type=int, default=16)
    parser.add_argument("--owner-capacity", type=int, default=100)
    args = parser.parse_args()

    attempts = inputs(args.total, args.west, args.owners)
    by_lot = Counter(owner_for_lot(lot, args.owners) for lot in attempts)
    hot_owner, hot_count = by_lot.most_common(1)[0]
    by_request = Counter(request_id % args.owners for request_id in range(args.total))
    unsafe_grants = consume_last_space([0 % args.owners, 1 % args.owners])

    assert sum(by_lot.values()) == args.total
    assert sum(by_request.values()) == args.total
    assert max(by_request.values()) - min(by_request.values()) <= 1
    print(
        f"by_lot busiest_owner={hot_owner} requests={hot_count} "
        f"overload={max(0, hot_count - args.owner_capacity)}"
    )
    print(f"by_request busiest_requests={max(by_request.values())}")
    print(f"unsafe_last_space_grants={unsafe_grants}")


if __name__ == "__main__":
    main()
