"""Discrete one-second capacity model. All rates and counts are requests."""
import argparse


def run(seconds, incoming, capacity, waiting=0, limit=None):
    dropped = 0
    for second in range(seconds):
        demand = waiting + incoming
        completed = min(demand, capacity)
        waiting = demand - completed
        if limit is not None and waiting > limit:
            dropped += waiting - limit
            waiting = limit
    return waiting, dropped


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--peak", type=int, default=120)
    parser.add_argument("--after", type=int, default=80)
    parser.add_argument("--capacity", type=int, default=100)
    parser.add_argument("--limit", type=int, help="maximum waiting at each second boundary")
    args = parser.parse_args()
    if any(value is not None and value < 0 for value in vars(args).values()):
        parser.error("counts must be non-negative")
    waiting, dropped = run(60, args.peak, args.capacity, limit=args.limit)
    print(f"After peak: {waiting} waiting, {dropped} dropped")
    waiting, dropped_after = run(60, args.after, args.capacity, waiting, args.limit)
    print(f"After recovery: {waiting} waiting, {dropped + dropped_after} dropped in total")
