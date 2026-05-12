#!/bin/sh
set -eu

mkdir -p /data/.ielts /app/dashboard/dist/data

node /app/scripts/data-export.js /app/dashboard/dist/data

exec node /app/docker/server.js
