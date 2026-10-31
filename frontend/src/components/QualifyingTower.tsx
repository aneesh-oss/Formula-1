"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, CheckCircle2, ChevronRight, Flag, Radio, ShieldAlert, Timer, Zap } from "lucide-react";

export interface QualifyingDriver {
  pos: number;
  driver: string;
  team: string;
  team_color: string;
  time: string;
  gap: string;
  compound: string;
  status: "P" | "TRACK" | "CHECKERED" | "ELIMINATED";
  s1?: number;
  s2?: number;
  s3?: number;
}

export interface QualifyingSessionData {
  session: string;
  phase: string;
  time_remaining: string;
  meeting: string;
  circuit: string;
  leader: { driver: string; time: string };
  elimination_cutoff_pos: number;
  total_drivers: number;
  safe_count: number;
  eliminated_count: number;
  standings: QualifyingDriver[];
  safe_drivers: QualifyingDriver[];
  eliminated_drivers: QualifyingDriver[];
}

export default function QualifyingTower() {
  const [data, setData] = useState<QualifyingSessionData | null>(null);
  const [activeSegment, setActiveSegment] = useState<"Q1" | "Q2" | "Q3">("Q1");
  const [selectedDriver, setSelectedDriver] = useState<string>("HAM");

  useEffect(() => {
    fetch("/api/v1/live/qualifying")
      .then((res) => res.json())
      .then((json) => {
        if (json && json.standings) {
          setData(json);
        }
      })
      .catch((err) => console.error("Error fetching qualifying standings:", err));
  }, []);

  if (!data) {
    return (
      <div className="rounded-2xl border border-pitwall-border bg-[#151921] p-6 text-center font-mono text-xs text-gray-400">
        Loading F1 Qualifying Timing Tower...
      </div>
    );
  }

  const safeDrivers = data.standings.filter((d) => d.pos <= data.elimination_cutoff_pos);
  const knockedOutDrivers = data.standings.filter((d) => d.pos > data.elimination_cutoff_pos);

  return (
    <div className="space-y-6">
      {/* Qualifying Broadcast Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-pitwall-border bg-gradient-to-r from-[#151921] via-[#10131a] to-[#151921] p-5 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pitwall-red shadow-lg shadow-pitwall-red/20 font-black text-white italic text-xl">
            F1
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black uppercase tracking-wider text-white">
                {data.meeting}
              </span>
              <span className="rounded bg-pitwall-red/20 px-2.5 py-0.5 font-mono text-xs font-black text-pitwall-red border border-pitwall-red/40 tracking-widest animate-pulse">
                {data.phase} {data.time_remaining}
              </span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                OFFICIAL CLASSIFICATION
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400">
              {data.circuit} &bull; Q1 Leader: <strong className="text-pitwall-cyan font-bold">{data.leader.driver}</strong> ({data.leader.time}) &bull; Cut-Off: P{data.elimination_cutoff_pos}
            </p>
          </div>
        </div>

        {/* Phase Selector Tabs */}
        <div className="flex items-center space-x-2 bg-[#0b0e14] border border-[#232936] rounded-xl p-1 font-mono text-xs font-bold">
          <button
            onClick={() => setActiveSegment("Q1")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSegment === "Q1" ? "bg-pitwall-red text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            Q1 (Completed)
          </button>
          <button
            onClick={() => setActiveSegment("Q2")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSegment === "Q2" ? "bg-pitwall-red text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            Q2 (Next)
          </button>
          <button
            onClick={() => setActiveSegment("Q3")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSegment === "Q3" ? "bg-pitwall-red text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            Q3 Shootout
          </button>
        </div>
      </div>

      {/* Main Timing Tower & Delta Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official F1 Timing Tower (FanCode / F1 Broadcast replica) */}
        <div className="lg:col-span-8 rounded-2xl border border-pitwall-border bg-[#151921] p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#232936] font-mono text-xs text-gray-400">
            <span className="font-bold text-white uppercase tracking-wider">Qualifying Classification Timing Tower</span>
            <span className="text-[11px] text-gray-500">22 DRIVERS &bull; TOP 15 ADVANCE TO Q2</span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            {/* Safe Drivers (P1 to P15) */}
            {safeDrivers.map((d) => (
              <div
                key={d.pos}
                onClick={() => setSelectedDriver(d.driver)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedDriver === d.driver
                    ? "bg-[#232936] border border-pitwall-cyan/50 shadow"
                    : "bg-[#0b0e14]/70 hover:bg-[#0b0e14] border border-transparent"
                }`}
              >
                {/* Position, Team Bar, Driver Code */}
                <div className="flex items-center space-x-2.5">
                  <span className={`w-5 text-right font-black ${d.pos === 1 ? "text-pitwall-cyan font-extrabold" : "text-gray-400"}`}>
                    {d.pos}
                  </span>
                  <span className="h-4 w-1 rounded-full" style={{ backgroundColor: d.team_color }} />
                  <span className="font-black text-white text-sm tracking-wider">{d.driver}</span>
                  <span className="hidden sm:inline text-[11px] text-gray-400 font-sans truncate max-w-[140px]">{d.team}</span>
                </div>

                {/* Timing, Gap, Tire & Pit Status */}
                <div className="flex items-center space-x-3">
                  <span className={`font-bold ${d.pos === 1 ? "text-pitwall-cyan font-black" : "text-gray-200"}`}>
                    {d.pos === 1 ? d.time : d.gap}
                  </span>

                  {/* Soft Tire Badge (Official Red S) */}
                  <span className="rounded-sm bg-[#e10600] text-white font-black px-1.5 py-0.5 text-[10px] shadow-sm">
                    {d.compound}
                  </span>

                  {/* Pit / Track Indicator (Official White P) */}
                  {d.status === "P" && (
                    <span className="rounded-sm bg-white text-black font-black px-1.5 py-0.5 text-[10px] shadow-sm">
                      P
                    </span>
                  )}
                  {d.status === "CHECKERED" && (
                    <span className="rounded-sm bg-[#1c222d] text-white font-bold px-1 py-0.5 text-[10px] border border-[#2e3747]">
                      🏁
                    </span>
                  )}
                  {d.status === "TRACK" && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
              </div>
            ))}

            {/* KNOCKOUT DROP ZONE BAR (Cut-Off Line) */}
            <div className="my-3 flex items-center justify-between rounded-lg border-2 border-dashed border-red-500/50 bg-red-500/10 px-4 py-2 font-mono text-xs font-bold text-red-400">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="h-4 w-4 animate-pulse text-red-400" />
                <span className="uppercase tracking-widest text-[11px]">
                  ELIMINATION DROP LINE &bull; P16–P22 KNOCKED OUT FROM Q1
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-red-300 font-black">
                CUT-OFF DELTA: +1.176s
              </span>
            </div>

            {/* Knocked Out / Eliminated Drivers (P16 to P22) */}
            {knockedOutDrivers.map((d) => (
              <div
                key={d.pos}
                onClick={() => setSelectedDriver(d.driver)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all cursor-pointer border ${
                  selectedDriver === d.driver
                    ? "bg-red-950/40 border-red-500/60 shadow"
                    : "bg-[#0b0e14]/40 hover:bg-red-950/20 border-red-900/20"
                }`}
              >
                {/* Position, Team Bar, Driver Code */}
                <div className="flex items-center space-x-2.5 opacity-80">
                  <span className="w-5 text-right font-bold text-red-400">{d.pos}</span>
                  <span className="h-4 w-1 rounded-full opacity-60" style={{ backgroundColor: d.team_color }} />
                  <span className="font-bold text-gray-300 text-sm tracking-wider">{d.driver}</span>
                  <span className="hidden sm:inline text-[11px] text-gray-500 font-sans truncate max-w-[140px]">{d.team}</span>
                </div>

                {/* Timing, Gap, Tire & Pit Status */}
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 font-medium">{d.gap}</span>

                  {/* Soft Tire Badge */}
                  <span className="rounded-sm bg-[#e10600]/80 text-white font-black px-1.5 py-0.5 text-[10px]">
                    {d.compound}
                  </span>

                  {/* Pit / Checkered Indicator */}
                  {d.status === "P" && (
                    <span className="rounded-sm bg-white text-black font-black px-1.5 py-0.5 text-[10px] shadow-sm">
                      P
                    </span>
                  )}
                  {d.status === "CHECKERED" && (
                    <span className="rounded-sm bg-[#1c222d] text-white font-bold px-1 py-0.5 text-[10px] border border-[#2e3747]">
                      🏁
                    </span>
                  )}

                  {/* Knockout Badge */}
                  <span className="rounded bg-red-500/20 text-red-400 font-mono font-bold px-1.5 py-0.5 text-[9px] border border-red-500/40 uppercase">
                    KNOCKED OUT
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Driver Comparison Telemetry Card (Matching broadcast bottom-right corner) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-pitwall-border bg-[#151921] p-5 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#232936] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Live Micro-Sector Telemetry</span>
              <span className="text-[10px] text-pitwall-cyan font-bold">MEXICO CITY (Q1)</span>
            </div>

            {/* Broadcast Split Cards (Matching exact FanCode broadcast bottom-right corner) */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Card 1: 16 W SAINZ */}
                <div className="rounded-xl border border-[#232936] bg-[#0b0e14] p-3 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-[#1c222d] pb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="bg-[#1f2633] text-white px-1.5 py-0.5 rounded text-[11px] font-black">16</span>
                      <span className="text-white font-extrabold tracking-wide">W SAINZ</span>
                    </div>
                    <span className="rounded bg-[#e10600] text-white px-1.5 py-0.5 text-[10px] font-black">S</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="text-3xl font-black text-white font-mono tracking-tight">50.1</div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-gray-300">57.589</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">HAMILTON</div>
                    </div>
                  </div>
                  {/* Micro Sector Bar */}
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-mono font-bold">
                    <div className="bg-[#10b981] text-black py-0.5 rounded-sm font-black flex items-center justify-center space-x-1">
                      <span>S1</span>
                      <span className="text-[9px]">81</span>
                    </div>
                    <div className="bg-[#1c222d] text-gray-400 py-0.5 rounded-sm">S2</div>
                    <div className="bg-[#1c222d] text-gray-400 py-0.5 rounded-sm">S3</div>
                  </div>
                  <div className="h-0.5 w-full bg-[#10b981] absolute bottom-0 left-0" />
                </div>

                {/* Card 2: 3 FERRARI LECLERC (Purple fastest S1) */}
                <div className="rounded-xl border border-[#232936] bg-[#0b0e14] p-3 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-[#1c222d] pb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="bg-[#1f2633] text-white px-1.5 py-0.5 rounded text-[11px] font-black">3</span>
                      <span className="text-white font-extrabold tracking-wide">LECLERC</span>
                    </div>
                    <span className="rounded bg-[#e10600] text-white px-1.5 py-0.5 text-[10px] font-black">S</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="text-3xl font-black text-white font-mono tracking-tight">44.5</div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-gray-300">57.589</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">HAMILTON</div>
                    </div>
                  </div>
                  {/* Micro Sector Bar */}
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-mono font-bold">
                    <div className="bg-[#a855f7] text-white py-0.5 rounded-sm font-black flex items-center justify-center space-x-1">
                      <span>S1</span>
                      <span className="text-[9px]">81</span>
                    </div>
                    <div className="bg-[#1c222d] text-gray-400 py-0.5 rounded-sm">S2</div>
                    <div className="bg-[#1c222d] text-gray-400 py-0.5 rounded-sm">S3</div>
                  </div>
                  <div className="h-0.5 w-full bg-[#a855f7] absolute bottom-0 left-0" />
                </div>
              </div>

              {/* Card 3: 44 FERRARI HAMILTON (LEADER BENCHMARK) */}
              <div className="rounded-xl border border-pitwall-cyan/50 bg-[#0b0e14] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center space-x-2">
                    <span className="rounded bg-pitwall-cyan/30 text-pitwall-cyan px-1.5 py-0.5 text-[10px] font-black">44</span>
                    <span className="text-pitwall-cyan font-black">HAMILTON &bull; SESSION LEADER</span>
                  </div>
                  <span className="rounded bg-[#e10600] text-white px-1.5 py-0.5 text-[10px] font-black">S</span>
                </div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-2xl font-black text-pitwall-cyan">1:17.341</span>
                  <span className="text-xs text-purple-400 font-bold">OVERALL FASTEST LAP</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                  <div className="rounded bg-purple-500/20 text-purple-300 py-1 border border-purple-500/40 font-bold">
                    S1 27.21s
                  </div>
                  <div className="rounded bg-purple-500/20 text-purple-300 py-1 border border-purple-500/40 font-bold">
                    S2 29.84s (BEST)
                  </div>
                  <div className="rounded bg-purple-500/20 text-purple-300 py-1 border border-purple-500/40 font-bold">
                    S3 20.29s (BEST)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

