# MaBiS Formula Builder - Frontend

## Überblick

Moderne React + TypeScript Web-Anwendung für die visuelle Erstellung von MaBiS-Formeln ohne JSON-Kenntnisse.

## Tech Stack

- **React 18** - UI-Framework
- **TypeScript** - Type-Safety
- **Vite** - Build-Tool & Dev-Server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP Client
- **Zustand** - State Management
- **React Hook Form** - Formular-Verwaltung
- **Zod** - Schema-Validierung
- **Recharts** - Datenvisualisierung
- **Lucide React** - Icons

## Schnellstart

### Lokale Entwicklung

```bash
# Dependencies installieren
cd frontend
npm install

# Dev-Server starten (Port 3000)
npm run dev

# In anderem Terminal: Backend starten
cd ..
python mock_api_server.py
```

Frontend: http://localhost:3000
Backend API: http://localhost:8000

### Mit Docker

```bash
# Aus dem Root-Verzeichnis
docker compose up
```

Frontend: http://localhost:3000
Backend API: http://localhost:8000

## Projektstruktur

```
frontend/
├── src/
│   ├── components/          # Wiederverwendbare UI-Komponenten
│   │   ├── FormulaBuilder.tsx      # Hauptkomponente für Formelerstellung
│   │   ├── TemplateSelector.tsx   # Template-Auswahl
│   │   ├── MeteringPointPicker.tsx # Messpunkt-Auswahl
│   │   ├── ParameterEditor.tsx     # Parameter-Editor
│   │   └── FormulaPreview.tsx      # Live-Vorschau
│   │
│   ├── pages/               # Seiten/Views
│   │   ├── Dashboard.tsx    # Übersicht & Statistiken
│   │   ├── FormulaBuilder.tsx # Formel-Editor
│   │   └── FormulaList.tsx  # Formelverwaltung
│   │
│   ├── services/            # API-Integration
│   │   └── api.ts           # REST API Client
│   │
│   ├── types/               # TypeScript-Definitionen
│   │   └── formula.ts       # Formula-Typen
│   │
│   ├── data/                # Statische Daten
│   │   └── templates.ts     # Formel-Templates
│   │
│   ├── hooks/               # Custom React Hooks
│   ├── utils/               # Helper-Funktionen
│   ├── App.tsx              # Root-Komponente
│   ├── main.tsx             # Entry Point
│   └── index.css            # Global Styles
│
├── public/                  # Statische Assets
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Hauptfunktionen

### 1. Dashboard
- **Statistiken:** Anzahl Formeln, Zeitreihen, Berechnungen
- **Letzte Aktivitäten:** Recent formulas, calculations
- **Health Status:** API Server Verbindung

### 2. Formula Builder
**Template-basierte Erstellung:**
- Auswahl aus vorgefertigten Templates (BESS, PV, Eigenverbrauch, etc.)
- Template-Kategorien: Bilanzierung, Netznutzung, Eigenverbrauch, Verluste, Aggregation

**Visuelle Formel-Erstellung:**
- Drag & Drop Interface (geplant)
- Dropdown-Auswahl für Funktionen
- Parameter-Editor mit Validierung
- Messpunkt-Auswahl aus Katalog

**Live-Vorschau:**
- Mathematische Darstellung der Formel
- JSON-Vorschau (kollabierbar)
- Validierungs-Feedback in Echtzeit

**Messpunkt-Zuordnung:**
- Auswahl verfügbarer Messpunkte
- OBIS-Code-Anzeige
- Richtung (Consumption/Production)
- Beschreibung

### 3. Formelverwaltung
- **Liste aller Formeln:** Mit Such- und Filter-Funktionen
- **Formel-Details:** Vollständige Ansicht inkl. Metadata
- **Löschen:** Formeln entfernen
- **Duplizieren:** Formel als Template verwenden
- **Export/Import:** JSON Export/Import

### 4. Berechnung & Test
- **Test mit Beispieldaten:** Formel mit Mock-Daten testen
- **Ergebnis-Vorschau:** Berechnete Zeitreihen anzeigen
- **Statistiken:** Min, Max, Durchschnitt, Summe
- **Visualisierung:** Graphische Darstellung (Recharts)

## API-Integration

### Automatische Authentifizierung
```typescript
// OAuth2 wird automatisch verwaltet
import { formulaApi } from './services/api';

// Token-Refresh bei 401
const formulas = await formulaApi.list();
```

### Verfügbare APIs
```typescript
// Formeln
formulaApi.submit(submission);
formulaApi.list();
formulaApi.get(formulaId);
formulaApi.delete(formulaId);

