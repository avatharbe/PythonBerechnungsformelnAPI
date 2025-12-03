/// <reference types="vite/client" />
import axios from 'axios';
import type {
  Formula,
  FormulaSubmission,
  TimeSeries,
  CalculationRequest,
  CalculationResult,
} from '../types/formula';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// OAuth Token Management
let accessToken: string | null = null;

export const authenticate = async (): Promise<string> => {
  const response = await api.post('/oauth/token', new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: 'demo-client',
    client_secret: 'demo-secret',
    scope: 'timeseries.read timeseries.write formulas.read formulas.write calculations.execute',
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const token = response.data.access_token as string;
  accessToken = token;

  // Set default authorization header
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  return token;
};

// Request interceptor to ensure we have a token
api.interceptors.request.use(
  async (config) => {
    if (!accessToken && config.url !== '/oauth/token') {
      await authenticate();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh and retry
      await authenticate();
      error.config.headers['Authorization'] = `Bearer ${accessToken}`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

// Formula APIs
export const formulaApi = {
  submit: async (submission: FormulaSubmission) => {
    const response = await api.post('/v1/formulas', submission);
    return response.data;
  },

  list: async () => {
    const response = await api.get<{ formulas: Formula[]; totalCount: number }>('/v1/formulas');
    return response.data;
  },

  get: async (formulaId: string) => {
    const response = await api.get<Formula>(`/v1/formulas/${formulaId}`);
    return response.data;
  },

  delete: async (formulaId: string) => {
    await api.delete(`/v1/formulas/${formulaId}`);
  },
};

// Time Series APIs
export const timeSeriesApi = {
  submit: async (timeSeries: { messageId: string; timeSeries: TimeSeries[] }) => {
    const response = await api.post('/v1/time-series', timeSeries);
    return response.data;
  },

  list: async (params?: { marketLocationId?: string }) => {
    const response = await api.get<{ timeSeries: TimeSeries[] }>('/v1/time-series', { params });
    return response.data;
  },

  get: async (timeSeriesId: string) => {
    const response = await api.get<TimeSeries>(`/v1/time-series/${timeSeriesId}`);
    return response.data;
  },
};

// Calculation APIs
export const calculationApi = {
  execute: async (request: CalculationRequest) => {
    const response = await api.post<CalculationResult>('/v1/calculations', request);
    return response.data;
  },

  get: async (calculationId: string) => {
    const response = await api.get<CalculationResult>(`/v1/calculations/${calculationId}`);
    return response.data;
  },
};

// Health Check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
