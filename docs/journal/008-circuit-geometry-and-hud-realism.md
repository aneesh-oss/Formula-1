# [ENTRY-008] Authentic 2D Circuit Engine, Studio 3D CAD Vehicle HUD & Dynamic Telemetry Deltas

**Date**: 2026-11-01  
**Author**: Antigravity Pair Programmer  
**Status**: Completed  
**Component**: Frontend | Backend | Geometry | Vehicle Dynamics  

---

## 1. Objective & Context
Following user telemetry testing and verification feedback, several key visual and mathematical issues were reported:
1. **Front-row Strategy Metrics Static**: Top Speed Delta was displaying `+0 km/h` with identical speeds (`350 vs 350 km/h`), and apex speeds lacked driver-specific aerodynamics.
2. **Circuit Map Distortion in 3D & Inaccurate Austrian GP**: The 3D tube geometry perspective distorted track readability, and the Austria (Red Bull Ring) shape did not match the official FIA layout. User requested prioritizing authentic **2D broadcast-grade circuit maps**.
3. **Truncated Laps in Sector Widget**: The sector timings table was artificially limited to only 7 laps instead of full race distances (e.g. 71 laps for Austria, 53 for Monza).
4. **3D Car HUD Invisibility & Missing Studio CAD Asset**: The 3D GLTF model appeared pitch-black against dark canvas backgrounds, floating HTML badges were clustered, and no high-definition CAD vehicle reference was provided.

---

## 2. Technical Decisions & Root Cause Analysis (RCA)

### Issue A: Telemetry Hard-Cap & Delta Zeroing
* **RCA**: In `backend/app/services/telemetry.py`, `_generate_synthetic_lap_telemetry` clipped all speeds with `np.clip(speed * driver_bias, 75.0, 350.0)`. Because both cars hit the exact 350.0 ceiling, `maxSpeedA - maxSpeedB = 0`.
* **Fix**: Implemented authentic Grand Prix aero/PU speed envelopes (Monza ~352 km/h, Spielberg ~324.5 km/h, Monaco ~292 km/h) and driver-specific aero setups (VER straight-line low drag vs NOR high-downforce apex grip).

### Issue B: Authentic 2D Circuit Engine & Real Austria Layout
* **RCA**: Hardcoded synthetic trig functions (`sin`/`cos`) generated generic loops.
* **Fix**: Rebuilt `frontend/src/components/TrackMap.tsx` with authentic 2D SVG paths, exact corner annotations (T1 Niki Lauda, T3 Remus uphill hairpin, T4 Rauch, T7 Rindt), checkered start/finish lines, and synchronized car beacons. Made 2D the default view.

### Issue C: Full Race Distance Ingestion
* **RCA**: `timing_service.py` only looped `1..15`, and `page.tsx` called `.slice(0, 7)`.
* **Fix**: Configured genuine race lap totals per GP (71 laps for Austria, 53 for Monza) and wrapped the table in a scrollable container with sticky headers.

### Issue D: High-Resolution 3D Studio CAD HUD
* **RCA**: In `f1_car.glb`, base color factors were `[0.05, 0.05, 0.05]` (95% black), making the car invisible against the dark background.
* **Fix**: Integrated the user's high-definition 3D studio CAD render (`frontend/public/images/f1_car_studio.jpg`) with precision callout badges pointing to all 4 wheels, front wing downforce, and halo structure. Enhanced 3D WebGL mode with studio lighting and carbon tint.

---

## 3. Files Touched
- `backend/app/services/telemetry.py`: Circuit-specific top speed and driver aero profiles.
- `backend/app/services/circuit_service.py`: Exact 2D/3D waypoints for Red Bull Ring (Austria) and all 8 GPs.
- `backend/app/services/timing_service.py`: Full race distance laps (71 laps for Spielberg, 53 for Monza).
- `frontend/src/app/page.tsx`: 2D default view mode, full lap scrollable table, dynamic strategy deltas.
- `frontend/src/components/TrackMap.tsx`: Authentic 2D broadcast track map with corner badges and sectors.
- `frontend/src/components/3d/CarHealth3D.tsx`: Studio CAD view with telemetry callouts, enhanced WebGL lighting.
- `frontend/public/images/f1_car_studio.jpg`: High-res studio CAD asset.

---

## 4. Verification
- `curl /api/v1/circuits/2024/spielberg/geometry` -> Returns 8 authentic corners (Remus, Rauch, Rindt) with 4318m track length.
- `curl /api/v1/sessions/2024_spielberg_R/sectors?driver=VER` -> Returns all 71 laps with tire degradation and pit stops.
- `curl /api/v1/telemetry/compare` -> Verified non-zero Top Speed Delta (+3.6 km/h) and apex speed advantage.
- Frontend compiled with zero errors across 1980 modules.

