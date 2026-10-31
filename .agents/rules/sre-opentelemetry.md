---
name: sre-opentelemetry
description: OpenTelemetry instrumentation standards, span conventions, and metric definitions for PitWall OS
trigger: always_active
version: 1.0.0
---

# Site Reliability Engineering & OpenTelemetry Standards

## 1. Instrumentation Topology
All PitWall OS services export telemetry using the OpenTelemetry (OTel) standard via OTLP/HTTP to the local collector daemon:
- **Collector Endpoint**: `http://otel-collector:4318`
- **Collector Protocol**: OTLP over HTTP (`/v1/traces`, `/v1/metrics`, `/v1/logs`)
- **Backend Service Name**: `pitwall-backend`
- **Resource Attributes**:
  - `service.name`: `pitwall-backend`
  - `service.namespace`: `pitwall-os`
  - `service.version`: `0.1.0`
  - `deployment.environment`: `production` (or `development`)

---

## 2. FastAPI Request Tracing
- All incoming HTTP requests to the FastAPI application must be automatically instrumented using `FastAPIInstrumentor`:
  ```python
  from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

  FastAPIInstrumentor.instrument_app(app)
  ```
- Exclude `/health` or `/metrics` polling endpoints from noisy trace captures if necessary or annotate them with low-priority sampling.

---

## 3. Custom Spans & Semantic Conventions
Developers and agents must wrap all analytical, computational, and ingestion operations in explicit spans using the active tracer (`opentelemetry.trace.get_tracer("pitwall.engine")`).

### Required Span Categories & Attributes:
1. **DuckDB Query Execution**:
   - Span Name: `duckdb.query`
   - Attributes:
     - `db.system`: `"duckdb"`
     - `db.operation`: `"SELECT"` / `"COPY"`
     - `db.statement`: SQL text (sanitized)
     - `f1.circuit`: Circuit identifier (e.g., `"silverstone"`)
     - `f1.year`: Championship year (e.g., `2024`)

2. **FastF1 Telemetry Ingestion & Caching**:
   - Span Name: `fastf1.load_session`
   - Attributes:
     - `f1.year`: Year
     - `f1.circuit`: Circuit name
     - `f1.session`: Session code (`FP1`, `FP2`, `FP3`, `Q`, `SQ`, `R`)
     - `fastf1.cache_hit`: `true` | `false`

3. **Physics & Machine Learning Computations (Tire Model)**:
   - Span Name: `physics.tire_model`
   - Attributes:
     - `f1.driver`: Driver three-letter code (e.g., `"VER"`, `"NOR"`, `"HAM"`)
     - `f1.lap_number`: Integer lap index
     - `f1.compound`: Tire compound (`SOFT`, `MEDIUM`, `HARD`, `INTERMEDIATE`, `WET`)

---

## 4. Custom Metrics & Gauges
The backend exposes OpenTelemetry metrics to gauge telemetry states across stints:

| Metric Name | Instrument | Unit | Description | Attributes |
| :--- | :--- | :--- | :--- | :--- |
| `f1.tire.pressure_psi` | Gauge / Asynchronous Gauge | `psi` | Real-time / modeled tire internal pressure | `driver`, `tire_corner` (`FL`, `FR`, `RL`, `RR`), `compound` |
| `f1.tire.wear_pct` | Gauge / Asynchronous Gauge | `%` | Percentage tire degradation / wear status | `driver`, `tire_corner`, `stint`, `compound` |
| `f1.lap.time_seconds` | Histogram | `s` | Lap duration across drivers | `driver`, `lap_number`, `compound`, `is_valid` |

---

## 5. Exporter Verification
Verify traces in the OpenTelemetry Collector logs and the upstream New Relic dashboard:
```bash
# Verify collector is accepting OTLP data
curl -v http://localhost:4318/v1/traces -H "Content-Type: application/json" -d '{}'
```

