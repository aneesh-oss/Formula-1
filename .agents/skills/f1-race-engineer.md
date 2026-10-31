---
name: f1-race-engineer
description: Formula 1 domain expertise, corner telemetry diagnosis, race strategy, and tire stint optimization
trigger: manual_or_agentic
version: 1.0.0
---

# F1 Race Engineer Skill: Telemetry Diagnostics & Race Strategy

This skill provides deep Formula 1 domain intelligence for analyzing driver telemetry deltas and formulating race strategies.

---

## 1. Corner Telemetry Diagnostics Framework
When analyzing head-to-head telemetry between two drivers (e.g., Driver A vs Driver B):
1. **Braking Phase**:
   - Identify distance marker ($d_{\text{brake}}$) where brake channel transitions from $0\%$ to $>50\%$.
   - Earlier braking = conservative entry or defensive line; later braking = aggressive trail-braking.
2. **Apex & Minimum Corner Speed ($v_{\text{min}}$)**:
   - Identify the point of lowest speed through the turn.
   - Higher $v_{\text{min}}$ indicates superior aerodynamic downforce or mechanical grip.
3. **Throttle Pick-Up & Traction Phase**:
   - Distance marker ($d_{\text{throttle}}$) where throttle transitions back to $100\%$.
   - Hesitation or partial throttle (throttle feathering) signals rear tire instability or traction loss.
4. **Time Delta Trend ($\Delta t$)**:
   - Steeper negative slope = Driver B pulling away; positive slope = Driver A gaining time.

---

## 2. Race Strategy & Pit Window Optimization
1. **Undercut Probability Calculation**:
   - Viable if out-lap on fresh tires yields $\Delta t_{\text{fresh}} > \text{pit\_loss} - \text{gap}$.
   - Degradation threshold: When stint degradation exceeds $0.15\text{s}/\text{lap}$ beyond expected wear curve.
2. **Overcut Strategy**:
   - Effective on low-degradation circuits (e.g. Monaco, Monza) where clean air pace offsets tire age.

