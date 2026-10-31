"""In-process DuckDB analytical engine for querying partitioned Parquet telemetry."""

import logging
import os
from typing import Any, Dict, List, Optional

import duckdb
from app.telemetry import get_tracer

logger = logging.getLogger("pitwall.duckdb")


class DuckDBManager:
    """Manages in-process DuckDB connections and zero-copy queries over Parquet partitions."""

    def __init__(self, lakehouse_base_path: Optional[str] = None):
        self.lakehouse_base_path = lakehouse_base_path or os.getenv("LAKEHOUSE_DIR", "data/lakehouse")
        self.conn = duckdb.connect(database=":memory:", read_only=False)
        self.tracer = get_tracer("pitwall.duckdb")
        logger.info("DuckDBManager initialized in-process with lakehouse base: %s", self.lakehouse_base_path)

    def _get_driver_parquet_path(self, year: int, circuit: str, session: str, driver: str) -> str:
        """Constructs canonical path for a driver's partitioned parquet file."""
        return os.path.join(
            self.lakehouse_base_path,
            str(year),
            circuit.lower(),
            session.upper(),
            f"{driver.upper()}.parquet",
        )

    def get_driver_lap_telemetry(
        self,
        year: int,
        circuit: str,
        session: str,
        driver: str,
        lap_number: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves high-resolution resampled telemetry for a driver's lap.
        If lap_number is None, defaults to the driver's fastest recorded lap.
        """
        driver_code = driver.upper()
        parquet_path = self._get_driver_parquet_path(year, circuit, session, driver_code)

        with self.tracer.start_as_current_span("duckdb.query") as span:
            span.set_attribute("db.system", "duckdb")
            span.set_attribute("db.operation", "SELECT")
            span.set_attribute("f1.year", year)
            span.set_attribute("f1.circuit", circuit.lower())
            span.set_attribute("f1.session", session.upper())
            span.set_attribute("f1.driver", driver_code)

            if not os.path.exists(parquet_path):
                span.set_attribute("error", True)
                span.set_attribute("error.message", f"Parquet file not found: {parquet_path}")
                logger.warning("Parquet file does not exist: %s", parquet_path)
                return []

            if lap_number is None:
                # Find fastest lap number
                find_fastest_sql = """
                    SELECT lap_number 
                    FROM read_parquet(?) 
                    WHERE lap_time_seconds > 0 
                    ORDER BY lap_time_seconds ASC 
                    LIMIT 1
                """
                res = self.conn.execute(find_fastest_sql, [parquet_path]).fetchone()
                lap_number = res[0] if res else 1

            span.set_attribute("f1.lap_number", lap_number)

            query_sql = """
                SELECT 
                    lap_number,
                    lap_time_seconds,
                    compound,
                    tyre_life,
                    distance,
                    speed,
                    throttle,
                    brake,
                    rpm,
                    gear,
                    drs,
                    x,
                    y,
                    time_seconds,
                    g_lat,
                    g_long,
                    pressure_fl,
                    pressure_fr,
                    pressure_rl,
                    pressure_rr,
                    temp_fl,
                    temp_fr,
                    temp_rl,
                    temp_rr,
                    wear_pct
                FROM read_parquet(?)
                WHERE lap_number = ?
                ORDER BY distance ASC
            """
            span.set_attribute("db.statement", query_sql.strip())
            df = self.conn.execute(query_sql, [parquet_path, lap_number]).df()
            return df.to_dict(orient="records")

    def compare_driver_corners(
        self,
        year: int,
        circuit: str,
        session: str,
        driver_a: str,
        driver_b: str,
        lap_number: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Performs distance-aligned telemetry delta comparison between two drivers.
        Calculates speed delta (A - B), throttle/brake overlays, and time delta.
        """
        driver_a_code = driver_a.upper()
        driver_b_code = driver_b.upper()
        path_a = self._get_driver_parquet_path(year, circuit, session, driver_a_code)
        path_b = self._get_driver_parquet_path(year, circuit, session, driver_b_code)

        with self.tracer.start_as_current_span("duckdb.query") as span:
            span.set_attribute("db.system", "duckdb")
            span.set_attribute("db.operation", "JOIN_SELECT")
            span.set_attribute("f1.year", year)
            span.set_attribute("f1.circuit", circuit.lower())
            span.set_attribute("f1.session", session.upper())
            span.set_attribute("f1.driver_a", driver_a_code)
            span.set_attribute("f1.driver_b", driver_b_code)

            if not os.path.exists(path_a) or not os.path.exists(path_b):
                missing = [p for p in (path_a, path_b) if not os.path.exists(p)]
                span.set_attribute("error", True)
                span.set_attribute("error.message", f"Missing parquet files: {missing}")
                logger.warning("Missing parquet files for comparison: %s", missing)
                return []

            # If lap_number not provided, find fastest lap for driver A
            if lap_number is None:
                fastest_sql = "SELECT lap_number FROM read_parquet(?) ORDER BY lap_time_seconds ASC LIMIT 1"
                res = self.conn.execute(fastest_sql, [path_a]).fetchone()
                lap_number = res[0] if res else 1

            span.set_attribute("f1.lap_number", lap_number)

            comparison_sql = """
                SELECT 
                    a.distance,
                    a.speed AS speed_a,
                    b.speed AS speed_b,
                    ROUND(a.speed - b.speed, 2) AS speed_delta,
                    a.throttle AS throttle_a,
                    b.throttle AS throttle_b,
                    a.brake AS brake_a,
                    b.brake AS brake_b,
                    a.gear AS gear_a,
                    b.gear AS gear_b,
                    a.time_seconds AS time_a,
                    b.time_seconds AS time_b,
                    ROUND(a.time_seconds - b.time_seconds, 3) AS time_delta,
                    a.x AS x_a,
                    a.y AS y_a,
                    b.x AS x_b,
                    b.y AS y_b,
                    a.g_lat AS g_lat_a,
                    b.g_lat AS g_lat_b
                FROM (
                    SELECT * FROM read_parquet(?) WHERE lap_number = ?
                ) a
                INNER JOIN (
                    SELECT * FROM read_parquet(?) WHERE lap_number = ?
                ) b ON ABS(a.distance - b.distance) < 0.5
                ORDER BY a.distance ASC
            """
            span.set_attribute("db.statement", comparison_sql.strip())
            df = self.conn.execute(comparison_sql, [path_a, lap_number, path_b, lap_number]).df()
            return df.to_dict(orient="records")

    def get_stint_tire_history(
        self,
        year: int,
        circuit: str,
        session: str,
        driver: str,
    ) -> List[Dict[str, Any]]:
        """
        Aggregates per-lap virtual tire thermal, pressure, and wear state across all stint laps.
        """
        driver_code = driver.upper()
        parquet_path = self._get_driver_parquet_path(year, circuit, session, driver_code)

        with self.tracer.start_as_current_span("duckdb.query") as span:
            span.set_attribute("db.system", "duckdb")
            span.set_attribute("db.operation", "AGGREGATE_SELECT")
            span.set_attribute("f1.year", year)
            span.set_attribute("f1.circuit", circuit.lower())
            span.set_attribute("f1.session", session.upper())
            span.set_attribute("f1.driver", driver_code)

            if not os.path.exists(parquet_path):
                span.set_attribute("error", True)
                span.set_attribute("error.message", f"Parquet not found: {parquet_path}")
                return []

            stint_sql = """
                SELECT 
                    lap_number,
                    compound,
                    tyre_life,
                    lap_time_seconds,
                    ROUND(AVG(pressure_fl), 2) AS avg_pressure_fl,
                    ROUND(AVG(pressure_fr), 2) AS avg_pressure_fr,
                    ROUND(AVG(pressure_rl), 2) AS avg_pressure_rl,
                    ROUND(AVG(pressure_rr), 2) AS avg_pressure_rr,
                    ROUND(AVG(temp_fl), 1) AS avg_temp_fl,
                    ROUND(AVG(temp_fr), 1) AS avg_temp_fr,
                    ROUND(AVG(temp_rl), 1) AS avg_temp_rl,
                    ROUND(AVG(temp_rr), 1) AS avg_temp_rr,
                    ROUND(MAX(wear_pct), 1) AS max_wear_pct
                FROM read_parquet(?)
                GROUP BY lap_number, compound, tyre_life, lap_time_seconds
                ORDER BY lap_number ASC
            """
            span.set_attribute("db.statement", stint_sql.strip())
            df = self.conn.execute(stint_sql, [parquet_path]).df()
            return df.to_dict(orient="records")

