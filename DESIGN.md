# PitWall OS — Design Language & Visual System

**Document**: DESIGN.md  
**Role**: Antigravity UI Designer  
**Status**: Active Specification  

---

## 1. Design Philosophy: Aerospace Pit Wall & Military HUD

PitWall OS adheres to a **high-contrast, data-dense, dark military/aerospace cockpit telemetry aesthetic**. Every pixel conveys information with zero decorative bloat. Visual hierarchy is established through precise luminosity contrast, monospaced metrics, and neon telemetry accent channels.

---

## 2. Core Color Palette Tokens

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PITWALL OS COLOR TOKENS                           │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ Canvas / Void     │ Surface / Panel   │ Border / Division              │
│ #0b0e14           │ #151921           │ #232936                        │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ Telemetry Cyan    │ Optimal Green     │ Degradation Amber              │
│ #00e5ff           │ #10b981           │ #ff9100                        │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ Critical Red      │ Sector 3 Purple   │ Text Primary                   │
│ #ff1744           │ #a855f7           │ #f9fafb                        │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### Exact Color Values:
- **Canvas / Root Background**: `#0b0e14` (Deep void black)
- **Panel / Surface Card**: `#151921` (Low-reflectance charcoal slate)
- **Card Border**: `#232936` (Subtle boundary line, 1px)
- **Telemetry Cyan**: `#00e5ff` (Primary speed delta, Driver A accent, active tab indicator)
- **Optimal Green**: `#10b981` (Nominal tire grip $<50\%$, system healthy status)
- **Degradation Amber**: `#ff9100` (Tire wear $50–75\%$, Sector 2 indicator, cautionary brake temp)
- **Critical Cliff Red**: `#ff1744` (Tire wear $>75\%$, Ferrari red accent, alert state)
- **Sector 3 Purple**: `#a855f7` (Fastest sector split, sector 3 boundary)
- **Text Primary**: `#f9fafb` (High-contrast pure white)
- **Text Muted / Mono Labels**: `#9ca3af` / `#6b7280`

---

## 3. Typography Standards

- **Primary Interface Font**: `Inter`, `-apple-system`, `sans-serif` (Crisp readability on UI controls, tabs, and descriptions).
- **Telemetry Readout Font**: `JetBrains Mono`, `Chakra Petch`, `monospace` (Fixed-width numeric alignment prevents jumping digits on live lap scrubbers).
- **Scale Hierarchy**:
  - `Hero Display`: `text-4xl sm:text-6xl font-black tracking-tight`
  - `Section Header`: `text-xl sm:text-2xl font-bold tracking-wide`
  - `Widget Title`: `text-xs uppercase tracking-widest font-mono text-gray-400`
  - `Large Telemetry Stat`: `text-2xl font-black font-mono`
  - `Badges & Chips`: `text-[10px] uppercase font-bold font-mono tracking-wider`

---

## 4. HUD Borders & Elevation

- **Glassmorphism**: `backdrop-blur-md bg-[#151921]/90`
- **Gradients**: Subtle radial background spotlights (`radial-gradient(ellipse at top, rgba(0, 229, 255, 0.08), transparent 70%)`).
- **Card Structure**:
  ```tsx
  <div className="rounded-xl border border-[#232936] bg-[#151921] p-5 shadow-2xl transition-all hover:border-[#00e5ff]/30">
    {/* Telemetry Component */}
  </div>
  ```
- **Corner Badges (`<Html>`)**:
  - Border: `1px solid rgba(0, 229, 255, 0.4)`
  - Background: `rgba(11, 14, 20, 0.85)`
  - Glow: `box-shadow: 0 0 12px rgba(0, 229, 255, 0.3)`

---

## 5. Google Stitch System Integration

When prompting Google Stitch (`stitch.withgoogle.com`) for new component additions, use this prompt framing:

> "Create a high-density Formula 1 telemetry component in dark mode (#0b0e14). Use surface panels in #151921 with crisp #232936 borders. Highlight metrics with neon cyan (#00e5ff), optimal green (#10b981), and amber (#ff9100). Align all numeric readouts in monospaced font with subtle pill status indicators."

