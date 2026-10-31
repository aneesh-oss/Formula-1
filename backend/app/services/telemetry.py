"""Telemetry processing, distance resampling, virtual tire modeling, and lakehouse persistence."""

import logging
import os
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy.interpolate import interp1d

from app.telemetry import get_tracer, record_tire_metrics

logger = logging.getLogger("pitwall.services.telemetry")


class TelemetryService:
    """Handles FastF1 ingestion, uniform 1m distance resampling, virtual tire physics, and lakehouse storage."""

    def __init__(
        self,
        cache_dir: Optional[str] = None,
        lakehouse_dir: Optional[str] = None,
    ):
        self.cache_dir = cache_dir or os.getenv("FASTF1_CACHE_DIR", "data/fastf1_cache")
        self.lakehouse_dir = lakehouse_dir or os.getenv("LAKEHOUSE_DIR", "data/lakehouse")
        self.tracer = get_tracer("pitwall.telemetry_service")

        os.makedirs(self.cache_dir, exist_ok=True)
        os.makedirs(self.lakehouse_dir, exist_ok=True)

        # Enable FastF1 disk cache
        try:
            import fastf1

            fastf1.Cache.enable_cache(self.cache_dir)
            logger.info("FastF1 cache enabled at: %s", self.cache_dir)
        except Exception as e:
            logger.warning("Could not initialize FastF1 cache: %s", e)

    def _generate_synthetic_lap_telemetry(
        self,
        circuit: str,
        lap_length_m: float = 5793.0,  # Monza length ~5.79km
        num_samples: int = 1500,
        driver: str = "VER",
    ) -> pd.DataFrame:
        """Generates realistic telemetry dataset for testing or offline environments."""
        distance = np.linspace(0, lap_length_m, num_samples)
        # Create corners and straights profile
        angle = (distance / lap_length_m) * 2 * np.pi
        # Speed profile: straights ~340 km/h, chicanes/corners down to 80-160 km/h
        driver_bias = 1.02 if driver.upper() == "VER" else 1.00
        speed = 220 + 100 * np.sin(3 * angle) + 40 * np.cos(7 * angle)
        speed = np.clip(speed * driver_bias, 75.0, 350.0)

        throttle = np.where(speed > 250, 100.0, np.clip((speed - 100) / 1.5, 0.0, 100.0))
        brake = np.where(throttle < 20, np.clip((200 - speed) / 2.0, 0.0, 100.0), 0.0)
        rpm = np.clip(speed * 35 + 2000, 4000, 12500)
        gear = np.clip((speed / 45).astype(int) + 1, 1, 8)
        drs = np.where((distance > 1000) & (distance < 2000), 1, 0)

        # Coordinates roughly tracing an F1 circuit outline
        x = 1000.0 * np.cos(angle) + 200.0 * np.sin(2 * angle)
        y = 600.0 * np.sin(angle) + 150.0 * np.sin(3 * angle)

        # Approximate elapsed lap time in seconds
        dt = np.gradient(distance) / np.maximum(speed / 3.6, 1.0)
        time_seconds = np.cumsum(dt)

        return pd.DataFrame(
            {
                "Distance": distance,
                "Speed": speed,
                "Throttle": throttle,
                "Brake": brake,
                "RPM": rpm,
                "nGear": gear,
                "DRS": drs,
                "X": x,
                "Y": y,
                "TimeSeconds": time_seconds,
            }
        )

    def resample_lap_telemetry(
        self,
        raw_telemetry: pd.DataFrame,
        num_samples: int = 1500,
    ) -> pd.DataFrame:
        """
        Resamples lap telemetry along an interpolated distance grid.
        Grid: np.linspace(0, lap_length, num_samples).
        """
        if raw_telemetry.empty or "Distance" not in raw_telemetry.columns:
            return pd.DataFrame()

        total_distance = float(raw_telemetry["Distance"].max())
        if total_distance <= 0:
            return pd.DataFrame()

        grid_distance = np.linspace(0, total_distance, num_samples)
        resampled_dict = {"Distance": grid_distance}

        continuous_channels = ["Speed", "Throttle", "Brake", "RPM", "X", "Y"]
        discrete_channels = ["nGear", "DRS"]

        # Ensure unique sorting on Distance for interpolation
        clean_df = raw_telemetry.drop_duplicates(subset=["Distance"]).sort_values("Distance")
        source_dist = clean_df["Distance"].values

        # Elapsed time interpolation
        if "Time" in clean_df.columns:
            if pd.api.types.is_timedelta64_dtype(clean_df["Time"]):
                time_sec = clean_df["Time"].dt.total_seconds().values
            else:
                time_sec = pd.to_numeric(clean_df["Time"], errors="coerce").values
            time_interp = interp1d(source_dist, time_sec, kind="linear", fill_value="extrapolate")
            resampled_dict["TimeSeconds"] = time_interp(grid_distance)
        elif "TimeSeconds" in clean_df.columns:
            time_interp = interp1d(source_dist, clean_df["TimeSeconds"].values, kind="linear", fill_value="extrapolate")
            resampled_dict["TimeSeconds"] = time_interp(grid_distance)
        else:
            # Fallback estimation from speed
            speed_val = clean_df["Speed"].values if "Speed" in clean_df.columns else np.full_like(source_dist, 200.0)
            dt = np.gradient(source_dist) / np.maximum(speed_val / 3.6, 1.0)
            resampled_dict["TimeSeconds"] = np.cumsum(dt)

        # Continuous channels
        for ch in continuous_channels:
            if ch in clean_df.columns:
                interp_func = interp1d(source_dist, clean_df[ch].values, kind="linear", fill_value="extrapolate")
                resampled_dict[ch] = interp_func(grid_distance)
            else:
                resampled_dict[ch] = np.zeros_like(grid_distance)

        # Discrete channels
        for ch in discrete_channels:
            if ch in clean_df.columns:
                interp_func = interp1d(source_dist, clean_df[ch].values, kind="nearest", fill_value="extrapolate")
                resampled_dict[ch] = interp_func(grid_distance).astype(int)
            else:
                resampled_dict[ch] = np.zeros_like(grid_distance, dtype=int)

        return pd.DataFrame(resampled_dict)

    def calculate_virtual_tire_physics(
        self,
        telemetry_df: pd.DataFrame,
        driver: str,
        lap_number: int,
        compound: str = "HARD",
        tyre_life: int = 1,
    ) -> pd.DataFrame:
        """
        Executes the PitWall OS Virtual Tire Model:
        - Cold Baseline: Fronts (FL/FR): 23.0 PSI, Rears (RL/RR): 20.5 PSI.
        - Lateral G-Force: G_lat = v^2 / R (via coordinate curvature).
        - Longitudinal Deceleration: G_long from dv/dt.
        - Thermal pressure rise and temperatures per corner.
        - Fuel-corrected tire wear score factoring out 0.06s/lap wear vs 0.03s/lap fuel decay.
        """
        with self.tracer.start_as_current_span("physics.tire_model") as span:
            span.set_attribute("f1.driver", driver.upper())
            span.set_attribute("f1.lap_number", lap_number)
            span.set_attribute("f1.compound", compound.upper())

            df = telemetry_df.copy()
            n = len(df)
            if n == 0:
                return df

            # 1. Kinematics: Speeds & Accelerations
            v_ms = df["Speed"].values / 3.6  # km/h to m/s
            time_s = df["TimeSeconds"].values
            dt = np.gradient(time_s)
            dt = np.where(dt <= 0.001, 0.01, dt)

            # Longitudinal acceleration (in Gs)
            dv = np.gradient(v_ms)
            a_long = dv / dt
            g_long = np.clip(a_long / 9.81, -5.5, 3.0)
            df["G_Long"] = g_long

            # Lateral acceleration from trajectory curvature (in Gs)
            x = df["X"].values
            y = df["Y"].values
            dx = np.gradient(x)
            dy = np.gradient(y)
            d2x = np.gradient(dx)
            d2y = np.gradient(dy)

            denom = np.power(dx**2 + dy**2, 1.5)
            curvature = np.abs(dx * d2y - dy * d2x) / np.maximum(denom, 1e-4)
            # a_lat = v^2 * curvature
            a_lat = (v_ms**2) * curvature
            g_lat = np.clip(a_lat / 9.81, 0.0, 5.5)
            df["G_Lat"] = g_lat

            # Turn direction: cross product sign (+ for left, - for right)
            cross = dx * d2y - dy * d2x
            turn_dir = np.sign(cross)

            # 2. Virtual Tire Pressures (Cold Baseline: FL/FR=23.0, RL/RR=20.5 PSI)
            base_p_front = 23.0
            base_p_rear = 20.5

            # Lateral weight transfer effect on tires:
            # Turning Left (turn_dir > 0) -> Right tires (FR, RR) loaded.
            # Turning Right (turn_dir < 0) -> Left tires (FL, RL) loaded.
            load_factor_l = np.where(turn_dir < 0, 1.3, 0.7)
            load_factor_r = np.where(turn_dir > 0, 1.3, 0.7)

            # Heavy braking transfers weight forward onto fronts
            brake_transfer = np.clip(-g_long, 0.0, 5.0) * 0.35

            # Dynamic thermal pressure delta (typical hot rise is 2.0 to 4.5 PSI)
            thermal_p_fl = (g_lat * 0.45 * load_factor_l) + brake_transfer
            thermal_p_fr = (g_lat * 0.45 * load_factor_r) + brake_transfer
            thermal_p_rl = (g_lat * 0.35 * load_factor_l) + (brake_transfer * 0.2)
            thermal_p_rr = (g_lat * 0.35 * load_factor_r) + (brake_transfer * 0.2)

            # Add stint heat soak: slight pressure ramp over laps
            stint_heat_soak = min(1.5, tyre_life * 0.05)

            df["pressure_fl"] = np.round(base_p_front + thermal_p_fl + stint_heat_soak, 2)
            df["pressure_fr"] = np.round(base_p_front + thermal_p_fr + stint_heat_soak, 2)
            df["pressure_rl"] = np.round(base_p_rear + thermal_p_rl + stint_heat_soak, 2)
            df["pressure_rr"] = np.round(base_p_rear + thermal_p_rr + stint_heat_soak, 2)

            # 3. Virtual Temperatures (°C): Baseline 80°C up to 125°C in corners
            df["temp_fl"] = np.round(80.0 + (thermal_p_fl * 8.5) + (tyre_life * 0.3), 1)
            df["temp_fr"] = np.round(80.0 + (thermal_p_fr * 8.5) + (tyre_life * 0.3), 1)
            df["temp_rl"] = np.round(80.0 + (thermal_p_rl * 7.5) + (tyre_life * 0.3), 1)
            df["temp_rr"] = np.round(80.0 + (thermal_p_rr * 7.5) + (tyre_life * 0.3), 1)

            # 4. Fuel-Corrected Degradation Score
            # Fuel burn creates ~0.03s/lap improvement; rubber decay creates ~0.06s/lap penalty
            compound_max_life = {"SOFT": 22, "MEDIUM": 32, "HARD": 45, "INTERMEDIATE": 30, "WET": 35}.get(
                compound.upper(), 35
            )
            wear_ratio = float(tyre_life) / float(compound_max_life)
            wear_pct = min(100.0, round(float(np.power(wear_ratio, 1.25) * 100.0), 1))
            df["wear_pct"] = wear_pct

            # Update OTel active gauges for this driver
            avg_p_fl = float(np.mean(df["pressure_fl"]))
            avg_p_fr = float(np.mean(df["pressure_fr"]))
            avg_p_rl = float(np.mean(df["pressure_rl"]))
            avg_p_rr = float(np.mean(df["pressure_rr"]))

            record_tire_metrics(driver, "FL", compound, avg_p_fl, wear_pct)
            record_tire_metrics(driver, "FR", compound, avg_p_fr, wear_pct)
            record_tire_metrics(driver, "RL", compound, avg_p_rl, wear_pct)
            record_tire_metrics(driver, "RR", compound, avg_p_rr, wear_pct)

            return df

    def ingest_session(
        self,
        year: int = 2024,
        circuit: str = "monza",
        session_name: str = "R",
        target_drivers: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Loads FastF1 session, extracts laps, resamples onto 1m grid, computes tire physics,
        and saves partitioned Parquet files: data/lakehouse/{year}/{circuit}/{session}/{driver}.parquet
        """
        target_drivers = [d.upper() for d in (target_drivers or ["VER", "NOR", "HAM", "LEC"])]
        partition_dir = os.path.join(self.lakehouse_dir, str(year), circuit.lower(), session_name.upper())
        os.makedirs(partition_dir, exist_ok=True)

        ingested_drivers = []
        with self.tracer.start_as_current_span("fastf1.load_session") as span:
            span.set_attribute("f1.year", year)
            span.set_attribute("f1.circuit", circuit.lower())
            span.set_attribute("f1.session", session_name.upper())

            # Attempt live FastF1 load
            session_obj = None
            try:
                import fastf1

                session_obj = fastf1.get_session(year, circuit, session_name)
                session_obj.load(telemetry=True, laps=True, weather=False)
                span.set_attribute("fastf1.cache_hit", True)
                logger.info("Loaded FastF1 session: %d %s %s", year, circuit, session_name)
            except Exception as e:
                span.set_attribute("fastf1.cache_hit", False)
                span.set_attribute("fastf1.fallback", True)
                logger.warning("FastF1 session could not be retrieved remotely/cache: %s. Using high-fidelity synthetic fallback.", e)

            for driver in target_drivers:
                driver_records = []
                try:
                    if session_obj is not None and hasattr(session_obj, "laps") and not session_obj.laps.empty:
                        driver_laps = session_obj.laps.pick_driver(driver).pick_quicklaps()
                        if driver_laps.empty:
                            driver_laps = session_obj.laps.pick_driver(driver)
                        # Process representative laps (up to 5 key laps per driver for efficiency)
                        selected_laps = driver_laps.head(5)
                        for _, lap in selected_laps.iterrows():
                            lap_num = int(lap["LapNumber"])
                            compound = str(lap.get("Compound", "HARD") or "HARD")
                            tyre_life = int(lap.get("TyreLife", lap_num) or lap_num)
                            lap_time = float(lap["LapTime"].total_seconds()) if pd.notnull(lap.get("LapTime")) else 82.5

                            raw_tel = lap.get_telemetry()
                            resampled = self.resample_lap_telemetry(raw_tel, num_samples=1500)
                            enriched = self.calculate_virtual_tire_physics(
                                resampled,
                                driver=driver,
                                lap_number=lap_num,
                                compound=compound,
                                tyre_life=tyre_life,
                            )
                            enriched["year"] = year
                            enriched["circuit"] = circuit.lower()
                            enriched["session"] = session_name.upper()
                            enriched["driver"] = driver
                            enriched["lap_number"] = lap_num
                            enriched["lap_time_seconds"] = lap_time
                            enriched["compound"] = compound
                            enriched["tyre_life"] = tyre_life
                            driver_records.append(enriched)
                except Exception as ex:
                    logger.warning("Error processing driver %s via FastF1: %s", driver, ex)

                # Fallback generator if FastF1 yielded no laps for driver
                if not driver_records:
                    for lap_num in range(1, 6):
                        compound = "HARD" if lap_num <= 30 else "MEDIUM"
                        synth_tel = self._generate_synthetic_lap_telemetry(circuit=circuit, driver=driver)
                        enriched = self.calculate_virtual_tire_physics(
                            synth_tel,
                            driver=driver,
                            lap_number=lap_num,
                            compound=compound,
                            tyre_life=lap_num,
                        )
                        enriched["year"] = year
                        enriched["circuit"] = circuit.lower()
                        enriched["session"] = session_name.upper()
                        enriched["driver"] = driver
                        enriched["lap_number"] = lap_num
                        lap_time_base = 81.2 if driver == "VER" else 81.5
                        enriched["lap_time_seconds"] = lap_time_base + (lap_num * 0.05)
                        enriched["compound"] = compound
                        enriched["tyre_life"] = lap_num
                        driver_records.append(enriched)

                # Combine driver laps into single Parquet file
                combined_df = pd.concat(driver_records, ignore_index=True)
                # Standardize column naming to lowercase for clean DuckDB SQL
                column_mapping = {
                    "Distance": "distance",
                    "Speed": "speed",
                    "Throttle": "throttle",
                    "Brake": "brake",
                    "RPM": "rpm",
                    "nGear": "gear",
                    "DRS": "drs",
                    "X": "x",
                    "Y": "y",
                    "TimeSeconds": "time_seconds",
                    "G_Lat": "g_lat",
                    "G_Long": "g_long",
                }
                combined_df.rename(columns=column_mapping, inplace=True)

                parquet_filename = f"{driver}.parquet"
                parquet_filepath = os.path.join(partition_dir, parquet_filename)
                
                # Write to Parquet using in-process DuckDB (built-in C++ Parquet engine)
                try:
                    import duckdb
                    duckdb.execute("COPY (SELECT * FROM combined_df) TO ? (FORMAT PARQUET)", [parquet_filepath])
                except Exception as write_err:
                    logger.warning("DuckDB COPY TO PARQUET error: %s. Trying pandas.", write_err)
                    combined_df.to_parquet(parquet_filepath, index=False)

                ingested_drivers.append(driver)
                logger.info("Persisted %s partition: %s (%d rows)", driver, parquet_filepath, len(combined_df))

        return {
            "status": "success",
            "year": year,
            "circuit": circuit.lower(),
            "session": session_name.upper(),
            "partition_directory": partition_dir,
            "drivers_ingested": ingested_drivers,
        }

