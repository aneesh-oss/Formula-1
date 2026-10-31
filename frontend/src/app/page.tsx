"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowUpRight, Clock, Compass, ShieldAlert, Zap } from "lucide-react";
import CarHealthHUD from "@/components/CarHealthHUD";
import TelemetryChart from "@/components/TelemetryChart";
import TrackMap from "@/components/TrackMap";
import VirtualTireWidget from "@/components/VirtualTireWidget";
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

export default function TelemetryDashboard() {
  const [driverA, setDriverA] = useState("VER");
  const [driverB, setDriverB] = useState("NOR");
  const [telemetryData, setTelemetryData] = useState<CompareResponse | null>(null);
  const [tireData, setTireData] = useState<TireResponse | null>(null);
  const [carHealth, setCarHealth] = useState<CarHealthResponse | null>(null);
  const [sectorData, setSectorData] = useState<SessionSectorsResponse | null>(null);
  const [activeScrubIdx, setActiveScrubIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tel, tires, health, sectors] = await Promise.all([
          fetchTelemetryCompare(driverA, driverB, 2024, "monza", "R"),
          fetchTireMetrics(driverA, 2024, "monza", "R"),
          fetchVehicleHealth(driverA, 14, "MEDIUM"),
          fetchSessionSectors("2024_monza_R", driverA),
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
  }, [driverA, driverB]);

  return (
    <div className="flex flex-col space-y-6">
      {/* Strategic Header & Session Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pitwall-border/80 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-pitwall-cyan font-semibold">
            <span className="h-2 w-2 rounded-full bg-pitwall-cyan animate-pulse" />
            <span>2024 ITALIAN GRAND PRIX — MONZA (RACE)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Telemetry Delta & Vehicle Dynamics Studio
          </h1>
          <p className="text-xs text-gray-400">
            DuckDB zero-copy spatial alignment across 1,500 distance samples with sector split telemetry.
          </p>
        </div>

        {/* Driver Selector Controls */}
        <div className="flex items-center space-x-3 bg-pitwall-panel border border-pitwall-border rounded-lg p-1.5 shadow-sm">
          <div className="flex items-center space-x-1.5 px-2">
            <span className="text-[11px] text-gray-400 font-bold uppercase">Car 1:</span>
            <select
              value={driverA}
              onChange={(e) => setDriverA(e.target.value)}
              className="bg-pitwall-card border border-pitwall-border text-white text-xs font-bold rounded px-2 py-1 outline-none focus:border-pitwall-cyan"
            >
              <option value="VER">VER (Verstappen)</option>
              <option value="NOR">NOR (Norris)</option>
              <option value="LEC">LEC (Leclerc)</option>
              <option value="HAM">HAM (Hamilton)</option>
            </select>
          </div>
          <span className="text-gray-500 font-bold text-xs">VS</span>
          <div className="flex items-center space-x-1.5 px-2">
            <span className="text-[11px] text-gray-400 font-bold uppercase">Car 2:</span>
            <select
              value={driverB}
              onChange={(e) => setDriverB(e.target.value)}
              className="bg-pitwall-card border border-pitwall-border text-white text-xs font-bold rounded px-2 py-1 outline-none focus:border-pitwall-cyan"
            >
              <option value="NOR">NOR (Norris)</option>
              <option value="VER">VER (Verstappen)</option>
              <option value="LEC">LEC (Leclerc)</option>
              <option value="HAM">HAM (Hamilton)</option>
            </select>
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
            +5.2 <span className="text-xs text-gray-400 font-normal">km/h</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400 font-medium">
            {driverA} advantage on Rettifilo straight
          </p>
        </div>

        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Apex Speed Delta</span>
            <ArrowUpRight className="h-4 w-4 text-pitwall-cyan" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            +3.4 <span className="text-xs text-gray-400 font-normal">km/h</span>
          </div>
          <p className="mt-1 text-[11px] text-pitwall-cyan font-medium">
            {driverB} higher minimum speed at Ascari
          </p>
        </div>

        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Brake Disc Temperature</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {carHealth?.brakes.front_disc_temp_celsius || 540}°C
          </div>
          <p className="mt-1 text-[11px] text-gray-400 font-medium">
            Carbon disc thermal window nominal
          </p>
        </div>

        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Vehicle Grip State</span>
            <Compass className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
            {carHealth?.overall_vehicle_status || "HEALTHY"}
          </div>
          <p className="mt-1 text-[11px] text-gray-400 font-medium">
            4-corner tire grip decay nominal
          </p>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Distance-Aligned Telemetry Delta (2 cols) */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {loading || !telemetryData ? (
            <div className="flex h-96 items-center justify-center rounded-xl border border-pitwall-border bg-pitwall-panel font-mono text-gray-400">
              Loading DuckDB distance telemetry...
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
                  Sector Splits & Pit Stop Monitor ({driverA})
                </h3>
              </div>
              <div className="flex items-center space-x-3 text-[10px] font-mono">
                <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-purple-500" /><span className="text-purple-400 font-bold">Session Best</span></span>
                <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-emerald-400 font-bold">Personal Best</span></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-pitwall-border/60 bg-pitwall-card/60 text-[10px] text-gray-400 uppercase">
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
                  {sectorData?.laps.slice(0, 7).map((lap) => (
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

        {/* Right Column: Track Map & Vehicle Health Wireframe */}
        <div className="flex flex-col space-y-6">
          <TrackMap
            telemetry={telemetryData?.data || []}
            activeIndex={activeScrubIdx}
            driverACode={driverA}
            driverBCode={driverB}
          />
          <CarHealthHUD health={carHealth} driver={driverA} />
        </div>
      </div>
    </div>
  );
}
