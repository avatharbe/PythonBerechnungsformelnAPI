import { useEffect, useState } from 'react';
import { Trash2, Eye } from 'lucide-react';
import { formulaApi } from '../services/api';
import type { Formula } from '../types/formula';

export default function FormulaList() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);

  useEffect(() => {
    loadFormulas();
  }, []);

  const loadFormulas = async () => {
    try {
      const data = await formulaApi.list();
      setFormulas(data.formulas || []);
    } catch (error) {
      console.error('Failed to load formulas:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFormula = async (formulaId: string) => {
    if (!confirm('Formel wirklich löschen?')) return;

    try {
      await formulaApi.delete(formulaId);
      setFormulas(formulas.filter((f) => f.formulaId !== formulaId));
    } catch (error) {
      console.error('Failed to delete formula:', error);
      alert('Fehler beim Löschen der Formel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade Formeln...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formeln</h1>
          <p className="mt-2 text-gray-600">{formulas.length} gespeicherte Formeln</p>
        </div>
        <a
          href="/builder"
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
        >
          + Neue Formel
        </a>
      </div>

      {formulas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Keine Formeln vorhanden</p>
          <a
            href="/builder"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700"
          >
            Erste Formel erstellen →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {formulas.map((formula) => (
            <FormulaCard
              key={formula.formulaId}
              formula={formula}
              onView={() => setSelectedFormula(formula)}
              onDelete={() => deleteFormula(formula.formulaId)}
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

function FormulaCard({
  formula,
  onView,
  onDelete,
}: {
  formula: Formula;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{formula.name}</h3>
            {formula.category && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {formula.category}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{formula.description}</p>
          <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
            <span>ID: {formula.formulaId}</span>
            <span>Funktion: {formula.expression.function}</span>
            <span>Eingänge: {formula.inputTimeSeries.length}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onView}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors"
            title="Ansehen"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Löschen"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
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
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{formula.name}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Beschreibung</h3>
            <p className="mt-1 text-gray-600">{formula.description}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700">JSON-Definition</h3>
            <pre className="mt-1 p-4 bg-gray-50 rounded text-xs overflow-auto">
              {JSON.stringify(formula, null, 2)}
            </pre>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
