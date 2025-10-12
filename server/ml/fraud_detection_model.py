import pandas as pd
import numpy as np
import psycopg2
import os
import joblib
import json
from dotenv import load_dotenv
from datetime import datetime
import time
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

# Multiple ML algorithms for comparison
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.neighbors import LocalOutlierFactor
from sklearn.covariance import EllipticEnvelope
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import silhouette_score
from sklearn.model_selection import ParameterGrid

# Import from separate feature engineering module
from feature_engineering import (
    calculate_derived_features_chunked,
    apply_preprocessors_chunked,
    neutralize_cultural_transactions,
    select_features_for_training,
    get_all_engineered_features
)

load_dotenv()

class ComprehensiveFraudDetectionModel:
    """
    Multi-algorithm unsupervised fraud detection system with proper evaluation
    """
    
    def __init__(self):
        self.models = {}
        self.scaler = None
        self.encoders = {}
        self.feature_names = []
        self.evaluation_results = {}
        self.best_model_name = None
        
        
        self.algorithm_configs = {
            'isolation_forest': {
                'model_class': IsolationForest,
                'param_grid': {
                    'contamination': [0.01, 0.015, 0.02, 0.025],
                    'n_estimators': [100, 200, 300],
                    'max_samples': ['auto', 0.8, 0.9],
                    'random_state': [42]
                },
                'description': 'Isolation Forest - Isolates anomalies by randomly selecting features and split values'
            },
            'one_class_svm': {
                'model_class': OneClassSVM,
                'param_grid': {
                    'nu': [0.01, 0.015, 0.02, 0.025],
                    'kernel': ['rbf'],  # Reduced for faster training
                    'gamma': ['scale', 'auto'],
                },
                'description': 'One-Class SVM - Learns decision boundary around normal data'
            },
            'local_outlier_factor': {
                'model_class': LocalOutlierFactor,
                'param_grid': {
                    'n_neighbors': [20, 30, 40],
                    'contamination': [0.01, 0.015, 0.02],
                    'algorithm': ['auto'],
                },
                'description': 'Local Outlier Factor - Detects anomalies based on local density'
            },
            'elliptic_envelope': {
                'model_class': EllipticEnvelope,
                'param_grid': {
                    'contamination': [0.01, 0.015, 0.02],
                    'support_fraction': [None, 0.9],
                },
                'description': 'Elliptic Envelope - Assumes data follows Gaussian distribution'
            }
        }
    
    def get_db_connection(self, max_retries: int = 3, retry_delay: int = 5):
        """Establishes database connection with retry logic"""
        for attempt in range(max_retries):
            try:
                conn = psycopg2.connect(
                    dbname=os.getenv("DB_DATABASE"),
                    user=os.getenv("DB_USER"), 
                    password=os.getenv("DB_PASSWORD"),
                    host=os.getenv("DB_HOST"),
                    port=os.getenv("DB_PORT"),
                    connect_timeout=30
                )
                return conn
            except psycopg2.OperationalError as e:
                print(f"Connection attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
        return None
    
    def load_data_from_db(self, sample_size: int = 100000) -> pd.DataFrame:
        """Load data from database"""
        print("Connecting to database and loading data...")
        conn = self.get_db_connection()
        if not conn:
            raise Exception("Failed to connect to database")
        
        try:
            # Query with all the new columns from realistic data generation
            query = """
            SELECT 
                user_id, amount, timestamp, status, transaction_type, 
                sender_account, receiver_account, location_city, location_country,
                device_type, os_type, merchant_category, 
                is_new_location, is_new_device, transaction_hour_of_day, transaction_day_of_week,
                risk_score, sender_msisdn, receiver_msisdn, telco_provider as network_operator
            FROM transactions 
            WHERE status = 'completed'
            ORDER BY timestamp DESC
            LIMIT %s;
            """
            
            df = pd.read_sql_query(query, conn, params=[sample_size])
            print(f"Loaded {len(df)} transactions from database")
            
            if df.empty:
                raise Exception("No data found in database")
            
            # Ensure amount is float
            df['amount'] = df['amount'].astype(float)
            
            return df
            
        finally:
            conn.close()
    
    def prepare_training_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """Prepare data for training using feature engineering module"""
        print("Starting feature engineering pipeline...")
        
        # Step 1: Calculate derived features using feature engineering module
        df_engineered = calculate_derived_features_chunked(df)
        
        # Step 2: Select optimal features for training
        feature_names = select_features_for_training(df_engineered)
        self.feature_names = feature_names
        
        print(f"Selected {len(feature_names)} features for training")
        
        # Step 3: Handle missing values and prepare data
        df_processed = df_engineered[feature_names].copy()
        
        # Separate numerical and categorical features
        numerical_features = []
        categorical_features = []
        
        for feature in feature_names:
            if feature in df_processed.columns:
                if df_processed[feature].dtype in ['object', 'category']:
                    categorical_features.append(feature)
                else:
                    numerical_features.append(feature)
        
        print(f"Found {len(numerical_features)} numerical and {len(categorical_features)} categorical features")
        
        # Fill missing values
        for feature in numerical_features:
            if feature in df_processed.columns:
                df_processed[feature] = df_processed[feature].fillna(df_processed[feature].median())
        
        for feature in categorical_features:
            if feature in df_processed.columns:
                df_processed[feature] = df_processed[feature].astype(str).fillna('unknown')
        
        # Step 4: Encode categorical features
        self.encoders = {}
        for feature in categorical_features:
            if feature in df_processed.columns:
                le = LabelEncoder()
                df_processed[feature] = le.fit_transform(df_processed[feature])
                self.encoders[feature] = le
                print(f"Encoded {feature}: {len(le.classes_)} unique values")
        
        # Step 5: Ensure all features are numeric before scaling
        for feature in feature_names:
            if feature in df_processed.columns:
                try:
                    df_processed[feature] = pd.to_numeric(df_processed[feature], errors='coerce')
                    df_processed[feature] = df_processed[feature].fillna(df_processed[feature].median())
                except:
                    print(f"Warning: Could not convert {feature} to numeric, dropping it")
                    df_processed = df_processed.drop(columns=[feature])
                    feature_names.remove(feature)
        
        # Update feature names after potential drops
        feature_names = [f for f in feature_names if f in df_processed.columns]
        self.feature_names = feature_names
        
        # Step 6: Scale all features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(df_processed)
        
        # Step 7: Apply neutralization to the same processed data
        # Create a copy for neutralization
        df_for_neutralization = df_engineered.copy()
        df_neutralized = neutralize_cultural_transactions(df_for_neutralization, feature_names)
        
        # Apply the same preprocessing to neutralized data
        df_neutralized_processed = df_neutralized[feature_names].copy()
        
        # Fill missing values in neutralized data
        for feature in feature_names:
            if feature in df_neutralized_processed.columns:
                if feature in categorical_features and feature in self.encoders:
                    # Apply same encoding
                    df_neutralized_processed[feature] = df_neutralized_processed[feature].astype(str).fillna('unknown')
                    # Handle unseen categories
                    unknown_mask = ~df_neutralized_processed[feature].isin(self.encoders[feature].classes_)
                    if unknown_mask.any():
                        df_neutralized_processed.loc[unknown_mask, feature] = self.encoders[feature].classes_[0]
                    df_neutralized_processed[feature] = self.encoders[feature].transform(df_neutralized_processed[feature])
                else:
                    # Numerical feature
                    df_neutralized_processed[feature] = pd.to_numeric(df_neutralized_processed[feature], errors='coerce')
                    df_neutralized_processed[feature] = df_neutralized_processed[feature].fillna(df_neutralized_processed[feature].median())
        
        # Scale neutralized data
        X_neutralized = self.scaler.transform(df_neutralized_processed)
        
        print(f"Data preparation complete. Final shape: {X_neutralized.shape}")
        print(f"Using {len(feature_names)} features: {feature_names[:5]}...")
        
        return X_neutralized, feature_names
    
    def evaluate_anomaly_detection(self, X: np.ndarray, anomaly_scores: np.ndarray, 
                                 model_name: str) -> Dict[str, float]:
        """Evaluate anomaly detection performance using unsupervised metrics"""
        
        # Convert anomaly scores to binary predictions (bottom 2% as anomalies)
        contamination_threshold = np.percentile(anomaly_scores, 2)
        anomaly_predictions = (anomaly_scores <= contamination_threshold).astype(int)
        
        metrics = {}
        
        # 1. Silhouette score - measures cluster quality
        try:
            if len(np.unique(anomaly_predictions)) > 1 and len(X) > 100:
                sample_size = min(5000, len(X))  # Limit sample for performance
                idx = np.random.choice(len(X), sample_size, replace=False)
                metrics['silhouette_score'] = silhouette_score(X[idx], anomaly_predictions[idx])
            else:
                metrics['silhouette_score'] = -1
        except:
            metrics['silhouette_score'] = -1
        
        # 2. Score distribution analysis
        metrics['anomaly_score_mean'] = np.mean(anomaly_scores)
        metrics['anomaly_score_std'] = np.std(anomaly_scores)
        metrics['anomaly_score_range'] = np.max(anomaly_scores) - np.min(anomaly_scores)
        
        # 3. Separation quality
        normal_scores = anomaly_scores[anomaly_predictions == 0]
        anomalous_scores = anomaly_scores[anomaly_predictions == 1]
        
        if len(normal_scores) > 0 and len(anomalous_scores) > 0:
            metrics['separation_quality'] = abs(np.mean(normal_scores) - np.mean(anomalous_scores))
        else:
            metrics['separation_quality'] = 0
        
        # 4. Detection rate
        metrics['anomaly_percentage'] = np.mean(anomaly_predictions) * 100
        
        # 5. Score consistency
        metrics['normal_score_variance'] = np.var(normal_scores) if len(normal_scores) > 0 else float('inf')
        
        print(f"{model_name} - Silhouette: {metrics['silhouette_score']:.4f}, "
              f"Separation: {metrics['separation_quality']:.4f}, "
              f"Anomaly %: {metrics['anomaly_percentage']:.2f}%")
        
        return metrics
    
    def train_single_model(self, X: np.ndarray, algorithm_name: str, 
                          params: Dict[str, Any]) -> Tuple[Any, Dict[str, float]]:
        """Train and evaluate a single model configuration"""
        
        config = self.algorithm_configs[algorithm_name]
        model_class = config['model_class']
        
        try:
            model = model_class(**params)
            
            if algorithm_name == 'local_outlier_factor':
                # LOF uses fit_predict
                anomaly_predictions = model.fit_predict(X)
                anomaly_scores = model.negative_outlier_factor_
            else:
                # Other models use fit + score methods
                model.fit(X)
                if hasattr(model, 'decision_function'):
                    anomaly_scores = model.decision_function(X)
                elif hasattr(model, 'score_samples'):
                    anomaly_scores = model.score_samples(X)
                else:
                    anomaly_scores = model.predict(X)
            
            # Evaluate model
            evaluation_metrics = self.evaluate_anomaly_detection(
                X, anomaly_scores, f"{algorithm_name}_{str(params)[:30]}"
            )
            
            return model, evaluation_metrics
            
        except Exception as e:
            print(f"Error training {algorithm_name}: {e}")
            return None, {'error': str(e)}
    
    def hyperparameter_search(self, X: np.ndarray, algorithm_name: str, max_trials: int = 6):
        """Perform hyperparameter search for algorithm"""
        print(f"\n--- Hyperparameter search for {algorithm_name} ---")
        
        param_grid = self.algorithm_configs[algorithm_name]['param_grid']
        param_combinations = list(ParameterGrid(param_grid))
        
        # Limit combinations for faster training
        if len(param_combinations) > max_trials:
            param_combinations = np.random.choice(param_combinations, max_trials, replace=False)
        
        best_model = None
        best_score = float('-inf')
        best_params = None
        best_metrics = None
        
        for params in param_combinations:
            model, metrics = self.train_single_model(X, algorithm_name, params)
            
            if model is not None and 'error' not in metrics:
                # Enhanced composite score for higher confidence
                composite_score = (
                    metrics['silhouette_score'] * 0.35 +
                    metrics['separation_quality'] * 0.25 +
                    (1 / (metrics['normal_score_variance'] + 1)) * 0.2 +
                    (1 - metrics.get('anomaly_percentage', 0.05) / 100) * 0.1 +  # Prefer reasonable anomaly rates
                    metrics.get('confidence_boost', 0) * 0.1  # Boost for confidence-enhancing features
                )
                
                if composite_score > best_score:
                    best_score = composite_score
                    best_model = model
                    best_params = params
                    best_metrics = metrics
        
        return best_model, best_params, best_metrics, best_score
    
    def train_all_algorithms(self, X: np.ndarray) -> Dict[str, Any]:
        """Train and compare all algorithms"""
        print("\n" + "="*60)
        print("TRAINING ALL ALGORITHMS")
        print("="*60)
        
        results = {}
        
        for algorithm_name in self.algorithm_configs.keys():
            print(f"\nTraining {algorithm_name.upper().replace('_', ' ')}")
            print(f"Description: {self.algorithm_configs[algorithm_name]['description']}")
            print("-" * 50)
            
            try:
                model, params, metrics, score = self.hyperparameter_search(X, algorithm_name)
                
                if model is not None:
                    results[algorithm_name] = {
                        'model': model,
                        'best_params': params,
                        'metrics': metrics,
                        'composite_score': score,
                        'description': self.algorithm_configs[algorithm_name]['description']
                    }
                    print(f"✅ {algorithm_name} completed - Score: {score:.4f}")
                else:
                    results[algorithm_name] = {'error': 'Training failed'}
                    print(f"❌ {algorithm_name} failed")
                
            except Exception as e:
                print(f"❌ {algorithm_name} failed with error: {e}")
                results[algorithm_name] = {'error': str(e)}
        
        return results
    
    def select_best_model(self, results: Dict[str, Any]) -> str:
        """Select best performing model"""
        print("\n" + "="*60)
        print("MODEL COMPARISON AND SELECTION")
        print("="*60)
        
        valid_results = {name: result for name, result in results.items() 
                        if 'error' not in result and result['model'] is not None}
        
        if not valid_results:
            raise Exception("No valid models were trained successfully")
        
        # Print comparison table
        print(f"\n{'Algorithm':<20} {'Silhouette':<12} {'Separation':<12} {'Anomaly %':<10} {'Score':<10}")
        print("-" * 70)
        
        for name, result in valid_results.items():
            metrics = result['metrics']
            print(f"{name:<20} {metrics['silhouette_score']:<12.4f} "
                  f"{metrics['separation_quality']:<12.4f} "
                  f"{metrics['anomaly_percentage']:<10.2f} "
                  f"{result['composite_score']:<10.4f}")
        
        # Select best model
        best_model_name = max(valid_results.keys(), 
                            key=lambda x: valid_results[x]['composite_score'])
        
        print(f"\n🏆 BEST MODEL: {best_model_name.upper().replace('_', ' ')}")
        print(f"Composite Score: {valid_results[best_model_name]['composite_score']:.4f}")
        print(f"Best Parameters: {valid_results[best_model_name]['best_params']}")
        
        return best_model_name
    
    def generate_comprehensive_report(self, results: Dict[str, Any], best_model_name: str, 
                                    training_data_size: int) -> Dict[str, Any]:
        """Generate comprehensive training report"""
        
        report = {
            'training_summary': {
                'timestamp': datetime.now().isoformat(),
                'best_model': best_model_name,
                'training_data_size': training_data_size,
                'feature_count': len(self.feature_names),
                'models_trained': len([r for r in results.values() if 'error' not in r]),
                'failed_models': len([r for r in results.values() if 'error' in r])
            },
            
            'unsupervised_learning_justification': {
                'why_unsupervised': [
                    "Real-world fraud detection lacks reliable ground truth labels",
                    "Fraud patterns evolve rapidly, making supervised learning quickly outdated",
                    "Unsupervised methods can detect novel, previously unknown fraud patterns",
                    "Reduces dependency on potentially biased historical fraud classifications",
                    "Better suited for detecting zero-day fraud attacks and emerging threats"
                ],
                'evaluation_methodology': [
                    "Silhouette Score: Measures how well anomalies are separated from normal transactions",
                    "Separation Quality: Quantifies the distance between normal and anomalous score distributions",
                    "Score Consistency: Lower variance in normal transactions indicates better pattern learning",
                    "Detection Rate: Ensures reasonable anomaly detection percentage (typically 1-3%)"
                ]
            },
            
            'model_comparison': {},
            'feature_engineering': {
                'total_features': len(self.feature_names),
                'feature_categories': {
                    'amount_based': len([f for f in self.feature_names if 'amount' in f.lower()]),
                    'temporal': len([f for f in self.feature_names if any(t in f.lower() for t in ['hour', 'day', 'time'])]),
                    'behavioral': len([f for f in self.feature_names if 'user_' in f.lower()]),
                    'location': len([f for f in self.feature_names if 'location' in f.lower()]),
                    'device': len([f for f in self.feature_names if 'device' in f.lower()])
                },
                'selected_features': self.feature_names
            },
            
            'deployment_recommendations': {
                'best_model': best_model_name,
                'recommended_threshold': "Use 98th percentile of anomaly scores for flagging",
                'retraining_frequency': "Monthly retraining recommended due to evolving fraud patterns",
                'monitoring_metrics': [
                    "Daily anomaly detection rate (should be 1-3%)",
                    "Average anomaly scores over time",
                    "Feature importance drift detection",
                    "Model performance degradation alerts"
                ]
            }
        }
        
        # Add detailed model comparison
        for name, result in results.items():
            if 'error' not in result:
                report['model_comparison'][name] = {
                    'description': result.get('description', ''),
                    'best_params': result.get('best_params', {}),
                    'performance_metrics': result.get('metrics', {}),
                    'composite_score': result.get('composite_score', 0)
                }
            else:
                report['model_comparison'][name] = {'training_failed': result['error']}
        
        return report
    
    def save_model_and_report(self, results: Dict[str, Any], best_model_name: str, 
                            report: Dict[str, Any]):
        """Save trained model and comprehensive report"""
        print("\n" + "="*50)
        print("SAVING MODEL AND GENERATING REPORTS")
        print("="*50)
        
        # Create directories
        os.makedirs('trained_models', exist_ok=True)
        os.makedirs('reports', exist_ok=True)
        
        # Save best model with all necessary components
        best_model_data = {
            'model': results[best_model_name]['model'],
            'model_type': best_model_name,
            'best_params': results[best_model_name]['best_params'],
            'scaler': self.scaler,
            'encoders': self.encoders,
            'feature_names': self.feature_names,
            'performance_metrics': results[best_model_name]['metrics'],
            'training_timestamp': datetime.now().isoformat(),
            'model_version': '2.0',
            'algorithm_description': self.algorithm_configs[best_model_name]['description']
        }
        
        # Save to both locations for compatibility
        joblib.dump(best_model_data, 'trained_models/best_fraud_detection_model.joblib')
        
        # Create legacy directory if it doesn't exist
        os.makedirs('ml/trained_models', exist_ok=True)
        joblib.dump(best_model_data, 'ml/trained_models/isolation_forest_model.joblib')  # Legacy path
        
        # Save comparison of all models
        joblib.dump(results, 'trained_models/all_models_comparison.joblib')
        
        # Save JSON report
        with open('reports/comprehensive_training_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        # Save Markdown report for easy reading
        self.generate_markdown_report(report, 'reports/model_training_report.md')
        
        print("✅ Model saved to: trained_models/best_fraud_detection_model.joblib")
        print("✅ Legacy model saved to: ml/trained_models/isolation_forest_model.joblib")
        print("✅ Detailed report saved to: reports/comprehensive_training_report.json")
        print("✅ Summary report saved to: reports/model_training_report.md")
    
    def generate_markdown_report(self, report: Dict[str, Any], filename: str):
        """Generate human-readable markdown report"""
        
        with open(filename, 'w', encoding='utf-8') as f:  # Fix: Add UTF-8 encoding
            f.write("# Fraud Detection Model Training Report\n\n")
            
            # Executive Summary
            f.write("## Executive Summary\n\n")
            summary = report['training_summary']
            f.write(f"- **Training Date**: {datetime.fromisoformat(summary['timestamp']).strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"- **Best Model**: {summary['best_model'].replace('_', ' ').title()}\n")
            f.write(f"- **Training Data Size**: {summary['training_data_size']:,} transactions\n")
            f.write(f"- **Features Used**: {summary['feature_count']}\n")
            f.write(f"- **Models Successfully Trained**: {summary['models_trained']}\n\n")
            
            # Why Unsupervised Learning
            f.write("## Why Unsupervised Learning?\n\n")
            for reason in report['unsupervised_learning_justification']['why_unsupervised']:
                f.write(f"- {reason}\n")
            f.write("\n")
            
            # Model Comparison
            f.write("## Algorithm Comparison Results\n\n")
            f.write("| Algorithm | Silhouette Score | Separation Quality | Anomaly Detection % | Composite Score | Status |\n")
            f.write("|-----------|------------------|--------------------|--------------------|-----------------|--------|\n")
            
            for name, result in report['model_comparison'].items():
                if 'training_failed' not in result:
                    metrics = result['performance_metrics']
                    f.write(f"| {name.replace('_', ' ').title()} | "
                           f"{metrics['silhouette_score']:.4f} | "
                           f"{metrics['separation_quality']:.4f} | "
                           f"{metrics['anomaly_percentage']:.2f}% | "
                           f"{result['composite_score']:.4f} | Success |\n")  # Remove emoji
                else:
                    f.write(f"| {name.replace('_', ' ').title()} | - | - | - | - | Failed |\n")  # Remove emoji
            
            # Feature Engineering
            f.write("\n## Feature Engineering Summary\n\n")
            feat_eng = report['feature_engineering']
            f.write(f"**Total Features**: {feat_eng['total_features']}\n\n")
            f.write("**Feature Categories**:\n")
            for category, count in feat_eng['feature_categories'].items():
                f.write(f"- {category.replace('_', ' ').title()}: {count} features\n")
            
            # Deployment Recommendations
            f.write("\n## Deployment Recommendations\n\n")
            deploy = report['deployment_recommendations']
            f.write(f"**Selected Model**: {deploy['best_model'].replace('_', ' ').title()}\n\n")
            f.write(f"**Anomaly Threshold**: {deploy['recommended_threshold']}\n\n")
            f.write(f"**Retraining Schedule**: {deploy['retraining_frequency']}\n\n")
            f.write("**Monitoring Checklist**:\n")
            for metric in deploy['monitoring_metrics']:
                f.write(f"- [ ] {metric}\n")
    
    def train_comprehensive_model(self, sample_size: int = 150000):
        """Main training pipeline"""
        print("\n" + "="*80)
        print("🚀 COMPREHENSIVE FRAUD DETECTION MODEL TRAINING")
        print("="*80)
        print("Addressing supervisor requirements:")
        print("✓ Multiple algorithm comparison")
        print("✓ Unsupervised learning justification") 
        print("✓ Proper evaluation without ground truth")
        print("✓ Enhanced feature engineering")
        print("✓ Comprehensive reporting")
        print("="*80)
        
        start_time = time.time()
        
        try:
            # Step 1: Load data
            print("\n📊 STEP 1: Loading data from database")
            df = self.load_data_from_db(sample_size)
            
            # Step 2: Feature engineering and preprocessing
            print("\n🔧 STEP 2: Feature engineering and preprocessing")
            X, feature_names = self.prepare_training_data(df)
            
            # Step 3: Train all algorithms
            print("\n🤖 STEP 3: Training multiple algorithms")
            results = self.train_all_algorithms(X)
            
            # Step 4: Select best model
            print("\n🏆 STEP 4: Model selection")
            best_model_name = self.select_best_model(results)
            
            # Step 5: Generate comprehensive report
            print("\n📝 STEP 5: Generating comprehensive report")
            report = self.generate_comprehensive_report(results, best_model_name, len(df))
            
            # Step 6: Save everything
            print("\n💾 STEP 6: Saving model and reports")
            self.save_model_and_report(results, best_model_name, report)
            
            training_time = time.time() - start_time
            
            print("\n" + "="*80)
            print("🎉 TRAINING COMPLETED SUCCESSFULLY!")
            print("="*80)
            print(f"⏱️  Total Training Time: {training_time/60:.2f} minutes")
            print(f"🥇 Best Model: {best_model_name.replace('_', ' ').title()}")
            print(f"📈 Training Data: {len(df):,} transactions")
            print(f"🔍 Features Used: {len(feature_names)}")
            print(f"📊 Detection Rate: {results[best_model_name]['metrics']['anomaly_percentage']:.2f}%")
            print("\n📁 Generated Files:")
            print("   • trained_models/best_fraud_detection_model.joblib")
            print("   • ml/trained_models/isolation_forest_model.joblib (legacy)")
            print("   • reports/comprehensive_training_report.json")
            print("   • reports/model_training_report.md")
            print("\n✅ Ready for deployment and supervisor review!")
            
            return best_model_name, results, report
            
        except Exception as e:
            print(f"\n❌ TRAINING FAILED: {e}")
            raise e

# Legacy function for backward compatibility
def train_unsupervised_model():
    """Legacy function that calls the comprehensive training"""
    print("⚠️  Using legacy training function - upgrading to comprehensive model...")
    trainer = ComprehensiveFraudDetectionModel()
    return trainer.train_comprehensive_model()

if __name__ == "__main__":
    # Run comprehensive model training
    trainer = ComprehensiveFraudDetectionModel()
    best_model, results, report = trainer.train_comprehensive_model(sample_size=200000)
    
    print(f"\n🎯 Training Summary:")
    print(f"   Best Model: {best_model}")
    print(f"   Check reports/ directory for detailed analysis")
    print(f"   Model ready for integration with frontend!")