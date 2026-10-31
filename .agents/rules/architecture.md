---
name: architecture-invariants
description: Architectural standards and data storage invariants for PitWall OS
trigger: always_active
version: 1.0.0
---

# Architecture Invariants & System Layout

## 1. System Topology & Port Allocations
PitWall OS is engineered as an event-driven, decoupled telemetry and analytics system:

| Service | Technology | Port | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Backend API** | FastAPI / Python 3.11+ | `8000` | Ingestion, session sync, DuckDB query execution, ML tire modeling, OTel instrumentation |
| **Telemetry Collector** | OpenTelemetry Collector Contrib | `4317` (gRPC), `4318` (HTTP) | Central trace/metric/log aggregation, batching, forwarding to New Relic |
| **Analytical Lakehouse** | In-process DuckDB + Apache Parquet | Local I/O | High-throughput columnar queries over partitioned race sessions |
| **Frontend Dashboard** | Next.js / React / TailwindCSS | `3000` | Real-time race engineer dashboard, driver telemetry deltas, interactive circuit maps |

---

## 2. Telemetry Storage & Lakehouse Invariants

### Invariant 1: Zero Redundant External Ingestion
- **Strict Prohibition**: Never query the live FastF1/Ergast/OpenF1 remote endpoints repeatedly during operational queries or analysis.
- **FastF1 Cache**: All raw session downloads must be cached locally in `data/fastf1_cache/` using FastF1's built-in disk cache (`fastf1.Cache.enable_cache('data/fastf1_cache')`).

### Invariant 2: Normalized Partitioned Lakehouse Format
- Raw sessions must be cleaned, resampled, and written to persistent partitioned Apache Parquet files in the lakehouse directory:
  ```text
  data/lakehouse/{year}/{circuit}/{session}/
  ├── session_metadata.parquet
  ├── laps.parquet
  ├── telemetry.parquet
  └── weather.parquet
  ```
- Partition columns must be strictly enforced: `{year}` (integer), `{circuit}` (slugified string, e.g. `monza`, `silverstone`), and `{session}` (e.g. `FP1`, `Q`, `R`).

---

## 3. Query Engine: In-Process DuckDB
- **Execution Model**: DuckDB must be initialized in-process within the FastAPI backend (or worker processes).
- **Parquet Scan Primitives**: Use direct DuckDB zero-copy Parquet scans:
  ```python
  import duckdb

  con = duckdb.connect(database=":memory:")
  df = con.execute("""
      SELECT driver, lap_number, lap_time, compound, tyre_life
      FROM read_parquet('data/lakehouse/*/*/*/*.parquet')
      WHERE year = 2024 AND circuit = 'monza' AND session = 'R'
      ORDER BY lap_number ASC
  """).df()
  ```
- No separate standalone relational database daemon (e.g. PostgreSQL/MySQL) is permitted for analytical queries, preserving zero maintenance overhead and sub-millisecond analytical latency.

