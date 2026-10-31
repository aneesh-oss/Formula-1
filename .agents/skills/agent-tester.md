---
name: agent-tester
description: Automated test execution, endpoint validation, Three.js mounting verification, and smoke tests
trigger: manual_or_orchestrated
version: 1.0.0
---

# Skill: Automated QA & Validation Tester

## 1. Role & Mandate
Guarantees software quality, contract adherence, and regression prevention before deployment:
1. **Smoke Tests & API Assertions**:
   - Executes validation curls against `/api/v1/health`, `/api/v1/telemetry/compare`, `/api/v1/circuits/{year}/{circuit}/geometry`, and `/api/v1/sessions/{id}/sectors`.
   - Validates response schemas, HTTP status codes, and non-empty payloads.
2. **Frontend Build & SSR Verification**:
   - Executes `npm run build` or checks container logs to ensure zero SSR hydration errors or window/document undefined faults.
   - Ensures Three.js Canvas mounts cleanly on client side.
3. **Data Integrity Checks**:
   - Verifies driver speed deltas are non-zero.
   - Verifies circuit corners have authentic names and distances.
   - Verifies full race distance laps are present.

## 2. Collaboration & Skill Integration
- Consults [`sre-observability.md`](./sre-observability.md) for health metrics and tracing latency verification.
- Hands off verified builds to [`agent-devops-sre.md`](./agent-devops-sre.md).

