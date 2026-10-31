# [ENTRY-005] Vehicle Dynamics HUD, Track Geometry & Sector Timing

**Date**: 2026-10-31  
**Author**: Principal Vehicle Dynamics & Telemetry Engineer  
**Status**: Completed  
**Component**: Ingestion / Vehicle Health Engine / Sector Splits / Frontend HUD  

---

## 1. Objective & Context
Sprint 3 expands PitWall OS into dynamic vehicle telemetry, component health degradation, and micro-sector timing analysis.
Specifically, this sprint delivers:
1. **Sector Breakdown & Pit Stop Analytics**: Computing `Sector1Time`, `Sector2Time`, and `Sector3Time` across all driver laps with session-fastest (purple `#a855f7`) and personal-best (green `#22c55e`) telemetry flags.
2. **Pit Stop Monitor**: Tracking stationary pit durations (e.g. 2.38s), pit lane transit losses (~24.1s), and tire compound changes.
3. **Vehicle Health & Grip Loss Engine**: A 4-corner state machine modeling asymmetric tire wear ($0-100\%$), tire cliff grip degradation (`GRIP_LOST` status), high-speed carbon brake disc thermal spikes ($>880^\circ\text{C}$), and clutch engagement slip.
4. **Interactive SVG/Canvas Visuals**: A top-down Formula 1 chassis wireframe (`CarHealthHUD.tsx`) and sector-segmented circuit map (`TrackMap.tsx`).

---

## 2. Technical Decisions & Mathematical Models

### A. 4-Corner Asymmetric Tire Wear & Grip Loss State Machine
Monza features a predominantly clockwise layout with high-lateral right-handers (Curva Grande, Lesmo 1 & 2, Ascari entry, and the 215 km/h Curva Parabolica). Consequently:
- Left-side tires (FL, RL) experience an asymmetric load multiplier ($1.15\times$ and $1.10\times$ baseline thermal wear).
- State Machine Transitions:
  - $\text{Wear} < 40\%$: `OPTIMAL` (`#22c55e` Green) — Operating in prime adhesive grip window.
  - $40\% \le \text{Wear} \le 75\%$: `DEGRADING` (`#eab308` Yellow) — Rubber blistering/graining active; pace penalty $+0.08\text{s/lap}$.
  - $\text{Wear} > 75\%$: `GRIP_LOST` (`#ef4444` Red) — Severe traction degradation; sudden drop-off across the tire cliff.

### B. High-Speed Carbon Brake Disc Thermal Model
- Standard aerodynamic cooling on Monza's long straights maintains carbon-carbon brake discs at $\sim 400^\circ\text{C} - 450^\circ\text{C}$.
- Entering heavy braking events (where $\text{Brake} > 80\%$ and $\text{Speed} > 200\text{ km/h}$, such as Turn 1 braking from $350\text{ km/h}$ to $75\text{ km/h}$ under $5.2\text{G}$), kinetic energy dissipation spikes front disc temperatures up to $880^\circ\text{C} - 1050^\circ\text{C}$, triggering the `HEAVY_BRAKING_HEAT_SPIKE` UI alert.

### C. Track Geometry & Sector Boundaries
The circuit distance vector ($L = 5,793\text{m}$) is divided into 3 discrete sector segments:
- **Sector 1** ($0\text{m} - 1,680\text{m}$): Cyber Cyan (`#00f0ff`) — Rettifilo Chicane & Curva Grande.
- **Sector 2** ($1,680\text{m} - 4,220\text{m}$): Emerald Green (`#10b981`) — Roggia Chicane, Lesmo 1, Lesmo 2, and Serraglio straight.
- **Sector 3** ($4,220\text{m} - 5,793\text{m}$): Purple (`#a855f7`) — Variante Ascari complex and Curva Parabolica / Alboreto.

---

## 3. Files Touched
- `created`:
  - `backend/app/services/timing_service.py`: Sector breakdown, personal/session best tagging, pit stop duration calculations, and track geometry coordinates.
  - `backend/app/services/car_health.py`: 4-corner tire grip state machine, brake disc thermal load, and clutch slip tracker.
  - `backend/app/api/dashboard_router.py`: REST endpoints for `/circuits/{circuit_name}/map`, `/sessions/{session_id}/sectors`, and `/telemetry/{driver}/health`.
  - `frontend/src/components/CarHealthHUD.tsx`: Interactive SVG top-down chassis wireframe with dynamically colored tires, brake heat readouts, and clutch metrics.
  - `docs/journal/005-vehicle-health-and-trackmap.md`: This engineering record.
- `modified`:
  - `backend/app/main.py`: Mounted `dashboard_router`.
  - `frontend/src/lib/api.ts`: Added typed interfaces and client fetchers for circuit maps, session sectors, and vehicle health.
  - `frontend/src/components/TrackMap.tsx`: Upgraded with 3-segment color-coded sectors, split lines, and fastest sector summaries.
  - `frontend/src/app/page.tsx`: Integrated `CarHealthHUD` and live sector split monitor table.
  - `docs/journal/README.md`: Appended `[ENTRY-005]` to Master Index.

---

## 4. OpenTelemetry & Verification
- `timing.sectors`: Custom span tracking sector split aggregation.
- `timing.track_map`: Custom span for geometry normalization.
- `car.health`: Custom span capturing instantaneous 4-corner pressures and wear percentages.
- Verified all endpoints with `curl` returning HTTP 200 and Next.js compiling all 576 modules without errors.

