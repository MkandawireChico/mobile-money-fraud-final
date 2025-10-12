// client/src/components/dashboard/FraudTypeChart.tsx
import React, { useCallback } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Loader2 } from 'lucide-react'; // Using Lucide for spinner

interface FraudTypeChartProps {
    data: { name: string; value: number }[];
    loading: boolean;
}

// Define a set of vibrant and distinct colors for the pie chart slices
const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#A1CCE3', '#F2A03D'];

// Custom label renderer for Recharts Pie component to prevent overlap
// It positions labels outside the pie chart with connector lines
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name, index }: any) => {
    // Determine if dark mode is active to adjust label color
    const isDarkMode = document.documentElement.classList.contains('dark');
    const labelColor = isDarkMode ? '#e5e7eb' : '#1f2937'; // Tailwind's gray-100 or gray-900

    // Angle calculations for positioning
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 10; // Distance of the label point from the center
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Position of the line start and end points
    const startLineX = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const startLineY = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    const endLineX = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
    const endLineY = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
    const curvedLineX = cx + (outerRadius + 25) * Math.cos(-midAngle * RADIAN); // Slightly further out for the curve
    const curvedLineY = cy + (outerRadius + 25) * Math.sin(-midAngle * RADIAN);


    // Determine text anchor for alignment (left/right) based on midAngle
    const textAnchor = x > cx ? 'start' : 'end';

    // To add a bit of space between the line and the text label
    const textOffset = textAnchor === 'start' ? 8 : -8;

    // Format the percentage for display
    const percentage = (percent * 100).toFixed(0);

    // Only render label if percentage is significant enough to be readable
    if (percent > 0.05) { // e.g., only show labels for slices larger than 5%
        return (
            <g>
                {/* Connector line from slice to label */}
                <polyline
                    points={`${startLineX},${startLineY} ${endLineX},${endLineY} ${endLineX + (x > cx ? 15 : -15)},${endLineY}`}
                    stroke={labelColor}
                    fill="none"
                    strokeWidth={1}
                />
                {/* Text label */}
                <text
                    x={endLineX + (x > cx ? 15 : -15) + textOffset}
                    y={endLineY}
                    fill={labelColor}
                    textAnchor={textAnchor}
                    dominantBaseline="central"
                    className="text-xs sm:text-sm font-medium"
                >
                    {`${name} (${percentage}%)`}
                </text>
            </g>
        );
    }
    return null; // Don't render label for very small slices
};

// Custom legend formatter to include percentages directly in the legend
const renderLegendContent = (props: any) => {
    const { payload } = props;
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? '#e5e7eb' : '#1f2937';

    return (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-sm font-medium">
            {payload.map((entry: any, index: number) => {
                const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
                return (
                    <li key={`item-${index}`} className="flex items-center" style={{ color: textColor }}>
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                        {`${entry.value === 0 ? entry.payload.name : entry.payload.name} (${percentage}%)`}
                    </li>
                );
            })}
        </ul>
    );
};


const FraudTypeChart: React.FC<FraudTypeChartProps> = ({ data, loading }) => {
    // Determine if dark mode is active to apply correct Tailwind classes and chart colors
    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? '#e5e7eb' : '#1f2937'; // Tailwind's gray-100 or gray-900

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex justify-center items-center h-full border border-gray-200 dark:border-gray-700">
                <Loader2 size={40} className="animate-spin text-blue-500 dark:text-blue-400 mr-3" />
                <p className="text-lg text-gray-700 dark:text-gray-300">Loading fraud type data...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
                Fraud Types Distribution
            </h2>
            {data.length === 0 ? (
                <div className="flex justify-center items-center flex-grow">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No fraud type data available for this period.</p>
                </div>
            ) : (
                <div className="flex-grow min-h-[250px] w-full"> {/* Ensure it takes full width */}
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={true} // Set to true to show connector lines
                                label={renderCustomizedLabel} // Use the custom label renderer
                                outerRadius={80} // Size of the pie chart
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDarkMode ? '#374151' : '#ffffff', // Dark/light mode tooltip background
                                    border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`, // Dark/light mode tooltip border
                                    color: textColor // Dark/light mode text color
                                }}
                                itemStyle={{ color: textColor }} // Apply text color to individual items in tooltip
                                formatter={(value: string | number | Array<string | number>, name: string) => [`${value} alerts`, name]} // Adjusted formatter
                            />
                            <Legend
                                content={renderLegendContent} // Use custom legend renderer
                                layout="horizontal" // Horizontal layout for legend items
                                align="center" // Center the legend
                                verticalAlign="bottom" // Position at the bottom
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default FraudTypeChart;
