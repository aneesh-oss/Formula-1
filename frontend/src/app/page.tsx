"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowUpRight, Compass, ShieldAlert, Zap } from "lucide-react";
import TelemetryChart from "@/components/TelemetryChart";
import TrackMap from "@/components/TrackMap";
import VirtualTireWidget from "@/components/VirtualTireWidget";
import { CompareResponse, fetchTelemetryCompare, fetchTireMetrics, TireResponse } from "@/lib/api";

export default function TelemetryDashboard() {
  const [driverA, setDriverA] = useState("VER");
  const [driverB, setDriverB] = useState("NOR");
  const [telemetryData, setTelemetryData] = useState<CompareResponse | null>(null);
  const [tireData, setTireData] = useState<TireResponse | null>(null);
  const [activeScrubIdx, setActiveScrubIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tel, tires] = await Promise.all([
          fetchTelemetryCompare(driverA, driverB, 2024, "monza", "R"),
          fetchTireMetrics(driverA, 2024, "monza", "R"),
        ]);
        setTelemetryData(tel);
        setTireData(tires);
      } catch (err) {
        console.error("Failed to load telemetry:", err);
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
            Telemetry Delta & Corner Studio
          </h1>
          <p className="text-xs text-gray-400">
            DuckDB zero-copy spatial alignment across 1,500 distance samples.
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
            <span className="font-semibold">Tire Wear Delta</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            6.4% <span className="text-xs text-gray-400 font-normal">Stint L5</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-400 font-medium">
            Thermal degradation within nominal window
          </p>
        </div>

        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Undercut Advantage</span>
            <Compass className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            1.82 <span className="text-xs text-gray-400 font-normal">sec</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400 font-medium">
            Projected delta on fresh C3 Hard tire
          </p>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Distance-Aligned Telemetry Delta (2 cols on large) */}
        <div className="lg:col-span-2">
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
        </div>

        {/* Right Column: Track Map & Virtual Tires */}
        <div className="flex flex-col space-y-6">
          <TrackMap
            telemetry={telemetryData?.data || []}
            activeIndex={activeScrubIdx}
            driverACode={driverA}
            driverBCode={driverB}
          />
          <VirtualTireWidget tireData={tireData} driver={driverA} />
        </div>
      </div>
    </div>
  );
}
