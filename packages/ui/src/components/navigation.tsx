/**
 * Navigation Component - Enterprise Production Ready
 *
 * Navigation component with responsive design, semantic tokens,
 * and comprehensive accessibility features.
 */

import { Button } from '../primitives/button';
import { polymorphic, type PolymorphicProperties } from '../utils/polymorphic.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const navigationVariants = cva(
  'border-semantic-border bg-semantic-background flex items-center justify-between border-b px-4 py-3',
  {
    variants: {
      variant: {
        default: '',
        elevated: 'shadow-elev-1',
        transparent: 'border-transparent bg-transparent',
        card: 'bg-semantic-card shadow-elev-1 rounded-lg border',
      },
      size: {
        sm: 'px-3 py-2',
        md: 'px-4 py-3',
        lg: 'px-6 py-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const navItemVariants = cva(
  'hover:bg-semantic-accent hover:text-semantic-accent-foreground focus:ring-semantic-ring flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      active: {
        true: 'bg-semantic-accent text-semantic-accent-foreground',
        false: 'text-semantic-foreground',
      },
      variant: {
        default: '',
        ghost: 'hover:bg-semantic-muted/50',
        outline: 'border-semantic-border hover:bg-semantic-accent border',
      },
    },
    defaultVariants: {
      active: false,
      variant: 'default',
    },
  },
);

export type NavigationProperties = VariantProps<typeof navigationVariants>;

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
  onClick?: () => void;
}

interface NavigationBaseProperties extends NavigationProperties {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Mobile Menu Button Component
const MobileMenuButton = ({
  mobileBreakpoint,
  onToggle,
}: {
  mobileBreakpoint: string;
  onToggle: () => void;
}) => (
  <Button variant="ghost" size="sm" className={`${mobileBreakpoint}:hidden`} onClick={onToggle}>
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  </Button>
);

// Mobile Menu Component
const MobileMenu = ({
  isOpen,
  mobileBreakpoint,
  logo,
  items,
  activeItem,
  onItemClick,
  onClose,
}: {
  isOpen: boolean;
  mobileBreakpoint: string;
  logo: React.ReactNode;
  items: NavigationItem[];
  activeItem?: string;
  onItemClick: (item: NavigationItem) => void;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`${mobileBreakpoint}:hidden bg-semantic-background/95 fixed inset-0 z-50 backdrop-blur-sm`}
    >
      <div className="flex h-full flex-col">
        <div className="border-semantic-border flex items-center justify-between border-b px-4 py-3">
          {logo}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
        <div className="flex-1 space-y-1 p-4">
          {items.map((item) => (
            <button
              key={item.id}
              className={navItemVariants({ active: activeItem === item.id, variant: 'default' })}
              onClick={() => onItemClick(item)}
            >
              {item.icon && <span className="h-4 w-4">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Navigation Item Component
const NavItem = ({
  item,
  activeItem,
  onItemClick,
}: {
  item: NavigationItem;
  activeItem?: string;
  onItemClick: (item: NavigationItem) => void;
}) => (
  <button
    className={navItemVariants({ active: activeItem === item.id, variant: 'default' })}
    onClick={() => onItemClick(item)}
  >
    {item.icon && <span className="h-4 w-4">{item.icon}</span>}
    <span>{item.label}</span>
  </button>
);

const NavigationImpl = React.forwardRef<
  HTMLElement,
  PolymorphicProperties<'nav', NavigationBaseProperties>
>(
  (
    {
      className,
      variant,
      size,
      items,
      activeItem,
      onItemClick,
      logo,
      actions,
      mobileBreakpoint = 'md',
      ...props
    },
    reference,
  ) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const handleItemClick = (item: NavigationItem) => {
      onItemClick?.(item);
      setIsMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
      <nav className={navigationVariants({ variant, size, className })} ref={reference} {...props}>
        <div className="flex items-center">{logo}</div>

        <div className={`hidden ${mobileBreakpoint}:flex items-center space-x-1`}>
          {items.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              activeItem={activeItem}
              onItemClick={handleItemClick}
            />
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {actions}
          <MobileMenuButton mobileBreakpoint={mobileBreakpoint} onToggle={toggleMobileMenu} />
        </div>

        <MobileMenu
          isOpen={isMobileMenuOpen}
          mobileBreakpoint={mobileBreakpoint}
          logo={logo}
          items={items}
          activeItem={activeItem}
          onItemClick={handleItemClick}
          onClose={closeMobileMenu}
        />
      </nav>
    );
  },
);
NavigationImpl.displayName = 'Navigation';

export const Navigation = polymorphic('nav', NavigationImpl, {
  displayName: 'Navigation',
  slot: true,
});

export type NavigationReference = React.ElementRef<typeof Navigation>;
export type NavigationElement = React.ElementType;
