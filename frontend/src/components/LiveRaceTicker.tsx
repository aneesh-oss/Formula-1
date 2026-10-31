"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle, Flag, Radio, RefreshCw, Zap } from "lucide-react";

export interface LiveLapEvent {
  event: string;
  meeting_name?: string;
  session_name?: string;
  circuit_name?: string;
  driver: string;
  lap_number: number;
  gap_to_leader: string;
  sector_times?: {
    s1: number;
    s2: number;
    s3: number;
    lap_time: number;
  };
  tire_status?: {
    compound: string;
    stint_lap: number;
    fl_wear: number;
    fr_wear: number;
    rl_wear: number;
    rr_wear: number;
    state: string;
  };
  timestamp: string;
}

export default function LiveRaceTicker() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [meetingName, setMeetingName] = useState<string>("FORMULA 1 GRAN PREMIO DE LA CIUDAD DE MÉXICO 2026");
  const [sessionName, setSessionName] = useState<string>("Qualifying (Q1)");
  const [circuitName, setCircuitName] = useState<string>("Autódromo Hermanos Rodríguez — Mexico City");
  const [currentLap, setCurrentLap] = useState<number>(12);
  const [trackStatus, setTrackStatus] = useState<string>("GREEN");
  const [latestEvent, setLatestEvent] = useState<LiveLapEvent | null>({
    event: "LAP_COMPLETE",
    driver: "VER",
    lap_number: 12,
    gap_to_leader: "LEADER",
    sector_times: { s1: 27.18, s2: 29.62, s3: 19.35, lap_time: 76.15 },
    tire_status: { compound: "SOFT", stint_lap: 4, fl_wear: 18.5, fr_wear: 17.5, rl_wear: 20.0, rr_wear: 16.5, state: "OPTIMAL" },
    timestamp: new Date().toISOString(),
  });
  const [recentEvents, setRecentEvents] = useState<LiveLapEvent[]>([
    {
      event: "LAP_COMPLETE",
      driver: "VER",
      lap_number: 12,
      gap_to_leader: "LEADER",
      sector_times: { s1: 27.18, s2: 29.62, s3: 19.35, lap_time: 76.15 },
      tire_status: { compound: "SOFT", stint_lap: 4, fl_wear: 18.5, fr_wear: 17.5, rl_wear: 20.0, rr_wear: 16.5, state: "OPTIMAL" },
      timestamp: new Date().toISOString(),
    },
    {
      event: "LAP_COMPLETE",
      driver: "NOR",
      lap_number: 12,
      gap_to_leader: "+0.130s",
      sector_times: { s1: 27.24, s2: 29.58, s3: 19.46, lap_time: 76.28 },
      tire_status: { compound: "SOFT", stint_lap: 4, fl_wear: 17.8, fr_wear: 16.9, rl_wear: 19.5, rr_wear: 16.0, state: "OPTIMAL" },
      timestamp: new Date().toISOString(),
    },
    {
      event: "LAP_COMPLETE",
      driver: "LEC",
      lap_number: 12,
      gap_to_leader: "+0.190s",
      sector_times: { s1: 27.29, s2: 29.64, s3: 19.41, lap_time: 76.34 },
      tire_status: { compound: "SOFT", stint_lap: 5, fl_wear: 21.2, fr_wear: 20.1, rl_wear: 23.3, rr_wear: 19.0, state: "OPTIMAL" },
      timestamp: new Date().toISOString(),
    },
    {
      event: "LAP_COMPLETE",
      driver: "SAI",
      lap_number: 12,
      gap_to_leader: "+0.270s",
      sector_times: { s1: 27.31, s2: 29.69, s3: 19.42, lap_time: 76.42 },
      tire_status: { compound: "SOFT", stint_lap: 4, fl_wear: 18.0, fr_wear: 17.1, rl_wear: 19.8, rr_wear: 16.2, state: "OPTIMAL" },
      timestamp: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    // 1. Initial instant fetch from DuckDB in-memory table
    fetch("/api/v1/live/latest?limit=5")
      .then((res) => res.json())
      .then((json) => {
        if (json && json.data && json.data.length > 0) {
          const first = json.data[0];
          setLatestEvent({
            event: "LAP_COMPLETE",
            driver: first.driver,
            lap_number: first.lap_number,
            gap_to_leader: first.gap_to_leader,
            sector_times: { s1: first.s1, s2: first.s2, s3: first.s3, lap_time: first.lap_time },
            tire_status: {
              compound: first.compound,
              stint_lap: first.stint_lap,
              fl_wear: first.fl_wear,
              fr_wear: first.fr_wear,
              rl_wear: first.rl_wear,
              rr_wear: first.rr_wear,
              state: first.tire_state,
            },
            timestamp: first.timestamp,
          });
          setCurrentLap(json.current_lap || first.lap_number);
          setIsConnected(true);
        }
      })
      .catch(() => {});

    // 2. Real-time Server-Sent Events stream listener
    let eventSource: EventSource | null = null;
    const connectSSE = () => {
      try {
        eventSource = new EventSource("/api/v1/live/stream");

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === "STREAM_CONNECTED") {
              if (data.meeting_name) setMeetingName(data.meeting_name);
              if (data.session_name) setSessionName(data.session_name);
              if (data.circuit_name) setCircuitName(data.circuit_name);
              if (data.lap_number) setCurrentLap(data.lap_number);
              if (data.track_status) setTrackStatus(data.track_status);
              setIsConnected(true);
            } else if (data.event === "LAP_COMPLETE") {
              setLatestEvent(data);
              setCurrentLap(data.lap_number);
              if (data.meeting_name) setMeetingName(data.meeting_name);
              if (data.session_name) setSessionName(data.session_name);
              setRecentEvents((prev) => [data, ...prev.slice(0, 4)]);
            }
          } catch (err) {
            console.error("Error parsing live SSE frame", err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        setIsConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  return (
    <div className="rounded-2xl border border-pitwall-border bg-gradient-to-r from-[#151921] via-[#10131a] to-[#151921] p-4 shadow-xl space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Stream Status & Header */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black uppercase tracking-wider text-white">
                {meetingName}
              </span>
              <span className="rounded bg-pitwall-red/20 px-2 py-0.5 font-mono text-[10px] font-black text-pitwall-red border border-pitwall-red/40 tracking-widest animate-pulse">
                {sessionName}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isConnected
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {isConnected ? "LIVE STREAM ACTIVE" : "RECONNECTING"}
              </span>
            </div>
            <p className="text-[11px] font-mono text-gray-400">
              {circuitName} &bull; Flying Lap {currentLap} &bull; Track: {trackStatus} &bull; In-Memory DuckDB
            </p>
          </div>
        </div>

        {/* Latest Flash Flying Lap Event */}
        {latestEvent && (
          <div className="flex items-center space-x-3 rounded-xl border border-[#232936] bg-[#0b0e14]/90 px-4 py-2 font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-gray-500 uppercase">Sector 3 Flash:</span>
              <span className="font-black text-pitwall-cyan text-sm">{latestEvent.driver}</span>
            </div>

            {latestEvent.sector_times && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-black text-white text-sm">{latestEvent.sector_times.lap_time}s</span>
                <span className={`text-[11px] font-bold ${latestEvent.gap_to_leader === "LEADER" ? "text-purple-400" : "text-emerald-400"}`}>
                  ({latestEvent.gap_to_leader})
                </span>
              </div>
            )}

            {latestEvent.tire_status && (
              <div className="flex items-center space-x-1.5 text-[11px]">
                <span className="rounded bg-red-500/20 px-1 py-0.5 font-black text-red-400 border border-red-500/30">
                  {latestEvent.tire_status.compound[0]}
                </span>
                <span className="text-gray-400">FL:</span>
                <span className="font-bold text-emerald-400">
                  {latestEvent.tire_status.fl_wear}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mini Recent Crossings Ticker */}
      {recentEvents.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[#232936] pt-2 text-[11px] font-mono">
          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Leaderboard Flying Laps:</span>
          {recentEvents.map((ev, idx) => (
            <div
              key={`${ev.driver}-${ev.lap_number}-${idx}`}
              className="flex items-center space-x-1.5 rounded bg-[#0b0e14] px-2.5 py-1 border border-[#232936]"
            >
              <span className="font-black text-pitwall-cyan">{ev.driver}</span>
              <span className="text-white font-bold">{ev.sector_times?.lap_time}s</span>
              <span className={`text-[10px] font-bold ${ev.gap_to_leader === "LEADER" ? "text-purple-400" : "text-emerald-400"}`}>
                {ev.gap_to_leader}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
