# MaBiS Zeitreihen REST API mit Formelunterstützung

## Überblick

Diese API bietet REST-Endpunkte für den Austausch von Zeitreihendaten im deutschen Energiemarkt mit erweiterten Formelberechnungsfunktionen für Bilanzierung, Netznutzung und Eigenverbrauchsberechnungen.

**Hauptmerkmale:**
- RESTful Zeitreihendatenaustausch (UTILTS EDIFACT-Äquivalent)
- Formel-API für ÜNB-geforderte Berechnungen
- OBIS-Code-Unterstützung für Smart-Meter-Integration
- OAuth 2.0 Sicherheit
- OpenAPI 3.0 Spezifikation
- Web-basierter Formel-Builder (React Frontend)

## Quick Start

Das gesamte System (Backend API + Frontend UI) kann mit einem Befehl gestartet werden:

```bash
docker compose up
```

Nach dem Start sind folgende Services verfügbar:

- **Frontend UI**: http://localhost:3000
  - Visueller Formel-Builder
  - Dashboard mit Statistiken
  - Formelverwaltung

- **Backend API**: http://localhost:8000
  - REST API Endpunkte
  - Health Check: http://localhost:8000/health
  - API Dokumentation in `mabis-timeseries-api.yaml`

**Erste Schritte:**
1. Öffnen Sie http://localhost:3000 im Browser
2. Navigieren Sie zu "Formel Builder"
3. Wählen Sie eine Formel-Vorlage (z.B. "BESS Batterieladung")
4. Passen Sie die Parameter an
5. Speichern Sie die Formel

### Demo Client ausführen

```bash
docker compose --profile demo up
```

## API-Endpunkte

### Zeitreihen-Operationen

- `POST /time-series` - Zeitreihendaten übermitteln
- `GET /time-series` - Zeitreihen mit Filtern abfragen
- `GET /time-series/{timeSeriesId}` - Bestimmte Zeitreihe abrufen

### Formel-Operationen

- `POST /formulas` - Formeldefinitionen übermitteln
- `GET /formulas` - Verfügbare Formeln auflisten
- `GET /formulas/{formulaId}` - Bestimmte Formel abrufen

### Berechnungs-Operationen

- `POST /calculations` - Formel auf Zeitreihendaten ausführen
- `GET /calculations/{calculationId}` - Berechnungsergebnisse abrufen

Siehe die OpenAPI-Spezifikation (`mabis-timeseries-api.yaml`) für detaillierte Endpunkt-Dokumentation.

## Formel-API

### Überblick

Die Formel-API erweitert die grundlegende Zeitreihenfunktionalität, indem sie Nutzern ermöglicht, Berechnungsformeln für Zeitreihendaten zu definieren und auszuführen. Dies ist essentiell für deutsche Energiemarkt-Berechnungen wie Bilanzierung, Netznutzung, Eigenverbrauch und Verlustberechnungen.

### Hauptmerkmale

- **11 ÜNB-geforderte Funktionen**: Unterstützung aller von deutschen ÜNBs geforderten Berechnungsfunktionen
- **Verschachtelte Ausdrücke**: Formeln können verschachtelte Unterausdrücke für komplexe Berechnungen enthalten
- **OBIS-Code-Unterstützung**: Integration mit Smart-Meter OBIS-Codes
- **Zählpunkt-Referenzen**: Direkte Referenzen zu physischen Zählpunkten
- **Verlustfaktor-Berechnungen**: Eingebaute Unterstützung für Netzverlustberechnungen
- **Kategorisierung**: Formeln kategorisiert nach Bilanzierungs-/Netznutzungsrelevanz

### Unterstützte Berechnungsfunktionen

| Funktion | Beschreibung | Anwendungsfall |
|---|---|---|
| `Anteil_Groesser_Als` | Anteil oberhalb Schwellenwert berechnen | Werte über Grenzwerten identifizieren |
| `Anteil_Kleiner_Als` | Anteil unterhalb Schwellenwert berechnen | Werte unter Grenzwerten identifizieren |
| `Groesser_Als` | Vergleichen und größeren Wert zurückgeben | Schwellenwertfilterung |
| `Round` | Werte auf Genauigkeit runden | Wertrundung |
| `Conv_RKMG` | Einheiten/Auflösungen konvertieren | Einheitenkonvertierung |
| `Wenn_Dann` | Wenn-Dann-Sonst bedingte Logik | Bedingte Berechnungen |
| `IMax` | n-tes Maximum im Intervall berechnen | Tages-/Monatsspitzenerkennung |
| `IMin` | n-tes Minimum im Intervall berechnen | Tages-/Monatstiefstwerte |
| `Grp_Sum` | Mehrere Zeitreihen summieren | Aggregation, Bilanzierungssummen |
| `Quer_Max` | Zeitreihenübergreifendes Maximum | Maximum über mehrere Zeitreihen |
| `Quer_Min` | Zeitreihenübergreifendes Minimum | Minimum über mehrere Zeitreihen |

### Formelkategorien

