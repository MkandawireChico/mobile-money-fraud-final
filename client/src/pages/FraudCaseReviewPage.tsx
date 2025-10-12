import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
    ArrowLeft,
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    User,
    MapPin,
    Smartphone,
    TrendingUp,
    FileText,
    Save,
    Eye,
    Ban,
    AlertCircle,
    Activity
} from 'lucide-react';
import api from '../api/axios.ts';
import { Transaction } from '../types/index';
import { format } from 'date-fns';

interface CaseReviewData {
    transaction: Transaction;
    riskFactors: RiskFactor[];
    evidence: Evidence[];
    timeline: TimelineEvent[];
    notes: string;
}

interface RiskFactor {
    id: string;
    title: string;
    description: string;
    level: 'high' | 'medium' | 'low';
    score: number;
}

interface Evidence {
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
}

interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    user: string;
    type: 'system' | 'analyst' | 'ml';
}

const FraudCaseReviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    
    const [caseData, setCaseData] = useState<CaseReviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [decision, setDecision] = useState<string | null>(null);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

    const fetchCaseData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch transaction details
            const transactionResponse = await api.get<Transaction>(`/transactions/${id}`);
            const transaction = transactionResponse.data;

            // Parse numerical fields
            transaction.amount = parseFloat(transaction.amount as any);
            transaction.risk_score = parseFloat(transaction.risk_score as any);
            transaction.is_fraud = String(transaction.is_fraud).toLowerCase() === 'true' || Number(transaction.is_fraud) === 1;

            // Generate risk factors based on transaction data
            const riskFactors = generateRiskFactors(transaction);
            
            // Generate evidence based on transaction data
            const evidence = generateEvidence(transaction);
            
            // Fetch case timeline (audit logs for this transaction)
            const timelineResponse = await api.get(`/case-review/${id}/timeline`);
            const timeline = timelineResponse.data.data.map((log: any) => ({
                id: log.id,
                title: log.title || 'System Action',
                description: log.description || 'No additional details',
                timestamp: log.timestamp,
                user: log.user || 'System',
                type: log.type || 'system'
            }));

            setCaseData({
                transaction,
                riskFactors,
                evidence,
                timeline,
                notes: ''
            });
            setNotes('');

        } catch (err: any) {
            console.error('Error fetching case data:', err);
            setError(err.response?.data?.message || 'Failed to fetch case data');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCaseData();
    }, [fetchCaseData]);

    const generateRiskFactors = (transaction: Transaction): RiskFactor[] => {
        const factors: RiskFactor[] = [];
        
        // High amount risk
        if (transaction.amount > 100000) {
            factors.push({
                id: 'high-amount',
                title: 'Unusually High Amount',
                description: `Amount of ${transaction.amount.toLocaleString()} MWK is significantly above average`,
                level: 'high',
                score: Math.min(95, 60 + (transaction.amount / 10000))
            });
        }

        // New location risk
        if (transaction.is_new_location) {
            factors.push({
                id: 'new-location',
                title: 'New Location Detected',
                description: 'First transaction from this location',
                level: 'medium',
                score: 72
            });
        }

        // New device risk
        if (transaction.is_new_device) {
            factors.push({
                id: 'new-device',
                title: 'New Device',
                description: 'Transaction from previously unseen device',
                level: 'medium',
                score: 68
            });
        }

        // Time pattern risk
        const hour = transaction.transaction_hour_of_day;
        if (hour !== null && (hour < 6 || hour > 22)) {
            factors.push({
                id: 'unusual-time',
                title: 'Unusual Time Pattern',
                description: 'Transaction outside normal business hours',
                level: 'medium',
                score: 65
            });
        }

        // Device verification (positive factor)
        if (!transaction.is_new_device) {
            factors.push({
                id: 'known-device',
                title: 'Known Device',
                description: 'Transaction from recognized device',
                level: 'low',
                score: 25
            });
        }

        return factors;
    };

    const generateEvidence = (transaction: Transaction): Evidence[] => {
        return [
            {
                id: 'ml-prediction',
                type: 'ml',
                title: 'ML Model Prediction',
                description: `Advanced fraud detection model flagged this transaction with ${(transaction.risk_score * 100).toFixed(1)}% confidence`,
                icon: 'TrendingUp'
            },
            {
                id: 'transaction-history',
                title: 'Transaction History',
                description: `User has completed ${transaction.user_total_transactions || 0} previous transactions`,
                icon: 'Activity',
                type: 'history'
            },
            {
                id: 'behavioral-analysis',
                title: 'Behavioral Analysis',
                description: `Transaction occurred at ${transaction.transaction_hour_of_day}:00, ${transaction.is_new_location ? 'outside' : 'within'} user's typical activity pattern`,
                icon: 'Clock',
                type: 'behavior'
            },
            {
                id: 'device-analysis',
                title: 'Device Analysis',
                description: `${transaction.device_type || 'Unknown'} device from ${transaction.location_city || 'Unknown location'}`,
                icon: 'Smartphone',
                type: 'device'
            }
        ];
    };

    const handleDecision = async (decisionType: 'confirm_fraud' | 'mark_legitimate' | 'needs_review') => {
        if (!caseData) return;
        
        setDecision(decisionType);
        try {
            await api.post(`/case-review/${id}/decision`, {
                decision: decisionType,
                notes: notes,
                analyst_id: 'current_user' // This should come from auth context
            });

            // Refresh case data to show updated timeline
            await fetchCaseData();
            
            setNotification({type: 'success', message: `Case ${decisionType.replace('_', ' ')} successfully processed!`});
            setTimeout(() => setNotification(null), 5000);
        } catch (err: any) {
            console.error('Error submitting decision:', err);
            setNotification({type: 'error', message: 'Failed to submit decision. Please try again.'});
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setDecision(null);
        }
    };

    const handleSaveNotes = async () => {
        if (!caseData) return;
        
        setSaving(true);
        try {
            await api.post(`/case-review/${id}/notes`, {
                notes: notes
            });
            setNotification({type: 'success', message: 'Investigation notes saved successfully!'});
            setTimeout(() => setNotification(null), 5000);
        } catch (err: any) {
            console.error('Error saving notes:', err);
            setNotification({type: 'error', message: 'Failed to save notes. Please try again.'});
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setSaving(false);
        }
    };

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case 'high': return 'border-red-300 bg-gradient-to-r from-red-50 to-red-100 text-red-900 shadow-lg';
            case 'medium': return 'border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 shadow-lg';
            case 'low': return 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-900 shadow-lg';
            default: return 'border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-900 shadow-lg';
        }
    };

    const getRiskScoreColor = (level: string) => {
        switch (level) {
            case 'high': return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl';
            case 'medium': return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl';
            case 'low': return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl';
            default: return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-xl';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !caseData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-600 text-xl">{error || 'Case not found'}</div>
            </div>
        );
    }

    const { transaction, riskFactors, evidence, timeline } = caseData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl transform transition-all duration-300 ${
                    notification.type === 'success' 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                }`}>
                    <div className="flex items-center space-x-3">
                        {notification.type === 'success' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <AlertCircle size={20} />
                        )}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-8 shadow-2xl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => history.push('/transactions')}
                                className="p-3 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold">Fraud Case Review</h1>
                                <p className="text-red-100">Case ID: FC-{transaction.transaction_id}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <div className="text-sm text-red-100">Risk Score</div>
                                <div className="text-2xl font-bold">{(transaction.risk_score * 100).toFixed(0)}/100</div>
                            </div>
                            <div className="bg-red-700 px-4 py-2 rounded-full">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-8">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Left Column - Case Details */}
                    <div className="xl:col-span-3 space-y-8">
                        {/* Transaction Details Card */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mr-4">
                                    <Shield className="text-white" size={24} />
                                </div>
                                Transaction Analysis
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
                                    <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Transaction ID</label>
                                    <p className="text-lg font-mono text-slate-900 mt-1">{transaction.transaction_id}</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                                    <label className="text-sm font-semibold text-red-600 uppercase tracking-wide">Amount</label>
                                    <p className="text-xl font-bold text-red-800 mt-1">MWK {transaction.amount.toLocaleString()}</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                    <label className="text-sm font-semibold text-blue-600 uppercase tracking-wide">From Account</label>
                                    <p className="text-lg font-mono text-blue-900 mt-1">{transaction.sender_account}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                                    <label className="text-sm font-semibold text-purple-600 uppercase tracking-wide">To Account</label>
                                    <p className="text-lg font-mono text-purple-900 mt-1">{transaction.receiver_account}</p>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                                    <label className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Type</label>
                                    <p className="text-lg font-medium text-emerald-900 mt-1 capitalize">{transaction.transaction_type?.replace('_', ' ')}</p>
                                </div>
                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                                    <label className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Location</label>
                                    <p className="text-lg font-medium text-amber-900 mt-1">{transaction.location_city}, {transaction.location_country}</p>
                                </div>
                                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
                                    <label className="text-sm font-semibold text-teal-600 uppercase tracking-wide">Device</label>
                                    <p className="text-lg font-medium text-teal-900 mt-1">{transaction.device_type}</p>
                                </div>
                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                                    <label className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Timestamp</label>
                                    <p className="text-lg font-medium text-indigo-900 mt-1">{format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Risk Analysis */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-4">
                                    <AlertTriangle className="text-white" size={24} />
                                </div>
                                Risk Factor Analysis
                            </h2>
                            <div className="space-y-4">
                                {riskFactors.map((factor) => (
                                    <div key={factor.id} className={`p-6 rounded-xl border-l-4 ${getRiskLevelColor(factor.level)}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg">{factor.title}</h3>
                                                <p className="text-sm mt-2 font-medium">{factor.description}</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl text-sm font-bold ${getRiskScoreColor(factor.level)}`}>
                                                {factor.score}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Supporting Evidence */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl mr-4">
                                    <FileText className="text-white" size={24} />
                                </div>
                                Supporting Evidence
                            </h2>
                            <div className="space-y-4">
                                {evidence.map((item, index) => (
                                    <div key={item.id} className={`flex items-start space-x-6 p-6 rounded-xl border ${
                                        index % 4 === 0 ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' :
                                        index % 4 === 1 ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200' :
                                        index % 4 === 2 ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200' :
                                        'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200'
                                    }`}>
                                        <div className={`p-3 rounded-xl shadow-lg ${
                                            index % 4 === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                            index % 4 === 1 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                                            index % 4 === 2 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                                            'bg-gradient-to-r from-amber-500 to-amber-600'
                                        } text-white`}>
                                            {item.icon === 'TrendingUp' && <TrendingUp size={24} />}
                                            {item.icon === 'Activity' && <Activity size={24} />}
                                            {item.icon === 'Clock' && <Clock size={24} />}
                                            {item.icon === 'Smartphone' && <Smartphone size={24} />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold text-lg ${
                                                index % 4 === 0 ? 'text-blue-900' :
                                                index % 4 === 1 ? 'text-purple-900' :
                                                index % 4 === 2 ? 'text-emerald-900' :
                                                'text-amber-900'
                                            }`}>{item.title}</h3>
                                            <p className={`text-sm mt-2 font-medium ${
                                                index % 4 === 0 ? 'text-blue-800' :
                                                index % 4 === 1 ? 'text-purple-800' :
                                                index % 4 === 2 ? 'text-emerald-800' :
                                                'text-amber-800'
                                            }`}>{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Enhanced Decision Panel */}
                    <div className="space-y-8">
                        {/* Premium Decision Panel */}
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
                            <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                                <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl mr-4">
                                    <AlertCircle className="text-white" size={24} />
                                </div>
                                Investigation Decision
                            </h3>
                            <div className="space-y-4">
                                <button
                                    onClick={() => handleDecision('confirm_fraud')}
                                    disabled={decision === 'confirm_fraud'}
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Ban className="mr-3" size={20} />
                                    {decision === 'confirm_fraud' ? 'Processing...' : 'CONFIRM FRAUD'}
                                </button>
                                <button
                                    onClick={() => handleDecision('mark_legitimate')}
                                    disabled={decision === 'mark_legitimate'}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <CheckCircle className="mr-3" size={20} />
                                    {decision === 'mark_legitimate' ? 'Processing...' : 'MARK LEGITIMATE'}
                                </button>
                                <button
                                    onClick={() => handleDecision('needs_review')}
                                    disabled={decision === 'needs_review'}
                                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Eye className="mr-3" size={20} />
                                    {decision === 'needs_review' ? 'Processing...' : 'NEEDS REVIEW'}
                                </button>
                            </div>
                        </div>

                        {/* Enhanced Case Timeline */}
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
                            <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-4">
                                    <Clock className="text-white" size={24} />
                                </div>
                                Case Timeline
                            </h3>
                            <div className="space-y-6">
                                {timeline.map((event, index) => (
                                    <div key={event.id} className="flex items-start space-x-6">
                                        <div className={`w-4 h-4 rounded-full mt-3 shadow-lg ${
                                            event.type === 'ml' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                                            event.type === 'analyst' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                                            'bg-gradient-to-r from-slate-500 to-slate-600'
                                        }`}></div>
                                        <div className={`flex-1 p-4 rounded-xl border ${
                                            event.type === 'ml' ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200' :
                                            event.type === 'analyst' ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' :
                                            'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'
                                        }`}>
                                            <h4 className={`font-bold text-lg ${
                                                event.type === 'ml' ? 'text-purple-900' :
                                                event.type === 'analyst' ? 'text-blue-900' :
                                                'text-slate-900'
                                            }`}>{event.title}</h4>
                                            <p className={`text-sm mt-2 font-medium ${
                                                event.type === 'ml' ? 'text-purple-800' :
                                                event.type === 'analyst' ? 'text-blue-800' :
                                                'text-slate-800'
                                            }`}>{event.description}</p>
                                            <p className={`text-xs mt-3 font-semibold ${
                                                event.type === 'ml' ? 'text-purple-700' :
                                                event.type === 'analyst' ? 'text-blue-700' :
                                                'text-slate-700'
                                            }`}>
                                                {event.user} • {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Investigation Notes */}
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
                            <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl mr-4">
                                    <FileText className="text-white" size={24} />
                                </div>
                                Investigation Notes
                            </h3>
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full h-40 p-4 border-2 border-slate-300 rounded-xl resize-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-200 bg-white text-slate-900 placeholder-slate-500 font-medium"
                                    placeholder="Document your investigation findings, observations, and recommendations here..."
                                />
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={saving}
                                    className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Save className="mr-3" size={20} />
                                    {saving ? 'Saving Notes...' : 'Save Investigation Notes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FraudCaseReviewPage;
