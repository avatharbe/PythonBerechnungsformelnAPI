import { useState } from 'react';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { formulaApi } from '../services/api';
import { formulaTemplates } from '../data/templates';
import type { Formula, FormulaTemplate, FormulaFunction } from '../types/formula';

export default function FormulaBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<FormulaTemplate | null>(null);
  const [formula, setFormula] = useState<Partial<Formula> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleTemplateSelect = (template: FormulaTemplate) => {
    setSelectedTemplate(template);
    setFormula({
      ...template.formula,
      formulaId: `FORM-${Date.now()}`,
    });
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplate(null);
    setFormula({
      formulaId: `FORM-${Date.now()}`,
      name: '',
      description: '',
      outputUnit: 'KWH',
      outputResolution: 'PT15M',
      category: 'BILANZIERUNG',
      inputTimeSeries: [],
      expression: {
        function: 'Grp_Sum',
        parameters: [],
      },
    });
  };

  const [useCustomExpression, setUseCustomExpression] = useState(false);
  const [customExpressionText, setCustomExpressionText] = useState('');

  const handleSave = async () => {
    if (!formula) return;

    setSaving(true);
    try {
      const submission = {
        messageId: `MSG-${Date.now()}`,
        messageDate: new Date().toISOString(),
        sender: {
          id: 'USER-001',
          role: 'MSB',
          name: 'Formula Builder',
        },
        formulas: [formula as Formula],
      };

      await formulaApi.submit(submission);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save formula:', error);
      alert('Fehler beim Speichern der Formel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Formel an MaBiS Hub übermitteln</h1>
        <p className="mt-2 text-gray-600">MSB-Portal zur Formeleinreichung</p>
        <p className="mt-1 text-sm text-gray-500">Wählen Sie ein Template oder erstellen Sie eine neue Formel</p>
      </div>

      {!formula ? (
        <div className="space-y-6">
          {/* Create from Scratch Option */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border-2 border-primary-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Neue Formel von Grund auf erstellen
                </h2>
                <p className="text-sm text-gray-600 mb-1">
                  Erstellen Sie eine individuelle Formel ohne Template
                </p>
                <p className="text-xs text-gray-500 italic">
                  Create a custom formula from scratch without using a template
                </p>
              </div>
              <button
                onClick={handleCreateFromScratch}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
              >
                Von Grund auf erstellen
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">oder Template auswählen</span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vordefinierte Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formulaTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => handleTemplateSelect(template)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={formula.name || ''}
                  onChange={(e) => setFormula({ ...formula, name: e.target.value })}
                  className="text-2xl font-bold text-gray-900 border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2"
                  placeholder="Formelname"
                />
              </div>
              <button
                onClick={() => {
                  setFormula(null);
                  setSelectedTemplate(null);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <textarea
              value={formula.description || ''}
              onChange={(e) => setFormula({ ...formula, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Beschreibung"
              rows={2}
            />

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategorie
                </label>
                <select
                  value={formula.category || ''}
                  onChange={(e) => setFormula({ ...formula, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Wählen...</option>
                  <option value="BILANZIERUNG">Bilanzierung</option>
                  <option value="NETZNUTZUNG">Netznutzung</option>
                  <option value="EIGENVERBRAUCH">Eigenverbrauch</option>
                  <option value="VERLUSTE">Verluste</option>
                  <option value="AGGREGATION">Aggregation</option>
                  <option value="MATHEMATISCH">Mathematisch</option>
                  <option value="TRANSFORMATION">Transformation</option>
                  <option value="SONSTIGES">Sonstiges</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ausgabe-Einheit
                  </label>
                  <input
                    type="text"
                    value={formula.outputUnit || ''}
                    onChange={(e) => setFormula({ ...formula, outputUnit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    placeholder="z.B. KWH"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auflösung
                  </label>
                  <select
                    value={formula.outputResolution || ''}
                    onChange={(e) => setFormula({ ...formula, outputResolution: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Wählen...</option>
                    <option value="PT15M">15 Minuten</option>
                    <option value="PT1H">1 Stunde</option>
                    <option value="P1D">1 Tag</option>
                  </select>
                </div>
              </div>

              {/* Function Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Berechnungsfunktion
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useCustomExpression}
                      onChange={(e) => {
                        setUseCustomExpression(e.target.checked);
                        if (e.target.checked && formula) {
                          // Store current function as custom expression
                          setCustomExpressionText(formula.expression?.function || '');
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-600">Freie mathematische Formel</span>
                  </label>
                </div>

                {useCustomExpression ? (
                  <div className="space-y-2">
                    <textarea
                      value={customExpressionText}
                      onChange={(e) => {
                        setCustomExpressionText(e.target.value);
                        // Store in metadata for now
                        setFormula({
                          ...formula,
                          metadata: {
                            ...formula.metadata,
                            customExpression: e.target.value,
                          }
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                      rows={3}
                      placeholder="z.B. y = a*x^3 + b*x^2 + c*x + d&#10;oder: y = (cos(x))^3&#10;oder: result = sqrt(a^2 + b^2)"
                    />
                    <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="font-semibold mb-1">Beispiele für mathematische Ausdrücke:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><code>y = a*x^3 + b*x^2 + c*x + d</code> - Polynom 3. Grades</li>
                        <li><code>y = (cos(x))^3</code> - Trigonometrische Funktion</li>
                        <li><code>result = sqrt(a^2 + b^2)</code> - Wurzel</li>
                        <li><code>output = exp(x) * sin(y)</code> - Exponential & Sinus</li>
                        <li><code>z = log(x) + ln(y)</code> - Logarithmus</li>
                      </ul>
                      <p className="mt-2 text-gray-500">
                        Verwenden Sie Standard-Mathematik-Notation. Variablen wie a, b, c, x können als Parameter unten definiert werden.
                      </p>
                    </div>
                  </div>
                ) : (
                  <select
                    value={formula.expression?.function || ''}
                    onChange={(e) => setFormula({
                      ...formula,
                      expression: {
                        ...formula.expression!,
                        function: e.target.value as FormulaFunction,
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Grp_Sum">Grp_Sum - Summe</option>
                    <option value="Wenn_Dann">Wenn_Dann - If-Then-Else</option>
                    <option value="Anteil_Groesser_Als">Anteil_Groesser_Als - Anteil über Schwellenwert</option>
                    <option value="Anteil_Kleiner_Als">Anteil_Kleiner_Als - Anteil unter Schwellenwert</option>
                    <option value="Quer_Max">Quer_Max - Maximum über Zeitreihen</option>
                    <option value="Quer_Min">Quer_Min - Minimum über Zeitreihen</option>
                    <option value="Groesser_Als">Groesser_Als - Vergleich größer als</option>
                    <option value="Round">Round - Rundung</option>
                    <option value="Conv_RKMG">Conv_RKMG - Konvertierung RLM/KLM</option>
                    <option value="IMax">IMax - Maximum innerhalb Zeitreihe</option>
                    <option value="IMin">IMin - Minimum innerhalb Zeitreihe</option>
                  </select>
                )}
              </div>

              {/* Input Time Series */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eingangszeitreihen
                  <span className="ml-2 text-xs text-gray-500">(optional - für Zeitreihen-basierte Berechnungen)</span>
                </label>
                <div className="space-y-2">
                  {formula.inputTimeSeries && formula.inputTimeSeries.length > 0 ? (
                    formula.inputTimeSeries.map((ts, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={ts}
                          onChange={(e) => {
                            const newTimeSeries = [...(formula.inputTimeSeries || [])];
                            newTimeSeries[idx] = e.target.value;
                            setFormula({ ...formula, inputTimeSeries: newTimeSeries });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. lineA, production, consumption, x"
                        />
                        <button
                          onClick={() => {
                            const newTimeSeries = formula.inputTimeSeries?.filter((_, i) => i !== idx);
                            setFormula({ ...formula, inputTimeSeries: newTimeSeries });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Keine Eingangszeitreihen - verwenden Sie Parameter für Einzelwerte oder mathematische Ausdrücke
                    </p>
                  )}
                  <button
                    onClick={() => {
                      const newTimeSeries = [...(formula.inputTimeSeries || []), ''];
                      setFormula({ ...formula, inputTimeSeries: newTimeSeries });
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  >
                    <Plus size={16} />
                    Zeitreihe/Variable hinzufügen
                  </button>
                </div>
              </div>

              {/* Function Parameters */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funktions-Parameter
                  <span className="ml-2 text-xs text-gray-500">(Konstanten, Variablen, Ausdrücke)</span>
                </label>
                <div className="space-y-3">
                  {formula.expression?.parameters && formula.expression.parameters.length > 0 ? (
                    formula.expression.parameters.map((param, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-3">
                            <select
                              value={param.type}
                              onChange={(e) => {
                                const newParams = [...(formula.expression?.parameters || [])];
                                newParams[idx] = { ...param, type: e.target.value as any };
                                setFormula({
                                  ...formula,
                                  expression: { ...formula.expression!, parameters: newParams }
                                });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="constant">Konstante</option>
                              <option value="timeseries_ref">Variable/Zeitreihe</option>
                              <option value="string">Text</option>
                              <option value="expression">Ausdruck</option>
                            </select>
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={param.name || ''}
                              onChange={(e) => {
                                const newParams = [...(formula.expression?.parameters || [])];
                                newParams[idx] = { ...param, name: e.target.value };
                                setFormula({
                                  ...formula,
                                  expression: { ...formula.expression!, parameters: newParams }
                                });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Name (optional)"
                            />
                          </div>
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={typeof param.value === 'object' ? JSON.stringify(param.value) : param.value}
                              onChange={(e) => {
                                const newParams = [...(formula.expression?.parameters || [])];
                                let value: any = e.target.value;

                                // Try to parse as number for constants
                                if (param.type === 'constant' && !isNaN(Number(value))) {
                                  value = Number(value);
                                }

                                newParams[idx] = { ...param, value };
                                setFormula({
                                  ...formula,
                                  expression: { ...formula.expression!, parameters: newParams }
                                });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder={
                                param.type === 'constant' ? 'z.B. 3, 0.5, 100' :
                                param.type === 'timeseries_ref' ? 'z.B. x, lineA' :
                                param.type === 'string' ? 'z.B. >, <, ==' :
                                'Ausdruck oder JSON'
                              }
                            />
                          </div>
                          <div className="col-span-1">
                            <button
                              onClick={() => {
                                const newParams = formula.expression?.parameters.filter((_, i) => i !== idx);
                                setFormula({
                                  ...formula,
                                  expression: { ...formula.expression!, parameters: newParams || [] }
                                });
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Keine Parameter definiert - fügen Sie Parameter für Ihre Formel hinzu
                    </p>
                  )}
                  <button
                    onClick={() => {
                      const newParams = [
                        ...(formula.expression?.parameters || []),
                        { type: 'constant' as const, value: 0 }
                      ];
                      setFormula({
                        ...formula,
                        expression: { ...formula.expression!, parameters: newParams }
                      });
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  >
                    <Plus size={16} />
                    Parameter hinzufügen
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Formula Preview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Formel-Vorschau</h3>
            {selectedTemplate && (
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-2">Mathematische Darstellung:</p>
                <code className="text-sm font-mono">{selectedTemplate.preview}</code>
              </div>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                JSON-Definition anzeigen
              </summary>
              <pre className="mt-2 p-4 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(formula, null, 2)}
              </pre>
            </details>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setFormula(null);
                setSelectedTemplate(null);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formula.name}
              className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <span>Speichert...</span>
                </>
              ) : saved ? (
                <>
                  <Check size={18} />
                  <span>Gespeichert!</span>
                </>
              ) : (
                <span>Formel speichern</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: FormulaTemplate;
  onSelect: () => void;
}) {
  const categoryColors: Record<string, string> = {
    BILANZIERUNG: 'bg-blue-100 text-blue-800',
    NETZNUTZUNG: 'bg-green-100 text-green-800',
    EIGENVERBRAUCH: 'bg-purple-100 text-purple-800',
    VERLUSTE: 'bg-orange-100 text-orange-800',
    AGGREGATION: 'bg-pink-100 text-pink-800',
    MATHEMATISCH: 'bg-indigo-100 text-indigo-800',
    TRANSFORMATION: 'bg-teal-100 text-teal-800',
    SONSTIGES: 'bg-gray-100 text-gray-800',
  };

  return (
    <button
      onClick={onSelect}
      className="text-left bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{template.name}</h3>
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            categoryColors[template.category]
          }`}
        >
          {template.category}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1">{template.description}</p>
      <p className="text-xs text-gray-500 italic mb-3">{template.descriptionEn}</p>
      <div className="text-xs text-gray-500">
        <code className="bg-gray-100 px-2 py-1 rounded">{template.preview}</code>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        {template.requiredMeteringPoints} Messpunkte erforderlich
      </div>
    </button>
  );
}
