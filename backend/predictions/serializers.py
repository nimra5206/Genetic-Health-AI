from rest_framework import serializers
from .models import Prediction


class PredictionSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(
        read_only=True, 
        required=False, 
        allow_null=True
    )

    class Meta:
        model = Prediction
        fields = "__all__"
        read_only_fields = [
            "patient",
            "predicted_disease",
            "disease_code",
            "confidence",
            "created_at",
        ]