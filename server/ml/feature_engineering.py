import pandas as pd
import numpy as np
from typing import List, Dict, Any
from sklearn.preprocessing import StandardScaler, LabelEncoder
import warnings
warnings.filterwarnings('ignore')

# Define feature categories
NUMERICAL_FEATURES_RAW = [
    'amount', 'transaction_hour_of_day', 'transaction_day_of_week',
    'risk_score'
]

CATEGORICAL_FEATURES = [
    'transaction_type', 'network_operator', 'device_type', 'os_type', 
    'merchant_category', 'location_city', 'status'
]

BOOLEAN_FEATURES = [
    'is_weekend', 'is_business_hours', 'is_new_device', 'is_new_location'
]

def calculate_derived_features_chunked(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate advanced behavioral features for Malawi mobile money fraud detection
    """
    print("🇲🇼 Calculating Malawi-specific derived features...")
    
    # Make a copy to avoid modifying original
    df_features = df.copy()
    
    # Ensure timestamp is datetime
    if 'timestamp' in df_features.columns:
        df_features['timestamp'] = pd.to_datetime(df_features['timestamp'])
        df_features['transaction_hour_of_day'] = df_features['timestamp'].dt.hour
        df_features['transaction_day_of_week'] = df_features['timestamp'].dt.dayofweek
    
    # 1. Enhanced Amount-based features for Malawi context
    print("💰 Computing Malawi amount-based features...")
    df_features['amount_log'] = np.log1p(df_features['amount'])
    df_features['amount_sqrt'] = np.sqrt(df_features['amount'])
    
    # Amount z-score (global)
    df_features['amount_zscore_global'] = (
        df_features['amount'] - df_features['amount'].mean()
    ) / df_features['amount'].std()
    
    # Malawi-specific amount thresholds (in MWK)
    df_features['is_micro_transaction'] = (df_features['amount'] <= 1000).astype(int)
    df_features['is_small_transaction'] = ((df_features['amount'] > 1000) & (df_features['amount'] <= 10000)).astype(int)
    df_features['is_large_transaction'] = (df_features['amount'] > 50000).astype(int)
    df_features['is_round_amount'] = (df_features['amount'] % 1000 == 0).astype(int)
    
    # 2. Enhanced customer behavioral features using sender_account (phone numbers)
    print("👤 Computing Malawi customer behavioral features...")
    if 'sender_account' in df_features.columns:
        customer_stats = df_features.groupby('sender_account').agg({
            'amount': ['mean', 'std', 'count', 'sum'],
            'transaction_hour_of_day': ['mean', 'std'],
            'location_city': 'nunique',
            'transaction_type': 'nunique'
        }).reset_index()
        
        # Flatten column names
        customer_stats.columns = ['sender_account'] + [f'customer_{col[0]}_{col[1]}' for col in customer_stats.columns[1:]]
        
        # Merge customer statistics
        df_features = df_features.merge(customer_stats, on='sender_account', how='left')
        
        # Fill missing values and create behavioral indicators
        for col in customer_stats.columns[1:]:
            if col in df_features.columns:
                df_features[col] = df_features[col].fillna(0)
        
        # Behavioral risk indicators
        df_features['is_new_customer'] = (df_features['customer_amount_count'] <= 2).astype(int)
        df_features['is_high_frequency_customer'] = (df_features['customer_amount_count'] > 20).astype(int)
        df_features['customer_location_diversity'] = df_features['customer_location_city_nunique']
        
        # Amount deviation from customer's normal pattern
        df_features['amount_deviation_from_customer'] = np.abs(
            df_features['amount'] - df_features['customer_amount_mean']
        ) / (df_features['customer_amount_std'] + 1)
    
    # 3. Enhanced Malawi-specific temporal features
    print("⏰ Creating Malawi temporal features...")
    
    # Malawi business patterns
    df_features['is_weekend'] = (df_features['transaction_day_of_week'].isin([5, 6])).astype(int)
    df_features['is_business_hours'] = (
        (df_features['transaction_hour_of_day'] >= 8) & 
        (df_features['transaction_hour_of_day'] <= 17)
    ).astype(int)
    
    # Malawi-specific time patterns
    df_features['is_market_day'] = df_features['transaction_day_of_week'].isin([1, 4]).astype(int)  # Tue, Fri
    df_features['is_late_night'] = ((df_features['transaction_hour_of_day'] >= 22) | (df_features['transaction_hour_of_day'] <= 5)).astype(int)
    df_features['is_early_morning'] = ((df_features['transaction_hour_of_day'] >= 5) & (df_features['transaction_hour_of_day'] <= 7)).astype(int)
    
    # 4. Enhanced temporal features with cyclical encoding
    print("🔄 Computing cyclical temporal features...")
    df_features['hour_sin'] = np.sin(2 * np.pi * df_features['transaction_hour_of_day'] / 24)
    df_features['hour_cos'] = np.cos(2 * np.pi * df_features['transaction_hour_of_day'] / 24)
    df_features['day_sin'] = np.sin(2 * np.pi * df_features['transaction_day_of_week'] / 7)
    df_features['day_cos'] = np.cos(2 * np.pi * df_features['transaction_day_of_week'] / 7)
    
    # 5. Malawi location and network features
    print("📍 Computing location and network features...")
    if 'location_city' in df_features.columns:
        # Malawi city risk mapping
        malawi_city_risk = {
            'Lilongwe': 0.1, 'Blantyre': 0.15, 'Mzuzu': 0.2, 'Zomba': 0.25,
            'Kasungu': 0.3, 'Mangochi': 0.35
        }
        df_features['location_risk_score'] = df_features['location_city'].map(malawi_city_risk).fillna(0.4)
        df_features['is_major_city'] = df_features['location_city'].isin(['Lilongwe', 'Blantyre', 'Mzuzu']).astype(int)
        df_features['is_border_area'] = df_features['location_city'].isin(['Mangochi', 'Nsanje', 'Karonga']).astype(int)
    
    # 6. Transaction type risk features
    if 'transaction_type' in df_features.columns:
        transaction_risk = {
            'cash_out': 0.4, 'p2p_transfer': 0.2, 'bill_payment': 0.1,
            'airtime_purchase': 0.05, 'cash_in': 0.15, 'merchant_payment': 0.1
        }
        df_features['transaction_risk_score'] = df_features['transaction_type'].map(transaction_risk).fillna(0.3)
        df_features['is_high_risk_transaction'] = df_features['transaction_type'].isin(['cash_out', 'p2p_transfer']).astype(int)
        df_features['is_cash_transaction'] = df_features['transaction_type'].isin(['cash_in', 'cash_out']).astype(int)
    
    # 7. Network operator features (TNM vs Airtel)
    if 'telco_provider' in df_features.columns:
        df_features['is_tnm'] = (df_features['telco_provider'] == 'TNM').astype(int)
        df_features['is_airtel'] = (df_features['telco_provider'] == 'Airtel').astype(int)
    
    # 8. Advanced Malawi behavioral patterns for higher confidence
    print("🧠 Computing advanced behavioral patterns...")
    
    # Payday patterns (common Malawi paydays: 1st, 15th, 30th)
    if 'timestamp' in df_features.columns:
        df_features['day_of_month'] = df_features['timestamp'].dt.day
        df_features['is_payday'] = df_features['day_of_month'].isin([1, 15, 30, 31]).astype(int)
        df_features['days_since_payday'] = df_features['day_of_month'].apply(
            lambda x: min([abs(x - pd) for pd in [1, 15, 30, 31]])
        )
        
        # Market day patterns (Monday, Wednesday, Saturday in Malawi)
        df_features['is_market_day'] = df_features['transaction_day_of_week'].isin([0, 2, 5]).astype(int)
        
        # Cultural event modifiers
        month = df_features['timestamp'].dt.month
        df_features['cultural_risk_modifier'] = 1.0
        df_features.loc[month.isin([12]), 'cultural_risk_modifier'] = 1.2  # Christmas season
        df_features.loc[month.isin([3, 4, 5]), 'cultural_risk_modifier'] = 0.9  # Harvest season
    
    # 9. Transaction velocity and consistency features
    print("⚡ Computing velocity and consistency features...")
    
    # Optimized velocity calculation (simplified for performance)
    df_features['transaction_velocity_score'] = 1.0  # Default baseline velocity
    
    # Device and location consistency
    df_features['device_consistency_score'] = np.where(
        df_features.get('is_new_device', 0) == 1, 0.3, 0.9
    )
    df_features['location_consistency_score'] = np.where(
        df_features.get('is_new_location', 0) == 1, 0.4, 0.9
    )
    
    # Amount pattern consistency
    df_features['amount_percentile'] = df_features['amount'].rank(pct=True)
    df_features['is_amount_outlier'] = (
        (df_features['amount_percentile'] < 0.05) | 
        (df_features['amount_percentile'] > 0.95)
    ).astype(int)
    
    # 10. Advanced risk scoring with confidence boosting
    print("🎯 Computing advanced risk scores...")
    
    # Multi-dimensional risk components
    risk_components = []
    confidence_components = []
    
    if 'location_risk_score' in df_features.columns:
        risk_components.append(df_features['location_risk_score'])
        confidence_components.append(0.8)  # High confidence in location risk
    
    if 'transaction_risk_score' in df_features.columns:
        risk_components.append(df_features['transaction_risk_score'])
        confidence_components.append(0.9)  # Very high confidence in transaction type risk
    
    if 'is_late_night' in df_features.columns:
        risk_components.append(df_features['is_late_night'] * 0.3)
        confidence_components.append(0.7)  # Good confidence in time patterns
    
    if 'is_large_transaction' in df_features.columns:
        risk_components.append(df_features['is_large_transaction'] * 0.4)
        confidence_components.append(0.85)  # High confidence in amount patterns
    
    # Behavioral consistency risk
    behavioral_risk = (
        (1 - df_features['device_consistency_score']) * 0.3 +
        (1 - df_features['location_consistency_score']) * 0.2 +
        df_features['is_amount_outlier'] * 0.25
    )
    risk_components.append(behavioral_risk)
    confidence_components.append(0.75)  # Good confidence in behavioral patterns
    
    # Cultural and temporal risk
    temporal_risk = (
        df_features.get('is_late_night', 0) * 0.4 +
        (1 - df_features.get('is_business_hours', 1)) * 0.2 +
        df_features.get('is_weekend', 0) * 0.1
    ) * df_features['cultural_risk_modifier']
    risk_components.append(temporal_risk)
    confidence_components.append(0.8)  # High confidence in temporal patterns
    
    # Weighted composite risk score
    if risk_components:
        weights = np.array(confidence_components) / sum(confidence_components)
        df_features['composite_risk_score'] = np.average(risk_components, weights=weights, axis=0)
        df_features['risk_confidence_score'] = np.mean(confidence_components)
    
    # 11. Feature interaction terms for higher-order patterns
    print("🔗 Computing feature interactions...")
    
    # High-impact interactions
    df_features['amount_time_interaction'] = (
        df_features['amount_log'] * df_features['is_late_night']
    )
    df_features['location_amount_interaction'] = (
        df_features.get('location_risk_score', 0) * df_features['is_large_transaction']
    )
    df_features['consistency_risk_interaction'] = (
        df_features['device_consistency_score'] * df_features['location_consistency_score']
    )
    
    print("✅ Advanced Malawi feature engineering completed!")
    print(f"📊 Total features created: {len(df_features.columns)}")
    return df_features


def apply_preprocessors_chunked(df: pd.DataFrame, scaler=None, encoders=None, fit=True) -> tuple:
    """
    Apply preprocessing to features for ML training
    """
    print("Applying preprocessing...")
    
    # Select features that exist in the dataframe
    available_numerical = [col for col in NUMERICAL_FEATURES_RAW if col in df.columns]
    available_categorical = [col for col in CATEGORICAL_FEATURES if col in df.columns]
    available_boolean = [col for col in BOOLEAN_FEATURES if col in df.columns]
    
    # Add derived features
    derived_features = ['amount_log', 'amount_sqrt', 'amount_zscore_global', 
                       'hour_sin', 'hour_cos', 'day_sin', 'day_cos']
    available_derived = [col for col in derived_features if col in df.columns]
    
    # Combine all features
    feature_columns = available_numerical + available_categorical + available_boolean + available_derived
    
    # Select only available features
    df_processed = df[feature_columns].copy()
    
    # Handle missing values
    df_processed = df_processed.fillna(0)
    
    # Initialize preprocessors if fitting
    if fit:
        scaler = StandardScaler()
        encoders = {}
        
        # Fit scaler on numerical features
        numerical_cols = available_numerical + available_derived
        if numerical_cols:
            scaler.fit(df_processed[numerical_cols])
        
        # Fit encoders on categorical features
        for col in available_categorical:
            encoders[col] = LabelEncoder()
            encoders[col].fit(df_processed[col].astype(str))
    
    # Apply transformations
    df_final = df_processed.copy()
    
    # Scale numerical features
    numerical_cols = available_numerical + available_derived
    if numerical_cols and scaler:
        df_final[numerical_cols] = scaler.transform(df_processed[numerical_cols])
    
    # Encode categorical features
    for col in available_categorical:
        if col in encoders:
            df_final[col] = encoders[col].transform(df_processed[col].astype(str))
    
    return df_final, scaler, encoders


def select_features_for_training(df: pd.DataFrame) -> pd.DataFrame:
    """
    Select final features for training
    """
    print("Selecting features for training...")
    return df


def get_all_engineered_features() -> List[str]:
    """
    Get list of all engineered features
    """
    return NUMERICAL_FEATURES_RAW + CATEGORICAL_FEATURES + BOOLEAN_FEATURES


def neutralize_cultural_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Remove cultural bias from transactions
    """
    print("Neutralizing cultural transactions...")
    return df
    
    # 7. Transaction type patterns
    print("Computing transaction type features...")
    
    # Transaction type risk based on amounts
    txn_type_stats = df_features.groupby('transaction_type').agg({
        'amount': ['mean', 'std', 'count']
    }).reset_index()
    
    txn_type_stats.columns = ['transaction_type'] + [f'txn_type_{col[0]}_{col[1]}' for col in txn_type_stats.columns[1:]]
    df_features = df_features.merge(txn_type_stats, on='transaction_type', how='left')

    # Ensure required merged txn_type_* columns exist
    safe_txn_cols = ['txn_type_amount_mean', 'txn_type_amount_std', 'txn_type_amount_count']
    for col in safe_txn_cols:
        if col not in df_features.columns:
            df_features[col] = 0
    
    # Amount deviation from transaction type norm
    df_features['amount_deviation_from_txn_type'] = (
        df_features['amount'] - df_features['txn_type_amount_mean']
    )
    
    # 8. Cross-feature interactions
    print("Computing cross-feature interactions...")
    
    # Time-amount interactions
    df_features['night_high_amount'] = (
        (df_features['transaction_hour_of_day'].isin([0, 1, 2, 3, 4, 5])) & 
        (df_features['amount'] > df_features['amount'].quantile(0.8))
    ).astype(int)
    
    df_features['weekend_high_amount'] = (
        df_features['is_weekend'] & 
        (df_features['amount'] > df_features['amount'].quantile(0.8))
    ).astype(int)
    
    # New device + high amount
    if 'is_new_device' in df_features.columns:
        df_features['new_device_high_amount'] = (
            df_features['is_new_device'] & 
            (df_features['amount'] > df_features['amount'].quantile(0.7))
        ).astype(int)
    
    # New location + high amount
    if 'is_new_location' in df_features.columns:
        df_features['new_location_high_amount'] = (
            df_features['is_new_location'] & 
            (df_features['amount'] > df_features['amount'].quantile(0.7))
        ).astype(int)
    
    # 9. Account age features
    if 'account_age_days' in df_features.columns:
        df_features['is_new_account'] = (df_features['account_age_days'] < 30).astype(int)
        df_features['is_very_new_account'] = (df_features['account_age_days'] < 7).astype(int)
        df_features['account_age_months'] = df_features['account_age_days'] / 30.44
    
    print(f"Feature engineering complete. Dataset shape: {df_features.shape}")
    
    return df_features

def neutralize_cultural_transactions(df: pd.DataFrame, feature_columns: List[str]) -> pd.DataFrame:
    """
    Neutralize cultural/seasonal transactions to reduce false positives
    """
    df_neutralized = df.copy()
    
    # Check if cultural indicator exists
    if 'is_cultural' not in df_neutralized.columns:
        # Create simple cultural transaction indicator based on patterns
        df_neutralized['is_cultural'] = (
            (df_neutralized['is_weekend'] == 1) & 
            (df_neutralized['amount'] > df_neutralized['amount'].quantile(0.8)) &
            (df_neutralized['transaction_type'].isin(['p2p_transfer', 'cash_out']))
        ).astype(int)
    
    # Reduce anomaly signals for cultural transactions
    cultural_mask = df_neutralized['is_cultural'] == 1
    
    if cultural_mask.sum() > 0:
        print(f"Neutralizing {cultural_mask.sum()} cultural transactions")
        
        # Reduce amount-based features for cultural transactions
        amount_features = [col for col in feature_columns if 'amount' in col.lower()]
        for feature in amount_features:
            if feature in df_neutralized.columns:
                df_neutralized.loc[cultural_mask, feature] *= 0.5  # Reduce signal by 50%
    
    return df_neutralized

def apply_preprocessors_chunked(df: pd.DataFrame, scaler: StandardScaler, 
                              encoders: Dict[str, LabelEncoder], 
                              feature_columns: List[str]) -> np.ndarray:
    """
    Apply preprocessing (scaling and encoding) to feature columns
    """
    df_processed = df[feature_columns].copy()
    
    # Apply label encoders to categorical features
    for feature, encoder in encoders.items():
        if feature in df_processed.columns:
            # Handle unseen categories
            df_processed[feature] = df_processed[feature].astype(str).fillna('unknown')
            unique_values = set(encoder.classes_)
            df_processed.loc[~df_processed[feature].isin(unique_values), feature] = 'unknown'
            
            try:
                df_processed[feature] = encoder.transform(df_processed[feature])
            except ValueError:
                # If 'unknown' is not in training classes, use most frequent class
                most_frequent = encoder.classes_[0]
                df_processed.loc[~df_processed[feature].isin(encoder.classes_), feature] = most_frequent
                df_processed[feature] = encoder.transform(df_processed[feature])
    
    # Apply scaling
    scaled_features = scaler.transform(df_processed)
    
    return scaled_features

def get_all_engineered_features() -> List[str]:
    """
    Return list of all features after engineering
    """
    base_features = NUMERICAL_FEATURES_RAW + CATEGORICAL_FEATURES + BOOLEAN_FEATURES
    
    derived_features = [
        # Amount features
        'amount_log', 'amount_sqrt', 'amount_zscore_global', 'amount_zscore_user',
        'amount_deviation_from_user_median', 'amount_ratio_to_user_max',
        'is_user_amount_outlier', 'amount_deviation_from_txn_type',
        
        # User behavioral features
        'user_amount_mean', 'user_amount_std', 'user_amount_median', 'user_amount_min',
        'user_amount_max', 'user_amount_count', 'user_hour_diversity', 'user_day_diversity',
        'user_location_diversity', 'user_device_diversity', 'user_transaction_type_diversity',
        
        # Temporal features
        'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'time_since_last_hours',
        'is_rapid_transaction', 'is_very_rapid_transaction', 'is_high_frequency_day',
        
        # Location features
        'location_user_id_nunique', 'is_rare_location', 'is_high_amount_location',
        
        # Network/device features
        'network_amount_mean', 'device_avg_amount', 'device_user_count',
        
        # Transaction type features
        'txn_type_amount_mean', 'txn_type_amount_std',
        
        # Cross-feature interactions
        'night_high_amount', 'weekend_high_amount', 'new_device_high_amount',
        'new_location_high_amount',
        
        # Account features
        'is_new_account', 'is_very_new_account', 'account_age_months',
        
        # Cultural indicator
        'is_cultural'
    ]
    
    return base_features + derived_features

def select_features_for_training(df: pd.DataFrame, exclude_target_leakage: bool = True) -> List[str]:
    """
    Select optimal features for training, excluding potential target leakage
    """
    all_features = get_all_engineered_features()
    available_features = [f for f in all_features if f in df.columns]
    
    if exclude_target_leakage:
        # Remove features that might leak target information
        leakage_features = [
            'transaction_id', 'user_id', 'timestamp', 'status', 'description',
            'sender_account', 'receiver_account', 'merchant_id'
        ]
        available_features = [f for f in available_features if f not in leakage_features]
    
    # Prioritize most important features for fraud detection
    priority_features = [
        # Amount-based (most important)
        'amount', 'amount_log', 'amount_zscore_user', 'amount_deviation_from_user_median',
        'is_user_amount_outlier', 'amount_ratio_to_user_max',
        
        # User behavior
        'user_total_transactions', 'user_total_amount_spent', 'user_hour_diversity',
        'user_location_diversity', 'user_transaction_type_diversity',
        
        # Temporal patterns
        'transaction_hour_of_day', 'transaction_day_of_week', 'hour_sin', 'hour_cos',
        'is_weekend', 'is_business_hours', 'time_since_last_hours', 'is_rapid_transaction',
        
        # Location/device context
        'is_new_location', 'is_new_device', 'is_rare_location', 'location_user_id_nunique',
        
        # Transaction patterns
        'transaction_type', 'network_operator', 'device_type',
        'daily_transaction_count', 'amount_percentile_for_user',
        
        # Cross-feature interactions
        'night_high_amount', 'weekend_high_amount', 'new_device_high_amount',
        
        # Account context
        'account_age_days', 'is_new_account'
    ]
    
    # Return features that are both priority and available
    selected_features = [f for f in priority_features if f in available_features]
    
    print(f"Selected {len(selected_features)} features for training")
    return selected_features