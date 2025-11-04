import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useHistory } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

const SimulationResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation<any>();
  const history = useHistory();

  const [transaction, setTransaction] = useState<any>(location.state?.transaction || null);
  const [anomalies, setAnomalies] = useState<any[]>(location.state?.anomalies || []);
  const [detectionDetails, setDetectionDetails] = useState<any>(location.state?.detectionDetails || null);
  const [fetchingDetection, setFetchingDetection] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!transaction);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) return;
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/transactions/${id}`);
        if (!mounted) return;
        setTransaction(res.data);
        // Try to fetch anomalies for this transaction if available
        try {
          const a = await api.get(`/anomalies?transaction_id=${id}`);
          if (!mounted) return;
          setAnomalies(a.data?.anomalies || []);
        } catch (e) {
          // ignore
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Failed to load simulated transaction');
      } finally {
        setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [id, transaction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center">
          <Loader2 className="animate-spin text-blue-500 mb-3" />
          <div className="text-gray-700 dark:text-gray-200">Loading simulated transaction...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6">
        <div className="bg-gray-50 text-gray-800 p-4 rounded">Simulated transaction not found.</div>
      </div>
    );
  }

  const risk = typeof transaction.risk_score === 'string' ? parseFloat(transaction.risk_score) : (transaction.risk_score || 0);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-2xl p-6 border border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => history.push('/transactions')}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm text-gray-200"
              aria-label="Back to Transactions"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Simulated Transaction</h1>
              <div className="text-sm text-gray-400 mt-1 truncate">{transaction.transaction_id}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">Amount</div>
            <div className="text-3xl font-black text-white">{transaction.currency || ''}{Number(transaction.amount).toLocaleString(undefined, {maximumFractionDigits:2})}</div>
            <div className="mt-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-white ${risk >= 0.98 ? 'bg-red-600' : risk >= 0.8 ? 'bg-red-500' : risk >= 0.5 ? 'bg-yellow-500 text-black' : 'bg-green-500'}`}>
                <span className="font-semibold mr-2">{risk >= 0.98 ? 'Critical' : risk >= 0.8 ? 'High' : risk >= 0.5 ? 'Medium' : 'Low'}</span>
                <span className="text-xs opacity-90">{risk ? risk.toFixed(2) : ''}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-gray-200">
            <div>
              <div className="text-xs text-gray-400">User</div>
              <div className="text-sm font-medium truncate" title={transaction.user_id}>{transaction.user_id ? `${String(transaction.user_id).slice(0,8)}...${String(transaction.user_id).slice(-6)}` : 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Type</div>
              <div className="text-sm font-medium">{transaction.transaction_type || 'p2p_transfer'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Device</div>
              <div className="text-sm font-medium">{transaction.device_type || 'desktop'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Location</div>
              <div className="text-sm font-medium">{transaction.location_city ? `${transaction.location_city}${transaction.location_country ? `, ${transaction.location_country}` : ''}` : (transaction.location_country || 'Unknown')}</div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Detection</div>
            <div className="text-sm text-gray-300">
              {anomalies && anomalies.length > 0 ? (
                (() => {
                  const t = anomalies[0].triggered_by || anomalies[0].triggeredBy || {};
                  return (
                    <div>
                      <div className="font-medium text-gray-100">{t.type || 'ML Model'}</div>
                      <div className="text-sm text-gray-400">Algorithm: <span className="font-medium text-gray-200">{t.algorithm || t.name || 'Unknown'}</span> {t.version ? <span className="ml-2 text-xs text-gray-400">v{t.version}</span> : null}</div>
                      {t.description ? <div className="text-xs text-gray-400 mt-1">{t.description}</div> : null}
                    </div>
                  );
                })()
              ) : (
                <div>
                  <div className="font-medium text-gray-100">{location.state?.detectionSource || 'ML/Rules'}</div>
                  <div className="mt-2 text-sm text-gray-400">{detectionDetails ? (
                    <div>Model: <span className="font-medium text-gray-200">{detectionDetails.model_version || detectionDetails.model || 'unknown'}</span> — Probability: <span className="font-medium">{(detectionDetails.fraud_probability || detectionDetails.probability || 0).toFixed ? (detectionDetails.fraud_probability || detectionDetails.probability).toFixed(2) : detectionDetails.fraud_probability || detectionDetails.probability}</span></div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-400">No explicit anomaly was created.</div>
                      <button onClick={async () => {
                        if (!id) return;
                        try {
                          setFetchingDetection(true);
                          const resp = await api.post(`/transactions/predict/${id}`);
                          // resp.data.prediction has model_version, fraud_probability, reason
                          setDetectionDetails(resp.data.prediction || resp.data || { model_version: resp.data?.model_version });
                        } catch (e:any) {
                          console.error('Failed to fetch detection details', e.message || e);
                          setDetectionDetails({ error: e?.response?.data?.message || e.message || String(e) });
                        } finally {
                          setFetchingDetection(false);
                        }
                      }} className="px-2 py-1 text-xs bg-gray-800 rounded text-gray-200 border border-gray-700 hover:bg-gray-700">{fetchingDetection ? 'Checking...' : 'Show detection details'}</button>
                    </div>
                  )}</div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-gray-200 font-semibold mb-2">Anomalies</div>
            {anomalies.length === 0 ? (
              <div className="text-sm italic text-gray-400">No explicit anomalies created. System used ML/rules to score the transaction.</div>
            ) : (
              <ul className="space-y-2">
                {anomalies.map(a => (
                  <li key={a.id} className="p-3 bg-gray-800 rounded">{a.summary || a.rule_name || JSON.stringify(a)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={() => history.push(`/case-review/${transaction.transaction_id}`)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow">Investigate</button>
          <button onClick={() => history.push(`/transactions/${transaction.transaction_id}`)} className="px-4 py-2 border border-gray-700 text-gray-200 rounded hover:bg-gray-800">Open Transaction</button>
        </div>
      </div>
    </div>
  );
};

export default SimulationResultPage;
