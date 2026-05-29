#!/bin/sh
set -eu

SCHEDULE="${CRON_SCHEDULE:-0 */6 * * *}"

# Run once on container start so API gets fresh data immediately.
echo "[updater] running initial pricing refresh"
cd /data
FORCE_REFRESH=1 node /app/index.js

# Schedule ongoing refreshes and stream logs to container output.
echo "${SCHEDULE} cd /data && FORCE_REFRESH=1 node /app/index.js >> /proc/1/fd/1 2>> /proc/1/fd/2" > /etc/crontabs/root

echo "[updater] cron schedule set to: ${SCHEDULE}"
exec crond -f -l 8
