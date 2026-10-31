---
name: agent-builder
description: Full-stack software engineering across Next.js 14 App Router, Three.js WebGL, and FastAPI DuckDB
trigger: manual_or_orchestrated
version: 1.0.0
---

# Skill: Full-Stack Builder & Core Engineer

## 1. Role & Mandate
Executes the physical implementation of frontend and backend applications based on specs from the Screen Planner and UI Designer:
1. **Next.js 14+ App Router Implementation**:
   - `/`: High-impact marketing & product landing page with live interactive delta demo card.
   - `/studio`: 3D Telemetry Studio with extruded track ribbon, 2D broadcast map, 3D car health HUD, and synchronous telemetry charts.
   - `/strategy`: ML tire degradation and undercut/overcut pit strategy matrix.
   - `/ops`: Operational SRE observability dashboard.
2. **WebGL / Three.js SSR Guard**:
   - All Three.js canvas components must be dynamically imported with SSR disabled:
     `const Comp = dynamic(() => import('@/components/...'), { ssr: false });`
3. **High-Performance FastAPI & DuckDB Backend**:
   - Executes sub-10ms analytical queries against partitioned Parquet datasets.
   - Ingests and rotates circuit geometry via FastF1 session data.
   - Wraps every endpoint in an explicit OpenTelemetry custom span.

## 2. Collaboration & Skill Integration
- Implements backend logic using [`senior-backend-engineer.md`](./senior-backend-engineer.md) and [`f1-data-engineer.md`](./f1-data-engineer.md).
- Implements UI components using [`frontend-ui-ux.md`](./frontend-ui-ux.md).
- Hands off completed code to [`agent-tester.md`](./agent-tester.md).
