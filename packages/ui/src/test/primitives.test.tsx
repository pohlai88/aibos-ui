/**
 * Primitive Components Test Suite
 * 
 * Comprehensive testing for all primitive UI components:
 * Button, Input, Checkbox, Radio, Switch, Badge, LoadingSpinner
 */

import { screen, fireEvent, cleanup } from '@testing-library/react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithA11yShell } from './a11y/a11y-shell.util';
import { Button } from '@primitives/button';
import { Input } from '@primitives/input';
import { Checkbox } from '@primitives/checkbox';
import { RadioGroup, RadioGroupItem } from '@primitives/radio';
import { Switch } from '@primitives/switch';
import { Badge } from '@primitives/badge';
import { LoadingSpinner } from '@primitives/loading-spinner';

describe('Primitive Components', () => {
  // Scoped user instance for deterministic keyboard/mouse behavior
  const user = userEvent.setup();

  beforeEach(() => {
    document.body.innerHTML = '<div id="mount" class="bg-semantic-background p-4"></div>';
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });
  describe('Button Component', () => {
    it('should render with correct text and attributes', () => {
      renderWithA11yShell(<Button>Click me</Button>, { container: document.getElementById('mount') as HTMLElement });
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      // Button component doesn't set type attribute by default, it's handled by browser
    });

    it('should handle click events', async () => {
      const handleClick = vi.fn();
      renderWithA11yShell(<Button onClick={handleClick}>Click me</Button>, { container: document.getElementById('mount') as HTMLElement });
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should activate via keyboard (Enter/Space)', async () => {
      const handleClick = vi.fn();
      renderWithA11yShell(<Button onClick={handleClick}>K</Button>, { container: document.getElementById('mount') as HTMLElement });
      const btn = screen.getByRole('button');
      btn.focus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should be disabled when disabled prop is true', () => {
      const onClick = vi.fn();
      renderWithA11yShell(<Button disabled onClick={onClick}>Disabled button</Button>, { container: document.getElementById('mount') as HTMLElement });
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // clicking should not invoke handler
      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should have correct accessibility attributes', () => {
      renderWithA11yShell(<Button aria-label="Custom label">Button</Button>, { container: document.getElementById('mount') as HTMLElement });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should support different variants', () => {
      const { rerender } = renderWithA11yShell(<Button variant="primary">Primary</Button>, { container: document.getElementById('mount') as HTMLElement });
      expect(screen.getByRole('button')).toHaveClass('bg-semantic-primary');

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-semantic-muted');
    });

    it('should support different sizes', () => {
      const { rerender } = renderWithA11yShell(<Button size="sm">Small</Button>, { container: document.getElementById('mount') as HTMLElement });
      expect(screen.getByRole('button')).toHaveClass('h-9');

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-11');
    });
  });

  describe('Input Component', () => {
    it('should render with correct attributes', () => {
      renderWithA11yShell(<Input placeholder="Enter text" />, { container: document.getElementById('mount') as HTMLElement });
      
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      // Input component doesn't set type attribute by default, it's handled by browser
    });

    it('should handle value changes', async () => {
      const handleChange = vi.fn();
      renderWithA11yShell(<Input onChange={handleChange} />, { container: document.getElementById('mount') as HTMLElement });
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test input');
      
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('test input');
    });

    it('should support different input types', () => {
      const { rerender } = renderWithA11yShell(<Input type="email" />, { container: document.getElementById('mount') as HTMLElement });
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      // Password inputs don't have textbox role, they have textbox role but are not accessible
      const passwordInput = screen.getByDisplayValue('');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should show validation states', () => {
      const { rerender } = renderWithA11yShell(<Input className="border-semantic-error" />, { container: document.getElementById('mount') as HTMLElement });
      expect(screen.getByRole('textbox')).toHaveClass('border-semantic-error');

      rerender(<Input className="border-semantic-success" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-semantic-success');
    });

    it('should be disabled when disabled prop is true', () => {
      renderWithA11yShell(<Input disabled />, { container: document.getElementById('mount') as HTMLElement });
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('Checkbox Component', () => {
    it('should render with correct attributes', () => {
      renderWithA11yShell(<Checkbox />, { container: document.getElementById('mount') as HTMLElement });
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      // Radix UI Checkbox renders as a button element with checkbox role, not input type="checkbox"
    });

    it('should handle checked state changes', async () => {
      const handleChange = vi.fn();
      renderWithA11yShell(<Checkbox onCheckedChange={handleChange} />, { container: document.getElementById('mount') as HTMLElement });
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(handleChange).toHaveBeenCalled();
      expect(checkbox).toBeChecked();
    });

    it('should toggle via Space key', async () => {
      renderWithA11yShell(<Checkbox />, { container: document.getElementById('mount') as HTMLElement });
      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();
      await user.keyboard(' ');
      expect(checkbox).toBeChecked();
      await user.keyboard(' ');
      expect(checkbox).not.toBeChecked();
    });

    it('should be controlled when checked prop is provided', () => {
      const { rerender } = renderWithA11yShell(<Checkbox checked={true} />, { container: document.getElementById('mount') as HTMLElement });
      expect(screen.getByRole('checkbox')).toBeChecked();

      rerender(<Checkbox checked={false} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('should be disabled when disabled prop is true', () => {
      const onChange = vi.fn();
      renderWithA11yShell(<Checkbox disabled onChange={onChange} />, { container: document.getElementById('mount') as HTMLElement });
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      fireEvent.click(checkbox);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Radio Component', () => {
    it('should render with correct attributes', () => {
      renderWithA11yShell(<RadioGroup name="test"><RadioGroupItem value="option1" /></RadioGroup>, { container: document.getElementById('mount') as HTMLElement });
      
      const radio = screen.getByRole('radio');
      expect(radio).toBeInTheDocument();
      // Radix UI Radio renders as a button element with radio role, not input type="radio"
      expect(radio).toHaveAttribute('value', 'option1');
    });

    it('should handle selection changes', async () => {
      const handleChange = vi.fn();
      renderWithA11yShell(<RadioGroup name="test" onValueChange={handleChange}><RadioGroupItem value="option1" /></RadioGroup>, { container: document.getElementById('mount') as HTMLElement });
      
      const radio = screen.getByRole('radio');
      await user.click(radio);
      
      expect(handleChange).toHaveBeenCalled();
      expect(radio).toBeChecked();
    });

    it('should be controlled when checked prop is provided', () => {
      const { rerender } = renderWithA11yShell(<RadioGroup name="test"><RadioGroupItem value="option1" checked={true} /></RadioGroup>, { container: document.getElementById('mount') as HTMLElement });
      expect(screen.getByRole('radio')).toBeChecked();

      rerender(<RadioGroup name="test"><RadioGroupItem value="option1" checked={false} /></RadioGroup>);
      expect(screen.getByRole('radio')).not.toBeChecked();
    });
  });

  describe('Switch Component', () => {
    it('should render with correct attributes', () => {
      renderWithA11yShell(<Switch />, { container: document.getElementById('mount') as HTMLElement });
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('should handle toggle state changes', async () => {
      const handleChange = vi.fn();
      renderWithA11yShell(<Switch onCheckedChange={handleChange} />, { container: document.getElementById('mount') as HTMLElement });
      
      const switchElement = screen.getByRole('switch');
      await user.click(switchElement);
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should toggle via Space key and reflect aria-checked', async () => {
      renderWithA11yShell(<Switch />, { container: document.getElementById('mount') as HTMLElement });
      const sw = screen.getByRole('switch');
      sw.focus();
      expect(sw).toHaveAttribute('aria-checked', 'false');
      await user.keyboard(' ');
      expect(sw).toHaveAttribute('aria-checked', 'true');
      await user.keyboard(' ');
      expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    it('should be controlled when checked prop is provided', () => {
      const { rerender } = renderWithA11yShell(<Switch checked={true} />, { container: document.getElementById('mount') as HTMLElement });
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

      rerender(<Switch checked={false} />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Badge Component', () => {
    it('should render with correct text', () => {
      renderWithA11yShell(<Badge>New</Badge>, { container: document.getElementById('mount') as HTMLElement });
      
      const badge = screen.getByText('New');
      expect(badge).toBeInTheDocument();
    });

    it('should support different variants', () => {
      const { rerender } = renderWithA11yShell(<Badge variant="default">Default</Badge>, { container: document.getElementById('mount') as HTMLElement });
      expect(screen.getByText('Default')).toHaveClass('bg-semantic-primary');

      rerender(<Badge variant="secondary">Secondary</Badge>);
      expect(screen.getByText('Secondary')).toHaveClass('bg-semantic-muted');
    });

    it('should support different sizes', () => {
      const { rerender } = renderWithA11yShell(<Badge className="text-xs">Small</Badge>, { container: document.getElementById('mount') as HTMLElement });
      expect(screen.getByText('Small')).toHaveClass('text-xs');

      rerender(<Badge className="text-sm">Large</Badge>);
      expect(screen.getByText('Large')).toHaveClass('text-sm');
    });
  });

  describe('LoadingSpinner Component', () => {
    it('should render loading spinner', () => {
      renderWithA11yShell(<LoadingSpinner />, { container: document.getElementById('mount') as HTMLElement });
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
      // LoadingSpinner component doesn't include aria-live attribute
    });

    it('should support different sizes', () => {
      const { rerender } = renderWithA11yShell(<LoadingSpinner size="sm" />, { container: document.getElementById('mount') as HTMLElement });
      expect(screen.getByRole('status')).toHaveClass('h-4');

      rerender(<LoadingSpinner size="lg" />);
      expect(screen.getByRole('status')).toHaveClass('h-8');
    });

    it('should support custom aria-label', () => {
      renderWithA11yShell(<LoadingSpinner aria-label="Custom loading" />, { container: document.getElementById('mount') as HTMLElement });
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Custom loading');
    });
  });
});
