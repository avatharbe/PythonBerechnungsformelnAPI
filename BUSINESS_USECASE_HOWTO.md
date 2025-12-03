# Business Use Case: Batteriespeicher-Bilanzierung mit MaBiS Formula API

## Geschäftsszenario

**Unternehmen:** Energieversorger mit Batteriespeicheranlage (BESS) in Staßfurt

**Herausforderung:** Korrekte Bilanzierung und Netznutzungsabrechnung für 3 Batteriespeicher mit Eigenverbrauch

**Lösung:** MaBiS Formula API zur automatisierten Berechnung bilanzierungsrelevanter Werte

---

## 1. Ausgangssituation

### Anlagenkonfiguration

**Batteriespeicher-Anlage Staßfurt:**
- 3 Batteriespeicher (Batterie 1, 2, 3) angeschlossen an 30 kV Netz
- Anschluss an 50Hertz 110 kV Übertragungsnetz
- Jede Batterie hat:
  - Hauptzähler (Z1, Z2, Z3) für Gesamtenergie
  - Eigenverbrauchszähler (ZEV1, ZEV2, ZEV3) für Betriebsverbrauch
- Zusätzlich: Umspannwerk-Eigenverbrauch (ZE_UW)

### Geschäftliche Anforderungen

1. **Bilanzierung:** Netzbetreiber (50Hertz) muss wissen, wie viel Energie ohne Eigenverbrauch geladen/entladen wurde
2. **Netznutzungsabrechnung:** Separate Abrechnung für Eigenverbrauch (nicht bilanzierungsrelevant)
3. **Transparenz:** Nachvollziehbare Berechnungsformeln für alle Marktteilnehmer
4. **Automatisierung:** Keine manuelle Berechnung mehr nötig
5. **Compliance:** Einhaltung der MaBiS- und EDI@Energy-Standards

### Bisherige Probleme (EDIFACT UTILTS)

❌ Formeln mussten separat in Excel oder Systemen gepflegt werden

❌ Berechnungsergebnisse wurden übermittelt, aber nicht die Formeln selbst

❌ Fehleranfällig bei manueller Berechnung

❌ Keine Standardisierung der Formeln zwischen Marktteilnehmern

❌ Schwierig nachzuvollziehen, wie Werte berechnet wurden

---

## 2. Lösung: MaBiS Formula API mit Frontend

### Architektur

Die Lösung besteht aus drei Komponenten:

1. **Formula Builder Frontend (Web-UI)**
   - Visuelle Formel-Erstellung ohne JSON-Kenntnisse
   - Drag & Drop Interface für Formelelemente
   - Messpunkt-Auswahl aus Katalog
   - Live-Vorschau der Formel-Syntax
   - Validierung und Fehlermeldungen
   - Formel-Template-Bibliothek (BESS, PV, Kraftwerk)

2. **REST API Backend**
   - Formel-Validierung und -Speicherung
   - Zeitreihen-Datenmanagement
   - Berechnungs-Engine (11 TSO-Funktionen)
   - OAuth2 Authentifizierung
   - Audit-Logging

3. **Integration Layer**
   - Anbindung an Zählpunkt-Systeme
   - Automatischer Daten-Import
   - Export zu Billing-Systemen
   - Monitoring und Alerts

### Vorteile

✅ **Formeln als Code:** Berechnungslogik wird zusammen mit Daten übermittelt
✅ **Automatisierte Berechnung:** API führt Berechnungen durch, kein manueller Eingriff
✅ **OBIS-Code-Integration:** Direkte Zuordnung zu physischen Zählpunkten
✅ **Versionierung:** Formeln können versioniert und nachvollzogen werden
✅ **Standard-Funktionen:** 11 ÜNB-geforderte Funktionen bereits implementiert
✅ **RESTful:** Moderne Integration in bestehende IT-Systeme
✅ **Benutzerfreundlich:** Keine JSON-Kenntnisse erforderlich durch Frontend
✅ **Self-Service:** Anlagenbetreiber können eigene Formeln erstellen

