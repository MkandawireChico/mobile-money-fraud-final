import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface SvgIconComponentProps extends React.SVGProps<SVGSVGElement> {}

// Enhanced interface with stricter typing
interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType<SvgIconComponentProps>;
    loading: boolean;
    description?: string;
    change?: string;
    changeType?: 'increase' | 'decrease' | 'neutral' | undefined;
    metricType?: 'anomaly_rate' | 'confidence' | 'processing_time' | 'model_performance' | 'detection_accuracy' | 'standard';
    threshold?: {
        value: number;
        type: 'min' | 'max';
        status: 'healthy' | 'warning' | 'critical';
    };
    trend?: Array<{ timestamp: string; value: number }>;
    subMetrics?: Array<{ label: string; value: string | number }>;
    status?: 'healthy' | 'warning' | 'critical' | 'unknown';
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    icon: Icon,
    loading,
    change,
    changeType,
    metricType = 'standard',
    threshold,
    subMetrics,
    status = 'healthy',
    description
}) => {
    // Type guard for numeric value
    const isNumericValue = (val: string | number): val is number => typeof val === 'number' && !isNaN(val);
    const numericValue = isNumericValue(value) ? value : 0; // Fallback to 0 if not numeric

    // Enhanced color logic for ML metrics
    const getChangeColorClass = () => {
        if (!changeType && change) return 'text-gray-500'; // Handle undefined changeType with change
        switch (changeType) {
            case 'increase':
                return metricType === 'anomaly_rate' ? 'text-red-600' : 'text-green-600';
            case 'decrease':
                return metricType === 'anomaly_rate' ? 'text-green-600' : 'text-red-600';
            case 'neutral':
            default:
                return 'text-gray-500';
        }
    };

    const getStatusColorClass = () => {
        switch (status) {
            case 'healthy': return 'border-green-200 bg-green-50';
            case 'warning': return 'border-yellow-200 bg-yellow-50';
            case 'critical': return 'border-red-200 bg-red-50';
            default: return 'border-gray-200 bg-white';
        }
    };

    const getStatusIconColorClass = () => {
        switch (status) {
            case 'healthy': return 'text-green-600';
            case 'warning': return 'text-yellow-600';
            case 'critical': return 'text-red-600';
            default: return 'text-blue-600';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'healthy': return CheckCircle;
            case 'warning': return AlertCircle;
            case 'critical': return AlertCircle;
            default: return Info;
        }
    };

    const getTrendIcon = () => {
        if (!change || !changeType) return Minus;
        return changeType === 'increase' ? TrendingUp : TrendingDown;
    };

    // Improved value formatting with error handling
    const formatValue = (val: string | number) => {
        if (!isNumericValue(val)) return val;
        switch (metricType) {
            case 'anomaly_rate':
            case 'detection_accuracy':
            case 'confidence':
                return `${val.toFixed(2)}%`;
            case 'processing_time':
                return val < 1000 ? `${val}ms` : `${(val / 1000).toFixed(2)}s`;
            case 'model_performance':
                return val.toFixed(4);
            default:
                return val.toLocaleString();
        }
    };

    const StatusIcon = getStatusIcon();
    const TrendIcon = getTrendIcon();

    return (
        <div
            className={clsx(
                "flex flex-col justify-between p-6 h-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out border-2",
                getStatusColorClass()
            )}
            role="region"
            aria-label={`${title} Metric Card`}
        >
            {/* Header with Icon and Status */}
            <div className="flex items-start justify-between mb-3">
                <div className={clsx("mb-2", getStatusIconColorClass())}>
                    <Icon className="w-10 h-10" aria-hidden="true" />
                </div>
                <div className={clsx("flex items-center", getStatusIconColorClass())}>
                    <StatusIcon className="w-5 h-5" aria-label={`Status: ${status}`} />
                </div>
            </div>

            {/* Title and Description */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>

            {/* Main Value */}
            <div className="mb-4">
                {loading ? (
                    <div className="flex items-center justify-center h-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent" aria-label="Loading" />
                    </div>
                ) : (
                    <div>
                        <p className="text-3xl font-bold text-gray-900 leading-tight">
                            {formatValue(value)}
                        </p>
                        {threshold && (
                            <div className="mt-2" role="progressbar" aria-valuenow={numericValue} aria-valuemin={0} aria-valuemax={threshold.value} aria-label={`${title} Threshold Progress`}>
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Threshold</span>
                                    <span>{formatValue(threshold.value)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className={clsx("h-1.5 rounded-full", {
                                            'bg-green-500': threshold.status === 'healthy',
                                            'bg-yellow-500': threshold.status === 'warning',
                                            'bg-red-500': threshold.status === 'critical'
                                        })}
                                        style={{
                                            width: threshold.type === 'max'
                                                ? `${Math.min((numericValue / threshold.value) * 100, 100)}%`
                                                : `${Math.max(100 - (numericValue / threshold.value) * 100, 0)}%`
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Change Indicator */}
            {change && (
                <div className={clsx("flex items-center text-sm mb-3", getChangeColorClass())}>
                    <TrendIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                    <span className="font-medium">{change}</span>
                    <span className="text-gray-500 ml-1">from last period</span>
                </div>
            )}

            {/* Sub-metrics */}
            {subMetrics && subMetrics.length > 0 && (
                <div className="border-t border-gray-300 pt-4 space-y-2">
                    {subMetrics.map((subMetric, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{subMetric.label}</span>
                            <span className="font-semibold text-gray-800">
                                {formatValue(subMetric.value)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ML-specific context indicators */}
            {metricType !== 'standard' && (
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">{metricType.replace('_', ' ')}</span>
                    {status !== 'unknown' && (
                        <span className={clsx("capitalize font-medium", {
                            'text-green-600': status === 'healthy',
                            'text-yellow-600': status === 'warning',
                            'text-red-600': status === 'critical'
                        })}>
                            {status}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

// Specialized ML Metric Cards with refined props
export const AnomalyRateCard: React.FC<Omit<MetricCardProps, 'metricType' | 'icon'>> = (props) => (
    <MetricCard
        {...props}
        metricType="anomaly_rate"
        icon={AlertCircle}
        description="Percentage of transactions flagged as anomalous"
    />
);

export const ModelConfidenceCard: React.FC<Omit<MetricCardProps, 'metricType' | 'icon'>> = (props) => (
    <MetricCard
        {...props}
        metricType="confidence"
        icon={CheckCircle}
        description="Average confidence in ML predictions"
    />
);

export const ProcessingTimeCard: React.FC<Omit<MetricCardProps, 'metricType' | 'icon'>> = (props) => (
    <MetricCard
        {...props}
        metricType="processing_time"
        icon={TrendingUp}
        description="Average time to analyze transactions"
    />
);

export const DetectionAccuracyCard: React.FC<Omit<MetricCardProps, 'metricType' | 'icon'>> = (props) => (
    <MetricCard
        {...props}
        metricType="detection_accuracy"
        icon={CheckCircle}
        description="Model accuracy based on analyst feedback"
    />
);

export default MetricCard;