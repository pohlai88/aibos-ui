/**
 * Pagination Component - Enterprise Production Ready
 *
 * Pagination component with semantic tokens and comprehensive
 * accessibility features.
 */

import { ChevronLeftIcon, ChevronRightIcon } from '../icons/internal';
import { Button } from '../primitives/button';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

export interface PaginationProperties extends React.HTMLAttributes<HTMLElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

export interface PaginationItemProperties extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  page: number;
  isActive?: boolean;
  isDisabled?: boolean;
}

// Helper function to calculate visible pages
const getVisiblePages = (
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number,
): number[] => {
  const pages: number[] = [];
  const halfVisible = Math.floor(maxVisiblePages / 2);

  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  for (let index = start; index <= end; index++) {
    pages.push(index);
  }

  return pages;
};

// First/Last Page Button Component
const FirstLastButton = ({
  showFirstLast,
  currentPage,
  totalPages,
  onPageChange,
  isFirst = true,
}: {
  showFirstLast: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isFirst?: boolean;
}) => {
  if (!showFirstLast) return null;

  const page = isFirst ? 1 : totalPages;
  const isDisabled = isFirst ? currentPage === 1 : currentPage === totalPages;
  const label = isFirst ? 'Go to first page' : 'Go to last page';
  const text = isFirst ? 'First' : 'Last';

  return (
    <PaginationItem
      page={page}
      isDisabled={isDisabled}
      onClick={() => onPageChange(page)}
      aria-label={label}
    >
      {text}
    </PaginationItem>
  );
};

// Previous/Next Button Component
const PreviousNextButton = ({
  showPreviousNext,
  currentPage,
  totalPages,
  onPageChange,
  isPrevious = true,
}: {
  showPreviousNext: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isPrevious?: boolean;
}) => {
  if (!showPreviousNext) return null;

  const page = isPrevious ? currentPage - 1 : currentPage + 1;
  const isDisabled = isPrevious ? currentPage === 1 : currentPage === totalPages;
  const label = isPrevious ? 'Go to previous page' : 'Go to next page';
  const text = isPrevious ? 'Previous' : 'Next';
  const Icon = isPrevious ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <PaginationItem
      page={page}
      isDisabled={isDisabled}
      onClick={() => onPageChange(page)}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{text}</span>
    </PaginationItem>
  );
};

const Pagination = React.forwardRef<HTMLElement, PaginationProperties>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      showFirstLast = true,
      showPrevNext: showPreviousNext = true,
      maxVisiblePages = 5,
      className,
      ...props
    },
    reference,
  ) => {
    const visiblePages = getVisiblePages(currentPage, totalPages, maxVisiblePages);

    return (
      <nav
        ref={reference}
        aria-label="Pagination Navigation"
        className={cn('flex items-center justify-center space-x-1', className)}
        {...props}
      >
        <FirstLastButton
          showFirstLast={showFirstLast}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isFirst={true}
        />

        <PreviousNextButton
          showPreviousNext={showPreviousNext}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isPrevious={true}
        />

        {visiblePages.map((page) => (
          <PaginationItem
            key={page}
            page={page}
            isActive={page === currentPage}
            onClick={() => onPageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </PaginationItem>
        ))}

        <PreviousNextButton
          showPreviousNext={showPreviousNext}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isPrevious={false}
        />

        <FirstLastButton
          showFirstLast={showFirstLast}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isFirst={false}
        />
      </nav>
    );
  },
);
Pagination.displayName = 'Pagination';

const PaginationItem = React.forwardRef<HTMLButtonElement, PaginationItemProperties>(
  ({ page, isActive = false, isDisabled = false, className, children, ...props }, reference) => {
    return (
      <Button
        ref={reference}
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        disabled={isDisabled}
        className={cn(
          'h-8 w-8 p-0',
          isActive && 'bg-semantic-primary text-semantic-primary-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    );
  },
);
PaginationItem.displayName = 'PaginationItem';

export { Pagination, PaginationItem };
export type PaginationReference = React.ElementRef<typeof Pagination>;
export type PaginationItemReference = React.ElementRef<typeof PaginationItem>;
