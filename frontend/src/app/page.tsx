"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import LiveRaceTicker from "@/components/LiveRaceTicker";
import {
  Activity,
  ArrowRight,
  BarChart2,
  Box,
  Compass,
  Cpu,
  Database,
  Flame,
  Gauge,
  Layers,
  LineChart,
  Radio,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  // Interactive Live Demo Scrubber: HAM vs LEC at Monza (Curva Parabolica / Rettifilo)
  const [scrubPercent, setScrubPercent] = useState<number>(35);

  const demoTelemetry = useMemo(() => {
    // Distance 0 to 5793m
    const distanceMeters = Math.round((scrubPercent / 100) * 5793);

    // Realistic curve calculation along Monza lap
    // 0-1100m Rettifilo straight -> T1 chicane
    // 1100-1600m Curva Grande
    // 1600-2200m Roggia chicane
    // 2200-3300m Lesmo 1 & 2
    // 3300-4500m Serraglio & Ascari
    // 4500-5793m Rettifilo & Parabolica
    let baseSpeed = 290;
    let hamDelta = 2.4;
    let throttleHam = 100;
    let throttleLec = 100;
    let brakeHam = 0;
    let brakeLec = 0;
    let currentCorner = "Rettifilo Straight";

    if (scrubPercent >= 15 && scrubPercent <= 24) {
      currentCorner = "Variante del Rettifilo (T1 - T2)";
      baseSpeed = 78;
      hamDelta = -1.8; // LEC earlier on throttle
      throttleHam = 45;
      throttleLec = 65;
      brakeHam = 25;
      brakeLec = 0;
    } else if (scrubPercent > 24 && scrubPercent <= 38) {
      currentCorner = "Curva Grande (Biassono - T3)";
      baseSpeed = 312;
      hamDelta = +3.8; // HAM superior top-end power
      throttleHam = 100;
      throttleLec = 100;
    } else if (scrubPercent > 38 && scrubPercent <= 48) {
      currentCorner = "Variante della Roggia (T4 - T5)";
      baseSpeed = 115;
      hamDelta = +1.2;
      throttleHam = 70;
      throttleLec = 62;
      brakeHam = 15;
      brakeLec = 22;
    } else if (scrubPercent > 48 && scrubPercent <= 62) {
      currentCorner = "Curva di Lesmo (T6 - T7)";
      baseSpeed = 168;
      hamDelta = -0.6;
      throttleHam = 85;
      throttleLec = 90;
    } else if (scrubPercent > 62 && scrubPercent <= 78) {
      currentCorner = "Variante Ascari (T8 - T10)";
      baseSpeed = 220;
      hamDelta = +2.6;
      throttleHam = 95;
      throttleLec = 90;
    } else if (scrubPercent > 78) {
      currentCorner = "Curva Alboreto / Parabolica (T11)";
      baseSpeed = 265;
      hamDelta = +3.1;
      throttleHam = 100;
      throttleLec = 98;
    }

    const hamSpeed = Math.round((baseSpeed + hamDelta) * 10) / 10;
    const lecSpeed = Math.round(baseSpeed * 10) / 10;
    const deltaSpeed = Math.round((hamSpeed - lecSpeed) * 10) / 10;

    return {
      distanceMeters,
      currentCorner,
      hamSpeed,
      lecSpeed,
      deltaSpeed,
      throttleHam,
      throttleLec,
      brakeHam,
      brakeLec,
    };
  }, [scrubPercent]);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-pitwall-border bg-gradient-to-b from-[#151921] via-pitwall-dark to-black p-8 sm:p-14 shadow-2xl">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-pitwall-cyan/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-pitwall-red/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center space-x-2 rounded-full border border-pitwall-cyan/30 bg-pitwall-cyan/10 px-3.5 py-1 text-xs font-mono font-semibold text-pitwall-cyan">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>MISSION-CRITICAL RACE TELEMETRY // v2.4 ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            PitWall OS <br />
            <span className="bg-gradient-to-r from-pitwall-cyan via-emerald-400 to-amber-400 bg-clip-text text-transparent">
              Enterprise F1 Telemetry & AI Strategy Platform
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl font-sans leading-relaxed">
            High-performance motorsport telemetry processing at zero infrastructure cost.
            Combines sub-5ms in-process DuckDB joins, in-browser 3D vehicle thermal dynamics,
            and native OpenTelemetry distributed tracing exported to New Relic APM.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/studio"
              className="inline-flex items-center space-x-2 rounded-xl bg-pitwall-cyan px-6 py-3.5 text-sm font-bold text-black transition-all hover:bg-cyan-300 hover:shadow-lg hover:shadow-pitwall-cyan/25"
            >
              <Activity className="h-4 w-4" />
              <span>Launch Telemetry Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/ops"
              className="inline-flex items-center space-x-2 rounded-xl border border-pitwall-border bg-pitwall-panel/80 px-6 py-3.5 text-sm font-semibold text-gray-200 transition-all hover:border-gray-500 hover:text-white"
            >
              <Server className="h-4 w-4 text-emerald-400" />
              <span>Live SRE Metrics</span>
            </Link>

            <Link
              href="/strategy"
              className="inline-flex items-center space-x-2 rounded-xl border border-pitwall-border bg-pitwall-panel/80 px-5 py-3.5 text-sm font-semibold text-gray-300 transition-all hover:border-amber-500/50 hover:text-amber-400"
            >
              <Compass className="h-4 w-4 text-amber-400" />
              <span>Strategy Simulator</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Stream Real-Time Race Ingestion Banner */}
      <LiveRaceTicker />

      {/* Live Interactive Telemetry Delta Demo Card */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-pitwall-cyan">
              <Zap className="h-3.5 w-3.5" />
              <span>Interactive Simulator</span>
            </div>
            <h2 className="text-2xl font-black text-white">Live Delta Engine: HAM vs LEC</h2>
            <p className="text-xs text-gray-400">
              Drag the distance scrubber to simulate head-to-head corner telemetry around Autodromo Nazionale Monza.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>HAM #44 (Mercedes W15)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-pitwall-red font-bold">
              <span className="h-2 w-2 rounded-full bg-pitwall-red" />
              <span>LEC #16 (Ferrari SF-24)</span>
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-pitwall-border bg-[#151921] p-6 shadow-2xl space-y-6">
          {/* Top Live Stats Readout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#232936] bg-[#0b0e14] p-4">
              <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">Track Position</span>
              <div className="mt-1 font-mono font-bold text-white text-lg truncate">
                {demoTelemetry.currentCorner}
              </div>
              <span className="text-xs font-mono text-gray-400">{demoTelemetry.distanceMeters.toLocaleString()} m</span>
            </div>

            <div className="rounded-xl border border-[#232936] bg-[#0b0e14] p-4">
              <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">Speed Delta</span>
              <div className={`mt-1 font-mono font-black text-2xl ${
                demoTelemetry.deltaSpeed >= 0 ? "text-emerald-400" : "text-pitwall-red"
              }`}>
                {demoTelemetry.deltaSpeed >= 0 ? `+${demoTelemetry.deltaSpeed}` : demoTelemetry.deltaSpeed} <span className="text-xs font-normal text-gray-400">km/h</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">
                {demoTelemetry.deltaSpeed >= 0 ? "HAM speed advantage" : "LEC speed advantage"}
              </span>
            </div>

            <div className="rounded-xl border border-[#232936] bg-[#0b0e14] p-4">
              <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">HAM Instant Speed</span>
              <div className="mt-1 font-mono font-black text-emerald-400 text-2xl">
                {demoTelemetry.hamSpeed} <span className="text-xs font-normal text-gray-400">km/h</span>
              </div>
              <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono">
                <span className="text-gray-400">THR: {demoTelemetry.throttleHam}%</span>
                <span className="text-gray-400">BRK: {demoTelemetry.brakeHam}%</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#232936] bg-[#0b0e14] p-4">
              <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">LEC Instant Speed</span>
              <div className="mt-1 font-mono font-black text-pitwall-red text-2xl">
                {demoTelemetry.lecSpeed} <span className="text-xs font-normal text-gray-400">km/h</span>
              </div>
              <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono">
                <span className="text-gray-400">THR: {demoTelemetry.throttleLec}%</span>
                <span className="text-gray-400">BRK: {demoTelemetry.brakeLec}%</span>
              </div>
            </div>
          </div>

          {/* Interactive Lap Distance Scrubber */}
          <div className="space-y-2 rounded-xl border border-[#232936] bg-[#0b0e14] p-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Distance Scrubber:</span>
              <span className="font-bold text-pitwall-cyan">{scrubPercent}% ({demoTelemetry.distanceMeters}m / 5,793m)</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={scrubPercent}
              onChange={(e) => setScrubPercent(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#232936] accent-pitwall-cyan"
            />

            <div className="flex justify-between text-[10px] font-mono text-gray-500">
              <span>0m Start/Finish</span>
              <span>1120m T1 Rettifilo</span>
              <span>2350m Roggia</span>
              <span>3890m Ascari</span>
              <span>5793m Parabolica</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature & Architecture Highlights Grid */}
      <section className="space-y-6">
        <div>
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-pitwall-cyan">
            Architecture Invariants
          </div>
          <h2 className="text-2xl font-black text-white">Engineered for Sub-Millisecond Precision</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: DuckDB */}
          <div className="rounded-2xl border border-pitwall-border bg-[#151921] p-6 shadow-xl space-y-4 hover:border-pitwall-cyan/40 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pitwall-cyan/10 text-pitwall-cyan border border-pitwall-cyan/20">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">In-Process DuckDB Lakehouse</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Replaces heavy database server instances with in-process C++ DuckDB analytics.
              Executes zero-copy Parquet scans across &gt;10,000 telemetry points in under 5ms.
            </p>
            <div className="inline-flex items-center space-x-1.5 rounded-md bg-[#0b0e14] px-2.5 py-1 text-[11px] font-mono text-pitwall-cyan border border-[#232936]">
              <span>Latency: &lt;4.2ms per query</span>
            </div>
          </div>

          {/* Card 2: 3D Vehicle Dynamics */}
          <div className="rounded-2xl border border-pitwall-border bg-[#151921] p-6 shadow-xl space-y-4 hover:border-amber-500/40 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">3D Vehicle &amp; Thermal Wear HUD</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Interactive WebGL 3D model and high-res Studio CAD viewport.
              Dynamically maps thermodynamic tire temperatures to sub-mesh emissive shaders
              to alert strategists before the grip cliff.
            </p>
            <div className="inline-flex items-center space-x-1.5 rounded-md bg-[#0b0e14] px-2.5 py-1 text-[11px] font-mono text-amber-400 border border-[#232936]">
              <span>4-Wheel Virtual Tire Physics</span>
            </div>
          </div>

          {/* Card 3: OpenTelemetry */}
          <div className="rounded-2xl border border-pitwall-border bg-[#151921] p-6 shadow-xl space-y-4 hover:border-emerald-500/40 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Embedded OpenTelemetry SRE</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Industrial distributed tracing natively embedded into every FastAPI handler.
              Batched via local OpenTelemetry Collector daemon to New Relic Free Tier for zero-cost APM.
            </p>
            <div className="inline-flex items-center space-x-1.5 rounded-md bg-[#0b0e14] px-2.5 py-1 text-[11px] font-mono text-emerald-400 border border-[#232936]">
              <span>OTLP/HTTP &bull; 100GB/mo Free</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grand Prix Circuits Supported */}
      <section className="rounded-2xl border border-pitwall-border bg-[#151921] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
            Supported Championship Circuits
          </div>
          <Link href="/studio" className="text-xs font-mono text-pitwall-cyan hover:underline">
            Open in Studio &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "Red Bull Ring", country: "Austria", corners: 8, len: "4.318 km" },
            { name: "Monza", country: "Italy", corners: 11, len: "5.793 km" },
            { name: "Silverstone", country: "UK", corners: 18, len: "5.891 km" },
            { name: "Spa-Francorchamps", country: "Belgium", corners: 19, len: "7.004 km" },
            { name: "Suzuka", country: "Japan", corners: 18, len: "5.807 km" },
            { name: "Monaco", country: "Monaco", corners: 19, len: "3.337 km" },
            { name: "Zandvoort", country: "Netherlands", corners: 14, len: "4.259 km" },
            { name: "Interlagos", country: "Brazil", corners: 15, len: "4.309 km" },
          ].map((c) => (
            <div key={c.name} className="rounded-lg border border-[#232936] bg-[#0b0e14] p-3">
              <div className="text-xs font-bold text-white">{c.name}</div>
              <div className="text-[11px] text-gray-400">{c.country} &bull; {c.corners} Turns</div>
              <div className="mt-1 text-[10px] font-mono text-pitwall-cyan">{c.len}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
