"""API router for dynamic circuit geometry, 3D splines, and FastF1 track corners."""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Path, Query, status

from app.services.circuit_service import CircuitService
from app.telemetry import get_tracer

logger = logging.getLogger("pitwall.api.circuits")

router = APIRouter(prefix="/api/v1/circuits", tags=["Circuits & 3D Geometry"])

circuit_service = CircuitService()
tracer = get_tracer("pitwall.api.circuits")


@router.get(
    "/{year}/{circuit}/geometry",
    status_code=status.HTTP_200_OK,
    summary="Get dynamic 3D circuit geometry, rotated spline, and official corner coordinates",
)
async def get_circuit_geometry(
    year: int = Path(..., ge=1950, le=2026, description="Championship year (e.g. 2024)"),
    circuit: str = Path(..., description="Circuit identifier (e.g. monza, silverstone, spa, suzuka)"),
    session_type: str = Query(default="R", description="Session type: FP1, FP2, FP3, Q, SQ, R"),
) -> Dict[str, Any]:
    """
    Returns authentic 3D circuit spline points, normalized for WebGL canvas rendering,
    exact sector split distance boundaries (S1, S2, S3), and interactive corner pins
    extracted dynamically via FastF1 session.get_circuit_info().
    """
    with tracer.start_as_current_span("fastf1.circuit_info") as span:
        span.set_attribute("f1.year", year)
        span.set_attribute("f1.circuit", circuit.lower())
        span.set_attribute("f1.session", session_type)

        return circuit_service.get_circuit_geometry(
            year=year,
            circuit_name=circuit,
            session_type=session_type,
        )

