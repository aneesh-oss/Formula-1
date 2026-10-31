/**
 * PitWall OS API Client
 */

const API_BASE = typeof window !== "undefined" ? "" : (process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000");

export interface TelemetryPoint {
  distance: number;
  speed_a: number;
  speed_b: number;
  speed_delta: number;
  throttle_a: number;
  throttle_b: number;
  brake_a: number;
  brake_b: number;
  time_a: number;
  time_b: number;
  time_delta: number;
  x_a: number;
  y_a: number;
  x_b: number;
  y_b: number;
  g_lat_a?: number;
  g_lat_b?: number;
}

export interface CompareResponse {
  year: number;
  circuit: string;
  session: string;
  driver_a: string;
  driver_b: string;
  lap_number: number;
  points_count: number;
  data: TelemetryPoint[];
}

export interface TireStintLap {
  lap_number: number;
  compound: string;
  tyre_life: number;
  lap_time_seconds: number;
  avg_pressure_fl: number;
  avg_pressure_fr: number;
  avg_pressure_rl: number;
  avg_pressure_rr: number;
  avg_temp_fl: number;
  avg_temp_fr: number;
  avg_temp_rl: number;
  avg_temp_rr: number;
  max_wear_pct: number;
}

export interface TireResponse {
  year: number;
  circuit: string;
  session: string;
  driver: string;
  stint_laps: number;
  history: TireStintLap[];
}

export interface DriverStanding {
  position: number;
  driver: string;
  code: string;
  constructor: string;
  points: number;
  wins: number;
  nationality: string;
}

export interface ConstructorStanding {
  position: number;
  constructor: string;
  points: number;
  wins: number;
  nationality: string;
}

export async function fetchTelemetryCompare(
  driverA: string = "VER",
  driverB: string = "NOR",
  year: number = 2024,
  circuit: string = "monza",
  session: string = "R"
): Promise<CompareResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/telemetry/compare?year=${year}&circuit=${circuit}&session=${session}&driver_a=${driverA}&driver_b=${driverB}`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error(`Telemetry comparison error: ${res.statusText}`);
  return res.json();
}

export async function fetchTireMetrics(
  driver: string = "VER",
  year: number = 2024,
  circuit: string = "monza",
  session: string = "R"
): Promise<TireResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/telemetry/tires?year=${year}&circuit=${circuit}&session=${session}&driver=${driver}`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error(`Tire metrics error: ${res.statusText}`);
  return res.json();
}

export async function fetchDriverStandings(year: number = 2024): Promise<DriverStanding[]> {
  const res = await fetch(`${API_BASE}/api/v1/championship/standings/drivers?year=${year}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Driver standings error: ${res.statusText}`);
  const data = await res.json();
  return data.standings;
}

export interface CircuitMapResponse {
  circuit: string;
  name: string;
  lap_length_meters: number;
  total_turns: number;
  sector_boundaries: {
    sector_1: { start: number; end: number };
    sector_2: { start: number; end: number };
    sector_3: { start: number; end: number };
  };
  turns: Array<{
    number: string;
    name: string;
    distance: number;
    sector: number;
    type: string;
  }>;
  geometry: Array<{
    distance: number;
    x: number;
    y: number;
    sector: number;
  }>;
}

export interface SectorTime {
  time: number;
  status: "purple" | "green" | "yellow";
  color: string;
}

export interface LapSectorData {
  lap_number: number;
  compound: string;
  lap_time_seconds: number;
  sector_1: SectorTime;
  sector_2: SectorTime;
  sector_3: SectorTime;
  pit_stop?: {
    type: string;
    stationary_time_sec?: number;
    pit_lane_transit_sec?: number;
    old_compound?: string;
    new_compound?: string;
    compound?: string;
  } | null;
}

export interface SessionSectorsResponse {
  session_id: string;
  driver: string;
  overall_best_sectors: {
    sector_1: { time: number; driver: string };
    sector_2: { time: number; driver: string };
    sector_3: { time: number; driver: string };
  };
  total_laps_recorded: number;
  laps: LapSectorData[];
}

export interface TireCornerHealth {
  corner: string;
  wear_pct: number;
  pressure_psi: number;
  temp_celsius: number;
  status: "OPTIMAL" | "DEGRADING" | "GRIP_LOST";
  status_code: string;
  color: string;
  description: string;
}

export interface CarHealthResponse {
  driver: string;
  stint_lap: number;
  compound: string;
  tires: {
    front_left: TireCornerHealth;
    front_right: TireCornerHealth;
    rear_left: TireCornerHealth;
    rear_right: TireCornerHealth;
  };
  brakes: {
    front_disc_temp_celsius: number;
    rear_disc_temp_celsius: number;
    front_pad_wear_pct: number;
    rear_pad_wear_pct: number;
    status: string;
    color: string;
    is_heavy_braking: boolean;
  };
  clutch: {
    status: string;
    slip_pct: number;
    temp_celsius: number;
    color: string;
  };
  overall_vehicle_status: "HEALTHY" | "WARNING" | "CRITICAL";
}

export async function fetchCircuitMap(circuitName: string = "monza"): Promise<CircuitMapResponse> {
  const res = await fetch(`${API_BASE}/api/v1/circuits/${circuitName}/map`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Circuit map error: ${res.statusText}`);
  return res.json();
}

export async function fetchSessionSectors(
  sessionId: string = "2024_monza_R",
  driver: string = "VER"
): Promise<SessionSectorsResponse> {
  const res = await fetch(`${API_BASE}/api/v1/sessions/${sessionId}/sectors?driver=${driver}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Session sectors error: ${res.statusText}`);
  return res.json();
}

export async function fetchVehicleHealth(
  driver: string = "VER",
  stintLap: number = 14,
  compound: string = "MEDIUM"
): Promise<CarHealthResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/telemetry/${driver}/health?stint_lap=${stintLap}&compound=${compound}`,
    { next: { revalidate: 15 } }
  );
  if (!res.ok) throw new Error(`Vehicle health error: ${res.statusText}`);
  return res.json();
}

export async function fetchConstructorStandings(year: number = 2024): Promise<ConstructorStanding[]> {
  const res = await fetch(`${API_BASE}/api/v1/championship/standings/constructors?year=${year}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Constructor standings error: ${res.statusText}`);
  const data = await res.json();
  return data.standings;
}

export interface CornerGeometry {
  number: number;
  letter: string;
  name: string;
  x: number;
  y: number;
  z: number;
  distance: number;
  angle: number;
  apex_speed_kmh?: number;
  braking_delta_g?: string;
  recommended_gear?: number;
  sector?: number;
}

export interface CircuitGeometryResponse {
  circuit_name: string;
  track_length_meters: number;
  spline_points: [number, number, number][];
  sectors: {
    s1_end_dist: number;
    s2_end_dist: number;
    s3_end_dist: number;
  };
  corners: CornerGeometry[];
}

export async function fetchCircuitGeometry(
  year: number = 2024,
  circuit: string = "monza",
  sessionType: string = "R"
): Promise<CircuitGeometryResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/circuits/${year}/${circuit.toLowerCase()}/geometry?session_type=${sessionType}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Circuit geometry error: ${res.statusText}`);
  return res.json();
}


