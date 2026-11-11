from django.urls import path
from .views import (
    PredictionCreateView,
    PredictionHistoryView,
    PredictionExplainView,
    RagChatView,
)

urlpatterns = [
    path('predict/', PredictionCreateView.as_view(), name='predict-disease'),
    path('history/', PredictionHistoryView.as_view(), name='prediction-history'),
    path('<int:pk>/explain/', PredictionExplainView.as_view(), name='prediction-explain'),
    path('rag-chat/', RagChatView.as_view(), name='rag-chat'),
]