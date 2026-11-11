from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Prediction
from . import ml_service
from users.models import UserProfile


class PredictionCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data

        missing = [f for f in ml_service.FEATURES if data.get(f) in (None, "")]
        if missing:
            return Response(
                {"error": f"Missing fields: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # explain=False -> SHAP/LIME abhi band (baad mein True karenge)
            result = ml_service.predict(data, explain=False)
        except Exception as e:
            return Response(
                {"error": f"Model prediction failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            prediction_obj = Prediction.objects.create(
                patient=request.user,
                age=data.get("age"),
                gender=data.get("gender"),
                family_history=data.get("family_history"),
                hemoglobin=data.get("hemoglobin"),
                fetal_hemoglobin=data.get("fetal_hemoglobin"),
                rdw_cv=data.get("rdw_cv"),
                serum_ferritin=data.get("serum_ferritin"),
                brca1_expression=data.get("brca1_expression"),
                p53_mutation=data.get("p53_mutation"),
                sweat_chloride=data.get("sweat_chloride"),
                sickled_rbc_percent=data.get("sickled_rbc_percent"),
                il6_level=data.get("il6_level"),
                predicted_disease=result["predicted_disease"],
                disease_code=result["disease_code"],
                confidence=result["confidence"],
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to save prediction: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result["id"] = prediction_obj.id
        result["created_at"] = prediction_obj.created_at.strftime("%Y-%m-%d")

        return Response(result, status=status.HTTP_201_CREATED)


class PredictionHistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # PRIVACY: har user (doctor ho ya patient) sirf apni banayi hui predictions dekhta hai.
        predictions = Prediction.objects.filter(patient=request.user).order_by('-created_at')

        history_list = []
        for p in predictions:
            history_list.append({
                "id": p.id,
                "predicted_disease": p.predicted_disease,
                "disease_code": p.disease_code,
                "confidence": p.confidence,
                "risk_level": "High" if p.confidence >= 70 else ("Moderate" if p.confidence >= 40 else "Low"),
                "created_at": p.created_at.strftime("%Y-%m-%d"),
                "patient_name": p.patient.username if p.patient else "Unknown"
            })
        return Response(history_list, status=status.HTTP_200_OK)


class PredictionExplainView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Sirf doctor account clinical reasoning dekh sakta hai
        profile = UserProfile.objects.filter(user=request.user).first()
        role = profile.role if profile else ("doctor" if request.user.is_staff else "patient")
        if role != "doctor":
            return Response(
                {"error": "Only doctor accounts can view clinical reasoning."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Sirf apni banayi hui prediction
        try:
            p = Prediction.objects.get(pk=pk, patient=request.user)
        except Prediction.DoesNotExist:
            return Response({"error": "Prediction not found."}, status=status.HTTP_404_NOT_FOUND)

        raw = {k: getattr(p, k) for k in ml_service.FEATURES}

        if not p.explanation:
            try:
                res = ml_service.predict(raw, explain=True)
            except Exception as e:
                return Response({"error": f"Explanation failed: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            if not res["shap_values"] and not res["lime_explanation"]:
                return Response(
                    {"error": res.get("shap_error") or res.get("lime_error") or "Explanation unavailable."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            p.explanation = {
                "probabilities": res["probabilities"],
                "shap_values": res["shap_values"],
                "lime_explanation": res["lime_explanation"],
            }
            p.save(update_fields=["explanation"])

        data = dict(p.explanation)
        data["inputs"] = raw
        return Response(data, status=status.HTTP_200_OK)


class RagChatView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        query = request.data.get("query", "").strip()

        if not query:
            return Response({"answer": "Please ask a question or mention a condition."}, status=status.HTTP_400_BAD_REQUEST)

        query_lower = query.lower()

        greetings = ["hi", "hello", "hey", "how are you", "salam", "assalam o alaikum", "good morning", "good evening"]
        if query_lower in greetings or any(g in query_lower for g in ["who are you", "what can you do"]):
            answer = "Hello! I am your AI Health and Genetic Knowledge Assistant. You can ask me about Thalassemia, Hemophilia, Liver Cancer, BRCA1, Sweat Chloride, or general health queries. How can I help you today?"
            return Response({"answer": answer}, status=status.HTTP_200_OK)

        knowledge_base = {
            "thalassemia": (
                "**Thalassemia:** An inherited blood disorder causing reduced hemoglobin and red blood cells. "
                "• *Symptoms:* Fatigue, weakness, pale skin, bone deformities. "
                "• *Diagnosis:* CBC and hemoglobin electrophoresis. "
                "• *Disclaimer:* Educational demo response only."
            ),
            "hemophilia": (
                "**Hemophilia:** A rare genetic disorder where blood doesn't clot normally due to lack of clotting proteins. "
                "• *Symptoms:* Excessive bleeding, large bruises, joint pain from internal bleeding. "
                "• *Diagnosis:* Specialized clotting factor blood tests. "
                "• *Disclaimer:* Educational demo response only."
            ),
            "liver cancer": (
                "**Liver Cancer:** Malignancy originating in liver cells. "
                "• *Symptoms:* Unexpected weight loss, upper abdominal pain, jaundice (yellowing of skin/eyes), fatigue. "
                "• *Diagnosis:* Imaging (CT/MRI) and liver function tests. "
                "• *Disclaimer:* Educational demo response only."
            ),
            "sweat chloride": (
                "**Sweat Chloride Test:** The gold standard diagnostic tool for Cystic Fibrosis. "
                "• *Purpose:* Measures chloride concentration in sweat to assess salt transport abnormalities. "
                "• *Disclaimer:* Educational demo response only."
            ),
            "brca1": (
                "**BRCA1 Gene & Breast Cancer:** A tumor suppressor gene whose mutations increase lifetime risk for breast and ovarian cancers. "
                "• *Testing:* Targeted next-generation sequencing (NGS). "
                "• *Disclaimer:* Educational demo response only."
            )
        }

        matched_answer = None
        for key, text in knowledge_base.items():
            if key in query_lower:
                matched_answer = text
                break

        if matched_answer:
            answer = matched_answer
        else:
            answer = (
                f"Regarding '{query}': This topic involves evaluating specific clinical symptoms and medical history. "
                "Please consult a qualified healthcare professional for accurate diagnosis and guidance. "
                "*(Disclaimer: Educational demo response only.)*"
            )

        return Response({"answer": answer}, status=status.HTTP_200_OK)