---

## 3. Formula Builder Frontend

### 3.1 Formula Builder UI

#### Hauptbildschirm

```
╔══════════════════════════════════════════════════════════════════╗
║  MaBiS Formula Builder                    [Speichern] [Testen]  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Formel-Details:                                                 ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │ Name: W+Batt1 oEV                                          │ ║
║  │ Beschreibung: Batterieladung ohne Eigenverbrauch          │ ║
║  │ Kategorie: [BILANZIERUNG ▼]                                │ ║
║  │ Version: 1.0.0                                             │ ║
║  └────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  Messpunkte:                                                     ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │ [+] W+Z1         - Batterie Hauptzähler (1-1:1.29.0)       │ ║
║  │ [+] W+ZEV1       - Eigenverbrauch Batterie (1-1:1.29.0)    │ ║
║  │ [+] W+ZE_UW      - Eigenverbrauch Umspannwerk              │ ║
║  └────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  Formel-Builder:                                                 ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │ [Wenn_Dann ▼]                                              │ ║
║  │   Wenn:                                                     │ ║
║  │     [Grp_Sum ▼]                                            │ ║
║  │       [W+Z1] × [1.0]                                       │ ║
║  │       [W+ZEV1] × [-1.0]                                    │ ║
║  │       [W+ZE_UW] × [-1.0]                                   │ ║
║  │     [> ▼] [0]                                              │ ║
║  │   Dann:                                                     │ ║
║  │     [Grp_Sum ▼] (wie oben)                                 │ ║
║  │   Sonst:                                                    │ ║
║  │     [0]                                                     │ ║
║  └────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  Live-Vorschau:                                                  ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │ Mathematisch:                                              │ ║
║  │ wenn(W+Z1 - (W+ZEV1 + W+ZE_UW) > 0;                        │ ║
║  │      W+Z1 - (W+ZEV1 + W+ZE_UW);                            │ ║
║  │      0)                                                     │ ║
║  │                                                             │ ║
║  │ JSON: [▼ Ausklappen]                                       │ ║
║  └────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  [Template laden ▼] [Validieren] [API-Code generieren]          ║
╚══════════════════════════════════════════════════════════════════╝
```

#### Funktions-Palette (Sidebar)

```
┌─────────────────────────────┐
│ Funktionen                  │
├─────────────────────────────┤
│ 📊 Aggregation              │
│   • Grp_Sum                 │
│   • Quer_Max                │
│   • Quer_Min                │
│                             │
│ ⚖️ Vergleich                │
│   • Wenn_Dann               │
│   • Groesser_Als            │
│                             │
│ 🔢 Filter                   │
│   • Anteil_Groesser_Als     │
│   • Anteil_Kleiner_Als      │
│                             │
│ 🔧 Sonstige                 │
│   • Round                   │
│   • Conv_RKMG               │
│   • IMax / IMin             │
└─────────────────────────────┘
```

### 3.2 Benutzerworkflow mit Frontend

#### Schritt 1: Template auswählen
1. Nutzer öffnet Formula Builder
2. Wählt Template: "BESS - Batterieladung ohne Eigenverbrauch"
3. Template lädt vordefinierte Struktur

#### Schritt 2: Messpunkte zuordnen
1. System zeigt verfügbare Messpunkte der Anlage
2. Nutzer ordnet zu:
   - W+Z1 → Zählpunkt "ZP_BATT1_GESAMT"
   - W+ZEV1 → Zählpunkt "ZP_BATT1_EV"
   - W+ZE_UW → Zählpunkt "ZP_UW_EV"

#### Schritt 3: Anpassen (optional)
1. Schwellenwerte ändern
2. Skalierungsfaktoren anpassen
3. Beschreibung ergänzen

#### Schritt 4: Validieren
1. Klick auf "Validieren"
2. System prüft:
   - ✅ Alle Messpunkte zugeordnet
   - ✅ Syntax korrekt
   - ✅ OBIS-Codes konsistent
   - ✅ Einheiten kompatibel

