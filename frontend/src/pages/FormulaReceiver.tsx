import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { formulaApi } from '../services/api';
import type { Formula } from '../types/formula';

export default function FormulaReceiver() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);

  useEffect(() => {
    loadReceivedFormulas();
  }, []);

  const loadReceivedFormulas = async () => {
    try {
      const data = await formulaApi.list();
      setFormulas(data.formulas || []);
    } catch (error) {
      console.error('Failed to load received formulas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade empfangene Formeln...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formelempfang (Netzbetreiber)</h1>
          <p className="mt-2 text-gray-600">
            Empfangene Formeln von Messstellenbetreibern - Validierung und Bestätigung
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {formulas.length} empfangene Formel{formulas.length !== 1 ? 'n' : ''}
          </p>
        </div>
        <button
          onClick={loadReceivedFormulas}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
        >
          Aktualisieren
        </button>
      </div>

      {formulas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertTriangle className="mx-auto mb-4 text-yellow-500" size={48} />
          <p className="text-gray-500">Keine Formeln empfangen</p>
          <p className="mt-2 text-sm text-gray-400">
            Warten auf Übermittlung von Messstellenbetreibern
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {formulas.map((formula) => (
            <ReceivedFormulaCard
              key={formula.formulaId}
              formula={formula}
              onView={() => setSelectedFormula(formula)}
            />
          ))}
        </div>
      )}

      {/* Formula Detail Modal */}
      {selectedFormula && (
        <FormulaDetailModal
          formula={selectedFormula}
          onClose={() => setSelectedFormula(null)}
        />
      )}
    </div>
  );
}

function ReceivedFormulaCard({
  formula,
  onView,
}: {
  formula: Formula;
  onView: () => void;
}) {
  // Validate formula structure
  const isValid = formula.formulaId && formula.expression && formula.expression.function;
  const hasAllParameters = formula.inputTimeSeries && formula.inputTimeSeries.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            {isValid && hasAllParameters ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : (
              <XCircle className="text-red-500" size={20} />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{formula.name}</h3>
            {formula.category && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {formula.category}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3">{formula.description}</p>

          {/* Transmission Details */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="text-xs">
              <span className="font-medium text-gray-700">Formel-ID:</span>
              <span className="ml-2 text-gray-600">{formula.formulaId}</span>
            </div>
            <div className="text-xs">
              <span className="font-medium text-gray-700">Funktion:</span>
              <span className="ml-2 text-gray-600">{formula.expression.function}</span>
            </div>
            <div className="text-xs">
              <span className="font-medium text-gray-700">Eingänge:</span>
              <span className="ml-2 text-gray-600">{formula.inputTimeSeries.length}</span>
            </div>
            <div className="text-xs">
              <span className="font-medium text-gray-700">Ausgabe:</span>
              <span className="ml-2 text-gray-600">
                {formula.outputUnit} @ {formula.outputResolution}
              </span>
            </div>
          </div>

          {/* Validation Status */}
          <div className="flex items-center space-x-4 text-xs">
            <ValidationBadge
              label="Struktur"
              valid={!!formula.expression}
            />
            <ValidationBadge
              label="Parameter"
              valid={hasAllParameters}
            />
            <ValidationBadge
              label="Metadaten"
              valid={!!formula.outputUnit && !!formula.outputResolution}
            />
            <ValidationBadge
              label="Kategorie"
              valid={!!formula.category}
            />
          </div>
        </div>

        <button
          onClick={onView}
          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors"
          title="Details ansehen"
        >
          <Eye size={18} />
        </button>
      </div>
    </div>
  );
}

function ValidationBadge({ label, valid }: { label: string; valid: boolean }) {
  return (
    <div className="flex items-center space-x-1">
      {valid ? (
        <CheckCircle className="text-green-500" size={12} />
      ) : (
        <XCircle className="text-red-500" size={12} />
      )}
      <span className={valid ? 'text-green-700' : 'text-red-700'}>{label}</span>
    </div>
  );
}

function FormulaDetailModal({ formula, onClose }: { formula: Formula; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Empfangene Formel: {formula.name}</h2>
          <p className="text-sm text-gray-500 mt-1">ID: {formula.formulaId}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Grundinformationen</h3>
            <div className="bg-gray-50 rounded p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-600">Name:</span>
                  <p className="text-sm">{formula.name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600">Kategorie:</span>
                  <p className="text-sm">{formula.category || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600">Ausgabe-Einheit:</span>
                  <p className="text-sm">{formula.outputUnit}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600">Auflösung:</span>
                  <p className="text-sm">{formula.outputResolution}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">Beschreibung:</span>
                <p className="text-sm mt-1">{formula.description}</p>
              </div>
            </div>
          </div>

          {/* Expression Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Formelausdruck</h3>
            <div className="bg-gray-50 rounded p-4">
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-600">Funktion:</span>
                <p className="text-sm font-mono bg-white px-2 py-1 rounded mt-1">
                  {formula.expression.function}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">
                  Parameter ({formula.expression.parameters.length}):
                </span>
                <div className="mt-2 space-y-2">
                  {formula.expression.parameters.map((param, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-gray-600">Name:</span>
                          <span className="ml-2">{param.name}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Typ:</span>
                          <span className="ml-2">{param.type}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-gray-600">Wert:</span>
                          <pre className="ml-2 mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {typeof param.value === 'object'
                              ? JSON.stringify(param.value, null, 2)
                              : String(param.value)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Input Time Series */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Eingangszeitreihen</h3>
            <div className="bg-gray-50 rounded p-4">
              <ul className="space-y-1">
                {formula.inputTimeSeries.map((ts, idx) => (
                  <li key={idx} className="text-sm font-mono bg-white px-2 py-1 rounded">
                    {ts}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Complete JSON */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Vollständige JSON-Übermittlung
            </h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(formula, null, 2)}
            </pre>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Schließen
          </button>
          <div className="space-x-2">
            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
              Ablehnen
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              Akzeptieren & Bestätigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
