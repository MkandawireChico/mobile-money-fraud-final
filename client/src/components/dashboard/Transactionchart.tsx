import React, { useState, useEffect, useRef } from 'react';

// Add Chart type to window for TypeScript
declare global {
  interface Window {
    Chart: any;
    chartJsLoaded?: boolean;
  }
}

// Inline SVG for refresh icon since lucide-react is not used here
const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M3 12a9 9 0 0 1 9-9c2.328 0 4.512.67 6.31 1.82"></path>
    <path d="M20.72 17.62a9 9 0 0 1-9.72 5.38c-2.328 0-4.512-.67-6.31-1.82"></path>
    <path d="M22 12v6h-6"></path>
    <path d="M2 12v-6h6"></path>
  </svg>
);

// Load Chart.js and its date-fns adapter from CDNs
const loadChartJsScripts = () => {
  const chartJsScript = document.createElement('script');
  chartJsScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
  chartJsScript.onload = () => {
    window.chartJsLoaded = true;
  };
  document.head.appendChild(chartJsScript);

  const chartJsDateAdapter = document.createElement('script');
  chartJsDateAdapter.src =
    'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js';
  document.head.appendChild(chartJsDateAdapter);
};
loadChartJsScripts();

const TransactionChart = ({ data, loading, onRefresh }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!window.chartJsLoaded || !chartRef.current) {
      return;
    }

    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Transaction Amount',
            data: data.map((item) => ({ x: new Date(item.date), y: item.amount })),
            fill: false,
            borderColor: '#4caf50',
            backgroundColor: '#4caf50',
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              tooltipFormat: 'MMM d, yyyy',
              displayFormats: {
                day: 'MMM d',
              },
            },
            title: {
              display: true,
              text: 'Date',
              color: '#6b7280',
            },
            ticks: {
              color: '#6b7280',
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount (MWK)',
              color: '#6b7280',
            },
            ticks: {
              color: '#6b7280',
              callback: function (value) {
                return Number.isInteger(value) ? `MWK ${value}` : null;
              },
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#6b7280',
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Amount: MWK ${context.raw.y}`;
              },
              title: function (tooltipItems) {
                return `Date: ${new Date(tooltipItems[0].raw.x).toDateString()}`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  if (loading) {
    return (
      <div className="p-4 h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md max-h-96 overflow-auto">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 dark:border-blue-400"></div>
          <p className="ml-2 text-base text-gray-600 dark:text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transactions Over Time</h2>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className="px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              <RefreshIcon />
            )}
          </button>
        )}
      </div>
      {data.length === 0 ? (
        <div className="flex justify-center items-center h-full text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">No transaction data available for this period.</p>
        </div>
      ) : (
        <div className="flex-grow min-h-[250px]">
          <canvas ref={chartRef}></canvas>
        </div>
      )}
    </div>
  );
};

export default TransactionChart;