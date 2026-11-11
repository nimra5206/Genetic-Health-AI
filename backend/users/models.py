from django.db import models

# Create your models here.
from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    ROLE_CHOICES = [("patient", "patient"), ("doctor", "doctor")]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="patient")

    def __str__(self):
        return f"{self.user.username} ({self.role})"