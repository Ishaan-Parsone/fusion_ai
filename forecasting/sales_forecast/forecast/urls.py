from django.urls import path
from .views import forecast_data

urlpatterns = [
    path('api/forecast-data/<int:product_id>/', forecast_data, name='forecast_data'),
]
