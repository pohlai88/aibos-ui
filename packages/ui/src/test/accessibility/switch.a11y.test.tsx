/**
 * Switch Accessibility Tests - Milestone 1
 * Comprehensive a11y testing for Switch component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Switch } from '../../primitives/switch';
import { Label } from '../../primitives/label';

describe('Switch Accessibility', () => {
  it('has proper switch semantics', () => {
    render(
      <div className="flex items-center space-x-2">
        <Switch id="airplane-mode" />
        <Label htmlFor="airplane-mode">Airplane Mode</Label>
      </div>
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
  });

  it('supports proper labeling', () => {
    render(
      <div className="flex items-center space-x-2">
        <Switch id="airplane-mode" />
        <Label htmlFor="airplane-mode">Airplane Mode</Label>
      </div>
    );

    const switchElement = screen.getByRole('switch');
    const label = screen.getByText('Airplane Mode');
    expect(switchElement).toHaveAttribute('id', 'airplane-mode');
    expect(label).toHaveAttribute('for', 'airplane-mode');
  });

  it('supports keyboard interaction', async () => {
    const user = (userEvent as any).setup();
    render(
      <div className="flex items-center space-x-2">
        <Switch id="airplane-mode" />
        <Label htmlFor="airplane-mode">Airplane Mode</Label>
      </div>
    );

    const switchElement = screen.getByRole('switch');
    await user.tab();
    expect(switchElement).toHaveFocus();
    
    await user.keyboard(' ');
    expect(switchElement).toBeChecked();
  });

  it('supports disabled state', () => {
    render(
      <div className="flex items-center space-x-2">
        <Switch id="airplane-mode" disabled />
        <Label htmlFor="airplane-mode">Airplane Mode</Label>
      </div>
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeDisabled();
  });

  it('supports checked state', () => {
    render(
      <div className="flex items-center space-x-2">
        <Switch id="airplane-mode" checked />
        <Label htmlFor="airplane-mode">Airplane Mode</Label>
      </div>
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();
  });
});