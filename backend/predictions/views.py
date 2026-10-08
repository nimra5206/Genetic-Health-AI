from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Prediction

class PredictionCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        
        # Demo/FYP ke liye sample prediction logic
        predicted_disease = "Thalassemia"
        disease_code = 1
        confidence = 92.5

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
                predicted_disease=predicted_disease,
                disease_code=disease_code,
                confidence=confidence
            )
        except Exception as e:
            return Response({"error": f"Failed to save prediction: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        response_data = {
            "id": prediction_obj.id,
            "predicted_disease": prediction_obj.predicted_disease,
            "disease_code": prediction_obj.disease_code,
            "confidence": prediction_obj.confidence,
            "risk_level": "High",
            "subclass": "Major Variant",
            "maternal_risk": 60.0,
            "paternal_risk": 45.0,
            "overall_risk": 52.5,
            "created_at": prediction_obj.created_at.strftime("%Y-%m-%d")
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)


class PredictionHistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_role = getattr(user, 'role', 'patient').lower()
        
        if user_role == 'doctor':
            predictions = Prediction.objects.all().order_by('-created_at')
        else:
            predictions = Prediction.objects.filter(patient=user).order_by('-created_at')

        history_list = []
        for p in predictions:
            history_list.append({
                "id": p.id,
                "predicted_disease": p.predicted_disease,
                "disease_code": p.disease_code,
                "confidence": p.confidence,
                "risk_level": "Moderate" if p.confidence < 80 else "High",
                "created_at": p.created_at.strftime("%Y-%m-%d"),
                "patient_name": p.patient.username if p.patient else "Unknown"
            })

        return Response(history_list, status=status.HTTP_200_OK)


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