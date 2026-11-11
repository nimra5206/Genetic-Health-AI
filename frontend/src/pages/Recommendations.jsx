import React from "react";
import { useNavigate } from "react-router-dom";
import "./Recommendations.css";

function Recommendations() {
  const navigate = useNavigate();

  let user = {};
  let lastPrediction = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = String(user.id ?? user.email ?? user.username ?? user.name ?? "anon").toLowerCase();
    lastPrediction = JSON.parse(localStorage.getItem(`gh_last_prediction:${uid}`) || "{}");
  } catch (error) {
    console.error("Error reading localStorage:", error);
  }

  const storedRole =
    localStorage.getItem("role") ||
    user.role ||
    user.user_type ||
    "patient";

  const isDoctor = String(storedRole).toLowerCase() === "doctor";

  const predictedDisease =
    lastPrediction.predicted_disease ||
    lastPrediction.disease ||
    lastPrediction.result ||
    lastPrediction.prediction ||
    "Genetic Health Assessment";

  const rawConfidence =
    lastPrediction.confidence_value ??
    (typeof lastPrediction.confidence === "string"
      ? parseFloat(lastPrediction.confidence.replace("%", ""))
      : lastPrediction.confidence) ??
    lastPrediction.probability ??
    null;

  let formattedConfidence = null;

  if (rawConfidence !== null && rawConfidence !== undefined) {
    const num = Number(rawConfidence);

    if (!Number.isNaN(num)) {
      if (num > 1 && num <= 100) {
        formattedConfidence = num.toFixed(1);
      } else if (num > 0 && num <= 1) {
        formattedConfidence = (num * 100).toFixed(1);
      }
    }
  }

  const getDynamicRecommendations = (diseaseName, roleIsDoctor) => {
    const norm = String(diseaseName || "").trim().toLowerCase();

    /* Hemophilia */
    if (norm.includes("hemophilia")) {
      return roleIsDoctor
        ? [
            "Review the prediction together with the patient's clinical and family history.",
            "Consider confirmatory coagulation and factor testing when clinically appropriate.",
            "Document bleeding history and monitor for recurrent bleeding or joint-related symptoms.",
            "Consider referral to an appropriate hematology or genetic specialist.",
          ]
        : [
            "Discuss the prediction with a qualified healthcare professional before making health decisions.",
            "Keep a record of unusual bleeding, bruising, or recurrent joint symptoms.",
            "Avoid self-starting medicines or supplements without professional advice.",
            "Ask a healthcare professional whether genetic counseling or confirmatory testing is appropriate.",
          ];
    }

    /* Thalassemia */
    if (norm.includes("thalassemia")) {
      return roleIsDoctor
        ? [
            "Review the result alongside CBC, hemoglobin analysis, iron studies, and relevant clinical history.",
            "Consider confirmatory hematology or molecular testing when clinically appropriate.",
            "Review family history and consider genetic counseling where indicated.",
            "Monitor relevant hematologic findings according to the patient's clinical care plan.",
          ]
        : [
            "Discuss the prediction with a qualified healthcare professional.",
            "Do not start iron supplements solely because of this prediction unless advised by a clinician.",
            "Keep copies of relevant blood-test and family-history information for your appointment.",
            "Ask whether confirmatory testing or genetic counseling is appropriate.",
          ];
    }

    /* Cystic Fibrosis */
    if (norm.includes("cystic") || norm.includes("fibrosis")) {
      return roleIsDoctor
        ? [
            "Review the prediction with symptoms, family history, and relevant respiratory or gastrointestinal findings.",
            "Consider confirmatory sweat testing and/or molecular testing according to clinical guidelines.",
            "Review nutritional and respiratory status where clinically relevant.",
            "Consider referral to an appropriate specialist or genetic counselor.",
          ]
        : [
            "Discuss the prediction with a qualified healthcare professional.",
            "Keep any previous respiratory, gastrointestinal, or sweat-test reports available.",
            "Do not interpret the AI result as a confirmed diagnosis.",
            "Ask whether confirmatory sweat testing or genetic testing is appropriate.",
          ];
    }

    /* Sickle Cell */
    if (norm.includes("sickle") || norm.includes("sickle cell")) {
      return roleIsDoctor
        ? [
            "Review the result with CBC, hemoglobin analysis, clinical history, and family history.",
            "Consider confirmatory hemoglobin testing or molecular testing when appropriate.",
            "Document relevant episodes and monitor the patient's clinical status according to care requirements.",
            "Consider hematology or genetic counseling referral when indicated.",
          ]
        : [
            "Discuss the prediction with a qualified healthcare professional.",
            "Keep records of previous blood tests and relevant family history.",
            "Do not start or stop treatment based only on the AI prediction.",
            "Ask whether confirmatory hemoglobin or genetic testing is appropriate.",
          ];
    }

    /* Breast / Hereditary Cancer */
    if (
      norm.includes("breast") ||
      norm.includes("cancer") ||
      norm.includes("hereditary")
    ) {
      return roleIsDoctor
        ? [
            "Review the prediction with personal and family cancer history.",
            "Consider appropriate confirmatory genetic testing where clinically indicated.",
            "Interpret BRCA1/p53-related findings using validated laboratory and clinical information.",
            "Consider referral to genetics or an appropriate oncology specialist when indicated.",
          ]
        : [
            "Discuss the prediction with a qualified healthcare professional.",
            "Collect relevant personal and family cancer history before a genetics appointment.",
            "Do not interpret a BRCA1 or p53-related prediction as confirmation of cancer.",
            "Ask whether formal genetic counseling or confirmatory testing is appropriate.",
          ];
    }

    /* Default / General Assessment */
    return roleIsDoctor
      ? [
          "Review the AI prediction alongside the patient's complete clinical and family history.",
          "Consider appropriate confirmatory laboratory or molecular testing.",
          "Document relevant findings and monitor the patient according to the clinical context.",
          "Consider referral to an appropriate specialist or genetic counselor when indicated.",
        ]
      : [
          "Discuss the AI prediction with a qualified healthcare professional.",
          "Keep relevant laboratory and family-history information available for review.",
          "Do not make treatment decisions based only on the AI prediction.",
          "Ask whether confirmatory testing or genetic counseling is appropriate.",
        ];
  };

  const recommendationsList = getDynamicRecommendations(
    predictedDisease,
    isDoctor
  );

  return (
    <div className={`recommendations-page ${!isDoctor ? "patient-theme" : ""}`}>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <div className="header-badge-row">
            {formattedConfidence && (
              <span className="confidence-pill">
                Confidence: {formattedConfidence}%
              </span>
            )}
          </div>

          <h1>
            {isDoctor
              ? "Clinical Recommendations & Care Plan"
              : "Personalized Health Action Plan"}
          </h1>
        </div>

        <span className="status-badge">Plan Active</span>
      </div>

      {/* Card */}
      <div className="recommendations-card">
        <div className="card-header">
          <div>
            <h2>
              {isDoctor
                ? `Clinical Decision-Support Steps for ${predictedDisease}`
                : `Recommended Next Steps for ${predictedDisease}`}
            </h2>
          </div>
        </div>

        <ul className="recommendations-list">
          {recommendationsList.map((item, index) => (
            <li
              key={index}
              className="recommendation-item"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <span className="bullet-num">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p>{item}</p>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="card-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() =>
              navigate(isDoctor ? "/doctor-results" : "/results")
            }
          >
            ← View Full Test Result
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={() => window.print()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print Care Plan
          </button>
        </div>
      </div>
    </div>
  );
}

export default Recommendations;