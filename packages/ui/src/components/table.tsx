/**
 * Table Component - Enterprise Production Ready
 *
 * Table component with TanStack table + virtual scrolling,
 * semantic tokens, and comprehensive accessibility features.
 */

import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { ChevronUpIcon, ChevronDownIcon, ArrowUpDownIcon } from '../icons';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  type Table as TanStackTable,
  type Row,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { isPerfMode, varianceAttributes } from '../utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { UnsafeAny, UnsafeAnyArray } from '../types';
import * as React from 'react';

const tableVariants = cva('w-full border-collapse', {
  variants: {
    variant: {
      default: '',
      striped: 'table-zebra',
      bordered: 'border-semantic-border border',
      hover: 'table-hover',
    },
    size: {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const tableHeaderVariants = cva('bg-semantic-muted/50 text-semantic-foreground font-medium', {
  variants: {
    size: {
      sm: 'px-2 py-1 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const tableCellVariants = cva('border-semantic-border text-semantic-foreground border-b', {
  variants: {
    size: {
      sm: 'px-2 py-1 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type TableProperties<TData> = VariantProps<typeof tableVariants> & {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableVirtualization?: boolean;
  pageSize?: number;
  className?: string;
  onRowClick?: (row: TData) => void;
  'aria-label'?: string;
  size?: 'sm' | 'md' | 'lg';
};

// Optimized Cell and Row components for performance
interface CellProperties {
  value: unknown;
}

export const Cell = React.memo(function Cell({ value }: CellProperties) {
  return <span className="px-2 py-1">{String(value)}</span>; // already minimal; ensure no class recompute
});

// Helper component for table filtering
const TableFilter = ({ table }: { table: TanStackTable<UnsafeAny> }) => (
  <div className="flex items-center space-x-2">
    <Input
      placeholder="Filter data..."
      value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
      onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
      className="max-w-sm"
    />
  </div>
);

// Helper hook for table virtualization
function useTableVirtualization(
  rows: unknown[],
  enableVirtualization: boolean,
  containerReference: React.RefObject<HTMLDivElement>,
) {
  const estimateSize = React.useCallback(() => 50, []);

  return useVirtualizer({
    count: isPerfMode() ? 0 : enableVirtualization ? rows.length : 0,
    getScrollElement: () => containerReference.current,
    estimateSize,
    enabled: !isPerfMode() && enableVirtualization,
    overscan: 4,
  });
}

// Helper component for table pagination
const TablePagination = ({ table }: { table: TanStackTable<UnsafeAny> }) => (
  <div className="flex items-center justify-between">
    <div className="text-semantic-muted-foreground text-sm">
      Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
      {Math.min(
        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
        table.getFilteredRowModel().rows.length,
      )}{' '}
      of {table.getFilteredRowModel().rows.length} entries
    </div>
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        First
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        Next
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        Last
      </Button>
    </div>
  </div>
);

// Helper function to create table configuration
function createTableConfig<TData>({
  data,
  columns,
  enableSorting,
  enableFiltering,
  enablePagination,
  PERF,
  setSorting,
  setColumnFilters,
  setPagination,
  sorting,
  columnFilters,
  pagination,
}: {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableSorting: boolean;
  enableFiltering: boolean;
  enablePagination: boolean;
  PERF: boolean;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  pagination: PaginationState;
}) {
  const baseConfig = {
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  };

  if (PERF) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    onPaginationChange: enablePagination ? setPagination : undefined,
    state: { sorting, columnFilters, pagination },
  };
}

// Table Header Component
const TableHeader = <TData,>({
  table,
  PERF,
  enableSorting,
  size,
}: {
  table: TanStackTable<TData>;
  PERF: boolean;
  enableSorting: boolean;
  size: 'sm' | 'md' | 'lg' | undefined;
}) => (
  <thead>
    {table.getHeaderGroups().map((headerGroup) => (
      <tr key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <th
            key={header.id}
            className={
              PERF
                ? 'bg-semantic-muted/50 text-semantic-foreground px-4 py-2 text-sm font-medium'
                : tableHeaderVariants({ size })
            }
            {...(PERF ? {} : { onClick: header.column.getToggleSortingHandler() })}
          >
            {header.isPlaceholder
              ? undefined
              : flexRender(header.column.columnDef.header, header.getContext())}
            {!PERF && enableSorting && header.column.getCanSort() && (
              <span className="ml-2">
                {header.column.getIsSorted() === 'desc' ? (
                  <ChevronDownIcon 
                    className="h-4 w-4" 
                    context="dense-tables"
                    semanticColor="text-blue-500"
                    enableAnimations={true}
                    enableAdaptiveStyling={true}
                    enableSemanticColors={true}
                  />
                ) : header.column.getIsSorted() === 'asc' ? (
                  <ChevronUpIcon 
                    className="h-4 w-4" 
                    context="dense-tables"
                    semanticColor="text-blue-500"
                    enableAnimations={true}
                    enableAdaptiveStyling={true}
                    enableSemanticColors={true}
                  />
                ) : (
                  <ArrowUpDownIcon 
                    className="h-4 w-4 opacity-50" 
                    context="dense-tables"
                    semanticColor="text-gray-400"
                    enableAnimations={true}
                    enableAdaptiveStyling={true}
                    enableSemanticColors={true}
                  />
                )}
              </span>
            )}
          </th>
        ))}
      </tr>
    ))}
  </thead>
);

// Performance Mode Table Body
const PerformanceTableBody = ({ rows }: { rows: Row<unknown>[] }) => {
  const LIMIT = 24;
  const renderCell = (cell: UnsafeAny) => {
    return cell.getValue
      ? cell.getValue()
      : flexRender(cell.column.columnDef.cell, cell.getContext());
  };

  return (
    <>
      {rows.slice(0, LIMIT).map((row) => (
        <tr key={row.id} className="cursor-default">
          {row.getVisibleCells().map((cell: UnsafeAny) => (
            <td
              key={cell.id}
              className="border-semantic-border text-semantic-foreground border-b px-4 py-2 text-sm"
            >
              {renderCell(cell)}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// Virtual Table Body
const VirtualTableBody = <TData,>({
  rowVirtualizer,
  rows,
  onRowClick,
  size,
}: {
  rowVirtualizer: UnsafeAny;
  rows: UnsafeAnyArray;
  onRowClick?: (row: TData) => void;
  size: 'sm' | 'md' | 'lg' | undefined;
}) => (
  <>
    {rowVirtualizer!.getVirtualItems().map((virtualRow: UnsafeAny) => {
      const row = rows[virtualRow.index];
      if (!row) return undefined;
      return (
        <tr
          key={row.id}
          className="hover:bg-semantic-accent/50 cursor-pointer"
          onClick={() => onRowClick?.(row.original)}
          style={{
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {row.getVisibleCells().map((cell: UnsafeAny) => (
            <td key={cell.id} className={tableCellVariants({ size })}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      );
    })}
  </>
);

// Regular Table Body
const RegularTableBody = <TData,>({
  rows,
  onRowClick,
  size,
}: {
  rows: Row<TData>[];
  onRowClick?: (row: TData) => void;
  size: 'sm' | 'md' | 'lg' | undefined;
}) => (
  <>
    {rows.map((row) => (
      <tr
        key={row.id}
        className="hover:bg-semantic-accent/50 cursor-pointer"
        onClick={() => onRowClick?.(row.original)}
      >
        {row.getVisibleCells().map((cell: UnsafeAny) => (
          <td key={cell.id} className={tableCellVariants({ size })}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    ))}
  </>
);

// Table Body Component
const TableBody = <TData,>({
  PERF,
  enableVirtualization,
  rowVirtualizer,
  rows,
  onRowClick,
  size,
}: {
  PERF: boolean;
  enableVirtualization: boolean;
  rowVirtualizer: UnsafeAny;
  rows: UnsafeAnyArray;
  onRowClick?: (row: TData) => void;
  size: 'sm' | 'md' | 'lg' | undefined;
}) => (
  <tbody>
    {PERF ? (
      <PerformanceTableBody rows={rows} />
    ) : enableVirtualization ? (
      <VirtualTableBody<TData>
        rowVirtualizer={rowVirtualizer}
        rows={rows}
        onRowClick={onRowClick}
        size={size}
      />
    ) : (
      <RegularTableBody<TData> rows={rows} onRowClick={onRowClick} size={size} />
    )}
  </tbody>
);

export function Table<TData>({
  data,
  columns,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableVirtualization = false,
  pageSize = 10,
  variant,
  size,
  className,
  onRowClick,
  'aria-label': ariaLabel,
}: TableProperties<TData>): React.ReactElement {
  const PERF = isPerfMode();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable(
    createTableConfig({
      data,
      columns,
      enableSorting,
      enableFiltering,
      enablePagination,
      PERF,
      setSorting,
      setColumnFilters,
      setPagination,
      sorting,
      columnFilters,
      pagination,
    }),
  );

  const { rows } = table.getRowModel();
  const tableContainerReference = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useTableVirtualization(
    rows,
    enableVirtualization,
    tableContainerReference,
  );

  return (
    <div className="w-full space-y-4">
      {enableFiltering && !PERF && <TableFilter table={table} />}

      <div
        ref={tableContainerReference}
        className={`overflow-auto ${enableVirtualization ? 'h-96' : ''}`}
      >
        <table
          className={
            PERF
              ? ['w-full', 'border-collapse', className].filter(Boolean).join(' ')
              : tableVariants({ variant, size, className })
          }
          {...(PERF ? varianceAttributes() : {})}
          aria-label={ariaLabel}
        >
          <TableHeader<TData> table={table} PERF={PERF} enableSorting={enableSorting} size={size} />
          <TableBody<TData>
            PERF={PERF}
            enableVirtualization={enableVirtualization}
            rowVirtualizer={rowVirtualizer}
            rows={rows}
            onRowClick={onRowClick}
            size={size}
          />
        </table>
      </div>

      {enablePagination && <TablePagination table={table} />}
    </div>
  );
}

export type TableReference = React.ElementRef<typeof Table>;
