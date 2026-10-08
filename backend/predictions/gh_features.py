
# Feature engineering for Genetic Health AI.
# Import this module wherever the pickled pipeline (final_model.pkl) is loaded,
# including the Task 2 Django backend.
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

RAW_FEATURES = ["Age", "Gender", "Family_History", "Hemoglobin", "Fetal_Hemoglobin",
                "RDW_CV", "Serum_Ferritin", "BRCA1_Expression", "p53_Mutation",
                "Sweat_Chloride", "Sickled_RBC_Percent", "IL6_Level"]

NON_NEGATIVE = ["Hemoglobin", "Fetal_Hemoglobin", "RDW_CV", "Serum_Ferritin",
                "BRCA1_Expression", "Sweat_Chloride", "Sickled_RBC_Percent", "IL6_Level"]

DISEASE_MAP = {0: "Thalassemia", 1: "Hemophilia", 2: "Breast Cancer",
               3: "Sickle Cell Anemia", 4: "Cystic Fibrosis"}


def clean_frame(df):
    # Applies the exact cleaning rule used during training: clip biologically
    # impossible negative biomarker values to zero.
    d = df.copy()
    for c in NON_NEGATIVE:
        if c in d.columns:
            d[c] = pd.to_numeric(d[c], errors="coerce").clip(lower=0.0)
    return d


def engineer_features(df):
    # Domain-justified derived features. Each encodes an established clinical
    # relationship, not an arbitrary transformation.
    d = clean_frame(df)
    eps = 1e-6
    # HbF as a proportion of total Hb - standard thalassemia / SCA discriminator
    d["HbF_Ratio"] = d["Fetal_Hemoglobin"] / (d["Hemoglobin"] + eps)
    # Iron store per unit haemoglobin - separates iron deficiency from thalassemia
    d["Ferritin_Hb_Ratio"] = d["Serum_Ferritin"] / (d["Hemoglobin"] + eps)
    # Anisocytosis relative to Hb - Mentzer-style index analogue
    d["RDW_Hb_Ratio"] = d["RDW_CV"] / (d["Hemoglobin"] + eps)
    # Distance below the lower end of the normal adult Hb range
    d["Anemia_Severity"] = np.clip(13.5 - d["Hemoglobin"], 0, None)
    # Clinical decision thresholds
    d["Sickle_Positive"] = (d["Sickled_RBC_Percent"] >= 5).astype(int)
    d["Sweat_Cl_Positive"] = (d["Sweat_Chloride"] >= 60).astype(int)   # CF diagnostic cut-off
    d["IL6_High"] = (d["IL6_Level"] >= 10).astype(int)
    # Combined oncogenic burden: expression amplified when p53 is mutated
    d["Oncogenic_Score"] = d["BRCA1_Expression"] * (1 + d["p53_Mutation"])
    # Inflammation / oncogene interaction
    d["Inflam_BRCA"] = d["IL6_Level"] * d["BRCA1_Expression"]
    return d


ENGINEERED_FEATURES = ["HbF_Ratio", "Ferritin_Hb_Ratio", "RDW_Hb_Ratio", "Anemia_Severity",
                       "Sickle_Positive", "Sweat_Cl_Positive", "IL6_High",
                       "Oncogenic_Score", "Inflam_BRCA"]
ALL_FEATURES = RAW_FEATURES + ENGINEERED_FEATURES


class FeatureBuilder(BaseEstimator, TransformerMixin):
    # Pipeline step 1: clean -> engineer -> select the chosen feature subset.
    # Stateless with respect to the data, so it cannot leak test information.
    def __init__(self, selected_features=None, engineer=True):
        self.selected_features = selected_features
        self.engineer = engineer

    def fit(self, X, y=None):
        self.feature_names_in_ = list(pd.DataFrame(X).columns)
        return self

    def transform(self, X):
        d = pd.DataFrame(X).copy()
        d = engineer_features(d) if self.engineer else clean_frame(d)
        if self.selected_features is not None:
            missing = [c for c in self.selected_features if c not in d.columns]
            if missing:
                raise ValueError("Missing required columns: " + str(missing))
            d = d[list(self.selected_features)]
        return d

    def get_feature_names_out(self, input_features=None):
        if self.selected_features is not None:
            return np.asarray(self.selected_features, dtype=object)
        return np.asarray(ALL_FEATURES, dtype=object)
