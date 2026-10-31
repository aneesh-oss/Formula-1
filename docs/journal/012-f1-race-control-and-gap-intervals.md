# Journal Entry 012 — Formula1.com Live Race Control Ribbon & Interval Timing Architecture

**Document ID**: ENTRY-012  
**Date**: 2026-11-01  
**Author**: Antigravity Screen Planner & UI Designer Team  
**Status**: Completed  
**Components**: `RaceControlWeatherRibbon.tsx`, `QualifyingTower.tsx`, `page.tsx`  

---

## 1. Context & Motivation
Following a deep deconstruction of `https://www.formula1.com/` live timing and F1 TV Pro features, our autonomous team identified two primary broadcast telemetry modules essential for professional pit wall operations:
1. **Live Race Control & Meteorology Ribbon**: Real-time track status flags (`GREEN`, `YELLOW SECTOR 2`, `SAFETY CAR`, `VSC`, `RED FLAG`), weather parameters (Track Temp `44.8°C`, Air Temp `23.4°C`, Humidity `42%`, Wind `2.8 m/s NE`, Rain Risk `0%`), and official FIA steward live notices (Track Limits, Investigations, DRS status).
2. **Interval vs. Gap Timing Toggle**: Seamless switching between total gap to the session leader (Hamilton P1) and the interval to the car directly ahead (critical for analyzing DRS overtakes), augmented with tyre stint age (`L3` to `L7`).

---

## 2. Technical Implementation
1. **`RaceControlWeatherRibbon.tsx`**:
   - Fixed header widget with interactive track flag state machine (`GREEN` / `YELLOW` / `SC` / `VSC` / `RED`).
   - Integrated FIA weather telemetry sensors.
   - Rotating FIA Race Control notice ticker with automatic 6-second cycle and indicator dots.
2. **`QualifyingTower.tsx` Enhancement**:
   - Built the `GAP` vs `INTERVAL` computation engine:
     $$\Delta_{\text{interval}} = \max(0.001, \text{gap}_i - \text{gap}_{i-1})$$
   - Added tyre stint duration pills (`L4`, `L6`, etc.) and pit indicators.
3. **Studio Integration (`frontend/src/app/studio/page.tsx`)**:
   - Mounted `RaceControlWeatherRibbon` directly above the `LiveRaceTicker` and `QualifyingTower`.

---

## 3. Verification & Governance
- Verified locally in Next.js App Router without SSR hydration mismatch.
- Documented in `docs/product/03-formula1-com-intelligence-and-screen-plan.md`.
- Staged on branch `dev`.