#### Schritt 5: Testen
1. Klick auf "Testen"
2. System lädt Test-Daten
3. Berechnung mit Beispielwerten
4. Ergebnis-Vorschau anzeigen

#### Schritt 6: Speichern & Aktivieren
1. Formel speichern
2. Automatische JSON-Generierung
3. API-Aufruf im Hintergrund
4. Formel ist sofort produktiv



---

## 4. How-To: Schritt-für-Schritt Implementierung

### Option A: Mit Formula Builder Frontend (Empfohlen)

#### Schritt 1.1: Formel im Frontend erstellen

1. **Anmelden am Formula Builder Portal**
   ```
   https://formula-builder.mabis-hub.de
   Login mit OAuth2 (SSO)
   ```

2. **Template auswählen**
   - Kategorie: BESS (Batteriespeicher)
   - Template: "Batterieladung ohne Eigenverbrauch"

3. **Messpunkte zuordnen**
   - System zeigt Ihre konfigurierten Messpunkte
   - Drag & Drop Zuordnung zu Formelparametern

4. **Validieren & Testen**
   - System prüft Formel automatisch
   - Test mit historischen Daten
   - Ergebnis-Vorschau

5. **Aktivieren**
   - Formel wird automatisch über API übermittelt
   - Sofort produktiv einsetzbar

### Option B: Direkt über API (für Entwickler)

#### Schritt 1.1: Messkonzept dokumentieren

Zunächst wird das Messkonzept dokumentiert:

**Formel für Batterie 1 Ladung ohne Eigenverbrauch:**
```
W+Batt1 oEV = wenn(W+Z1 – (W+ZEV1 + W+ZE_UW) > 0;
                    W+Z1 – (W+ZEV1 + W+ZE_UW);
                    0)
```

**Bedeutung:**
- Wenn die Gesamtladung (W+Z1) abzüglich Eigenverbrauch (W+ZEV1 + W+ZE_UW) positiv ist
- Dann: Ladung ohne Eigenverbrauch = W+Z1 - (W+ZEV1 + W+ZE_UW)
- Sonst: 0 (keine Ladung)

#### Schritt 1.2: Formel als JSON erstellen

```json
{
  "messageId": "FORM-MSG-50HERTZ-BESS-001",
  "messageDate": "2025-12-03T09:00:00Z",
  "sender": {
    "id": "DE0250HERTZ12345",
    "role": "MSB",
    "name": "50Hertz Transmission GmbH"
  },
  "formulas": [
    {
      "formulaId": "FORM-BESS-BATT1-CHARGE-OEV",
      "name": "W+Batt1 oEV",
      "description": "Batterieladung ohne Eigenverbrauch für Batterie 1",
      "expression": {
        "function": "Wenn_Dann",
        "parameters": [
          {
            "name": "linieA",
            "value": {
              "function": "Grp_Sum",
              "parameters": [
                {
                  "name": "hauptzaehler",
                  "value": "W+Z1",
                  "type": "timeseries_ref",
                  "obisCode": "1-1:1.29.0"
                },
                {
                  "name": "eigenverbrauch_batterie",
                  "value": "W+ZEV1",
                  "type": "timeseries_ref",
                  "obisCode": "1-1:1.29.0",
                  "scalingFactor": -1
                },
                {
                  "name": "eigenverbrauch_umspannwerk",
                  "value": "W+ZE_UW",
                  "type": "timeseries_ref",
                  "obisCode": "1-1:1.29.0",
                  "scalingFactor": -1
                }
              ]
            },
            "type": "expression"
          },
          {
            "name": "komparator",
            "value": ">",
            "type": "string"
          },
          {
            "name": "linieB",
            "value": 0,
            "type": "constant"
          },
          {
            "name": "dann",
            "value": {
              "function": "Grp_Sum",
              "parameters": [
                {
                  "name": "hauptzaehler",
                  "value": "W+Z1",
                  "type": "timeseries_ref"
                },
                {
                  "name": "eigenverbrauch_batterie",
                  "value": "W+ZEV1",
                  "type": "timeseries_ref",
                  "scalingFactor": -1
                },
                {
                  "name": "eigenverbrauch_umspannwerk",
                  "value": "W+ZE_UW",
                  "type": "timeseries_ref",
                  "scalingFactor": -1
                }
              ]
            },
            "type": "expression"
          },
          {
            "name": "sonst",
            "value": 0,
            "type": "constant"
          }
        ]
      },
      "inputMeteringPoints": [
        {
          "meteringPointId": "ZP_Z1",
          "obisCode": "1-1:1.29.0",
          "direction": "CONSUMPTION",
          "description": "Batterie 1 Hauptzähler"
        },
        {
          "meteringPointId": "ZP_ZEV1",
          "obisCode": "1-1:1.29.0",
          "direction": "CONSUMPTION",
          "description": "Batterie 1 Eigenverbrauch"
        },
        {
          "meteringPointId": "ZP_ZE_UW",
          "obisCode": "1-1:1.29.0",
          "direction": "CONSUMPTION",
          "description": "Umspannwerk Eigenverbrauch"
        }
      ],
      "inputTimeSeries": ["W+Z1", "W+ZEV1", "W+ZE_UW"],
      "outputUnit": "KWH",
      "outputResolution": "PT15M",
      "outputObisCode": "1-1:1.29.0",
      "category": "EIGENVERBRAUCH",
      "version": "1.0.0",
      "metadata": {
        "facilityType": "BATTERY",
        "facilityName": "BESS Staßfurt Batterie 1",
        "voltageLevel": "30kV",
        "tsoOperator": "50Hertz",
        "location": "Staßfurt",
        "billingRelevant": true,
        "messkonzeptVersion": "2025-01"
      }
    }
  ]
}
```

