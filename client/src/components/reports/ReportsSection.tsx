import React, { useState, useEffect, useCallback } from 'react';
import {
    FileText,
    Download,
    Calendar,
    TrendingUp,
    BarChart3,
    PieChart,
    Users,
    Shield,
    AlertTriangle,
    FileSpreadsheet,
    FileImage,
    FileType,
    Loader2,
    RefreshCw,
    Filter,
    ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios.ts';
import TransactionsAnomalyTrendChart from './TransactionsAnomalyTrendChart.tsx';
import FraudSummaryReport from './FraudSummaryReport.tsx';
import TransactionVolumeReport from './TransactionVolumeReport.tsx';
import HighRiskTransactionsReport from './HighRiskTransactionsReport.tsx';
import AnomalyDistributionReport from './AnomalyDistributionReport.tsx';
import UserActivityReport from './UserActivityReport.tsx';

interface ReportData {
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    endpoint: string;
    type: 'chart' | 'table' | 'summary';
    exportFormats: ('csv' | 'excel' | 'pdf' | 'word')[];
}

const AVAILABLE_REPORTS: ReportData[] = [
    {
        name: 'Transaction & Anomaly Trends',
        description: 'Comprehensive view of transaction volumes and anomaly patterns over time',
        icon: TrendingUp,
        endpoint: '/reports/transactions-anomaly-trends',
        type: 'chart',
        exportFormats: ['csv', 'excel', 'pdf', 'word']
    },
    {
        name: 'Fraud Detection Summary',
        description: 'Summary of fraud detection metrics and model performance',
        icon: Shield,
        endpoint: '/reports/fraud-summary',
        type: 'summary',
        exportFormats: ['csv', 'excel', 'pdf', 'word']
    },
    {
        name: 'Transaction Volume Analysis',
        description: 'Detailed analysis of transaction volumes by time, location, and type',
        icon: BarChart3,
        endpoint: '/reports/transaction-volume',
        type: 'table',
        exportFormats: ['csv', 'excel', 'pdf', 'word']
    },
    {
        name: 'Anomaly Distribution Report',
        description: 'Distribution of anomalies by type, severity, and geographic location',
        icon: PieChart,
        endpoint: '/reports/anomaly-distribution',
        type: 'chart',
        exportFormats: ['csv', 'excel', 'pdf', 'word']
    },
    {
        name: 'User Activity Report',
        description: 'User transaction patterns and risk profiles',
        icon: Users,
        endpoint: '/reports/user-activity',
        type: 'table',
        exportFormats: ['csv', 'excel', 'pdf', 'word']
    },
    {
        name: 'High-Risk Transactions',
        description: 'Detailed report of high-risk transactions requiring investigation',
        icon: AlertTriangle,
        endpoint: '/reports/high-risk-transactions',
        type: 'table',
        exportFormats: ['csv', 'excel', 'pdf', 'word']
    }
];

const EXPORT_FORMAT_CONFIG = {
    csv: { icon: FileSpreadsheet, label: 'CSV', color: 'text-green-600', bgColor: 'bg-green-100' },
    excel: { icon: FileSpreadsheet, label: 'Excel', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    pdf: { icon: FileImage, label: 'PDF', color: 'text-red-600', bgColor: 'bg-red-100' },
    word: { icon: FileType, label: 'Word', color: 'text-purple-600', bgColor: 'bg-purple-100' }
};

type DateRange = {
    startDate: Date;
    endDate: Date;
};

const ReportsSection: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date()
    });
    const [exportLoading, setExportLoading] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Handle report export
    const handleExport = async (report: ReportData, exportFormat: string) => {
        const exportKey = `${report.name}-${exportFormat}`;
        setExportLoading(exportKey);
        
        try {
            const params = {
                format: exportFormat,
                startDate: dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : '',
                endDate: dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : ''
            };

            const response = await api.get(`${report.endpoint}/export`, {
                params,
                responseType: 'blob'
            });

            // Create download link
            const blob = new Blob([response.data], { 
                type: getContentType(exportFormat)
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const startDateStr = dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : 'unknown';
            const endDateStr = dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : 'unknown';
            link.download = `${report.name.toLowerCase().replace(/\s+/g, '_')}_${startDateStr}_to_${endDateStr}.${getFileExtension(exportFormat)}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            console.log(`[ReportsSection] Successfully exported ${report.name} as ${exportFormat}`);
        } catch (error: any) {
            console.error(`[ReportsSection] Error exporting ${report.name} as ${exportFormat}:`, error);
            // You could add a toast notification here
        } finally {
            setExportLoading(null);
        }
    };

    // Get content type for different formats
    const getContentType = (exportFormat: string): string => {
        switch (exportFormat) {
            case 'csv': return 'text/csv';
            case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'pdf': return 'application/pdf';
            case 'word': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            default: return 'application/octet-stream';
        }
    };

    // Get file extension for different formats
    const getFileExtension = (exportFormat: string): string => {
        switch (exportFormat) {
            case 'csv': return 'csv';
            case 'excel': return 'xlsx';
            case 'pdf': return 'pdf';
            case 'word': return 'docx';
            default: return 'txt';
        }
    };

    // Load report data for preview
    const loadReportData = async (report: ReportData) => {
        setLoading(true);
        try {
            const params = {
                startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
                endDate: format(dateRange.endDate, 'yyyy-MM-dd')
            };

            const response = await api.get(report.endpoint, { params });
            setReportData(response.data);
        } catch (error) {
            console.error(`[ReportsSection] Error loading ${report.name}:`, error);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle report selection
    const handleReportSelect = (report: ReportData) => {
        setSelectedReport(report);
        loadReportData(report);
    };

    // Handle bulk export - generates all reports in Excel format
    const handleBulkExport = async () => {
        setExportLoading('bulk');
        
        try {
            const startDateStr = dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : '';
            const endDateStr = dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : '';
            
            // Create a comprehensive report package
            const reportPromises = AVAILABLE_REPORTS.map(async (report) => {
                try {
                    const response = await api.get(`${report.endpoint}/export`, {
                        params: {
                            format: 'excel', // Use Excel for comprehensive reports
                            startDate: startDateStr,
                            endDate: endDateStr
                        },
                        responseType: 'blob'
                    });
                    
                    return {
                        name: report.name,
                        blob: response.data,
                        success: true
                    };
                } catch (error) {
                    console.error(`Failed to generate ${report.name}:`, error);
                    return {
                        name: report.name,
                        error: error.message,
                        success: false
                    };
                }
            });

            const results = await Promise.all(reportPromises);
            const successfulReports = results.filter(r => r.success);
            const failedReports = results.filter(r => !r.success);

            // Download successful reports
            successfulReports.forEach((report, index) => {
                setTimeout(() => {
                    const url = window.URL.createObjectURL(report.blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${report.name.toLowerCase().replace(/\s+/g, '_')}_${startDateStr}_to_${endDateStr}.xlsx`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                }, index * 500); // Stagger downloads to avoid browser blocking
            });

            // Show summary
            const message = `Generated ${successfulReports.length} reports successfully.${
                failedReports.length > 0 ? ` ${failedReports.length} reports failed.` : ''
            }`;
            
            console.log(`[ReportsSection] Bulk export completed: ${message}`);
            
            // You could add a toast notification here
            alert(message);

        } catch (error) {
            console.error('[ReportsSection] Bulk export failed:', error);
            alert('Failed to generate reports. Please try again.');
        } finally {
            setExportLoading(null);
        }
    };

    // Render the appropriate report content based on selected report
    const renderReportContent = () => {
        if (!selectedReport) {
            return (
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium">Select a Report</p>
                    <p className="text-sm mt-2">Choose a report from the grid above to view its content</p>
                </div>
            );
        }

        const startDateStr = dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : undefined;
        const endDateStr = dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : undefined;

        console.log('[ReportsSection] Rendering report:', selectedReport.name);
        
        switch (selectedReport.name) {
            case 'Fraud Detection Summary':
                console.log('[ReportsSection] Rendering FraudSummaryReport');
                return <FraudSummaryReport startDate={startDateStr} endDate={endDateStr} />;
            
            case 'Transaction Volume Analysis':
                console.log('[ReportsSection] Rendering TransactionVolumeReport');
                return <TransactionVolumeReport startDate={startDateStr} endDate={endDateStr} limit={100} />;
            
            case 'High-Risk Transactions':
                console.log('[ReportsSection] Rendering HighRiskTransactionsReport');
                return <HighRiskTransactionsReport startDate={startDateStr} endDate={endDateStr} limit={50} />;
            
            case 'Transaction & Anomaly Trends':
                console.log('[ReportsSection] Rendering TransactionsAnomalyTrendChart');
                return <TransactionsAnomalyTrendChart />;
            
            case 'Anomaly Distribution Report':
                console.log('[ReportsSection] Rendering AnomalyDistributionReport with dates:', startDateStr, endDateStr);
                return <AnomalyDistributionReport 
                    key={`anomaly-${startDateStr}-${endDateStr}-${Date.now()}`}
                    startDate={startDateStr} 
                    endDate={endDateStr} 
                />;
            
            case 'User Activity Report':
                console.log('[ReportsSection] Rendering UserActivityReport');
                return <UserActivityReport 
                    key={`user-activity-${startDateStr}-${endDateStr}-${Date.now()}`}
                    startDate={startDateStr} 
                    endDate={endDateStr} 
                    limit={50} 
                />;
            
            default:
                return (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium">Report Not Available</p>
                        <p className="text-sm mt-2">This report type is not yet implemented</p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Reports & Analytics
                        </h2>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <button
                            onClick={handleBulkExport}
                            disabled={exportLoading !== null}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                        >
                            {exportLoading === 'bulk' ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            Generate All Reports
                        </button>
                    </div>
                </div>

                {/* Date Range Filter */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={format(dateRange.startDate, 'yyyy-MM-dd')}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={format(dateRange.endDate, 'yyyy-MM-dd')}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6">
                {!selectedReport ? (
                    /* Report Selection Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {AVAILABLE_REPORTS.map((report) => {
                            const IconComponent = report.icon;
                            return (
                                <div
                                    key={report.name}
                                    onClick={() => handleReportSelect(report)}
                                    className="group cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                                                <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {report.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                {report.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {report.exportFormats.map((format) => {
                                                    const config = EXPORT_FORMAT_CONFIG[format];
                                                    const FormatIcon = config.icon;
                                                    return (
                                                        <span
                                                            key={format}
                                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
                                                        >
                                                            <FormatIcon className="w-3 h-3 mr-1" />
                                                            {config.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Selected Report View */
                    <div>
                        {/* Report Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    ←
                                </button>
                                <selectedReport.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {selectedReport.name}
                                </h3>
                            </div>
                            
                            {/* Export Buttons */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => loadReportData(selectedReport)}
                                    disabled={loading}
                                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    Refresh
                                </button>
                                
                                {selectedReport.exportFormats.map((format) => {
                                    const config = EXPORT_FORMAT_CONFIG[format];
                                    const FormatIcon = config.icon;
                                    const isLoading = exportLoading === `${selectedReport.name}-${format}`;
                                    
                                    return (
                                        <button
                                            key={format}
                                            onClick={() => handleExport(selectedReport, format)}
                                            disabled={isLoading}
                                            className={`flex items-center px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                                                format === 'csv' ? 'bg-green-600 hover:bg-green-700' :
                                                format === 'excel' ? 'bg-blue-600 hover:bg-blue-700' :
                                                format === 'pdf' ? 'bg-red-600 hover:bg-red-700' :
                                                'bg-purple-600 hover:bg-purple-700'
                                            }`}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <FormatIcon className="w-4 h-4 mr-2" />
                                            )}
                                            {config.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Report Content */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                            {renderReportContent()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsSection;
