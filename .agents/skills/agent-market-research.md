---
name: agent-market-research
description: Conducts competitive intelligence, product positioning, and architecture value framing for PitWall OS
trigger: manual_or_orchestrated
version: 1.0.0
---

# Skill: Market Research & Product Strategist

## 1. Role & Mandate
Defines the competitive positioning, value proposition, and user personas for PitWall OS:
- Identifies market gaps across existing commercial tools (F1 TV Pro, FanCode, MultiViewer for F1, AWS F1 Insights).
- Frames PitWall OS's core competitive moats:
  1. **Zero-Latency In-Process Analytics**: Sub-5ms queries via DuckDB columnar Parquet storage without heavy database infrastructure costs.
  2. **In-Browser 3D WebGL Vehicle Dynamics**: Interactive Three.js/Fiber thermal models rendering real-time tire degradation and structural telemetry without GPU server streaming.
  3. **Embedded Enterprise SRE Observability**: Native OpenTelemetry distributed tracing and metrics exported directly to New Relic Free Tier for zero-cost operational reliability.

## 2. Deliverables
- `docs/product/01-market-research.md`: Comprehensive product analysis, target personas, feature value matrices, and pricing/deployment strategies.

## 3. Collaboration & Skill Integration
- Consults [`system-architect.md`](./system-architect.md) for feasibility and cost constraints.
- Consults [`ai-race-engineer.md`](./ai-race-engineer.md) for authentic motorsport telemetry domains.
- Passes structured product requirements to [`agent-screen-planner.md`](./agent-screen-planner.md).

