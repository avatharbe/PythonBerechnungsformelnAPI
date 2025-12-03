"""
MaBiS Time Series API - Demo Client

Demonstriert die vollständige Nutzung der MaBiS API mit dem Mock-Server.

Voraussetzungen:
    1. Mock-Server muss laufen: python mock_api_server.py
    2. Server läuft auf: http://localhost:5000

Verwendung:
    python demo_client.py
"""

from __future__ import annotations

import requests
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any
import json


class MaBiSDemoClient:
    """Demo-Client für MaBiS Time Series API"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token = None

    def authenticate(self):
        """OAuth2 Token abrufen"""
        print("\n" + "=" * 60)
        print("1. AUTHENTIFIZIERUNG")
        print("=" * 60)

        response = requests.post(
            f"{self.base_url}/oauth/token",
            data={
                'grant_type': 'client_credentials',
                'client_id': 'demo-client',
                'client_secret': 'demo-secret',
                'scope': 'timeseries.read timeseries.write formulas.read formulas.write calculations.execute'
            }
        )

        if response.status_code == 200:
            token_data = response.json()
            self.token = token_data['access_token']
            print(f"✅ Token erhalten: {self.token[:20]}...")
            print(f"   Gültig für: {token_data['expires_in']} Sekunden")
            return True
        else:
            print(f"❌ Fehler bei Authentifizierung: {response.status_code}")
            return False

    def _get_headers(self) -> Dict[str, str]:
        """Authorization Header zurückgeben"""
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }

    def submit_time_series(self) -> List[str]:
        """Zeitreihendaten übermitteln"""
        print("\n" + "=" * 60)
        print("2. ZEITREIHENDATEN ÜBERMITTELN")
        print("=" * 60)

        # Zeitraum: heute, 96 Intervalle (15-Minuten-Werte für 24 Stunden)
        start_time = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        # Beispiel: BESS Batterieladung - 3 Messstellen
        time_series_data = {
            "messageId": "MSG-DEMO-001",
            "timeSeries": [
                # W+Z1: Bezug am Netzverknüpfungspunkt
                {
                    "timeSeriesId": "TS-WZ1-001",
                    "marketLocationId": "DE0123456789012345678901234567890",
                    "measurementType": "CONSUMPTION",
                    "unit": "KWH",
                    "resolution": "PT15M",
                    "obisCode": "1-1:1.29.0",
                    "meteringPoint": {
                        "id": "MP-WZ1",
                        "name": "Netzverknüpfungspunkt Bezug",
                        "type": "GRID_CONNECTION"
                    },
                    "period": {
                        "start": start_time.isoformat().replace('+00:00', 'Z'),
                        "end": (start_time + timedelta(days=1)).isoformat().replace('+00:00', 'Z')
                    },
                    "intervals": self._generate_intervals(start_time, [
                        100, 120, 150, 180, 200, 220, 250, 280,  # Nachtstunden
                        300, 350, 400, 450, 500, 550, 600, 650,  # Morgen
                        700, 750, 800, 850, 900, 950, 1000, 1050,  # Vormittag
                        1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450,  # Mittag
                        1400, 1350, 1300, 1250, 1200, 1150, 1100, 1050,  # Nachmittag
                        1000, 950, 900, 850, 800, 750, 700, 650,  # Abend
                        600, 550, 500, 450, 400, 350, 300, 250,  # Nacht
                        200, 180, 150, 120, 100, 90, 80, 70,  # Spätnacht
                        60, 55, 50, 45, 40, 38, 35, 33,
                        30, 28, 26, 24, 22, 20, 18, 16,
                        15, 14, 13, 12, 11, 10, 9, 8,
                        7, 6, 5, 5, 4, 4, 3, 3
                    ])
                },
                # W+ZEV1: Eigenverbrauch 1
                {
                    "timeSeriesId": "TS-WZEV1-001",
                    "marketLocationId": "DE0123456789012345678901234567890",
                    "measurementType": "CONSUMPTION",
                    "unit": "KWH",
                    "resolution": "PT15M",
                    "obisCode": "1-1:1.29.0",
                    "meteringPoint": {
                        "id": "MP-WZEV1",
                        "name": "Eigenverbrauch Messpunkt 1",
                        "type": "INTERNAL_CONSUMPTION"
                    },
                    "period": {
                        "start": start_time.isoformat().replace('+00:00', 'Z'),
                        "end": (start_time + timedelta(days=1)).isoformat().replace('+00:00', 'Z')
                    },
                    "intervals": self._generate_intervals(start_time, [10] * 96)  # Konstant 10 kWh
                },
                # W+ZE_UW: Umspannwerk-Eigenverbrauch
                {
                    "timeSeriesId": "TS-WZEUW-001",
                    "marketLocationId": "DE0123456789012345678901234567890",
                    "measurementType": "CONSUMPTION",
                    "unit": "KWH",
                    "resolution": "PT15M",
                    "obisCode": "1-1:1.29.0",
                    "meteringPoint": {
                        "id": "MP-WZE_UW",
                        "name": "Umspannwerk Eigenverbrauch",
                        "type": "TRANSFORMER_LOSS"
                    },
                    "period": {
                        "start": start_time.isoformat().replace('+00:00', 'Z'),
                        "end": (start_time + timedelta(days=1)).isoformat().replace('+00:00', 'Z')
                    },
                    "intervals": self._generate_intervals(start_time, [5] * 96)  # Konstant 5 kWh
                }
            ]
        }

        response = requests.post(
            f"{self.base_url}/v1/time-series",
            headers=self._get_headers(),
            json=time_series_data
        )

        if response.status_code == 201:
            result = response.json()
            print(f"✅ Zeitreihen übermittelt:")
            for ts_id in result['timeSeriesIds']:
                print(f"   - {ts_id}")
            print(f"   Status: {result['status']}")
            print(f"   Akzeptiert am: {result['acceptanceTime']}")
            return result['timeSeriesIds']
        else:
            print(f"❌ Fehler: {response.status_code}")
            print(response.text)
            return []

    def _generate_intervals(self, start_time: datetime, quantities: List[float]) -> List[Dict]:
        """Intervalle generieren"""
        intervals = []
        for i, qty in enumerate(quantities):
            interval_start = start_time + timedelta(minutes=15 * i)
            interval_end = interval_start + timedelta(minutes=15)

            intervals.append({
                "position": i + 1,
                "start": interval_start.isoformat().replace('+00:00', 'Z'),
                "end": interval_end.isoformat().replace('+00:00', 'Z'),
                "quantity": f"{qty:.3f}",
                "quality": "VALIDATED"
            })

        return intervals

    def submit_formula(self) -> str:
        """Formel übermitteln"""
        print("\n" + "=" * 60)
        print("3. FORMEL DEFINIEREN")
        print("=" * 60)

        # Formel: W+Batt1 oEV (BESS Batterieladung ohne Eigenverbrauch)
        # wenn(W+Z1 – (W+ZEV1 + W+ZE_UW) > 0; W+Z1 – (W+ZEV1 + W+ZE_UW); 0)
        formula_data = {
            "messageId": "MSG-FORMULA-001",
            "formulas": [
                {
                    "formulaId": "FORM-BESS-BATT1-CHARGE-OEV",
                    "name": "W+Batt1 oEV",
                    "description": "Batterieladung ohne Eigenverbrauch (BESS Messkonzept)",
                    "category": "BILANZIERUNG",
                    "expression": {
                        "function": "Wenn_Dann",
                        "parameters": [
                            # Bedingung Teil 1: W+Z1 - (W+ZEV1 + W+ZE_UW)
                            {
                                "type": "expression",
                                "value": {
                                    "function": "Grp_Sum",
                                    "parameters": [
                                        {
                                            "type": "timeseries_ref",
                                            "value": "lineA",
                                            "scalingFactor": 1.0
                                        },
                                        {
                                            "type": "timeseries_ref",
                                            "value": "lineB",
                                            "scalingFactor": -1.0
                                        },
                                        {
                                            "type": "timeseries_ref",
                                            "value": "lineC",
                                            "scalingFactor": -1.0
                                        }
                                    ]
                                }
                            },
                            # Vergleichsoperator
                            {
                                "type": "string",
                                "value": ">"
                            },
                            # Bedingung Teil 2: 0
                            {
                                "type": "constant",
                                "value": 0
                            },
                            # Dann-Wert: W+Z1 - (W+ZEV1 + W+ZE_UW)
                            {
                                "type": "expression",
                                "value": {
                                    "function": "Grp_Sum",
                                    "parameters": [
                                        {
                                            "type": "timeseries_ref",
                                            "value": "lineA",
                                            "scalingFactor": 1.0
                                        },
                                        {
                                            "type": "timeseries_ref",
                                            "value": "lineB",
                                            "scalingFactor": -1.0
                                        },
                                        {
                                            "type": "timeseries_ref",
                                            "value": "lineC",
                                            "scalingFactor": -1.0
                                        }
                                    ]
                                }
                            },
                            # Sonst-Wert: 0
                            {
                                "type": "constant",
                                "value": 0
                            }
                        ]
                    },
                    "inputTimeSeries": ["lineA", "lineB", "lineC"],
                    "outputUnit": "KWH",
                    "outputResolution": "PT15M",
                    "outputObisCode": "1-1:1.29.0",
                    "inputMeteringPoints": [
                        {
                            "id": "MP-WZ1",
                            "name": "Netzverknüpfungspunkt Bezug",
                            "type": "GRID_CONNECTION",
                            "obisCode": "1-1:1.29.0"
                        },
                        {
                            "id": "MP-WZEV1",
                            "name": "Eigenverbrauch Messpunkt 1",
                            "type": "INTERNAL_CONSUMPTION",
                            "obisCode": "1-1:1.29.0"
                        },
                        {
                            "id": "MP-WZE_UW",
                            "name": "Umspannwerk Eigenverbrauch",
                            "type": "TRANSFORMER_LOSS",
                            "obisCode": "1-1:1.29.0"
                        }
                    ]
                }
            ]
        }

        response = requests.post(
            f"{self.base_url}/v1/formulas",
            headers=self._get_headers(),
            json=formula_data
        )

        if response.status_code == 201:
            result = response.json()
            print(f"✅ Formel übermittelt:")
            print(f"   ID: {result['formulaIds'][0]}")
            print(f"   Name: W+Batt1 oEV")
            print(f"   Funktion: Wenn_Dann (If-Then-Else)")
            print(f"   Kategorie: BILANZIERUNG")
            print(f"   Status: {result['status']}")
            return result['formulaIds'][0]
        else:
            print(f"❌ Fehler: {response.status_code}")
            print(response.text)
            return None

    def execute_calculation(self, formula_id: str, time_series_ids: List[str]) -> str:
        """Berechnung ausführen"""
        print("\n" + "=" * 60)
        print("4. BERECHNUNG AUSFÜHREN")
        print("=" * 60)

        calculation_request = {
            "calculationId": "CALC-DEMO-001",
            "formulaId": formula_id,
            "inputTimeSeries": {
                "lineA": time_series_ids[0],  # W+Z1
                "lineB": time_series_ids[1],  # W+ZEV1
                "lineC": time_series_ids[2]   # W+ZE_UW
            },
            "period": {
                "start": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat().replace('+00:00', 'Z'),
                "end": (datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).isoformat().replace('+00:00', 'Z')
            },
            "outputTimeSeriesId": "TS-RESULT-BATT1-OEV"
        }

        response = requests.post(
            f"{self.base_url}/v1/calculations",
            headers=self._get_headers(),
            json=calculation_request
        )

        if response.status_code == 202:
            result = response.json()
            print(f"✅ Berechnung gestartet:")
            print(f"   Calculation ID: {result['calculationId']}")
            print(f"   Status: {result['status']}")
            print(f"   Akzeptiert am: {result['acceptedAt']}")
            return result['calculationId']
        else:
            print(f"❌ Fehler: {response.status_code}")
            print(response.text)
            return None

    def get_calculation_result(self, calculation_id: str) -> Dict:
        """Berechnungsergebnis abrufen"""
        print("\n" + "=" * 60)
        print("5. BERECHNUNGSERGEBNIS ABRUFEN")
        print("=" * 60)

        response = requests.get(
            f"{self.base_url}/v1/calculations/{calculation_id}",
            headers=self._get_headers()
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Berechnung abgeschlossen:")
            print(f"   Status: {result['status']}")
            if 'outputTimeSeriesId' in result:
                print(f"   Output Zeitreihe: {result['outputTimeSeriesId']}")
                return result
            else:
                print(f"   ⚠️  Noch keine Ausgabe verfügbar")
        else:
            print(f"❌ Fehler: {response.status_code}")

        return None

    def get_result_time_series(self, ts_id: str):
        """Ergebnis-Zeitreihe abrufen und anzeigen"""
        print("\n" + "=" * 60)
        print("6. BERECHNETE ZEITREIHE ANZEIGEN")
        print("=" * 60)

        response = requests.get(
            f"{self.base_url}/v1/time-series/{ts_id}",
            headers=self._get_headers()
        )

        if response.status_code == 200:
            time_series = response.json()
            print(f"✅ Zeitreihe abgerufen: {time_series['timeSeriesId']}")
            print(f"   Einheit: {time_series['unit']}")
            print(f"   Auflösung: {time_series['resolution']}")
            print(f"   Anzahl Intervalle: {len(time_series['intervals'])}")
            print()
            print("   Erste 10 berechnete Intervalle:")
            print("   " + "-" * 56)
            print(f"   {'Position':<10} {'Start':<20} {'Menge (kWh)':<15}")
            print("   " + "-" * 56)

            for interval in time_series['intervals'][:10]:
                print(f"   {interval['position']:<10} {interval['start']:<20} {interval['quantity']:<15}")

            print("   " + "-" * 56)
            print()

            # Statistiken
            quantities = [float(i['quantity']) for i in time_series['intervals']]
            total = sum(quantities)
            avg = total / len(quantities)
            max_val = max(quantities)
            min_val = min(quantities)

            print("   Statistiken:")
            print(f"   - Gesamt: {total:.2f} kWh")
            print(f"   - Durchschnitt: {avg:.2f} kWh")
            print(f"   - Maximum: {max_val:.2f} kWh")
            print(f"   - Minimum: {min_val:.2f} kWh")

            if 'metadata' in time_series:
                print()
                print("   Metadaten:")
                for key, value in time_series['metadata'].items():
                    print(f"   - {key}: {value}")

        else:
            print(f"❌ Fehler: {response.status_code}")

    def run_demo(self):
        """Komplette Demo ausführen"""
        print("\n" + "=" * 70)
        print(" " * 10 + "MaBiS Time Series API - DEMO")
        print(" " * 15 + "BESS Batterieladung Berechnung")
        print("=" * 70)

        # Schritt 1: Authentifizierung
        if not self.authenticate():
            return

        # Schritt 2: Zeitreihen übermitteln
        ts_ids = self.submit_time_series()
        if not ts_ids:
            return

        # Schritt 3: Formel definieren
        formula_id = self.submit_formula()
        if not formula_id:
            return

        # Schritt 4: Berechnung ausführen
        calc_id = self.execute_calculation(formula_id, ts_ids)
        if not calc_id:
            return

        # Schritt 5: Ergebnis abrufen
        result = self.get_calculation_result(calc_id)
        if not result or 'outputTimeSeriesId' not in result:
            return

        # Schritt 6: Berechnete Zeitreihe anzeigen
        self.get_result_time_series(result['outputTimeSeriesId'])

        print("\n" + "=" * 70)
        print(" " * 20 + "DEMO ABGESCHLOSSEN")
        print("=" * 70)
        print()
        print("Die Formel 'W+Batt1 oEV' wurde erfolgreich berechnet!")
        print()
        print("Formel: wenn(W+Z1 – (W+ZEV1 + W+ZE_UW) > 0;")
        print("             W+Z1 – (W+ZEV1 + W+ZE_UW);")
        print("             0)")
        print()
        print("Diese Formel berechnet die Batterieladung ohne Eigenverbrauch")
        print("für ein BESS-System (Battery Energy Storage System).")
        print()


if __name__ == '__main__':
    print()
    print("WICHTIG: Stellen Sie sicher, dass der Mock-Server läuft!")
    print("Führen Sie in einem separaten Terminal aus:")
    print("    python mock_api_server.py")
    print()
    input("Drücken Sie Enter, um die Demo zu starten...")

    client = MaBiSDemoClient()
    client.run_demo()
