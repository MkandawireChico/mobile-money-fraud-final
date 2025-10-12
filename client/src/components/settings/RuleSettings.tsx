// client/src/components/settings/RuleSettings.tsx
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios.ts';
import { ChevronDown, Plus, Trash2, Save, HelpCircle } from 'lucide-react';

interface Rule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    type: 'amount' | 'time' | 'device' | 'velocity' | 'custom';
    config: { [key: string]: any };
}

interface RuleSettingsProps {
    settings: {
        settings: Rule[] | null;
        rule_engine_enabled?: boolean;
        auto_block_suspicious_transactions?: boolean;
    }[];
    onSettingsChange: (newValues: any) => void;
    isReadOnly: boolean;
}

const RuleSettings: React.FC<RuleSettingsProps> = ({ settings: initialRules, isReadOnly }) => {
    const [rules, setRules] = useState<Rule[]>(initialRules[0]?.settings || []);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | false>(false);
    const [deletedRule, setDeletedRule] = useState<Rule | null>(null); // For undo functionality

    useEffect(() => {
        if (initialRules && initialRules[0]?.settings) {
            setRules(initialRules[0].settings);
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, [initialRules]);

    const handleChange = (panel: string) => (event: React.ChangeEvent<{}>, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    const handleRuleChange = (index: number, field: keyof Rule, value: any) => {
        if (isReadOnly) return;
        const newRules = [...rules];
        (newRules[index] as any)[field] = value;
        setRules(newRules);
    };

    const handleConfigChange = (index: number, key: string, value: any) => {
        if (isReadOnly) return;
        const newRules = [...rules];
        newRules[index].config = {
            ...newRules[index].config,
            [key]: value,
        };
        setRules(newRules);
    };

    const handleAddRule = () => {
        if (isReadOnly) return;
        const newRuleId = `new-rule-${Date.now()}`;
        setRules([
            ...rules,
            {
                id: newRuleId,
                name: 'New Custom Rule',
                description: 'A new custom fraud detection rule. Please configure its type and parameters.',
                enabled: true,
                type: 'custom',
                config: {},
            },
        ]);
        setExpanded(`panel-${newRuleId}`);
    };

    const handleDeleteRule = async (id: string) => {
        if (isReadOnly) return;
        if (window.confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
            const ruleToDelete = rules.find(rule => rule.id === id);
            if (ruleToDelete) {
                setDeletedRule(ruleToDelete);
                try {
                    setError(null);
                    setSaving(true);
                    await axios.delete(`/api/settings/rules/${id}`);
                    setRules(rules.filter(rule => rule.id !== id));
                    setExpanded(false);
                    console.log(`Rule ${id} deleted successfully.`);
                } catch (err: any) {
                    setError(err.response?.data?.message || `Failed to delete rule ${id}.`);
                    console.error(`Error deleting rule ${id}:`, err);
                } finally {
                    setSaving(false);
                }
            }
        }
    };

    const handleUndoDelete = () => {
        if (deletedRule) {
            setRules([...rules, deletedRule]);
            setDeletedRule(null);
        }
    };

    const handleSaveRule = async (rule: Rule) => {
        if (isReadOnly) return;
        setSaving(true);
        setError(null);

        try {
            if (rule.id.startsWith('new-rule-')) {
                const response = await axios.post('/api/settings/rules', rule);
                setRules(rules.map(r => (r.id === rule.id ? response.data : r)));
                console.log('New rule created successfully!', response.data);
            } else {
                await axios.put(`/api/settings/rules/${rule.id}`, rule);
                console.log(`Rule ${rule.id} updated successfully!`);
            }
            setExpanded(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save rule.');
            console.error('Error saving rule:', err);
        } finally {
            setSaving(false);
        }
    };

    // Rule validation summary for user feedback
    const validateRule = (rule: Rule) => {
        switch (rule.type) {
            case 'amount':
                return rule.config.amountThreshold !== undefined && rule.config.amountThreshold > 0;
            case 'velocity':
                return rule.config.countThreshold !== undefined && rule.config.countThreshold > 0 && rule.config.timeWindowMinutes !== undefined && rule.config.timeWindowMinutes > 0;
            case 'custom':
                try {
                    JSON.parse(JSON.stringify(rule.config));
                    return true;
                } catch {
                    return false;
                }
            default:
                return true;
        }
    };

    if (loading && rules.length === 0) {
        return (
            <div className="p-3 bg-white rounded-lg shadow-md mb-3">
                <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
                    <p className="ml-4 text-gray-600">Loading fraud rules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 bg-white rounded-lg shadow-md mb-3">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
                Fraud Detection Rules
                <span className="ml-2">
                    <button
                        className="p-1 text-gray-500 hover:text-gray-700"
                        aria-label="help"
                    >
                        <HelpCircle className="h-5 w-5" />
                    </button>
                </span>
            </h2>
            {error && (
                <div className="mb-2">
                    <p className="text-red-600">{error}</p>
                </div>
            )}
            <div className="mb-2">
                <button
                    onClick={handleAddRule}
                    disabled={isReadOnly}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                    <Plus className="h-4 w-4 mr-1" /> Add New Rule
                </button>
            </div>

            {rules.length === 0 && (
                <p className="text-gray-500 text-sm">No custom rules configured. Click "Add New Rule" to create one.</p>
            )}

            {rules.map((rule, index) => (
                <div
                    key={rule.id}
                    className="bg-gray-50 rounded-lg mb-1 last:mb-0"
                >
                    <div
                        className="flex items-center justify-between p-2 cursor-pointer"
                        onClick={handleChange(`panel-${rule.id}`)}
                    >
                        <div className="flex items-center">
                            <label className="flex items-center mr-4">
                                <input
                                    type="checkbox"
                                    checked={rule.enabled}
                                    onChange={(e) => handleRuleChange(index, 'enabled', e.target.checked)}
                                    className="mr-2 form-checkbox text-blue-600"
                                    disabled={isReadOnly}
                                />
                                <span className="text-sm font-medium">{rule.name}</span>
                            </label>
                            <p className="text-xs text-gray-500 ml-4">Type: {rule.type.charAt(0).toUpperCase() + rule.type.slice(1)}</p>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSaveRule(rule); }}
                                disabled={saving || isReadOnly || !validateRule(rule)}
                                className="mr-2 p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                            >
                                {saving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-gray-500"></div> : <Save className="h-5 w-5" />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteRule(rule.id); }}
                                disabled={saving || isReadOnly}
                                className="p-1 text-gray-500 hover:text-red-700 disabled:text-gray-300"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                            <button
                                className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                                onClick={handleChange(`panel-${rule.id}`)}
                            >
                                <ChevronDown className={`h-5 w-5 ${expanded === `panel-${rule.id}` ? 'transform rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                    {expanded === `panel-${rule.id}` && (
                        <div className="p-2">
                            <div className="grid gap-3">
                                <div>
                                    <label htmlFor={`rule-name-${rule.id}`} className="block text-sm font-medium text-gray-700">Rule Name</label>
                                    <input
                                        id={`rule-name-${rule.id}`}
                                        value={rule.name}
                                        onChange={(e) => handleRuleChange(index, 'name', e.target.value)}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                        disabled={isReadOnly}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">A descriptive name for your rule.</p>
                                </div>
                                <div>
                                    <label htmlFor={`rule-description-${rule.id}`} className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        id={`rule-description-${rule.id}`}
                                        value={rule.description}
                                        onChange={(e) => handleRuleChange(index, 'description', e.target.value)}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                        rows={3}
                                        disabled={isReadOnly}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Explain what this rule detects and its purpose.</p>
                                </div>
                                <div>
                                    <label htmlFor={`rule-type-${rule.id}`} className="block text-sm font-medium text-gray-700">Rule Type</label>
                                    <select
                                        id={`rule-type-${rule.id}`}
                                        value={rule.type}
                                        onChange={(e) => handleRuleChange(index, 'type', e.target.value as Rule['type'])}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                        disabled={isReadOnly}
                                    >
                                        <option value="amount">Amount Based</option>
                                        <option value="time">Time Based</option>
                                        <option value="device">Device Based</option>
                                        <option value="velocity">Velocity Based</option>
                                        <option value="custom">Custom (Advanced)</option>
                                    </select>
                                </div>

                                {rule.type === 'amount' && (
                                    <div>
                                        <label htmlFor={`amountThreshold-${rule.id}`} className="block text-sm font-medium text-gray-700">Amount Threshold (MWK)</label>
                                        <input
                                            id={`amountThreshold-${rule.id}`}
                                            type="number"
                                            value={rule.config.amountThreshold || ''}
                                            onChange={(e) => handleConfigChange(index, 'amountThreshold', Number(e.target.value))}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                            disabled={isReadOnly}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Trigger if transaction amount exceeds this value.</p>
                                    </div>
                                )}
                                {rule.type === 'velocity' && (
                                    <>
                                        <div>
                                            <label htmlFor={`countThreshold-${rule.id}`} className="block text-sm font-medium text-gray-700">Transaction Count Threshold</label>
                                            <input
                                                id={`countThreshold-${rule.id}`}
                                                type="number"
                                                value={rule.config.countThreshold || ''}
                                                onChange={(e) => handleConfigChange(index, 'countThreshold', Number(e.target.value))}
                                                className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                                disabled={isReadOnly}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Trigger if transaction count exceeds this value within the time window.</p>
                                        </div>
                                        <div>
                                            <label htmlFor={`timeWindowMinutes-${rule.id}`} className="block text-sm font-medium text-gray-700">Time Window (minutes)</label>
                                            <input
                                                id={`timeWindowMinutes-${rule.id}`}
                                                type="number"
                                                value={rule.config.timeWindowMinutes || ''}
                                                onChange={(e) => handleConfigChange(index, 'timeWindowMinutes', Number(e.target.value))}
                                                className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                                disabled={isReadOnly}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">The time period (in minutes) for the velocity count.</p>
                                        </div>
                                    </>
                                )}
                                {rule.type === 'custom' && (
                                    <div>
                                        <label htmlFor={`customLogic-${rule.id}`} className="block text-sm font-medium text-gray-700">Custom Logic (JSON or DSL)</label>
                                        <textarea
                                            id={`customLogic-${rule.id}`}
                                            value={JSON.stringify(rule.config, null, 2)}
                                            onChange={(e) => {
                                                if (isReadOnly) return;
                                                try {
                                                    handleRuleChange(index, 'config', JSON.parse(e.target.value));
                                                    setError(null);
                                                } catch (parseError: any) {
                                                    setError(`Invalid JSON format for custom logic: ${parseError.message}`);
                                                    console.error("Invalid JSON for custom logic:", parseError);
                                                }
                                            }}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                            rows={5}
                                            disabled={isReadOnly}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Enter custom rule logic in JSON format. This will be evaluated by the backend. Ensure it's valid JSON.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
            {deletedRule && (
                <div className="mt-2 p-2 bg-yellow-100 rounded text-sm text-yellow-800 flex justify-between items-center">
                    <p>Rule "{deletedRule.name}" deleted. <button onClick={handleUndoDelete} className="ml-2 underline text-yellow-700 hover:text-yellow-900">Undo</button></p>
                </div>
            )}
        </div>
    );
};

export default RuleSettings;