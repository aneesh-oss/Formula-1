"use client";

import { useEffect, useState } from "react";
import { Award, BarChart2, Calendar, ChevronRight, Flag, Trophy, Users } from "lucide-react";
import { ConstructorStanding, DriverStanding, fetchConstructorStandings, fetchDriverStandings } from "@/lib/api";

export default function ChampionshipPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [activeTab, setActiveTab] = useState<"drivers" | "constructors">("drivers");
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Available seasons
  const seasons = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2010, 2008, 2005, 2000, 1998, 1994, 1988];

  useEffect(() => {
    async function loadStandings() {
      setLoading(true);
      try {
        const [dList, cList] = await Promise.all([
          fetchDriverStandings(selectedYear),
          fetchConstructorStandings(selectedYear),
        ]);
        setDrivers(dList);
        setConstructors(cList);
      } catch (err) {
        console.error("Failed to load championship data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStandings();
  }, [selectedYear]);

  const leaderPoints =
    activeTab === "drivers"
      ? drivers[0]?.points || 1
      : constructors[0]?.points || 1;

  const getTeamColor = (teamName: string) => {
    const lower = teamName.toLowerCase();
    if (lower.includes("red bull")) return "bg-blue-600 text-blue-200 border-blue-500/40";
    if (lower.includes("mclaren")) return "bg-orange-500 text-orange-100 border-orange-400/40";
    if (lower.includes("ferrari")) return "bg-red-600 text-red-200 border-red-500/40";
    if (lower.includes("mercedes")) return "bg-teal-500 text-teal-100 border-teal-400/40";
    if (lower.includes("aston")) return "bg-emerald-600 text-emerald-200 border-emerald-500/40";
    if (lower.includes("alpine")) return "bg-pink-600 text-pink-200 border-pink-500/40";
    if (lower.includes("haas")) return "bg-gray-700 text-gray-200 border-gray-600/40";
    if (lower.includes("williams")) return "bg-cyan-700 text-cyan-200 border-cyan-600/40";
    return "bg-slate-700 text-slate-200 border-slate-600/40";
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Title & Season Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pitwall-border/80 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-pitwall-cyan font-semibold">
            <Trophy className="h-4 w-4 text-pitwall-yellow" />
            <span>F1 WORLD CHAMPIONSHIP ARCHIVE & BENCHMARKING</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Season Standings & Historical Results
          </h1>
          <p className="text-xs text-gray-400">
            Track driver and constructor rankings, points trajectories, and championship margins across all F1 seasons.
          </p>
        </div>

        {/* Season Selector Dropdown */}
        <div className="flex items-center space-x-3 bg-pitwall-panel border border-pitwall-border rounded-lg px-3 py-2 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-400 font-semibold uppercase">Season:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-pitwall-card border border-pitwall-border text-white text-xs font-bold rounded px-2.5 py-1 outline-none focus:border-pitwall-cyan font-mono"
          >
            {seasons.map((yr) => (
              <option key={yr} value={yr}>
                {yr} Championship Season
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Strategic Summary Cards for the Season */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">{selectedYear} Drivers' Champion</span>
            <Trophy className="h-4 w-4 text-pitwall-yellow" />
          </div>
          <div className="mt-2 text-xl font-black text-white font-mono">
            {drivers[0]?.driver || "Loading..."}
          </div>
          <p className="mt-1 text-xs text-pitwall-cyan font-medium">
            {drivers[0]?.constructor} — {drivers[0]?.points} PTS ({drivers[0]?.wins} Wins)
          </p>
        </div>

        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">{selectedYear} Constructors' Champion</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-black text-white font-mono">
            {constructors[0]?.constructor || "Loading..."}
          </div>
          <p className="mt-1 text-xs text-emerald-400 font-medium">
            {constructors[0]?.points} Total Points ({constructors[0]?.wins} Wins)
          </p>
        </div>

        <div className="rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Championship Winning Margin</span>
            <BarChart2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl font-black text-white font-mono">
            {drivers.length > 1
              ? `+${(drivers[0].points - drivers[1].points).toFixed(1)} PTS`
              : "N/A"}
          </div>
          <p className="mt-1 text-xs text-gray-400 font-medium">
            Gap between 1st ({drivers[0]?.code}) and 2nd ({drivers[1]?.code})
          </p>
        </div>
      </div>

      {/* Tabs: Drivers vs Constructors */}
      <div className="flex items-center space-x-2 border-b border-pitwall-border">
        <button
          onClick={() => setActiveTab("drivers")}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === "drivers"
              ? "border-pitwall-cyan text-pitwall-cyan"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Drivers' Championship (WDC)</span>
        </button>
        <button
          onClick={() => setActiveTab("constructors")}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === "constructors"
              ? "border-pitwall-cyan text-pitwall-cyan"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Flag className="h-4 w-4" />
          <span>Constructors' Championship (WCC)</span>
        </button>
      </div>

      {/* Standings Table */}
      <div className="rounded-xl border border-pitwall-border bg-pitwall-panel overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center font-mono text-sm text-gray-400">
            Loading {selectedYear} championship data...
          </div>
        ) : activeTab === "drivers" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-pitwall-border bg-pitwall-card/80 text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                <tr>
                  <th className="py-3.5 px-4 w-16">Pos</th>
                  <th className="py-3.5 px-4">Driver</th>
                  <th className="py-3.5 px-4">Constructor</th>
                  <th className="py-3.5 px-4 text-center">Wins</th>
                  <th className="py-3.5 px-4">Points Share</th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                  <th className="py-3.5 px-4 text-right">Gap to Leader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pitwall-border/40 font-mono">
                {drivers.map((d) => {
                  const pct = Math.max(3, (d.points / leaderPoints) * 100);
                  const gap = d.position === 1 ? "-" : `-${(leaderPoints - d.points).toFixed(1)}`;
                  return (
                    <tr
                      key={d.position}
                      className="hover:bg-pitwall-card/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold">
                        {d.position === 1 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-amber-400 font-black border border-amber-400/30">
                            1
                          </span>
                        ) : d.position === 2 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/20 text-slate-300 font-black border border-slate-300/30">
                            2
                          </span>
                        ) : d.position === 3 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 font-black border border-amber-700/30">
                            3
                          </span>
                        ) : (
                          <span className="text-gray-400 pl-2">{d.position}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-white text-sm">
                        {d.driver}{" "}
                        <span className="font-mono text-xs text-gray-400 font-normal">
                          ({d.code})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold border ${getTeamColor(
                            d.constructor
                          )}`}
                        >
                          {d.constructor}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-200">
                        {d.wins}
                      </td>
                      <td className="py-3 px-4 w-44">
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-pitwall-cyan rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-white text-sm">
                        {d.points.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        {gap}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-pitwall-border bg-pitwall-card/80 text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                <tr>
                  <th className="py-3.5 px-4 w-16">Pos</th>
                  <th className="py-3.5 px-4">Manufacturer / Constructor</th>
                  <th className="py-3.5 px-4 text-center">Wins</th>
                  <th className="py-3.5 px-4">Points Share</th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                  <th className="py-3.5 px-4 text-right">Gap to Leader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pitwall-border/40 font-mono">
                {constructors.map((c) => {
                  const pct = Math.max(3, (c.points / leaderPoints) * 100);
                  const gap = c.position === 1 ? "-" : `-${(leaderPoints - c.points).toFixed(1)}`;
                  return (
                    <tr
                      key={c.position}
                      className="hover:bg-pitwall-card/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold">
                        {c.position === 1 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-amber-400 font-black border border-amber-400/30">
                            1
                          </span>
                        ) : c.position === 2 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/20 text-slate-300 font-black border border-slate-300/30">
                            2
                          </span>
                        ) : c.position === 3 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 font-black border border-amber-700/30">
                            3
                          </span>
                        ) : (
                          <span className="text-gray-400 pl-2">{c.position}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-white text-sm">
                        <span
                          className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold border ${getTeamColor(
                            c.constructor
                          )}`}
                        >
                          {c.constructor}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-200">
                        {c.wins}
                      </td>
                      <td className="py-3 px-4 w-44">
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-white text-sm">
                        {c.points.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        {gap}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
