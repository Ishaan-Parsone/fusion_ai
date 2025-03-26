import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const SalesChart = ({ productId }) => {
    const [chartData, setChartData] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:8001/api/forecast-data/${productId}/`);
                const realSales = response.data.real_sales;
                const forecastedSales = response.data.forecasted_sales;

                const labels = Object.keys(realSales);  // Extract month labels (e.g., '2024-01-31')

                // Prepare datasets for Chart.js
                const realValues = Object.values(realSales);
                const forecastedValues = Object.values(forecastedSales);

                setChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Real Sales',
                            data: realValues,
                            borderColor: 'blue',
                            tension: 0.4,
                        },
                        {
                            label: 'Forecasted Sales',
                            data: forecastedValues,
                            borderColor: 'orange',
                            tension: 0.4,
                        },
                    ],
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [productId]);

    return (
        <div>
            <h2>Sales Forecast</h2>
            <Line data={chartData} />
        </div>
    );
};

export default SalesChart;
