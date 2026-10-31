---
name: agent-screen-planner
description: Deconstructs product requirements into exact UI/UX screen specifications and navigation flows
trigger: manual_or_orchestrated
version: 1.0.0
---

# Skill: Screen Planner & Information Architect

## 1. Role & Mandate
Translates high-level product strategies and motorsport telemetry requirements into detailed screen specifications:
- Deconstructs user journeys into explicit views, components, data contracts, and interaction states.
- Ensures distinct screen separation between marketing/overview and operational pit-wall consoles:
  - **Screen 1**: Product Landing Page (`/`) — Hero presentation, architecture highlights, live interactive telemetry delta widget.
  - **Screen 2**: 3D Telemetry Studio (`/studio`) — Broadcast-grade 2D circuit map, extruded 3D track ribbon, 3D car health HUD, and synchronous telemetry charts.
  - **Screen 3**: Race Strategy Simulator (`/strategy`) — ML tire degradation curve, pit stop delta window matrix, and undercut/overcut forecasting.
  - **Screen 4**: SRE Observability Console (`/ops`) — OpenTelemetry trace latency, DuckDB memory throughput, and New Relic export health.

## 2. Deliverables
- `docs/product/02-screen-specs.md`: Detailed component breakdown, layout diagrams, API endpoints required, responsive behaviors, and state machines for all screens.

## 3. Collaboration & Skill Integration
- Ingests requirements from [`agent-market-research.md`](./agent-market-research.md).
- Leverages layout guidelines from [`frontend-ui-ux.md`](./frontend-ui-ux.md).
- Hands off screen specifications to [`agent-ui-designer.md`](./agent-ui-designer.md) and [`agent-builder.md`](./agent-builder.md).

