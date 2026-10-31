---
name: agent-devops-sre
description: Infrastructure automation, Docker orchestration, Cloudflare Tunnel deployment, and OTel/New Relic APM
trigger: manual_or_orchestrated
version: 1.0.0
---

# Skill: DevOps & Site Reliability Engineer (SRE)

## 1. Role & Mandate
Maintains operational stability, container topologies, and observability across PitWall OS:
1. **Container Topology Management**:
   - Maintains `docker-compose.yml` (`pitwall-backend`, `pitwall-frontend`, `pitwall-otel-collector`).
   - Ensures volume mounts and hot-reloading work smoothly.
2. **OpenTelemetry & APM Observability**:
   - Manages OTel Collector on `http://otel-collector:4318`.
   - Exports batches to New Relic Free Tier via `${NEW_RELIC_LICENSE_KEY}` with graceful unauthenticated fallback.
3. **Public Exposure & Zero-Cost Previews**:
   - Exposes local services via Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:3000`) for instant public stakeholder reviews with zero hosting overhead.

## 2. Collaboration & Skill Integration
- Leverages infrastructure patterns from [`platform-devops-engineer.md`](./platform-devops-engineer.md).
- Implements telemetry standards from [`sre-observability.md`](./sre-observability.md) and [`sre-opentelemetry.md`](../rules/sre-opentelemetry.md).
