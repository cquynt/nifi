#!/bin/bash

# Tối ưu Maven build cho M1 Max
export MAVEN_OPTS="-Xmx8g -XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:+UseCompressedOops -XX:+UseStringDeduplication"

echo "Building NiFi Assembly with optimizations..."

# Tăng tốc build với các optimizations
./mvnw clean install \
  -T 8 \
  -am \
  -pl :nifi-assembly \
  -DskipTests \
  -Dmaven.javadoc.skip=true \
  -Dmaven.source.skip=true \
  -Dcheckstyle.skip=true \
  -Dpmd.skip=true \
  -Dspotbugs.skip=true \
  -Djacoco.skip=true \
  -Denforcer.skip=true \
  -Dmaven.compile.fork=true \
  -Dmaven.compiler.maxmem=2g \
  --batch-mode \
  --no-transfer-progress

echo "Build completed!"

#./2.restart-nifi.sh