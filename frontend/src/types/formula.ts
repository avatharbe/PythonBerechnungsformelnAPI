export type FormulaFunction =
  | 'Wenn_Dann'
  | 'Grp_Sum'
  | 'Anteil_Groesser_Als'
  | 'Anteil_Kleiner_Als'
  | 'Quer_Max'
  | 'Quer_Min'
  | 'Groesser_Als'
  | 'Round'
  | 'Conv_RKMG'
  | 'IMax'
  | 'IMin';

export type ParameterType = 'constant' | 'timeseries_ref' | 'expression' | 'string';

export type FormulaCategory =
  | 'BILANZIERUNG'
  | 'NETZNUTZUNG'
  | 'EIGENVERBRAUCH'
  | 'VERLUSTE'
  | 'AGGREGATION';

export interface FormulaParameter {
  name?: string;
  type: ParameterType;
  value: string | number | FormulaExpression;
  scalingFactor?: number;
  obisCode?: string;
}

export interface FormulaExpression {
  function: FormulaFunction;
  parameters: FormulaParameter[];
}

export interface MeteringPoint {
  meteringPointId: string;
  obisCode: string;
  direction: 'CONSUMPTION' | 'PRODUCTION';
  description: string;
}

export interface Formula {
  formulaId: string;
  name: string;
  description: string;
  expression: FormulaExpression;
  inputMeteringPoints?: MeteringPoint[];
  inputTimeSeries: string[];
  outputUnit: string;
  outputResolution: string;
  outputObisCode?: string;
  category?: FormulaCategory;
  version?: string;
  lossFactor?: number;
  metadata?: Record<string, unknown>;
}

export interface FormulaSubmission {
  messageId: string;
  messageDate: string;
  sender: {
    id: string;
    role: string;
    name: string;
  };
  formulas: Formula[];
}

export interface FormulaTemplate {
  id: string;
  name: string;
  description: string;
  category: FormulaCategory;
  formula: Partial<Formula>;
  requiredMeteringPoints: number;
  preview: string; // Mathematical representation
}

export interface TimeSeries {
  timeSeriesId: string;
  marketLocationId: string;
  measurementType: string;
  unit: string;
  resolution: string;
  period: {
    start: string;
    end: string;
  };
  intervals: Interval[];
  metadata?: Record<string, unknown>;
}

export interface Interval {
  position: number;
  start: string;
  end: string;
  quantity: string;
  quality: string;
}

export interface CalculationRequest {
  calculationId: string;
  formulaId: string;
  inputTimeSeries: Record<string, string>;
  period: {
    start: string;
    end: string;
  };
  outputTimeSeriesId?: string;
}

export interface CalculationResult {
  calculationId: string;
  formulaId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  outputTimeSeriesId?: string;
  completedAt?: string;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}
