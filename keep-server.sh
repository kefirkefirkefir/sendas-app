#!/bin/bash
# keep-server.sh — production server with auto-restart
cd /home/z/my-project

while true; do
  echo "[$(date)] Starting production server..."
  npx next start -p 3000
  echo "[$(date)] Server crashed, restarting in 3s..."
  sleep 3
done