// Zeitreihen
timeSeriesApi.submit(data);
timeSeriesApi.list(params);
timeSeriesApi.get(timeSeriesId);

// Berechnungen
calculationApi.execute(request);
calculationApi.get(calculationId);

// Health
healthCheck();
```

## Komponenten-Beispiele

### Template Selector
```tsx
<TemplateSelector
  onSelect={(template) => {
    // Template anwenden
    setFormula(template.formula);
  }}
/>
```

### Formula Preview
```tsx
<FormulaPreview
  formula={currentFormula}
  showJson={true}
/>
```

### Metering Point Picker
```tsx
<MeteringPointPicker
  required={3}
  onSelect={(points) => {
    // Messpunkte zugeordnet
    setMeteringPoints(points);
  }}
/>
```

## Styling

### Tailwind CSS Klassen
```tsx
// Buttons
<button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
  Speichern
</button>

// Cards
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  Card Content
</div>

// Inputs
<input className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500" />
```

### Custom Theme
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
    },
  },
}
```

## Umgebungsvariablen

Erstellen Sie `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

**Produktion:**
```env
VITE_API_BASE_URL=https://api.mabis-hub.de
```

## Build & Deployment

### Entwicklung
```bash
npm run dev
```

### Production Build
```bash
npm run build
# Output: dist/
```

### Preview Production Build
```bash
npm run preview
```

### Docker Build
```bash
docker build -t mabis-formula-builder:latest -f frontend/Dockerfile .
docker run -p 3000:80 mabis-formula-builder:latest
```

## Geplante Features (Roadmap)

### Phase 1 (Aktuell - MVP)
- [x] Template-basierte Formelerstellung
- [x] API-Integration
- [x] Formel-Vorschau
- [x] Messpunkt-Auswahl
- [ ] Vollständige UI-Komponenten
- [ ] Formular-Validierung

### Phase 2
- [ ] Drag & Drop Formula Builder
- [ ] Visual Flow Editor (React Flow)
- [ ] Formula Debugging
- [ ] Test-Daten-Generator
- [ ] Erweiterte Visualisierungen

### Phase 3
- [ ] Benutzerverwaltung & Auth
- [ ] Formel-Versionierung
- [ ] Team-Collaboration
- [ ] Formel-Bibliothek (Community)
- [ ] Export zu anderen Formaten

### Phase 4
- [ ] AI-gestützte Formelvorschläge
- [ ] Automatische Optimierung
- [ ] Predictive Analytics
- [ ] Multi-Language Support

## Entwicklungs-Guidelines

### TypeScript
- **Strict Mode aktiviert**
- Keine `any` types verwenden
- Interfaces für alle Props definieren
- Zod für Runtime-Validierung

### React Best Practices
- Funktionale Komponenten
- Hooks für State-Management
- Memo für Performance
- Error Boundaries

### Code Style
```bash
# Linting
npm run lint

# Formatierung
npm run format
```

### Git Workflow
```bash
# Feature Branch
git checkout -b feature/formula-validation

# Commit
git commit -m "feat: Add formula validation"

# Pull Request
git push origin feature/formula-validation
```

## Troubleshooting

### API-Verbindungsfehler
```
✗ Failed to fetch: ERR_CONNECTION_REFUSED
```
**Lösung:** Backend starten (`python mock_api_server.py`)

### CORS-Fehler
**Lösung:** Vite Proxy ist konfiguriert. Alternativ Backend CORS aktivieren.

### Build-Fehler
```bash
# Node modules neu installieren
rm -rf node_modules package-lock.json
npm install

# Cache löschen
npm run build -- --force
```

### TypeScript-Fehler
```bash
# Type-Check durchführen
npx tsc --noEmit
```

## Performance

### Bundle Size
- Initial Bundle: ~200KB (gzipped)
- Lazy Loading für Routes
- Code Splitting aktiviert

### Optimierungen
- Vite Rollup-Optimierung
- Tree Shaking
- Minification
- Asset-Caching

## Testing (geplant)

```bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## Lizenz

Proprietär - 50Hertz Transmission GmbH

## Support

**Technische Fragen:**
- GitHub Issues
- E-Mail: dev-support@example.com

**Dokumentation:**
- [MaBiS API Docs](../README.md)
- [Business Use Case](../BUSINESS_USECASE_HOWTO.md)
- [Docker Setup](../DOCKER_README.md)

---

**Entwickelt mit ❤️ für die deutsche Energiewende**
