/**
 * Breadcrumb Component - Enterprise Production Ready
 *
 * Breadcrumb component with semantic tokens and comprehensive
 * accessibility features.
 */

import { ChevronRightIcon } from '../icons';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

export interface BreadcrumbProperties extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export interface BreadcrumbItemProperties extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
}

export interface BreadcrumbLinkProperties extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

export interface BreadcrumbPageProperties extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export interface BreadcrumbSeparatorProperties extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
}

export interface BreadcrumbEllipsisProperties extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProperties>(
  ({ ...props }, reference) => <nav ref={reference} aria-label="breadcrumb" {...props} />,
);
Breadcrumb.displayName = 'Breadcrumb';

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.HTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, reference) => (
    <ol
      ref={reference}
      className={cn(
        'text-semantic-muted-foreground flex flex-wrap items-center break-words text-sm sm:text-base',
        className,
      )}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = 'BreadcrumbList';

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProperties>(
  ({ className, ...props }, reference) => (
    <li ref={reference} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
  ),
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProperties>(
  ({ className, children, ...props }, reference) => (
    <a
      ref={reference}
      className={cn('hover:text-semantic-foreground transition-colors', className)}
      {...props}
    >
      {children}
    </a>
  ),
);
BreadcrumbLink.displayName = 'BreadcrumbLink';

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, BreadcrumbPageProperties>(
  ({ className, ...props }, reference) => (
    <span
      ref={reference}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('text-semantic-foreground font-normal', className)}
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

const BreadcrumbSeparator = React.forwardRef<HTMLSpanElement, BreadcrumbSeparatorProperties>(
  ({ children, className, ...props }, reference) => (
    <span
      ref={reference}
      role="presentation"
      aria-hidden="true"
      className={cn('icon-sm', className)}
      {...props}
    >
      {children ?? (
        <ChevronRightIcon 
          context="dashboards"
          semanticColor="text-gray-500"
          enableAnimations={true}
          enableAdaptiveStyling={true}
          enableSemanticColors={true}
        />
      )}
    </span>
  ),
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

const BreadcrumbEllipsis = React.forwardRef<HTMLSpanElement, BreadcrumbEllipsisProperties>(
  ({ className, ...props }, reference) => (
    <span
      ref={reference}
      role="presentation"
      aria-hidden="true"
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <span className="sr-only">More</span>
      <span>⋯</span>
    </span>
  ),
);
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
