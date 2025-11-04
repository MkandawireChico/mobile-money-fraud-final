// Lightweight API helper for triggering server-side transaction simulation
// Uses REACT_APP_API_URL and a JWT token from localStorage by default.
export type SimulateOptions = {
  count?: number;
  highRiskProbability?: number;
  userId?: string;
};

import api from './axios';

export async function simulateTransactions(options: SimulateOptions = { count: 1 }) {
  // Use the shared axios instance so baseURL and auth headers are applied consistently.
  // Some dev setups put the '/api' prefix in the baseURL and others expect paths to start with '/api'.
  // Detect if the axios baseURL already contains '/api' to avoid double '/api/api' in requests.
  const base = (api.defaults && (api.defaults.baseURL as string)) || process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || '';
  const normalizedBase = (base || '').toString();
  const usesApiPrefix = normalizedBase.endsWith('/api') || normalizedBase.endsWith('/api/');

  const path = usesApiPrefix ? '/transactions/simulate' : '/api/transactions/simulate';
  const body: any = { ...options };
  const res = await api.post(path, body);
  return res.data as { transactions: any[]; anomalies: any[] };
}

export default simulateTransactions;
