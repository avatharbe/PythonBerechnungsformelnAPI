import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { formulaApi } from '../services/api';
import { formulaTemplates } from '../data/templates';
import type { Formula, FormulaTemplate } from '../types/formula';

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
        <h1 className="text-3xl font-bold text-gray-900">Formel erstellen</h1>
        <p className="mt-2 text-gray-600">Wählen Sie ein Template oder erstellen Sie eine neue Formel</p>
      </div>

      {!formula ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Template auswählen</h2>
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
  const categoryColors = {
    BILANZIERUNG: 'bg-blue-100 text-blue-800',
    NETZNUTZUNG: 'bg-green-100 text-green-800',
    EIGENVERBRAUCH: 'bg-purple-100 text-purple-800',
    VERLUSTE: 'bg-orange-100 text-orange-800',
    AGGREGATION: 'bg-pink-100 text-pink-800',
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
      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
      <div className="text-xs text-gray-500">
        <code className="bg-gray-100 px-2 py-1 rounded">{template.preview}</code>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        {template.requiredMeteringPoints} Messpunkte erforderlich
      </div>
    </button>
  );
}