Formeln werden nach ihrem Zweck im Energiemarkt klassifiziert:

- **BILANZIERUNG** - Finanziell relevante Berechnungen
- **NETZNUTZUNG** - Netzkapazitäts- und Nutzungsberechnungen
- **BILANZIERUNG_UND_NETZNUTZUNG** - Sowohl bilanzierungs- als auch netznutzungsrelevant
- **EIGENVERBRAUCH** - Eigenverbrauchsberechnungen
- **VERLUSTE** - Netzverlustberechnungen
- **AGGREGATION** - Datenaggregationsformeln

### Funktionsweise der Formel-API

#### 1. Formeldefinition übermitteln

Zuerst definieren Sie Ihre Berechnungsformel über den `/formulas` Endpunkt:

```bash
POST /formulas
```

**Beispiel: Einfache Schwellenwertberechnung**

```json
{
  "messageId": "FORM-MSG-20251203001",
  "messageDate": "2025-12-03T10:30:00Z",
  "sender": {
    "id": "DE0212345678901",
    "role": "MSB"
  },
  "formulas": [{
    "formulaId": "FORM-ANTEIL-GT-001",
    "name": "Anteil oberhalb 100 kWh",
    "description": "Calculate portion of values above 100 kWh",
    "expression": {
      "function": "Anteil_Groesser_Als",
      "parameters": [
        {
          "name": "zeitreihe",
          "value": "INPUT_TS",
          "type": "timeseries_ref"
        },
        {
          "name": "grenze",
          "value": 100.0,
          "type": "constant"
        }
      ]
    },
    "inputTimeSeries": ["INPUT_TS"],
    "outputUnit": "KWH",
    "outputResolution": "PT15M",
    "category": "NETZNUTZUNG",
    "version": "1.0.0"
  }]
}
```

**Antwort:**

```json
{
  "messageId": "FORM-MSG-20251203001",
  "acceptanceTime": "2025-12-03T10:30:05Z",
  "status": "ACCEPTED",
  "formulaIds": ["FORM-ANTEIL-GT-001"]
}
```

#### 2. Berechnung ausführen

Wenden Sie die Formel auf tatsächliche Zeitreihendaten über `/calculations` an:

```bash
POST /calculations
```

```json
{
  "calculationId": "CALC-20251203-001",
  "requestDate": "2025-12-03T10:45:00Z",
  "formulaId": "FORM-ANTEIL-GT-001",
  "inputTimeSeries": {
    "INPUT_TS": "TS-MP10550000000001-A15MIN-20251202"
  },
  "period": {
    "start": "2025-12-02T00:00:00Z",
    "end": "2025-12-03T00:00:00Z"
  },
  "requestedBy": {
    "id": "DE0212345678901",
    "role": "MSB"
  },
  "outputTimeSeriesId": "TS-CALC-RESULT-20251202"
}
```

**Antwort (202 Accepted - Asynchrone Verarbeitung):**

```json
{
  "calculationId": "CALC-20251203-001",
  "status": "PENDING",
  "acceptedAt": "2025-12-03T10:45:01Z"
}
```

#### 3. Berechnungsergebnis abrufen

Überprüfen Sie den Berechnungsstatus und rufen Sie die Ergebnisse ab:

```bash
GET /calculations/{calculationId}
```

**Antwort:**

```json
{
  "calculationId": "CALC-20251203-001",
  "formulaId": "FORM-ANTEIL-GT-001",
  "status": "COMPLETED",
  "outputTimeSeriesId": "TS-CALC-RESULT-20251202",
  "completedAt": "2025-12-03T10:45:15Z"
}
```

Die resultierende Zeitreihe kann dann über die Standard-Zeitreihen-Endpunkte abgerufen werden.

### Praxisbeispiele für Formeln

#### Beispiel 1: Batterieladung ohne Eigenverbrauch

**Anwendungsfall**: Batterieladungsenergie ohne Eigenverbrauch berechnen (BESS-Anlage)

**Formel**: `wenn(W+Z1 – (W+ZEV1 + W+ZE_UW) > 0; W+Z1 – (W+ZEV1 + W+ZE_UW); 0)`

```json
{
  "formulaId": "FORM-BESS-BATT1-CHARGE-OEV",
  "name": "W+Batt1 oEV",
  "category": "EIGENVERBRAUCH",
  "expression": {
    "function": "Wenn_Dann",
    "parameters": [
      {
        "name": "linieA",
        "value": { /* nested expression */ },
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
      }
    ]
  },
  "inputMeteringPoints": [
    {
      "meteringPointId": "Z1",
      "obisCode": "1-1:1.29.0",
      "direction": "CONSUMPTION",
      "description": "Battery 1 main meter"
    }
  ],
  "outputObisCode": "1-1:1.29.0"
}
```

#### Beispiel 2: PV-Bilanzierung mit Verlustfaktor

**Anwendungsfall**: PV-Einspeisung mit 0,49% Netzverlusten berechnen

**Formel**: `W−3.5.7 * (1 - 0.0049)`

