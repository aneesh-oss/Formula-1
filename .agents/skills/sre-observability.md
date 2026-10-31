---
name: sre-observability
description: Site Reliability Engineering, distributed tracing, metric alerts, and telemetry pipeline health
trigger: manual_or_agentic
version: 1.0.0
---

# SRE & Observability Engineer Skill: Monitoring & Pipeline Health

This skill provides guidelines for running reliable telemetry pipelines, managing OpenTelemetry collectors, and configuring monitoring dashboards.

---

## 1. Golden Signals & Observability Invariants
1. **Latency**:
   - `FastAPIInstrumentor`: Measure p95 and p99 response times for `/api/v1/telemetry/compare`.
   - Alert threshold: p95 latency $>50\text{ms}$ on analytical endpoints.
2. **Traffic & Throughput**:
   - Track request rate per driver and session to identify high-load queries.
3. **Errors**:
   - Span status set to `StatusCode.ERROR` on ingestion or Parquet scan failures with `error.message`.
4. **Saturation**:
   - Monitor in-process DuckDB memory footprint and FastF1 disk cache size in `data/fastf1_cache`.

---

## 2. OpenTelemetry Span Lifecycle
Always use context managers to guarantee spans close cleanly even during unhandled exceptions:
```python
from app.telemetry import get_tracer

tracer = get_tracer("pitwall.sre")

with tracer.start_as_current_span("operation.name") as span:
    span.set_attribute("f1.driver", driver)
    try:
        # Perform operation
        pass
    except Exception as exc:
        span.record_exception(exc)
        span.set_status(trace.StatusCode.ERROR, str(exc))
        raise
```

