# [ENTRY-006] 3D WebGL PitWall HUD (Three.js/Fiber, 3D Track Spline & Car Health)

**Date**: 2026-10-31  
**Author**: Principal Graphics & 3D Telemetry Engineer  
**Status**: Completed  
**Component**: Frontend / WebGL / Three.js / 3D Track Spline  

---

## 1. Objective & Context
To deliver an immersive, enterprise-grade Formula 1 telemetry experience, we integrated a full 3D WebGL rendering pipeline into PitWall OS using **Three.js**, **`@react-three/fiber`**, and **`@react-three/drei`**.

This sprint brings:
1. **Interactive 3D Track Ribbon (`TrackMap3D.tsx`)**: Volumetric 3D spline tube (`CatmullRomCurve3`) modeling Monza's circuit layout and vertical elevation profile ($Z/Y$).
2. **Interactive 3D Corner Pins (`<Html>`)**: Anchors at Turn 1, Turn 4, Turn 8 (Ascari), and Turn 11 (Parabolica) that trigger smooth camera lerp/zoom animations and analytical popups (apex speed, braking load, gear).
3. **Synchronized 3D Moving Car Markers**: Multi-driver spheres (Red Bull Blue and McLaren Orange) gliding along the 3D curve in real time based on distance scrubbing.
4. **3D Vehicle Dynamics HUD (`CarHealth3D.tsx`)**: Procedural low-poly Formula 1 chassis with dynamic tire material shaders bound directly to backend tire wear states.

---

## 2. Technical Decisions & Implementation Details

### A. Three.js / React Three Fiber Integration & SSR Hydration Guard
- **SSR Challenge**: WebGL canvas elements access the browser's `window` and WebGL context (`WebGLRenderingContext`). Rendering Three.js server-side produces hydration mismatches.
- **Solution**: Dynamically imported with Next.js client-only execution:
  ```typescript
  const CarHealth3D = dynamic(() => import("@/components/3d/CarHealth3D"), { ssr: false });
  const TrackMap3D = dynamic(() => import("@/components/3d/TrackMap3D"), { ssr: false });
  ```
- **Performance**: OrbitControls with damping (`dampingFactor: 0.05`), antialiased rendering, and bounded polar angles to prevent looking through the ground plane.

### B. Procedural F1 Chassis & Dynamic Tire Color Shader
- In place of heavy external GLTF assets, `CarHealth3D.tsx` synthesizes a lightweight, low-poly monocoque, halo, aerodynamic front/rear wings, and 4 decoupled wheel cylinders (`FL`, `FR`, `RL`, `RR`).
- **Dynamic Shader Binding**:
  - `Wear < 50%`: Emerald Green (`#10b981`)
  - `50% <= Wear <= 75%`: Amber degradation (`#f59e0b`)
  - `Wear > 75%`: Pulsing Red (`#ef4444`) with high emissive sine-wave oscillation via `useFrame((state) => ...)` to alert strategists of an active tire cliff.

### C. 3D Spline Interpolation over GPS Telemetry
- The circuit contour is modeled using `THREE.CatmullRomCurve3(points, true, "centripetal")`.
- Real planar coordinates $(X, Y)$ are mapped to $(X, Z)$ and augmented with vertical elevation $Y = \sin(4\pi t) \times 0.65\text{m}$.
- Generates a dual-tube geometry:
  1. Outer carbon casing: `tubeGeometry args={[curve, 260, 0.45, 12, true]}`
  2. Inner neon laser centerline: `tubeGeometry args={[curve, 260, 0.08, 8, true]}` with cyan emissive glow.

---

## 3. Files Touched
- `created`:
  - `frontend/src/components/3d/CarHealth3D.tsx`: 3D procedural F1 chassis with dynamic tire shader binding and OrbitControls.
  - `frontend/src/components/3d/TrackMap3D.tsx`: 3D volumetric spline track ribbon with elevation, interactive corner HTML pins, and synchronized car spheres.
  - `frontend/public/models/manifest.json`: 3D model manifest and asset loader configuration.
  - `docs/journal/006-3d-webgl-pitwall.md`: This engineering record.
- `modified`:
  - `frontend/package.json`: Added `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`.
  - `frontend/src/app/page.tsx`: Added View Mode switcher (`[ 3D WebGL ]` vs `[ 2D Cockpit ]`) with dynamic SSR-safe imports.
  - `docs/journal/README.md`: Appended entry to Master Journal Index.

---

## 4. Verification & Testing
- Verified Next.js compiles all WebGL and Canvas dependencies without hydration errors.
- Verified interactive camera zoom on corner pins.
- Verified dynamic material color transitions based on live `/api/v1/telemetry/tires` and `/telemetry/{driver}/health`.
