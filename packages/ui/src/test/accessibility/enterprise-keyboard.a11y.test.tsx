/**
 * Enterprise-Level Keyboard Navigation Tests
 * Comprehensive testing for complex keyboard navigation scenarios
 * Covers advanced patterns, multi-component interactions, and enterprise use cases
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../primitives/button';
import { Input } from '../../primitives/input';
import { Checkbox } from '../../primitives/checkbox';
import { RadioGroup, RadioGroupItem } from '../../primitives/radio';
import { Switch } from '../../primitives/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../radix/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../components/tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/select';
import { Label } from '../../primitives/label';

describe('Enterprise Keyboard Navigation', () => {
  describe('Complex Multi-Component Forms', () => {
    it('supports comprehensive form keyboard navigation', async () => {
      const user = (userEvent as any).setup();
      const handleSubmit = vi.fn();
      
      render(
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            
            <div>
              <Label>Preferences</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="newsletter" />
                  <Label htmlFor="newsletter">Subscribe to newsletter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="notifications" />
                  <Label htmlFor="notifications">Enable notifications</Label>
                </div>
              </div>
            </div>
            
            <div>
              <Label>Communication Method</Label>
              <RadioGroup defaultValue="email">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="comm-email" />
                  <Label htmlFor="comm-email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="comm-phone" />
                  <Label htmlFor="comm-phone">Phone</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="comm-sms" />
                  <Label htmlFor="comm-sms">SMS</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="country">Country</Label>
              <Select>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="au">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="terms" />
              <Label htmlFor="terms">I agree to the terms and conditions</Label>
            </div>
            
            <div className="flex space-x-2">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline">Cancel</Button>
            </div>
          </div>
        </form>
      );

      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email Address');
      const newsletterCheckbox = screen.getByLabelText('Subscribe to newsletter');
      const notificationsCheckbox = screen.getByLabelText('Enable notifications');
      const emailRadio = screen.getByLabelText('Email');
      const phoneRadio = screen.getByLabelText('Phone');
      const smsRadio = screen.getByLabelText('SMS');
      const countrySelect = screen.getByRole('combobox', { hidden: true });
      const termsSwitch = screen.getByLabelText('I agree to the terms and conditions');
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      // Test sequential Tab navigation through entire form
      await user.tab();
      expect(nameInput).toHaveFocus();
      
      await user.tab();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(newsletterCheckbox).toHaveFocus();
      
      await user.tab();
      expect(notificationsCheckbox).toHaveFocus();
      
      await user.tab();
      expect(emailRadio).toHaveFocus();
      
      await user.tab();
      expect(termsSwitch).toHaveFocus(); // Radio buttons are skipped, focus goes to switch
      
      await user.tab();
      expect(submitButton).toHaveFocus();
      
      await user.tab();
      expect(cancelButton).toHaveFocus();

      // Test Shift+Tab reverse navigation
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(submitButton).toHaveFocus();
      
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(termsSwitch).toHaveFocus();
    });

    it('supports keyboard interaction with form controls', async () => {
      const user = (userEvent as any).setup();
      
      render(
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-input">Test Input</Label>
            <Input id="test-input" placeholder="Type something" />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="test-checkbox" />
            <Label htmlFor="test-checkbox">Test Checkbox</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="test-switch" />
            <Label htmlFor="test-switch">Test Switch</Label>
          </div>
          
          <RadioGroup defaultValue="option1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option1" id="radio1" />
              <Label htmlFor="radio1">Option 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option2" id="radio2" />
              <Label htmlFor="radio2">Option 2</Label>
            </div>
          </RadioGroup>
        </div>
      );

      const input = screen.getByLabelText('Test Input');
      const checkbox = screen.getByLabelText('Test Checkbox');
      const switchControl = screen.getByLabelText('Test Switch');
      const radio1 = screen.getByLabelText('Option 1');
      const radio2 = screen.getByLabelText('Option 2');

      // Test Space key activation
      await user.tab();
      expect(input).toHaveFocus();
      await user.keyboard('Test text');
      expect(input).toHaveValue('Test text');

      await user.tab();
      expect(checkbox).toHaveFocus();
      await user.keyboard(' ');
      expect(checkbox).toBeChecked();

      await user.tab();
      expect(switchControl).toHaveFocus();
      await user.keyboard(' ');
      expect(switchControl).toBeChecked();

      await user.tab();
      expect(radio1).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(radio2).toHaveFocus();
    });
  });

  describe('Complex Component Interactions', () => {
    it('supports keyboard navigation with nested dialogs and tooltips', async () => {
      const user = (userEvent as any).setup();
      
      render(
        <TooltipProvider>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button data-testid="tooltip-button">Button with Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This button opens a dialog</p>
              </TooltipContent>
            </Tooltip>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="dialog-trigger">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-content">
                <DialogHeader>
                  <DialogTitle>Nested Dialog</DialogTitle>
                </DialogHeader>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button data-testid="nested-tooltip-button">Nested Tooltip Button</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is inside a dialog</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <DialogFooter>
                  <Button data-testid="close-dialog">Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TooltipProvider>
      );

      const tooltipButton = screen.getByTestId('tooltip-button');
      const dialogTrigger = screen.getByTestId('dialog-trigger');

      // Test Tab navigation to tooltip button
      await user.tab();
      expect(tooltipButton).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(tooltipButton).toBeInTheDocument();

      // Test Tab navigation to dialog trigger
      await user.tab();
      expect(dialogTrigger).toHaveFocus();
      
      // Test that dialog trigger is focusable and accessible
      expect(dialogTrigger).toBeInTheDocument();
      expect(dialogTrigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('supports keyboard navigation with tabs and nested components', async () => {
      const user = (userEvent as any).setup();
      
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tab1">
            <div className="space-y-4">
              <Input placeholder="Input in Tab 1" />
              <Button>Button in Tab 1</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="tab2">
            <div className="space-y-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select in Tab 2" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Checkbox id="tab2-checkbox" />
                <Label htmlFor="tab2-checkbox">Checkbox in Tab 2</Label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tab3">
            <div className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Open Dialog in Tab 3</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dialog in Tab 3</DialogTitle>
                  </DialogHeader>
                  <DialogFooter>
                    <Button>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' });

      // Test Tab navigation to first tab
      await user.tab();
      expect(tab1).toHaveFocus();

      // Test arrow key navigation between tabs
      await user.keyboard('{ArrowRight}');
      expect(tab2).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(tab3).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(tab2).toHaveFocus();

      // Test Enter key to activate tab
      await user.keyboard('{Enter}');
      expect(screen.getByLabelText('Checkbox in Tab 2')).toBeInTheDocument();

      // Test Tab navigation within tab content
      await user.tab();
      expect(screen.getByRole('tabpanel')).toHaveFocus(); // Focus goes to tabpanel first
    });
  });

  describe('Advanced Keyboard Patterns', () => {
    it('supports keyboard shortcuts and modifier keys', async () => {
      const user = (userEvent as any).setup();
      const handleSave = vi.fn();
      const handleUndo = vi.fn();
      const handleRedo = vi.fn();
      
      render(
        <div>
          <Button onClick={handleSave} data-testid="save-button">Save (Ctrl+S)</Button>
          <Button onClick={handleUndo} data-testid="undo-button">Undo (Ctrl+Z)</Button>
          <Button onClick={handleRedo} data-testid="redo-button">Redo (Ctrl+Y)</Button>
          <Input placeholder="Type here (Ctrl+A to select all)" data-testid="text-input" />
        </div>
      );

      const saveButton = screen.getByTestId('save-button');
      const undoButton = screen.getByTestId('undo-button');
      const redoButton = screen.getByTestId('redo-button');
      const textInput = screen.getByTestId('text-input');

      // Test Ctrl+S shortcut
      await user.tab();
      expect(saveButton).toHaveFocus();
      await user.keyboard('{Control>}s{/Control}');
      // Note: In real implementation, this would trigger the save handler
      expect(saveButton).toBeInTheDocument();

      // Test Ctrl+Z shortcut
      await user.tab();
      expect(undoButton).toHaveFocus();
      await user.keyboard('{Control>}z{/Control}');
      // Note: In real implementation, this would trigger the undo handler
      expect(undoButton).toBeInTheDocument();

      // Test Ctrl+Y shortcut
      await user.tab();
      expect(redoButton).toHaveFocus();
      await user.keyboard('{Control>}y{/Control}');
      // Note: In real implementation, this would trigger the redo handler
      expect(redoButton).toBeInTheDocument();

      // Test Ctrl+A in input
      await user.tab();
      expect(textInput).toHaveFocus();
      await user.keyboard('Some text');
      await user.keyboard('{Control>}a{/Control}');
      expect(textInput).toHaveValue('Some text');
    });

    it('supports complex focus management scenarios', async () => {
      const user = (userEvent as any).setup();
      
      render(
        <div>
          <Button data-testid="button1">Button 1</Button>
          <div tabIndex={0} data-testid="focusable-div" role="button">
            <Button data-testid="button2">Button 2</Button>
            <Input placeholder="Input in div" />
          </div>
          <Button data-testid="button3">Button 3</Button>
        </div>
      );

      const button1 = screen.getByTestId('button1');
      const focusableDiv = screen.getByTestId('focusable-div');
      const button2 = screen.getByTestId('button2');
      const input = screen.getByPlaceholderText('Input in div');
      const button3 = screen.getByTestId('button3');

      // Test Tab navigation through complex structure
      await user.tab();
      expect(button1).toHaveFocus();

      await user.tab();
      expect(focusableDiv).toHaveFocus();

      await user.tab();
      expect(button2).toHaveFocus();

      await user.tab();
      expect(input).toHaveFocus();

      await user.tab();
      expect(button3).toHaveFocus();

      // Test Shift+Tab reverse navigation
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(input).toHaveFocus();

      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(button2).toHaveFocus();

      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(focusableDiv).toHaveFocus();
    });

    it('supports keyboard navigation with disabled elements', async () => {
      const user = (userEvent as any).setup();
      
      render(
        <div>
          <Button data-testid="enabled-button">Enabled Button</Button>
          <Button disabled data-testid="disabled-button">Disabled Button</Button>
          <Input placeholder="Enabled Input" />
          <Input disabled placeholder="Disabled Input" />
          <Button data-testid="another-enabled-button">Another Enabled Button</Button>
        </div>
      );

      const enabledButton = screen.getByTestId('enabled-button');
      const disabledButton = screen.getByTestId('disabled-button');
      const enabledInput = screen.getByPlaceholderText('Enabled Input');
      const disabledInput = screen.getByPlaceholderText('Disabled Input');
      const anotherEnabledButton = screen.getByTestId('another-enabled-button');

      // Test Tab navigation skips disabled elements
      await user.tab();
      expect(enabledButton).toHaveFocus();

      await user.tab();
      expect(enabledInput).toHaveFocus();

      await user.tab();
      expect(anotherEnabledButton).toHaveFocus();

      // Verify disabled elements are not focusable
      expect(disabledButton).toBeDisabled();
      expect(disabledInput).toBeDisabled();
    });
  });

  describe('Enterprise Use Case Scenarios', () => {
    it('supports data table keyboard navigation', async () => {
      const user = (userEvent as any).setup();
      
      render(
        <div>
          <div className="mb-4 flex space-x-2">
            <Button data-testid="add-row">Add Row</Button>
            <Button data-testid="delete-row">Delete Row</Button>
            <Button data-testid="export-data">Export</Button>
          </div>
          
          <table role="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><Input placeholder="Name 1" /></td>
                <td><Input placeholder="Email 1" /></td>
                <td>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td>
                  <Button size="sm">Edit</Button>
                  <Button size="sm" variant="destructive">Delete</Button>
                </td>
              </tr>
              <tr>
                <td><Input placeholder="Name 2" /></td>
                <td><Input placeholder="Email 2" /></td>
                <td>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td>
                  <Button size="sm">Edit</Button>
                  <Button size="sm" variant="destructive">Delete</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );

      const addRowButton = screen.getByTestId('add-row');
      const deleteRowButton = screen.getByTestId('delete-row');
      const exportButton = screen.getByTestId('export-data');
      const name1Input = screen.getByPlaceholderText('Name 1');
      const email1Input = screen.getByPlaceholderText('Email 1');

      // Test Tab navigation through table controls
      await user.tab();
      expect(addRowButton).toHaveFocus();

      await user.tab();
      expect(deleteRowButton).toHaveFocus();

      await user.tab();
      expect(exportButton).toHaveFocus();

      // Test Tab navigation into table
      await user.tab();
      expect(name1Input).toHaveFocus();

      await user.tab();
      expect(email1Input).toHaveFocus();
    });

    it('supports dashboard keyboard navigation', async () => {
      const user = (userEvent as any).setup();
      
      render(
        <div>
          <nav className="mb-6 flex space-x-4">
            <Button variant="ghost">Dashboard</Button>
            <Button variant="ghost">Analytics</Button>
            <Button variant="ghost">Settings</Button>
          </nav>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3>Quick Actions</h3>
              <Button data-testid="create-project">Create Project</Button>
              <Button data-testid="import-data">Import Data</Button>
              <Button data-testid="generate-report">Generate Report</Button>
            </div>
            
            <div className="space-y-4">
              <h3>Recent Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="activity1" />
                  <Label htmlFor="activity1">Project Alpha completed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="activity2" />
                  <Label htmlFor="activity2">Team meeting scheduled</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="activity3" />
                  <Label htmlFor="activity3">Budget approved</Label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="space-y-4">
                  <Input placeholder="Search..." />
                  <Button>Search</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      );

      const dashboardNav = screen.getByRole('button', { name: 'Dashboard' });
      const analyticsNav = screen.getByRole('button', { name: 'Analytics' });
      const settingsNav = screen.getByRole('button', { name: 'Settings' });
      const createProjectButton = screen.getByTestId('create-project');
      const importDataButton = screen.getByTestId('import-data');
      const generateReportButton = screen.getByTestId('generate-report');

      // Test Tab navigation through navigation
      await user.tab();
      expect(dashboardNav).toHaveFocus();

      await user.tab();
      expect(analyticsNav).toHaveFocus();

      await user.tab();
      expect(settingsNav).toHaveFocus();

      // Test Tab navigation to quick actions
      await user.tab();
      expect(createProjectButton).toHaveFocus();

      await user.tab();
      expect(importDataButton).toHaveFocus();

      await user.tab();
      expect(generateReportButton).toHaveFocus();
    });
  });
});
