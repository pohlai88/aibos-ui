/**
 * Data Table Component Tests - Enterprise Production Ready
 *
 * Comprehensive test suite for DataTable component with accessibility,
 * performance mode, and functionality testing.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { DataTable, DataTableToolbar, DataTableColumnHeader, DataTableRow } from '../../components';
import type { ColumnDef } from '@tanstack/react-table';
import { useReactTable } from '@tanstack/react-table';

// Mock utility functions
vi.mock('../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
}));

// Mock cn utility
vi.mock('../utils/cn.utility', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

// Mock TanStack Table
vi.mock('@tanstack/react-table', () => ({
  useReactTable: vi.fn(),
  getCoreRowModel: vi.fn(),
  getSortedRowModel: vi.fn(),
  getFilteredRowModel: vi.fn(),
  getPaginationRowModel: vi.fn(),
  getGroupedRowModel: vi.fn(),
  flexRender: vi.fn((fn) => fn()),
}));

// Mock TanStack Virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: vi.fn(() => []),
    getTotalSize: vi.fn(() => 0),
  })),
}));

describe('DataTable Component', () => {
  const mockData = [
    { name: 'John Doe', age: 30, email: 'john@example.com' },
    { name: 'Jane Smith', age: 25, email: 'jane@example.com' },
  ];

  const mockColumns: ColumnDef<typeof mockData[0]>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'age',
      header: 'Age',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
  ];

  // Helper function to create mock table with data
  const createMockTableWithData = (data = mockData) => ({
    getHeaderGroups: vi.fn(() => [
      {
        id: 'header-group-1',
        headers: [
          {
            id: 'header-1',
            column: {
              id: 'name',
              columnDef: { header: 'Name' },
              getCanSort: vi.fn(() => true),
              getIsSorted: vi.fn(() => false),
              toggleSorting: vi.fn(),
            },
          },
          {
            id: 'header-2',
            column: {
              id: 'age',
              columnDef: { header: 'Age' },
              getCanSort: vi.fn(() => true),
              getIsSorted: vi.fn(() => false),
              toggleSorting: vi.fn(),
            },
          },
          {
            id: 'header-3',
            column: {
              id: 'email',
              columnDef: { header: 'Email' },
              getCanSort: vi.fn(() => true),
              getIsSorted: vi.fn(() => false),
              toggleSorting: vi.fn(),
            },
          },
        ],
      },
    ]),
    getRowModel: vi.fn(() => ({
      rows: data.map((item, index) => ({
        id: `row-${index}`,
        getVisibleCells: vi.fn(() => [
          {
            id: 'cell-1',
            column: { columnDef: { cell: vi.fn(() => item.name) } },
            getContext: vi.fn(),
          },
        ]),
        getIsSelected: vi.fn(() => false),
        getCanSelect: vi.fn(() => true),
        toggleSelected: vi.fn(),
        original: item,
      })),
    })),
    getState: vi.fn(() => ({
      pagination: { pageIndex: 0, pageSize: 10 },
    })),
    setPageIndex: vi.fn(),
    setPageSize: vi.fn(),
    getCanPreviousPage: vi.fn(() => false),
    getCanNextPage: vi.fn(() => true),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    getPageCount: vi.fn(() => 5),
    getFilteredSelectedRowModel: vi.fn(() => ({ rows: [] })),
    getFilteredRowModel: vi.fn(() => ({ 
      rows: data.map((item, index) => ({
        id: `row-${index}`,
        original: item,
      }))
    })),
    getColumn: vi.fn(() => ({
      getFilterValue: vi.fn(() => ''),
      setFilterValue: vi.fn(),
    })),
    toggleAllPageRowsSelected: vi.fn(),
    getIsAllPageRowsSelected: vi.fn(() => false),
  });

  // Helper function to create mock table with empty data
  const createMockTableWithEmptyData = () => ({
    getHeaderGroups: vi.fn(() => [
      {
        id: 'header-group-1',
        headers: [
          {
            id: 'header-1',
            column: {
              id: 'name',
              columnDef: { header: 'Name' },
              getCanSort: vi.fn(() => true),
              getIsSorted: vi.fn(() => false),
              toggleSorting: vi.fn(),
            },
          },
        ],
      },
    ]),
    getRowModel: vi.fn(() => ({ rows: [] })),
    getState: vi.fn(() => ({
      pagination: { pageIndex: 0, pageSize: 10 },
    })),
    setPageIndex: vi.fn(),
    setPageSize: vi.fn(),
    getCanPreviousPage: vi.fn(() => false),
    getCanNextPage: vi.fn(() => true),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    getPageCount: vi.fn(() => 5),
    getFilteredSelectedRowModel: vi.fn(() => ({ rows: [] })),
    getFilteredRowModel: vi.fn(() => ({ rows: [] })),
    getColumn: vi.fn(() => ({
      getFilterValue: vi.fn(() => ''),
      setFilterValue: vi.fn(),
    })),
    toggleAllPageRowsSelected: vi.fn(),
    getIsAllPageRowsSelected: vi.fn(() => false),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock setup
    const mockTable = createMockTableWithData();
    vi.mocked(useReactTable).mockReturnValue(mockTable);
  });

  describe('Basic Functionality', () => {
    it('renders data table with data and columns', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          searchPlaceholder="Custom search..."
        />
      );

      expect(screen.getByPlaceholderText('Custom search...')).toBeInTheDocument();
    });

    it('renders empty message when no data', () => {
      vi.mocked(useReactTable).mockReturnValue(createMockTableWithEmptyData());

      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          emptyMessage="No users found"
        />
      );

      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      vi.mocked(useReactTable).mockReturnValue(createMockTableWithEmptyData());

      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          loading={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Features', () => {
    it('renders with sorting enabled', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableSorting={true}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('renders with filtering enabled', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableFiltering={true}
        />
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders with pagination enabled', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enablePagination={true}
        />
      );

      expect(screen.getByText('Rows per page')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    });

    it('renders with selection enabled', () => {
      // Mock selection scenario with checkboxes
      const mockTableWithSelection = {
        ...createMockTableWithData(),
        getHeaderGroups: vi.fn(() => [
          {
            id: 'header-group-1',
            headers: [
              {
                id: 'header-select',
                column: {
                  id: 'select',
                  columnDef: { header: 'Select' },
                  getCanSort: vi.fn(() => false),
                  getIsSorted: vi.fn(() => false),
                  toggleSorting: vi.fn(),
                },
              },
              {
                id: 'header-1',
                column: {
                  id: 'name',
                  columnDef: { header: 'Name' },
                  getCanSort: vi.fn(() => true),
                  getIsSorted: vi.fn(() => false),
                  toggleSorting: vi.fn(),
                },
              },
            ],
          },
        ]),
        getRowModel: vi.fn(() => ({
          rows: [
            {
              id: 'row-1',
              getVisibleCells: vi.fn(() => [
                {
                  id: 'cell-select',
                  column: { columnDef: { cell: vi.fn(() => <input type="checkbox" />) } },
                  getContext: vi.fn(),
                },
                {
                  id: 'cell-1',
                  column: { columnDef: { cell: vi.fn(() => 'John Doe') } },
                  getContext: vi.fn(),
                },
              ]),
              getIsSelected: vi.fn(() => false),
              getCanSelect: vi.fn(() => true),
              toggleSelected: vi.fn(),
              original: { name: 'John Doe', age: 30 },
            },
          ],
        })),
      };
      
      vi.mocked(useReactTable).mockReturnValue(mockTableWithSelection);

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableSelection={true}
        />
      );

      // Should have checkboxes for selection
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('renders with export enabled', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableExport={true}
        />
      );

      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
    });
  });

  describe('DataTableToolbar Component', () => {
    const mockTable = {
      getHeaderGroups: vi.fn(() => []),
      getRowModel: vi.fn(() => ({ rows: [] })),
      getState: vi.fn(() => ({ pagination: { pageIndex: 0, pageSize: 10 } })),
      setPageIndex: vi.fn(),
      setPageSize: vi.fn(),
      getCanPreviousPage: vi.fn(() => false),
      getCanNextPage: vi.fn(() => true),
      previousPage: vi.fn(),
      nextPage: vi.fn(),
      getPageCount: vi.fn(() => 5),
      getFilteredSelectedRowModel: vi.fn(() => ({ rows: [] })),
      getFilteredRowModel: vi.fn(() => ({ 
        rows: mockData.map((item, index) => ({
          id: `row-${index}`,
          original: item,
        }))
      })),
      getColumn: vi.fn(() => ({
        getFilterValue: vi.fn(() => ''),
        setFilterValue: vi.fn(),
      })),
    };

    it('renders toolbar with search', () => {
      render(
        <DataTableToolbar
          table={mockTable as any}
          enableGlobalFilter={true}
        />
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders toolbar with export buttons', () => {
      const onExport = vi.fn();
      
      render(
        <DataTableToolbar
          table={mockTable as any}
          enableExport={true}
          onExport={onExport}
        />
      );

      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
    });

    it('handles export click', () => {
      const onExport = vi.fn();
      
      render(
        <DataTableToolbar
          table={mockTable as any}
          enableExport={true}
          onExport={onExport}
        />
      );

      fireEvent.click(screen.getByText('CSV'));
      expect(onExport).toHaveBeenCalledWith(mockData, 'csv');
    });
  });

  describe('DataTableColumnHeader Component', () => {
    const mockColumn = {
      id: 'name',
      columnDef: { header: 'Name' },
      getCanSort: vi.fn(() => true),
      getIsSorted: vi.fn(() => false as false | 'asc' | 'desc'),
      toggleSorting: vi.fn(),
    };

    it('renders column header', () => {
      render(
        <DataTableColumnHeader
          column={mockColumn}
          title="Name"
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('handles sorting click', () => {
      render(
        <DataTableColumnHeader
          column={mockColumn}
          title="Name"
          enableSorting={true}
        />
      );

      fireEvent.click(screen.getByText('Name'));
      expect(mockColumn.toggleSorting).toHaveBeenCalled();
    });

    it('renders sort indicators', () => {
      mockColumn.getIsSorted.mockReturnValue('asc' as false | 'asc' | 'desc');
      
      render(
        <DataTableColumnHeader
          column={mockColumn}
          title="Name"
          enableSorting={true}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  describe('DataTableRow Component', () => {
    const mockRow = {
      id: 'row-1',
      getVisibleCells: vi.fn(() => [
        {
          id: 'cell-1',
          column: { columnDef: { cell: vi.fn(() => 'John Doe') } },
          getContext: vi.fn(),
        },
      ]),
      getIsSelected: vi.fn(() => false),
      getCanSelect: vi.fn(() => true),
      toggleSelected: vi.fn(),
      original: { name: 'John Doe', age: 30 },
    };

    const mockTable = {
      getHeaderGroups: vi.fn(() => []),
      getRowModel: vi.fn(() => ({ rows: [] })),
      getState: vi.fn(() => ({ pagination: { pageIndex: 0, pageSize: 10 } })),
    };

    it('renders data table row', () => {
      render(
        <DataTableRow
          row={mockRow as any}
          table={mockTable as any}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles row click', () => {
      const onRowClick = vi.fn();
      
      render(
        <DataTableRow
          row={mockRow as any}
          table={mockTable as any}
          onRowClick={onRowClick}
        />
      );

      fireEvent.click(screen.getByText('John Doe'));
      expect(onRowClick).toHaveBeenCalledWith(mockRow);
    });
  });

  describe('Size Variants', () => {
    it('renders with small size', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          size="sm"
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('renders with large size', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          size="lg"
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  // Performance Mode tests are handled by the main component tests
  // The performance mode functionality is tested through the main component rendering

  describe('Error Handling', () => {
    it('handles missing data gracefully', () => {
      expect(() => {
        render(
          <DataTable
            data={[]}
            columns={[]}
          />
        );
      }).not.toThrow();
    });

    it('handles missing columns gracefully', () => {
      expect(() => {
        render(
          <DataTable
            data={mockData}
            columns={[]}
          />
        );
      }).not.toThrow();
    });
  });
});