```json
{
  "formulaId": "FORM-KW-PV-BILLING-LOSSES",
  "name": "ΣBil.PV W− mit Verluste",
  "category": "BILANZIERUNG",
  "expression": {
    "function": "Grp_Sum",
    "parameters": [
      {
        "name": "pv_feedin",
        "value": "W-3.5.7",
        "type": "timeseries_ref",
        "obisCode": "1-1:2.29.0",
        "scalingFactor": 0.9951
      }
    ]
  },
  "lossFactor": 0.0049,
  "outputObisCode": "1-1:2.29.0"
}
```

#### Beispiel 3: Eigenverbrauchs-Aggregation

**Anwendungsfall**: Alle Eigenverbrauchswerte aggregieren (bilanzierungs- und netznutzungsrelevant)

**Formel**: `W+ZEV1 + W+ZE_UW + W+ZEV2 + W+ZEV3`

```json
{
  "formulaId": "FORM-BESS-TOTAL-EV",
  "name": "ΣEV W+",
  "category": "BILANZIERUNG_UND_NETZNUTZUNG",
  "expression": {
    "function": "Grp_Sum",
    "parameters": [
      {"name": "ts1", "value": "W+ZEV1", "type": "timeseries_ref", "obisCode": "1-1:1.29.0"},
      {"name": "ts2", "value": "W+ZE_UW", "type": "timeseries_ref", "obisCode": "1-1:1.29.0"},
      {"name": "ts3", "value": "W+ZEV2", "type": "timeseries_ref", "obisCode": "1-1:1.29.0"},
      {"name": "ts4", "value": "W+ZEV3", "type": "timeseries_ref", "obisCode": "1-1:1.29.0"}
    ]
  }
}
```

### Verschachtelte Ausdrücke

Formeln unterstützen verschachtelte Ausdrücke für komplexe Berechnungen:

```json
{
  "formulaId": "FORM-QUER-MAX-COMPLEX",
  "name": "Maximum across calculated series",
  "expression": {
    "function": "Quer_Max",
    "parameters": [
      {
        "function": "Anteil_Groesser_Als",
        "parameters": [
          {"name": "zeitreihe", "value": "TS1", "type": "timeseries_ref"},
          {"name": "grenze", "value": 50.0, "type": "constant"}
        ]
      },
      {
        "function": "Anteil_Kleiner_Als",
        "parameters": [
          {"name": "zeitreihe", "value": "TS2", "type": "timeseries_ref"},
          {"name": "grenze", "value": 200.0, "type": "constant"}
        ]
      }
    ]
  }
}
```

### OBIS-Code-Integration

Formeln integrieren mit Smart-Meter OBIS-Codes:

- **1-1:1.29.0**: W+ (Entnahme/Bezug)
- **1-1:2.29.0**: W− (Einspeisung)

Jeder Parameter kann seinen OBIS-Code zur Rückverfolgbarkeit angeben:

```json
{
  "name": "consumption",
  "value": "W+3.5.1",
  "type": "timeseries_ref",
  "obisCode": "1-1:1.29.0"
}
```

### Parametertypen

| Typ | Beschreibung | Beispiel |
|---|---|---|
| `timeseries_ref` | Referenz zu Zeitreihen-ID | `"INPUT_TS"` |
| `constant` | Numerische Konstante | `100.0` |
| `string` | String-Wert (Operatoren, Codes) | `">"` |
| `expression` | Verschachtelter Formelausdruck | `{function: "..."}` |
| `percentage` | Prozentwert | `0.49` |
| `loss_factor` | Verlustfaktor (1 - Prozentsatz) | `0.9951` |
| `obis_code` | OBIS-Code-Referenz | `"1-1:1.29.0"` |
| `metering_point_ref` | Zählpunkt-ID | `"ZP_3.5.1"` |

### Formel-Metadaten

Formeln können umfangreiche Metadaten für betriebliche Zwecke enthalten:

```json
{
  "metadata": {
    "balancingGroup": "DE123456789012-B",
    "facilityType": "BATTERY",
    "voltageLevel": "30kV",
    "tsoOperator": "50Hertz",
    "location": "Staßfurt",
    "billingRelevant": true,
    "networkUsageRelevant": true,
    "lossPercentage": "0.49%"
  }
}
```

### Skalierungsfaktoren und Verlustberechnungen

**Verlustfaktor-Beispiel (0,49% Netzverluste):**
```json
{
  "name": "pv_feedin_with_losses",
  "value": "W-3.5.7",
  "type": "timeseries_ref",
  "scalingFactor": 0.9951
}
```

Wobei `scalingFactor = 1 - (lossPercentage / 100) = 1 - 0.0049 = 0.9951`

## Beispiele

Siehe folgende Dateien für vollständige Beispiele:
- `formula-examples.json` - Grundlegende Formelbeispiele
- `real-world-formula-examples.json` - Produktionsformeln von 50Hertz-Anlagen
- `python-client-example.py` - Python-Client-Implementierung
- `docs/` - Original-Messkonzept-Dokumente (BESS und Kraftwerk)
