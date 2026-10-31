"""Vehicle health, tire grip loss state machine, and brake/clutch thermal model."""

import logging
from typing import Any, Dict, Optional

from app.telemetry import get_tracer, record_tire_metrics

logger = logging.getLogger("pitwall.services.car_health")


class CarHealthService:
    """Calculates 4-wheel dynamic grip states, brake disc thermal load, and clutch slip status."""

    def __init__(self):
        self.tracer = get_tracer("pitwall.car_health")

    def get_vehicle_health(
        self,
        driver: str = "VER",
        stint_lap: int = 14,
        compound: str = "MEDIUM",
        speed_kmh: float = 240.0,
        brake_pct: float = 0.0,
        lateral_g: float = 2.4,
    ) -> Dict[str, Any]:
        """
        Computes 4-wheel tire grip and wear state, brake disc temperatures, and clutch engagement.
        Color state machine:
        - OPTIMAL (Wear < 40%): #22c55e (Green)
        - DEGRADING (40% <= Wear <= 75%): #eab308 (Yellow)
        - GRIP_LOST (Wear > 75% or cliff reached): #ef4444 (Red)
        """
        driver_code = driver.upper()

        with self.tracer.start_as_current_span("car.health") as span:
            span.set_attribute("f1.driver", driver_code)
            span.set_attribute("f1.stint_lap", stint_lap)
            span.set_attribute("f1.compound", compound.upper())

            # 1. 4-Wheel Wear Calculation with Cornering Asymmetry
            compound_lifespans = {"SOFT": 18, "MEDIUM": 28, "HARD": 44, "INTERMEDIATE": 30, "WET": 35}
            max_life = compound_lifespans.get(compound.upper(), 28)

            # Monza has more right-hand corners -> Left-side tires (FL, RL) experience higher load
            base_ratio = stint_lap / max_life
            wear_fl = min(100.0, round(float((base_ratio * 1.15) ** 1.25 * 100.0), 1))
            wear_fr = min(100.0, round(float((base_ratio * 0.95) ** 1.25 * 100.0), 1))
            wear_rl = min(100.0, round(float((base_ratio * 1.10) ** 1.25 * 100.0), 1))
            wear_rr = min(100.0, round(float((base_ratio * 0.90) ** 1.25 * 100.0), 1))

            def evaluate_tire_status(wear: float):
                if wear > 75.0:
                    return {
                        "status": "GRIP_LOST",
                        "status_code": "CRITICAL",
                        "color": "#ef4444",  # Red
                        "description": "Tyre cliff reached. Severe thermal blistering and grip loss.",
                    }
                elif wear >= 40.0:
                    return {
                        "status": "DEGRADING",
                        "status_code": "WARNING",
                        "color": "#eab308",  # Yellow
                        "description": "Rubber degradation active. Pace dropping by 0.08s/lap.",
                    }
                else:
                    return {
                        "status": "OPTIMAL",
                        "status_code": "NORMAL",
                        "color": "#22c55e",  # Green
                        "description": "Operating inside prime grip and temperature window.",
                    }

            tires = {
                "front_left": {
                    "corner": "FL",
                    "wear_pct": wear_fl,
                    "pressure_psi": round(23.0 + (lateral_g * 0.45) + (stint_lap * 0.05), 2),
                    "temp_celsius": round(85.0 + (lateral_g * 7.5) + (wear_fl * 0.2), 1),
                    **evaluate_tire_status(wear_fl),
                },
                "front_right": {
                    "corner": "FR",
                    "wear_pct": wear_fr,
                    "pressure_psi": round(23.0 + (lateral_g * 0.35) + (stint_lap * 0.05), 2),
                    "temp_celsius": round(85.0 + (lateral_g * 6.0) + (wear_fr * 0.2), 1),
                    **evaluate_tire_status(wear_fr),
                },
                "rear_left": {
                    "corner": "RL",
                    "wear_pct": wear_rl,
                    "pressure_psi": round(20.5 + (lateral_g * 0.38) + (stint_lap * 0.04), 2),
                    "temp_celsius": round(82.0 + (lateral_g * 6.5) + (wear_rl * 0.2), 1),
                    **evaluate_tire_status(wear_rl),
                },
                "rear_right": {
                    "corner": "RR",
                    "wear_pct": wear_rr,
                    "pressure_psi": round(20.5 + (lateral_g * 0.30) + (stint_lap * 0.04), 2),
                    "temp_celsius": round(82.0 + (lateral_g * 5.0) + (wear_rr * 0.2), 1),
                    **evaluate_tire_status(wear_rr),
                },
            }

            # 2. Brake Disc Thermal Model
            # Spikes during heavy deceleration (Brake > 80% and Speed > 200 km/h)
            is_heavy_braking = brake_pct > 80.0 and speed_kmh > 200.0
            if is_heavy_braking:
                front_disc_temp = round(880.0 + (speed_kmh * 0.4), 1)
                rear_disc_temp = round(640.0 + (speed_kmh * 0.3), 1)
                brake_status = "HEAVY_BRAKING_HEAT_SPIKE"
                brake_color = "#ef4444"
            else:
                front_disc_temp = round(420.0 + (speed_kmh * 0.15), 1)
                rear_disc_temp = round(380.0 + (speed_kmh * 0.12), 1)
                brake_status = "NOMINAL_AERO_COOLING"
                brake_color = "#22c55e" if front_disc_temp < 650 else "#eab308"

            brakes = {
                "front_disc_temp_celsius": front_disc_temp,
                "rear_disc_temp_celsius": rear_disc_temp,
                "front_pad_wear_pct": round(min(100.0, stint_lap * 1.6), 1),
                "rear_pad_wear_pct": round(min(100.0, stint_lap * 1.1), 1),
                "status": brake_status,
                "color": brake_color,
                "is_heavy_braking": is_heavy_braking,
            }

            # 3. Clutch Engagement & Slip Model
            # At racing speeds (>80 km/h), clutch is 100% locked/engaged
            if speed_kmh < 40.0:
                clutch_state = "SLIP_ACTIVE"
                clutch_slip_pct = 45.0
                clutch_temp_c = 195.0
                clutch_color = "#eab308"
            else:
                clutch_state = "LOCKED_ENGAGED"
                clutch_slip_pct = 0.0
                clutch_temp_c = 110.0
                clutch_color = "#22c55e"

            clutch = {
                "status": clutch_state,
                "slip_pct": clutch_slip_pct,
                "temp_celsius": clutch_temp_c,
                "color": clutch_color,
            }

            # Update OTel gauges
            record_tire_metrics(driver_code, "FL", compound, tires["front_left"]["pressure_psi"], wear_fl)
            record_tire_metrics(driver_code, "FR", compound, tires["front_right"]["pressure_psi"], wear_fr)
            record_tire_metrics(driver_code, "RL", compound, tires["rear_left"]["pressure_psi"], wear_rl)
            record_tire_metrics(driver_code, "RR", compound, tires["rear_right"]["pressure_psi"], wear_rr)

            return {
                "driver": driver_code,
                "stint_lap": stint_lap,
                "compound": compound.upper(),
                "tires": tires,
                "brakes": brakes,
                "clutch": clutch,
                "overall_vehicle_status": "CRITICAL" if any(t["status"] == "GRIP_LOST" for t in tires.values()) else ("WARNING" if any(t["status"] == "DEGRADING" for t in tires.values()) else "HEALTHY"),
            }
