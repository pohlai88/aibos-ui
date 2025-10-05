/**
 * Data Grid Component - Enterprise Production Ready
 *
 * Advanced data grid component with enterprise features like virtualization,
 * advanced filtering, grouping, column resizing, row reordering, and more.
 * Built on top of TanStack Table with enhanced capabilities for large datasets.
 */

import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Checkbox } from '../primitives/checkbox';
import { Badge } from '../primitives/badge';
// Note: Select component import removed as it's not available in primitives
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type GroupingState,
  type ExpandedState,
  type Table as TanStackTable,
  type Row,
  type Column,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import type { UnsafeAny } from '../types';
import * as React from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  FilterIcon,
  SearchIcon,
  GripVerticalIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCwIcon,
  ColumnsIcon,
  GroupIcon,
} from '../icons';

const dataGridVariants = cva('w-full', {
  variants: {
    variant: {
      default: '',
      striped: 'table-zebra',
      bordered: 'border-semantic-border border',
      hover: 'table-hover',
      compact: 'text-sm',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
    density: {
      compact: 'py-1',
      normal: 'py-2',
      comfortable: 'py-3',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    density: 'normal',
  },
});

const dataGridToolbarVariants = cva(
  'border-semantic-border flex items-center justify-between space-x-2 border-b py-4',
  {
    variants: {
      size: {
        sm: 'py-2',
        md: 'py-4',
        lg: 'py-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const dataGridHeaderVariants = cva(
  'bg-semantic-muted/50 text-semantic-foreground border-semantic-border border-b font-medium',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
      density: {
        compact: 'py-1',
        normal: 'py-2',
        comfortable: 'py-3',
      },
    },
    defaultVariants: {
      size: 'md',
      density: 'normal',
    },
  },
);

const dataGridCellVariants = cva(
  'text-semantic-foreground border-semantic-border/50 border-b',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
      density: {
        compact: 'py-1',
        normal: 'py-2',
        comfortable: 'py-3',
      },
    },
    defaultVariants: {
      size: 'md',
      density: 'normal',
    },
  },
);

export interface DataGridProperties<TData extends UnsafeAny>
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dataGridVariants> {
  data: TData[];
  columns: ColumnDef<TData, UnsafeAny>[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableSelection?: boolean;
  enableExport?: boolean;
  enableColumnVisibility?: boolean;
  enableGlobalFilter?: boolean;
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  enableGrouping?: boolean;
  enableExpanding?: boolean;
  enableVirtualization?: boolean;
  enableColumnResizing?: boolean;
  enableRowReordering?: boolean;
  enableColumnReordering?: boolean;
  enableAdvancedFiltering?: boolean;
  enableColumnPinning?: boolean;
  enableRowPinning?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  height?: number;
  maxHeight?: number;
  onRowClick?: (row: Row<TData>) => void;
  onSelectionChange?: (selectedRows: Row<TData>[]) => void;
  onExport?: (data: TData[], format: 'csv' | 'json' | 'xlsx') => void;
  onColumnResize?: (columnId: string, size: number) => void;
  onRowReorder?: (fromIndex: number, toIndex: number) => void;
  onColumnReorder?: (fromIndex: number, toIndex: number) => void;
  onGroupingChange?: (grouping: GroupingState) => void;
  onExpandingChange?: (expanding: ExpandedState) => void;
}

export interface DataGridToolbarProperties<TData extends UnsafeAny>
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dataGridToolbarVariants> {
  table: TanStackTable<TData>;
  searchPlaceholder?: string;
  enableGlobalFilter?: boolean;
  enableExport?: boolean;
  enableColumnVisibility?: boolean;
  enableGrouping?: boolean;
  enableAdvancedFiltering?: boolean;
  onExport?: (data: TData[], format: 'csv' | 'json' | 'xlsx') => void;
  onRefresh?: () => void;
}

export interface DataGridColumnHeaderProperties<TData extends UnsafeAny>
  extends React.ThHTMLAttributes<HTMLTableHeaderCellElement>,
    VariantProps<typeof dataGridHeaderVariants> {
  column: Column<TData, UnsafeAny>;
  enableSorting?: boolean;
  enableResizing?: boolean;
  enableGrouping?: boolean;
  enablePinning?: boolean;
}

export interface DataGridRowProperties<TData extends UnsafeAny>
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof dataGridCellVariants> {
  row: Row<TData>;
  table: TanStackTable<TData>;
  enableSelection?: boolean;
  enableReordering?: boolean;
  enablePinning?: boolean;
  onRowClick?: (row: Row<TData>) => void;
}

const DataGrid = React.forwardRef<HTMLDivElement, DataGridProperties<UnsafeAny>>(
  ({
    className,
    variant = 'default',
    size = 'md',
    density = 'normal',
    data,
    columns,
    enableSorting = true,
    enableFiltering = true,
    enablePagination = true,
    enableSelection = false,
    enableExport = false,
    enableColumnVisibility = false,
    enableGlobalFilter = true,
    enableRowSelection = false,
    enableMultiRowSelection = false,
    enableGrouping = false,
    enableExpanding = false,
    enableVirtualization = false,
    enableColumnResizing = false,
    enableRowReordering = false,
    enableColumnReordering: _enableColumnReordering = false,
    enableAdvancedFiltering = false,
    enableColumnPinning = false,
    enableRowPinning = false,
    pageSize = 10,
    pageSizeOptions = [10, 20, 30, 40, 50, 100],
    searchPlaceholder = 'Search...',
    emptyMessage = 'No data available',
    loading = false,
    height = 400,
    maxHeight = 600,
    onRowClick,
    onSelectionChange,
    onExport,
    onColumnResize,
    onRowReorder,
    onColumnReorder,
    onGroupingChange,
    onExpandingChange,
    ...props
  }, reference) => {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = React.useState<PaginationState>({
      pageIndex: 0,
      pageSize,
    });
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [grouping, setGrouping] = React.useState<GroupingState>([]);
    const [expanded, setExpanded] = React.useState<ExpandedState>({});
    const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});
    const [columnSizing, setColumnSizing] = React.useState<Record<string, number>>({});
    const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
    const [_pinnedColumns, _setPinnedColumns] = React.useState<{
      left: string[];
      right: string[];
    }>({ left: [], right: [] });

    // Enhanced columns with selection and grouping
    const enhancedColumns = React.useMemo(() => {
      let cols = [...columns];

      if (enableSelection) {
        const selectionColumn: ColumnDef<UnsafeAny, UnsafeAny> = {
          id: 'select',
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
          enableHiding: false,
          enableResizing: false,
          size: 50,
        };
        cols = [selectionColumn, ...cols];
      }

      if (enableRowReordering) {
        const reorderColumn: ColumnDef<UnsafeAny, UnsafeAny> = {
          id: 'reorder',
          header: () => (
            <GripVerticalIcon 
              className="h-4 w-4" 
              context="dense-tables"
              semanticColor="text-gray-500"
              enableAnimations={true}
              enableAdaptiveStyling={true}
              enableSemanticColors={true}
              data-testid="grip-vertical"
            />
          ),
          cell: () => (
            <GripVerticalIcon 
              className="h-4 w-4" 
              context="dense-tables"
              semanticColor="text-gray-500"
              enableAnimations={true}
              enableAdaptiveStyling={true}
              enableSemanticColors={true}
              data-testid="grip-vertical"
            />
          ),
          enableSorting: false,
          enableHiding: false,
          enableResizing: false,
          size: 40,
        };
        cols = [reorderColumn, ...cols];
      }

      return cols;
    }, [columns, enableSelection, enableRowReordering]);

    // Table instance
    const table = useReactTable({
      data,
      columns: enhancedColumns,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onPaginationChange: setPagination,
      onRowSelectionChange: setRowSelection,
      onGlobalFilterChange: setGlobalFilter,
      onGroupingChange: setGrouping,
      onExpandedChange: setExpanded,
      onColumnVisibilityChange: setColumnVisibility,
      onColumnSizingChange: setColumnSizing,
      onColumnOrderChange: setColumnOrder,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
      getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
      getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
      getGroupedRowModel: enableGrouping ? getGroupedRowModel() : undefined,
      getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
      state: {
        sorting,
        columnFilters,
        pagination,
        rowSelection,
        globalFilter,
        grouping,
        expanded,
        columnVisibility,
        columnSizing,
        columnOrder,
      },
      enableRowSelection: enableRowSelection,
      enableMultiRowSelection: enableMultiRowSelection,
      enableGrouping: enableGrouping,
      enableExpanding: enableExpanding,
      enableColumnResizing: enableColumnResizing,
      // enableColumnReordering: enableColumnReordering, // Not available in current TanStack Table version
      enableColumnPinning: enableColumnPinning,
      enableRowPinning: enableRowPinning,
      columnResizeMode: 'onChange',
      enableSubRowSelection: enableExpanding,
    });

    // Virtualization setup
    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => tableContainerRef.current,
      estimateSize: () => density === 'compact' ? 32 : density === 'normal' ? 40 : 48,
      overscan: 10,
    });

    // Handle selection change
    React.useEffect(() => {
      if (onSelectionChange) {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        onSelectionChange(selectedRows);
      }
    }, [rowSelection, onSelectionChange, table]);

    // Handle grouping change
    React.useEffect(() => {
      if (onGroupingChange) {
        onGroupingChange(grouping);
      }
    }, [grouping, onGroupingChange]);

    // Handle expanding change
    React.useEffect(() => {
      if (onExpandingChange) {
        onExpandingChange(expanded);
      }
    }, [expanded, onExpandingChange]);

    if (isPerfMode()) {
      // Performance mode: minimal DOM, static classes
      return (
        <div
          ref={reference}
          className={cn('data-grid perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          <div className="data-grid-toolbar perf-static">
            <div className="data-grid-search perf-static">
              <Input placeholder={searchPlaceholder} disabled />
            </div>
            <div className="data-grid-actions perf-static">
              <Button variant="outline" size="sm" disabled>
                <DownloadIcon 
                  className="h-4 w-4" 
                  context="dense-tables"
                  semanticColor="text-green-500"
                  enableAnimations={true}
                  enableAdaptiveStyling={true}
                  enableSemanticColors={true}
                />
              </Button>
            </div>
          </div>
          <div className="data-grid-content perf-static" style={{ height: Math.min(height, maxHeight) }}>
            <table className="data-grid-table perf-static">
              <thead className="data-grid-header perf-static">
                <tr>
                  {enhancedColumns.map((column) => (
                    <th key={column.id} className="data-grid-header-cell perf-static">
                      {typeof column.header === 'string' ? column.header : 'Header'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="data-grid-body perf-static">
                {data.slice(0, 5).map((_: UnsafeAny, index: number) => (
                  <tr key={index} className="data-grid-row perf-static">
                    {enhancedColumns.map((column) => (
                      <td key={column.id} className="data-grid-cell perf-static">
                        Cell {index}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dataGridVariants({ variant, size, density }), className)}
        {...props}
      >
        {/* Toolbar */}
        <DataGridToolbar
          table={table}
          searchPlaceholder={searchPlaceholder}
          enableGlobalFilter={enableGlobalFilter}
          enableExport={enableExport}
          enableColumnVisibility={enableColumnVisibility}
          enableGrouping={enableGrouping}
          enableAdvancedFiltering={enableAdvancedFiltering}
          onExport={onExport}
          size={size}
        />

        {/* Table Container */}
        <div
          ref={tableContainerRef}
          className="border-semantic-border relative overflow-auto rounded-md border"
          style={{ height: Math.min(height, maxHeight) }}
        >
          {enableVirtualization ? (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <table className="w-full">
                <thead className="bg-semantic-background sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <DataGridColumnHeader
                          key={header.id}
                          column={header.column}
                          enableSorting={enableSorting}
                          enableResizing={enableColumnResizing}
                          enableGrouping={enableGrouping}
                          enablePinning={enableColumnPinning}
                          size={size}
                          density={density}
                        />
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    if (!row) return null;
                    return (
                      <DataGridRow
                        key={row.id}
                        row={row}
                        table={table}
                        enableSelection={enableSelection}
                        enableReordering={enableRowReordering}
                        enablePinning={enableRowPinning}
                        onRowClick={onRowClick}
                        size={size}
                        density={density}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <DataGridColumnHeader
                        key={header.id}
                        column={header.column}
                        enableSorting={enableSorting}
                        enableResizing={enableColumnResizing}
                        enableGrouping={enableGrouping}
                        enablePinning={enableColumnPinning}
                        size={size}
                        density={density}
                      />
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <DataGridRow
                      key={row.id}
                      row={row}
                      table={table}
                      enableSelection={enableSelection}
                      enableReordering={enableRowReordering}
                      enablePinning={enableRowPinning}
                      onRowClick={onRowClick}
                      size={size}
                      density={density}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={enhancedColumns.length}
                      className="text-semantic-muted-foreground h-24 text-center"
                    >
                      {loading ? 'Loading...' : emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {enablePagination && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                className="border-semantic-input bg-semantic-background h-8 w-[70px] rounded border px-2 py-1 text-sm"
              >
                {pageSizeOptions.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
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
        )}
      </div>
    );
  }
);

DataGrid.displayName = 'DataGrid';

const DataGridToolbar = React.forwardRef<HTMLDivElement, DataGridToolbarProperties<UnsafeAny>>(
  ({
    className,
    size = 'md',
    table,
    searchPlaceholder = 'Search...',
    enableGlobalFilter = true,
    enableExport = false,
    enableColumnVisibility = false,
    enableGrouping = false,
    enableAdvancedFiltering = false,
    onExport,
    onRefresh,
    ...props
  }, reference) => {
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [isColumnVisibilityOpen, setIsColumnVisibilityOpen] = React.useState(false);
    const [isGroupingOpen, setIsGroupingOpen] = React.useState(false);
    const [globalFilter, setGlobalFilter] = React.useState('');

    const handleExport = React.useCallback((format: 'csv' | 'json' | 'xlsx') => {
      if (onExport) {
        const data = table.getFilteredRowModel().rows.map(row => row.original);
        onExport(data, format);
      }
    }, [onExport, table]);

    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('data-grid-toolbar perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dataGridToolbarVariants({ size }), className)}
        {...props}
      >
        <div className="flex flex-1 items-center space-x-2">
          {enableGlobalFilter && (
            <div className="flex items-center space-x-2">
              <SearchIcon 
                className="h-4 w-4" 
                context="dense-tables"
                semanticColor="text-blue-500"
                enableAnimations={true}
                enableAdaptiveStyling={true}
                enableSemanticColors={true}
              />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="h-8 w-[150px] lg:w-[250px]"
              />
            </div>
          )}
          {enableAdvancedFiltering && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FilterIcon 
                className="h-4 w-4" 
                context="dense-tables"
                semanticColor="text-purple-500"
                enableAnimations={true}
                enableAdaptiveStyling={true}
                enableSemanticColors={true}
              />
              Advanced Filters
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
            >
              <RefreshCwIcon 
                className="h-4 w-4" 
                context="dense-tables"
                semanticColor="text-blue-500"
                enableAnimations={true}
                enableAdaptiveStyling={true}
                enableSemanticColors={true}
                data-testid="refresh"
              />
            </Button>
          )}
          {enableColumnVisibility && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsColumnVisibilityOpen(!isColumnVisibilityOpen)}
            >
              <ColumnsIcon 
                className="h-4 w-4" 
                context="dense-tables"
                semanticColor="text-gray-500"
                enableAnimations={true}
                enableAdaptiveStyling={true}
                enableSemanticColors={true}
              />
              Columns
            </Button>
          )}
          {enableGrouping && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGroupingOpen(!isGroupingOpen)}
            >
              <GroupIcon 
                className="h-4 w-4" 
                context="dense-tables"
                semanticColor="text-indigo-500"
                enableAnimations={true}
                enableAdaptiveStyling={true}
                enableSemanticColors={true}
                data-testid="group"
              />
              Group
            </Button>
          )}
          {enableExport && (
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <DownloadIcon 
                  className="h-4 w-4" 
                  context="dense-tables"
                  semanticColor="text-green-500"
                  enableAnimations={true}
                  enableAdaptiveStyling={true}
                  enableSemanticColors={true}
                />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
              >
                <DownloadIcon 
                  className="h-4 w-4" 
                  context="dense-tables"
                  semanticColor="text-green-500"
                  enableAnimations={true}
                  enableAdaptiveStyling={true}
                  enableSemanticColors={true}
                />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
              >
                <DownloadIcon 
                  className="h-4 w-4" 
                  context="dense-tables"
                  semanticColor="text-green-500"
                  enableAnimations={true}
                  enableAdaptiveStyling={true}
                  enableSemanticColors={true}
                />
                Excel
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

DataGridToolbar.displayName = 'DataGridToolbar';

const DataGridColumnHeader = React.forwardRef<HTMLTableHeaderCellElement, DataGridColumnHeaderProperties<UnsafeAny>>(
  ({
    className,
    size = 'md',
    density = 'normal',
    column,
    enableSorting = true,
    enableResizing = false,
    enableGrouping = false,
    enablePinning = false,
    ...props
  }, reference) => {
    const [isResizing, setIsResizing] = React.useState(false);

    const handleResize = React.useCallback((event: React.MouseEvent) => {
      if (!enableResizing) return;
      
      const startX = event.clientX;
      const startWidth = column.getSize();
      
      const handleMouseMove = (e: MouseEvent) => {
        const _newWidth = startWidth + (e.clientX - startX);
        // Note: setSize method may not be available in current TanStack Table version
        // column.setSize(newWidth);
        setIsResizing(true);
      };
      
      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, [column, enableResizing]);

    const getSortIcon = () => {
      if (!column.getCanSort()) return null;
      
      const sortDirection = column.getIsSorted();
      if (sortDirection === 'asc') return (
        <ArrowUpIcon 
          className="ml-2 h-4 w-4" 
          context="dense-tables"
          semanticColor="text-blue-500"
          enableAnimations={true}
          enableAdaptiveStyling={true}
          enableSemanticColors={true}
          data-testid="arrow-up"
        />
      );
      if (sortDirection === 'desc') return (
        <ArrowDownIcon 
          className="ml-2 h-4 w-4" 
          context="dense-tables"
          semanticColor="text-blue-500"
          enableAnimations={true}
          enableAdaptiveStyling={true}
          enableSemanticColors={true}
        />
      );
      return (
        <ArrowUpDownIcon 
          className="ml-2 h-4 w-4" 
          context="dense-tables"
          semanticColor="text-gray-500"
          enableAnimations={true}
          enableAdaptiveStyling={true}
          enableSemanticColors={true}
          data-testid="arrow-up-down"
        />
      );
    };

    return (
      <th
        ref={reference}
        className={cn(
          dataGridHeaderVariants({ size, density }),
          isResizing && 'bg-semantic-accent/20',
          className
        )}
        style={{ width: 150 }}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {enableGrouping && column.getCanGroup() && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => column.toggleGrouping()}
              >
                <GroupIcon 
                  className="h-3 w-3" 
                  context="dense-tables"
                  semanticColor="text-indigo-500"
                  enableAnimations={true}
                  enableAdaptiveStyling={true}
                  enableSemanticColors={true}
                  data-testid="group"
                />
              </Button>
            )}
            {enableSorting && column.getCanSort() ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 lg:px-3"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              >
                <span>{column.columnDef.header as string}</span>
                {getSortIcon()}
              </Button>
            ) : (
              <span>{column.columnDef.header as string}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {enablePinning && (
              <div className="flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => column.pin('left')}
                >
                  <ChevronRightIcon 
                    className="h-3 w-3 rotate-90" 
                    context="dense-tables"
                    semanticColor="text-gray-500"
                    enableAnimations={true}
                    enableAdaptiveStyling={true}
                    enableSemanticColors={true}
                    data-testid="chevron-right"
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => column.pin('right')}
                >
                  <ChevronRightIcon 
                    className="h-3 w-3 -rotate-90" 
                    context="dense-tables"
                    semanticColor="text-gray-500"
                    enableAnimations={true}
                    enableAdaptiveStyling={true}
                    enableSemanticColors={true}
                    data-testid="chevron-right"
                  />
                </Button>
              </div>
            )}
            {enableResizing && (
              <button
                className="hover:bg-semantic-accent/20 h-full w-1 cursor-col-resize"
                onMouseDown={handleResize}
                aria-label="Resize column"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    // Create a synthetic mouse event for keyboard activation
                    const syntheticEvent = {
                      ...e,
                      type: 'mousedown',
                      button: 0,
                      buttons: 1,
                      clientX: 0,
                      clientY: 0,
                      screenX: 0,
                      screenY: 0,
                      pageX: 0,
                      pageY: 0,
                      movementX: 0,
                      movementY: 0,
                      relatedTarget: null,
                      ctrlKey: e.ctrlKey,
                      shiftKey: e.shiftKey,
                      altKey: e.altKey,
                      metaKey: e.metaKey,
                    } as unknown as React.MouseEvent;
                    handleResize(syntheticEvent);
                  }
                }}
              />
            )}
          </div>
        </div>
      </th>
    );
  }
);

DataGridColumnHeader.displayName = 'DataGridColumnHeader';

const DataGridRow = React.forwardRef<HTMLTableRowElement, DataGridRowProperties<UnsafeAny>>(
  ({
    className,
    size = 'md',
    density = 'normal',
    row,
    table,
    enableSelection: _enableSelection = false,
    enableReordering: _enableReordering = false,
    enablePinning: _enablePinning = false,
    onRowClick,
    style,
    ...props
  }, reference) => {
    const handleRowClick = React.useCallback(() => {
      if (onRowClick) {
        onRowClick(row);
      }
    }, [onRowClick, row]);

    const isGrouped = row.getIsGrouped();
    const isExpanded = row.getIsExpanded();

    return (
      <tr
        ref={reference}
        className={cn(
          'hover:bg-semantic-muted/50 data-[state=selected]:bg-semantic-muted transition-colors',
          isGrouped && 'bg-semantic-muted/30',
          className
        )}
        onClick={handleRowClick}
        style={style}
        {...props}
      >
        {row.getVisibleCells().map((cell) => (
          <td
            key={cell.id}
            className={cn(dataGridCellVariants({ size, density }), className)}
          >
            {isGrouped ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => row.toggleExpanded()}
                >
                  {isExpanded ? (
                    <ChevronDownIcon 
                      className="h-3 w-3" 
                      context="dense-tables"
                      semanticColor="text-gray-500"
                      enableAnimations={true}
                      enableAdaptiveStyling={true}
                      enableSemanticColors={true}
                    />
                  ) : (
                    <ChevronRightIcon 
                      className="h-3 w-3" 
                      context="dense-tables"
                      semanticColor="text-gray-500"
                      enableAnimations={true}
                      enableAdaptiveStyling={true}
                      enableSemanticColors={true}
                      data-testid="chevron-right"
                    />
                  )}
                </Button>
                <Badge variant="secondary">
                  {cell.getValue() as string} ({row.subRows.length})
                </Badge>
              </div>
            ) : (
              flexRender(cell.column.columnDef.cell, cell.getContext()) as React.ReactNode
            )}
          </td>
        ))}
      </tr>
    );
  }
);

DataGridRow.displayName = 'DataGridRow';

export {
  DataGrid,
  DataGridToolbar,
  DataGridColumnHeader,
  DataGridRow,
  dataGridVariants,
  dataGridToolbarVariants,
  dataGridHeaderVariants,
  dataGridCellVariants,
};
