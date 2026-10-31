#!/usr/bin/env bash
# PitWall OS — Automated Smoke Test Script
set -e

API_URL="${API_URL:-http://localhost:8000}"

echo "=================================================="
echo "🏁 Starting PitWall OS Smoke Test against: $API_URL"
echo "=================================================="

# 1. Health Probe
echo -e "\n[1/4] Checking System Health (/health)..."
HEALTH_RESP=$(curl -s -f "$API_URL/health")
echo "Response: $HEALTH_RESP"

# 2. Ingestion Test
echo -e "\n[2/4] Triggering Telemetry Ingestion for Monza 2024 (VER & NOR)..."
INGEST_RESP=$(curl -s -f -X POST "$API_URL/api/v1/sessions/ingest" \
  -H "Content-Type: application/json" \
  -d '{"year": 2024, "circuit": "monza", "session_name": "R", "drivers": ["VER", "NOR"]}')
echo "Response: $INGEST_RESP"

# 3. Head-to-Head Corner Comparison
echo -e "\n[3/4] Querying DuckDB Distance-Aligned Comparison (VER vs NOR)..."
COMPARE_RESP=$(curl -s -f "$API_URL/api/v1/telemetry/compare?driver_a=VER&driver_b=NOR")
POINTS_COUNT=$(echo "$COMPARE_RESP" | grep -o '"points_count":[0-9]*' | cut -d: -f2 || echo "N/A")
echo "Comparison Points Synchronized: $POINTS_COUNT"

# 4. Virtual Tire Physics
echo -e "\n[4/4] Querying Virtual Tire Stint Metrics (VER)..."
TIRES_RESP=$(curl -s -f "$API_URL/api/v1/telemetry/tires?driver=VER")
STINT_LAPS=$(echo "$TIRES_RESP" | grep -o '"stint_laps":[0-9]*' | cut -d: -f2 || echo "N/A")
echo "Stint Laps Evaluated: $STINT_LAPS"

echo -e "\n=================================================="
echo "✅ All PitWall OS Core Endpoints Verified!"
echo "=================================================="