#### Schritt 1.3: Formel über API übermitteln

**HTTP Request:**
```http
POST http://localhost:8000/v1/formulas
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{JSON payload from above}
```

**Python Beispiel:**
```python
import requests
from datetime import datetime, timezone

# OAuth2 Token holen (Mock-Server)
token_response = requests.post(
    'http://localhost:8000/oauth/token',
    data={
        'grant_type': 'client_credentials',
        'client_id': 'demo-client',
        'client_secret': 'demo-secret',
        'scope': 'formulas.write'
    }
)
access_token = token_response.json()['access_token']

# Formel übermitteln
response = requests.post(
    'http://localhost:8000/v1/formulas',
    headers={
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    },
    json=formula_payload
)

# Antwort prüfen
if response.status_code == 201:
    result = response.json()
    print(f"✅ Formel akzeptiert: {result['formulaIds'][0]}")
    print(f"   Status: {result['status']}")
    print(f"   Zeitstempel: {result['acceptanceTime']}")
else:
    print(f"❌ Fehler: {response.status_code}")
    print(response.json())
```

**Erwartete Antwort:**
```json
{
  "messageId": "FORM-MSG-50HERTZ-BESS-001",
  "acceptanceTime": "2025-12-03T09:00:15Z",
  "status": "ACCEPTED",
  "formulaIds": ["FORM-BESS-BATT1-CHARGE-OEV"],
  "validationResults": [
    {
      "formulaId": "FORM-BESS-BATT1-CHARGE-OEV",
      "valid": true
    }
  ]
}
```

---

### Phase 2: Zeitreihendaten sammeln (beide Optionen)

#### Schritt 2.1: Messdaten von Zählpunkten erfassen

Alle 15 Minuten werden Messdaten von den Zählpunkten erfasst:

**Beispieldaten für 2025-12-03, 00:00-01:00 Uhr:**

| Zeit | W+Z1 (kWh) | W+ZEV1 (kWh) | W+ZE_UW (kWh) |
|------|------------|--------------|---------------|
| 00:00-00:15 | 250.5 | 12.3 | 8.7 |
| 00:15-00:30 | 248.2 | 11.9 | 8.5 |
| 00:30-00:45 | 251.8 | 12.1 | 8.6 |
| 00:45-01:00 | 249.6 | 12.0 | 8.8 |

