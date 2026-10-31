"""OpenTelemetry instrumentation, tracing, and metric setup for PitWall OS."""

import logging
import os
from typing import Dict, Iterable, Tuple

from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.metrics import CallbackOptions, Observation
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

logger = logging.getLogger("pitwall.telemetry")

# In-memory store for observable metric callbacks
# Key: (driver, tire_corner, compound) -> Value: float
_tire_pressures_store: Dict[Tuple[str, str, str], float] = {}
_tire_wear_store: Dict[Tuple[str, str, str], float] = {}


def _observe_tire_pressures(options: CallbackOptions) -> Iterable[Observation]:
    """Callback for f1.tire.pressure_psi observable gauge."""
    observations = []
    for (driver, corner, compound), pressure in _tire_pressures_store.items():
        observations.append(
            Observation(
                value=float(pressure),
                attributes={
                    "driver": driver,
                    "tire_corner": corner,
                    "compound": compound,
                },
            )
        )
    return observations


def _observe_tire_wear(options: CallbackOptions) -> Iterable[Observation]:
    """Callback for f1.tire.wear_pct observable gauge."""
    observations = []
    for (driver, corner, compound), wear in _tire_wear_store.items():
        observations.append(
            Observation(
                value=float(wear),
                attributes={
                    "driver": driver,
                    "tire_corner": corner,
                    "compound": compound,
                },
            )
        )
    return observations


def record_tire_metrics(
    driver: str,
    corner: str,
    compound: str,
    pressure_psi: float,
    wear_pct: float,
) -> None:
    """Updates in-memory gauge state for OpenTelemetry collection."""
    key = (driver.upper(), corner.upper(), compound.upper())
    _tire_pressures_store[key] = pressure_psi
    _tire_wear_store[key] = wear_pct


def setup_telemetry(app) -> None:
    """Configures TracerProvider, MeterProvider, and instruments the FastAPI app."""
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4318")
    traces_endpoint = f"{otlp_endpoint.rstrip('/')}/v1/traces"
    metrics_endpoint = f"{otlp_endpoint.rstrip('/')}/v1/metrics"

    resource = Resource.create(
        {
            "service.name": "pitwall-backend",
            "service.namespace": "pitwall-os",
            "service.version": "0.1.0",
            "deployment.environment": os.getenv("ENVIRONMENT", "development"),
        }
    )

    # 1. Tracing Setup
    tracer_provider = TracerProvider(resource=resource)
    span_exporter = OTLPSpanExporter(
        endpoint=traces_endpoint,
        timeout=5,
    )
    tracer_provider.add_span_processor(BatchSpanProcessor(span_exporter))
    trace.set_tracer_provider(tracer_provider)

    # 2. Metrics Setup
    metric_exporter = OTLPMetricExporter(
        endpoint=metrics_endpoint,
        timeout=5,
    )
    metric_reader = PeriodicExportingMetricReader(
        metric_exporter,
        export_interval_millis=5000,
    )
    meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
    metrics.set_meter_provider(meter_provider)

    # 3. Register Custom Formula 1 Observable Gauges
    meter = metrics.get_meter("pitwall.f1.metrics", version="0.1.0")
    meter.create_observable_gauge(
        name="f1.tire.pressure_psi",
        description="Dynamic tire internal pressure in PSI modeled per corner",
        unit="psi",
        callbacks=[_observe_tire_pressures],
    )
    meter.create_observable_gauge(
        name="f1.tire.wear_pct",
        description="Modeled tire degradation and wear percentage",
        unit="%",
        callbacks=[_observe_tire_wear],
    )

    # 4. Instrument FastAPI App
    FastAPIInstrumentor.instrument_app(
        app,
        tracer_provider=tracer_provider,
        meter_provider=meter_provider,
        excluded_urls="health,metrics",
    )

    logger.info("OpenTelemetry successfully initialized targeting %s", otlp_endpoint)


def get_tracer(name: str = "pitwall.engine"):
    """Convenience getter for the active tracer."""
    return trace.get_tracer(name)

