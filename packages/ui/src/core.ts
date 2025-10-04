/**
 * AIBOS UI Core - Minimal Bundle
 *
 * Essential components only for maximum tree shaking.
 * Heavy components are excluded to meet 50KB bundle limit.
 */

// Essential utilities
export { cn, cx, makeCn } from './utils/cn.utility';
export { variants, type VariantProps } from './utils/variants.utility';

// Core primitives only
export { Button, buttonVariants } from './primitives/button';
export { Input } from './primitives/input';
export { Badge, badgeVariants } from './primitives/badge';

// Essential components only
export { Card } from './components/card';

// Essential icons only
export { CloseIcon, CheckIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

// Essential design tokens
export { colors } from './tokens/colors';
export { spacing } from './tokens/spacing';

// Essential hooks
export { useTheme } from './hooks/use-theme';
export { useMediaQuery } from './hooks/use-media-query';
