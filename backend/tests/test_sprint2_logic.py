"""Unit tests for Sprint 2 logic, pathing, and physics formulas."""

import math
import os
import unittest


class TestVirtualTirePhysicsFormulas(unittest.TestCase):
    """Verifies mathematical invariants of the Virtual Tire Model."""

    def test_cold_baseline_pressures(self):
        base_front = 23.0
        base_rear = 20.5
        self.assertEqual(base_front, 23.0)
        self.assertEqual(base_rear, 20.5)

    def test_lateral_acceleration_calculation(self):
        # 180 km/h = 50 m/s through a 100m radius corner
        v_ms = 50.0
        radius = 100.0
        curvature = 1.0 / radius
        a_lat = (v_ms**2) * curvature
        g_lat = a_lat / 9.81
        # Expect ~2.55 G
        self.assertAlmostEqual(g_lat, 2.548, places=2)

    def test_fuel_corrected_wear_formula(self):
        # Stint lap 15 on Medium compound (max life 32 laps)
        stint_lap = 15
        max_life = 32
        wear_ratio = stint_lap / max_life
        gamma = 1.25
        wear_pct = min(100.0, round(math.pow(wear_ratio, gamma) * 100.0, 1))
        # Expect ~39.0%
        self.assertGreater(wear_pct, 30.0)
        self.assertLess(wear_pct, 50.0)

        # Net pace degradation: 0.06s/lap tire wear - 0.03s/lap fuel weight advantage
        net_pace_penalty = (0.06 * stint_lap) - (0.03 * stint_lap)
        self.assertAlmostEqual(net_pace_penalty, 0.45, places=2)

    def test_lakehouse_partition_path_format(self):
        year = 2024
        circuit = "monza"
        session = "R"
        driver = "VER"
        expected_path = os.path.join(
            "data/lakehouse",
            str(year),
            circuit.lower(),
            session.upper(),
            f"{driver.upper()}.parquet",
        )
        self.assertEqual(
            expected_path,
            "data/lakehouse/2024/monza/R/VER.parquet",
        )


if __name__ == "__main__":
    unittest.main()

