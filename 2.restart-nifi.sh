#!/bin/bash

NIFI_HOME="/Users/quynt/Desktop/nifi/building-nifi/nifi-assembly/target/nifi-2.6.0-SNAPSHOT-bin/nifi-2.6.0-SNAPSHOT"

echo "Starting NiFi from: $NIFI_HOME"

if [ ! -d "$NIFI_HOME" ]; then
    echo "NiFi not found. Please build first with ./1.build-github.sh"
    exit 1
fi

cd "$NIFI_HOME/bin"

./nifi.sh stop

sleep 10

# Chạy NiFi
./nifi.sh start

echo "NiFi is starting..."
echo "Web UI will be available at: https://localhost:8443/nifi"
echo ""
echo "To check status: ./nifi.sh status"
echo "To stop: ./nifi.sh stop"
echo "To check logs: tail -f ../logs/nifi-app.log"
