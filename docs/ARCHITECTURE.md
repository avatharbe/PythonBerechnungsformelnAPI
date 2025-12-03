# MaBiS Formula API - Systemarchitektur

## Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [C4 Model Diagramme](#c4-model-diagramme)
   - [C1: System Context Diagram](#c1-system-context-diagram)
   - [C2: Container Diagram](#c2-container-diagram)
3. [Technologie-Stack](#technologie-stack)
4. [Deployment-Architektur](#deployment-architektur)
5. [Sicherheitsarchitektur](#sicherheitsarchitektur)
6. [Datenfluss](#datenfluss)

---

## Überblick

Das MaBiS Formula API System ermöglicht die standardisierte Übermittlung von Berechnungsformeln zwischen Marktteilnehmern im deutschen Energiemarkt als moderne Alternative zu EDIFACT UTILTS.

**Hauptziele:**
- Übermittlung komplexer Formeln als strukturierte JSON-Daten
- Ersatz der umständlichen EDIFACT-Schritt-für-Schritt-Übermittlung
- Bidirektionale Kommunikation zwischen Messstellenbetreibern (MSB) und Netzbetreibern (NB)
- Transparente Formelvalidierung und -bestätigung

---

## C4 Model Diagramme

### C1: System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Energiemarkt Deutschland                     │
│                                                                      │
│  ┌──────────────┐                                  ┌──────────────┐ │
│  │              │                                  │              │ │
│  │ Messtellen-  │  Formel übermitteln             │ Netz-        │ │
│  │ betreiber    │─────────────────────────────────▶│ betreiber    │ │
│  │ (MSB)        │                                  │ (NB/ÜNB)     │ │
│  │              │  Bestätigung empfangen           │              │ │
│  │              │◀─────────────────────────────────│              │ │
│  └──────┬───────┘                                  └───────┬──────┘ │
│         │                                                  │        │
│         │ 1. Formel erstellen                             │        │
│         │ 2. JSON übermitteln                             │        │
│         │                                                  │        │
│         │                                                  │ 3. Empfangen
│         │                                                  │ 4. Validieren
│         │                                                  │        │
│         └──────────────────┐         ┌───────────────────┘        │
│                            │         │                             │
│                      ┌─────▼─────────▼──────┐                      │
│                      │                       │                      │
│                      │  MaBiS Formula API    │                      │
│                      │                       │                      │
│                      │  • Formula Builder    │                      │
│                      │  • REST API           │                      │
│                      │  • Formula Receiver   │                      │
│                      │                       │                      │
│                      └───────────────────────┘                      │
│                                                                      │
│  Externe Systeme:                                                   │
│  ┌─────────────┐           ┌─────────────┐      ┌──────────────┐  │
│  │             │           │             │      │              │  │
│  │ Smart Meter │          │ Billing     │      │ MaBiS Hub    │  │
│  │ Gateway     │          │ System      │      │ (zukünftig)  │  │
│  │ (OBIS)      │          │             │      │              │  │
│  │             │           │             │      │              │  │
│  └─────────────┘           └─────────────┘      └──────────────┘  │
│       │                          │                      │           │
│       └──────────────────────────┴──────────────────────┘           │
│                                  │                                  │
│                     Zukünftige Integration                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

Legende:
─────▶  Datenfluss / API-Aufruf
```

**Beschreibung:**
- **MSB (Messstellenbetreiber)**: Erstellt Formeln für Bilanzierung, sendet via API
- **NB (Netzbetreiber)**: Empfängt Formeln, validiert und bestätigt
- **MaBiS Formula API**: Zentrale Übermittlungsplattform
- **Externe Systeme**: Integration für vollständigen Workflow (Phase 2)

---

### C2: Container Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        MaBiS Formula API System                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         Frontend (Port 3000)                        │ │
│  │                                                                     │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│ │
│  │  │                  │  │                  │  │                  ││ │
│  │  │ Formula Builder  │  │ Formula Receiver │  │    Dashboard     ││ │
│  │  │                  │  │                  │  │                  ││ │
│  │  │  (Sender/MSB)    │  │  (Empfänger/NB)  │  │  (Statistiken)   ││ │
│  │  │                  │  │                  │  │                  ││ │
│  │  │ • Template Wahl  │  │ • Formelliste    │  │ • Health Status  ││ │
│  │  │ • Formelerstellung│ │ • Validierung    │  │ • API Status     ││ │
│  │  │ • Live-Vorschau  │  │ • Bestätigung    │  │ • Metriken       ││ │
│  │  │                  │  │                  │  │                  ││ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘│ │
│  │           │                     │                     │          │ │
│  │           └─────────────────────┴─────────────────────┘          │ │
│  │                                 │                                 │ │
│  │  Technology: React 18 + TypeScript + Vite + Tailwind CSS         │ │
│  │  Deployment: Nginx (Docker Container)                            │ │
│  └─────────────────────────────────┬─────────────────────────────────┘ │
│                                    │                                   │
│                        REST API (HTTPS/JSON)                          │
│                      OAuth2 Bearer Token Auth                         │
│                                    │                                   │
│  ┌─────────────────────────────────▼─────────────────────────────────┐ │
│  │                         Backend API (Port 8000)                    │ │
│  │                                                                     │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│ │
│  │  │                  │  │                  │  │                  ││ │
│  │  │ Formula API      │  │ Time Series API  │  │ Calculation API  ││ │
│  │  │                  │  │                  │  │                  ││ │
│  │  │ POST /formulas   │  │ POST /timeseries │  │ POST /calculations│ │
│  │  │ GET /formulas    │  │ GET /timeseries  │  │ GET /calculations││ │
│  │  │ GET /formulas/id │  │ GET /timeseries/id│ │                  ││ │
│  │  │                  │  │                  │  │                  ││ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘│ │
│  │           │                     │                     │          │ │
│  │           └─────────────────────┴─────────────────────┘          │ │
│  │                                 │                                 │ │
│  │  ┌──────────────────────────────▼──────────────────────────────┐ │ │
│  │  │                                                              │ │ │
│  │  │                     Formula Engine                           │ │ │
│  │  │                                                              │ │ │
│  │  │  • Wenn_Dann        • Grp_Sum         • Quer_Max            │ │ │
│  │  │  • Anteil_GT/LT     • IMax/IMin       • Quer_Min            │ │ │
│  │  │  • Groesser_Als     • Round           • Conv_RKMG           │ │ │
│  │  │                                                              │ │ │
│  │  │  11 ÜNB-geforderte Berechnungsfunktionen                    │ │ │
│  │  │                                                              │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                                 │                                 │ │
│  │  Technology: Python 3.12 + Flask 3.0                             │ │
│  │  Deployment: Docker Container                                    │ │
│  └─────────────────────────────────┬─────────────────────────────────┘ │
│                                    │                                   │
│  ┌─────────────────────────────────▼─────────────────────────────────┐ │
│  │                      In-Memory Storage                             │ │
│  │                                                                     │ │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐          │ │
│  │  │   Formulas   │   │ Time Series  │   │ Calculations │          │ │
│  │  │  Dictionary  │   │  Dictionary  │   │  Dictionary  │          │ │
│  │  └──────────────┘   └──────────────┘   └──────────────┘          │ │
│  │                                                                     │ │
│  │  Note: Produktion würde persistente DB verwenden (PostgreSQL)     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐
│  OAuth2 Service    │
│                    │
│  Mock OAuth2 Token │
│  Generation        │
│                    │
│  (In Produktion:   │
│   Keycloak/Auth0)  │
└────────────────────┘
```

**Container-Übersicht:**

| Container | Technologie | Port | Zweck |
|-----------|-------------|------|-------|
| Frontend | React 18 + TypeScript + Nginx | 3000 | Web-UI für Sender und Empfänger |
| Backend API | Python 3.12 + Flask 3.0 | 8000 | REST API für Formelübermittlung |
| OAuth2 | Mock (Produktion: Keycloak) | 8000 | Authentifizierung |
| Storage | In-Memory Dict (Produktion: PostgreSQL) | - | Datenpersistenz |

**Komponenten-Beschreibung:**

| Layer | Component | Verantwortung |
|-------|-----------|---------------|
| **API Layer** | OAuth2 Middleware | Token-Validierung, Authentifizierung |
| | Request Validator | JSON-Schema-Validierung |
| | Error Handler | Einheitliche Fehlerbehandlung |
| **Endpoint Layer** | Formula Endpoints | REST-Endpunkte für Formeln |
| | TimeSeries Endpoints | REST-Endpunkte für Zeitreihen |
| | Calculation Endpoints | REST-Endpunkte für Berechnungen |
| **Service Layer** | Formula Service | Geschäftslogik für Formelverwaltung |
| | TimeSeries Service | Geschäftslogik für Zeitreihenverwaltung |
| | Calculation Service | Orchestrierung der Berechnungen |
| **Business Logic** | Formula Engine | Implementierung der 11 Berechnungsfunktionen |
| | Expression Parser | Parsing verschachtelter Ausdrücke |
| **Data Layer** | Repositories | Abstraktion für Datenzugriff |
| | Storage | In-Memory / PostgreSQL |


**Frontend-Komponenten:**

| Layer | Component | Technologie | Zweck |
|-------|-----------|-------------|-------|
| **Router** | React Router | React Router 6 | Clientseitiges Routing |
| **Pages** | Dashboard | React + Hooks | Übersicht und Statistiken |
| | Formula Builder | React + Hooks | Formelerstellung (MSB) |
| | Formula Receiver | React + Hooks | Formelempfang (NB) |
| | Formula List | React + Hooks | Formelverwaltung |
| **Components** | FormulaCard | React | Formel-Darstellung |
| | DetailModal | React | Detailansicht |
| | ValidationBadge | React | Status-Anzeige |
| **Services** | API Service | Axios | REST-API-Client |
| | OAuth2 Interceptor | Axios Interceptors | Auto-Auth |
| **Data** | Types | TypeScript | Type-Definitionen |
| | Templates | JSON | Vorkonfigurierte Formeln |

---

## Technologie-Stack

### Frontend

| Komponente | Technologie | Version | Zweck |
|------------|-------------|---------|-------|
| Framework | React | 18.2.0 | UI-Framework |
| Sprache | TypeScript | 5.3.3 | Type-Safe Development |
| Build Tool | Vite | 5.0.8 | Dev Server & Build |
| Styling | Tailwind CSS | 3.3.6 | Utility-First CSS |
| HTTP Client | Axios | 1.6.2 | REST API Calls |
| Router | React Router | 6.x | Client-Side Routing |
| Icons | Lucide React | Latest | Icon Library |
| Web Server | Nginx | Alpine | Static File Serving |

### Backend

| Komponente | Technologie | Version | Zweck |
|------------|-------------|---------|-------|
| Runtime | Python | 3.12 | Application Runtime |
| Framework | Flask | 3.0 | Web Framework |
| CORS | Flask-CORS | Latest | Cross-Origin Support |
| Storage | In-Memory Dict | - | Mock Storage (Demo) |
| Production DB | PostgreSQL | 15+ | Empfohlen für Produktion |
| Auth | Mock OAuth2 | - | Token Generation |

### Infrastructure

| Komponente | Technologie | Zweck |
|------------|-------------|-------|
| Containerization | Docker | 24.x | Application Packaging |
| Orchestration | Docker Compose | V2 | Multi-Container Management |
| Reverse Proxy | Nginx | Alpine | Frontend Web Server |
| API Gateway | Nginx Proxy | - | API Routing |

---

## Deployment-Architektur

### Docker Compose Setup

```yaml
services:
  mabis-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - FLASK_ENV=development
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8000/health')"]
      interval: 30s

  mabis-frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      mabis-api:
        condition: service_healthy
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
```

### Network Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      Host Machine                          │
│                                                            │
│  Port 3000              Port 8000                          │
│      │                     │                               │
│      ▼                     ▼                               │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │                 │  │                 │                │
│  │  Frontend       │  │  Backend API    │                │
│  │  (Nginx:80)     │  │  (Flask:8000)   │                │
│  │                 │  │                 │                │
│  │  React SPA      │  │  REST API       │                │
│  │  + Templates    │  │  + Formula      │                │
│  │                 │  │    Engine       │                │
│  │                 │  │                 │                │
│  └────────┬────────┘  └────────┬────────┘                │
│           │                    │                          │
│           │  /api/* proxy      │                          │
│           └────────────────────┘                          │
│                                                            │
│  Docker Network: mabis-network (bridge)                   │
│                                                            │
│  Service Discovery: DNS (mabis-api, mabis-frontend)       │
│                                                            │
└────────────────────────────────────────────────────────────┘

Browser ──HTTPS──▶ localhost:3000 (Frontend)
                       │
                       │ XHR Requests to /api/*
                       ▼
                   Nginx Proxy Config:
                   location /api/ {
                     proxy_pass http://mabis-api:8000/;
                   }
                       │
                       ▼
                   mabis-api:8000 (Backend)
```

### Production Deployment (Empfohlen)

```
┌────────────────────────────────────────────────────────────────┐
│                      Cloud Provider (AWS/Azure/GCP)            │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Load Balancer (HTTPS)                  │ │
│  │                  SSL/TLS Termination                      │ │
│  └───────────────────────┬──────────────────────────────────┘ │
│                          │                                     │
│         ┌────────────────┴────────────────┐                   │
│         ▼                                 ▼                   │
│  ┌─────────────────┐              ┌─────────────────┐        │
│  │  Frontend       │              │  Backend API    │        │
│  │  Kubernetes Pod │              │  Kubernetes Pod │        │
│  │  (3 Replicas)   │              │  (3 Replicas)   │        │
│  └─────────────────┘              └────────┬────────┘        │
│                                             │                 │
│                                             ▼                 │
│                                    ┌─────────────────┐        │
│                                    │  PostgreSQL     │        │
│                                    │  (Managed DB)   │        │
│                                    └─────────────────┘        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   Monitoring & Logging                    │ │
│  │  • Prometheus (Metrics)                                  │ │
│  │  • Grafana (Dashboards)                                  │ │
│  │  • ELK Stack (Logs)                                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Sicherheitsarchitektur

### Authentifizierung & Autorisierung

```
┌──────────────────────────────────────────────────────────────┐
│                   Security Architecture                       │
│                                                               │
│  ┌─────────────┐                                             │
│  │   Browser   │                                             │
│  └──────┬──────┘                                             │
│         │                                                    │
│         │ 1. Initial Request (no token)                     │
│         ▼                                                    │
│  ┌──────────────────┐                                        │
│  │  Frontend API    │                                        │
│  │  Service         │                                        │
│  └──────┬───────────┘                                        │
│         │                                                    │
│         │ 2. Interceptor detects missing token              │
│         ▼                                                    │
│  ┌──────────────────────────────────┐                       │
│  │  OAuth2 Auto-Authentication      │                       │
│  │                                   │                       │
│  │  POST /oauth/token                │                       │
│  │  {                                │                       │
│  │    grant_type: "client_credentials"│                      │
│  │    client_id: "demo-client"       │                       │
│  │    client_secret: "demo-secret"   │                       │
│  │    scope: "formulas.read..."      │                       │
│  │  }                                │                       │
│  └──────┬───────────────────────────┘                       │
│         │                                                    │
│         │ 3. Token Response                                 │
│         ▼                                                    │
│  ┌──────────────────┐                                        │
│  │  Access Token    │                                        │
│  │  (JWT)           │                                        │
│  │                  │                                        │
│  │  Stored in:      │                                        │
│  │  • Memory        │                                        │
│  │  • Axios Header  │                                        │
│  └──────┬───────────┘                                        │
│         │                                                    │
│         │ 4. All subsequent requests                        │
│         ▼                                                    │
│  ┌──────────────────────────────────┐                       │
│  │  Authorization: Bearer {token}   │                       │
│  └──────┬───────────────────────────┘                       │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────┐                                        │
│  │  Backend API     │                                        │
│  │  validate_token()│                                        │
│  └──────────────────┘                                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Security Layers

| Layer | Mechanismus | Beschreibung |
|-------|-------------|--------------|
| **Transport** | HTTPS/TLS 1.3 | Verschlüsselte Kommunikation |
| **Authentication** | OAuth2 Client Credentials | Token-basierte Authentifizierung |
| **Authorization** | Scope-based | Granulare Berechtigungen |
| **API Security** | Rate Limiting | DDoS-Schutz |
| **Data Validation** | JSON Schema | Input-Validierung |
| **Error Handling** | Masked Errors | Keine sensiblen Infos in Fehlern |

---

## Datenfluss

### Formelübermittlung (MSB → NB)

```
┌──────────────┐                                    ┌──────────────┐
│              │                                    │              │
│   MSB User   │                                    │   NB User    │
│              │                                    │              │
└──────┬───────┘                                    └───────┬──────┘
       │                                                    │
       │ 1. Öffnet Formula Builder                         │
       │    http://localhost:3000/builder                  │
       │                                                    │
       ▼                                                    │
┌─────────────────────────┐                                │
│  Formula Builder Page   │                                │
│                         │                                │
│  • Wählt Template       │                                │
│  • Füllt Formular aus   │                                │
│  • Sieht Live-Vorschau  │                                │
│                         │                                │
└────────┬────────────────┘                                │
         │                                                  │
         │ 2. Klick "Formel speichern"                     │
         ▼                                                  │
┌─────────────────────────┐                                │
│  formulaApi.submit()    │                                │
│                         │                                │
│  Wraps formula in:      │                                │
│  {                      │                                │
│    messageId: "MSG-..." │                                │
│    sender: {...}        │                                │
│    formulas: [...]      │                                │
│  }                      │                                │
└────────┬────────────────┘                                │
         │                                                  │
         │ 3. POST /v1/formulas                            │
         │    Authorization: Bearer {token}                │
         ▼                                                  │
┌─────────────────────────┐                                │
│  Backend API            │                                │
│                         │                                │
│  • Validate token       │                                │
│  • Validate JSON schema │                                │
│  • Store in formula_store│                               │
│  • Return acceptance    │                                │
│                         │                                │
└────────┬────────────────┘                                │
         │                                                  │
         │ 4. Response 201 Created                         │
         │    {                                             │
         │      status: "ACCEPTED",                         │
         │      formulaIds: ["FORM-..."]                    │
         │    }                                             │
         ▼                                                  │
┌─────────────────────────┐                                │
│  "Gespeichert!" Message │                                │
└─────────────────────────┘                                │
                                                            │
                                              5. Öffnet Formula Receiver
                                                 http://localhost:3000/receiver
                                                            │
                                                            ▼
                                                  ┌─────────────────────────┐
                                                  │ Formula Receiver Page   │
                                                  │                         │
                                                  │ • GET /v1/formulas      │
                                                  │ • Zeigt alle Formeln    │
                                                  │ • Validiert Struktur    │
                                                  │ • Prüft Parameter       │
                                                  │                         │
                                                  └────────┬────────────────┘
                                                           │
                                              6. Klick auf Formel          │
                                                           ▼
                                                  ┌─────────────────────────┐
                                                  │ Detail Modal            │
                                                  │                         │
                                                  │ • Zeigt alle Parameter  │
                                                  │ • Zeigt Expression      │
                                                  │ • Zeigt JSON komplett   │
                                                  │ • Accept/Reject Buttons │
                                                  │                         │
                                                  └─────────────────────────┘
```

### Sequence Diagram: Complete Flow

```
MSB User    Formula Builder    API Service    Backend API    Storage    Formula Receiver    NB User
   │               │               │               │            │              │              │
   │ Open Builder  │               │               │            │              │              │
   ├──────────────▶│               │               │            │              │              │
   │               │               │               │            │              │              │
   │ Select Template│              │               │            │              │              │
   ├──────────────▶│               │               │            │              │              │
   │               │               │               │            │              │              │
   │ Fill Form     │               │               │            │              │              │
   ├──────────────▶│               │               │            │              │              │
   │               │               │               │            │              │              │
   │ Click Save    │               │               │            │              │              │
   ├──────────────▶│               │               │            │              │              │
   │               │ submit()      │               │            │              │              │
   │               ├──────────────▶│               │            │              │              │
   │               │               │ POST /formulas│            │              │              │
   │               │               ├──────────────▶│            │              │              │
   │               │               │               │ store()    │              │              │
   │               │               │               ├───────────▶│              │              │
   │               │               │               │            │              │              │
   │               │               │               │ OK         │              │              │
   │               │               │               │◀───────────┤              │              │
   │               │               │               │            │              │              │
   │               │               │ 201 CREATED   │            │              │              │
   │               │               │◀──────────────┤            │              │              │
   │               │ Success       │               │            │              │              │
   │               │◀──────────────┤               │            │              │              │
   │ "Gespeichert!"│               │               │            │              │              │
   │◀──────────────┤               │               │            │              │              │
   │               │               │               │            │              │              │
   │               │               │               │            │              │ Open Receiver│
   │               │               │               │            │              │◀─────────────┤
   │               │               │               │            │              │              │
   │               │               │               │            │              │ list()       │
   │               │               │               │            │              ├─────────────▶│
   │               │               │               │            │              │              │
   │               │               │               │ GET /formulas            │              │
   │               │               │               │◀──────────────────────────┤              │
   │               │               │               │            │              │              │
   │               │               │               │ retrieve() │              │              │
   │               │               │               ├───────────▶│              │              │
   │               │               │               │            │              │              │
   │               │               │               │ formulas   │              │              │
   │               │               │               │◀───────────┤              │              │
   │               │               │               │            │              │              │
   │               │               │ 200 OK + formulas         │              │              │
   │               │               │               ├──────────────────────────▶│              │
   │               │               │               │            │              │              │
   │               │               │               │            │              │ Display List │
   │               │               │               │            │              ├─────────────▶│
   │               │               │               │            │              │              │
   │               │               │               │            │              │ View Details │
   │               │               │               │            │              │◀─────────────┤
   │               │               │               │            │              │              │
   │               │               │               │            │              │ See all params│
   │               │               │               │            │              ├─────────────▶│
```

---

## Erweiterbarkeit

### Zukünftige Integrationen

```
┌──────────────────────────────────────────────────────────────────┐
│                      Phase 2: Integrationen                       │
│                                                                   │
│  ┌────────────────┐         ┌────────────────┐                  │
│  │                │         │                │                  │
│  │ Smart Meter    │────────▶│ MaBiS Formula  │                  │
│  │ Gateway        │  OBIS   │ API            │                  │
│  │                │  Data   │                │                  │
│  └────────────────┘         └────────┬───────┘                  │
│                                      │                           │
│  ┌────────────────┐                  │                           │
│  │                │                  │                           │
│  │ MaBiS Hub      │◀─────────────────┤                           │
│  │ (EDI@Energy)   │  Formula Export  │                           │
│  │                │                  │                           │
│  └────────────────┘                  │                           │
│                                      │                           │
│  ┌────────────────┐                  │                           │
│  │                │                  │                           │
│  │ Billing System │◀─────────────────┘                           │
│  │ (SAP IS-U)     │  Calculation Results                        │
│  │                │                                              │
│  └────────────────┘                                              │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Zusammenfassung

Diese Architektur ermöglicht:

✅ **Moderne Formelübermittlung** - JSON statt EDIFACT
✅ **Bidirektionale Kommunikation** - Sender und Empfänger UI
✅ **Skalierbarkeit** - Docker + Kubernetes-ready
✅ **Sicherheit** - OAuth2 + HTTPS + Validierung
✅ **Erweiterbarkeit** - Modular, lose gekoppelt
✅ **Transparenz** - Vollständige Nachvollziehbarkeit

**Technologie-Entscheidungen:**
- React/TypeScript für type-safe Frontend
- Python/Flask für flexible Backend-Entwicklung
- Docker für konsistente Deployments
- OAuth2 für standardisierte Authentifizierung
- REST/JSON für moderne API-Integration

**Nächste Schritte:**
1. PostgreSQL-Integration für Produktion
2. Keycloak für echte OAuth2-Integration
3. Kubernetes-Manifests für Cloud-Deployment
4. Monitoring & Observability (Prometheus/Grafana)
5. API-Gateway (Kong/Traefik) für erweiterte Features
