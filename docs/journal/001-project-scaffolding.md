# [ENTRY-001] Project Scaffolding & Zero-Cost Telemetry Architecture

**Date**: 2026-10-31  
**Author**: Principal Systems & Data Engineer  
**Status**: Completed  
**Component**: Core Architecture / Infrastructure / SRE  

---

## 1. Objective & Context
Formula 1 telemetry analysis requires handling high-frequency time-series datasets (10Hz telemetry, GPS vectors, and sector split timings) across 20+ Grand Prix weekends annually. Traditional architectures often incur substantial cloud infrastructure costs (managed time-series databases, Kubernetes clusters, and commercial APM monitoring suites).

The objective of **PitWall OS** is to engineer an enterprise-grade Formula 1 AI Telemetry & Observability Hub built on an uncompromising **Zero-Cost Architecture**:
1. **Local Analytical Lakehouse**: Embedding in-process DuckDB querying partitioned Apache Parquet data files on disk instead of paying for always-on cloud data warehouses.
2. **Open Standards Observability**: Embedding the OpenTelemetry (OTel) Collector to receive distributed traces, metrics, and logs locally.
3. **Telemetry Egress**: Forwarding telemetry to New Relic's generous Free Tier (100 GB/month data ingest at zero cost) via OTLP/HTTP.
4. **FastF1 Ingestion Cache**: Enforcing zero redundant external API calls through mandatory disk caching.

---

## 2. Technical Decisions & Trade-Offs

### A. In-Process DuckDB + Parquet vs. Dedicated Database (Postgres/TimescaleDB)
- **Trade-Off**: A client-server relational database requires background daemons, connection pooling, schema migrations, and persistent RAM consumption even when idle.
- **Decision**: In-process DuckDB executing vectorized queries directly over partitioned Parquet files (`data/lakehouse/{year}/{circuit}/{session}/`).
- **Benefits**: Near-zero operational overhead, sub-millisecond analytical aggregations, portable lakehouse partitions, and zero licensing/hosting costs.

### B. OpenTelemetry Collector + New Relic Free Tier vs. Proprietary SDKs
- **Trade-Off**: Direct vendor SDK integration tightly couples the codebase to a proprietary APM provider.
- **Decision**: All application telemetry (FastAPI requests, custom computation spans, and tire pressure gauges) is instrumented with standard vendor-neutral OpenTelemetry SDKs and pushed to an `otel-collector` container on port 4318.
- **Benefits**: The collector batches and routes data to New Relic (`https://otlp.nr-data.net:4318`) using a single `${NEW_RELIC_LICENSE_KEY}`. The target backend can be swapped to Prometheus/Grafana or Jaeger with zero application code changes.

### C. Docker Compose Topology
- Containerized services:
  - `otel-collector`: `otel/opentelemetry-collector-contrib:latest` (ports 4317 gRPC, 4318 HTTP).
  - `backend`: FastAPI Python application with shared volumes for `./data` (caching and lakehouse persistence).

---

## 3. Files Touched
- `created`:
  - `.agents/rules/architecture.md`: Architectural invariants, port mapping, and lakehouse storage rules.
  - `.agents/rules/sre-opentelemetry.md`: Observability conventions, custom spans, and OTel gauge standards.
  - `.agents/rules/engineering-journal.md`: Mandatory engineering journal documentation invariant.
  - `.agents/skills/f1-data-engineer.md`: FastF1 loading, 1m distance resampling, and physics tire model equations.
  - `docs/journal/README.md`: Master index of all architectural journal entries.
  - `docs/journal/001-project-scaffolding.md`: This initial engineering record.
  - `otel/otel-collector-config.yaml`: OpenTelemetry Collector pipeline definition.
  - `docker-compose.yml`: Multi-container topology for collector and backend.
  - `.env.example`: Configuration template for API keys and environment variables.
  - `.gitignore`: Ignoring local caches, data lake artifacts, Python environments, and `.env`.
  - `backend/requirements.txt`: Python dependencies (FastAPI, FastF1, DuckDB, NumPy, SciPy, OTel SDK).
  - `backend/Dockerfile`: Production-ready container definition.
  - `backend/app/__init__.py`: Package initialization.
  - `backend/app/telemetry.py`: Centralized OpenTelemetry tracer, meter, and gauges setup.
  - `backend/app/main.py`: FastAPI server with OTel middleware, `/health`, and `/api/v1/session/sync` stub.

---

## 4. OpenTelemetry & Verification
- **Spans Defined**:
  - `FastAPIInstrumentor`: Automatic HTTP spans on all inbound endpoints.
  - `session.sync`: Custom span wrapping session validation and synchronization logic with attributes:
    - `f1.year`
    - `f1.circuit`
    - `f1.session`
- **Gauges Defined**:
  - `f1.tire.pressure_psi` (Unit: `psi`): Real-time/modeled tire pressure per corner (`FL`, `FR`, `RL`, `RR`).
  - `f1.tire.wear_pct` (Unit: `%`): Modeled tire wear status across stints.
- **Verification**:
  - Validated Python syntax across all modules with `python3 -m py_compile`.
  - Checked dependency declarations and OTLP collector configuration schemas.

---

## 5. Next Steps
1. Implement the FastF1 session synchronization worker to populate Parquet files in `data/lakehouse/`.
2. Construct the distance-based interpolation engine with 1m spatial resolution.
3. Wire the Virtual Tire Model physics pipeline to calculate dynamic lateral load pressures ($a_{\text{lat}} = v^2/R$) and emit live OTel gauges.

