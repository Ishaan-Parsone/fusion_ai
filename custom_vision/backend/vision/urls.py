from django.urls import path
from .views import predict_pretrained, predict_custom

urlpatterns = [
    path('predict/pretrained/', predict_pretrained, name='predict_pretrained'),
    path('predict/custom/', predict_custom, name='predict_custom'),
]
