"""API router exposing F1 telemetry ingestion, head-to-head comparison, and virtual tire endpoints."""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.db.duckdb_client import DuckDBManager
from app.services.telemetry import TelemetryService

logger = logging.getLogger("pitwall.api.telemetry")

router = APIRouter(prefix="/api/v1", tags=["F1 Telemetry & Analytics"])

telemetry_service = TelemetryService()
duckdb_manager = DuckDBManager()


class IngestSessionRequest(BaseModel):
    year: int = Field(default=2024, ge=2018, le=2026, description="Championship season year")
    circuit: str = Field(default="monza", description="Circuit identifier or Grand Prix name")
    session_name: str = Field(default="R", description="Session code: FP1, FP2, FP3, Q, SQ, R")
    drivers: Optional[List[str]] = Field(
        default=["VER", "NOR", "HAM", "LEC"],
        description="Target driver 3-letter codes to ingest and process",
    )


class IngestSessionResponse(BaseModel):
    status: str
    year: int
    circuit: str
    session: str
    partition_directory: str
    drivers_ingested: List[str]


class TelemetryCompareResponse(BaseModel):
    year: int
    circuit: str
    session: str
    driver_a: str
    driver_b: str
    lap_number: int
    points_count: int
    data: List[Dict[str, Any]]


class TireMetricsResponse(BaseModel):
    year: int
    circuit: str
    session: str
    driver: str
    stint_laps: int
    history: List[Dict[str, Any]]


@router.post(
    "/sessions/ingest",
    response_model=IngestSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest and normalize F1 session telemetry",
)
async def ingest_session(request: IngestSessionRequest):
    """
    Downloads raw session telemetry via FastF1 (with disk caching), resamples channels
    along a uniform 1m distance grid, executes the Virtual Tire Model, and saves
    partitioned Apache Parquet files in data/lakehouse/.
    """
    try:
        result = telemetry_service.ingest_session(
            year=request.year,
            circuit=request.circuit,
            session_name=request.session_name,
            target_drivers=request.drivers,
        )
        return IngestSessionResponse(**result)
    except Exception as e:
        logger.error("Failed to ingest session: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session ingestion failure: {str(e)}",
        )


@router.get(
    "/telemetry/compare",
    response_model=TelemetryCompareResponse,
    status_code=status.HTTP_200_OK,
    summary="Distance-aligned head-to-head telemetry comparison",
)
async def compare_telemetry(
    year: int = Query(default=2024, ge=2018, le=2026),
    circuit: str = Query(default="monza"),
    session: str = Query(default="R"),
    driver_a: str = Query(default="VER", description="First driver code (e.g. VER)"),
    driver_b: str = Query(default="NOR", description="Second driver code (e.g. NOR)"),
    lap_number: Optional[int] = Query(default=None, description="Specific lap index (defaults to fastest)"),
):
    """
    Executes an in-process DuckDB JOIN query over Parquet partitions to produce
    synchronized speed delta, throttle/brake overlay, time delta, and trajectory coordinates.
    """
    # Auto-ingest fallback if partition does not yet exist
    points = duckdb_manager.compare_driver_corners(
        year=year,
        circuit=circuit,
        session=session,
        driver_a=driver_a,
        driver_b=driver_b,
        lap_number=lap_number,
    )

    if not points:
        # Trigger ingestion on demand
        logger.info("Telemetry not found for comparison. Running on-demand ingestion...")
        telemetry_service.ingest_session(
            year=year,
            circuit=circuit,
            session_name=session,
            target_drivers=[driver_a, driver_b],
        )
        points = duckdb_manager.compare_driver_corners(
            year=year,
            circuit=circuit,
            session=session,
            driver_a=driver_a,
            driver_b=driver_b,
            lap_number=lap_number,
        )

    resolved_lap = lap_number if lap_number is not None else 1

    return TelemetryCompareResponse(
        year=year,
        circuit=circuit.lower(),
        session=session.upper(),
        driver_a=driver_a.upper(),
        driver_b=driver_b.upper(),
        lap_number=resolved_lap,
        points_count=len(points),
        data=points,
    )


@router.get(
    "/telemetry/tires",
    response_model=TireMetricsResponse,
    status_code=status.HTTP_200_OK,
    summary="Virtual tire pressure, temperature, and wear matrices",
)
async def get_tire_metrics(
    year: int = Query(default=2024, ge=2018, le=2026),
    circuit: str = Query(default="monza"),
    session: str = Query(default="R"),
    driver: str = Query(default="VER", description="Driver 3-letter code (e.g. VER)"),
):
    """
    Returns 4-wheel dynamic pressure, thermal load, and fuel-corrected wear trajectory
    derived from lateral G-force and braking deceleration across the stint.
    """
    history = duckdb_manager.get_stint_tire_history(
        year=year,
        circuit=circuit,
        session=session,
        driver=driver,
    )

    if not history:
        # Trigger on-demand ingestion if needed
        logger.info("Tire metrics not found. Running on-demand ingestion...")
        telemetry_service.ingest_session(
            year=year,
            circuit=circuit,
            session_name=session,
            target_drivers=[driver],
        )
        history = duckdb_manager.get_stint_tire_history(
            year=year,
            circuit=circuit,
            session=session,
            driver=driver,
        )

    return TireMetricsResponse(
        year=year,
        circuit=circuit.lower(),
        session=session.upper(),
        driver=driver.upper(),
        stint_laps=len(history),
        history=history,
    )

