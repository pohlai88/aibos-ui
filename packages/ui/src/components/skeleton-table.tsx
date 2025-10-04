import { cn } from '../utils/cn.utility';
import { TableIcon } from '../icons';
import React from 'react';

export interface SkeletonTableProperties {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProperties> = ({
  rows = 5,
  columns = 4,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="rounded-md border">
        {/* Header */}
        <div className="bg-muted/50 border-b">
          <div className="flex items-center justify-center p-4">
            <TableIcon 
              className="text-muted-foreground h-6 w-6 animate-pulse" 
              context="dense-tables"
              semanticColor="text-gray-400"
              enableAnimations={true}
              enableAdaptiveStyling={true}
              enableSemanticColors={true}
            />
          </div>
          <div className="flex">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1 p-4">
                <div className="bg-muted h-4 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b last:border-b-0">
            <div className="flex">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1 p-4">
                  <div className="bg-muted h-4 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
