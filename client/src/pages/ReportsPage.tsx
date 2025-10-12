import React from 'react';
import { FileText, Download, Calendar, Filter, ArrowLeft } from 'lucide-react';
import { useHistory } from 'react-router-dom';
import ReportsSection from '../components/reports/ReportsSection.tsx';

const ReportsPage: React.FC = () => {
  const history = useHistory();
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen font-inter antialiased">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center">
            <button
              onClick={() => history.push('/dashboard')}
              className="mr-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <FileText size={36} className="mr-4 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports & Export</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Generate comprehensive reports and export data in multiple formats</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <Download className="h-4 w-4" />
              <span>Export formats: CSV, Excel, PDF, Word</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Reports</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">6</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Export Formats</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">4</p>
            </div>
            <Download className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Date Range</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Custom</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtering</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Advanced</p>
            </div>
            <Filter className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <ReportsSection />

      {/* Report Guidelines */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Report Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Export Formats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400"><strong>CSV:</strong> Lightweight format for data analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400"><strong>Excel:</strong> Rich formatting with charts and styling</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400"><strong>PDF:</strong> Professional presentation format</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400"><strong>Word:</strong> Detailed document format</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Best Practices</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                <span>Select appropriate date ranges to avoid large file sizes</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                <span>Use CSV for data analysis and Excel for presentations</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                <span>PDF reports are ideal for compliance and audit purposes</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                <span>Schedule regular reports for consistent monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
