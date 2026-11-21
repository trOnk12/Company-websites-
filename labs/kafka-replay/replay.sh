#!/usr/bin/env bash
# Use with a disposable Kafka 4.1 broker on localhost:9092.
# Run from the Kafka distribution directory: bash /path/to/replay.sh
set -euo pipefail
bootstrap=localhost:9092
topic="course-replay-$(date +%s)-$$"
if [[ ! -x bin/kafka-topics.sh ]]; then
  echo 'Run this script from the extracted Kafka distribution directory.' >&2
  exit 1
fi
bin/kafka-topics.sh --bootstrap-server "$bootstrap" --create --topic "$topic" --partitions 1 --replication-factor 1
trap 'bin/kafka-topics.sh --bootstrap-server "$bootstrap" --delete --topic "$topic"' EXIT
printf '%s\n' packed shipped | bin/kafka-console-producer.sh --bootstrap-server "$bootstrap" --topic "$topic"
for offset in 0 1 0; do
  printf 'Read at offset %s: ' "$offset"
  bin/kafka-console-consumer.sh --bootstrap-server "$bootstrap" --topic "$topic" --partition 0 \
    --offset "$offset" --max-messages 1 --timeout-ms 15000
done
