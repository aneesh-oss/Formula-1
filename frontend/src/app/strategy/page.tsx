"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Compass, Layers, ShieldCheck, Zap } from "lucide-react";

export default function StrategyPage() {
  const [currentLap, setCurrentLap] = useState<number>(18);
  const [totalLaps, setTotalLaps] = useState<number>(53);
  const [currentCompound, setCurrentCompound] = useState<string>("MEDIUM");
  const [gapToCarAhead, setGapToCarAhead] = useState<number>(1.8);
  const [safetyCarStatus, setSafetyCarStatus] = useState<string>("GREEN");

  // Pit loss time (Monza pit lane transit is ~24.0s under green flag, ~13.5s under VSC/SC)
  const pitLoss = safetyCarStatus === "GREEN" ? 24.0 : 13.5;

  // Stint pace modeling
  const tireAge = currentLap;
  const freshHardPaceGain = 1.35; // New Hard tire is ~1.35s faster per lap than 18-lap worn Medium
  const undercutFeasible = freshHardPaceGain > gapToCarAhead * 0.65;

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pitwall-border/80 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-pitwall-cyan font-semibold">
            <Compass className="h-4 w-4 text-pitwall-cyan" />
            <span>AI RACE STRATEGY & PIT WINDOW OPTIMIZATION</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            B2B Race Strategy Decision Engine
          </h1>
          <p className="text-xs text-gray-400">
            Real-time undercut/overcut simulation, compound cross-over points, and delta pit loss modeling.
          </p>
        </div>

        {/* Track Status Badge */}
        <div className="flex items-center space-x-2 bg-pitwall-panel border border-pitwall-border rounded-lg px-3 py-1.5 font-mono text-xs">
          <span className="text-gray-400">TRACK STATUS:</span>
          <select
            value={safetyCarStatus}
            onChange={(e) => setSafetyCarStatus(e.target.value)}
            className="bg-pitwall-card border border-pitwall-border text-white text-xs font-bold rounded px-2 py-0.5 outline-none focus:border-pitwall-cyan"
          >
            <option value="GREEN">🟢 GREEN FLAG</option>
            <option value="VSC">🟡 VIRTUAL SAFETY CAR</option>
            <option value="SC">🟠 FULL SAFETY CAR</option>
          </select>
        </div>
      </div>

      {/* Simulator Inputs & Decision Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Controls */}
        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-5 shadow-xl flex flex-col space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300 font-mono border-b border-pitwall-border pb-2">
            Stint & Gap Parameters
          </h2>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-gray-400">Current Race Lap</span>
              <span className="text-white font-bold">{currentLap} / {totalLaps}</span>
            </div>
            <input
              type="range"
              min="1"
              max={totalLaps}
              value={currentLap}
              onChange={(e) => setCurrentLap(Number(e.target.value))}
              className="w-full accent-pitwall-red cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-gray-400">Gap to Target Ahead</span>
              <span className="text-pitwall-cyan font-bold">{gapToCarAhead.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="6.0"
              step="0.1"
              value={gapToCarAhead}
              onChange={(e) => setGapToCarAhead(Number(e.target.value))}
              className="w-full accent-pitwall-cyan cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-gray-400 block mb-1.5">Current Compound on Car</label>
            <div className="grid grid-cols-3 gap-2">
              {["SOFT", "MEDIUM", "HARD"].map((comp) => (
                <button
                  key={comp}
                  onClick={() => setCurrentCompound(comp)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    currentCompound === comp
                      ? comp === "SOFT"
                        ? "bg-red-600/20 text-red-400 border-red-500"
                        : comp === "MEDIUM"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500"
                        : "bg-slate-200/20 text-white border-white"
                      : "bg-pitwall-card text-gray-400 border-pitwall-border hover:text-white"
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-pitwall-border text-[11px] font-mono text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Pit Transit Loss:</span>
              <span className="text-white font-bold">{pitLoss.toFixed(1)}s</span>
            </div>
            <div className="flex justify-between">
              <span>Fresh Hard Delta:</span>
              <span className="text-emerald-400 font-bold">+{freshHardPaceGain}s / lap</span>
            </div>
          </div>
        </div>

        {/* Center & Right: Strategic Verdict & Recommendations */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {/* Main Strategic Verdict Card */}
          <div className={`rounded-xl border p-5 shadow-2xl transition-all ${
            undercutFeasible
              ? "bg-emerald-950/20 border-emerald-500/40"
              : "bg-amber-950/20 border-amber-500/40"
          }`}>
            <div className="flex items-center space-x-3">
              {undercutFeasible ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0" />
              )}
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  {undercutFeasible
                    ? "STRATEGIC RECOMMENDATION: EXECUTE UNDERCUT NOW"
                    : "STRATEGIC RECOMMENDATION: EXTEND STINT (OVERCUT WINDOW)"}
                </h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  {undercutFeasible
                    ? `Gap of ${gapToCarAhead}s is within the 1-lap out-lap delta window. Box now for C3 Hard.`
                    : `Gap of ${gapToCarAhead}s is too wide for immediate 1-lap undercut. Running in clean air yields superior race pace.`}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 font-mono text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase block">Pit Exit Clean Air</span>
                <span className="text-emerald-400 font-bold">P4 (Clear by 3.2s)</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase block">Out-Lap Pace Delta</span>
                <span className="text-white font-bold">+{freshHardPaceGain}s</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase block">Optimal Stint Length</span>
                <span className="text-pitwall-cyan font-bold">Laps 18–35</span>
              </div>
            </div>
          </div>

          {/* Compound Crossover Matrix */}
          <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 font-mono mb-3">
              Compound Degradation Crossover Matrix (Monza)
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-red-400 font-bold">C5 Soft (Max 16 Laps)</span>
                  <span className="text-gray-400">Degradation: 0.11s/lap</span>
                </div>
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: "35%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-amber-400 font-bold">C4 Medium (Max 26 Laps)</span>
                  <span className="text-gray-400">Degradation: 0.07s/lap</span>
                </div>
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: "65%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-white font-bold">C3 Hard (Max 42 Laps)</span>
                  <span className="text-gray-400">Degradation: 0.04s/lap</span>
                </div>
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-pitwall-cyan rounded-full" style={{ width: "90%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

