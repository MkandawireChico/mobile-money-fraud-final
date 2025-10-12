// client/src/components/dashboard/AlertChart.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

interface AnomalyChartProps {
  data: { date: string; count: number }[];
  loading: boolean;
  onRefresh?: () => void; // Optional refresh callback
}

const AnomalyChart: React.FC<AnomalyChartProps> = ({ data, loading, onRefresh }) => {
  const { anomalies, dismissAnomalyById } = useSocket();
  const [chartData, setChartData] = useState(data);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
    setChartData(data); // Reset to current data or fetch new if onRefresh updates it
  }, [data, onRefresh]);

  // Sync anomalies from SocketContext
  useEffect(() => {
    setChartData(data); // Update chart data if provided
  }, [data]);

  const handleAction = (anomalyId: string, action: string) => {
    console.log(`Action ${action} on anomaly ${anomalyId}`);
    // TODO: Implement API call to backend for action (e.g., Block, Allow)
    if (action === 'Dismiss') {
      dismissAnomalyById(anomalyId);
    }
  };

  if (loading) {
    return (
      <div className="p-3 h-full flex flex-col bg-white rounded-lg shadow-md">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
          <p className="ml-2 text-gray-600">Loading anomaly data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 h-full flex flex-col bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Anomalies Over Time</h2>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        )}
      </div>
      {chartData.length === 0 && anomalies.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">No anomaly data available for this period.</p>
        </div>
      ) : (
        <>
          {/* Anomaly Chart */}
          <div className="flex-grow min-h-[250px] mb-4">
            <div style={{ width: '100%', height: '100%' }}>
              <canvas
                type="chartjs"
                style={{ width: '100%', height: '100%' }}
              >
                {JSON.stringify({
                  type: 'line',
                  data: {
                    datasets: [{
                      label: 'Anomalies',
                      data: chartData.map(item => ({ x: new Date(item.date), y: item.count })),
                      fill: false,
                      borderColor: '#8884d8',
                      backgroundColor: '#8884d8',
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
                          text: 'Date'
                        },
                        ticks: {
                          color: '#6b7280'
                        }
                      },
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Count'
                        },
                        ticks: {
                          color: '#6b7280',
                          stepSize: 1,
                          callback: function(value: number) {
                            return Number.isInteger(value) ? value : null;
                          }
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          color: '#6b7280'
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            return `Count: ${context.raw.y}`;
                          },
                          title: function(tooltipItems: any) {
                            return `Date: ${format(new Date(tooltipItems[0].raw.x), 'PPP')}`;
                          }
                        }
                      }
                    }
                  }
                })}
              </canvas>
            </div>
          </div>

          {/* Real-Time Anomaly List */}
          <div className="max-h-64 overflow-y-auto border-t pt-4">
            <h3 className="text-md font-medium mb-2">Active Anomalies</h3>
            {anomalies.length === 0 ? (
              <p className="text-gray-500">No active anomalies.</p>
            ) : (
              anomalies.map((anomaly) => (
                <div key={anomaly.id} className="mb-2 p-2 bg-gray-50 rounded">
                  <p><strong>ID:</strong> {anomaly.transaction_id}</p>
                  <p><strong>Risk Score:</strong> {anomaly.risk_score.toFixed(2)}</p>
                  <p><strong>Time:</strong> {format(new Date(anomaly.timestamp), 'PPPp')}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAction(anomaly.id, 'Review')}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleAction(anomaly.id, 'Block')}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Block
                    </button>
                    <button
                      onClick={() => handleAction(anomaly.id, 'Allow')}
                      className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Allow
                    </button>
                    <button
                      onClick={() => dismissAnomalyById(anomaly.id)}
                      className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnomalyChart;