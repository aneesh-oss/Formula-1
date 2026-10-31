"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, Award, CheckCircle2, ChevronRight, Flag, Radio, ShieldAlert, Sparkles, Timer, Zap } from "lucide-react";

export interface QualifyingDriver {
  pos: number;
  driver: string;
  name?: string;
  team: string;
  team_color: string;
  time: string;
  gap: string;
  compound: string;
  status: "P" | "TRACK" | "CHECKERED" | "ELIMINATED";
  is_pole?: boolean;
  s1?: number;
  s2?: number;
  s3?: number;
}

export interface QualifyingSessionData {
  session: string;
  phase: string;
  status: string;
  time_remaining: string;
  meeting: string;
  circuit: string;
  description: string;
  leader: { driver: string; time: string };
  elimination_cutoff_pos: number;
  total_drivers: number;
  safe_count: number;
  eliminated_count: number;
  standings: QualifyingDriver[];
  safe_drivers: QualifyingDriver[];
  eliminated_drivers: QualifyingDriver[];
  all_phases?: {
    q1_leader: string;
    q2_leader: string;
    q3_pole: string;
    pole_margin: string;
  };
}

export default function QualifyingTower() {
  const [data, setData] = useState<QualifyingSessionData | null>(null);
  const [activeSegment, setActiveSegment] = useState<"Q1" | "Q2" | "Q3">("Q3");
  const [selectedDriver, setSelectedDriver] = useState<string>("HAM");
  const [timingMode, setTimingMode] = useState<"GAP" | "INTERVAL">("GAP");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/live/qualifying?phase=${activeSegment}`)
      .then((res) => res.json())
      .then((json) => {
        if (json && json.standings) {
          setData(json);
        }
      })
      .catch((err) => console.error("Error fetching qualifying standings:", err))
      .finally(() => setLoading(false));
  }, [activeSegment]);

  if (!data) {
    return (
      <div className="rounded-2xl border border-pitwall-border bg-[#151921] p-6 text-center font-mono text-xs text-gray-400">
        Loading F1 Qualifying Timing Tower...
      </div>
    );
  }

  const safeDrivers = data.safe_drivers || [];
  const knockedOutDrivers = data.eliminated_drivers || [];

  const getDisplayDelta = (driver: QualifyingDriver, index: number, list: QualifyingDriver[]) => {
    if (driver.pos === 1) return driver.time;
    if (timingMode === "GAP") return driver.gap;
    if (index === 0) return driver.gap;
    const prevDriver = list[index - 1];
    const currentGap = parseFloat(driver.gap.replace("+", "")) || 0;
    const prevGap = parseFloat(prevDriver.gap.replace("+", "")) || 0;
    const interval = Math.max(0.001, currentGap - prevGap);
    return `+${interval.toFixed(3)}`;
  };

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
              <span className="rounded bg-pitwall-red/20 px-2.5 py-0.5 font-mono text-xs font-black text-pitwall-red border border-pitwall-red/40 tracking-widest flex items-center space-x-1">
                <span>{data.phase}</span>
                <span>•</span>
                <span>{data.status}</span>
              </span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                OFFICIAL FIA CLASSIFICATION
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400 mt-1">
              {data.circuit} &bull; <strong className="text-pitwall-cyan font-bold">{data.description}</strong>
            </p>
          </div>
        </div>

        {/* Phase Selector Tabs (Q1, Q2, Q3) */}
        <div className="flex items-center space-x-2 bg-[#0b0e14] border border-[#232936] rounded-xl p-1 font-mono text-xs font-bold">
          <button
            onClick={() => setActiveSegment("Q1")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSegment === "Q1" ? "bg-pitwall-red text-white shadow-lg shadow-pitwall-red/30" : "text-gray-400 hover:text-white"
            }`}
          >
            Q1 (22 Cars)
          </button>
          <button
            onClick={() => setActiveSegment("Q2")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSegment === "Q2" ? "bg-pitwall-red text-white shadow-lg shadow-pitwall-red/30" : "text-gray-400 hover:text-white"
            }`}
          >
            Q2 (15 Cars)
          </button>
          <button
            onClick={() => setActiveSegment("Q3")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeSegment === "Q3" ? "bg-pitwall-red text-white shadow-lg shadow-pitwall-red/30" : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>Q3 Pole Shootout</span>
          </button>
        </div>
      </div>

      {/* Main Timing Tower & Delta Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official F1 Timing Tower */}
        <div className="lg:col-span-8 rounded-2xl border border-pitwall-border bg-[#151921] p-5 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#232936] font-mono text-xs text-gray-400 gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white uppercase tracking-wider">
                {activeSegment === "Q3" ? "Q3 Pole Position Classification" : `${activeSegment} Timing Classification Tower`}
              </span>
              <span className="text-[11px] text-gray-500">
                • {data.total_drivers} DRIVERS
              </span>
            </div>

            {/* Interval vs Gap Mode Toggle */}
            <div className="flex items-center space-x-1 bg-[#0b0e14] border border-[#232936] rounded-lg p-0.5 text-[10px] font-bold">
              <button
                onClick={() => setTimingMode("GAP")}
                className={`px-2 py-0.5 rounded transition-all ${
                  timingMode === "GAP" ? "bg-pitwall-cyan text-black font-black" : "text-gray-400 hover:text-white"
                }`}
              >
                GAP (LEADER)
              </button>
              <button
                onClick={() => setTimingMode("INTERVAL")}
                className={`px-2 py-0.5 rounded transition-all ${
                  timingMode === "INTERVAL" ? "bg-pitwall-cyan text-black font-black" : "text-gray-400 hover:text-white"
                }`}
              >
                INTERVAL (AHEAD)
              </button>
            </div>
          </div>

          <div className="space-y-1 font-mono text-xs">
            {/* Safe / Qualified Drivers */}
            {safeDrivers.map((d, index) => (
              <div
                key={d.pos}
                onClick={() => setSelectedDriver(d.driver)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  d.pos === 1 && activeSegment === "Q3"
                    ? "bg-gradient-to-r from-[#1c222d] via-amber-950/20 to-[#1c222d] border border-amber-500/50 shadow-lg"
                    : selectedDriver === d.driver
                    ? "bg-[#232936] border border-pitwall-cyan/50 shadow"
                    : "bg-[#0b0e14]/70 hover:bg-[#0b0e14] border border-transparent"
                }`}
              >
                {/* Position, Team Bar, Driver Code */}
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-5 text-right font-black ${
                      d.pos === 1 && activeSegment === "Q3"
                        ? "text-amber-400 font-black text-sm"
                        : d.pos === 1
                        ? "text-pitwall-cyan font-extrabold"
                        : "text-gray-400"
                    }`}
                  >
                    {d.pos}
                  </span>
                  <span className="h-4 w-1 rounded-full" style={{ backgroundColor: d.team_color }} />
                  <span className="font-black text-white text-sm tracking-wider">{d.driver}</span>
                  <span className="hidden sm:inline text-[11px] text-gray-400 font-sans truncate max-w-[140px]">
                    {d.team}
                  </span>

                  {d.pos === 1 && activeSegment === "Q3" && (
                    <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-black uppercase flex items-center space-x-1">
                      <Award className="h-2.5 w-2.5 text-amber-400" />
                      <span>POLE</span>
                    </span>
                  )}
                </div>

                {/* Timing, Gap, Tire & Pit Status */}
                <div className="flex items-center space-x-3">
                  <span
                    className={`font-bold ${
                      d.pos === 1 && activeSegment === "Q3"
                        ? "text-amber-400 font-black"
                        : d.pos === 1
                        ? "text-pitwall-cyan font-black"
                        : "text-gray-200"
                    }`}
                  >
                    {getDisplayDelta(d, index, safeDrivers)}
                  </span>

                  {/* Soft Tire Badge & Stint Age */}
                  <div className="flex items-center space-x-1">
                    <span className="rounded-sm bg-[#e10600] text-white font-black px-1.5 py-0.5 text-[10px] shadow-sm">
                      {d.compound}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      L{4 + (d.pos % 4)}
                    </span>
                  </div>

                  {/* Pit / Track Indicator */}
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

            {/* KNOCKOUT DROP ZONE BAR (Only in Q1 & Q2) */}
            {knockedOutDrivers.length > 0 && (
              <>
                <div className="my-3 flex items-center justify-between rounded-lg border-2 border-dashed border-red-500/50 bg-red-500/10 px-4 py-2 font-mono text-xs font-bold text-red-400">
                  <div className="flex items-center space-x-2">
                    <AlertOctagon className="h-4 w-4 animate-pulse text-red-400" />
                    <span className="uppercase tracking-widest text-[11px]">
                      {activeSegment === "Q1"
                        ? "ELIMINATION DROP LINE • P16–P22 KNOCKED OUT FROM Q1"
                        : "ELIMINATION DROP LINE • P11–P15 KNOCKED OUT FROM Q2"}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-red-300 font-black">
                    {activeSegment === "Q1" ? "CUT-OFF: +1.176s" : "CUT-OFF: +0.970s"}
                  </span>
                </div>

                {/* Knocked Out / Eliminated Drivers */}
                {knockedOutDrivers.map((d, index) => (
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
                      <span className="hidden sm:inline text-[11px] text-gray-500 font-sans truncate max-w-[140px]">
                        {d.team}
                      </span>
                    </div>

                    {/* Timing, Gap, Tire & Pit Status */}
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 font-medium">
                        {getDisplayDelta(d, index, knockedOutDrivers)}
                      </span>

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
              </>
            )}

            {/* Q3 Pole Position Footer Banner */}
            {activeSegment === "Q3" && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-950/30 via-amber-900/20 to-amber-950/30 border border-amber-500/30 p-3 font-mono text-xs">
                <div className="flex items-center space-x-2 text-amber-300 font-bold">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>POLE POSITION: LEWIS HAMILTON (FERRARI) • 1:16.514</span>
                </div>
                <span className="text-[11px] text-amber-400 font-black">
                  MARGIN: +0.009s OVER RUSSELL
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Driver Comparison Telemetry Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-pitwall-border bg-[#151921] p-5 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#232936] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Live Micro-Sector Telemetry</span>
              <span className="text-[10px] text-pitwall-cyan font-bold">MEXICO CITY ({activeSegment})</span>
            </div>

            {/* Dynamic Telemetry Cards Depending on Segment */}
            {activeSegment === "Q3" ? (
              <div className="space-y-3">
                {/* Pole: 44 HAMILTON */}
                <div className="rounded-xl border border-amber-500/50 bg-[#0b0e14] p-3 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-[#1c222d] pb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded text-[11px] font-black">44</span>
                      <span className="text-amber-300 font-extrabold tracking-wide">HAMILTON (POLE)</span>
                    </div>
                    <span className="rounded bg-[#e10600] text-white px-1.5 py-0.5 text-[10px] font-black">S</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">1:16.514</div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-amber-300">POLE LAP</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">FERRARI</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-mono font-bold">
                    <div className="bg-[#a855f7] text-white py-0.5 rounded-sm font-black">S1 26.88s</div>
                    <div className="bg-[#a855f7] text-white py-0.5 rounded-sm font-black">S2 29.48s</div>
                    <div className="bg-[#10b981] text-black py-0.5 rounded-sm font-black">S3 20.15s</div>
                  </div>
                  <div className="h-0.5 w-full bg-amber-400 absolute bottom-0 left-0" />
                </div>

                {/* P2: 63 RUSSELL (+0.009s) */}
                <div className="rounded-xl border border-teal-500/40 bg-[#0b0e14] p-3 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-[#1c222d] pb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="bg-[#1f2633] text-teal-400 px-1.5 py-0.5 rounded text-[11px] font-black">63</span>
                      <span className="text-white font-extrabold tracking-wide">RUSSELL (P2)</span>
                    </div>
                    <span className="rounded bg-[#e10600] text-white px-1.5 py-0.5 text-[10px] font-black">S</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="text-3xl font-black text-white font-mono tracking-tight">1:16.523</div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-purple-400">+0.009s</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">MERCEDES</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-mono font-bold">
                    <div className="bg-[#10b981] text-black py-0.5 rounded-sm font-black">S1 26.89s</div>
                    <div className="bg-[#10b981] text-black py-0.5 rounded-sm font-black">S2 29.51s</div>
                    <div className="bg-[#a855f7] text-white py-0.5 rounded-sm font-black">S3 20.12s (BEST)</div>
                  </div>
                  <div className="h-0.5 w-full bg-teal-400 absolute bottom-0 left-0" />
                </div>

                {/* P3: 16 LECLERC (+0.119s) */}
                <div className="rounded-xl border border-red-500/30 bg-[#0b0e14] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center space-x-1.5">
                      <span className="bg-[#1f2633] text-red-400 px-1.5 py-0.5 rounded text-[11px] font-black">16</span>
                      <span className="text-white font-extrabold">LECLERC (P3)</span>
                    </div>
                    <span className="rounded bg-[#e10600] text-white px-1.5 py-0.5 text-[10px] font-black">S</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="text-2xl font-black text-white font-mono">1:16.633</div>
                    <span className="text-xs text-red-400 font-bold">+0.119s</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Q1 & Q2 Broadcast Cards (Sainz vs Leclerc FanCode replica) */
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

                  {/* Card 2: 3 FERRARI LECLERC */}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
