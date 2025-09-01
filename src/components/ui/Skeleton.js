import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-gray-300/50 dark:bg-gray-700/50 ${className}`}/>
);

export const CardSkeleton = () => (
  <div className="card">
    <Skeleton className="h-6 w-1/3 mb-4"/>
    <Skeleton className="h-4 w-2/3 mb-2"/>
    <Skeleton className="h-4 w-1/2"/>
  </div>
);
