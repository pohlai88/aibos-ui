/**
 * AXE Smoke Suite
 * - Runs quick accessibility checks against key primitives.
 * - We disable color-contrast here (covered by a dedicated, stable contrast suite).
 */
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { renderWithA11yShell } from './a11y-shell.util';

// Extend expect with jest-axe matcher
expect.extend(toHaveNoViolations);

// Import a minimal set; add more as needed
import { Button } from '@primitives/button';
import { Input } from '@primitives/input';
import { Checkbox } from '@primitives/checkbox';
import { RadioGroup, RadioGroupItem } from '@primitives/radio';
import { Switch } from '@primitives/switch';
import { Select, SelectItem } from '@components/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/accordion';

const axeOptions = {
  rules: {
    // Covered by our contrast suite; turn off for speed & determinism
    'color-contrast': { enabled: false },
  },
};

describe('AXE smoke tests (no color-contrast here)', () => {
  it('Button has no obvious axe violations', async () => {
    const { container } = renderWithA11yShell(<Button aria-label="save">Save</Button>);
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it('Form controls have no obvious axe violations', async () => {
    const { container } = renderWithA11yShell(
      <form aria-label="demo">
        <Input aria-label="Email" />
        <Checkbox aria-label="Accept terms" />
        {/* Use fieldset/legend or aria-labelledby so the group has a name */}
        <fieldset>
          <legend id="size-legend">Size</legend>
          <RadioGroup aria-labelledby="size-legend" defaultValue="m">
            <RadioGroupItem value="s" aria-label="Small" />
            <RadioGroupItem value="m" aria-label="Medium" />
            <RadioGroupItem value="l" aria-label="Large" />
          </RadioGroup>
        </fieldset>
        <Switch aria-label="Enable feature" />
      </form>
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it('Tabs & Accordion have no obvious axe violations', async () => {
    const { container } = renderWithA11yShell(
      <>
        <Tabs defaultValue="a" aria-label="example tabs">
          <TabsList>
            <TabsTrigger value="a">A</TabsTrigger>
            <TabsTrigger value="b">B</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Panel A</TabsContent>
          <TabsContent value="b">Panel B</TabsContent>
        </Tabs>
        <Accordion type="single" collapsible>
          <AccordionItem value="x">
            <AccordionTrigger>Section X</AccordionTrigger>
            <AccordionContent>Content X</AccordionContent>
          </AccordionItem>
        </Accordion>
      </>
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it('Select (combobox) has no obvious axe violations', async () => {
    const { container } = renderWithA11yShell(
      <div>
        <label id="pet-label">Pet</label>
        <Select aria-labelledby="pet-label">
          <SelectItem value="cat">Cat</SelectItem>
          <SelectItem value="dog">Dog</SelectItem>
        </Select>
      </div>
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it('Dark theme: Button no violations in tokenized shell', async () => {
    const { container } = renderWithA11yShell(<Button aria-label="save">Save</Button>, { theme: 'dark' });
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });
});
