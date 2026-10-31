# [ENTRY-011] F1 Live Qualifying Timing Tower & Knockout Elimination Drop Zones

**Date**: 2026-11-01  
**Author**: Antigravity Full-Stack Builder & Race Engineer  
**Status**: Completed  
**Component**: Frontend / Ingestion / Qualifying Analytics  

---

## 1. Objective & Context
Following user feedback and live race analysis during the Mexico City Grand Prix Qualifying session, a full broadcast-grade **Qualifying Timing Tower & Knockout Drop Zone** has been implemented.

This delivers:
1. **Full 22-Driver Classification**:
   - Matches the official live FanCode / F1 TV timing tower.
   - Leader: **Lewis Hamilton (HAM)** in P1 with **`1:17.341`** on Soft compound tyres (`[S]`).
   - Gaps for all 22 drivers (e.g. `HAD +0.044`, `LEC +0.069`, `PIA +0.318`, `RUS +0.318`, `BOR +0.386`, `NOR +0.392`, `HUL +0.527`, `ANT +0.577`, `VER +0.601`).
2. **Knockout Elimination Cut-Off Line**:
   - A distinct red warning boundary between P15 and P16 (`COL +1.176` vs `SAI +1.358`).
   - Highlights the 7 knocked-out drivers eliminated from Q1:
     - **P16**: Carlos Sainz (`SAI +1.358`)
     - **P17**: Alexander Albon (`ALB +1.564`)
     - **P18**: Fernando Alonso (`ALO +1.567`)
     - **P19**: Oliver Hirvonen / Bearman (`HIR +1.617`)
     - **P20**: Lance Stroll (`STR +1.731`)
     - **P21**: Sergio Pérez (`PER +1.764`)
     - **P22**: Valtteri Bottas (`BOT +2.511`)
3. **Driver Micro-Sector Comparison Card**:
   - Side-by-side comparison between **16 SAI** and **3 LEC** against session leader **HAM**, displaying micro-sectors (S1, S2, S3) with green/purple/yellow telemetry badges.
4. **Backend Engine**:
   - `backend/app/services/qualifying_service.py`
   - `GET /api/v1/live/qualifying` endpoint.

---

## 2. Technical Decisions
- **Instant Client Hydration**: Rather than leaving the timing tower empty while waiting for SSE stream cycles, the client immediately pulls the latest state from `/api/v1/live/qualifying` on mount.
- **Visual Separation**: Safe drivers (P1–P15 advancing to Q2) use high-contrast cyan/white badges, while eliminated drivers (P16–P22) are dimmed with red borders and an explicit `KNOCKED OUT` badge.

---

## 3. Files Touched
- `created`: `backend/app/services/qualifying_service.py`
- `created`: `frontend/src/components/QualifyingTower.tsx`
- `created`: `docs/journal/011-qualifying-timing-tower-and-knockout-zones.md`
- `modified`: `backend/app/api/live_router.py`
- `modified`: `frontend/src/app/studio/page.tsx`
- `modified`: `docs/journal/README.md`

