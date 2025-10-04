/**
 * Data Table Component Tests - Simplified Version
 *
 * Basic test suite for DataTable component focusing on core functionality.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataTable } from '../../components';
import type { ColumnDef } from '@tanstack/react-table';

// Mock utility functions
vi.mock('../../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
}));

// Mock cn utility
vi.mock('../../utils/cn.utility', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

// Mock TanStack Table with a simple implementation
vi.mock('@tanstack/react-table', () => ({
  useReactTable: vi.fn(() => ({
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
    getRowModel: vi.fn(() => ({
      rows: [
        {
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
        },
      ],
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
      rows: [
        {
          id: 'row-1',
          original: { name: 'John Doe', age: 30 },
        },
      ]
    })),
    getColumn: vi.fn(() => ({
      getFilterValue: vi.fn(() => ''),
      setFilterValue: vi.fn(),
    })),
    toggleAllPageRowsSelected: vi.fn(),
    getIsAllPageRowsSelected: vi.fn(() => false),
  })),
  getCoreRowModel: vi.fn(),
  getSortedRowModel: vi.fn(),
  getFilteredRowModel: vi.fn(),
  getPaginationRowModel: vi.fn(),
  getGroupedRowModel: vi.fn(),
  flexRender: vi.fn((fn) => fn()),
}));

describe('DataTable Component - Simplified', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
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

    it('renders with pagination enabled', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enablePagination={true}
        />
      );

      expect(screen.getByText('Rows per page')).toBeInTheDocument();
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
