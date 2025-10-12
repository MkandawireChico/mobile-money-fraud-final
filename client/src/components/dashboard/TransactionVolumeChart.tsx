// client/src/components/dashboard/TransactionVolumeChart.tsx
import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    Chart: any;
  }
}

const TransactionVolumeChart = ({ data, loading, title = "Transaction Volume" }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!window.Chart || !chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Process data for volume chart (date vs count)
    const chartData = {
      labels: data.map(item => item.date),
      datasets: [
        {
          label: 'Transaction Count',
          data: data.map(item => item.count),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.1,
        }
      ]
    };

    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Transactions'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, title]);

  if (loading) {
    return <div>Loading volume chart...</div>;
  }

  return (
    <div className="chart-container">
      <canvas ref={chartRef} />
    </div>
  );
};

export default TransactionVolumeChart;