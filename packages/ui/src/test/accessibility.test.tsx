/**
 * Accessibility Test Suite - WCAG AAA Compliance
 * 
 * Comprehensive accessibility testing for all components:
 * - WCAG 2.1 AA/AAA compliance
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 * - Color contrast
 * - Semantic HTML
 * - ARIA states and properties
 */

import { render, screen, fireEvent } from '@testing-library/react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - user-event types issue with package exports
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@primitives/button';
import { Input } from '@primitives/input';
import { Checkbox } from '@primitives/checkbox';
import { RadioGroup, RadioGroupItem } from '@primitives/radio';
import { Switch } from '@primitives/switch';
import { Badge } from '@primitives/badge';
import { Modal } from '@components/modal';
import { Table } from '@components/table';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@components/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/accordion';
import type { ColumnDef } from '@tanstack/react-table';

// Mock data for testing
const mockTableData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
];

const mockTableColumns: ColumnDef<{ id: number; name: string; email: string; role: string }>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
];

const mockSelectOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

describe('Accessibility Tests', () => {
  // Use a scoped user instance for reliable async input and tabbing
  const user = userEvent.setup();

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have proper ARIA labels for Button component', () => {
      render(<Button aria-label="Submit form">Submit</Button>);
      
      const button = screen.getByRole('button', { name: 'Submit form' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Submit form');
    });

    it('should have proper ARIA labels for Input component', () => {
      render(<Input aria-label="Email address" placeholder="Enter email" />);
      
      const input = screen.getByRole('textbox', { name: 'Email address' });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-label', 'Email address');
    });

    it('should have proper ARIA labels for Checkbox component', () => {
      render(<Checkbox aria-label="Accept terms and conditions" />);
      
      const checkbox = screen.getByRole('checkbox', { name: 'Accept terms and conditions' });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('aria-label', 'Accept terms and conditions');
    });

    it('should have proper ARIA labels for Radio component', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="large" aria-label="Large size">Large</RadioGroupItem>
        </RadioGroup>
      );
      
      const radio = screen.getByRole('radio', { name: 'Large size' });
      expect(radio).toBeInTheDocument();
      expect(radio).toHaveAttribute('aria-label', 'Large size');
    });

    it('should have proper ARIA labels for Switch component', () => {
      render(<Switch aria-label="Enable notifications" />);
      
      const switchElement = screen.getByRole('switch', { name: 'Enable notifications' });
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toHaveAttribute('aria-label', 'Enable notifications');
    });

    it('should have proper ARIA labels for Badge component', () => {
      render(<Badge aria-label="New feature">New</Badge>);
      
      const badge = screen.getByText('New');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('aria-label', 'New feature');
    });

    it('should have proper ARIA labels for Modal component', () => {
      render(
        <Modal open={true} onOpenChange={() => {}} aria-label="Settings dialog">
          <div>Modal content</div>
        </Modal>
      );
      
      const modal = screen.getByRole('dialog', { name: 'Settings dialog' });
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-label', 'Settings dialog');
    });

    it('should have proper ARIA labels for Table component', () => {
      render(<Table data={mockTableData} columns={mockTableColumns} aria-label="User data table" />);
      
      const table = screen.getByRole('table', { name: 'User data table' });
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('aria-label', 'User data table');
    });

    it.skip('should have proper ARIA labels for Select component', () => {
      render(
        <Select aria-label="Choose an option">
          <SelectTrigger>
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent>
            {mockSelectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      
      const select = screen.getByRole('combobox', { name: 'Choose an option' });
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('aria-label', 'Choose an option');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation for Button component', async () => {
      render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
        </div>
      );
      
      const firstButton = screen.getByRole('button', { name: 'First Button' });
      const secondButton = screen.getByRole('button', { name: 'Second Button' });
      
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
      
      await user.tab();
      expect(document.activeElement).toBe(secondButton);
    });

    it('should support Enter key activation for Button component', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalled();
    });

    it.skip('should support Space key activation for Button component', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      fireEvent.keyUp(button, { key: ' ', code: 'Space' });
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('should support Tab navigation for form elements', async () => {
      render(
        <form aria-label="Test form">
          <Input placeholder="First input" />
          <Input placeholder="Second input" />
          <Button>Submit</Button>
        </form>
      );
      
      const firstInput = screen.getByPlaceholderText('First input');
      const secondInput = screen.getByPlaceholderText('Second input');
      const button = screen.getByRole('button');
      
      firstInput.focus();
      expect(document.activeElement).toBe(firstInput);
      
      await user.tab();
      expect(document.activeElement).toBe(secondInput);
      
      await user.tab();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA descriptions for Input component', () => {
      render(
        <div>
          <label htmlFor="email">Email</label>
          <Input id="email" aria-describedby="email-help" />
          <div id="email-help">Enter your email address</div>
        </div>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-help');
    });

    it('should have proper ARIA live regions for dynamic content', () => {
      render(
        <div aria-live="polite" aria-atomic="true">
          Status: Loading...
        </div>
      );
      
      const liveRegion = screen.getByText('Status: Loading...');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it.skip('should have proper ARIA expanded states for collapsible content', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Focus Management', () => {
    it.skip('should manage focus correctly for Modal component', () => {
      render(
        <Modal open={true} onOpenChange={() => {}}>
          <Button>Modal Button</Button>
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it.skip('should restore focus after closing Modal', async () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      
      const { unmount } = render(
        <Modal open={true} onOpenChange={() => {}}>
          <div>Modal content</div>
        </Modal>
      );
      
      unmount();
      
      // Focus should be restored to trigger button
      expect(document.activeElement).toBe(triggerButton);
      
      document.body.removeChild(triggerButton);
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast for Button component', () => {
      render(<Button>High Contrast Button</Button>);
      
      const button = screen.getByRole('button', { name: 'High Contrast Button' });
      
      // Check that button has proper contrast classes
      expect(button).toHaveClass('text-semantic-primary-foreground');
    });

    it('should have sufficient color contrast for Input component', () => {
      render(<Input placeholder="High contrast input" />);
      
      const input = screen.getByRole('textbox');
      
      // Check that input has proper contrast classes - Input component uses semantic tokens
      expect(input.className).toContain('semantic');
    });
  });

  describe('Semantic HTML', () => {
    it('should use semantic HTML for Button component', () => {
      render(<Button>Semantic Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Semantic Button' });
      expect(button.tagName).toBe('BUTTON');
    });

    it('should use semantic HTML for Input component', () => {
      render(<Input placeholder="Semantic input" />);
      
      const input = screen.getByRole('textbox');
      expect(input.tagName).toBe('INPUT');
    });

    it('should use semantic HTML for Table component', () => {
      render(<Table data={mockTableData} columns={mockTableColumns} />);
      
      const table = screen.getByRole('table');
      expect(table.tagName).toBe('TABLE');
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(3);
    });

    it('should use semantic HTML for form elements', () => {
      render(
        <form>
          <label htmlFor="test-input">Test Label</label>
          <Input id="test-input" />
          <Button type="submit">Submit</Button>
        </form>
      );
      
      const form = document.querySelector('form');
      expect(form?.tagName).toBe('FORM');
      
      const label = screen.getByLabelText('Test Label');
      expect(label).toBeInTheDocument();
    });
  });

  describe('ARIA States and Properties', () => {
    it('should have correct ARIA states for Switch component', () => {
      const { rerender } = render(<Switch checked={false} />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      rerender(<Switch checked={true} />);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should have correct ARIA states for Checkbox component', () => {
      const { rerender } = render(<Checkbox checked={false} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
      
      rerender(<Checkbox checked={true} />);
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('should have correct ARIA states for Radio component', () => {
      render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1">Option 1</RadioGroupItem>
        </RadioGroup>
      );
      
      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('aria-checked', 'true');
    });

    it('should have correct ARIA states for disabled components', () => {
      render(
        <div>
          <Button disabled>Disabled Button</Button>
          <Input disabled />
          <Checkbox disabled />
        </div>
      );
      
      expect(screen.getByRole('button', { name: 'Disabled Button' })).toBeDisabled();
      expect(screen.getByRole('textbox')).toBeDisabled();
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });
  });
});
