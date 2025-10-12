
// src/types/index.ts
// This file defines the core data interfaces used across the application.

export interface User {
    name: any;
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'analyst' | 'viewer';
    status: 'active' | 'inactive' | 'suspended';
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
    last_login: string | null; // ISO 8601 date string, or null if never logged in
}

// Feature contribution interface for ML model explainability
export interface FeatureContribution {
    feature_name: string;
    contribution_score: number; // How much this feature contributed to the anomaly score (0-1)
    feature_value: any; // The actual value of this feature for this transaction
    description?: string; // Human-readable description of what this feature represents
}

// Clustering information for unsupervised learning
export interface ClusterInfo {
    cluster_id: number;
    cluster_label?: string; // e.g., "Normal Users", "High Volume Traders", "Night Transactions"
    distance_to_center: number; // How far this transaction is from its cluster center
    cluster_size: number; // Number of transactions in this cluster
    is_outlier: boolean; // Whether this transaction is an outlier within its cluster
}

// ML Model prediction details
export interface MLPrediction {
    model_name: string; // e.g., "isolation_forest", "one_class_svm", "autoencoder"
    model_version: string;
    anomaly_score: number; // 0-1 where 1 is most anomalous
    prediction_confidence: number; // 0-1 confidence in the prediction
    feature_contributions: FeatureContribution[];
    cluster_info?: ClusterInfo;
    prediction_timestamp: string;
    processing_time_ms: number;
}

// Risk assessment based on anomaly score
export type RiskLevel = 'normal' | 'low' | 'medium' | 'high' | 'critical';

export interface Transaction {
    transaction_id: string;
    user_id: string;
    amount: number;
    currency: 'MWK'; // Fixed to Malawi Kwacha for Airtel/TNM context
    timestamp: string; // ISO 8601 date string
    sender_account: string | null;
    receiver_account: string | null;
    sender_msisdn: string | null; // Malawi phone number (e.g., +26599xxxxxxx or +26588xxxxxxx)
    receiver_msisdn: string | null; // Malawi phone number (e.g., +26599xxxxxxx or +26588xxxxxxx)
    description: string | null;
    status: 'pending' | 'completed' | 'failed' | 'blocked' | 'flagged';
    location_city: string | null;
    location_country: string | null;
    device_type: string | null;
    os_type: string | null;
    merchant_id: string | null;
    merchant_category: 'Mobile Operator' | 'Utility' | 'Market Vendor' | 'Transport' | 'Charity' | null;
    transaction_type: 'airtime_topup' | 'bill_payment' | 'cash_in' | 'cash_out' | 'transfer' | null;
    
    // Enhanced ML and Risk Assessment Fields
    anomaly_score: number; // Primary anomaly score from ML model (0-1)
    risk_level: RiskLevel; // Derived from anomaly_score using thresholds
    ml_prediction?: MLPrediction; // Detailed ML model output
    
    // Legacy fields - keeping for backward compatibility but deprecating
    /** @deprecated Use anomaly_score instead */
    risk_score: number;
    /** @deprecated Use ml_prediction.feature_contributions instead */
    fraud_score: number | null;
    /** @deprecated This should be determined by anomaly_score thresholds, not binary classification */
    is_fraud: boolean;
    
    // Rule-based detection (complementary to ML)
    rule_name: string;
    rule_triggered: boolean;
    rule_confidence?: number; // Confidence in rule-based detection (0-1)
    
    // Behavioral and contextual features for ML
    time_since_last_transaction_seconds: number | null;
    is_new_location: boolean | null;
    is_new_device: boolean | null;
    transaction_hour_of_day: number | null; // 0-23
    transaction_day_of_week: number | null; // 0-6
    user_total_transactions: number | null;
    user_total_amount_spent: number | null;
    user_avg_transaction_amount?: number | null;
    user_transaction_frequency?: number | null; // transactions per day
    
    // Geographic and device context
    location: string | null;
    device_info: any | null;
    ip_address: string | null;
    geolocation_risk?: number; // Risk score based on location (0-1)
    device_risk?: number; // Risk score based on device fingerprinting (0-1)
    
    // Temporal patterns
    is_weekend: boolean | null;
    is_business_hours: boolean | null;
    time_since_account_creation_days?: number | null;
    
    // Transaction patterns
    amount_percentile_for_user?: number | null; // Where this amount ranks for this user (0-100)
    velocity_score?: number | null; // How quickly user is transacting (0-1)
    
    // System metadata
    created_at: string;
    updated_at: string;
    last_ml_analysis?: string; // When ML analysis was last run
    requires_review: boolean; // Whether this transaction needs human review
    review_priority: 'low' | 'medium' | 'high' | 'urgent';
    