#### Schritt 2.2: Zeitreihen über API übermitteln

```json
{
  "messageId": "TS-MSG-50HERTZ-20251203-001",
  "messageDate": "2025-12-03T01:05:00Z",
  "sender": {
    "id": "DE0250HERTZ12345",
    "role": "MSB"
  },
  "receiver": {
    "id": "DE0250HERTZ12345",
    "role": "NB"
  },
  "timeSeries": [
    {
      "timeSeriesId": "TS-WZ1-20251203",
      "marketLocationId": "10550000000001",
      "meteringPointId": "ZP_Z1",
      "measurementType": "CONSUMPTION",
      "unit": "KWH",
      "resolution": "PT15M",
      "period": {
        "start": "2025-12-03T00:00:00Z",
        "end": "2025-12-03T01:00:00Z"
      },
      "intervals": [
        {"position": 1, "start": "2025-12-03T00:00:00Z", "end": "2025-12-03T00:15:00Z", "quantity": "250.5", "quality": "METERED"},
        {"position": 2, "start": "2025-12-03T00:15:00Z", "end": "2025-12-03T00:30:00Z", "quantity": "248.2", "quality": "METERED"},
        {"position": 3, "start": "2025-12-03T00:30:00Z", "end": "2025-12-03T00:45:00Z", "quantity": "251.8", "quality": "METERED"},
        {"position": 4, "start": "2025-12-03T00:45:00Z", "end": "2025-12-03T01:00:00Z", "quantity": "249.6", "quality": "METERED"}
      ],
      "metadata": {
        "obisCode": "1-1:1.29.0",
        "meteringMethod": "REMOTE_READING"
      }
    },
    {
      "timeSeriesId": "TS-WZEV1-20251203",
      "marketLocationId": "10550000000001",
      "meteringPointId": "ZP_ZEV1",
      "measurementType": "CONSUMPTION",
      "unit": "KWH",
      "resolution": "PT15M",
      "period": {
        "start": "2025-12-03T00:00:00Z",
        "end": "2025-12-03T01:00:00Z"
      },
      "intervals": [
        {"position": 1, "start": "2025-12-03T00:00:00Z", "end": "2025-12-03T00:15:00Z", "quantity": "12.3", "quality": "METERED"},
        {"position": 2, "start": "2025-12-03T00:15:00Z", "end": "2025-12-03T00:30:00Z", "quantity": "11.9", "quality": "METERED"},
        {"position": 3, "start": "2025-12-03T00:30:00Z", "end": "2025-12-03T00:45:00Z", "quantity": "12.1", "quality": "METERED"},
        {"position": 4, "start": "2025-12-03T00:45:00Z", "end": "2025-12-03T01:00:00Z", "quantity": "12.0", "quality": "METERED"}
      ]
    },
    {
      "timeSeriesId": "TS-WZE-UW-20251203",
      "marketLocationId": "10550000000001",
      "meteringPointId": "ZP_ZE_UW",
      "measurementType": "CONSUMPTION",
      "unit": "KWH",
      "resolution": "PT15M",
      "period": {
        "start": "2025-12-03T00:00:00Z",
        "end": "2025-12-03T01:00:00Z"
      },
      "intervals": [
        {"position": 1, "start": "2025-12-03T00:00:00Z", "end": "2025-12-03T00:15:00Z", "quantity": "8.7", "quality": "METERED"},
        {"position": 2, "start": "2025-12-03T00:15:00Z", "end": "2025-12-03T00:30:00Z", "quantity": "8.5", "quality": "METERED"},
        {"position": 3, "start": "2025-12-03T00:30:00Z", "end": "2025-12-03T00:45:00Z", "quantity": "8.6", "quality": "METERED"},
        {"position": 4, "start": "2025-12-03T00:45:00Z", "end": "2025-12-03T01:00:00Z", "quantity": "8.8", "quality": "METERED"}
      ]
    }
  ]
}
```

