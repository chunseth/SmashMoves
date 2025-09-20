#!/usr/bin/env python3
"""
Neural Network for Smash Ultimate Tier Prediction

Trains a neural network to predict character tier rankings based on frame data,
character stats, and derived metrics.
"""

import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.neural_network import MLPRegressor, MLPClassifier
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

class TierPredictor:
    def __init__(self, data_file: str = "neural_network_training_data.json"):
        """Initialize the tier predictor with training data"""
        self.data_file = data_file
        self.data = None
        self.X = None
        self.y = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.models = {}
        self.feature_names = []
        
    def load_data(self):
        """Load and preprocess the training data"""
        print("Loading training data...")
        
        with open(self.data_file, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        
        print(f"Loaded {len(self.data)} character examples")
        
        # Extract features and targets
        features = []
        scores = []
        tiers = []
        characters = []
        
        for example in self.data:
            features.append(list(example["features"].values()))
            scores.append(example["score"])
            tiers.append(example["tier"])
            characters.append(example["character"])
        
        # Store feature names
        self.feature_names = list(self.data[0]["features"].keys())
        
        self.X = np.array(features)
        self.y_scores = np.array(scores)  # For regression
        self.y_tiers = np.array(tiers)    # For classification
        self.characters = characters
        
        print(f"Feature matrix shape: {self.X.shape}")
        print(f"Features: {self.feature_names}")
        
        return self.X, self.y_scores, self.y_tiers
    
    def preprocess_data(self, test_size: float = 0.2, random_state: int = 42):
        """Split and scale the data"""
        print("Preprocessing data...")
        
        # Split the data
        self.X_train, self.X_test, self.y_train_scores, self.y_test_scores = train_test_split(
            self.X, self.y_scores, test_size=test_size, random_state=random_state
        )
        
        self.X_train, self.X_test, self.y_train_tiers, self.y_test_tiers = train_test_split(
            self.X, self.y_tiers, test_size=test_size, random_state=random_state
        )
        
        # Scale the features
        self.X_train_scaled = self.scaler.fit_transform(self.X_train)
        self.X_test_scaled = self.scaler.transform(self.X_test)
        
        # Encode tier labels for classification
        self.y_train_tiers_encoded = self.label_encoder.fit_transform(self.y_train_tiers)
        self.y_test_tiers_encoded = self.label_encoder.transform(self.y_test_tiers)
        
        print(f"Training set: {self.X_train.shape[0]} examples")
        print(f"Test set: {self.X_test.shape[0]} examples")
        
        return self.X_train_scaled, self.X_test_scaled, self.y_train_scores, self.y_test_scores
    
    def train_models(self):
        """Train multiple models for comparison"""
        print("Training models...")
        
        # Regression models (predicting tier scores)
        print("Training regression models...")
        
        # Neural Network Regressor
        self.models['neural_net_regressor'] = MLPRegressor(
            hidden_layer_sizes=(100, 50),
            activation='relu',
            solver='adam',
            alpha=0.001,
            learning_rate='adaptive',
            max_iter=1000,
            random_state=42
        )
        
        # Random Forest Regressor
        self.models['random_forest_regressor'] = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        
        # Classification models (predicting tier categories)
        print("Training classification models...")
        
        # Neural Network Classifier
        self.models['neural_net_classifier'] = MLPClassifier(
            hidden_layer_sizes=(100, 50),
            activation='relu',
            solver='adam',
            alpha=0.001,
            learning_rate='adaptive',
            max_iter=1000,
            random_state=42
        )
        
        # Random Forest Classifier
        self.models['random_forest_classifier'] = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        
        # Train all models
        for name, model in self.models.items():
            print(f"Training {name}...")
            if 'regressor' in name:
                model.fit(self.X_train_scaled, self.y_train_scores)
            else:
                model.fit(self.X_train_scaled, self.y_train_tiers_encoded)
        
        print("All models trained successfully!")
    
    def evaluate_models(self):
        """Evaluate all trained models"""
        print("\n" + "="*50)
        print("MODEL EVALUATION")
        print("="*50)
        
        results = {}
        
        for name, model in self.models.items():
            print(f"\n--- {name.upper()} ---")
            
            if 'regressor' in name:
                # Regression evaluation
                y_pred = model.predict(self.X_test_scaled)
                mse = mean_squared_error(self.y_test_scores, y_pred)
                mae = mean_absolute_error(self.y_test_scores, y_pred)
                r2 = r2_score(self.y_test_scores, y_pred)
                
                print(f"Mean Squared Error: {mse:.3f}")
                print(f"Mean Absolute Error: {mae:.3f}")
                print(f"R² Score: {r2:.3f}")
                
                results[name] = {
                    'type': 'regression',
                    'mse': mse,
                    'mae': mae,
                    'r2': r2,
                    'predictions': y_pred
                }
                
            else:
                # Classification evaluation
                y_pred_encoded = model.predict(self.X_test_scaled)
                y_pred = self.label_encoder.inverse_transform(y_pred_encoded)
                
                print(f"Accuracy: {model.score(self.X_test_scaled, self.y_test_tiers_encoded):.3f}")
                print("\nClassification Report:")
                print(classification_report(self.y_test_tiers, y_pred))
                
                results[name] = {
                    'type': 'classification',
                    'accuracy': model.score(self.X_test_scaled, self.y_test_tiers_encoded),
                    'predictions': y_pred,
                    'true_labels': self.y_test_tiers
                }
        
        return results
    
    def cross_validate_models(self, cv_folds: int = 5):
        """Perform cross-validation on all models"""
        print(f"\nPerforming {cv_folds}-fold cross-validation...")
        
        cv_results = {}
        
        for name, model in self.models.items():
            if 'regressor' in name:
                scores = cross_val_score(model, self.X_train_scaled, self.y_train_scores, cv=cv_folds, scoring='r2')
                print(f"{name}: R² = {scores.mean():.3f} (+/- {scores.std() * 2:.3f})")
            else:
                scores = cross_val_score(model, self.X_train_scaled, self.y_train_tiers_encoded, cv=cv_folds, scoring='accuracy')
                print(f"{name}: Accuracy = {scores.mean():.3f} (+/- {scores.std() * 2:.3f})")
            
            cv_results[name] = scores
        
        return cv_results
    
    def analyze_feature_importance(self):
        """Analyze feature importance using Random Forest"""
        print("\n" + "="*50)
        print("FEATURE IMPORTANCE ANALYSIS")
        print("="*50)
        
        # Get feature importance from Random Forest models
        rf_reg = self.models['random_forest_regressor']
        rf_clf = self.models['random_forest_classifier']
        
        importance_reg = rf_reg.feature_importances_
        importance_clf = rf_clf.feature_importances_
        
        # Create importance dataframe
        importance_df = pd.DataFrame({
            'Feature': self.feature_names,
            'Regression_Importance': importance_reg,
            'Classification_Importance': importance_clf
        })
        
        # Sort by regression importance
        importance_df = importance_df.sort_values('Regression_Importance', ascending=False)
        
        print("Top 10 Most Important Features (Regression):")
        for i, row in importance_df.head(10).iterrows():
            print(f"{row['Feature']}: {row['Regression_Importance']:.3f}")
        
        return importance_df
    
    def predict_character_tier(self, character_name: str = None, features: np.ndarray = None):
        """Predict tier for a specific character"""
        if character_name:
            # Find character in training data
            char_idx = None
            for i, char in enumerate(self.characters):
                if char == character_name:
                    char_idx = i
                    break
            
            if char_idx is None:
                print(f"Character '{character_name}' not found in training data")
                return None
            
            features = self.X[char_idx:char_idx+1]
        
        if features is None:
            print("Please provide either character_name or features")
            return None
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Get predictions from all models
        predictions = {}
        
        for name, model in self.models.items():
            if 'regressor' in name:
                score_pred = model.predict(features_scaled)[0]
                # Convert score back to tier
                tier_pred = self._score_to_tier(score_pred)
                predictions[name] = {
                    'predicted_score': score_pred,
                    'predicted_tier': tier_pred
                }
            else:
                tier_encoded = model.predict(features_scaled)[0]
                tier_pred = self.label_encoder.inverse_transform([tier_encoded])[0]
                predictions[name] = {
                    'predicted_tier': tier_pred
                }
        
        return predictions
    
    def _score_to_tier(self, score: float) -> str:
        """Convert numerical score back to tier"""
        tier_mapping = {
            (9.5, 10.5): 'S+',
            (8.5, 9.5): 'S',
            (7.5, 8.5): 'S-',
            (6.5, 7.5): 'A+',
            (5.5, 6.5): 'A',
            (4.5, 5.5): 'A-',
            (3.5, 4.5): 'B+',
            (2.5, 3.5): 'B-',
            (1.75, 2.5): 'C+',
            (1.25, 1.75): 'C-',
            (0.75, 1.25): 'D',
            (0, 0.75): 'E'
        }
        
        for (min_score, max_score), tier in tier_mapping.items():
            if min_score <= score < max_score:
                return tier
        
        return 'Unknown'
    
    def plot_results(self, results: Dict):
        """Create visualizations of the results"""
        print("\nCreating visualizations...")
        
        # Set up the plotting style
        plt.style.use('seaborn-v0_8')
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Smash Ultimate Tier Prediction Results', fontsize=16)
        
        # 1. Regression predictions vs actual
        reg_pred = results['neural_net_regressor']['predictions']
        axes[0, 0].scatter(self.y_test_scores, reg_pred, alpha=0.7)
        axes[0, 0].plot([self.y_test_scores.min(), self.y_test_scores.max()], 
                       [self.y_test_scores.min(), self.y_test_scores.max()], 'r--', lw=2)
        axes[0, 0].set_xlabel('Actual Tier Score')
        axes[0, 0].set_ylabel('Predicted Tier Score')
        axes[0, 0].set_title('Neural Network Regressor: Predicted vs Actual')
        axes[0, 0].grid(True, alpha=0.3)
        
        # 2. Classification confusion matrix
        clf_pred = results['neural_net_classifier']['predictions']
        clf_true = results['neural_net_classifier']['true_labels']
        
        # Get unique labels for confusion matrix
        unique_labels = sorted(list(set(clf_true) | set(clf_pred)))
        cm = confusion_matrix(clf_true, clf_pred, labels=unique_labels)
        
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=unique_labels, yticklabels=unique_labels, ax=axes[0, 1])
        axes[0, 1].set_xlabel('Predicted Tier')
        axes[0, 1].set_ylabel('Actual Tier')
        axes[0, 1].set_title('Neural Network Classifier: Confusion Matrix')
        
        # 3. Feature importance
        importance_df = self.analyze_feature_importance()
        top_features = importance_df.head(10)
        
        axes[1, 0].barh(range(len(top_features)), top_features['Regression_Importance'])
        axes[1, 0].set_yticks(range(len(top_features)))
        axes[1, 0].set_yticklabels(top_features['Feature'])
        axes[1, 0].set_xlabel('Feature Importance')
        axes[1, 0].set_title('Top 10 Most Important Features')
        axes[1, 0].invert_yaxis()
        
        # 4. Tier distribution
        tier_counts = {}
        for tier in clf_true:
            tier_counts[tier] = tier_counts.get(tier, 0) + 1
        
        axes[1, 1].bar(tier_counts.keys(), tier_counts.values())
        axes[1, 1].set_xlabel('Tier')
        axes[1, 1].set_ylabel('Number of Characters')
        axes[1, 1].set_title('Tier Distribution in Test Set')
        axes[1, 1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        plt.savefig('tier_prediction_results.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("Visualizations saved as 'tier_prediction_results.png'")

def main():
    """Main function to run the tier prediction analysis"""
    print("Smash Ultimate Tier Prediction Neural Network")
    print("=" * 50)
    
    # Initialize predictor
    predictor = TierPredictor()
    
    # Load and preprocess data
    X, y_scores, y_tiers = predictor.load_data()
    predictor.preprocess_data()
    
    # Train models
    predictor.train_models()
    
    # Evaluate models
    results = predictor.evaluate_models()
    
    # Cross-validation
    cv_results = predictor.cross_validate_models()
    
    # Feature importance analysis
    importance_df = predictor.analyze_feature_importance()
    
    # Create visualizations
    predictor.plot_results(results)
    
    # Example predictions
    print("\n" + "="*50)
    print("EXAMPLE PREDICTIONS")
    print("="*50)
    
    example_characters = ['steve', 'ganondorf', 'mario', 'joker', 'link']
    for char in example_characters:
        if char in predictor.characters:
            predictions = predictor.predict_character_tier(char)
            print(f"\n{char.upper()}:")
            for model_name, pred in predictions.items():
                if 'regressor' in model_name:
                    print(f"  {model_name}: {pred['predicted_tier']} (score: {pred['predicted_score']:.2f})")
                else:
                    print(f"  {model_name}: {pred['predicted_tier']}")
    
    print("\nAnalysis complete!")
    print("Results saved as 'tier_prediction_results.png'")

if __name__ == "__main__":
    main()
