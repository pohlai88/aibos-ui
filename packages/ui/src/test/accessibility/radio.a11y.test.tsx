/**
 * Radio Accessibility Tests - Milestone 1
 * Comprehensive a11y testing for Radio component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { RadioGroup, RadioGroupItem } from '../../primitives/radio';
import { Label } from '../../primitives/label';

describe('Radio Accessibility', () => {
  it('has proper radio group semantics', () => {
    render(
      <RadioGroup defaultValue="option1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option2" id="option2" />
          <Label htmlFor="option2">Option 2</Label>
        </div>
      </RadioGroup>
    );

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeInTheDocument();
    
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });

  it('supports proper labeling', () => {
    render(
      <RadioGroup defaultValue="option1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
      </RadioGroup>
    );

    const radio = screen.getByRole('radio');
    const label = screen.getByText('Option 1');
    expect(radio).toHaveAttribute('id', 'option1');
    expect(label).toHaveAttribute('for', 'option1');
  });

  it('supports keyboard navigation', async () => {
    const user = (userEvent as any).setup();
    render(
      <RadioGroup defaultValue="option1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option2" id="option2" />
          <Label htmlFor="option2">Option 2</Label>
        </div>
      </RadioGroup>
    );

    const radios = screen.getAllByRole('radio');
    await user.tab();
    expect(radios[0]).toHaveFocus();
    
    await user.keyboard('{ArrowDown}');
    expect(radios[1]).toHaveFocus();
  });

  it('supports disabled state', () => {
    render(
      <RadioGroup defaultValue="option1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" disabled />
          <Label htmlFor="option1">Option 1</Label>
        </div>
      </RadioGroup>
    );

    const radio = screen.getByRole('radio');
    expect(radio).toBeDisabled();
  });

  it('supports proper group behavior', () => {
    render(
      <RadioGroup defaultValue="option1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option2" id="option2" />
          <Label htmlFor="option2">Option 2</Label>
        </div>
      </RadioGroup>
    );

    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });
});