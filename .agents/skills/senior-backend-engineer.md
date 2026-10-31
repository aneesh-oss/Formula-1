---
name: senior-backend-engineer
description: Senior backend engineering standards, clean architecture, performance optimization, and testing protocols
trigger: manual_or_agentic
version: 1.0.0
---

# Senior Backend Engineer Skill: Code Quality & Service Architecture

This skill governs backend software engineering practices, modular layer separation, API contract design, and code review standards.

---

## 1. Codebase Layering Invariant
The backend follows strict separation of concerns:
```text
backend/app/
├── api/             # HTTP routing, parameter validation, status codes
├── services/        # Business logic, physics calculations, domain normalization
├── db/              # In-process DuckDB queries, connection management, schema mapping
├── core/            # Config, environment settings, security
└── telemetry.py     # OpenTelemetry tracing, meters, custom gauges
```

---

## 2. Senior Engineering Standards
1. **Type Safety & Pydantic v2**:
   - Every request and response model must inherit from `pydantic.BaseModel` with explicit field type annotations, descriptions, and boundary constraints (`ge`, `le`).
2. **Defensive Resource Management**:
   - Open all DuckDB queries using explicit parameter binding (`?`) to prevent SQL injection and ensure query plan caching.
3. **Zero Python Iteration Loops over High-Frequency Data**:
   - Utilize NumPy vectorization, SciPy interpolators, or DuckDB SQL for calculations over 1000+ points. Never loop row-by-row in Python.
4. **Mandatory Test Verification**:
   - Every new service feature must include a corresponding unit test under `backend/tests/` verifying mathematical invariants and edge cases.

