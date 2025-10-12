// client/src/components/dashboard/TimeRangeSelector.tsx
import React from 'react';

interface TimeRangeSelectorProps {
    selectedRange: string;
    onChange: (range: string) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ selectedRange, onChange }) => {
    return (
        <div className="flex items-center space-x-2 p-2 rounded-lg bg-white shadow-md">
            <label htmlFor="time-range-select" className="text-sm font-medium text-gray-700">
                Data for:
            </label>
            <div className="relative inline-block w-48">
                <select
                    id="time-range-select"
                    value={selectedRange}
                    onChange={(e) => onChange(e.target.value)}
                    className="block w-full px-4 py-2 pr-8 text-sm text-gray-900 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-colors duration-200 ease-in-out hover:border-gray-400"
                >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="1y">Last Year</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                        className="h-4 w-4 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default TimeRangeSelector;