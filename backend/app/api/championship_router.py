"""API router for Formula 1 Driver and Constructor championship standings."""

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Query, status
from pydantic import BaseModel

from app.services.championship import ChampionshipService

logger = logging.getLogger("pitwall.api.championship")

router = APIRouter(prefix="/api/v1/championship", tags=["Championship & Historical Standings"])

championship_service = ChampionshipService()


class DriverStandingItem(BaseModel):
    position: int
    driver: str
    code: str
    constructor: str
    points: float
    wins: int
    nationality: str


class ConstructorStandingItem(BaseModel):
    position: int
    constructor: str
    points: float
    wins: int
    nationality: str


class DriverStandingsResponse(BaseModel):
    year: int
    total_drivers: int
    standings: List[DriverStandingItem]


class ConstructorStandingsResponse(BaseModel):
    year: int
    total_constructors: int
    standings: List[ConstructorStandingItem]


@router.get(
    "/seasons",
    response_model=List[int],
    status_code=status.HTTP_200_OK,
    summary="List available F1 World Championship seasons",
)
async def get_seasons():
    """Returns chronological list of all F1 seasons from 1950 to present."""
    return championship_service.get_available_seasons()


@router.get(
    "/standings/drivers",
    response_model=DriverStandingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Driver World Championship rankings by season",
)
async def get_driver_standings(
    year: int = Query(default=2024, ge=1950, le=2026, description="Championship season year")
):
    """
    Returns the official World Drivers' Championship standings, points, wins,
    and finishing positions for any specified year.
    """
    standings = championship_service.get_driver_standings(year)
    return DriverStandingsResponse(
        year=year,
        total_drivers=len(standings),
        standings=standings,
    )


@router.get(
    "/standings/constructors",
    response_model=ConstructorStandingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Constructor / Manufacturer World Championship rankings by season",
)
async def get_constructor_standings(
    year: int = Query(default=2024, ge=1950, le=2026, description="Championship season year")
):
    """
    Returns the official World Constructors' (Manufacturer) Championship standings,
    points, and rankings for any specified year.
    """
    standings = championship_service.get_constructor_standings(year)
    return ConstructorStandingsResponse(
        year=year,
        total_constructors=len(standings),
        standings=standings,
    )

