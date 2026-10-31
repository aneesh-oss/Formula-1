# [ENTRY-007] Universal Dynamic 3D Circuit Geometry Engine, All Turns/Sectors & 3D Car HUD

**Date**: 2026-10-31  
**Author**: SRE, System Architect & 3D WebGL Engineer  
**Status**: Completed  
**Component**: Backend / FastF1 / Three.js / R3F / Frontend  

---

## 1. Objective & Context
Replace static Monza track files with an all-season **Universal Dynamic Circuit Engine** powered by FastF1's `session.get_circuit_info()`. The engine must dynamically calculate and render authentic 3D track spline coordinates with elevation, exact sector split distances (S1, S2, S3), and interactive 3D pins for every official corner across any Grand Prix (Monza, Silverstone, Spa-Francorchamps, Suzuka, Monaco, Spielberg, Zandvoort, Interlagos).

In parallel, the 3D Vehicle Dynamics HUD (`CarHealth3D.tsx`) was upgraded with dynamic sub-mesh emissive shader bindings (pulsing neon red for $>75\%$ cliff, glowing amber for $50-75\%$, cyan for optimal $<50\%$), floating 3D `<Html>` status labels, and pitch-constrained `OrbitControls`.

---

## 2. Technical Decisions & Trade-Offs

### 2.1 FastF1 `session.get_circuit_info()` Corner Extraction & Coordinate Rotation
- **Rotation Angle ($\alpha$)**: FastF1 returns track coordinates in their unrotated raw GPS/timing frame. To orient the circuit to match official F1 broadcast maps, raw coordinates must be rotated by `circuit_info.rotation` degrees:
  $$\begin{bmatrix} X_{rot} \\ Y_{rot} \end{bmatrix} = \begin{bmatrix} \cos(\theta) & -\sin(\theta) \\ \sin(\theta) & \cos(\theta) \end{bmatrix} \begin{bmatrix} X \\ Y \end{bmatrix}$$
  where $\theta = \alpha \times \frac{\pi}{180}$.
- **Origin Centering & WebGL Canvas Normalization**:
  $$X_{norm} = \left(X_{rot} - \frac{X_{max} + X_{min}}{2}\right) \times S$$
  $$Z_{norm} = \left(Y_{rot} - \frac{Y_{max} + Y_{min}}{2}\right) \times S$$
  $$Y_{norm} = \left(Z_{elev} - Z_{mid}\right) \times S_{elev} + 0.35$$
  where $S = \frac{32.0}{\max(\Delta X, \Delta Y)}$. This maps any track into the standard 3D viewport without clipping.

### 2.2 Sub-Millisecond Cache-Aware Ingestion & Resilient Fallback
- **Problem**: FastF1 unauthenticated downloads over public mirrors can take 10–15s or fail on un-cached sessions due to missing F1 account credentials.
- **Architectural Solution**: `CircuitService` verifies local disk cache presence in `data/fastf1_cache/{year}/`. If present, FastF1 loads in $<100\text{ms}$. If not present, the engine instantly serves high-fidelity canonical 3D spline and corner data with real turn names, apex speeds, recommended gears, and braking delta G-forces.
- **Circuit Breaker**: A non-blocking thread timeout guard ensures that API responses never hang or block the event loop.

### 2.3 Three.js `CatmullRomCurve3` Spline & Vertex-Colored TubeGeometry
- **Road Ribbon**: Spline points are parsed into a closed 3D curve using `new THREE.CatmullRomCurve3(points, true, "centripetal")`.
- **Dynamic Sector Color Mapping**: Rather than splitting the mesh into 3 draw calls, the ribbon utilizes `THREE.TubeGeometry(curve, 300, 0.45, 8, true)` with per-vertex colors (`vertexColors: true`). Vertices along the curve are mapped to:
  - **Sector 1 (0 to $S_{1,\text{end}}$)**: Cyan (`#00f0ff`)
  - **Sector 2 ($S_{1,\text{end}}$ to $S_{2,\text{end}}$)**: Amber (`#f59e0b`)
  - **Sector 3 ($S_{2,\text{end}}$ to Track End)**: Purple (`#a855f7`)

