"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, AlertTriangle, ArrowUpRight, Box, Clock, Compass, Eye, MapPin, ShieldAlert, Zap } from "lucide-react";
import CarHealthHUD from "@/components/CarHealthHUD";
import TelemetryChart from "@/components/TelemetryChart";
import TrackMap from "@/components/TrackMap";
import {
  CarHealthResponse,
  CompareResponse,
  fetchSessionSectors,
  fetchTelemetryCompare,
  fetchTireMetrics,
  fetchVehicleHealth,
  SessionSectorsResponse,
  TireResponse,
} from "@/lib/api";

// Client-only dynamic imports for Three.js Canvas components to eliminate SSR hydration errors
const CarHealth3D = dynamic(() => import("@/components/3d/CarHealth3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 w-full items-center justify-center rounded-xl border border-pitwall-border bg-pitwall-panel font-mono text-xs text-gray-500">
      Loading 3D WebGL Vehicle Dynamics HUD...
    </div>
  ),
});

const TrackMap3D = dynamic(() => import("@/components/3d/TrackMap3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-xl border border-pitwall-border bg-pitwall-panel font-mono text-xs text-gray-500">
      Loading 3D Spline Track Ribbon...
    </div>
  ),
});

const CIRCUITS = [
  { slug: "monza", name: "Italian Grand Prix — Monza", country: "Italy", len: "5.793 km" },
  { slug: "silverstone", name: "British Grand Prix — Silverstone", country: "UK", len: "5.891 km" },
  { slug: "spa", name: "Belgian Grand Prix — Spa-Francorchamps", country: "Belgium", len: "7.004 km" },
  { slug: "suzuka", name: "Japanese Grand Prix — Suzuka", country: "Japan", len: "5.807 km" },
  { slug: "monaco", name: "Monaco Grand Prix — Monte Carlo", country: "Monaco", len: "3.337 km" },
  { slug: "spielberg", name: "Austrian Grand Prix — Red Bull Ring", country: "Austria", len: "4.318 km" },
  { slug: "zandvoort", name: "Dutch Grand Prix — Zandvoort", country: "Netherlands", len: "4.259 km" },
  { slug: "sao_paulo", name: "São Paulo Grand Prix — Interlagos", country: "Brazil", len: "4.309 km" },
];

