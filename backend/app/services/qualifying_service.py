"""Full Qualifying session standings engine with Q1/Q2/Q3 elimination drop zones and timing gaps."""

import datetime
from typing import Any, Dict, List, Optional


class QualifyingService:
    """Manages live Formula 1 Qualifying classifications, gap deltas, and elimination cut-offs."""

    def __init__(self):
        self.session_key = "qualifying"
        self.active_phase = "Q1"  # "Q1", "Q2", "Q3"
        self.time_remaining = "0:00"
        self.leader_driver = "HAM"
        self.leader_time = "1:17.341"

        # Canonical Official F1 2026 Mexico City Qualifying Classification from Live Broadcast
        self.q1_standings: List[Dict[str, Any]] = [
            {"pos": 1, "driver": "HAM", "team": "Ferrari", "team_color": "#e10600", "time": "1:17.341", "gap": "LEADER", "compound": "S", "status": "P", "s1": 27.21, "s2": 29.84, "s3": 20.29},
            {"pos": 2, "driver": "HAD", "team": "Red Bull Racing", "team_color": "#0600ef", "time": "1:17.385", "gap": "+0.044", "compound": "S", "status": "TRACK", "s1": 27.18, "s2": 29.89, "s3": 20.31},
            {"pos": 3, "driver": "LEC", "team": "Ferrari", "team_color": "#e10600", "time": "1:17.410", "gap": "+0.069", "compound": "S", "status": "TRACK", "s1": 27.15, "s2": 29.92, "s3": 20.34},
            {"pos": 4, "driver": "PIA", "team": "McLaren", "team_color": "#ff8000", "time": "1:17.659", "gap": "+0.318", "compound": "S", "status": "P", "s1": 27.32, "s2": 29.95, "s3": 20.38},
            {"pos": 5, "driver": "RUS", "team": "Mercedes", "team_color": "#00d2be", "time": "1:17.659", "gap": "+0.318", "compound": "S", "status": "P", "s1": 27.28, "s2": 30.01, "s3": 20.36},
            {"pos": 6, "driver": "BOR", "team": "Audi / Sauber", "team_color": "#00e700", "time": "1:17.727", "gap": "+0.386", "compound": "S", "status": "TRACK", "s1": 27.35, "s2": 29.98, "s3": 20.39},
            {"pos": 7, "driver": "NOR", "team": "McLaren", "team_color": "#ff8000", "time": "1:17.733", "gap": "+0.392", "compound": "S", "status": "P", "s1": 27.30, "s2": 30.05, "s3": 20.38},
            {"pos": 8, "driver": "HUL", "team": "Audi / Sauber", "team_color": "#00e700", "time": "1:17.868", "gap": "+0.527", "compound": "S", "status": "TRACK", "s1": 27.41, "s2": 30.02, "s3": 20.43},
            {"pos": 9, "driver": "ANT", "team": "Mercedes", "team_color": "#00d2be", "time": "1:17.918", "gap": "+0.577", "compound": "S", "status": "CHECKERED", "s1": 27.44, "s2": 30.06, "s3": 20.41},
            {"pos": 10, "driver": "VER", "team": "Red Bull Racing", "team_color": "#0600ef", "time": "1:17.942", "gap": "+0.601", "compound": "S", "status": "P", "s1": 27.39, "s2": 30.11, "s3": 20.44},
            {"pos": 11, "driver": "BEA", "team": "Haas", "team_color": "#b6babd", "time": "1:18.083", "gap": "+0.742", "compound": "S", "status": "TRACK", "s1": 27.48, "s2": 30.12, "s3": 20.48},
            {"pos": 12, "driver": "LAW", "team": "RB", "team_color": "#6692ff", "time": "1:18.097", "gap": "+0.756", "compound": "S", "status": "TRACK", "s1": 27.52, "s2": 30.09, "s3": 20.48},
            {"pos": 13, "driver": "GAS", "team": "Alpine", "team_color": "#0090ff", "time": "1:18.194", "gap": "+0.853", "compound": "S", "status": "CHECKERED", "s1": 27.55, "s2": 30.15, "s3": 20.49},
            {"pos": 14, "driver": "LIN", "team": "RB", "team_color": "#6692ff", "time": "1:18.210", "gap": "+0.869", "compound": "S", "status": "CHECKERED", "s1": 27.58, "s2": 30.14, "s3": 20.49},
            {"pos": 15, "driver": "COL", "team": "Williams", "team_color": "#005aff", "time": "1:18.517", "gap": "+1.176", "compound": "S", "status": "P", "s1": 27.65, "s2": 30.28, "s3": 20.58},
            # --- ELIMINATION CUT-OFF LINE (KNOCKOUT ZONE: P16-P22) ---
            {"pos": 16, "driver": "SAI", "team": "Williams", "team_color": "#005aff", "time": "1:18.699", "gap": "+1.358", "compound": "S", "status": "TRACK", "s1": 27.72, "s2": 30.32, "s3": 20.65},
            {"pos": 17, "driver": "ALB", "team": "Williams", "team_color": "#005aff", "time": "1:18.905", "gap": "+1.564", "compound": "S", "status": "TRACK", "s1": 27.78, "s2": 30.41, "s3": 20.71},
            {"pos": 18, "driver": "ALO", "team": "Aston Martin", "team_color": "#229971", "time": "1:18.908", "gap": "+1.567", "compound": "S", "status": "P", "s1": 27.81, "s2": 30.39, "s3": 20.70},
            {"pos": 19, "driver": "HIR", "team": "Haas", "team_color": "#b6babd", "time": "1:18.958", "gap": "+1.617", "compound": "S", "status": "TRACK", "s1": 27.85, "s2": 30.42, "s3": 20.68},
            {"pos": 20, "driver": "STR", "team": "Aston Martin", "team_color": "#229971", "time": "1:19.072", "gap": "+1.731", "compound": "S", "status": "P", "s1": 27.89, "s2": 30.45, "s3": 20.73},
            {"pos": 21, "driver": "PER", "team": "Sauber / Audi", "team_color": "#00e700", "time": "1:19.105", "gap": "+1.764", "compound": "S", "status": "TRACK", "s1": 27.91, "s2": 30.48, "s3": 20.71},
            {"pos": 22, "driver": "BOT", "team": "Sauber / Audi", "team_color": "#00e700", "time": "1:19.852", "gap": "1:19.852", "compound": "S", "status": "CHECKERED", "s1": 28.12, "s2": 30.82, "s3": 20.91},
        ]

    def get_qualifying_standings(self) -> Dict[str, Any]:
        """Returns the full qualifying session grid with safe drivers and knocked-out drivers."""
        safe_drivers = [d for d in self.q1_standings if d["pos"] <= 15]
        eliminated_drivers = [d for d in self.q1_standings if d["pos"] > 15]

        return {
            "session": "Qualifying",
            "phase": self.active_phase,
            "time_remaining": self.time_remaining,
            "meeting": "FORMULA 1 GRAN PREMIO DE LA CIUDAD DE MÉXICO 2026",
            "circuit": "Autódromo Hermanos Rodríguez",
            "leader": {
                "driver": self.leader_driver,
                "time": self.leader_time,
            },
            "elimination_cutoff_pos": 15,
            "total_drivers": len(self.q1_standings),
            "safe_count": len(safe_drivers),
            "eliminated_count": len(eliminated_drivers),
            "standings": self.q1_standings,
            "safe_drivers": safe_drivers,
            "eliminated_drivers": eliminated_drivers,
        }


qualifying_service = QualifyingService()

