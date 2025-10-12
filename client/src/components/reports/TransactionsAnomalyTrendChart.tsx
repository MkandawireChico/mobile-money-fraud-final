import React, { useState, useEffect, useCallback } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Line,
} from 'recharts';
import api from '../../api/axios.ts';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

interface TrendData {
    date: string;
    total_transactions: number;
    anomaly_count: number;
}

type Interval = 'day' | 'week' | 'month' | 'hour';
type Period = number;

const TransactionsAnomalyTrendChart: React.FC = () => {
    const [data, setData] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [timeInterval, setTimeInterval] = useState<Interval>('day');
    const [period, setPeriod] = useState<Period>(30);

    const fetchTrendData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<TrendData[]>(
                `/reports/transactions-anomaly-trends`,
                {
                    params: { interval: timeInterval, period, _t: Date.now() },
                    headers: { 'Cache-Control': 'no-cache' }
                }
            );
            setData(response.data);
            console.log(`[TransactionsAnomalyTrendChart] Fetched trend data for ${period} ${timeInterval}s:`, response.data);
        } catch (err: any) {
            console.error('[TransactionsAnomalyTrendChart] Error fetching trend data:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to fetch trend data.');
        } finally {
            setLoading(false);
        }
    }, [timeInterval, period]);

    useEffect(() => {
        fetchTrendData();
    }, [fetchTrendData]);


    // Custom Tooltip for better readability
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-700 font-inter text-sm">
                    <p className="font-semibold mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <Loader2 size={48} className="animate-spin text-blue-500 dark:text-blue-400" />
                <p className="ml-4 text-gray-700 dark:text-gray-300 text-lg">Loading transaction trend...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-80 bg-red-100 dark:bg-red-900 rounded-lg shadow-lg p-6 text-red-700 dark:text-red-300">
                <AlertCircle size={48} className="mb-4" />
                <p className="text-lg font-semibold">Error loading report:</p>
                <p className="text-md text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <TrendingUp size={28} className="mr-3 text-blue-600 dark:text-blue-400" />
                    Transaction & Anomaly Trend
                </h2>
            </div>


            {/* Controls for Interval and Period */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Interval:</span>
                {(['hour', 'day', 'week', 'month'] as Interval[]).map((int) => (
                    <button
                        key={int}
                        onClick={() => setTimeInterval(int)}
                        className={clsx(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                            timeInterval === int
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                        )}
                    >
                        {int.charAt(0).toUpperCase() + int.slice(1)}
                    </button>
                ))}
                <span className="ml-4 text-gray-700 dark:text-gray-300 font-medium">Period:</span>
                {([] as number[]).concat(
                    timeInterval === 'hour' ? [12, 24, 48] : [],
                    timeInterval === 'day' ? [7, 30, 90] : [],
                    timeInterval === 'week' ? [4, 12, 24] : [], // approx 1, 3, 6 months
                    timeInterval === 'month' ? [3, 6, 12] : []
                ).filter((value, index, self) => self.indexOf(value) === index) // Filter unique values
                .sort((a,b) => a-b) // Sort numerically
                .map((per) => (
                    <button
                        key={per}
                        onClick={() => setPeriod(per)}
                        className={clsx(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                            period === per
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                        )}
                    >
                        {per} {timeInterval === 'month' && per > 1 ? 'Months' : (timeInterval === 'month' ? 'Month' : (timeInterval === 'hour' && per > 1 ? 'Hours' : (timeInterval === 'hour' ? 'Hour' : (timeInterval === 'day' && per > 1 ? 'Days' : (timeInterval === 'day' ? 'Day' : (timeInterval === 'week' && per > 1 ? 'Weeks' : 'Week'))))))}
                    </button>
                ))}
            </div>

            {data.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
                    No data available for the selected period and timeInterval.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                        <XAxis dataKey="date" stroke="#9ca3af" tickFormatter={(value) => {
                            if (timeInterval === 'month') return value.substring(0, 7); // YYYY-MM
                            if (timeInterval === 'week') {
                                const [year, month, day] = value.split('-');
                                return `${month}-${day}`; // MM-DD
                            }
                            if (timeInterval === 'day') return value.substring(5); // MM-DD
                            if (timeInterval === 'hour') return value.substring(11, 13); // HH
                            return value;
                        }} />
                        <YAxis yAxisId="left" stroke="#3b82f6" label={{ value: 'Total Transactions', angle: -90, position: 'insideLeft', fill: '#3b82f6' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#ef4444" label={{ value: 'Anomaly Count', angle: 90, position: 'insideRight', fill: '#ef4444' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="total_transactions"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.3}
                            name="Total Transactions"
                        />
                        <Bar
                            yAxisId="right"
                            dataKey="anomaly_count"
                            barSize={timeInterval === 'hour' ? 15 : 20}
                            fill="#ef4444"
                            name="Anomaly Count"
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="total_transactions"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            name="Total Transactions Line"
                            legendType="none" // Hide this in legend, it's covered by Area
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default TransactionsAnomalyTrendChart;
