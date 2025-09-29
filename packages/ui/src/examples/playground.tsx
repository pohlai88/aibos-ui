import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@components/card';
import { Modal } from '@components/modal';
import { CloseIcon, CheckIcon } from '@icons/internal';
import { Badge } from '@primitives/badge';
import { Button } from '@primitives/button';
import { Checkbox } from '@primitives/checkbox';
import { Input } from '@primitives/input';
import { Switch } from '@primitives/switch';
import React, { useState } from 'react';

// Header Component
const PlaygroundHeader = () => (
  <header className="border-semantic-border bg-semantic-background/95 border-b backdrop-blur">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-semantic-foreground text-2xl font-bold">AIBOS UI Design System</h1>
          <p className="text-semantic-muted-foreground text-sm">
            Enterprise Production Ready Components
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary">v0.1.0</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              document.documentElement.classList.toggle('dark');
            }}
          >
            Toggle Theme
          </Button>
        </div>
      </div>
    </div>
  </header>
);

// Introduction Section
const IntroductionSection = () => (
  <section className="space-y-4 text-center">
    <h2 className="text-semantic-foreground text-4xl font-bold">
      Interactive Component Playground
    </h2>
    <p className="text-semantic-muted-foreground mx-auto max-w-2xl text-lg">
      Explore our comprehensive collection of enterprise-grade UI components. Each component is
      built with accessibility, performance, and maintainability in mind.
    </p>
  </section>
);

// Button Variants Component
const ButtonVariants = () => (
  <div>
    <h4 className="text-semantic-foreground mb-3 text-sm font-medium">Variants</h4>
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  </div>
);

