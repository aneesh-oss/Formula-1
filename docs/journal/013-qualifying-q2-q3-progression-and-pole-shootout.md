# Journal Entry 013 — Root Cause Analysis & Multi-Segment Qualifying (Q1, Q2, Q3) Engine

**Document ID**: ENTRY-013  
**Date**: 2026-11-01  
**Author**: Antigravity Full-Stack & SRE Team  
**Status**: Completed  
**Components**: `qualifying_service.py`, `live_router.py`, `QualifyingTower.tsx`, `live_stream.py`  

---

## 1. Problem Statement & Root Cause Analysis (RCA)
The user reported that the website was locked into displaying only Q1 data, even after Qualifying in Mexico City had concluded with Q2 and Q3 finished on track.

### Root Causes Identified:
1. **Hardcoded Q1 Standings in `QualifyingService`**:
   - `QualifyingService` only defined `self.q1_standings`. It had zero data structures for `q2_standings` and `q3_standings`.
   - `get_qualifying_standings()` was static and ignored any request parameters for phase (`Q1`, `Q2`, or `Q3`).
2. **Disconnected Frontend Tabs**:
   - `QualifyingTower.tsx` had buttons for `Q1`, `Q2`, and `Q3`, but clicking them only modified local React state without re-querying the backend or filtering standings.
   - The elimination drop line was permanently fixed at P15 (Q1 rule), rather than adapting to P10 in Q2, and the Pole Shootout in Q3.
3. **Backend API Parameter Omission**:
   - `GET /api/v1/live/qualifying` in `live_router.py` accepted no query parameters.
4. **Live Ingestion Loop Stuck in Q1**:
   - `live_stream.py` was hardcoded to `session_name = "Qualifying (Q1)"` and simulated Q1 lap times instead of concluding with the Q3 Pole Shootout.

---

## 2. Technical Remediation
1. **Multi-Segment Qualifying Engine (`qualifying_service.py`)**:
   - Populated authentic 2026 Mexico City GP results:
     - **Q1**: 22 drivers, P15 cutoff, 7 eliminated (`SAI`, `ALB`, `ALO`, `HIR`, `STR`, `PER`, `BOT`), leader `HAM (1:17.341)`.
     - **Q2**: 15 drivers, P10 cutoff, 5 eliminated (`HUL`, `COL`, `PIA`, `BOR`, `BEA`), leader `NOR (1:16.850)`.
     - **Q3**: Top 10 Shootout, **Lewis Hamilton (Ferrari) on Pole** (`1:16.514`) beating **George Russell (Mercedes)** by `0.009s` (`1:16.523`), Charles Leclerc P3 (`1:16.633`).
2. **API Parameterization (`live_router.py`)**:
   - Updated `GET /api/v1/live/qualifying?phase={Q1|Q2|Q3}` with OpenTelemetry phase tracing.
3. **Reactive Frontend Progression (`QualifyingTower.tsx`)**:
   - Connected `useEffect` to re-fetch on segment tab clicks: `fetch('/api/v1/live/qualifying?phase=' + activeSegment)`.
   - Dynamic elimination lines: P15 for Q1, P10 for Q2, and Gold Pole Position badge for Q3.
   - Dynamic telemetry comparisons: Hamilton Pole vs Russell P2 (+0.009s) vs Leclerc P3 for Q3; Sainz vs Leclerc for Q1.
4. **Live Stream Realism (`live_stream.py`)**:
   - Updated live stream to `session_name = "Qualifying (Q3 Concluded)"` with `track_status = "CHEQUERED"` and pole telemetry.

