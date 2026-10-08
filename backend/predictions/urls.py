from django.urls import path
from .views import PredictionCreateView, PredictionHistoryView, RagChatView

urlpatterns = [
    path('predict/', PredictionCreateView.as_view(), name='predict-disease'),
    path('history/', PredictionHistoryView.as_view(), name='prediction-history'),
    path('rag-chat/', RagChatView.as_view(), name='rag-chat'),
]