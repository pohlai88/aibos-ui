/**
 * Checkbox Accessibility Tests - Milestone 1
 * Comprehensive a11y testing for Checkbox component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Checkbox } from '../../primitives/checkbox';
import { Label } from '../../primitives/label';

describe('Checkbox Accessibility', () => {
  it('has proper checkbox semantics', () => {
    render(
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    // Note: Radix UI checkbox renders as button with checkbox role
    expect(checkbox.tagName).toBe('BUTTON');
  });

  it('supports proper labeling', () => {
    render(
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    );

    const checkbox = screen.getByRole('checkbox');
    const label = screen.getByText('Accept terms and conditions');
    expect(checkbox).toHaveAttribute('id', 'terms');
    expect(label).toHaveAttribute('for', 'terms');
  });

  it('supports keyboard interaction', async () => {
    const user = (userEvent as any).setup();
    render(
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    );

    const checkbox = screen.getByRole('checkbox');
    await user.tab();
    expect(checkbox).toHaveFocus();
    
    await user.keyboard(' ');
    expect(checkbox).toBeChecked();
  });

  it('supports disabled state', () => {
    render(
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" disabled />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('supports indeterminate state', () => {
    render(
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" checked="indeterminate" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
  });
});