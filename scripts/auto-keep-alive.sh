#!/bin/bash
# Auto-restart server script
# يعيد تشغيل الخادم إذا توقف
# يراقب كل 5 ثوان

LOG_FILE="/tmp/auto-restart.log"
SERVER_CMD="node server.js"
HEALTH_URL="http://localhost:3000/api/health"
MAX_LOG_SIZE=1048576 # 1MB

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Truncate log if too large
if [ -f "$LOG_FILE" ]; then
  LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
  if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE" ]; then
    tail -c 524288 "$LOG_FILE" > "$LOG_FILE.tmp"
    mv "$LOG_FILE.tmp" "$LOG_FILE"
  fi
fi

log "=== Auto-restart monitor started ==="

while true; do
  # Check if server is running
  if ! pgrep -f "$SERVER_CMD" > /dev/null; then
    log "Server is not running, starting..."
    nohup $SERVER_CMD > /tmp/server.log 2>&1 &
    sleep 3
    log "Server started with PID: $!"
  fi

  # Health check
  if ! curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" | grep -q "200"; then
    log "Health check failed, restarting server..."
    pkill -f "$SERVER_CMD"
    sleep 2
    nohup $SERVER_CMD > /tmp/server.log 2>&1 &
    sleep 3
    log "Server restarted with PID: $!"
  fi

  sleep 5
done
