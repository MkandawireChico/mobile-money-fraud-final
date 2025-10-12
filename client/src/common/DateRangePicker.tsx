// client/src/common/DateRangePicker.tsx
import React from 'react';
import { DateRangePicker as RDRDateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';

interface DateRangePickerProps {
    value: [Date | null, Date | null];
    onChange: (dateRange: [Date, Date]) => void;
    label?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    value,
    onChange,
    label
}) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClear = () => {
        onChange([new Date(), new Date()]);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'date-range-picker-popover' : undefined;

    const selectionRange = {
        startDate: value[0] || new Date(),
        endDate: value[1] || new Date(),
        key: 'selection',
    };

    return (
        <div className="flex items-center border border-gray-300 rounded-md p-2 w-full justify-between">
            {label && (
                <span className="text-sm text-gray-500 mr-2">{label}</span>
            )}
            <div className="flex items-center flex-grow justify-end">
                <button
                    type="button"
                    onClick={handleClick}
                    className="p-1 text-gray-600 hover:text-gray-800 focus:outline-none"
                    aria-describedby={open ? 'date-range-picker-popover' : undefined}
                >
                    📅
                </button>
                <span className="text-sm text-gray-700 mx-2 flex-grow">
                    {value[0] ? format(value[0], 'MMM d, yyyy') : 'Start Date'} -{' '}
                    {value[1] ? format(value[1], 'MMM d, yyyy') : 'End Date'}
                </span>
                {value[0] && value[1] && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-1 text-gray-600 hover:text-gray-800 focus:outline-none"
                    >
                        ✕
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                    <RDRDateRangePicker
                        ranges={[selectionRange]}
                        onChange={(item) => {
                            if (item.selection.startDate && item.selection.endDate) {
                                onChange([item.selection.startDate, item.selection.endDate]);
                            }
                        }}
                    />
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;