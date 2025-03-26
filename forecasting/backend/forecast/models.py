from django.db import models
from django.utils import timezone

class ForecastData(models.Model):
    product_number = models.IntegerField()
    date = models.DateField()
    forecasted_sales = models.FloatField()
    generated_at = models.DateTimeField(default=timezone.now)


    class Meta:
        unique_together = ('product_number', 'date')  # Ensure unique forecasts for each product on each date
