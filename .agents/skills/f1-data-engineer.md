---
name: f1-data-engineer
description: Playbook for F1 session ingestion, distance-based telemetry resampling, and physics tire modeling
trigger: manual_or_agentic
version: 1.0.0
---

# F1 Data Engineering & Physics Modeling Playbook

This skill outlines the standard operating procedures for loading raw Formula 1 telemetry, cleaning high-frequency signals, distance-normalizing laps for overlay analysis, and executing the PitWall OS virtual tire model.

---

## 1. Session Ingestion & Data Hygiene

### Step 1: Session Initialization with Cache
Always verify that the local disk cache is engaged prior to invoking `fastf1.get_session`:
```python
import fastf1

# Mandatory local cache configuration
fastf1.Cache.enable_cache('data/fastf1_cache')

session = fastf1.get_session(year, circuit, session_type)
session.load(telemetry=True, laps=True, weather=True)
```

### Step 2: Signal Filtering
Raw telemetry streams contain time jitters, pit lane out-laps, and track limit invalidations:
- Filter laps: `session.laps.pick_quicklaps()` to exclude out-laps, in-laps, and safety car periods.
- Filter invalid telemetry: Strip null GPS channels (`X`, `Y`, `Z`) and discard corrupted RPM or gear readouts (`Gear == 0` during active high-speed sectors).

---

## 2. Distance-Based Resampling (1-Meter Grid)

### Rationale
Comparing driver telemetry over time ($\Delta t$) introduces spatial desynchronization because faster drivers reach corners earlier. To enable delta overlays (e.g., Hamilton vs. Verstappen), telemetry channels must be resampled against a uniform distance vector $d \in [0, L_{\text{lap}}]$ with $1\text{m}$ resolution.

### Resampling Algorithm:
```python
import numpy as np
import pandas as pd
from scipy.interpolate import interp1d

def resample_lap_telemetry(lap_telemetry: pd.DataFrame, step_meters: float = 1.0) -> pd.DataFrame:
    """
    Resamples lap telemetry onto a uniform 1m distance grid.
    Channels: Speed, Throttle, Brake, RPM, nGear, DRS.
    """
    total_distance = lap_telemetry['Distance'].max()
    grid_distance = np.arange(0, total_distance, step_meters)

    resampled_data = {'Distance': grid_distance}
    continuous_channels = ['Speed', 'Throttle', 'Brake', 'RPM']
    discrete_channels = ['nGear', 'DRS']

    # Linear interpolation for continuous channels
    for channel in continuous_channels:
        if channel in lap_telemetry.columns:
            interpolator = interp1d(
                lap_telemetry['Distance'],
                lap_telemetry[channel],
                kind='linear',
                fill_value='extrapolate'
            )
            resampled_data[channel] = interpolator(grid_distance)

    # Zero-order hold (nearest previous) for discrete channels
    for channel in discrete_channels:
        if channel in lap_telemetry.columns:
            interpolator = interp1d(
                lap_telemetry['Distance'],
                lap_telemetry[channel],
                kind='nearest',
                fill_value='extrapolate'
            )
            resampled_data[channel] = interpolator(grid_distance).astype(int)

    return pd.DataFrame(resampled_data)
```

---

## 3. PitWall OS Virtual Tire Model

Formula 1 Pirelli telemetry does not publicly broadcast real-time internal tire carcass temperatures or live pressures. PitWall OS implements a deterministic physics-driven Virtual Tire Model.

### Core Parameters & Baselines
- **Cold Starting Pressures**:
  - Front-Left (FL) & Front-Right (FR): $23.0\text{ PSI}$
  - Rear-Left (RL) & Rear-Right (RR): $20.5\text{ PSI}$
- **Target Operating Window**:
  - Fronts: $21.5 - 24.5\text{ PSI}$
  - Rears: $19.5 - 22.0\text{ PSI}$

### Mathematical Formulations

#### 1. Lateral Load & Thermal Energy ($G_{\text{lat}}$)
The instantaneous thermal energy delivered into the carcass during cornering scales quadratically with speed and inversely with corner radius:
$$a_{\text{lat}} = \frac{v^2}{R}$$
Where:
- $v$ is vehicle velocity in $\text{m/s}$
- $R$ is corner radius derived from GPS coordinates or yaw rate

The thermal pressure increase $\Delta P_{\text{thermal}}$ per corner sector is modeled as:
$$\Delta P_{\text{thermal}}(t) = k_{\text{compound}} \cdot \int |a_{\text{lat}}(t)| \, dt - \lambda_{\text{cooling}} \cdot (P(t) - P_{\text{ambient}})$$
where $k_{\text{compound}}$ is the compound thermal transfer constant and $\lambda_{\text{cooling}}$ represents convective heat dissipation along straights.

#### 2. Fuel-Corrected Tire Degradation
Vehicle mass reduces by approximately $1.6 - 1.8\text{ kg}$ per lap as fuel burns off, improving raw lap time by $\sim 0.03\text{s}/\text{lap}$. 

The net tire degradation penalty is calculated with fuel correction:
$$\text{Degradation Rate} = 0.06\text{ s/lap}$$
$$\Delta t_{\text{tire\_deg}}(\text{lap}) = 0.06 \cdot \text{tyre\_age} - 0.03 \cdot \text{lap\_number}$$

#### 3. Wear Index Calculation
$$\text{Wear}_{\%}(\text{stint\_lap}) = \min\left(100, \left(\frac{\text{stint\_lap}}{\text{MaxLife}_{\text{compound}}}\right)^{\gamma} \times 100\right)$$
Where $\gamma \approx 1.25$ accounts for accelerated rubber graining and blistering under thermal abuse.

