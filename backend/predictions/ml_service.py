import os
import sys
import joblib
import pandas as pd

# Import gh_features from the current package
from . import gh_features
from .gh_features import DISEASE_MAP

# Register 'gh_features' in sys.modules so joblib can unpickle custom components
sys.modules['gh_features'] = gh_features

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "final_model.pkl"
)

# Load pickle model safely
model = joblib.load(MODEL_PATH)


def predict_disease(data):
    feature_order = [
        "Age",
        "Gender",
        "Family_History",
        "Hemoglobin",
        "Fetal_Hemoglobin",
        "RDW_CV",
        "Serum_Ferritin",
        "BRCA1_Expression",
        "p53_Mutation",
        "Sweat_Chloride",
        "Sickled_RBC_Percent",
        "IL6_Level",
    ]

    # Convert keys to match exact casing (handles lower/camelCase from React)
    data_normalized = {str(k).strip(): v for k, v in data.items()}

    # Clean & Safely Parse Features
    formatted_data = {}
    for col in feature_order:
        # Fallback search for lower-case keys from frontend payloads
        val = data_normalized.get(col) or data_normalized.get(col.lower()) or 0
        try:
            formatted_data[col] = float(val) if val is not None else 0.0
        except (ValueError, TypeError):
            formatted_data[col] = 0.0

    # Create DataFrame with ordered features
    df = pd.DataFrame([formatted_data], columns=feature_order)

    # Predict
    prediction = model.predict(df)
    disease_code = int(prediction[0])

    # Get Disease Name from Mapping
    disease_name = DISEASE_MAP.get(
        disease_code,
        "Unknown"
    )

    # Calculate Confidence / Probability
    confidence = None
    if hasattr(model, "predict_proba"):
        try:
            probabilities = model.predict_proba(df)[0]
            confidence = round(float(max(probabilities) * 100), 2)
        except Exception:
            confidence = None

    return {
        "disease_code": disease_code,
        "predicted_disease": disease_name,
        "confidence": confidence,
    }