"""
backend/predictions/ml_service.py
Real model prediction + real SHAP + real LIME.
Artifacts folder: backend/predictions/ml_artifacts/{model.joblib, training_sample.joblib}
"""
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ART_DIR = Path(__file__).resolve().parent / "ml_artifacts"

# Frontend/request keys (NewPrediction.jsx payload)
FEATURES = [
    "age", "gender", "family_history", "hemoglobin", "fetal_hemoglobin", "rdw_cv",
    "serum_ferritin", "brca1_expression", "p53_mutation", "sweat_chloride",
    "sickled_rbc_percent", "il6_level",
]
# Training dataset column names (same order as FEATURES)
TRAIN_COLS = [
    "Age", "Gender", "Family_History", "Hemoglobin", "Fetal_Hemoglobin", "RDW_CV",
    "Serum_Ferritin", "BRCA1_Expression", "p53_Mutation", "Sweat_Chloride",
    "Sickled_RBC_Percent", "IL6_Level",
]
DISEASES = {
    0: "Thalassemia",
    1: "Hemophilia",
    2: "Breast Cancer",
    3: "Sickle Cell Anemia",
    4: "Cystic Fibrosis",
}
CATEGORICAL_IDX = [1, 2, 8]  # gender, family_history, p53_mutation

MIN_CONFIDENCE = 0.50  # isse kam ho to result "Inconclusive" mana jaye


BASE_DIR = Path(__file__).resolve().parent


@lru_cache(maxsize=1)
def _load_model():
    import pickle
    import sys

    # model.pkl ke andar gh_features ki custom classes/functions ho sakti hain,
    # pickle ko woh module import hona zaroori hai.
    try:
        from . import gh_features
        sys.modules.setdefault("gh_features", gh_features)
    except ImportError:
        pass

    candidates = [BASE_DIR / "final_model.pkl", BASE_DIR / "model.pkl", ART_DIR / "model.pkl",
                  BASE_DIR / "model.joblib", ART_DIR / "model.joblib"]
    path = next((p for p in candidates if p.exists()), None)
    if path is None:
        raise FileNotFoundError("final_model.pkl predictions/ folder mein nahi mili")

    try:
        model = joblib.load(path)
    except Exception:
        with open(path, "rb") as fh:
            model = pickle.load(fh)

    if isinstance(model, dict):  # agar dict mein save kiya tha
        for k in ("model", "pipeline", "clf", "stacking"):
            if k in model:
                model = model[k]
                break
    return model


@lru_cache(maxsize=1)
def _load_background():
    # sirf SHAP/LIME (explain=True) ke liye chahiye
    sample = joblib.load(ART_DIR / "training_sample.joblib")
    return sample[TRAIN_COLS]


def prepare(raw: dict) -> pd.DataFrame:
    """Request data -> model input. Agar training mein gh_features.py ki engineered
    features use hui thi to unhein yahan lagayein (training jaisa hi)."""
    row = [float(raw[k]) for k in FEATURES]
    return pd.DataFrame([row], columns=TRAIN_COLS)


def _name(code: int) -> str:
    """Disease name: pehle gh_features.DISEASE_MAP, warna local mapping."""
    try:
        from .gh_features import DISEASE_MAP
        return DISEASE_MAP.get(code, DISEASES.get(code, "Unknown"))
    except Exception:
        return DISEASES.get(code, "Unknown")


def _risk_level(top_prob: float) -> str:
    if top_prob >= 0.70:
        return "High"
    if top_prob >= 0.40:
        return "Moderate"
    return "Low"


def _shap_values(model, X, background, top_idx):
    import shap

    def f(a):
        return model.predict_proba(pd.DataFrame(a, columns=TRAIN_COLS))

    bg = shap.kmeans(background.values, 20)
    explainer = shap.KernelExplainer(f, bg)
    sv = explainer.shap_values(X.values, nsamples=200)
    # shap versions alag shape deti hain
    if isinstance(sv, list):
        vals = np.array(sv[top_idx])[0]
    else:
        sv = np.array(sv)
        vals = sv[0, :, top_idx] if sv.ndim == 3 else sv[0]
    return [
        {"feature": TRAIN_COLS[i], "key": FEATURES[i],
         "value": float(X.iloc[0, i]), "shap": float(vals[i])}
        for i in range(len(FEATURES))
    ]


def _lime_rules(model, X, background, top_idx):
    from lime.lime_tabular import LimeTabularExplainer

    explainer = LimeTabularExplainer(
        background.values,
        feature_names=TRAIN_COLS,
        class_names=[DISEASES[i] for i in sorted(DISEASES)],
        categorical_features=CATEGORICAL_IDX,
        mode="classification",
        discretize_continuous=True,
        random_state=42,
    )

    def f(a):
        return model.predict_proba(pd.DataFrame(a, columns=TRAIN_COLS))

    exp = explainer.explain_instance(
        X.values[0], f, labels=[top_idx], num_features=8, num_samples=1000
    )
    return [{"rule": r, "weight": float(w)} for r, w in exp.as_list(label=top_idx)]


def predict(raw: dict, explain: bool = True) -> dict:
    model = _load_model()
    X = prepare(raw)

    proba = model.predict_proba(X)[0]
    classes = list(model.classes_)
    top_idx = int(np.argmax(proba))
    top_class = int(classes[top_idx])
    top_prob = float(proba[top_idx])

    result = {
        "predicted_disease": _name(top_class),
        "low_confidence": top_prob < MIN_CONFIDENCE,
        "most_likely_disease": _name(top_class),
        "disease_code": top_class,
        "confidence": round(top_prob * 100, 1),
        "risk_level": _risk_level(top_prob),
        "probabilities": {_name(int(c)): round(float(p) * 100, 1) for c, p in zip(classes, proba)},
        "shap_values": [],
        "lime_explanation": [],
    }

    if explain:
        background = _load_background()
        try:
            result["shap_values"] = _shap_values(model, X, background, top_idx)
        except Exception as e:  # prediction phir bhi wapas jaye
            result["shap_error"] = str(e)
        try:
            result["lime_explanation"] = _lime_rules(model, X, background, top_idx)
        except Exception as e:
            result["lime_error"] = str(e)
    return result