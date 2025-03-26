import React, { useEffect, useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SalesDashboard = () => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:8001/api/forecast-data/${selectedProduct}/`);
        setForecastData(response.data);
        setError('');
      } catch (error) {
        console.error('Error fetching forecast data:', error);
        setError('An error occurred while fetching the data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProduct]);

  const handleProductChange = (event) => {
    setSelectedProduct(Number(event.target.value));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  if (!forecastData || !forecastData.average_real_sales || !forecastData.forecasted_sales) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600">No data available for the selected product.</div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  // Prepare data for Line Chart
  const lineChartData = {
    labels: Object.keys(forecastData.average_real_sales).map(date => formatDate(date)),
    datasets: [
      {
        label: 'Average Real Sales',
        data: Object.values(forecastData.average_real_sales),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'Forecasted Sales',
        data: Object.values(forecastData.forecasted_sales),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      }
    ]
  };

  // Prepare data for Bar Chart (Monthly Comparison)
  const barChartData = {
    labels: Object.keys(forecastData.average_real_sales).map(date => formatDate(date)),
    datasets: [
      {
        label: 'Real vs Forecast Difference',
        data: Object.keys(forecastData.average_real_sales).map(date => 
          forecastData.forecasted_sales[date] - forecastData.average_real_sales[date]
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Light blue
        borderColor:  'rgb(54, 162, 235)', // Darker blue
        borderWidth: 1
      }
    ]
  };

  // Prepare data for Pie Chart (Sales Distribution)
  const pieChartData = {
    labels: ['Average Real Sales', 'Forecasted Sales'],
    datasets: [{
      data: [
        Object.values(forecastData.average_real_sales).reduce((a, b) => a + b, 0),
        Object.values(forecastData.forecasted_sales).reduce((a, b) => a + b, 0)
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.5)',
        'rgba(255, 99, 132, 0.5)'
      ],
      borderColor: [
        'rgb(75, 192, 192)',
        'rgb(255, 99, 132)'
      ],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Sales Analysis - Product ${selectedProduct}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Sales Analytics Dashboard</h1>
          <select
            value={selectedProduct}
            onChange={handleProductChange}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[1, 2, 3, 4, 5].map((productId) => (
              <option key={productId} value={productId}>
                Product {productId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Sales Trend Analysis</h2>
          <Line data={lineChartData} options={chartOptions} />
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Monthly Sales Variance</h2>
          <Bar data={barChartData} options={chartOptions} />
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Sales Distribution</h2>
          <Pie data={pieChartData} options={chartOptions} />
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Key Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600">Average Real Sales</h3>
              <p className="text-2xl font-bold text-blue-800">
                {(Object.values(forecastData.average_real_sales).reduce((a, b) => a + b, 0) / 
                  Object.values(forecastData.average_real_sales).length).toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600">Average Forecast</h3>
              <p className="text-2xl font-bold text-green-800">
                {(Object.values(forecastData.forecasted_sales).reduce((a, b) => a + b, 0) / 
                  Object.values(forecastData.forecasted_sales).length).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-600">Forecast Growth</h3>
              <p className="text-2xl font-bold text-purple-800">
                {((Object.values(forecastData.forecasted_sales).slice(-1)[0] - 
                  Object.values(forecastData.forecasted_sales)[0]) / 
                  Object.values(forecastData.forecasted_sales)[0] * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-orange-600">Data Points</h3>
              <p className="text-2xl font-bold text-orange-800">
                {Object.keys(forecastData.average_real_sales).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;