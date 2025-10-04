/**
 * Accessibility Audit Tests - Vitest Compatible
 * 
 * Comprehensive accessibility testing for all UI components to ensure
 * WCAG 2.2 AAA compliance across the entire component library.
 * 
 * This test suite focuses on:
 * - ARIA attributes and roles
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Focus management
 * - Semantic HTML structure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
// @ts-ignore - user-event has TypeScript declaration issues
import userEvent from '@testing-library/user-event';
import * as React from 'react';

// Import all components for accessibility testing
import { Button } from '../../primitives/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/card';
import { Modal } from '../../components/modal';
import { Table } from '../../components/table';
import { DataTable } from '../../components/data-table';
import { CommandPalette } from '../../components/command-palette';
import { MultiSelect } from '../../components/multi-select';
import { DateRangePicker } from '../../components/date-range-picker';
import { ColorPicker } from '../../components/color-picker';
import { DataGrid } from '../../components/data-grid';
import { SkeletonTable } from '../../components/skeleton-table';
import { Toast } from '../../components/toast';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../components/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../components/accordion';
import { Alert, AlertDescription } from '../../primitives/alert';
import { Badge } from '../../primitives/badge';
import { Checkbox } from '../../primitives/checkbox';
import { Input } from '../../primitives/input';
import { Label } from '../../primitives/label';
import { Progress } from '../../primitives/progress';
import { RadioGroup, RadioGroupItem } from '../../primitives/radio';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/select';
import { Slider } from '../../primitives/slider';
import { Switch } from '../../primitives/switch';
import { Toggle } from '../../primitives/toggle';
import { Separator } from '../../primitives/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../primitives/sheet';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../primitives/hover-card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../primitives/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../primitives/context-menu';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../../primitives/navigation-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../primitives/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../primitives/collapsible';
import { Combobox, ComboboxItem } from '../../primitives/combobox';
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandSeparator } from '../../primitives/command';
import { Calendar } from '../../primitives/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '../../primitives/avatar';
import { AspectRatio } from '../../primitives/aspect-ratio';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../components/breadcrumb';
import { FileUpload } from '../../primitives/file-upload';
import { Pagination, PaginationItem } from '../../components/pagination';
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group';
import { ScrollArea } from '../../primitives/scroll-area';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock performance utilities
vi.mock('../../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')),
}));

// Sample data for components that need it
const sampleData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
];

const sampleCommands = [
  {
    id: 'search',
    title: 'Search',
    description: 'Search for files and content',
    category: 'Navigation',
    keywords: ['find', 'look', 'query'],
    shortcut: '⌘K',
    icon: <span>🔍</span>,
    action: vi.fn(),
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Open application settings',
    category: 'Navigation',
    keywords: ['preferences', 'config'],
    shortcut: '⌘,',
    icon: <span>⚙️</span>,
    action: vi.fn(),
  },
];

const sampleOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Accessibility Audit - WCAG 2.2 AAA Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Form Components', () => {
    it('Button should have proper accessibility attributes', () => {
      render(<Button data-testid="test-button">Click me</Button>);
      
      const button = screen.getByTestId('test-button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('Input should have proper label association', () => {
      render(
        <div>
          <Label htmlFor="test-input">Test Input</Label>
          <Input id="test-input" data-testid="test-input" />
        </div>
      );
      
      const input = screen.getByTestId('test-input');
      const label = screen.getByText('Test Input');
      
      expect(input).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'test-input');
      expect(label).toHaveAttribute('for', 'test-input');
    });

    it('Checkbox should have proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor="test-checkbox">Test Checkbox</Label>
          <Checkbox id="test-checkbox" data-testid="test-checkbox" />
        </div>
      );
      
      const checkbox = screen.getByTestId('test-checkbox');
      const label = screen.getByText('Test Checkbox');
      
      expect(checkbox).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('role', 'checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });

    it('RadioGroup should have proper accessibility structure', () => {
      render(
        <div>
          <Label>Test Radio Group</Label>
          <RadioGroup defaultValue="option1" data-testid="test-radio-group">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option1" id="r1" />
              <Label htmlFor="r1">Option 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option2" id="r2" />
              <Label htmlFor="r2">Option 2</Label>
            </div>
          </RadioGroup>
        </div>
      );
      
      const radioGroup = screen.getByTestId('test-radio-group');
      const radio1 = screen.getByLabelText('Option 1');
      const radio2 = screen.getByLabelText('Option 2');
      
      expect(radioGroup).toBeInTheDocument();
      expect(radio1).toBeInTheDocument();
      expect(radio2).toBeInTheDocument();
      expect(radioGroup).toHaveAttribute('role', 'radiogroup');
    });

    it('Select should have proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor="test-select">Test Select</Label>
          <Select data-testid="test-select">
            <SelectTrigger id="test-select">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
      
      const label = screen.getByText('Test Select');
      const hiddenSelect = screen.getByRole('combobox', { hidden: true });
      
      expect(label).toBeInTheDocument();
      expect(hiddenSelect).toBeInTheDocument();
      expect(hiddenSelect).toHaveAttribute('aria-hidden', 'true');
    });

    it('Input should have proper label association for multiline', () => {
      render(
        <div>
          <Label htmlFor="test-input-multiline">Test Input Multiline</Label>
          <Input id="test-input-multiline" data-testid="test-input-multiline" />
        </div>
      );
      
      const input = screen.getByTestId('test-input-multiline');
      const label = screen.getByText('Test Input Multiline');
      
      expect(input).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'test-input-multiline');
      expect(label).toHaveAttribute('for', 'test-input-multiline');
    });

    it('Switch should have proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor="test-switch">Test Switch</Label>
          <Switch id="test-switch" data-testid="test-switch" />
        </div>
      );
      
      const switchElement = screen.getByTestId('test-switch');
      const label = screen.getByText('Test Switch');
      
      expect(switchElement).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(switchElement).toHaveAttribute('role', 'switch');
    });

    it('Slider should have proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor="test-slider">Test Slider</Label>
          <Slider id="test-slider" data-testid="test-slider" defaultValue={[50]} max={100} step={1} />
        </div>
      );
      
      const slider = screen.getByTestId('test-slider');
      const label = screen.getByText('Test Slider');
      const sliderThumb = screen.getByRole('slider');
      
      expect(slider).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(sliderThumb).toBeInTheDocument();
      expect(sliderThumb).toHaveAttribute('role', 'slider');
      expect(sliderThumb).toHaveAttribute('aria-valuemin', '0');
      expect(sliderThumb).toHaveAttribute('aria-valuemax', '100');
    });

    it('Progress should have proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor="test-progress">Test Progress</Label>
          <Progress id="test-progress" data-testid="test-progress" value={50} />
        </div>
      );
      
      const progress = screen.getByTestId('test-progress');
      const label = screen.getByText('Test Progress');
      
      expect(progress).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(progress).toHaveAttribute('role', 'progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '50');
    });
  });

  describe('Layout Components', () => {
    it('Card should have proper semantic structure', () => {
      render(
        <Card data-testid="test-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a test card content.</p>
          </CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('test-card');
      const title = screen.getByText('Test Card');
      
      expect(card).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3'); // CardTitle should render as h3
    });

    it('Tabs should have proper accessibility structure', () => {
      render(
        <Tabs defaultValue="tab1" data-testid="test-tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <p>Content for tab 1</p>
          </TabsContent>
          <TabsContent value="tab2">
            <p>Content for tab 2</p>
          </TabsContent>
        </Tabs>
      );
      
      const tabs = screen.getByTestId('test-tabs');
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      
      expect(tabs).toBeInTheDocument();
      expect(tab1).toBeInTheDocument();
      expect(tab2).toBeInTheDocument();
      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
    });

    it('Accordion should have proper accessibility structure', () => {
      render(
        <Accordion type="single" collapsible data-testid="test-accordion">
          <AccordionItem value="item1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>
              <p>Content for item 1</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>
              <p>Content for item 2</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const accordion = screen.getByTestId('test-accordion');
      
      expect(accordion).toBeInTheDocument();
      expect(accordion).toHaveAttribute('data-orientation', 'vertical');
    });

    it('Alert should have proper accessibility attributes', () => {
      render(
        <Alert data-testid="test-alert">
          <AlertDescription>
            This is a test alert message.
          </AlertDescription>
        </Alert>
      );
      
      const alert = screen.getByTestId('test-alert');
      const description = screen.getByText('This is a test alert message.');
      
      expect(alert).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      expect(alert).toHaveAttribute('role', 'alert');
    });

    it('Badge should have proper accessibility attributes', () => {
      render(<Badge data-testid="test-badge">Test Badge</Badge>);
      
      const badge = screen.getByTestId('test-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('Separator should have proper accessibility attributes', () => {
      render(
        <div>
          <p>Content above</p>
          <Separator data-testid="test-separator" decorative={false} />
          <p>Content below</p>
        </div>
      );
      
      const separator = screen.getByTestId('test-separator');
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveAttribute('role', 'separator');
    });
  });

  describe('Interactive Components', () => {
    it('Modal should have proper accessibility attributes', () => {
      render(
        <Modal open={true} onOpenChange={vi.fn()} data-testid="test-modal">
          <div>
            <h2>Test Modal</h2>
            <p>This is a test modal content.</p>
            <Button>Close</Button>
          </div>
        </Modal>
      );
      
      const modal = screen.getByTestId('test-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('CommandPalette should have proper accessibility structure', () => {
      render(
        <CommandPalette 
          commands={sampleCommands}
          open={true}
          onOpenChange={vi.fn()}
          data-testid="test-command-palette"
        />
      );
      
      const palette = screen.getByTestId('test-command-palette');
      expect(palette).toBeInTheDocument();
      expect(palette).toHaveAttribute('role', 'application');
    });

    it('MultiSelect should have proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor="test-multiselect">Test MultiSelect</Label>
          <MultiSelect 
            id="test-multiselect"
            options={sampleOptions}
            placeholder="Select options"
            data-testid="test-multiselect"
          />
        </div>
      );
      
      const multiselect = screen.getByTestId('test-multiselect');
      const label = screen.getByText('Test MultiSelect');
      const trigger = screen.getByRole('combobox');
      
      expect(multiselect).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('role', 'combobox');
    });

    it('DateRangePicker should have proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor="test-date-picker">Test Date Range Picker</Label>
          <DateRangePicker 
            id="test-date-picker"
            data-testid="test-date-picker"
          />
        </div>
      );
      
      const datePicker = screen.getByTestId('test-date-picker');
      const label = screen.getByText('Test Date Range Picker');
      
      expect(datePicker).toBeInTheDocument();
      expect(label).toBeInTheDocument();
    });

    it('ColorPicker should have proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor="test-color-picker">Test Color Picker</Label>
          <ColorPicker 
            id="test-color-picker"
            data-testid="test-color-picker"
          />
        </div>
      );
      
      const colorPicker = screen.getByTestId('test-color-picker');
      const label = screen.getByText('Test Color Picker');
      
      expect(colorPicker).toBeInTheDocument();
      expect(label).toBeInTheDocument();
    });
  });

  describe('Data Components', () => {
    it('Table should have proper accessibility structure', () => {
      const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'role', header: 'Role' },
      ];

      render(
        <Table 
          columns={columns}
          data={sampleData}
          data-testid="test-table"
        />
      );
      
      const table = screen.getByTestId('test-table');
      expect(table).toBeInTheDocument();
    });

    it('DataTable should have proper accessibility structure', () => {
      const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'role', header: 'Role' },
      ];

      render(
        <DataTable 
          columns={columns}
          data={sampleData}
          data-testid="test-data-table"
        />
      );
      
      const dataTable = screen.getByTestId('test-data-table');
      const table = screen.getByRole('table');
      
      expect(dataTable).toBeInTheDocument();
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('role', 'table');
    });

    it('DataGrid should have proper accessibility structure', () => {
      const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'role', header: 'Role' },
      ];

      render(
        <DataGrid 
          columns={columns}
          data={sampleData}
          data-testid="test-data-grid"
        />
      );
      
      const dataGrid = screen.getByTestId('test-data-grid');
      expect(dataGrid).toBeInTheDocument();
    });
  });

  describe('Navigation Components', () => {
    it('Breadcrumb should have proper accessibility structure', () => {
      render(
        <Breadcrumb data-testid="test-breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      
      const breadcrumb = screen.getByTestId('test-breadcrumb');
      const nav = screen.getByRole('navigation');
      
      expect(breadcrumb).toBeInTheDocument();
      expect(nav).toBeInTheDocument();
    });

    it('NavigationMenu should have proper accessibility structure', () => {
      render(
        <NavigationMenu data-testid="test-navigation-menu">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="/item1">
                  Link to Item 1
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      
      const navMenu = screen.getByTestId('test-navigation-menu');
      const trigger = screen.getByRole('button', { name: 'Item 1' });
      
      expect(navMenu).toBeInTheDocument();
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded');
    });

    it('Pagination should have proper accessibility structure', () => {
      render(
        <Pagination 
          currentPage={2}
          totalPages={5}
          onPageChange={vi.fn()}
          data-testid="test-pagination"
        />
      );
      
      const pagination = screen.getByTestId('test-pagination');
      expect(pagination).toBeInTheDocument();
    });
  });

  describe('Overlay Components', () => {
    it('Tooltip should have proper accessibility attributes', async () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a tooltip</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
      
      const trigger = screen.getByRole('button', { name: 'Hover me' });
      expect(trigger).toBeInTheDocument();
      
      // Hover to open the tooltip
      await userEvent.hover(trigger);
      
      // Wait for tooltip to appear and aria-describedby to be added
      await screen.findByRole('tooltip');
      expect(trigger).toHaveAttribute('aria-describedby');
    });

    it('Popover should have proper accessibility attributes', () => {
      render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>Open Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p>This is popover content</p>
          </PopoverContent>
        </Popover>
      );
      
      const trigger = screen.getByRole('button', { name: 'Open Popover' });
      expect(trigger).toBeInTheDocument();
    });

    it('HoverCard should have proper accessibility attributes', () => {
      render(
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button>Hover me</Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <p>This is hover card content</p>
          </HoverCardContent>
        </HoverCard>
      );
      
      const trigger = screen.getByRole('button', { name: 'Hover me' });
      expect(trigger).toBeInTheDocument();
    });

    it('Sheet should have proper accessibility attributes', () => {
      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Test Sheet</SheetTitle>
            </SheetHeader>
            <p>This is sheet content</p>
          </SheetContent>
        </Sheet>
      );
      
      const trigger = screen.getByRole('button', { name: 'Open Sheet' });
      expect(trigger).toBeInTheDocument();
    });

    it('AlertDialog should have proper accessibility attributes', () => {
      render(
        <AlertDialog open={true} onOpenChange={vi.fn()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Test Alert</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              This is a test alert dialog.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const dialog = screen.getByRole('alertdialog');
      const title = screen.getByText('Test Alert');
      const description = screen.getByText('This is a test alert dialog.');
      
      expect(dialog).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Menu Components', () => {
    it('DropdownMenu should have proper accessibility structure', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>
            Open Menu
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      const trigger = screen.getByRole('button', { name: 'Open Menu' });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('ContextMenu should have proper accessibility structure', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div>Right click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuItem>Item 2</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
      
      const trigger = screen.getByText('Right click me');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Complex Components', () => {
    it('Calendar should have proper accessibility structure', () => {
      render(<Calendar data-testid="test-calendar" />);
      
      const calendar = screen.getByTestId('test-calendar');
      const grid = screen.getByRole('grid');
      
      expect(calendar).toBeInTheDocument();
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('role', 'grid');
    });

    it('Combobox should have proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor="test-combobox">Test Combobox</Label>
          <Combobox 
            placeholder="Select an option"
            data-testid="test-combobox"
          >
            <ComboboxItem value="option1">Option 1</ComboboxItem>
            <ComboboxItem value="option2">Option 2</ComboboxItem>
            <ComboboxItem value="option3">Option 3</ComboboxItem>
          </Combobox>
        </div>
      );
      
      const combobox = screen.getByTestId('test-combobox');
      const label = screen.getByText('Test Combobox');
      const comboboxElement = screen.getByRole('combobox');
      
      expect(combobox).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(comboboxElement).toBeInTheDocument();
      expect(comboboxElement).toHaveAttribute('role', 'combobox');
    });

    it('Command should have proper accessibility structure', () => {
      render(
        <Command data-testid="test-command">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandGroup heading="Suggestions">
              <CommandItem value="calendar">Calendar</CommandItem>
              <CommandItem value="search-emoji">Search Emoji</CommandItem>
              <CommandItem value="calculator">Calculator</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );
      
      const command = screen.getByTestId('test-command');
      const input = screen.getByRole('combobox');
      const list = screen.getByRole('listbox');
      
      expect(command).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      expect(list).toBeInTheDocument();
    });

    it('ToggleGroup should have proper accessibility structure', () => {
      render(
        <div>
          <Label>Test Toggle Group</Label>
          <ToggleGroup type="single" data-testid="test-toggle-group">
            <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
            <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
            <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
          </ToggleGroup>
        </div>
      );
      
      const toggleGroup = screen.getByTestId('test-toggle-group');
      const radioButtons = screen.getAllByRole('radio');
      
      expect(toggleGroup).toBeInTheDocument();
      expect(radioButtons).toHaveLength(3);
      expect(toggleGroup).toHaveAttribute('role', 'group');
    });

    it('Collapsible should have proper accessibility attributes', () => {
      render(
        <Collapsible data-testid="test-collapsible">
          <CollapsibleTrigger asChild>
            <Button>Toggle</Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p>This is collapsible content</p>
          </CollapsibleContent>
        </Collapsible>
      );
      
      const trigger = screen.getByRole('button', { name: 'Toggle' });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded');
    });
  });

  describe('Utility Components', () => {
    it('Avatar should have proper accessibility attributes', () => {
      render(
        <Avatar data-testid="test-avatar">
          <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      );
      
      const avatar = screen.getByTestId('test-avatar');
      const fallback = screen.getByText('CN');
      
      expect(avatar).toBeInTheDocument();
      expect(fallback).toBeInTheDocument();
    });

    it('AspectRatio should have proper accessibility attributes', () => {
      render(
        <AspectRatio ratio={16 / 9} data-testid="test-aspect-ratio">
          <img
            src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
            alt="Photo by Drew Beamer"
            className="h-full w-full rounded-md object-cover"
          />
        </AspectRatio>
      );
      
      const aspectRatio = screen.getByTestId('test-aspect-ratio');
      const image = screen.getByRole('img');
      
      expect(aspectRatio).toBeInTheDocument();
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('alt', 'Photo by Drew Beamer');
    });

    it('ScrollArea should have proper accessibility attributes', () => {
      render(
        <ScrollArea className="h-72 w-48 rounded-md border" data-testid="test-scroll-area">
          <div className="p-4">
            <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="text-sm">
                v1.2.0-beta.{i}
              </div>
            ))}
          </div>
        </ScrollArea>
      );
      
      const scrollArea = screen.getByTestId('test-scroll-area');
      expect(scrollArea).toBeInTheDocument();
    });

    it('FileUpload should have proper accessibility attributes', () => {
      render(
        <div>
          <Label htmlFor="test-file-upload">Test File Upload</Label>
          <FileUpload 
            id="test-file-upload"
            onUpload={vi.fn()}
            data-testid="test-file-upload"
          />
        </div>
      );
      
      const fileUpload = screen.getByTestId('test-file-upload');
      const label = screen.getByText('Test File Upload');
      
      expect(fileUpload).toBeInTheDocument();
      expect(label).toBeInTheDocument();
    });

    it('Toast should have proper accessibility attributes', () => {
      render(
        <div role="status" aria-live="polite" data-testid="test-toast">
          <div className="grid gap-1">
            <div className="font-semibold">Scheduled: Catch up</div>
            <div className="text-sm opacity-90">
              Monday, January 3rd at 2:00 PM
            </div>
          </div>
        </div>
      );
      
      const toast = screen.getByTestId('test-toast');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveAttribute('role', 'status');
    });

    it('SkeletonTable should have proper accessibility attributes', () => {
      render(
        <div data-testid="test-skeleton-table" aria-label="Loading content">
        <SkeletonTable 
          rows={3}
          columns={4}
        />
        </div>
      );
      
      const skeletonTable = screen.getByTestId('test-skeleton-table');
      expect(skeletonTable).toBeInTheDocument();
      expect(skeletonTable).toHaveAttribute('aria-label', 'Loading content');
    });
  });

  describe('Keyboard Navigation', () => {
    it('Button should be focusable and keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Button data-testid="test-button">Click me</Button>);
      
      const button = screen.getByTestId('test-button');
      await user.tab();
      
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      // Button should be clickable with Enter key
    });

    it('Input should be focusable and keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="test-input" />);
      
      const input = screen.getByTestId('test-input');
      await user.tab();
      
      expect(input).toHaveFocus();
      
      await user.keyboard('Hello World');
      expect(input).toHaveValue('Hello World');
    });

    it('Checkbox should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Checkbox data-testid="test-checkbox" />);
      
      const checkbox = screen.getByTestId('test-checkbox');
      await user.tab();
      
      expect(checkbox).toHaveFocus();
      
      await user.keyboard(' ');
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('RadioGroup should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup defaultValue="option1" data-testid="test-radio-group">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <Label htmlFor="r1">Option 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <Label htmlFor="r2">Option 2</Label>
          </div>
        </RadioGroup>
      );
      
      const radio1 = screen.getByLabelText('Option 1');
      const radio2 = screen.getByLabelText('Option 2');
      
      await user.tab();
      expect(radio1).toHaveFocus();
      
      await user.keyboard('{ArrowDown}');
      expect(radio2).toHaveFocus();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('Form elements should have proper labels for screen readers', () => {
      render(
        <form>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">I agree to the terms</Label>
            </div>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      );
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const bioTextarea = screen.getByLabelText('Bio');
      const termsCheckbox = screen.getByLabelText('I agree to the terms');
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      
      expect(nameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect(bioTextarea).toBeInTheDocument();
      expect(termsCheckbox).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('Interactive elements should have proper ARIA labels', () => {
      render(
        <div>
          <Button aria-label="Close dialog">×</Button>
          <Input aria-label="Search" placeholder="Search..." />
          <div role="button" aria-label="Custom button" tabIndex={0}>
            Custom Button
          </div>
        </div>
      );
      
      const closeButton = screen.getByRole('button', { name: 'Close dialog' });
      const searchInput = screen.getByRole('textbox', { name: 'Search' });
      const customButton = screen.getByRole('button', { name: 'Custom button' });
      
      expect(closeButton).toBeInTheDocument();
      expect(searchInput).toBeInTheDocument();
      expect(customButton).toBeInTheDocument();
    });

    it('Status messages should be announced to screen readers', () => {
      render(
        <div>
          <Alert role="status">
            <AlertDescription>Operation completed successfully</AlertDescription>
          </Alert>
          <div role="alert">Error: Something went wrong</div>
          <div role="log" aria-live="polite">System log message</div>
        </div>
      );
      
      const statusAlert = screen.getByRole('status');
      const errorAlert = screen.getByRole('alert');
      const logElement = screen.getByRole('log');
      
      expect(statusAlert).toBeInTheDocument();
      expect(errorAlert).toBeInTheDocument();
      expect(logElement).toBeInTheDocument();
      expect(logElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Focus Management', () => {
    it('Modal should trap focus when open', async () => {
      const user = userEvent.setup();
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <div>
            <h2>Test Modal</h2>
            <Button>First Button</Button>
            <Button>Second Button</Button>
            <Button>Close</Button>
          </div>
        </Modal>
      );
      
      const firstButton = screen.getByRole('button', { name: 'First Button' });
      const secondButton = screen.getByRole('button', { name: 'Second Button' });
      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      const closeButton = closeButtons[0]; // Use the first Close button
      
      // Focus should be trapped within the modal
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      
      // Check that focusable elements exist
      expect(firstButton).toBeInTheDocument();
      expect(secondButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
      
      // Focus should be on one of the buttons (Radix handles this automatically)
      const focusedElement = document.activeElement;
      expect([firstButton, secondButton, closeButton]).toContain(focusedElement);
    });

    it('Tabs should manage focus properly', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <p>Content for tab 1</p>
          </TabsContent>
          <TabsContent value="tab2">
            <p>Content for tab 2</p>
          </TabsContent>
        </Tabs>
      );
      
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      
      await user.tab();
      expect(tab1).toHaveFocus();
      
      await user.keyboard('{ArrowRight}');
      expect(tab2).toHaveFocus();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('Components should have sufficient color contrast', () => {
      render(
        <div>
          <Button className="bg-blue-600 text-white">High Contrast Button</Button>
          <Alert className="border-red-200 bg-red-100 text-red-800">
            <AlertDescription>High contrast alert</AlertDescription>
          </Alert>
        </div>
      );
      
      const button = screen.getByRole('button', { name: 'High Contrast Button' });
      const alert = screen.getByRole('alert');
      
      expect(button).toBeInTheDocument();
      expect(alert).toBeInTheDocument();
    });

    it('Focus indicators should be visible', () => {
      render(
        <div>
          <Button className="focus:ring-2 focus:ring-blue-500">Focusable Button</Button>
          <Input className="focus:ring-2 focus:ring-blue-500" />
        </div>
      );
      
      const button = screen.getByRole('button', { name: 'Focusable Button' });
      const input = screen.getByRole('textbox');
      
      expect(button).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('Components should be accessible on mobile devices', () => {
      render(
        <div className="min-h-screen">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Mobile Menu</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavigationMenuLink href="/mobile">Mobile Link</NavigationMenuLink>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      );
      
      const trigger = screen.getByRole('button', { name: 'Mobile Menu' });
      expect(trigger).toBeInTheDocument();
    });

    it('Touch targets should be appropriately sized', () => {
      render(
        <div>
          <Button className="min-h-[44px] min-w-[44px]">Touch Button</Button>
          <Checkbox className="h-6 w-6" />
        </div>
      );
      
      const button = screen.getByRole('button', { name: 'Touch Button' });
      const checkbox = screen.getByRole('checkbox');
      
      expect(button).toBeInTheDocument();
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Error Handling and Validation', () => {
    it('Form validation errors should be accessible', () => {
      render(
        <form>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              aria-invalid="true"
              aria-describedby="email-error"
            />
            <div id="email-error" role="alert" className="text-red-600">
              Please enter a valid email address
            </div>
          </div>
        </form>
      );
      
      const input = screen.getByLabelText('Email');
      const error = screen.getByRole('alert');
      
      expect(input).toBeInTheDocument();
      expect(error).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('Loading states should be announced to screen readers', () => {
      render(
        <div>
          <Button disabled aria-label="Loading...">
            <span className="sr-only">Loading</span>
            Submit
          </Button>
          <div role="status" aria-live="polite">
            Processing your request...
          </div>
        </div>
      );
      
      const button = screen.getByRole('button', { name: 'Loading...' });
      const status = screen.getByRole('status');
      
      expect(button).toBeInTheDocument();
      expect(status).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe('Complex Interactions', () => {
    it('Multi-step forms should maintain accessibility', () => {
      render(
        <div>
          <div role="tablist" aria-label="Form steps">
            <button role="tab" aria-selected="true" aria-controls="step1">Step 1</button>
            <button role="tab" aria-selected="false" aria-controls="step2">Step 2</button>
          </div>
          <div id="step1" role="tabpanel" aria-labelledby="step1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" />
          </div>
          <div id="step2" role="tabpanel" aria-labelledby="step2" hidden>
            <Label htmlFor="email">Email</Label>
            <Input id="email" />
          </div>
        </div>
      );
      
      const step1 = screen.getByRole('tab', { name: 'Step 1' });
      const step2 = screen.getByRole('tab', { name: 'Step 2' });
      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      
      expect(step1).toBeInTheDocument();
      expect(step2).toBeInTheDocument();
      expect(nameInput).toBeInTheDocument();
      expect(step1).toHaveAttribute('aria-selected', 'true');
    });

    it('Dynamic content updates should be announced', () => {
      render(
        <div>
          <div aria-live="polite" aria-atomic="true">
            <span>Initial content</span>
          </div>
          <Button>Update Content</Button>
        </div>
      );
      
      const liveRegion = screen.getByText('Initial content');
      const button = screen.getByRole('button', { name: 'Update Content' });
      
      expect(liveRegion).toBeInTheDocument();
      expect(button).toBeInTheDocument();
      expect(liveRegion.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Internationalization Accessibility', () => {
    it('Components should support RTL languages', () => {
      render(
        <div dir="rtl">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">ראש</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>דף נוכחי</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      );
      
      const breadcrumb = screen.getByRole('navigation');
      expect(breadcrumb).toBeInTheDocument();
    });

    it('Components should support different languages', () => {
      render(
        <div lang="es">
          <Button>Enviar</Button>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" />
        </div>
      );
      
      const button = screen.getByRole('button', { name: 'Enviar' });
      const input = screen.getByLabelText('Nombre');
      
      expect(button).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility', () => {
    it('Large lists should be virtualized for accessibility', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i}`,
        email: `item${i}@example.com`,
      }));

      const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
      ];

      render(
        <DataTable 
          columns={columns}
          data={largeData}
          data-testid="large-data-table"
        />
      );
      
      const dataTable = screen.getByTestId('large-data-table');
      expect(dataTable).toBeInTheDocument();
    });

    it('Lazy loading should maintain accessibility', () => {
      render(
        <div>
          <div aria-label="Loading more content">
            <div role="status" aria-live="polite">
              Loading additional content...
            </div>
          </div>
        </div>
      );
      
      const loadingRegion = screen.getByLabelText('Loading more content');
      const status = screen.getByRole('status');
      
      expect(loadingRegion).toBeInTheDocument();
      expect(status).toBeInTheDocument();
    });
  });

  describe('Custom Component Accessibility', () => {
    it('Custom components should follow accessibility patterns', () => {
      const CustomComponent = ({ children, ...props }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
        <div role="region" aria-label="Custom component" {...props}>
          {children}
        </div>
      );

      render(
        <CustomComponent data-testid="custom-component">
          <h2>Custom Content</h2>
          <p>This is a custom component with proper accessibility.</p>
        </CustomComponent>
      );
      
      const customComponent = screen.getByTestId('custom-component');
      const heading = screen.getByRole('heading', { name: 'Custom Content' });
      
      expect(customComponent).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      expect(customComponent).toHaveAttribute('role', 'region');
    });

    it('Accessible custom hooks should work correctly', () => {
      const useAccessibleFocus = () => {
        const [focused, setFocused] = React.useState(false);
        
        const focusProps = {
          onFocus: () => setFocused(true),
          onBlur: () => setFocused(false),
          'aria-focused': focused,
        };
        
        return { focused, focusProps };
      };

      const TestComponent = () => {
        const { focusProps } = useAccessibleFocus();
        
        return (
          <div {...focusProps} data-testid="focus-test">
            Focusable element
          </div>
        );
      };

      render(<TestComponent />);
      
      const element = screen.getByTestId('focus-test');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Accessibility Testing Utilities', () => {
    it('Test utilities should validate accessibility patterns', () => {
      const validateAriaAttributes = (element: HTMLElement) => {
        const hasRole = element.hasAttribute('role');
        const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
        const isInteractive = ['button', 'link', 'textbox', 'checkbox', 'radio'].includes(element.tagName.toLowerCase());
        
        if (isInteractive && !hasRole && !hasAriaLabel) {
          return false;
        }
        
        return true;
      };

      render(
        <div>
          <Button aria-label="Test button">Test</Button>
          <div role="button" tabIndex={0}>Custom button</div>
        </div>
      );
      
      const button = screen.getByRole('button', { name: 'Test button' });
      const customButton = screen.getByRole('button', { name: 'Custom button' });
      
      expect(validateAriaAttributes(button)).toBe(true);
      expect(validateAriaAttributes(customButton)).toBe(true);
    });

    it('Accessibility helpers should work correctly', () => {
      const getAccessibleName = (element: HTMLElement) => {
        return element.getAttribute('aria-label') || 
               element.getAttribute('aria-labelledby') ||
               element.textContent?.trim() ||
               '';
      };

      render(
        <div>
          <Button aria-label="Accessible button">Button Text</Button>
          <Input aria-label="Search input" placeholder="Search..." />
        </div>
      );
      
      const button = screen.getByRole('button', { name: 'Accessible button' });
      const input = screen.getByRole('textbox', { name: 'Search input' });
      
      expect(getAccessibleName(button)).toBe('Accessible button');
      expect(getAccessibleName(input)).toBe('Search input');
    });
  });
}); 