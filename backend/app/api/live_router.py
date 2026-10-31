"""Server-Sent Events (SSE) and live telemetry router for real-time race data streams."""

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, status
from fastapi.responses import StreamingResponse

from app.services.live_stream import live_stream_service
from app.services.qualifying_service import qualifying_service
from app.telemetry import get_tracer

logger = logging.getLogger("pitwall.api.live")
router = APIRouter(prefix="/api/v1/live", tags=["Live Race Ingestion"])
tracer = get_tracer("pitwall.api.live")


@router.get(
    "/stream",
    summary="Subscribe to Real-Time Race Event Stream (SSE)",
    description="Streams real-time Server-Sent Events (SSE) including lap completions, sector splits, interval gaps, and dynamic 4-wheel tire degradation.",
    status_code=status.HTTP_200_OK,
)
async def live_race_stream():
    """
    Server-Sent Events endpoint pushing real-time F1 race events.
    Format:
    ```
    data: {"event": "LAP_COMPLETE", "driver": "VER", "lap_number": 24, "gap_to_leader": "+1.42s", "tire_status": {...}}
    ```
    """
    with tracer.start_as_current_span("sse.client_connect") as span:
        span.set_attribute("sse.transport", "server_sent_events")
        span.set_attribute("sse.endpoint", "/api/v1/live/stream")

    return StreamingResponse(
        live_stream_service.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/latest",
    summary="Retrieve Latest Live In-Memory Telemetry",
    description="Queries the in-process DuckDB 'live_race_telemetry' table for recent lap ticks.",
    status_code=status.HTTP_200_OK,
)
async def get_latest_live_telemetry(limit: int = 10) -> Dict[str, Any]:
    """Retrieves recent live telemetry records committed to DuckDB."""
    with tracer.start_as_current_span("duckdb.query_live_telemetry") as span:
        span.set_attribute("db.system", "duckdb")
        span.set_attribute("db.table", "live_race_telemetry")

        res = live_stream_service.conn.execute(
            """
            SELECT
                timestamp,
                driver,
                lap_number,
                duration_sector_1,
                duration_sector_2,
                duration_sector_3,
                lap_duration,
                gap_to_leader,
                stint_lap,
                compound,
                fl_wear,
                fr_wear,
                rl_wear,
                rr_wear,
                tire_state
            FROM live_race_telemetry
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            [limit],
        ).fetchall()

        columns = [
            "timestamp",
            "driver",
            "lap_number",
            "s1",
            "s2",
            "s3",
            "lap_time",
            "gap_to_leader",
            "stint_lap",
            "compound",
            "fl_wear",
            "fr_wear",
            "rl_wear",
            "rr_wear",
            "tire_state",
        ]

        records = [dict(zip(columns, row)) for row in res]
        return {
            "status": "success",
            "count": len(records),
            "track_status": live_stream_service.track_status,
            "current_lap": live_stream_service.current_lap,
            "data": records,
        }


@router.get(
    "/qualifying",
    summary="Retrieve Full F1 Qualifying Session Tower & Elimination Drops",
    description="Returns official Q1, Q2, or Q3 driver standings with sector splits, timing gaps, tyre compounds, and elimination cut-offs.",
    status_code=status.HTTP_200_OK,
)
async def get_qualifying_leaderboard(phase: str = "Q3") -> Dict[str, Any]:
    """Returns the official qualifying session timing tower for Q1, Q2, or Q3 with knocked-out drivers."""
    with tracer.start_as_current_span("qualifying.standings") as span:
        span.set_attribute("f1.session", "qualifying")
        span.set_attribute("f1.phase", phase.upper())

    return qualifying_service.get_qualifying_standings(phase=phase)