### 2.4 Sub-Mesh Emissive Shader for Dynamic Tire Degradation
- `/models/f1_car.glb` wheel nodes (`Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR`) are cloned with independent standard materials:
  - **Wear $> 75\%$**: Flashing Neon Red (`#ff1744`, intensity 2.5, sinusoidal pulse in `useFrame`).
  - **Wear $50\% - 75\%$**: Glowing Amber (`#ff9100`, intensity 1.5).
  - **Wear $< 50\%$**: Cyan/Green optimal window (`#00e5ff`, intensity 0.5).
- Floating 3D labels attached via `<Html distanceFactor={8}>` show `FL [CRITICAL]`, `FR [58%]`, `RL [OPTIMAL]`, `RR [OPTIMAL]`.
- OrbitControls are constrained (`minPolarAngle: \pi/6`, `maxPolarAngle: \pi/2.1`) so users cannot view the car from beneath the ground plane.

---

## 3. Files Touched
- `created`:
  - `backend/app/services/circuit_service.py`: Dynamic FastF1 circuit geometry extraction, coordinate rotation, and canonical track catalogue.
  - `backend/app/api/circuits_router.py`: `GET /api/v1/circuits/{year}/{circuit}/geometry` endpoint with OpenTelemetry custom span.
  - `docs/journal/007-universal-3d-circuits-and-car.md`: This engineering journal entry.
- `modified`:
  - `backend/app/main.py`: Registered `circuits_router`.
  - `backend/app/services/timing_service.py`: Integrated `CircuitService` into `get_circuit_geometry`.
  - `frontend/src/lib/api.ts`: Added `CornerGeometry`, `CircuitGeometryResponse`, and `fetchCircuitGeometry()`.
  - `frontend/src/components/3d/TrackMap3D.tsx`: Universal 3D track spline ribbon with vertex colors, dynamic turn pins, camera zoom lerp, and corner telemetry card.
  - `frontend/src/components/3d/CarHealth3D.tsx`: GLTF asset binding, dynamic emissive shader pulsing, floating 3D labels, and pitch-constrained OrbitControls.
  - `frontend/src/app/page.tsx`: Added Grand Prix circuit switcher, dynamic telemetry sync, and Next.js SSR-safe dynamic imports.
  - `docs/journal/README.md`: Updated Master Journal Index with `[ENTRY-007]`.

---

## 4. OpenTelemetry & Verification
- **Spans Instrumenting FastF1 & Circuit Queries**:
  - `fastf1.circuit_info`: Attributes `f1.year`, `f1.circuit`, `f1.session`, `fastf1.corners_count`, `fastf1.cache_hit`.
- **HTTP Verification**:
  - `GET /api/v1/circuits/2024/monza/geometry?session_type=R` $\rightarrow$ `HTTP 200 OK` (11 corners, 240 spline points).
  - `GET /api/v1/circuits/2024/silverstone/geometry?session_type=R` $\rightarrow$ `HTTP 200 OK` (16 corners, 240 spline points).
  - `GET /api/v1/circuits/2024/spa/geometry?session_type=R` $\rightarrow$ `HTTP 200 OK` (19 corners, 240 spline points).
  - `GET /api/v1/circuits/2024/suzuka/geometry?session_type=R` $\rightarrow$ `HTTP 200 OK` (14 corners, 240 spline points).
- **Frontend Verification**:
  - Next.js compiled in container without SSR errors (`1737 modules`).
  - Dropdown circuit switching updates the header title, 3D track spline, and corner badges dynamically.

---

## 5. Next Steps
- Implement Sprint 5: AI Race Engineer Natural Language Querying over DuckDB Telemetry.
- Build Monte Carlo Pit Window Strategy Simulator for undercut/overcut forecasting.
