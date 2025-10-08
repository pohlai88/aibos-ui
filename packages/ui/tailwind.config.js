/** @type {import('tailwindcss').Config} */

// Constants to avoid duplication
const FOREGROUND_COLOR = 'hsl(var(--foreground))';
const PRIMARY_COLOR = 'hsl(var(--primary))';
const MUTED_FOREGROUND_COLOR = 'hsl(var(--muted-foreground))';
const BORDER_COLOR = 'hsl(var(--border))';
const BACKGROUND_SECONDARY_COLOR = 'hsl(var(--background-secondary))';

module.exports = {
  darkMode: ['class'],
  // Ensure our utilities win against third-party CSS without overusing !important everywhere
  important: 'html',
  // Cleaner mobile behavior for hover utilities (Tailwind v3+)
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // Future packages (anti-drift for monorepo growth)
    '../../packages/**/*.{js,ts,jsx,tsx,mdx}',
    '../../apps/**/*.{js,ts,jsx,tsx,mdx}',
    // If shipping compiled UI as a package, include its dist so classes aren't purged
    'node_modules/@aibos/ui/dist/**/*.js',
    // Also include source when linked locally during development
    'node_modules/@aibos/ui/**/*.{js,ts,jsx,tsx}',
  ],
  // Prevent purge from dropping dynamic semantic/status classes
  safelist: [
    // text/bg/border/ring for semantic colors
    {
      pattern:
        /^(text|bg|border|ring|ring-offset|outline|fill|stroke)-(primary|secondary|muted|accent|success|warning|info|destructive|error)(?:-(50|100|200|300|400|500|600|700|800|900))?$/,
    },
    // status pills / states
    {
      pattern: /^(text|bg|border|ring)-(pending|processing|completed|cancelled)$/,
    },
    // foreground/background/card/popover variants often toggled via CMS/config
    {
      pattern: /^(text|bg|border|ring)-(foreground|background|card|popover)(?:-foreground)?$/,
    },
    // Our semantic plugin utilities (computed classnames at runtime)
    {
      pattern:
        /^(bg|text|border|ring|ring-offset|outline|fill|stroke)-semantic-(primary|secondary|success|warning|error|info|muted|accent|foreground|background|card|popover)(?:-foreground)?$/,
    },
    // Premium animation classes
    {
      pattern: /^animate-premium-(fade|slide|scale|bounce)$/,
    },
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Make typography plugin inherit our tokens (so prose matches app theme)
      typography: (_theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': FOREGROUND_COLOR,
            '--tw-prose-headings': FOREGROUND_COLOR,
            '--tw-prose-links': PRIMARY_COLOR,
            '--tw-prose-bold': FOREGROUND_COLOR,
            '--tw-prose-counters': MUTED_FOREGROUND_COLOR,
            '--tw-prose-bullets': MUTED_FOREGROUND_COLOR,
            '--tw-prose-hr': BORDER_COLOR,
            '--tw-prose-quotes': FOREGROUND_COLOR,
            '--tw-prose-quote-borders': BORDER_COLOR,
            '--tw-prose-captions': MUTED_FOREGROUND_COLOR,
            '--tw-prose-code': FOREGROUND_COLOR,
            '--tw-prose-pre-code': FOREGROUND_COLOR,
            '--tw-prose-pre-bg': BACKGROUND_SECONDARY_COLOR,
            '--tw-prose-th-borders': BORDER_COLOR,
            '--tw-prose-td-borders': BORDER_COLOR,
            color: FOREGROUND_COLOR,
            a: { color: PRIMARY_COLOR },
            h1: { color: FOREGROUND_COLOR },
            h2: { color: FOREGROUND_COLOR },
            h3: { color: FOREGROUND_COLOR },
            code: { color: FOREGROUND_COLOR },
          },
        },
        invert: {
          css: {
            '--tw-prose-body': FOREGROUND_COLOR,
            '--tw-prose-headings': FOREGROUND_COLOR,
            '--tw-prose-links': PRIMARY_COLOR,
            '--tw-prose-bold': FOREGROUND_COLOR,
            '--tw-prose-counters': MUTED_FOREGROUND_COLOR,
            '--tw-prose-bullets': MUTED_FOREGROUND_COLOR,
            '--tw-prose-hr': BORDER_COLOR,
            '--tw-prose-quotes': FOREGROUND_COLOR,
            '--tw-prose-quote-borders': BORDER_COLOR,
            '--tw-prose-captions': MUTED_FOREGROUND_COLOR,
            '--tw-prose-code': FOREGROUND_COLOR,
            '--tw-prose-pre-code': FOREGROUND_COLOR,
            '--tw-prose-pre-bg': BACKGROUND_SECONDARY_COLOR,
            '--tw-prose-th-borders': BORDER_COLOR,
            '--tw-prose-td-borders': BORDER_COLOR,
          },
        },
      }),
      colors: {
        /* Map Tailwind utilities to your AIBOS tokens */
        'semantic-background': 'hsl(var(--aibos-semantic-background))',
        'semantic-foreground': 'hsl(var(--aibos-semantic-foreground))',
        'semantic-card': 'hsl(var(--aibos-semantic-card))',
        'semantic-card-foreground': 'hsl(var(--aibos-semantic-card-foreground))',
        'semantic-popover': 'hsl(var(--aibos-semantic-popover))',
        'semantic-popover-foreground': 'hsl(var(--aibos-semantic-popover-foreground))',
        'semantic-border': 'hsl(var(--aibos-semantic-border))',
        'semantic-input': 'hsl(var(--aibos-semantic-input))',
        'semantic-ring': 'hsl(var(--aibos-semantic-ring))',
        'semantic-primary': 'hsl(var(--aibos-semantic-primary))',
        'semantic-primary-foreground': 'hsl(var(--aibos-semantic-primary-foreground))',
        'semantic-muted': 'hsl(var(--aibos-semantic-muted))',
        'semantic-muted-foreground': 'hsl(var(--aibos-semantic-muted-foreground))',
        'semantic-accent': 'hsl(var(--aibos-semantic-accent))',
        'semantic-accent-foreground': 'hsl(var(--aibos-semantic-accent-foreground))',
        'semantic-destructive': 'hsl(var(--aibos-semantic-destructive))',
        'semantic-destructive-foreground': 'hsl(var(--aibos-semantic-destructive-foreground))',

        // Premium neutral palette
        'neutral-0': 'hsl(var(--aibos-neutral-0))',
        'neutral-50': 'hsl(var(--aibos-neutral-50))',
        'neutral-100': 'hsl(var(--aibos-neutral-100))',
        'neutral-200': 'hsl(var(--aibos-neutral-200))',
        'neutral-300': 'hsl(var(--aibos-neutral-300))',
        'neutral-400': 'hsl(var(--aibos-neutral-400))',
        'neutral-500': 'hsl(var(--aibos-neutral-500))',
        'neutral-600': 'hsl(var(--aibos-neutral-600))',
        'neutral-700': 'hsl(var(--aibos-neutral-700))',
        'neutral-800': 'hsl(var(--aibos-neutral-800))',
        'neutral-900': 'hsl(var(--aibos-neutral-900))',

        // Brand colors
        'brand-400': 'hsl(var(--aibos-brand-400))',
        'brand-500': 'hsl(var(--aibos-brand-500))',
        'brand-600': 'hsl(var(--aibos-brand-600))',

        // Accent colors
        'accent-500': 'hsl(var(--aibos-accent-500))',

        // Legacy colors (kept for compatibility)
        background: {
          DEFAULT: 'hsl(var(--background))',
          secondary: 'hsl(var(--background-secondary))',
          tertiary: 'hsl(var(--background-tertiary))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          secondary: 'hsl(var(--foreground-secondary))',
          tertiary: 'hsl(var(--foreground-tertiary))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
          200: 'hsl(var(--primary-200))',
          300: 'hsl(var(--primary-300))',
          400: 'hsl(var(--primary-400))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
          700: 'hsl(var(--primary-700))',
          800: 'hsl(var(--primary-800))',
          900: 'hsl(var(--primary-900))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // ERP-specific colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        // Error color (referenced but missing)
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
        },
        // Status colors with proper definitions
        pending: {
          DEFAULT: 'hsl(var(--pending))',
          foreground: 'hsl(var(--pending-foreground))',
        },
        processing: {
          DEFAULT: 'hsl(var(--processing))',
          foreground: 'hsl(var(--processing-foreground))',
        },
        completed: {
          DEFAULT: 'hsl(var(--completed))',
          foreground: 'hsl(var(--completed-foreground))',
        },
        cancelled: {
          DEFAULT: 'hsl(var(--cancelled))',
          foreground: 'hsl(var(--cancelled-foreground))',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        /* Bind to CSS variables so theme switching is token-driven */
        'elev-1': 'var(--aibos-shadow-elev-1)',
        'elev-2': 'var(--aibos-shadow-elev-2)',
        'elev-3': 'var(--aibos-shadow-elev-3)',

        // Legacy shadows (kept for compatibility)
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        none: 'none',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Consolas', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        // Premium motion - Sophisticated, elegant animations
        'premium-fade': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'premium-slide': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'premium-scale': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'premium-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // Premium animations - Sophisticated, elegant motion
        'premium-fade': 'premium-fade 0.4s cubic-bezier(0.2, 0.7, 0.2, 1)',
        'premium-slide': 'premium-slide 0.3s cubic-bezier(0.2, 0.7, 0.2, 1)',
        'premium-scale': 'premium-scale 0.2s cubic-bezier(0.2, 0.7, 0.2, 1)',
        'premium-bounce': 'premium-bounce 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) infinite',
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      transitionTimingFunction: {
        // Premium easing curves - Sophisticated, elegant motion
        premium: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
        'premium-soft': 'cubic-bezier(0.2, 0.7, 0.2, 1)',
        'premium-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'premium-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      screens: {
        xs: '475px',
      },
      // Semantic positioning tokens to replace arbitrary values
      inset: {
        '1/2': '50%', // use left-1/2 top-1/2 instead of left-[50%]
      },
      translate: {
        '-1/2': '-50%', // use -translate-x-1/2 etc. instead of translate-x-[-50%]
        'toast-swipe-move': 'var(--radix-toast-swipe-move-x)',
        'toast-swipe-end': 'var(--radix-toast-swipe-end-x)',
      },
      maxHeight: {
        'screen-90': '90vh',
        'screen-95': '95vh', // replaces max-h-[95vh]
      },
      maxWidth: {
        'screen-90': '90vw',
        'screen-95': '95vw', // replaces max-w-[95vw]
        'xs-md': '420px', // replaces md:max-w-[420px]
      },
      zIndex: {
        overlay: '100', // replaces z-[100]
        toast: '110',
        modal: '120',
      },
      height: {
        'select-trigger': 'var(--radix-select-trigger-height)',
      },
      minWidth: {
        'select-trigger': 'var(--radix-select-trigger-width)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    require('./src/tailwind.plugins/radix-variants.js'), // first-class Radix state variants
    // Semantic utilities & helpful variants: bg/text/border/ring/ring-offset/from/via/to/outline/fill/stroke
    require('tailwindcss/plugin')(function ({ addUtilities, addVariant, e }) {
      const bases = [
        'primary',
        'secondary',
        'success',
        'warning',
        'error',
        'info',
        'muted',
        'accent',
        'foreground',
        'background',
        'card',
        'popover',
      ];
      const attrs = [
        'bg',
        'text',
        'border',
        'ring',
        'ring-offset',
        'from',
        'via',
        'to',
        'outline',
        'fill',
        'stroke',
      ];
      const utils = {};

       
      for (const b of bases) {
        for (const a of attrs) {
          // normal token (…-semantic-<base>) → uses --aibos-semantic-<base>
          const cls = `.${e(`${a}-semantic-${b}`)}`;
          const varName = `--aibos-semantic-${b}`;
          
          if (a === 'bg')
            utils[cls] = {
              '--tw-bg-opacity': '1',
              backgroundColor: `hsl(var(${varName}) / var(--tw-bg-opacity))`,
            };
          else if (a === 'text')
            utils[cls] = {
              '--tw-text-opacity': '1',
              color: `hsl(var(${varName}) / var(--tw-text-opacity))`,
            };
          else if (a === 'border')
            utils[cls] = {
              '--tw-border-opacity': '1',
              borderColor: `hsl(var(${varName}) / var(--tw-border-opacity))`,
            };
          else if (a === 'ring')
            utils[cls] = {
              '--tw-ring-opacity': '1',
              '--tw-ring-color': `hsl(var(${varName}) / var(--tw-ring-opacity))`,
            };
          else if (a === 'ring-offset')
            utils[cls] = {
              '--tw-ring-offset-opacity': '1',
              '--tw-ring-offset-color': `hsl(var(${varName}) / var(--tw-ring-offset-opacity))`,
            };
          else if (a === 'from')
            utils[cls] = {
              '--tw-gradient-from': `hsl(var(${varName}) / 1)`,
              '--tw-gradient-to': 'rgb(255 255 255 / 0)',
              '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
            };
          else if (a === 'via')
            utils[cls] = {
              '--tw-gradient-to': 'rgb(255 255 255 / 0)',
              '--tw-gradient-stops': `var(--tw-gradient-from), hsl(var(${varName}) / 1), var(--tw-gradient-to)`,
            };
          else if (a === 'to') utils[cls] = { '--tw-gradient-to': `hsl(var(${varName}) / 1)` };
          else if (a === 'outline')
            utils[cls] = {
              '--tw-outline-opacity': '1',
              outlineColor: `hsl(var(${varName}) / var(--tw-outline-opacity))`,
            };
          else if (a === 'fill')
            utils[cls] = {
              '--tw-fill-opacity': '1',
              fill: `hsl(var(${varName}) / var(--tw-fill-opacity))`,
            };
          else if (a === 'stroke')
            utils[cls] = {
              '--tw-stroke-opacity': '1',
              stroke: `hsl(var(${varName}) / var(--tw-stroke-opacity))`,
            };

          // foreground token (…-semantic-<base>-foreground) → uses --aibos-semantic-<base>-foreground
          const clsFg = `.${e(`${a}-semantic-${b}-foreground`)}`;
          const varNameFg = `--aibos-semantic-${b}-foreground`;
          if (a === 'bg')
            utils[clsFg] = {
              '--tw-bg-opacity': '1',
              backgroundColor: `hsl(var(${varNameFg}) / var(--tw-bg-opacity))`,
            };
          else if (a === 'text')
            utils[clsFg] = {
              '--tw-text-opacity': '1',
              color: `hsl(var(${varNameFg}) / var(--tw-text-opacity))`,
            };
          else if (a === 'border')
            utils[clsFg] = {
              '--tw-border-opacity': '1',
              borderColor: `hsl(var(${varNameFg}) / var(--tw-border-opacity))`,
            };
          else if (a === 'ring')
            utils[clsFg] = {
              '--tw-ring-opacity': '1',
              '--tw-ring-color': `hsl(var(${varNameFg}) / var(--tw-ring-opacity))`,
            };
          else if (a === 'ring-offset')
            utils[clsFg] = {
              '--tw-ring-offset-opacity': '1',
              '--tw-ring-offset-color': `hsl(var(${varNameFg}) / var(--tw-ring-offset-opacity))`,
            };
          else if (a === 'from')
            utils[clsFg] = {
              '--tw-gradient-from': `hsl(var(${varNameFg}) / 1)`,
              '--tw-gradient-to': 'rgb(255 255 255 / 0)',
              '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
            };
          else if (a === 'via')
            utils[clsFg] = {
              '--tw-gradient-to': 'rgb(255 255 255 / 0)',
              '--tw-gradient-stops': `var(--tw-gradient-from), hsl(var(${varNameFg}) / 1), var(--tw-gradient-to)`,
            };
          else if (a === 'to')
            utils[clsFg] = { '--tw-gradient-to': `hsl(var(${varNameFg}) / 1)` };
          else if (a === 'outline')
            utils[clsFg] = {
              '--tw-outline-opacity': '1',
              outlineColor: `hsl(var(${varNameFg}) / var(--tw-outline-opacity))`,
            };
          else if (a === 'fill')
            utils[clsFg] = {
              '--tw-fill-opacity': '1',
              fill: `hsl(var(${varNameFg}) / var(--tw-fill-opacity))`,
            };
          else if (a === 'stroke')
            utils[clsFg] = {
              '--tw-stroke-opacity': '1',
              stroke: `hsl(var(${varNameFg}) / var(--tw-stroke-opacity))`,
            };
        }
      }

      // Tailwind v3+ automatically supports variant modifiers (hover:, focus:, etc.)
      addUtilities(utils);

      // Helpful variants
      addVariant('hocus', ['&:hover', '&:focus-visible']); // e.g., hocus:bg-semantic-primary
      addVariant('data-open', '&[data-open="true"]'); // e.g., data-open:bg-semantic-accent
      addVariant('data-active', '&[data-active="true"]');
      addVariant('aria-expanded', '&[aria-expanded="true"]');
      addVariant('aria-invalid', '&[aria-invalid="true"]');
      addVariant('data-disabled', '&[data-disabled="true"]');
      addVariant('data-highlighted', '&[data-highlighted="true"]');
      // Widely-used state hooks in headless libs
      addVariant('aria-selected', '&[aria-selected="true"]');
      addVariant('data-state-open', '&[data-state="open"]');
      addVariant('data-state-closed', '&[data-state="closed"]');
      addVariant('data-state-checked', '&[data-state="checked"]');
      addVariant('data-state-unchecked', '&[data-state="unchecked"]');
      // Group/peer helpers for Radix-style states
      addVariant('group-data-open', ':merge(.group)[data-state="open"] &');
      addVariant('group-aria-expanded', ':merge(.group)[aria-expanded="true"] &');
      addVariant('peer-data-open', ':merge(.peer)[data-state="open"] ~ &');
    }),
  ],
};
