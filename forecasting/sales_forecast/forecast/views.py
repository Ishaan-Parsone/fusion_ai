import pandas as pd
from prophet import Prophet
from django.http import JsonResponse
from .models import ForecastData

def forecast_data(request, product_id):
    # Load the dataset and filter for the specific product
    df = pd.read_csv('Main_dataset.csv')
    product_df = df[df['product'] == product_id].copy()

    # Prepare data for Prophet
    product_df['date'] = pd.to_datetime(product_df['date'])
    product_df = product_df.rename(columns={'date': 'ds', 'sales': 'y'})

    # Generate or retrieve forecasted data
    forecast_data = ForecastData.objects.filter(product_number=product_id)
    if not forecast_data.exists():
        # Fit Prophet model and forecast future sales
        model = Prophet()
        model.fit(product_df)
        future = model.make_future_dataframe(periods=365)
        forecast = model.predict(future)

        # Save forecast data to the database
        ForecastData.objects.filter(product_number=product_id).delete()
        for _, row in forecast.iterrows():
            ForecastData.objects.create(
                product_number=product_id,
                date=row['ds'].date(),
                forecasted_sales=row['yhat']
            )

    # Fetch the saved forecast data
    forecast_data = ForecastData.objects.filter(product_number=product_id)
    df_forecast = pd.DataFrame(list(forecast_data.values('date', 'forecasted_sales')))
    df_forecast['date'] = pd.to_datetime(df_forecast['date'])

    # Shrink the forecast data by averaging per month
    df_forecast.set_index('date', inplace=True)
    monthly_avg_forecast = df_forecast['forecasted_sales'].resample('ME').mean()

    # Calculate monthly average for real sales
    monthly_avg_real_sales = product_df.set_index('ds').resample('ME')['y'].mean()

    # Convert Timestamps to strings
    real_sales = {str(date): sales for date, sales in product_df.set_index('ds')['y'].items()}
    forecasted_sales = {str(date): forecast for date, forecast in monthly_avg_forecast.items()}
    average_real_sales = {str(date): avg_sales for date, avg_sales in monthly_avg_real_sales.items()}

    # Prepare JSON response
    result = {
        
        'average_real_sales': average_real_sales,  # Include the average real sales
        'forecasted_sales': forecasted_sales,
    }

    return JsonResponse(result)
