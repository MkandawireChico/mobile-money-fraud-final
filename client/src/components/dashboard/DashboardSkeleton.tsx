import React from 'react';
import SkeletonLoader from '../common/SkeletonLoader.tsx';

const MetricCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <SkeletonLoader variant="text" width="60%" height="16px" className="mb-2" />
        <SkeletonLoader variant="text" width="40%" height="32px" className="mb-2" />
        <SkeletonLoader variant="text" width="80%" height="14px" />
      </div>
      <SkeletonLoader variant="circular" width="48px" height="48px" />
    </div>
  </div>
);

const ChartSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
    <div className="flex items-center justify-between mb-4">
      <SkeletonLoader variant="text" width="150px" height="20px" />
      <SkeletonLoader variant="text" width="80px" height="14px" />
    </div>
    <div className="flex items-end justify-between h-[300px] space-x-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonLoader
          key={index}
          variant="rectangular"
          width="100%"
          height={`${Math.random() * 60 + 40}%`}
          className="flex-1"
        />
      ))}
    </div>
  </div>
);

const QuickActionSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
    <SkeletonLoader variant="text" width="120px" height="20px" className="mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-center">
            <SkeletonLoader variant="circular" width="32px" height="32px" className="mx-auto mb-2" />
            <SkeletonLoader variant="text" width="80px" height="14px" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const NavigationCardSkeleton: React.FC = () => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
    <SkeletonLoader variant="text" width="120px" height="20px" className="mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SkeletonLoader variant="text" width="100px" height="16px" className="mb-2" />
              <SkeletonLoader variant="text" width="140px" height="14px" />
            </div>
            <SkeletonLoader variant="circular" width="20px" height="20px" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface DashboardSkeletonProps {
  showMetrics?: boolean;
  showCharts?: boolean;
  showQuickActions?: boolean;
  showNavigation?: boolean;
}

const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  showMetrics = true,
  showCharts = true,
  showQuickActions = true,
  showNavigation = true,
}) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen font-inter antialiased">
      {/* Header Skeleton */}
      <div className="mb-6">
        <SkeletonLoader variant="text" width="200px" height="32px" className="mb-2" />
        <SkeletonLoader variant="text" width="300px" height="16px" />
      </div>

      {/* Metrics Cards Skeleton */}
      {showMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Charts Skeleton */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      )}

      {/* Quick Actions Skeleton */}
      {showQuickActions && <QuickActionSkeleton />}

      {/* Navigation Cards Skeleton */}
      {showNavigation && <NavigationCardSkeleton />}
    </div>
  );
};

export default DashboardSkeleton;
export { MetricCardSkeleton, ChartSkeleton, QuickActionSkeleton, NavigationCardSkeleton };