**HTTP Request:**
```http
POST http://localhost:8000/v1/time-series
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

---

### Phase 3: Berechnung ausführen

#### Schritt 3.1: Berechnungsauftrag erstellen

```json
{
  "calculationId": "CALC-BESS-BATT1-20251203-001",
  "requestDate": "2025-12-03T01:10:00Z",
  "formulaId": "FORM-BESS-BATT1-CHARGE-OEV",
  "inputTimeSeries": {
    "W+Z1": "TS-WZ1-20251203",
    "W+ZEV1": "TS-WZEV1-20251203",
    "W+ZE_UW": "TS-WZE-UW-20251203"
  },
  "period": {
    "start": "2025-12-03T00:00:00Z",
    "end": "2025-12-03T01:00:00Z"
  },
  "requestedBy": {
    "id": "DE0250HERTZ12345",
    "role": "MSB"
  },
  "outputTimeSeriesId": "TS-BATT1-OEV-20251203",
  "metadata": {
    "purpose": "monthly_billing",
    "billingPeriod": "2025-12"
  }
}
```

**HTTP Request:**
```http
POST http://localhost:8000/v1/calculations
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

**Antwort (202 Accepted):**
```json
{
  "calculationId": "CALC-BESS-BATT1-20251203-001",
  "status": "PENDING",
  "acceptedAt": "2025-12-03T01:10:02Z"
}
```

#### Schritt 3.2: Berechnungsstatus prüfen

```http
GET http://localhost:8000/v1/calculations/CALC-BESS-BATT1-20251203-001
Authorization: Bearer <ACCESS_TOKEN>
```

**Antwort (während Verarbeitung):**
```json
{
  "calculationId": "CALC-BESS-BATT1-20251203-001",
  "formulaId": "FORM-BESS-BATT1-CHARGE-OEV",
  "status": "PROCESSING"
}
```

**Antwort (nach Abschluss):**
```json
{
  "calculationId": "CALC-BESS-BATT1-20251203-001",
  "formulaId": "FORM-BESS-BATT1-CHARGE-OEV",
  "status": "COMPLETED",
  "outputTimeSeriesId": "TS-BATT1-OEV-20251203",
  "completedAt": "2025-12-03T01:10:08Z"
}
```

#### Schritt 3.3: Berechnungsergebnis abrufen

```http
GET http://localhost:8000/v1/time-series/TS-BATT1-OEV-20251203
Authorization: Bearer <ACCESS_TOKEN>
```

**Antwort mit berechneten Werten:**
```json
{
  "timeSeriesId": "TS-BATT1-OEV-20251203",
  "marketLocationId": "10550000000001",
  "measurementType": "CONSUMPTION",
  "unit": "KWH",
  "resolution": "PT15M",
  "period": {
    "start": "2025-12-03T00:00:00Z",
    "end": "2025-12-03T01:00:00Z"
  },
  "intervals": [
    {"position": 1, "quantity": "229.5", "quality": "VALIDATED"},
    {"position": 2, "quantity": "227.8", "quality": "VALIDATED"},
    {"position": 3, "quantity": "231.1", "quality": "VALIDATED"},
    {"position": 4, "quantity": "228.8", "quality": "VALIDATED"}
  ],
  "metadata": {
    "calculatedBy": "FORM-BESS-BATT1-CHARGE-OEV",
    "calculationId": "CALC-BESS-BATT1-20251203-001",
    "sourceFormula": "wenn(W+Z1 – (W+ZEV1 + W+ZE_UW) > 0; W+Z1 – (W+ZEV1 + W+ZE_UW); 0)"
  }
}
```

**Berechnungsnachweis:**
- Intervall 1: 250.5 - (12.3 + 8.7) = 229.5 kWh ✅
- Intervall 2: 248.2 - (11.9 + 8.5) = 227.8 kWh ✅
- Intervall 3: 251.8 - (12.1 + 8.6) = 231.1 kWh ✅
- Intervall 4: 249.6 - (12.0 + 8.8) = 228.8 kWh ✅