export default function TelemetryDashboard() {
  const [selectedCircuit, setSelectedCircuit] = useState("spielberg");
  const [selectedYear, setSelectedYear] = useState(2024);
  const [driverA, setDriverA] = useState("VER");
  const [driverB, setDriverB] = useState("NOR");
  const [viewMode, setViewMode] = useState<"3D" | "2D">("2D");
  const [telemetryData, setTelemetryData] = useState<CompareResponse | null>(null);
  const [tireData, setTireData] = useState<TireResponse | null>(null);
  const [carHealth, setCarHealth] = useState<CarHealthResponse | null>(null);
  const [sectorData, setSectorData] = useState<SessionSectorsResponse | null>(null);
  const [activeScrubIdx, setActiveScrubIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const activeCircuitMeta = CIRCUITS.find((c) => c.slug === selectedCircuit) || CIRCUITS[0];

  // Dynamic calculations for executive strategy metrics
  const liveStats = useMemo(() => {
    if (!telemetryData || !telemetryData.data || !telemetryData.data.length) {
      return {
        topSpeedA: 342.0,
        topSpeedB: 337.0,
        topSpeedDelta: 5.0,
        fasterTopDriver: driverA,
        apexSpeedA: 95.0,
        apexSpeedB: 92.0,
        apexSpeedDelta: 3.0,
        fasterApexDriver: driverA,
        brakeTemp: carHealth?.brakes.front_disc_temp_celsius || 540,
        vehicleStatus: carHealth?.overall_vehicle_status || "HEALTHY",
      };
    }

    const speedsA = telemetryData.data.map((p) => p.speed_a).filter((v) => typeof v === "number" && !isNaN(v));
    const speedsB = telemetryData.data.map((p) => p.speed_b).filter((v) => typeof v === "number" && !isNaN(v));

    const maxA = speedsA.length ? Math.max(...speedsA) : 340;
    const maxB = speedsB.length ? Math.max(...speedsB) : 335;
    const topDelta = Math.round((maxA - maxB) * 10) / 10;
    const fasterTopDriver = topDelta >= 0 ? driverA : driverB;

    // Cornering / Apex Speed: evaluate lowest speed during braking or low-throttle points
    const cornersA = telemetryData.data.filter((p) => p.brake_a > 15 || p.throttle_a < 30).map((p) => p.speed_a);
    const cornersB = telemetryData.data.filter((p) => p.brake_b > 15 || p.throttle_b < 30).map((p) => p.speed_b);

    const minA = cornersA.length ? Math.min(...cornersA) : 80;
    const minB = cornersB.length ? Math.min(...cornersB) : 78;
    const apexDelta = Math.round((minA - minB) * 10) / 10;
    const fasterApexDriver = apexDelta >= 0 ? driverA : driverB;

    return {
      topSpeedA: Math.round(maxA * 10) / 10,
      topSpeedB: Math.round(maxB * 10) / 10,
      topSpeedDelta: Math.abs(topDelta),
      fasterTopDriver,
      apexSpeedA: Math.round(minA * 10) / 10,
      apexSpeedB: Math.round(minB * 10) / 10,
      apexSpeedDelta: Math.abs(apexDelta),
      fasterApexDriver,
      brakeTemp: carHealth?.brakes.front_disc_temp_celsius || 540,
      vehicleStatus: carHealth?.overall_vehicle_status || "HEALTHY",
    };
  }, [telemetryData, carHealth, driverA, driverB]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tel, tires, health, sectors] = await Promise.all([
          fetchTelemetryCompare(driverA, driverB, selectedYear, selectedCircuit, "R"),
          fetchTireMetrics(driverA, selectedYear, selectedCircuit, "R"),
          fetchVehicleHealth(driverA, 14, "MEDIUM"),
          fetchSessionSectors(`${selectedYear}_${selectedCircuit}_R`, driverA),
        ]);
        setTelemetryData(tel);
        setTireData(tires);
        setCarHealth(health);
        setSectorData(sectors);
      } catch (err) {
        console.error("Failed to load telemetry dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [driverA, driverB, selectedCircuit, selectedYear]);

  return (
    <div className="flex flex-col space-y-6">
      {/* Strategic Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pitwall-border/80 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-pitwall-cyan font-semibold">
            <span className="h-2 w-2 rounded-full bg-pitwall-cyan animate-pulse" />
            <span>{selectedYear} {activeCircuitMeta.name.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Telemetry Delta &amp; 3D PitWall HUD
          </h1>
          <p className="text-xs text-gray-400">
            Universal FastF1 3D spline circuit geometry with interactive turn telemetry and real-time tire degradation.
          </p>
        </div>

        {/* Header Controls: Circuit Switcher, 3D Mode & Drivers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Circuit Dropdown */}
          <div className="flex items-center space-x-1.5 bg-pitwall-panel border border-pitwall-border rounded-lg px-2.5 py-1.5 shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-pitwall-cyan" />
            <select
              value={selectedCircuit}
              onChange={(e) => setSelectedCircuit(e.target.value)}
              className="bg-transparent text-white text-xs font-bold font-mono outline-none cursor-pointer"
            >
              {CIRCUITS.map((c) => (
                <option key={c.slug} value={c.slug} className="bg-pitwall-card text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3D vs 2D Mode Switcher */}
          <div className="flex items-center bg-pitwall-panel border border-pitwall-border rounded-lg p-1 text-xs font-mono font-bold">
            <button
              onClick={() => setViewMode("3D")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all ${
                viewMode === "3D"
                  ? "bg-pitwall-cyan text-black shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>3D WebGL</span>
            </button>
            <button
              onClick={() => setViewMode("2D")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all ${
                viewMode === "2D"
                  ? "bg-pitwall-cyan text-black shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>2D Cockpit</span>
            </button>
          </div>

          {/* Driver Selector Controls */}
          <div className="flex items-center space-x-3 bg-pitwall-panel border border-pitwall-border rounded-lg p-1.5 shadow-sm">
            <div className="flex items-center space-x-1.5 px-2">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Car 1:</span>
              <select
                value={driverA}
                onChange={(e) => setDriverA(e.target.value)}
                className="bg-pitwall-card border border-pitwall-border text-white text-xs font-bold rounded px-2 py-1 outline-none focus:border-pitwall-cyan font-mono"
              >
                <option value="VER">VER (Verstappen)</option>
                <option value="NOR">NOR (Norris)</option>
                <option value="LEC">LEC (Leclerc)</option>
                <option value="HAM">HAM (Hamilton)</option>
                <option value="PIA">PIA (Piastri)</option>
                <option value="SAI">SAI (Sainz)</option>
              </select>
            </div>
            <span className="text-gray-500 font-bold text-xs">VS</span>
            <div className="flex items-center space-x-1.5 px-2">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Car 2:</span>
              <select
                value={driverB}
                onChange={(e) => setDriverB(e.target.value)}
                className="bg-pitwall-card border border-pitwall-border text-white text-xs font-bold rounded px-2 py-1 outline-none focus:border-pitwall-cyan font-mono"
              >
                <option value="NOR">NOR (Norris)</option>
                <option value="VER">VER (Verstappen)</option>
                <option value="LEC">LEC (Leclerc)</option>
                <option value="HAM">HAM (Hamilton)</option>
                <option value="PIA">PIA (Piastri)</option>
                <option value="SAI">SAI (Sainz)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* B2B Executive Strategy Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Top Speed Delta</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            +{liveStats.topSpeedDelta} <span className="text-xs text-gray-400 font-normal">km/h</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400 font-medium">
            {liveStats.fasterTopDriver} speed advantage ({liveStats.topSpeedA} vs {liveStats.topSpeedB})
          </p>
        </div>

        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Apex Speed Delta</span>
            <ArrowUpRight className="h-4 w-4 text-pitwall-cyan" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            +{liveStats.apexSpeedDelta} <span className="text-xs text-gray-400 font-normal">km/h</span>
          </div>
          <p className="mt-1 text-[11px] text-pitwall-cyan font-medium">
            {liveStats.fasterApexDriver} mid-corner advantage ({liveStats.apexSpeedA} vs {liveStats.apexSpeedB})
          </p>
        </div>

        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Brake Disc Temperature</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {liveStats.brakeTemp}°C
          </div>
          <p className="mt-1 text-[11px] text-gray-400 font-medium">
            {liveStats.brakeTemp > 650 ? "Heavy thermal load window" : "Carbon disc thermal window nominal"}
          </p>
        </div>

        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Vehicle Grip State</span>
            <Compass className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
            {liveStats.vehicleStatus}
          </div>
          <p className="mt-1 text-[11px] text-gray-400 font-medium">
            {liveStats.vehicleStatus === "CRITICAL" ? "Severe tire degradation detected" : "4-corner tire grip window nominal"}
          </p>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Distance-Aligned Telemetry Delta & Sector Monitor */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {loading || !telemetryData ? (
            <div className="flex h-96 items-center justify-center rounded-xl border border-pitwall-border bg-pitwall-panel font-mono text-gray-400">
              Loading DuckDB distance telemetry for {activeCircuitMeta.name}...
            </div>
          ) : (
            <TelemetryChart
              telemetry={telemetryData.data}
              driverA={driverA}
              driverB={driverB}
              onHoverIndex={(idx) => setActiveScrubIdx(idx)}
            />
          )}

          {/* Sector Splits & Pit Stop Monitor Table */}
          <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-pitwall-border/60 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-pitwall-cyan" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Sector Splits &amp; Pit Stop Monitor ({driverA})
                </h3>
              </div>
              <div className="flex items-center space-x-3 text-[10px] font-mono">
                <span className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-purple-400 font-bold">Session Best</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-400 font-bold">Personal Best</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 z-10 border-b border-pitwall-border/60 bg-pitwall-card text-[10px] text-gray-400 uppercase">
                  <tr>
                    <th className="py-2 px-3">Lap</th>
                    <th className="py-2 px-3">Tyre</th>
                    <th className="py-2 px-3">Sector 1</th>
                    <th className="py-2 px-3">Sector 2</th>
                    <th className="py-2 px-3">Sector 3</th>
                    <th className="py-2 px-3">Lap Time</th>
                    <th className="py-2 px-3 text-right">Pit Stop / Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pitwall-border/30 text-xs">
                  {sectorData?.laps.map((lap) => (
                    <tr key={lap.lap_number} className="hover:bg-pitwall-card/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-white">L{lap.lap_number}</td>
                      <td className="py-2 px-3">
                        <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold text-gray-300">
                          {lap.compound}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold" style={{ color: lap.sector_1.color }}>
                        {lap.sector_1.time.toFixed(3)}
                      </td>
                      <td className="py-2 px-3 font-bold" style={{ color: lap.sector_2.color }}>
                        {lap.sector_2.time.toFixed(3)}
                      </td>
                      <td className="py-2 px-3 font-bold" style={{ color: lap.sector_3.color }}>
                        {lap.sector_3.time.toFixed(3)}
                      </td>
                      <td className="py-2 px-3 font-black text-white">
                        {lap.lap_time_seconds.toFixed(3)}s
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {lap.pit_stop ? (
                          <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                            {lap.pit_stop.type === "PIT_IN"
                              ? `BOX (${lap.pit_stop.stationary_time_sec}s Stop)`
                              : "OUT-LAP"}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Track Map & Vehicle Dynamics (3D WebGL vs 2D Toggleable) */}
        <div className="flex flex-col space-y-6">
          {viewMode === "3D" ? (
            <>
              <TrackMap3D
                circuit={selectedCircuit}
                year={selectedYear}
                telemetry={telemetryData?.data || []}
                activeIndex={activeScrubIdx}
                driverA={driverA}
                driverB={driverB}
              />
              <CarHealth3D tireData={tireData} driver={driverA} />
            </>
          ) : (
            <>
              <TrackMap
                circuit={selectedCircuit}
                year={selectedYear}
                telemetry={telemetryData?.data || []}
                activeIndex={activeScrubIdx}
                driverACode={driverA}
                driverBCode={driverB}
              />
              <CarHealth3D tireData={tireData} driver={driverA} />
              <CarHealthHUD health={carHealth} driver={driverA} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
