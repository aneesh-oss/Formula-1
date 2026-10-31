"""API router for circuit geometry, sector splits, and vehicle dynamics health."""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Path, Query, status

from app.services.car_health import CarHealthService
from app.services.timing_service import TimingService

logger = logging.getLogger("pitwall.api.dashboard")

router = APIRouter(prefix="/api/v1", tags=["Dashboard, Dynamics & Timing"])

timing_service = TimingService()
car_health_service = CarHealthService()


@router.get(
    "/circuits/{circuit_name}/map",
    status_code=status.HTTP_200_OK,
    summary="Get circuit track coordinates, turns, and sector boundaries",
)
async def get_circuit_map(
    circuit_name: str = Path(..., description="Circuit identifier (e.g. monza, silverstone)")
):
    """
    Returns normalized (X, Y) circuit track coordinates, turn metadata,
    and sector 1, 2, 3 distance boundaries for interactive rendering.
    """
    return timing_service.get_circuit_geometry(circuit_name=circuit_name)


@router.get(
    "/sessions/{session_id}/sectors",
    status_code=status.HTTP_200_OK,
    summary="Get sector split timings and pit stop telemetry per lap",
)
async def get_session_sectors(
    session_id: str = Path(..., description="Unique session identifier, e.g. 2024_monza_R"),
    driver: str = Query(default="VER", description="Driver 3-letter code (e.g. VER, NOR)"),
):
    """
    Returns lap-by-lap Sector 1, 2, and 3 split times with purple (session best)
    and green (driver personal best) flags, along with pit stop duration and compound changes.
    """
    return timing_service.get_session_sectors(session_id=session_id, driver=driver)


@router.get(
    "/telemetry/{driver}/health",
    status_code=status.HTTP_200_OK,
    summary="Get real-time 4-wheel tire grip state, brake disc temps, and clutch status",
)
async def get_vehicle_health(
    driver: str = Path(..., description="Driver 3-letter code (e.g. VER, NOR, LEC)"),
    stint_lap: int = Query(default=14, ge=1, le=75, description="Current stint lap count"),
    compound: str = Query(default="MEDIUM", description="Active tire compound (SOFT, MEDIUM, HARD)"),
    speed_kmh: float = Query(default=240.0, ge=0.0, le=380.0, description="Instantaneous vehicle speed"),
    brake_pct: float = Query(default=0.0, ge=0.0, le=100.0, description="Brake pedal application %"),
    lateral_g: float = Query(default=2.4, ge=0.0, le=6.0, description="Instantaneous lateral cornering load"),
):
    """
    Calculates four-wheel dynamic grip states, wear percentages, brake disc heat spikes,
    clutch slip indices, and UI color codes (Green -> Yellow -> Red) for the vehicle HUD.
    """
    return car_health_service.get_vehicle_health(
        driver=driver,
        stint_lap=stint_lap,
        compound=compound,
        speed_kmh=speed_kmh,
        brake_pct=brake_pct,
        lateral_g=lateral_g,
    )
