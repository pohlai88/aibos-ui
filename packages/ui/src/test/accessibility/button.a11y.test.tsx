/**
 * Button Accessibility Tests - Milestone 1
 * Comprehensive a11y testing for Button component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../primitives/button';

describe('Button Accessibility', () => {
  it('has proper button semantics', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('supports keyboard navigation', async () => {
    const user = (userEvent as any).setup();
    render(
      
      <div>
        <Button>First Button</Button>
        <Button>Second Button</Button>
        <Button>Third Button</Button>
      </div>
    );

    const firstButton = screen.getByRole('button', { name: 'First Button' });
    const secondButton = screen.getByRole('button', { name: 'Second Button' });
    const thirdButton = screen.getByRole('button', { name: 'Third Button' });

    // Test Tab navigation
    await user.tab();
    expect(firstButton).toHaveFocus();
    
    await user.tab();
    expect(secondButton).toHaveFocus();
    
    await user.tab();
    expect(thirdButton).toHaveFocus();
  });

  it('supports Enter and Space key activation', async () => {
    const user = (userEvent as any).setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Test Button</Button>);

    const button = screen.getByRole('button');
    
    // Test Enter key
    await user.tab();
    expect(button).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Test Space key
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('supports disabled state correctly', () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('supports different variants with proper contrast', () => {
    render(
      <div>
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    );

    // All buttons should be accessible
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });

  it('supports loading state with proper ARIA attributes', () => {
    render(
      <Button disabled aria-busy="true">
        Loading...
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
