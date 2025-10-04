# @aibos/ui

**Pure UI Component Library SDK**

A clean, modern React component library built with TypeScript and Tailwind CSS. Designed as an npm package for easy integration into any React project.

## Installation

```bash
npm install @aibos/ui
# or
pnpm add @aibos/ui
# or
yarn add @aibos/ui
```

## Usage

```tsx
import { Button, Card, Badge } from '@aibos/ui';

function MyComponent() {
  return (
    <Card className="p-6">
      <Badge variant="primary">Status</Badge>
      <Button variant="primary" size="lg">
        Click me
      </Button>
    </Card>
  );
}
```

## Styling

Import the CSS files in your main CSS file:

```css
@import '@aibos/ui/styles/globals.css';
@import '@aibos/ui/styles/utilities.css';
```

## Available Components

### Primitives
- Button
- Input
- Checkbox
- Radio
- Switch
- Badge
- Loading Spinner

### Components
- Card
- Modal
- Table
- Form
- Navigation
- Popover
- Select
- Tooltip
- Toast
- Tabs
- Accordion
- Breadcrumb
- Pagination

### Hooks
- useTheme
- useMediaQuery
- useToast
- useCorrelation

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Start development mode
pnpm dev
```

## License

MIT License - see LICENSE file for details.