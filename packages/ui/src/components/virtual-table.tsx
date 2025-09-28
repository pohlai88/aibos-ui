import { cn } from '../utils/cn.utility';
import React, { useMemo } from 'react';

export interface VirtualTableColumn<T = unknown> {
  key: string;
  title: string;
  width?: number;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
}

export interface VirtualTableProperties<T = unknown> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  height?: number;
  itemHeight?: number;
  className?: string;
  onRowClick?: (record: T, index: number) => void;
}

// Table Header Component
const VirtualTableHeader = <T,>({ columns }: { columns: VirtualTableColumn<T>[] }) => (
  <div className="bg-muted/50 border-b" role="rowgroup">
    <div className="flex" role="row">
      {columns.map((column) => (
        <div
          key={column.key}
          className="flex-1 p-4 text-sm font-medium"
          style={{ width: column.width }}
          role="columnheader"
          tabIndex={0}
        >
          {column.title}
        </div>
      ))}
    </div>
  </div>
);

// Table Row Component
const VirtualTableRow = <T,>({
  record,
  index,
  columns,
  itemHeight,
  onRowClick,
}: {
  record: T;
  index: number;
  columns: VirtualTableColumn<T>[];
  itemHeight: number;
  onRowClick?: (record: T, index: number) => void;
}) => {
  const handleRowKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick?.(record, index);
    }
  };

  return (
    <div
      className="hover:bg-muted/50 focus:bg-muted/50 focus:ring-ring cursor-pointer border-b last:border-b-0 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        height: itemHeight,
        position: 'absolute',
        top: index * itemHeight,
        left: 0,
        right: 0,
      }}
      role="row"
      tabIndex={0}
      onClick={() => onRowClick?.(record, index)}
      onKeyDown={handleRowKeyDown}
      aria-label={`Row ${index + 1}`}
    >
      <div className="flex h-full">
        {columns.map((column) => (
          <div
            key={column.key}
            className="flex flex-1 items-center p-4"
            style={{ width: column.width }}
            role="cell"
          >
            {column.render
              ? column.render((record as Record<string, unknown>)[column.key], record, index)
              : String((record as Record<string, unknown>)[column.key] ?? '')}
          </div>
        ))}
      </div>
    </div>
  );
};

// Table Body Component
const VirtualTableBody = <T,>({
  visibleData,
  columns,
  itemHeight,
  totalHeight,
  onRowClick,
}: {
  visibleData: T[];
  columns: VirtualTableColumn<T>[];
  itemHeight: number;
  totalHeight: number;
  onRowClick?: (record: T, index: number) => void;
}) => (
  <div style={{ height: totalHeight, position: 'relative' }}>
    {visibleData.map((record, index) => (
      <VirtualTableRow<T>
        key={index}
        record={record}
        index={index}
        columns={columns}
        itemHeight={itemHeight}
        onRowClick={onRowClick}
      />
    ))}
  </div>
);

export const VirtualTable = <T,>({
  data,
  columns,
  height = 400,
  itemHeight = 50,
  className,
  onRowClick,
}: VirtualTableProperties<T>): React.ReactElement => {
  const visibleCount = Math.ceil(height / itemHeight);
  const totalHeight = data.length * itemHeight;

  const visibleData = useMemo(() => {
    return data.slice(0, visibleCount);
  }, [data, visibleCount]);

  return (
    <div
      className={cn('overflow-hidden rounded-md border', className)}
      role="table"
      aria-label="Data table"
    >
      <VirtualTableHeader<T> columns={columns} />
      <div style={{ height, overflow: 'auto' }} role="rowgroup">
        <VirtualTableBody<T>
          visibleData={visibleData}
          columns={columns}
          itemHeight={itemHeight}
          totalHeight={totalHeight}
          onRowClick={onRowClick}
        />
      </div>
    </div>
  );
};
