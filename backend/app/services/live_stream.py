"""Live race data ingestion service connecting to real-time F1 streams and in-memory DuckDB."""

import asyncio
import datetime
import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional, Set

import duckdb
import httpx
from app.services.car_health import CarHealthService
from app.telemetry import get_tracer

logger = logging.getLogger("pitwall.services.live_stream")


class LiveStreamService:
    """
    Ingests live race telemetry from OpenF1 REST API, updates 4-wheel tire degradation,
    commits records to an in-memory DuckDB table, and broadcasts Server-Sent Events (SSE).
    """

    def __init__(self, db_conn: Optional[duckdb.DuckDBPyConnection] = None):
        self.tracer = get_tracer("pitwall.live_stream")
        self.car_health_service = CarHealthService()
        self.conn = db_conn or duckdb.connect(database=":memory:", read_only=False)
        self.subscribers: Set[asyncio.Queue] = set()
        self._init_duckdb_schema()

        # Driver state tracking
        self.driver_stints: Dict[str, Dict[str, Any]] = {
            "VER": {"stint_lap": 18, "compound": "MEDIUM", "laps_completed": 23, "gap": "LEADER"},
            "NOR": {"stint_lap": 18, "compound": "MEDIUM", "laps_completed": 23, "gap": "+1.42s"},
            "LEC": {"stint_lap": 24, "compound": "HARD", "laps_completed": 24, "gap": "+4.18s"},
            "HAM": {"stint_lap": 12, "compound": "HARD", "laps_completed": 23, "gap": "+7.85s"},
            "PIA": {"stint_lap": 18, "compound": "MEDIUM", "laps_completed": 23, "gap": "+11.20s"},
        }
        self.processed_lap_keys: Set[str] = set()
        self.current_lap = 24
        self.track_status = "GREEN"
        self._worker_task: Optional[asyncio.Task] = None
        self._is_running = False

    def _init_duckdb_schema(self):
        """Initializes the in-memory DuckDB analytical table for live race telemetry."""
        with self.tracer.start_as_current_span("duckdb.init_live_schema") as span:
            span.set_attribute("db.system", "duckdb")
            span.set_attribute("db.table", "live_race_telemetry")
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS live_race_telemetry (
                    timestamp TIMESTAMP,
                    driver VARCHAR,
                    lap_number INTEGER,
                    duration_sector_1 DOUBLE,
                    duration_sector_2 DOUBLE,
                    duration_sector_3 DOUBLE,
                    lap_duration DOUBLE,
                    gap_to_leader VARCHAR,
                    stint_lap INTEGER,
                    compound VARCHAR,
                    fl_wear DOUBLE,
                    fr_wear DOUBLE,
                    rl_wear DOUBLE,
                    rr_wear DOUBLE,
                    tire_state VARCHAR
                )
                """
            )
            logger.info("Initialized in-memory DuckDB table 'live_race_telemetry'.")

    async def subscribe(self) -> AsyncGenerator[str, None]:
        """Subscribes a client to the real-time event stream."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self.subscribers.add(queue)
        logger.info("New SSE client subscribed. Total active listeners: %d", len(self.subscribers))

        try:
            # Send initial sync event
            initial_event = {
                "event": "STREAM_CONNECTED",
                "lap_number": self.current_lap,
                "track_status": self.track_status,
                "drivers": list(self.driver_stints.keys()),
                "timestamp": datetime.datetime.utcnow().isoformat(),
            }
            yield f"data: {json.dumps(initial_event)}\n\n"

            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            self.subscribers.discard(queue)
            logger.info("SSE client disconnected. Remaining listeners: %d", len(self.subscribers))

    async def broadcast(self, payload: Dict[str, Any]):
        """Dispatches event to all connected Server-Sent Events subscribers."""
        dead_queues = []
        for queue in list(self.subscribers):
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                dead_queues.append(queue)
        for dead in dead_queues:
            self.subscribers.discard(dead)

    async def process_lap_event(
        self,
        driver: str,
        lap_number: int,
        s1: float,
        s2: float,
        s3: float,
        gap_to_leader: str = "+0.00s",
        compound: Optional[str] = None,
    ):
        """Processes a single completed lap event, evaluates tire health, and inserts into DuckDB."""
        driver_code = driver.upper()
        lap_key = f"{driver_code}_{lap_number}"

        if lap_key in self.processed_lap_keys:
            return
        self.processed_lap_keys.add(lap_key)

        # Update driver stint state
        driver_state = self.driver_stints.setdefault(
            driver_code,
            {"stint_lap": 1, "compound": compound or "MEDIUM", "laps_completed": lap_number, "gap": gap_to_leader},
        )
        if compound:
            driver_state["compound"] = compound.upper()
        driver_state["stint_lap"] += 1
        driver_state["laps_completed"] = lap_number
        driver_state["gap"] = gap_to_leader

        # Compute dynamic vehicle health
        health = self.car_health_service.get_vehicle_health(
            driver=driver_code,
            stint_lap=driver_state["stint_lap"],
            compound=driver_state["compound"],
        )
        tires = health.get("tires", {})
        fl_wear = tires.get("FL", {}).get("wear_percentage", 25.0)
        fr_wear = tires.get("FR", {}).get("wear_percentage", 22.0)
        rl_wear = tires.get("RL", {}).get("wear_percentage", 24.0)
        rr_wear = tires.get("RR", {}).get("wear_percentage", 21.0)
        primary_tire_state = tires.get("FL", {}).get("status", "OPTIMAL")

        lap_total = round(s1 + s2 + s3, 3)
        now = datetime.datetime.utcnow()

        # Wrap ingestion tick in OpenTelemetry custom span
        with self.tracer.start_as_current_span("live.lap_tick") as span:
            span.set_attribute("f1.driver", driver_code)
            span.set_attribute("f1.lap_number", lap_number)
            span.set_attribute("f1.leader", "VER" if gap_to_leader == "LEADER" else "VER")
            span.set_attribute("f1.track_status", self.track_status)
            span.set_attribute("f1.lap_duration", lap_total)

            # Commit to DuckDB in-memory table
            self.conn.execute(
                """
                INSERT INTO live_race_telemetry VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    now,
                    driver_code,
                    lap_number,
                    s1,
                    s2,
                    s3,
                    lap_total,
                    gap_to_leader,
                    driver_state["stint_lap"],
                    driver_state["compound"],
                    fl_wear,
                    fr_wear,
                    rl_wear,
                    rr_wear,
                    primary_tire_state,
                ],
            )

        # Broadcast SSE event
        event_payload = {
            "event": "LAP_COMPLETE",
            "driver": driver_code,
            "lap_number": lap_number,
            "gap_to_leader": gap_to_leader,
            "sector_times": {"s1": s1, "s2": s2, "s3": s3, "lap_time": lap_total},
            "tire_status": {
                "compound": driver_state["compound"],
                "stint_lap": driver_state["stint_lap"],
                "fl_wear": fl_wear,
                "fr_wear": fr_wear,
                "rl_wear": rl_wear,
                "rr_wear": rr_wear,
                "state": primary_tire_state,
            },
            "timestamp": now.isoformat(),
        }

        await self.broadcast(event_payload)
        logger.info(
            "Live Lap Tick: [%s] Lap %d (%.3fs) Gap: %s | Tires: FL=%.1f%% (%s)",
            driver_code,
            lap_number,
            lap_total,
            gap_to_leader,
            fl_wear,
            primary_tire_state,
        )

    async def fetch_openf1_data(self, client: httpx.AsyncClient) -> bool:
        """Attempts to ingest active live session laps from OpenF1 API."""
        try:
            laps_url = "https://api.openf1.org/v1/laps?session_key=latest"
            intervals_url = "https://api.openf1.org/v1/intervals?session_key=latest"

            res_laps = await client.get(laps_url, timeout=4.0)
            if res_laps.status_code == 200:
                laps_data = res_laps.json()
                if laps_data and isinstance(laps_data, list):
                    # Fetch intervals mapping
                    intervals_map: Dict[int, str] = {}
                    try:
                        res_int = await client.get(intervals_url, timeout=3.0)
                        if res_int.status_code == 200:
                            for item in res_int.json():
                                d_num = item.get("driver_number")
                                gap = item.get("gap_to_leader")
                                if d_num and gap is not None:
                                    intervals_map[d_num] = f"+{gap}s" if float(gap) > 0 else "LEADER"
                    except Exception:
                        pass

                    # Process the newest 5 completed laps
                    recent_laps = [
                        l
                        for l in laps_data
                        if l.get("lap_number")
                        and l.get("duration_sector_1")
                        and l.get("duration_sector_2")
                        and l.get("duration_sector_3")
                    ][-5:]

                    if recent_laps:
                        for lap in recent_laps:
                            driver_num = lap.get("driver_number", 1)
                            # Driver number lookup
                            num_to_code = {1: "VER", 4: "NOR", 16: "LEC", 44: "HAM", 81: "PIA", 55: "SAI", 63: "RUS"}
                            driver_code = num_to_code.get(driver_num, f"D{driver_num}")
                            gap = intervals_map.get(driver_num, "+2.1s")

                            await self.process_lap_event(
                                driver=driver_code,
                                lap_number=lap["lap_number"],
                                s1=float(lap["duration_sector_1"]),
                                s2=float(lap["duration_sector_2"]),
                                s3=float(lap["duration_sector_3"]),
                                gap_to_leader=gap,
                            )
                        return True
        except Exception as exc:
            logger.debug("OpenF1 live fetch unfulfilled (%s), continuing with simulator stream.", str(exc))
        return False

    async def _run_stream_loop(self):
        """Asynchronous background loop polling OpenF1 with autonomous fallback simulation."""
        logger.info("Starting LiveStreamService ingestion loop...")
        self._is_running = True

        async with httpx.AsyncClient(timeout=5.0) as client:
            while self._is_running:
                # 1. Attempt live query to OpenF1
                success = await self.fetch_openf1_data(client)

                # 2. If OpenF1 has no active race on track, simulate realistic sequential race progression
                if not success:
                    self.current_lap += 1
                    # Progress top cars through lap completion
                    lap_schedule = [
                        ("VER", 24.120, 27.850, 26.940, "LEADER"),
                        ("NOR", 24.210, 27.910, 27.020, "+1.42s"),
                        ("LEC", 24.450, 28.120, 27.180, "+4.18s"),
                        ("HAM", 24.380, 28.050, 27.110, "+7.85s"),
                    ]

                    for driver_code, s1, s2, s3, gap in lap_schedule:
                        await self.process_lap_event(
                            driver=driver_code,
                            lap_number=self.current_lap,
                            s1=s1,
                            s2=s2,
                            s3=s3,
                            gap_to_leader=gap,
                        )
                        # Micro delay between car crossings
                        await asyncio.sleep(0.8)

                # Poll cadence: 4 seconds between lap checkpoints
                await asyncio.sleep(4.0)

    def start(self):
        """Starts the background ingestion worker."""
        if not self._worker_task or self._worker_task.done():
            self._worker_task = asyncio.create_task(self._run_stream_loop())
            logger.info("LiveStreamService background worker task started.")

    def stop(self):
        """Stops the background ingestion worker."""
        self._is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            logger.info("LiveStreamService background worker task stopped.")


# Singleton instance for application-wide sharing
live_stream_service = LiveStreamService()

