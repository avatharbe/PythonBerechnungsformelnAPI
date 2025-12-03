import { Server, Database, Shield, Zap, CheckCircle, ArrowRight } from 'lucide-react';

export default function Architecture() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Architektur-Konzept</h1>
        <p className="mt-2 text-gray-600">
          MaBiS Hub Formula Registry - Moderne Alternative zu EDIFACT UTILTS
        </p>
      </div>

      {/* Problem Statement */}
      <section className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Das Problem mit EDIFACT UTILTS</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <p>✗ <strong>Kryptische Struktur:</strong> Schrittweise Übermittlung, schwer zu validieren</p>
          <p>✗ <strong>Komplexe Integration:</strong> Spezielle EDI-Parser erforderlich</p>
          <p>✗ <strong>Fehleranfällig:</strong> Jeder Berechnungsschritt benötigt separate ID</p>
          <p>✗ <strong>Veraltete Technologie:</strong> Schwierig zu debuggen und zu erweitern</p>
          <p>✗ <strong>Mangelnde Transparenz:</strong> Komplette Formelstruktur nicht sofort ersichtlich</p>
        </div>
      </section>

      {/* Solution */}
      <section className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Die Lösung: REST API mit JSON</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <p>✓ <strong>Klare Struktur:</strong> Komplette Formel in einem JSON-Objekt</p>
          <p>✓ <strong>Standard-Integration:</strong> HTTP/REST, keine speziellen Parser nötig</p>
          <p>✓ <strong>Einfache Validierung:</strong> JSON Schema, Echtzeit-Feedback</p>
          <p>✓ <strong>Moderne Technologie:</strong> Standard Web-Tools (Postman, Browser DevTools)</p>
          <p>✓ <strong>Volle Transparenz:</strong> Alle Parameter und Berechnungen sofort sichtbar</p>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Systemarchitektur</h2>

        {/* Architecture Diagram */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-300">
            {/* MSBs */}
            <div className="flex items-center justify-center mb-6">
              <div className="grid grid-cols-3 gap-4">
                {['MSB 1', 'MSB 2', 'MSB n'].map((msb) => (
                  <div key={msb} className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4 text-center">
                    <p className="font-semibold text-blue-900">{msb}</p>
                    <p className="text-xs text-blue-700">Messstellenbetreiber</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrows Down */}
            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center">
                <ArrowRight size={32} className="text-gray-400 transform rotate-90" />
                <span className="text-xs text-gray-600 mt-1">POST /v1/formulas</span>
              </div>
            </div>

            {/* MaBiS Hub */}
            <div className="bg-gradient-to-r from-primary-100 to-primary-200 border-4 border-primary-500 rounded-lg p-6 mb-6">
              <h3 className="text-center text-xl font-bold text-primary-900 mb-4">
                MaBiS Hub (Zentral)
              </h3>
              <p className="text-center text-sm text-primary-800 mb-4">
                Betrieben von: 50Hertz, TenneT, Amprion, TransnetBW
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FeatureBox icon={<Database size={20} />} title="Formel-Registry" />
                <FeatureBox icon={<Shield size={20} />} title="Validierung" />
                <FeatureBox icon={<Server size={20} />} title="Routing" />
                <FeatureBox icon={<Zap size={20} />} title="REST API" />
              </div>
            </div>

            {/* Arrows Down */}
            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center">
                <ArrowRight size={32} className="text-gray-400 transform rotate-90" />
                <span className="text-xs text-gray-600 mt-1">Webhooks / Notifications</span>
              </div>
            </div>

            {/* NBs and ÜNBs */}
            <div className="flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4">
                {['NB 1', 'NB 2', 'ÜNB'].map((nb) => (
                  <div key={nb} className="bg-green-100 border-2 border-green-400 rounded-lg p-4 text-center">
                    <p className="font-semibold text-green-900">{nb}</p>
                    <p className="text-xs text-green-700">
                      {nb.startsWith('NB') ? 'Netzbetreiber' : 'Übertragungsnetzbetreiber'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Components Description */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComponentCard
            title="MSB (Sender)"
            description="Messstellenbetreiber reichen Formeln via REST API ein"
            items={[
              'Template-basierte Erstellung',
              'JSON-Validierung',
              'OAuth2 Authentifizierung',
            ]}
          />
          <ComponentCard
            title="MaBiS Hub (Zentral)"
            description="Zentrale Plattform für Formelübermittlung"
            items={[
              'Empfang & Validierung',
              'Formel-Registry',
              'Routing zu NBs/ÜNBs',
            ]}
            highlighted
          />
          <ComponentCard
            title="NB/ÜNB (Empfänger)"
            description="Netzbetreiber erhalten validierte Formeln"
            items={[
              'Notification bei neuen Formeln',
              'Query-Interface',
              'Akzeptieren/Ablehnen',
            ]}
          />
        </div>
      </section>

      {/* MaBiS Hub Responsibilities */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">MaBiS Hub Verantwortlichkeiten</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResponsibilityCard
            number="1"
            title="Formelempfang"
            description="Empfang von Formeln über REST API von MSBs mit sofortiger Validierung"
          />
          <ResponsibilityCard
            number="2"
            title="Validierung"
            description="JSON Schema-Validierung, Business Rules, TSO-Standards, OBIS-Code-Prüfung"
          />
          <ResponsibilityCard
            number="3"
            title="Speicherung"
            description="Zentrale Formel-Registry mit Versionierung und Audit-Log"
          />
          <ResponsibilityCard
            number="4"
            title="Routing"
            description="Weiterleitung an korrekte Empfänger (NBs, ÜNBs) basierend auf Zuständigkeit"
          />
          <ResponsibilityCard
            number="5"
            title="Benachrichtigung"
            description="Notifications an NBs bei neuen Formeln, Bestätigungen an MSBs"
          />
          <ResponsibilityCard
            number="6"
            title="Query-Interface"
            description="REST API für Abfragen, Formel-Suche, Statistiken und Reports"
          />
        </div>
      </section>

      {/* Technology Stack */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Technologie-Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Frontend (React + TypeScript)</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• React 18 mit TypeScript 5.3</li>
              <li>• Vite 5 Build Tool</li>
              <li>• Tailwind CSS für Styling</li>
              <li>• Axios für HTTP-Requests</li>
              <li>• Nginx als Web Server</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Backend (Python + Flask)</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Python 3.12 + Flask 3.0</li>
              <li>• REST API mit JSON</li>
              <li>• OAuth2 Authentifizierung</li>
              <li>• 11 TSO-Berechnungsfunktionen</li>
              <li>• PostgreSQL (Produktion)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Vorteile für Marktteilnehmer</h2>
        <div className="space-y-4">
          <BenefitRow
            stakeholder="MSBs (Messstellenbetreiber)"
            benefits={[
              'Einfache Integration mit Standard HTTP Libraries',
              'Template-basierte Formelerstellung',
              'Sofortiges Feedback bei Validierungsfehlern',
              'Keine EDI-Spezialisten erforderlich',
            ]}
          />
          <BenefitRow
            stakeholder="MaBiS Hub (TSOs)"
            benefits={[
              'Reduzierte Komplexität gegenüber EDIFACT',
              'Bessere Validierung und Fehlerbehandlung',
              'Moderne Monitoring-Tools einsetzbar',
              'Einfachere Wartung und Erweiterung',
            ]}
          />
          <BenefitRow
            stakeholder="NBs/ÜNBs (Netzbetreiber)"
            benefits={[
              'Vollständige Formelstruktur sofort sichtbar',
              'Query-Interface für Formel-Abfragen',
              'Standard REST-Clients verwendbar',
              'Bessere Debugging-Möglichkeiten',
            ]}
          />
        </div>
      </section>

      {/* Migration Path */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Migrationspfad</h2>
        <div className="space-y-4">
          <MigrationPhase
            phase="1"
            title="Proof of Concept (Jetzt)"
            description="Demo-System mit vollständiger Funktionalität"
            status="completed"
          />
          <MigrationPhase
            phase="2"
            title="Pilot-Projekt (3-6 Monate)"
            description="2-3 Marktteilnehmer testen mit echten Daten, paralleler Betrieb zu EDIFACT"
            status="upcoming"
          />
          <MigrationPhase
            phase="3"
            title="Schrittweise Einführung (6-12 Monate)"
            description="Sukzessive Migration weiterer Teilnehmer, EDIFACT & REST parallel"
            status="upcoming"
          />
          <MigrationPhase
            phase="4"
            title="Vollständiger Rollout (12-24 Monate)"
            description="Alle Marktteilnehmer auf REST API, EDIFACT wird abgeschaltet"
            status="upcoming"
          />
        </div>
      </section>

      {/* API Endpoints */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">MaBiS Hub API Endpoints</h2>
        <div className="space-y-2">
          <ApiEndpoint method="POST" path="/v1/formulas" description="Formel einreichen (MSB)" />
          <ApiEndpoint method="GET" path="/v1/formulas" description="Alle Formeln auflisten (Hub)" />
          <ApiEndpoint method="GET" path="/v1/formulas/{id}" description="Spezifische Formel abrufen (NB)" />
          <ApiEndpoint method="DELETE" path="/v1/formulas/{id}" description="Formel löschen (Hub Operator)" />
          <ApiEndpoint method="PUT" path="/v1/formulas/{id}" description="Formel aktualisieren (Hub Operator)" />
          <ApiEndpoint method="POST" path="/v1/time-series" description="Messdaten übermitteln" />
          <ApiEndpoint method="POST" path="/v1/calculations" description="Berechnung ausführen" />
          <ApiEndpoint method="GET" path="/health" description="Health Check" />
        </div>
      </section>
    </div>
  );
}

function FeatureBox({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="bg-white rounded p-2 flex items-center gap-2 text-primary-900">
      {icon}
      <span className="text-xs font-medium">{title}</span>
    </div>
  );
}

function ComponentCard({
  title,
  description,
  items,
  highlighted = false,
}: {
  title: string;
  description: string;
  items: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-4 ${
        highlighted
          ? 'bg-primary-50 border-2 border-primary-500'
          : 'bg-gray-50 border border-gray-300'
      }`}
    >
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-600 mb-3">{description}</p>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
            <CheckCircle size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResponsibilityCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function BenefitRow({ stakeholder, benefits }: { stakeholder: string; benefits: string[] }) {
  return (
    <div className="border-l-4 border-primary-500 pl-4">
      <h3 className="font-semibold text-gray-900 mb-2">{stakeholder}</h3>
      <ul className="space-y-1">
        {benefits.map((benefit, idx) => (
          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
            <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MigrationPhase({
  phase,
  title,
  description,
  status,
}: {
  phase: string;
  title: string;
  description: string;
  status: 'completed' | 'upcoming';
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
            status === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {phase}
        </div>
      </div>
      <div className="flex-1 pb-4">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function ApiEndpoint({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-800',
    POST: 'bg-green-100 text-green-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
      <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[method]}`}>
        {method}
      </span>
      <code className="flex-1 text-sm font-mono text-gray-900">{path}</code>
      <span className="text-sm text-gray-600">{description}</span>
    </div>
  );
}
