// client/src/components/dashboard/TransactionChart.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import Chart from 'chart.js/auto'; // Import Chart.js
import 'chartjs-adapter-date-fns'; // Import date-fns adapter for time scale

interface TransactionChartProps {
    data: { date: string; amount: number }[];
    loading: boolean;
    onRefresh?: () => void; // Optional refresh callback
}

const TransactionChart: React.FC<TransactionChartProps> = ({ data, loading, onRefresh }) => {
    const [chartData, setChartData] = useState(data);
    const chartRef = useRef<HTMLCanvasElement | null>(null); // Ref to the canvas element
    const chartInstance = useRef<Chart | null>(null); // Ref to store the Chart.js instance

    // Effect to update chartData when the prop changes
    useEffect(() => {
        setChartData(data);
    }, [data]);

    const handleRefresh = useCallback(() => {
        if (onRefresh) {
            onRefresh();
        }
        // chartData will be updated via the useEffect when `data` prop changes
    }, [onRefresh]);

    // Effect to initialize and update the Chart.js instance
    useEffect(() => {
        if (chartRef.current) {
            // Get current theme mode from HTML element (assuming dark class on html)
            const isDarkMode = document.documentElement.classList.contains('dark');
            const textColor = isDarkMode ? '#e5e7eb' : '#1f2937'; // gray-100 or gray-900
            const gridColor = isDarkMode ? '#374151' : '#e5e7eb'; // gray-700 or gray-200

            if (chartInstance.current) {
                // If chart already exists, update its data and options
                chartInstance.current.data.datasets[0].data = chartData.map(item => ({ x: new Date(item.date), y: item.amount }));
                chartInstance.current.options.scales.x.ticks.color = textColor;
                chartInstance.current.options.scales.x.grid.color = gridColor;
                chartInstance.current.options.scales.x.title.color = textColor;
                chartInstance.current.options.scales.y.ticks.color = textColor;
                chartInstance.current.options.scales.y.grid.color = gridColor;
                chartInstance.current.options.scales.y.title.color = textColor;
                chartInstance.current.options.plugins.legend.labels.color = textColor; // Update legend label color
                chartInstance.current.options.plugins.tooltip.titleColor = textColor;
                chartInstance.current.options.plugins.tooltip.bodyColor = textColor;
                chartInstance.current.update();
            } else {
                // Otherwise, create a new chart instance
                chartInstance.current = new Chart(chartRef.current, {
                    type: 'line',
                    data: {
                        datasets: [{
                            label: 'Transaction Amount',
                            data: chartData.map(item => ({ x: new Date(item.date), y: item.amount })),
                            fill: false,
                            borderColor: '#4caf50', // Green color
                            backgroundColor: '#4caf50',
                            tension: 0.1,
                            pointRadius: 4,
                            pointHoverRadius: 8,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: 'day',
                                    tooltipFormat: 'PPP',
                                    displayFormats: {
                                        day: 'MMM d'
                                    }
                                },
                                title: {
                                    display: true,
                                    text: 'Date',
                                    color: textColor,
                                },
                                ticks: {
                                    color: textColor // Dark mode text color
                                },
                                grid: {
                                    color: gridColor // Dark mode grid line color
                                }
                            },
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Amount (MWK)',
                                    color: textColor,
                                },
                                ticks: {
                                    color: textColor, // Dark mode text color
                                    callback: function(value: number) {
                                        return Number.isInteger(value) ? `MWK${value.toLocaleString()}` : null;
                                    }
                                },
                                grid: {
                                    color: gridColor // Dark mode grid line color
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    color: textColor // Dark mode legend text color
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context: any) {
                                        return `Amount: MWK${context.raw.y.toLocaleString()}`;
                                    },
                                    title: function(tooltipItems: any) {
                                        return `Date: ${format(new Date(tooltipItems[0].raw.x), 'PPP')}`;
                                    }
                                },
                                titleColor: textColor,
                                bodyColor: textColor,
                                backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.8)' : 'rgba(255, 255, 255, 0.8)', // Dark mode tooltip background
                                borderColor: gridColor,
                                borderWidth: 1,
                            }
                        }
                    }
                });
            }
        }

        // Cleanup function to destroy chart instance on component unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [chartData]); // Re-run effect if chartData changes (or theme changes implicitly if handled via CSS classes)


    if (loading) {
        return (
            <div className="p-3 h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
                    <p className="ml-2 text-gray-600 dark:text-gray-400">Loading chart data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction Volume Trend</h2> {/* Updated title */}
                {onRefresh && (
                    <button
                        onClick={handleRefresh}
                        className="p-2 rounded-full text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 dark:text-blue-400 dark:hover:bg-blue-900"
                        aria-label="Refresh chart data"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                )}
            </div>
            {chartData.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">No transaction data available for this period.</p>
                </div>
            ) : (
                <div className="flex-grow min-h-[250px]">
                    <canvas ref={chartRef}></canvas> {/* Changed to useRef */}
                </div>
            )}
        </div>
    );
};

export default TransactionChart;
