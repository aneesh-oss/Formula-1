---
name: platform-devops-engineer
description: Platform engineering, Docker orchestration, and GitHub Actions CI/CD automation
trigger: manual_or_agentic
version: 1.0.0
---

# Platform & DevOps Engineer Skill: Infrastructure & CI/CD Automation

This skill governs containerization, GitHub Actions workflows, environment reproducibility, and automated testing pipelines.

---

## 1. Containerization & Volume Invariants
- Services run containerized via `docker-compose.yml`:
  - `pitwall-otel-collector`: Collects metrics/traces on 4317/4318.
  - `pitwall-backend`: Runs FastAPI on port 8000 with mounted `./data` volume.
- Persistent volumes must isolate caches (`data/fastf1_cache`) and analytical partitions (`data/lakehouse`) from ephemeral container layers.

---

## 2. GitHub Actions CI/CD Standard Pipeline
Every pull request and merge to `main` must pass automated CI checks:
1. **Lint & Static Analysis**: Syntax validation (`py_compile` / `ruff`).
2. **Automated Unit Tests**: Execution of `backend/tests/` suites.
3. **Docker Build Verification**: Multi-stage build check of `backend/Dockerfile`.

