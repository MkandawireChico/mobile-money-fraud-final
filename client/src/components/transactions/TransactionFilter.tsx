
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Check, X, ChevronDown, AlertCircle, Filter as FilterIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';

interface TransactionFilterProps {
    currentFilters: {
        status: string | null;
        type: string | null;
        minAmount: number | null;
        maxAmount: number | null;
        dateRange: [Date | null, Date | null] | null;
        isFraud: boolean | null;
        merchantCategory: string | null;
        sender_msisdn: string | null;
    };
    onApply: (filters: any) => void;
    onClose: () => void;
}

const TransactionFilter: React.FC<TransactionFilterProps> = ({ currentFilters, onApply, onClose }) => {
    console.log('[TransactionFilter] Component mounted with filters:', currentFilters);
    
    const [status, setStatus] = useState<string | null>(currentFilters.status);
    const [type, setType] = useState<string | null>(currentFilters.type);
    const [minAmount, setMinAmount] = useState<number | ''>(currentFilters.minAmount || '');
    const [maxAmount, setMaxAmount] = useState<number | ''>(currentFilters.maxAmount || '');
    const [startDate, setStartDate] = useState<Date | null>(currentFilters.dateRange ? currentFilters.dateRange[0] : null);
    const [endDate, setEndDate] = useState<Date | null>(currentFilters.dateRange ? currentFilters.dateRange[1] : null);
    const [isFraud, setIsFraud] = useState<boolean | null>(currentFilters.isFraud);
    const [merchantCategory, setMerchantCategory] = useState<string | null>(currentFilters.merchantCategory);
    const [sender_msisdn, setSender_msisdn] = useState<string | null>(currentFilters.sender_msisdn);
    const [msisdnError, setMsisdnError] = useState<string | null>(null);
    const [showClearModal, setShowClearModal] = useState<boolean>(false);

    const defaultCurrency = 'MWK';

    // Validate Malawi phone number (Airtel: +26599xxxxxxx, TNM: +26588xxxxxxx)
    const validateMsisdn = (value: string | null): boolean => {
        if (!value) return true; // Allow empty input
        const regex = /^\+265(88|99)\d{7}$/;
        return regex.test(value);
    };

    useEffect(() => {
        setStatus(currentFilters.status);
        setType(currentFilters.type);
        setMinAmount(currentFilters.minAmount || '');
        setMaxAmount(currentFilters.maxAmount || '');
        setStartDate(currentFilters.dateRange ? currentFilters.dateRange[0] : null);
        setEndDate(currentFilters.dateRange ? currentFilters.dateRange[1] : null);
        setIsFraud(currentFilters.isFraud);
        setMerchantCategory(currentFilters.merchantCategory);
        setSender_msisdn(currentFilters.sender_msisdn);
        setMsisdnError(null);
    }, [currentFilters]);

    const handleApply = () => {
        console.log('[TransactionFilter] Applying filters with values:', {
            status,
            type,
            minAmount: minAmount === '' ? null : minAmount,
            maxAmount: maxAmount === '' ? null : maxAmount,
            dateRange: (startDate || endDate) ? [startDate, endDate] : null,
            isFraud,
            merchantCategory,
            sender_msisdn,
        });
        
        if (sender_msisdn && !validateMsisdn(sender_msisdn)) {
            setMsisdnError('Invalid phone number. Use format: +26599xxxxxxx or +26588xxxxxxx');
            return;
        }
        onApply({
            status,
            type,
            minAmount: minAmount === '' ? null : minAmount,
            maxAmount: maxAmount === '' ? null : maxAmount,
            dateRange: (startDate || endDate) ? [startDate, endDate] : null,
            isFraud,
            merchantCategory,
            sender_msisdn,
        });
        onClose();
    };

    const handleClear = () => {
        setShowClearModal(true);
    };

    const confirmClear = () => {
        setStatus(null);
        setType(null);
        setMinAmount('');
        setMaxAmount('');
        setStartDate(null);
        setEndDate(null);
        setIsFraud(null);
        setMerchantCategory(null);
        setSender_msisdn(null);
        setMsisdnError(null);
        onApply({
            status: null,
            type: null,
            minAmount: null,
            maxAmount: null,
            dateRange: null,
            isFraud: null,
            merchantCategory: null,
            sender_msisdn: null,
        });
        setShowClearModal(false);
        onClose();
    };

    const filterPreview = [
        status && `Status: ${status.replace(/_/g, ' ')}`,
        type && `Type: ${type.replace(/_/g, ' ')}`,
        minAmount && `Min Amount: ${defaultCurrency}${minAmount}`,
        maxAmount && `Max Amount: ${defaultCurrency}${maxAmount}`,
        (startDate || endDate) && `Date Range: ${startDate ? format(startDate, 'yyyy-MM-dd') : '...'} to ${endDate ? format(endDate, 'yyyy-MM-dd') : '...'}`,
        isFraud !== null && `Fraud: ${isFraud ? 'Yes' : 'No'}`,
        merchantCategory && `Merchant Category: ${merchantCategory}`,
        sender_msisdn && `Sender MSISDN: ${sender_msisdn}`,
    ].filter(Boolean).join(', ');

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <FilterIcon size={18} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                        Filter Transactions
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
                    aria-label="Close filters"
                >
                    <X size={18} />
                </button>
            </div>
            
            {/* Scrollable Content Container */}
            <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
                <div className="p-6">

                    {/* Status Filter */}
                    <div className="mb-4">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <div className="relative">
                            <select
                                id="status"
                                value={status || ''}
                                onChange={(e) => setStatus(e.target.value || null)}
                                className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Filter by transaction status"
                            >
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="blocked">Blocked</option>
                                <option value="flagged">Flagged</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div className="mb-4">
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type
                        </label>
                        <div className="relative">
                            <select
                                id="type"
                                value={type || ''}
                                onChange={(e) => setType(e.target.value || null)}
                                className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Filter by transaction type"
                            >
                                <option value="">All</option>
                                <option value="airtime_topup">Airtime Top-up</option>
                                <option value="bill_payment">Bill Payment</option>
                                <option value="cash_in">Cash In</option>
                                <option value="cash_out">Cash Out</option>
                                <option value="transfer">Transfer</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Fraud Status Filter */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fraud Status
                        </label>
                        <div className="flex space-x-4 mt-1">
                            <label className="inline-flex items-center text-gray-700 dark:text-gray-300">
                                <input
                                    type="radio"
                                    value=""
                                    checked={isFraud === null}
                                    onChange={() => setIsFraud(null)}
                                    className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    aria-label="All fraud statuses"
                                />
                                <span className="ml-2 text-sm">All</span>
                            </label>
                            <label className="inline-flex items-center text-gray-700 dark:text-gray-300">
                                <input
                                    type="radio"
                                    value="true"
                                    checked={isFraud === true}
                                    onChange={() => setIsFraud(true)}
                                    className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    aria-label="Fraudulent transactions"
                                />
                                <span className="ml-2 text-sm">Fraud</span>
                            </label>
                            <label className="inline-flex items-center text-gray-700 dark:text-gray-300">
                                <input
                                    type="radio"
                                    value="false"
                                    checked={isFraud === false}
                                    onChange={() => setIsFraud(false)}
                                    className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    aria-label="Legitimate transactions"
                                />
                                <span className="ml-2 text-sm">Legitimate</span>
                            </label>
                        </div>
                    </div>

                    {/* Merchant Category Filter */}
                    <div className="mb-4">
                        <label htmlFor="merchantCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Merchant Category
                        </label>
                        <div className="relative">
                            <select
                                id="merchantCategory"
                                value={merchantCategory || ''}
                                onChange={(e) => setMerchantCategory(e.target.value || null)}
                                className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Filter by merchant category"
                            >
                                <option value="">All</option>
                                <option value="Mobile Operator">Mobile Operator</option>
                                <option value="Utility">Utility</option>
                                <option value="Market Vendor">Market Vendor</option>
                                <option value="Transport">Transport</option>
                                <option value="Charity">Charity</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Sender MSISDN Filter */}
                    <div className="mb-4">
                        <label htmlFor="sender_msisdn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Sender Phone Number
                        </label>
                        <input
                            id="sender_msisdn"
                            type="text"
                            value={sender_msisdn || ''}
                            onChange={(e) => {
                                setSender_msisdn(e.target.value || null);
                                if (e.target.value && !validateMsisdn(e.target.value)) {
                                    setMsisdnError('Invalid phone number. Use format: +26599xxxxxxx or +26588xxxxxxx');
                                } else {
                                    setMsisdnError(null);
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            placeholder="+26599xxxxxxx or +26588xxxxxxx"
                            aria-label="Filter by sender phone number"
                            aria-describedby={msisdnError ? 'msisdn-error' : undefined}
                        />
                        {msisdnError && (
                            <p id="msisdn-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                                <AlertCircle size={16} className="mr-1" /> {msisdnError}
                            </p>
                        )}
                    </div>

                    {/* Amount Filters */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Min Amount
                            </label>
                            <input
                                id="minAmount"
                                type="number"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                placeholder="0"
                                aria-label="Filter by minimum amount"
                            />
                        </div>
                        <div>
                            <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Max Amount
                            </label>
                            <input
                                id="maxAmount"
                                type="number"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                placeholder="Unlimited"
                                aria-label="Filter by maximum amount"
                            />
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date Range
                        </p>
                        <DatePicker
                            selected={startDate}
                            onChange={(date: Date | null) => setStartDate(date)}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="From Date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            isClearable
                            aria-label="Filter by start date"
                        />
                        <DatePicker
                            selected={endDate}
                            onChange={(date: Date | null) => setEndDate(date)}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="To Date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 mt-2"
                            isClearable
                            aria-label="Filter by end date"
                        />
                    </div>

                    {/* Filter Preview */}
                    {filterPreview && (
                        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            <p className="font-semibold mb-1">Current Selection:</p>
                            <p className="break-words">{filterPreview}</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-t border-gray-200/50 dark:border-gray-600/50 p-6">
                <div className="flex justify-between space-x-4">
                    <button
                        onClick={handleClear}
                        className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-sm font-semibold w-1/2 shadow-lg hover:shadow-xl transform hover:scale-105"
                        aria-label="Clear all filters"
                    >
                        <X size={18} className="mr-2" /> Clear All
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!!msisdnError}
                        className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 text-sm font-semibold w-1/2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                        aria-label="Apply filters"
                    >
                        <Check size={18} className="mr-2" /> Apply Filters
                    </button>
                </div>
            </div>

            {/* Clear Confirmation Modal */}
            {showClearModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Confirm Clear Filters
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to clear all filters? This will reset all your current filter selections.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                                aria-label="Cancel clear filters"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmClear}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                                aria-label="Confirm clear filters"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionFilter;
