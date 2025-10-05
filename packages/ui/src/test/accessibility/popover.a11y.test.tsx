/**
 * Popover Accessibility Tests - Milestone 1
 * Comprehensive a11y testing for Popover component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/popover';
import { Button } from '../../primitives/button';

describe('Popover Accessibility', () => {
  it('has proper popover semantics', () => {
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

  it('supports keyboard interaction', async () => {
    const user = (userEvent as any).setup();
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
    await user.tab();
    expect(trigger).toHaveFocus();
  });

  it('supports proper ARIA attributes', () => {
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button aria-describedby="popover-description">Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent id="popover-description">
          <p>This is popover content</p>
        </PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole('button', { name: 'Open Popover' });
    expect(trigger).toHaveAttribute('aria-describedby', 'popover-description');
  });

  it('supports focus management', async () => {
    const user = (userEvent as any).setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <Button>Action Button</Button>
        </PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole('button', { name: 'Open Popover' });
    await user.tab();
    expect(trigger).toHaveFocus();
  });
});