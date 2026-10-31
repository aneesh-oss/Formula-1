---
name: system-architect
description: System design, request flow patterns, service contracts, and architectural invariants for PitWall OS
trigger: manual_or_agentic
version: 1.0.0
---

# System Architect Skill: Request Flows & System Topology

This skill guides the high-level architecture, service contracts, and latency budgets across the PitWall OS ecosystem.

---

## 1. End-to-End Request Flow Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as Race Strategist / User
    participant Web as Next.js Frontend (:3000)
    participant API as FastAPI Backend (:8000)
    participant Duck as In-Process DuckDB
    participant Cache as Parquet Lakehouse & Cache
    participant OTel as OTel Collector (:4318)
    participant NR as New Relic APM

    User->>Web: Request Corner Telemetry (VER vs NOR)
    Web->>API: GET /api/v1/telemetry/compare?driver_a=VER&driver_b=NOR
    Note over API: Start OTel span "duckdb.query"
    API->>OTel: Emit Trace context + active Gauges
    API->>Duck: Execute distance-aligned Parquet scan
    Duck->>Cache: Read partition: data/lakehouse/2024/monza/R/*.parquet
    Cache-->>Duck: Zero-copy columnar records
    Duck-->>API: Aligned delta vectors (speed, throttle, brake, delta time)
    Note over API: End span (latency ~4.2ms)
    API-->>Web: 200 OK (JSON payload)
    Web-->>User: Render interactive speed delta & circuit overlay
    OTel->>NR: Export batch over OTLP/HTTP
```

---

## 2. Architectural Invariants
1. **Decoupled Responsibilities**:
   - Web tier handles rendering, interaction, and state management.
   - Backend tier handles data normalization, ingestion, and analytical computation.
   - DuckDB handles all OLAP joins; never perform multi-row data processing inside Python loops.
2. **Sub-10ms Analytical Latency Budget**:
   - All telemetry queries must execute directly against partitioned Parquet files with zero external network overhead during active sessions.
3. **Graceful Degradation**:
   - Every service must function offline with synthetic or cached datasets if external F1 APIs or telemetry sinks are unreachable.

