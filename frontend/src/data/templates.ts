import type { FormulaTemplate } from '../types/formula';

export const formulaTemplates: FormulaTemplate[] = [
  {
    id: 'bess-charge-without-consumption',
    name: 'BESS Batterieladung ohne Eigenverbrauch',
    description: 'Berechnet die Batterieladung ohne Eigenverbrauch für ein Battery Energy Storage System',
    descriptionEn: 'Calculates battery charging without self-consumption for a Battery Energy Storage System',
    category: 'BILANZIERUNG',
    requiredMeteringPoints: 3,
    preview: 'wenn(W+Z1 – (W+ZEV1 + W+ZE_UW) > 0; W+Z1 – (W+ZEV1 + W+ZE_UW); 0)',
    formula: {
      name: 'W+Batt1 oEV',
      description: 'Batterieladung ohne Eigenverbrauch',
      outputUnit: 'KWH',
      outputResolution: 'PT15M',
      category: 'BILANZIERUNG',
      inputTimeSeries: ['lineA', 'lineB', 'lineC'],
      expression: {
        function: 'Wenn_Dann',
        parameters: [
          {
            type: 'expression',
            value: {
              function: 'Grp_Sum',
              parameters: [
                { type: 'timeseries_ref', value: 'lineA', scalingFactor: 1.0 },
                { type: 'timeseries_ref', value: 'lineB', scalingFactor: -1.0 },
                { type: 'timeseries_ref', value: 'lineC', scalingFactor: -1.0 },
              ],
            },
          },
          { type: 'string', value: '>' },
          { type: 'constant', value: 0 },
          {
            type: 'expression',
            value: {
              function: 'Grp_Sum',
              parameters: [
                { type: 'timeseries_ref', value: 'lineA', scalingFactor: 1.0 },
                { type: 'timeseries_ref', value: 'lineB', scalingFactor: -1.0 },
                { type: 'timeseries_ref', value: 'lineC', scalingFactor: -1.0 },
              ],
            },
          },
          { type: 'constant', value: 0 },
        ],
      },
    },
  },
  {
    id: 'pv-production-with-loss',
    name: 'PV-Erzeugung mit Verlustfaktor',
    description: 'Berechnet PV-Erzeugung mit konfigurierbarem Verlustfaktor',
    descriptionEn: 'Calculates PV production with configurable loss factor',
    category: 'VERLUSTE',
    requiredMeteringPoints: 1,
    preview: 'W-Erzeuger × (1 - Verlustfaktor)',
    formula: {
      name: 'PV Erzeugung mit Verlust',
      description: 'PV-Erzeugung nach Verlusten',
      outputUnit: 'KWH',
      outputResolution: 'PT15M',
      category: 'VERLUSTE',
      lossFactor: 0.02,
      inputTimeSeries: ['production'],
      expression: {
        function: 'Grp_Sum',
        parameters: [
          { type: 'timeseries_ref', value: 'production', scalingFactor: 0.98 }, // 1 - 0.02 loss
        ],
      },
    },
  },
  {
    id: 'self-consumption-aggregation',
    name: 'Eigenverbrauch Aggregation',
    description: 'Summiert Eigenverbrauch mehrerer Messpunkte',
    descriptionEn: 'Aggregates self-consumption across multiple metering points',
    category: 'EIGENVERBRAUCH',
    requiredMeteringPoints: 2,
    preview: 'W+ZEV1 + W+ZEV2 + ... + W+ZEVn',
    formula: {
      name: 'Gesamter Eigenverbrauch',
      description: 'Summe aller Eigenverbrauchsmesspunkte',
      outputUnit: 'KWH',
      outputResolution: 'PT15M',
      category: 'EIGENVERBRAUCH',
      inputTimeSeries: ['ev1', 'ev2'],
      expression: {
        function: 'Grp_Sum',
        parameters: [
          { type: 'timeseries_ref', value: 'ev1', scalingFactor: 1.0 },
          { type: 'timeseries_ref', value: 'ev2', scalingFactor: 1.0 },
        ],
      },
    },
  },
  {
    id: 'excess-above-threshold',
    name: 'Anteil über Schwellenwert',
    description: 'Berechnet den Anteil der Energie, der einen Schwellenwert überschreitet',
    descriptionEn: 'Calculates the portion of energy exceeding a threshold value',
    category: 'NETZNUTZUNG',
    requiredMeteringPoints: 1,
    preview: 'Anteil_Groesser_Als(W+, Schwellenwert)',
    formula: {
      name: 'Anteil über Schwellenwert',
      description: 'Energie über konfigurierbarem Schwellenwert',
      outputUnit: 'KWH',
      outputResolution: 'PT15M',
      category: 'NETZNUTZUNG',
      inputTimeSeries: ['consumption'],
      expression: {
        function: 'Anteil_Groesser_Als',
        parameters: [
          { type: 'timeseries_ref', value: 'consumption' },
          { type: 'constant', value: 1000 }, // 1000 kWh threshold
        ],
      },
    },
  },
  {
    id: 'max-across-series',
    name: 'Maximum über mehrere Zeitreihen',
    description: 'Findet das Maximum über mehrere Zeitreihen pro Intervall',
    descriptionEn: 'Finds the maximum value across multiple time series per interval',
    category: 'AGGREGATION',
    requiredMeteringPoints: 2,
    preview: 'Quer_Max(Zeitreihe1, Zeitreihe2, ..., Zeitreihen)',
    formula: {
      name: 'Maximaler Wert',
      description: 'Maximum über mehrere Messreihen',
      outputUnit: 'KWH',
      outputResolution: 'PT15M',
      category: 'AGGREGATION',
      inputTimeSeries: ['series1', 'series2'],
      expression: {
        function: 'Quer_Max',
        parameters: [
          { type: 'timeseries_ref', value: 'series1' },
          { type: 'timeseries_ref', value: 'series2' },
        ],
      },
    },
  },
];

export const functionDescriptions: Record<string, { description: string; icon: string }> = {
  Wenn_Dann: {
    description: 'If-Then-Else Logik: wenn(Bedingung; Dann-Wert; Sonst-Wert)',
    icon: '⚖️',
  },
  Grp_Sum: {
    description: 'Summe mehrerer Zeitreihen mit optionalen Skalierungsfaktoren',
    icon: '➕',
  },
  Anteil_Groesser_Als: {
    description: 'Anteil der Energie oberhalb eines Schwellenwerts',
    icon: '📈',
  },
  Anteil_Kleiner_Als: {
    description: 'Anteil der Energie unterhalb eines Schwellenwerts',
    icon: '📉',
  },
  Quer_Max: {
    description: 'Maximum über mehrere Zeitreihen pro Intervall',
    icon: '⬆️',
  },
  Quer_Min: {
    description: 'Minimum über mehrere Zeitreihen pro Intervall',
    icon: '⬇️',
  },
  Groesser_Als: {
    description: 'Vergleich: größer als Schwellenwert',
    icon: '>',
  },
  Round: {
    description: 'Rundung auf n Dezimalstellen',
    icon: '🔢',
  },
  Conv_RKMG: {
    description: 'Konvertierung RLM/KLM',
    icon: '🔄',
  },
  IMax: {
    description: 'Maximum innerhalb einer Zeitreihe',
    icon: '↑',
  },
  IMin: {
    description: 'Minimum innerhalb einer Zeitreihe',
    icon: '↓',
  },
};
