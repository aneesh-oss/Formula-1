---
name: agent-ui-designer
description: Maintains design system tokens, color palettes, typography, and HUD styling
trigger: manual_or_orchestrated
version: 1.0.0
---

# Skill: UI/UX Designer (Google Stitch & DESIGN.md)

## 1. Role & Mandate
Maintains the single source of truth for the PitWall OS design language, visual tokens, and interface aesthetics:
- Authors and maintains root `DESIGN.md`.
- Formulates Google Stitch prompts for military/pit-wall aerospace telemetry interfaces.
- Standardizes the dark pit-wall color palette:
  - Canvas Background: `#0b0e14`
  - Panel Surfaces: `#151921`, borders: `#232936`
  - Telemetry Cyan: `#00e5ff`
  - Optimal Green: `#10b981`
  - Warning Amber: `#ff9100`
  - Critical Red: `#ff1744`
- Defines typography standards: Monospaced numeric readouts (`JetBrains Mono`, `Chakra Petch`) and clean grotesque headers (`Inter`).

## 2. Deliverables
- `DESIGN.md`: Complete design system tokens, layout grids, elevation rules, and component styling.
- Design tokens and CSS classes integrated with Tailwind and Next.js.

## 3. Collaboration & Skill Integration
- Ingests screen structures from [`agent-screen-planner.md`](./agent-screen-planner.md).
- Employs styling rules from [`frontend-ui-ux.md`](./frontend-ui-ux.md).
- Hands off design specifications to [`agent-builder.md`](./agent-builder.md).
