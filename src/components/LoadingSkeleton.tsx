import React from 'react';

interface LoadingSkeletonProps {
  type?: 'pdf' | 'analysis' | 'page';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'pdf', count = 1 }) => {
  const renderPdfSkeleton = () => (
    <div className="w-full h-full bg-gray-50 animate-pulse flex flex-col items-center p-4">
      {/* PDF Toolbar Skeleton */}
      <div className="w-full max-w-md h-10 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
        <div className="flex space-x-2">
          <div className="w-8 h-6 bg-gray-300 rounded"></div>
          <div className="w-12 h-6 bg-gray-300 rounded"></div>
          <div className="w-8 h-6 bg-gray-300 rounded"></div>
        </div>
      </div>
      
      {/* PDF Page Skeleton */}
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="aspect-[8.5/11] bg-linear-to-br from-gray-100 to-gray-200 relative">
          {/* Simulated text lines */}
          <div className="absolute inset-6 space-y-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div 
                  className="h-3 bg-gray-300 rounded"
                  style={{ width: `${85 + Math.random() * 15}%` }}
                ></div>
                <div 
                  className="h-3 bg-gray-300 rounded"
                  style={{ width: `${70 + Math.random() * 25}%` }}
                ></div>
              </div>
            ))}
          </div>
          
          {/* Loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-gray-600 font-medium">Loading PDF...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Page indicator skeleton */}
      <div className="mt-4 flex items-center space-x-2">
        <div className="w-16 h-6 bg-gray-200 rounded"></div>
        <div className="w-8 h-6 bg-gray-200 rounded"></div>
        <div className="w-16 h-6 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  const renderAnalysisSkeleton = () => (
    <div className="w-full h-full bg-white p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      
      {/* Analysis sections skeleton */}
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="border-l-4 border-gray-200 pl-4">
            {/* Section title */}
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-3"></div>
            
            {/* Section content */}
            <div className="space-y-2">
              {Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map((_, j) => (
                <div 
                  key={j}
                  className="h-4 bg-gray-100 rounded"
                  style={{ width: `${60 + Math.random() * 35}%` }}
                ></div>
              ))}
            </div>
            
            {/* Page reference skeleton */}
            <div className="mt-3 flex items-center space-x-2">
              <div className="w-12 h-5 bg-blue-100 rounded"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Loading indicator */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-white shadow-lg rounded-lg p-3 border">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-sm text-gray-600">Loading analysis...</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPageSkeleton = () => (
  <div className="w-full bg-white shadow-lg rounded-lg overflow-hidden animate-pulse">
  <div className="aspect-[8.5/11] bg-linear-to-br from-gray-50 to-gray-100 relative">
        {/* Simulated content blocks */}
        <div className="absolute inset-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div 
                className="h-3 bg-gray-200 rounded"
                style={{ width: `${75 + Math.random() * 20}%` }}
              ></div>
              <div 
                className="h-3 bg-gray-200 rounded"
                style={{ width: `${65 + Math.random() * 25}%` }}
              ></div>
            </div>
          ))}
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -skew-x-12 opacity-20">
          <div className="w-full h-full bg-linear-to-r from-transparent via-white to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (type === 'analysis') {
    return renderAnalysisSkeleton();
  }
  
  if (type === 'page') {
    return renderPageSkeleton();
  }

  return renderPdfSkeleton();
};

export default LoadingSkeleton;