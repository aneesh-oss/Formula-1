---
name: frontend-ui-ux
description: UI/UX design system, Next.js dashboard architecture, and high-frequency telemetry visualization
trigger: manual_or_agentic
version: 1.0.0
---

# UI/UX & Frontend Engineer Skill: Pit Wall Dashboard

This skill governs the user experience, design system, interactive telemetry charts, and Next.js frontend architecture.

---

## 1. Visual Language & Dark Mode "Pit Wall" Aesthetic
- **Theme**: Dark Mode cockpit aesthetic inspired by actual Formula 1 pit wall timing screens (Mercedes, Red Bull, Ferrari telemetry monitors).
- **Color Palette**:
  - Background: Deep Charcoal (`#0d0e12`) / Card Surface (`#16181f`)
  - Accent / Primary: F1 Neon Red (`#e10600`) / Cyber Cyan (`#00f0ff`)
  - Team Colors:
    - Red Bull: `#3671C6`
    - Ferrari: `#E80020`
    - Mercedes: `#27F4D2`
    - McLaren: `#FF8000`
    - Aston Martin: `#229971`

---

## 2. Core Visualization Components
1. **Distance-Aligned Telemetry Delta**:
   - Synchronized line charts plotting Speed ($\text{km/h}$), Throttle ($\%$), Brake ($\%$), and Delta Time ($\Delta t$) along a unified $X$-axis of track distance ($0$ to lap length in meters).
   - Interactive crosshair tooltips highlighting exact corner numbers and braking points.
2. **Interactive 2D Circuit Track Map**:
   - Dynamic SVG / Canvas map showing car positions, mini-sectors colored by which driver was faster (purple/green/yellow), and turn annotations.
3. **4-Wheel Virtual Tire Status Widget**:
   - Visual car chassis diagram displaying FL, FR, RL, and RR tire pressures (PSI), temperatures ($^\circ\text{C}$), and wear progress rings.

---

## 3. Frontend Architecture
- **Framework**: Next.js 14+ (App Router, React Server Components + Client Visualization Islands).
- **Styling**: Tailwind CSS + Lucide Icons.
- **Charts**: Recharts / Plotly.js / Canvas2D for 60fps telemetry scrub and replay.

