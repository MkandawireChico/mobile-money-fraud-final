// client/src/components/dashboard/RecentTransactionsTable.tsx
import React from 'react';
import { format } from 'date-fns';
import { Transaction } from '../../types/index.ts';

interface RecentTransactionsTableProps {
    transactions: Transaction[];
    onRowClick: (transactionId: string) => void;
    defaultCurrency: string;
}

const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({ transactions, onRowClick, defaultCurrency }) => {
    // Helper function to get Tailwind classes for status chips
    const getStatusChipClasses = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success':
                return 'bg-green-100 text-green-800'; // Light green background, dark green text
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'; // Light yellow background, dark yellow text
            case 'failed':
                return 'bg-red-100 text-red-800';     // Light red background, dark red text
            case 'flagged':
                return 'bg-blue-100 text-blue-800';   // Light blue background, dark blue text
            default:
                return 'bg-gray-100 text-gray-800';   // Default light gray background, dark gray text
        }
    };

    return (
        // Table Container: Adds styling for a card-like appearance with responsiveness
        <div className="flex-grow overflow-hidden bg-white shadow-lg rounded-lg border border-gray-200">
            {/* Responsive Table Wrapper: Ensures horizontal scroll on small screens */}
            <div className="overflow-x-auto h-full">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* Table Head: Styled with a distinct background and text color */}
                    <thead className="bg-blue-800">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Transaction ID
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                User ID
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Amount
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Type
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Date
                            </th>
                        </tr>
                    </thead>
                    {/* Table Body: Handles rendering of transaction rows */}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.length === 0 ? (
                            <tr className="bg-gray-50">
                                <td colSpan={6} className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                    No recent transactions.
                                </td>
                            </tr>
                        ) : (
                            transactions.map((transaction) => (
                                <tr
                                    key={String(transaction.transaction_id || '')}
                                    // Row styling with alternating background and hover effect for better UX
                                    className="bg-white even:bg-gray-50 hover:bg-blue-50 transition duration-150 ease-in-out cursor-pointer"
                                    onClick={() => onRowClick(String(transaction.transaction_id || ''))}
                                >
                                    {/* Transaction ID Cell */}
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {transaction.transaction_id}
                                    </td>
                                    {/* User ID Cell */}
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                                        {transaction.user_id}
                                    </td>
                                    {/* Amount Cell: Formats currency */}
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                                        {defaultCurrency}
                                        {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    {/* Transaction Type Cell */}
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 capitalize">
                                        {transaction.transaction_type}
                                    </td>
                                    {/* Status Cell: Uses styled 'chip' for status indication */}
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <span
                                            className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipClasses(transaction.status)}`}
                                        >
                                            {transaction.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    {/* Date Cell: Formats timestamp */}
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                                        {format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentTransactionsTable;
