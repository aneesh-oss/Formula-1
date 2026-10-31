# PitWall OS — Engineering Journal Master Index

This journal serves as the single source of truth for architectural evolution, technical trade-offs, performance benchmarks, and reliability invariants in PitWall OS.

- **Incident & Bug Post-Mortems**: Track all resolved bugs and architectural fixes in [`BUG-FIXES.md`](./BUG-FIXES.md).

---

## Master Journal Index

| Entry ID | Date | Component | Summary | Status |
| :--- | :--- | :--- | :--- | :--- |
| [`[ENTRY-001]`](./001-project-scaffolding.md) | 2026-10-31 | Core / Architecture / SRE | Initialized project scaffolding, zero-cost telemetry architecture (DuckDB + OTel + New Relic Free Tier), Docker compose topology, and FastAPI backend skeleton. | **Completed** |
| [`[ENTRY-002]`](./002-telemetry-engine-duckdb.md) | 2026-10-31 | Lakehouse / Physics / API | FastF1 normalization, 1m uniform distance resampling, Virtual Tire thermodynamic physics, in-process DuckDB sub-5ms analytical JOINs, and OTel spans. | **Completed** |
| [`[ENTRY-003]`](./003-multi-role-engineering-skills.md) | 2026-10-31 | Governance / Skills / CI | Established 7 specialized engineering skills (System Architect, Senior Backend, Frontend/UX, SRE, DevOps, F1 Race Engineer, AI Engineer) and GitHub Actions CI. | **Completed** |
| [`[ENTRY-004]`](./004-championship-hub-nextjs-frontend.md) | 2026-10-31 | Frontend / B2B / Strategy | Built Next.js dark-mode Pit Wall dashboard, multi-season driver & constructor standings (1950–2024), SVG distance scrubbers, and AI strategy simulator. | **Completed** |
| [`[ENTRY-005]`](./005-vehicle-health-and-trackmap.md) | 2026-10-31 | Vehicle Dynamics / Timing | Vehicle dynamics HUD, 4-wheel tire grip state machine (Optimal/Degrading/Grip Lost), brake disc heat model, sector splits & track geometry. | **Completed** |
| [`[ENTRY-006]`](./006-3d-webgl-pitwall.md) | 2026-10-31 | 3D WebGL / Graphics | 3D PitWall HUD (Three.js/Fiber), 3D spline track ribbon with elevation, interactive corner HTML pins, and dynamic tire color shaders. | **Completed** |
| [`[ENTRY-007]`](./007-universal-3d-circuits-and-car.md) | 2026-10-31 | Geometry / 3D / FastF1 | Universal dynamic circuit engine (FastF1 get_circuit_info rotation, 3D spline, all turns/sectors), vertex-colored tube, and 3D car HUD. | **Completed** |
| [`[ENTRY-008]`](./008-circuit-geometry-and-hud-realism.md) | 2026-11-01 | Geometry / Telemetry / HUD | Authentic 2D circuit engine, studio 3D CAD vehicle HUD with callouts, full race lap table (71 laps), and dynamic aero deltas. | **Completed** |

---

## Journal Invariant
Refer to [`.agents/rules/engineering-journal.md`](../../.agents/rules/engineering-journal.md) for contribution guidelines, mandatory entry sections, and documentation standards.

