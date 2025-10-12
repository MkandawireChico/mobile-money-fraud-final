// client/src/components/rules/RuleForm.tsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axios.ts';
import { Rule } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  Settings, 
  Code, 
  Wand2, 
  Plus, 
  Trash2, 
  DollarSign, 
  Clock, 
  MapPin, 
  Smartphone,
  Users,
  Zap,
  Target,
  BookOpen
} from 'lucide-react';

interface RuleFormProps {
    mode: 'create' | 'edit';
    rule?: Rule;
    onSuccess: () => void;
    onCancel: () => void;
}

interface RuleCondition {
    field: string;
    operator: string;
    value: any;
    weight?: number;
}

interface ExtendedRule extends Rule {
    description?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    action_type?: 'flag' | 'block' | 'alert' | 'score';
    criteria?: any; // For backward compatibility with JSON criteria
}

const RuleForm: React.FC<RuleFormProps> = ({ mode, rule, onSuccess, onCancel }) => {
    const { user: currentUser } = useAuth();
    const [builderMode, setBuilderMode] = useState<'visual' | 'template' | 'json'>('visual');
    const [formData, setFormData] = useState<Partial<ExtendedRule>>({
        rule_name: '',
        description: '',
        rule_type: 'threshold',
        conditions: [{ field: '', operator: '', value: '', weight: 1 }],
        severity: 'medium',
        status: 'draft',
        complement_ml: true,
        action_type: 'flag', // Add the missing action_type field
        criteria: {} // Add criteria field for backward compatibility
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Enterprise Rule Configuration
    const ruleTypes = [
        { value: 'threshold', label: 'Amount Threshold', icon: DollarSign },
        { value: 'velocity', label: 'Transaction Velocity', icon: Zap },
        { value: 'temporal', label: 'Time-based Pattern', icon: Clock },
        { value: 'geographic', label: 'Location Risk', icon: MapPin },
        { value: 'behavioral', label: 'User Behavior', icon: Users }
    ];
    
    const fieldOptions = [
        { value: 'amount', label: 'Transaction Amount', type: 'number', icon: DollarSign },
        { value: 'transaction_hour_of_day', label: 'Hour of Day', type: 'number', icon: Clock },
        { value: 'location_city', label: 'Location City', type: 'select', icon: MapPin },
        { value: 'transaction_type', label: 'Transaction Type', type: 'select', icon: Zap },
        { value: 'user_total_transactions', label: 'User Transaction Count', type: 'number', icon: Users },
        { value: 'velocity_score', label: 'Velocity Score', type: 'number', icon: Target }
    ];
    
    const operatorOptions = {
        number: [
            { value: '>', label: 'Greater than' },
            { value: '<', label: 'Less than' },
            { value: '>=', label: 'Greater than or equal' },
            { value: '<=', label: 'Less than or equal' },
            { value: '==', label: 'Equal to' }
        ],
        select: [
            { value: '==', label: 'Is' },
            { value: '!=', label: 'Is not' },
            { value: 'in', label: 'Is one of' }
        ]
    };
    
    const ruleTemplates = [
        {
            name: 'High Amount Night Transaction',
            description: 'Detect large transactions during night hours',
            rule_type: 'threshold',
            conditions: [
                { field: 'amount', operator: '>', value: 100000, weight: 1 },
                { field: 'transaction_hour_of_day', operator: '>=', value: 22, weight: 0.8 }
            ]
        },
        {
            name: 'Rapid Transaction Velocity',
            description: 'Flag users with unusually high transaction frequency',
            rule_type: 'velocity',
            conditions: [
                { field: 'user_total_transactions', operator: '>', value: 10, weight: 1 },
                { field: 'velocity_score', operator: '>', value: 0.8, weight: 1 }
            ]
        },
        {
            name: 'High-Risk Location Transaction',
            description: 'Monitor transactions from high-risk locations',
            rule_type: 'geographic',
            conditions: [
                { field: 'location_city', operator: 'in', value: ['Border Area', 'Unknown'], weight: 1 },
                { field: 'amount', operator: '>', value: 50000, weight: 0.6 }
            ]
        }
    ];
    
    const severities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['active', 'inactive', 'draft'];

    useEffect(() => {
        console.log(`[RuleForm] useEffect triggered. Mode: ${mode}, Rule provided:`, rule);
        if (mode === 'edit' && rule) {
            setFormData({
                rule_name: rule.rule_name || '',
                description: rule.description || '',
                criteria: rule.criteria ? JSON.stringify(rule.criteria, null, 2) : '{}',
                rule_type: rule.rule_type || 'threshold',
                severity: rule.severity || 'medium',
                status: rule.status || 'draft',
                id: rule.id,
            });
        } else if (mode === 'create') {
            setFormData({
                rule_name: '',
                description: '',
                criteria: '{}',
                rule_type: 'threshold',
                severity: 'medium',
                status: 'draft',
            });
        }
        setError(null);
        setFormErrors({});
    }, [mode, rule]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name as string]: value,
        }));
        if (name && formErrors[name as string]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as string];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (!formData.rule_name?.trim()) {
            errors.rule_name = 'Rule Name is required.';
        } else if (formData.rule_name.trim().length > 255) {
            errors.rule_name = 'Rule Name cannot exceed 255 characters.';
        }

        if (formData.description && formData.description.length > 1000) {
            errors.description = 'Description cannot exceed 1000 characters.';
        }

        if (!formData.rule_type) {
            errors.rule_type = 'Rule Type is required.';
        } else if (!ruleTypes.some(type => type.value === formData.rule_type)) {
            errors.rule_type = 'Invalid Rule Type selected.';
        }

        if (!formData.severity) {
            errors.severity = 'Severity is required.';
        } else if (!severities.includes(formData.severity)) {
            errors.severity = 'Invalid Severity selected.';
        }

        if (!formData.status) {
            errors.status = 'Status is required.';
        } else if (!statuses.includes(formData.status)) {
            errors.status = 'Invalid Status selected.';
        }

        if (!formData.criteria || (typeof formData.criteria === 'string' && formData.criteria.trim() === '')) {
            errors.criteria = 'Criteria is required.';
        } else {
            try {
                JSON.parse(typeof formData.criteria === 'object' ? JSON.stringify(formData.criteria) : formData.criteria);
            } catch (e) {
                errors.criteria = 'Criteria must be valid JSON.';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            console.log('[RuleForm] Client-side validation failed:', formErrors);
            return;
        }

        if (currentUser?.role !== 'admin') {
            const authErrorMsg = 'You are not authorized to create or edit rules.';
            setError(authErrorMsg);
            console.error('[RuleForm] Authorization failed:', authErrorMsg);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                criteria: typeof formData.criteria === 'string' && formData.criteria.trim() !== ''
                    ? JSON.parse(formData.criteria)
                    : {},
                action_type: formData.action_type || 'flag', // Ensure action_type is always included
            };

            if (mode === 'create') {
                console.log('[RuleForm] Attempting POST request to: /rules with data:', payload);
                await api.post('/rules', payload);
                console.log('[RuleForm] Rule created successfully.');
            } else {
                if (!rule?.id) {
                    throw new Error('Rule ID is missing for update operation.');
                }
                console.log(`[RuleForm] Attempting PUT request to: /rules/${rule.id} with data:`, payload);
                await api.put(`/rules/${rule.id}`, payload);
                console.log(`[RuleForm] Rule ${rule.id} updated successfully.`);
            }
            onSuccess();
        } catch (err: any) {
            console.error('[RuleForm] API Error:', err.response?.data?.message || err.message, err);
            setError(err.response?.data?.message || `Failed to ${mode} rule.`);
        } finally {
            setLoading(false);
        }
    };

    // JSON validation preview
    const isValidJson = () => {
        try {
            JSON.parse(typeof formData.criteria === 'object' ? JSON.stringify(formData.criteria) : formData.criteria);
            return true;
        } catch {
            return false;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
            {loading && (
                <div className="flex justify-center items-center min-h-[200px] bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-emerald-500"></div>
                    <p className="ml-4 text-gray-700 dark:text-gray-300 font-medium">Saving rule...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
                </div>
            )}

            <div>
                <label htmlFor="rule-name" className="block text-sm font-medium text-gray-900 dark:text-gray-100">Rule Name</label>
                <input
                    id="rule-name"
                    type="text"
                    name="rule_name"
                    value={formData.rule_name || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
                    disabled={loading}
                    required
                />
                {formErrors.rule_name && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{formErrors.rule_name}</p>}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{formData.rule_name?.length || 0}/255 characters</p>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-gray-100">Description (Optional)</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
                    rows={3}
                    disabled={loading}
                />
                {formErrors.description && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{formErrors.description}</p>}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{formData.description?.length || 0}/1000 characters</p>
            </div>

            <div>
                <label htmlFor="rule-type" className="block text-sm font-medium text-gray-900 dark:text-gray-100">Rule Type</label>
                <select
                    id="rule-type"
                    name="rule_type"
                    value={formData.rule_type || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
                    disabled={loading}
                    required
                >
                    <option value="">Select Rule Type</option>
                    {ruleTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                </select>
                {formErrors.rule_type && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{formErrors.rule_type}</p>}
            </div>

            <div>
                <label htmlFor="severity" className="block text-sm font-medium text-gray-900 dark:text-gray-100">Severity</label>
                <select
                    id="severity"
                    name="severity"
                    value={formData.severity || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
                    disabled={loading}
                    required
                >
                    {severities.map(level => (
                        <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                    ))}
                </select>
                {formErrors.severity && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{formErrors.severity}</p>}
            </div>

            <div>
                <label htmlFor="criteria" className="block text-sm font-medium text-gray-900 dark:text-gray-100">Criteria (JSON)</label>
                <textarea
                    id="criteria"
                    name="criteria"
                    value={typeof formData.criteria === 'object' && formData.criteria !== null
                        ? JSON.stringify(formData.criteria, null, 2)
                        : (formData.criteria || '')
                    }
                    onChange={handleChange}
                    className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 font-mono"
                    rows={6}
                    disabled={loading}
                    required
                    placeholder='{"amount": {"min": 1000, "max": 50000}}'
                />
                {formErrors.criteria && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{formErrors.criteria}</p>}
                <p className={`text-xs mt-1 ${isValidJson() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isValidJson() ? '✓ Valid JSON' : '✗ Invalid JSON'}
                </p>
            </div>

            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-900 dark:text-gray-100">Status</label>
                <select
                    id="status"
                    name="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
                    disabled={loading}
                    required
                >
                    {statuses.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
                {formErrors.status && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{formErrors.status}</p>}
            </div>

            <div className="flex justify-end mt-6 gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors duration-200"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    disabled={loading}
                >
                    {mode === 'create' ? 'Create Rule' : 'Update Rule'}
                </button>
            </div>
        </form>
    );
};

export default RuleForm;