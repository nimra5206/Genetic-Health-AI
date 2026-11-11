from django.db import models
from django.contrib.auth.models import User


class Prediction(models.Model):
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    explanation = models.JSONField(null=True, blank=True)

    # =========================
    # 12 RAW DATASET FEATURES
    # =========================

    age = models.IntegerField()

    gender = models.IntegerField()

    family_history = models.IntegerField()

    hemoglobin = models.FloatField()

    fetal_hemoglobin = models.FloatField()

    rdw_cv = models.FloatField()

    serum_ferritin = models.FloatField()

    brca1_expression = models.FloatField()

    p53_mutation = models.IntegerField()

    sweat_chloride = models.FloatField()

    sickled_rbc_percent = models.FloatField()

    il6_level = models.FloatField()

    # =========================
    # MODEL OUTPUT
    # =========================

    predicted_disease = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    disease_code = models.IntegerField(
        blank=True,
        null=True
    )

    confidence = models.FloatField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prediction {self.id} - {self.predicted_disease}"