    // Case review fields
    case_status?: 'confirm_fraud' | 'mark_legitimate' | 'needs_review' | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    investigation_notes?: string | null;
    fraud_confirmed_at?: string | null;
    fraud_cleared_at?: string | null;
}

// Enhanced Anomaly interface for unsupervised detection
export interface Anomaly {
    id: string;
    transaction_id: string | null;
    
    // Detection details
    detection_method: 'rule_based' | 'ml_based' | 'hybrid';
    anomaly_type: 'statistical' | 'behavioral' | 'temporal' | 'geographic' | 'pattern' | 'velocity';
    
    // Severity and status
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved' | 'false_positive' | 'confirmed_fraud';
    confidence_score: number; // How confident the system is in this anomaly (0-1)
    
    // Description and context
    description: string | null;
    auto_generated_summary?: string; // AI-generated summary of the anomaly
    triggered_by: any | null;
    
    // ML-specific fields
    ml_model_used?: string;
    feature_contributions?: FeatureContribution[];
    similar_cases?: string[]; // IDs of similar anomalies
    
    // Temporal data
    timestamp: string;
    first_detected: string;
    last_updated: string;
    
    // Resolution tracking
    resolved_by: string | null;
    resolved_at: string | null;
    resolution_notes: string | null;
    resolution_time_minutes?: number;
    resolver_info?: {
        user_id: string;
        username: string;
        role: string;
        resolved_at: string;
    } | null;
    
    // User interaction
    comments: Array<{
        author: string;
        author_id?: string;
        timestamp: string;
        text: string;
        comment_type?: 'investigation' | 'resolution' | 'escalation' | 'note';
    }>;
    
    // Associated data
    risk_score: number;
    transaction_data: any | null;
    user_id: string | null;
    
    // System metadata
    created_at: string;
    updated_at: string;
    
    // UI state (these might be better in component state)
    anomalies?: Anomaly[]; // For nested anomalies
    onRowClick?: (anomalyId: string) => void;
    onStatusChange?: (anomalyId: string, newStatus: Anomaly['status']) => void;
    updatingAnomalyId?: string | null;
}

export interface AuditLog {
    id: string;
    user_id?: string;
    username?: string;
    action_type: string;
    entity_type?: string;
    entity_id?: string;
    description?: string;
    details?: any;
    ip_address?: string;
    user_agent?: string;
    timestamp: string;
    resource_type?: string;
    resource_id?: string;
    
    // Enhanced fields for ML audit trail
    ml_model_version?: string;
    anomaly_score_before?: number;
    anomaly_score_after?: number;
    feature_changes?: Record<string, { before: any; after: any }>;
}

export type Rule = {
    id: string;
    rule_name: string;
    status: 'active' | 'inactive' | 'draft';
    rule_type: 'threshold' | 'pattern' | 'velocity' | 'geographic' | 'behavioral';
    
    // Rule logic
    conditions: Array<{
        field: string;
        operator: string;
        value: any;
        weight?: number; // For weighted rule systems
    }>;
    
    // Integration with ML
    complement_ml: boolean; // Whether this rule works alongside ML detection
    ml_override_threshold?: number; // Anomaly score threshold where this rule is ignored
    
    // Performance metrics
    true_positive_rate?: number;
    false_positive_rate?: number;
    precision?: number;
    recall?: number;
    
    created_at: string;
    updated_at: string;
    created_by: string;
};

// Dashboard and analytics interfaces
export interface DashboardMetrics {
    total_transactions: number;
    flagged_transactions: number;
    confirmed_fraud: number;
    false_positives: number;
    anomaly_detection_rate: number;
    average_processing_time_ms: number;
    ml_model_accuracy?: number;
    top_risk_factors: Array<{
        factor: string;
        impact_score: number;
        frequency: number;
    }>;
}

// ML Model management
export interface MLModel {
    id: string;
    name: string;
    version: string;
    algorithm: 'isolation_forest' | 'one_class_svm' | 'autoencoder' | 'local_outlier_factor' | 'ensemble';
    status: 'training' | 'active' | 'inactive' | 'deprecated';
    
    // Performance metrics
    performance_metrics: {
        precision: number;
        recall: number;
        f1_score: number;
        auc_score?: number;
        false_positive_rate: number;
        processing_time_ms: number;
    };
    
    // Training details
    training_data_size: number;
    training_date: string;
    features_used: string[];
    hyperparameters: Record<string, any>;
    
    // Deployment info
    deployed_at?: string;
    last_retrained?: string;
    next_retrain_scheduled?: string;
    
    created_at: string;
    updated_at: string;
}

// Real-time monitoring
export interface SystemHealth {
    ml_service_status: 'healthy' | 'degraded' | 'down';
    transaction_processing_rate: number; // transactions per minute
    anomaly_detection_latency_ms: number;
    queue_length: number;
    error_rate: number;
    last_updated: string;
}