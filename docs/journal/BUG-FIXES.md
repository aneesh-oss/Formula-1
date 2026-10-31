# PitWall OS — Bug Fixes & Post-Mortem Incident Log

This document tracks every bug, unexpected behavior, root-cause analysis (RCA), and architectural remediation encountered during the development of PitWall OS.

---

## Master Incident & Bug Index

| Incident ID | Date | Component | Severity | Title & Symptom | Resolution Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [`[BUG-001]`](#bug-001-missing-pyarrow-dependency-on-parquet-lakehouse-export) | 2026-10-31 | Lakehouse / Pandas | Medium | `ImportError: Missing optional dependency 'pyarrow'` during session ingestion | **Resolved** |
| [`[BUG-002]`](#bug-002-container-code-stale-cache-missing-uvicorn---reload) | 2026-10-31 | Docker / FastAPI | Low | Code changes in mounted `./backend/app` not reflecting without manual restart | **Resolved** |
| [`[BUG-003]`](#bug-003-opentelemetry-collector-401-unauthenticated-to-new-relic) | 2026-10-31 | SRE / OTel Collector | Low | OTel Collector logging `HTTP Status Code 401` dropping upstream export batches | **Resolved** |
| [`[BUG-004]`](#bug-004-fastf1-f1-account-credential-warning-on-cold-start) | 2026-10-31 | Ingestion / FastF1 | Informational | FastF1 logs `Failed to authenticate with Formula 1 account...` on raw session load | **Documented & Expected** |

---

## Detailed Post-Mortem Entries

### [BUG-001]: Missing PyArrow Dependency on Parquet Lakehouse Export
* **Date**: 2026-10-31
* **Component**: `backend/app/services/telemetry.py`
* **Symptom**: `POST /api/v1/sessions/ingest` returned `500 Internal Server Error` with traceback:
  ```text
  ImportError: Missing optional dependency 'pyarrow'. pyarrow is required for parquet support.
  ```
* **Root Cause Analysis (RCA)**:
  Pandas' `DataFrame.to_parquet(..., engine="pyarrow")` requires `pyarrow` to be installed. While `duckdb` was installed in the container, `pyarrow` was not explicitly listed in `backend/requirements.txt`.
* **Resolution**:
  1. Replaced the Pandas export with **DuckDB's native C++ Parquet engine**:
     ```python
     duckdb.execute("COPY (SELECT * FROM combined_df) TO ? (FORMAT PARQUET)", [parquet_filepath])
     ```
     This executes in-process directly in C++, eliminates the Python/Pandas serialization overhead, and requires zero extra packages.
  2. Added `pyarrow>=14.0.0` to `backend/requirements.txt` to safeguard any auxiliary Pandas workflows.
* **Verification**: Verified via `smoke_test.sh` step `[2/4]`: generated `VER.parquet` ($231\text{ KB}$) and `NOR.parquet` ($229\text{ KB}$).

---

### [BUG-002]: Container Code Stale Cache (Missing Uvicorn `--reload`)
* **Date**: 2026-10-31
* **Component**: `backend/Dockerfile` & `docker-compose.yml`
* **Symptom**: Edits made to `backend/app/services/telemetry.py` on the host machine were not picked up by the running FastAPI process despite having a volume mount `./backend/app:/app/app`.
* **Root Cause Analysis (RCA)**:
  `uvicorn` was launched without the `--reload` development flag (`uvicorn app.main:app --host 0.0.0.0 --port 8000`), so Python only evaluated modules at initial container boot time.
* **Resolution**:
  1. Updated `backend/Dockerfile` CMD:
     ```dockerfile
     CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
     ```
  2. Added explicit command override in `docker-compose.yml` for development hot-reloading.
* **Verification**: Verified that code modifications now hot-reload in under 500ms without restarting the container.

---

### [BUG-003]: OpenTelemetry Collector 401 Unauthenticated to New Relic
* **Date**: 2026-10-31
* **Component**: `otel/otel-collector-config.yaml`
* **Symptom**: OTel collector container printed recurring error:
  ```text
  Exporting failed. Dropping data ... request to https://otlp.nr-data.net:4318/v1/metrics responded with HTTP Status Code 401
  ```
* **Root Cause Analysis (RCA)**:
  The `NEW_RELIC_LICENSE_KEY` environment variable in `.env` was either unpopulated or using the example placeholder value.
* **Resolution & Resilience**:
  1. Confirmed that the OpenTelemetry Collector's `disabled_batcher` / queue sender gracefully drops unauthenticated egress frames without terminating the collector or affecting backend latency.
  2. Documented the setup protocol in `.env.example` and `001-project-scaffolding.md`. Once the user pastes their free New Relic ingestion key, export succeeds immediately with zero config changes.

---

### [BUG-004]: FastF1 F1 Account Credential Warning on Cold Start
* **Date**: 2026-10-31
* **Component**: `fastf1` Ingestion Pipeline
* **Symptom**: FastF1 logged:
  ```text
  Failed to authenticate with Formula 1 account, continuing without authentication: No F1 account credentials available.
  Falling back to https://livetiming-mirror.fastf1.dev/...
  ```
* **Root Cause Analysis (RCA)**:
  FastF1 defaults to probing the live official `formula1.com` API first. If no `F1_USERNAME` or `F1_PASSWORD` is supplied, it issues a warning and redirects to the free open mirror `https://livetiming-mirror.fastf1.dev`.
* **Resolution**:
  This is standard and expected behavior for non-commercial FastF1 usage. Documented in the architecture journal that no paid subscription (F1 TV or FanCode) is required, and all data is cached locally into `fastf1_http_cache.sqlite` to prevent redundant network lookups.

---

### [BUG-005]: Unscoped `lib/` in Root `.gitignore` Shadowing `frontend/src/lib/`
* **Date**: 2026-10-31
* **Component**: Root Repository `.gitignore` / Frontend Source Code
* **Symptom**: `git status` showed `frontend/src/lib/` as clean or ignored even after adding new exports and types (`fetchCircuitGeometry`, `CornerGeometry`, `CircuitGeometryResponse`).
* **Root Cause Analysis (RCA)**:
  Line 26 of `.gitignore` contained an un-anchored `lib/` rule intended for Python virtual environment libraries (`venv/lib/`), which caused Git to globally ignore any directory named `lib`, including `frontend/src/lib/`.
* **Resolution**:
  Modified `.gitignore` to anchor `/lib/` and `/lib64/` to root, and added an explicit negation `!frontend/src/lib/` to guarantee that all frontend client libraries and API definitions are tracked in version control.
* **Verification**:
  `git check-ignore -v frontend/src/lib/api.ts` confirmed the file is un-ignored, and `git status` properly tracks all API client updates.


