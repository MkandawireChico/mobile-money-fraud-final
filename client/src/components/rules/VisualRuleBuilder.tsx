import React, { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Play,
  Save,
  AlertTriangle,
  CheckCircle,
  Settings,
  Zap,
  Target,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Smartphone
} from 'lucide-react';

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string | number;
  logicalOperator?: 'AND' | 'OR';
}

interface RuleAction {
  type: 'flag' | 'block' | 'alert' | 'score';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  message?: string;
}

interface VisualRule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  action: RuleAction;
  isActive: boolean;
  category: string;
}

const FIELD_OPTIONS = [
  { value: 'amount', label: 'Transaction Amount', icon: DollarSign, type: 'number' },
  { value: 'transaction_type', label: 'Transaction Type', icon: Zap, type: 'select' },
  { value: 'hour', label: 'Hour of Day', icon: Clock, type: 'number' },
  { value: 'day_of_week', label: 'Day of Week', icon: Clock, type: 'select' },
  { value: 'location_city', label: 'Location', icon: MapPin, type: 'select' },
  { value: 'network_operator', label: 'Network Operator', icon: Smartphone, type: 'select' },
  { value: 'user_transaction_count', label: 'User Transaction Count', icon: Users, type: 'number' },
  { value: 'velocity_5min', label: '5-Min Transaction Velocity', icon: Target, type: 'number' }
];

const OPERATOR_OPTIONS = {
  number: [
    { value: '>', label: 'Greater than' },
    { value: '<', label: 'Less than' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<=', label: 'Less than or equal' },
    { value: '==', label: 'Equal to' },
    { value: '!=', label: 'Not equal to' },
    { value: 'between', label: 'Between' }
  ],
  select: [
    { value: '==', label: 'Is' },
    { value: '!=', label: 'Is not' },
    { value: 'in', label: 'Is one of' },
    { value: 'not_in', label: 'Is not one of' }
  ]
};

const TRANSACTION_TYPES = ['cash_in', 'cash_out', 'p2p_transfer', 'bill_payment', 'merchant_payment'];
const CITIES = ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi'];
const OPERATORS = ['TNM', 'Airtel', 'Access'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const VisualRuleBuilder: React.FC = () => {
  const [rule, setRule] = useState<VisualRule>({
    id: '',
    name: '',
    description: '',
    conditions: [{ id: '1', field: '', operator: '', value: '', logicalOperator: 'AND' }],
    action: { type: 'flag', severity: 'medium', confidence: 70 },
    isActive: true,
    category: 'custom'
  });

  const [isTestMode, setIsTestMode] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const addCondition = useCallback(() => {
    const newCondition: RuleCondition = {
      id: Date.now().toString(),
      field: '',
      operator: '',
      value: '',
      logicalOperator: 'AND'
    };
    setRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  }, []);

  const removeCondition = useCallback((id: string) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== id)
    }));
  }, []);

  const updateCondition = useCallback((id: string, updates: Partial<RuleCondition>) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  }, []);

  const getFieldType = (fieldValue: string) => {
    return FIELD_OPTIONS.find(f => f.value === fieldValue)?.type || 'number';
  };

  const getSelectOptions = (fieldValue: string) => {
    switch (fieldValue) {
      case 'transaction_type': return TRANSACTION_TYPES;
      case 'location_city': return CITIES;
      case 'network_operator': return OPERATORS;
      case 'day_of_week': return DAYS;
      default: return [];
    }
  };

  const renderCondition = (condition: RuleCondition, index: number) => {
    const fieldType = getFieldType(condition.field);
    const operators = OPERATOR_OPTIONS[fieldType as keyof typeof OPERATOR_OPTIONS] || OPERATOR_OPTIONS.number;
    const selectOptions = getSelectOptions(condition.field);

    return (
      <div key={condition.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        {/* Logical Operator */}
        {index > 0 && (
          <div className="mb-3">
            <select
              value={condition.logicalOperator}
              onChange={(e) => updateCondition(condition.id, { logicalOperator: e.target.value as 'AND' | 'OR' })}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Field
            </label>
            <select
              value={condition.field}
              onChange={(e) => updateCondition(condition.id, { field: e.target.value, operator: '', value: '' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select field...</option>
              {FIELD_OPTIONS.map(field => {
                const Icon = field.icon;
                return (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Operator Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Operator
            </label>
            <select
              value={condition.operator}
              onChange={(e) => updateCondition(condition.id, { operator: e.target.value })}
              disabled={!condition.field}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            >
              <option value="">Select operator...</option>
              {operators.map(op => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Value
            </label>
            {fieldType === 'select' ? (
              <select
                value={condition.value}
                onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                disabled={!condition.operator}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              >
                <option value="">Select value...</option>
                {selectOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={condition.value}
                onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                disabled={!condition.operator}
                placeholder="Enter value..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
            )}
          </div>

          {/* Remove Button */}
          <div>
            {rule.conditions.length > 1 && (
              <button
                onClick={() => removeCondition(condition.id)}
                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                title="Remove condition"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Visual Rule Builder
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsTestMode(!isTestMode)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              isTestMode 
                ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Play size={16} />
            <span>Test Mode</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Save size={16} />
            <span>Save Rule</span>
          </button>
        </div>
      </div>

      {/* Rule Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rule Name
          </label>
          <input
            type="text"
            value={rule.name}
            onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., High Amount Night Transaction"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={rule.description}
            onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of what this rule detects"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Conditions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Conditions
          </h3>
          <button
            onClick={addCondition}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Condition</span>
          </button>
        </div>

        <div className="space-y-4">
          {rule.conditions.map((condition, index) => renderCondition(condition, index))}
        </div>
      </div>

      {/* Action Configuration */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Action
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action Type
            </label>
            <select
              value={rule.action.type}
              onChange={(e) => setRule(prev => ({ 
                ...prev, 
                action: { ...prev.action, type: e.target.value as any }
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="flag">Flag Transaction</option>
              <option value="block">Block Transaction</option>
              <option value="alert">Send Alert</option>
              <option value="score">Add Risk Score</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Severity
            </label>
            <select
              value={rule.action.severity}
              onChange={(e) => setRule(prev => ({ 
                ...prev, 
                action: { ...prev.action, severity: e.target.value as any }
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confidence ({rule.action.confidence}%)
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={rule.action.confidence}
              onChange={(e) => setRule(prev => ({ 
                ...prev, 
                action: { ...prev.action, confidence: parseInt(e.target.value) }
              }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Test Results */}
      {isTestMode && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Test Mode Active
            </h4>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            This rule will be tested against historical transaction data to predict its effectiveness.
          </p>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
            Run Test Simulation
          </button>
        </div>
      )}
    </div>
  );
};

export default VisualRuleBuilder;