// Button Sizes Component
const ButtonSizes = () => (
  <div>
    <h4 className="text-semantic-foreground mb-3 text-sm font-medium">Sizes</h4>
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <CheckIcon className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

// Button States Component
const ButtonStates = () => (
  <div>
    <h4 className="text-semantic-foreground mb-3 text-sm font-medium">States</h4>
    <div className="flex items-center gap-3">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>
        Disabled Outline
      </Button>
    </div>
  </div>
);

// Buttons Section
const ButtonsSection = () => (
  <section className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-semantic-foreground text-2xl font-semibold">Buttons</h3>
      <Badge variant="outline">Primitive</Badge>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Button Variants</CardTitle>
        <CardDescription>
          Different button styles for various use cases and contexts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ButtonVariants />
        <ButtonSizes />
        <ButtonStates />
      </CardContent>
    </Card>
  </section>
);

// Input Fields Component
const InputFields = () => (
  <Card>
    <CardHeader>
      <CardTitle>Input Fields</CardTitle>
      <CardDescription>Text input components with various types and states</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <label className="text-semantic-foreground mb-2 block text-sm font-medium">
          Text Input
        </label>
        <Input placeholder="Enter your name" />
      </div>

      <div>
        <label className="text-semantic-foreground mb-2 block text-sm font-medium">
          Email Input
        </label>
        <Input type="email" placeholder="Enter your email" />
      </div>

      <div>
        <label className="text-semantic-foreground mb-2 block text-sm font-medium">
          Password Input
        </label>
        <Input type="password" placeholder="Enter your password" />
      </div>

      <div>
        <label className="text-semantic-foreground mb-2 block text-sm font-medium">
          Disabled Input
        </label>
        <Input placeholder="Disabled input" disabled />
      </div>
    </CardContent>
  </Card>
);

// Interactive Controls Component
const InteractiveControls = () => (
  <Card>
    <CardHeader>
      <CardTitle>Interactive Controls</CardTitle>
      <CardDescription>Checkboxes, switches, and other interactive elements</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-semantic-foreground text-sm font-medium">Checkboxes</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="checkbox1" />
            <label htmlFor="checkbox1" className="text-semantic-foreground text-sm">
              Option 1
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="checkbox2" defaultChecked />
            <label htmlFor="checkbox2" className="text-semantic-foreground text-sm">
              Option 2 (checked)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="checkbox3" disabled />
            <label
              htmlFor="checkbox3"
              className="text-semantic-foreground text-muted-foreground text-sm"
            >
              Option 3 (disabled)
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-semantic-foreground text-sm font-medium">Switches</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch id="switch1" />
            <label htmlFor="switch1" className="text-semantic-foreground text-sm">
              Enable notifications
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="switch2" defaultChecked />
            <label htmlFor="switch2" className="text-semantic-foreground text-sm">
              Auto-save enabled
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="switch3" disabled />
            <label
              htmlFor="switch3"
              className="text-semantic-foreground text-muted-foreground text-sm"
            >
              Disabled switch
            </label>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Form Controls Section
const FormControlsSection = () => (
  <section className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-semantic-foreground text-2xl font-semibold">Form Controls</h3>
      <Badge variant="outline">Primitive</Badge>
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <InputFields />
      <InteractiveControls />
    </div>
  </section>
);

// Contact Form Component
const ContactForm = ({
  formData,
  setFormData,
  handleFormSubmit,
}: {
  formData: {
    name: string;
    email: string;
    notifications: boolean;
    terms: boolean;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      notifications: boolean;
      terms: boolean;
    }>
  >;
  handleFormSubmit: (e: React.FormEvent) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Contact Form</CardTitle>
      <CardDescription>A complete form example with validation and submission</CardDescription>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="text-semantic-foreground mb-2 block text-sm font-medium">
            Full Name
          </label>
          <Input
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-semantic-foreground mb-2 block text-sm font-medium">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifications"
              checked={formData.notifications}
              onCheckedChange={(checked: boolean) =>
                setFormData({ ...formData, notifications: checked })
              }
            />
            <label htmlFor="notifications" className="text-semantic-foreground text-sm">
              Send me notifications
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={formData.terms}
              onCheckedChange={(checked: boolean) => setFormData({ ...formData, terms: checked })}
              required
            />
            <label htmlFor="terms" className="text-semantic-foreground text-sm">
              I agree to the terms and conditions
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full">
          Submit Form
        </Button>
      </form>
    </CardContent>
  </Card>
);

// Modal Example Component
const ModalExample = ({ setIsModalOpen }: { setIsModalOpen: (open: boolean) => void }) => (
  <Card>
    <CardHeader>
      <CardTitle>Modal Dialog</CardTitle>
      <CardDescription>Modal component with overlay and close functionality</CardDescription>
    </CardHeader>
    <CardContent>
      <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
    </CardContent>
  </Card>
);

// Interactive Examples Section
const InteractiveExamplesSection = ({
  formData,
  setFormData,
  handleFormSubmit,
  setIsModalOpen,
}: {
  formData: {
    name: string;
    email: string;
    notifications: boolean;
    terms: boolean;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      notifications: boolean;
      terms: boolean;
    }>
  >;
  handleFormSubmit: (e: React.FormEvent) => void;
  setIsModalOpen: (open: boolean) => void;
}) => (
  <section className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-semantic-foreground text-2xl font-semibold">Interactive Examples</h3>
      <Badge variant="outline">Component</Badge>
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ContactForm
        formData={formData}
        setFormData={setFormData}
        handleFormSubmit={handleFormSubmit}
      />
      <ModalExample setIsModalOpen={setIsModalOpen} />
    </div>
  </section>
);

export default function ExamplesPlayground(): React.ReactElement {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notifications: false,
    terms: false,
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Form submitted successfully!');
  };

  return (
    <div className="bg-semantic-background min-h-screen">
      <PlaygroundHeader />

      <main className="container mx-auto px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-12">
          <IntroductionSection />
          <ButtonsSection />
          <FormControlsSection />
          <InteractiveExamplesSection
            formData={formData}
            setFormData={setFormData}
            handleFormSubmit={handleFormSubmit}
            setIsModalOpen={setIsModalOpen}
          />
        </div>
      </main>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="bg-semantic-background border-semantic-border rounded-lg border p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-semantic-foreground text-lg font-semibold">Example Modal</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              <CloseIcon className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-semantic-muted-foreground mb-4">
            This is an example modal dialog. You can close it by clicking the X button or clicking
            outside the modal.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
