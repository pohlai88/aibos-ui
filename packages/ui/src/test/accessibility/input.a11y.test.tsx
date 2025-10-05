/**
 * Input Accessibility Tests - Milestone 1
 * Comprehensive a11y testing for Input component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Input } from '../../primitives/input';
import { Label } from '../../primitives/label';

describe('Input Accessibility', () => {
  it('has proper input semantics', () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    // Input component doesn't set explicit type attribute by default
    expect(input.tagName).toBe('INPUT');
  });

  it('supports proper labeling', () => {
    render(
      <div>
        <Label htmlFor="test-input">Test Input</Label>
        <Input id="test-input" />
      </div>
    );

    const input = screen.getByRole('textbox');
    const label = screen.getByText('Test Input');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('supports keyboard interaction', async () => {
    const user = (userEvent as any).setup();
    render(<Input placeholder="Enter text" />);

    const input = screen.getByRole('textbox');
    await user.tab();
    expect(input).toHaveFocus();
    
    await user.type(input, 'Hello World');
    expect(input).toHaveValue('Hello World');
  });

  it('supports disabled state', () => {
    render(<Input disabled placeholder="Enter text" />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('supports required state', () => {
    render(<Input required placeholder="Enter text" />);

    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('supports different input types', () => {
    render(
      <div>
        <Input type="email" placeholder="Enter email" />
        <Input type="password" placeholder="Enter password" />
        <Input type="number" placeholder="Enter number" />
      </div>
    );

    const emailInput = screen.getByPlaceholderText('Enter email');
    const passwordInput = screen.getByPlaceholderText('Enter password');
    const numberInput = screen.getByPlaceholderText('Enter number');
    
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(numberInput).toHaveAttribute('type', 'number');
  });
});