import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import simulateTransactions from '../api/simulate';
import { Transaction } from '../types';

type SimulationButtonProps = {
  onSimulated?: (data: { transactions: Transaction[]; anomalies: any[] }) => void;
  showModal?: boolean;
};

function formatCurrency(amount: string | number, currency = 'MWK') {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount as number);
  if (Number.isNaN(num)) return `${currency}0`;
  return `${currency}${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function riskLevelLabel(score?: number | string) {
  // Use less aggressive thresholds for Critical so 0.93 isn't always marked Critical
  const s = score === undefined || score === null ? 0 : (typeof score === 'string' ? parseFloat(score) : score);
  if (s >= 0.98) return { label: 'Critical', color: 'bg-red-600', text: 'Critical' };
  if (s >= 0.8) return { label: 'High', color: 'bg-red-500', text: 'High' };
  if (s >= 0.5) return { label: 'Medium', color: 'bg-yellow-500', text: 'Medium' };
  return { label: 'Low', color: 'bg-green-500', text: 'Low' };
}

export default function SimulationButton({ onSimulated, showModal = true }: SimulationButtonProps) {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [openOptions, setOpenOptions] = useState(false);
  const [count, setCount] = useState<number>(1);
  const [highRiskProbability, setHighRiskProbability] = useState<number>(0.1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runSim = async () => {
    setLoading(true);
    try {
      const data = await simulateTransactions({ count, highRiskProbability });
      setResult(data);
      if (onSimulated) onSimulated(data as any);
      // If we received at least one transaction, navigate to the simulation result page
      const tx = data?.transactions && data.transactions.length > 0 ? data.transactions[0] : null;
      if (tx) {
        // Pass transaction and anomalies via location state so the page can render immediately
        history.push(`/simulation/${tx.transaction_id}`, { transaction: tx, anomalies: data.anomalies || [], detectionSource: tx.detection_source });
      }
    } catch (err: any) {
      console.error('Simulation error', err);
      const message = err?.response?.data?.message || err?.message || String(err) || 'Unknown error';
      setErrorMsg(`Simulation failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss error after 8 seconds
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 8000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  const copyError = async () => {
    if (!errorMsg) return;
    try {
      await navigator.clipboard.writeText(errorMsg);
      setErrorMsg('Error copied to clipboard');
      setTimeout(() => setErrorMsg(null), 2000);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  };

  const tx = result?.transactions && result.transactions.length > 0 ? result.transactions[0] : null;
  const anomalies = result?.anomalies || [];
  const detectionSource = tx?.detection_source || anomalies?.[0]?.detection_source || anomalies?.[0]?.rule_name || (anomalies.length > 0 ? 'Rule Engine' : 'ML/Rules');

  return (
    <div className="inline-block">
      <div className="flex items-center gap-2">
        <button
          onClick={runSim}
          disabled={loading}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60"
        >
          {loading ? 'Simulating...' : 'Run Simulation'}
        </button>

        <button
          onClick={() => setOpenOptions(o => !o)}
          title="Simulation options"
          className="px-3 py-2 rounded-lg bg-gray-700/60 text-white hover:bg-gray-700/80"
        >
          ⚙️
        </button>
      </div>

      {openOptions && (
        <div className="mt-2 p-3 bg-white/5 dark:bg-white/5 rounded-md border border-gray-700/40 w-[260px]">
          <label className="block text-xs text-gray-200 mb-1">Count</label>
          <input type="number" min={1} value={count} onChange={(e) => setCount(Math.max(1, parseInt(e.target.value || '1')))} className="w-full mb-2 p-2 rounded bg-gray-800 text-gray-100" />

          <label className="block text-xs text-gray-200 mb-1">High risk probability (0-1)</label>
          <input type="number" step="0.01" min={0} max={1} value={highRiskProbability} onChange={(e) => setHighRiskProbability(Math.max(0, Math.min(1, parseFloat(e.target.value || '0'))))} className="w-full p-2 rounded bg-gray-800 text-gray-100" />
        </div>
      )}

      {/* Navigation now opens a dedicated simulation result page; inline preview removed */}
      {errorMsg && (
        <div className="mt-3 w-[420px] max-w-full relative">
          <div className="absolute right-0 bg-red-700/95 text-white rounded-lg p-3 shadow-lg border border-red-600">
            <div className="flex items-start gap-3">
              <div className="text-sm font-semibold">Simulation error</div>
              <button onClick={() => setErrorMsg(null)} className="ml-auto text-xs opacity-80 hover:opacity-100">✕</button>
            </div>
            <div className="mt-2 text-xs text-white/90 max-h-28 overflow-auto">{errorMsg}</div>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={() => { setErrorMsg(null); runSim(); }} className="px-3 py-1 bg-white text-red-700 rounded text-xs font-semibold">Retry</button>
              <button onClick={copyError} className="px-3 py-1 bg-white/10 border border-white/20 text-white rounded text-xs">Copy</button>
              <button onClick={() => setErrorMsg(null)} className="px-3 py-1 bg-gray-700 text-white rounded text-xs">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
