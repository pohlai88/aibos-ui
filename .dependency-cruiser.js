export default {
  forbidden: [
    // ===== EXISTING RULES =====

    // Forbid dependencies from packages to apps
    {
      name: 'no-packages-to-apps',
      severity: 'error',
      from: {
        path: '^packages',
      },
      to: {
        path: '^apps',
      },
    },

    // Forbid dependencies from packages to services
    {
      name: 'no-packages-to-services',
      severity: 'error',
      from: {
        path: '^packages',
      },
      to: {
        path: '^services',
      },
    },

    // Forbid dependencies from services to apps (services are headless)
    {
      name: 'no-services-to-apps',
      severity: 'error',
      from: {
        path: '^services',
      },
      to: {
        path: '^apps',
      },
    },

    // ===== UI ECOSYSTEM RULES =====

    // UI Primitives should not import business packages
    {
      name: 'ui-primitives-no-business-imports',
      severity: 'error',
      from: {
        path: '^packages/ui/src',
      },
      to: {
        path: '^packages/(ui-business|accounting-contracts|accounting-web)',
      },
      comment:
        'UI primitives must not import business packages - they should be pure UI components only',
    },

    // Apps should not import UI primitives directly
    {
      name: 'apps-no-direct-ui-imports',
      severity: 'error',
      from: {
        path: '^apps',
      },
      to: {
        path: '^packages/ui/src/(primitives|components|hooks)',
      },
      comment: 'Apps must import from @aibos/ui-business, not directly from UI primitives',
    },

    // UI-Business should not import from other business packages
    {
      name: 'ui-business-no-cross-business-imports',
      severity: 'error',
      from: {
        path: '^packages/ui-business/src',
      },
      to: {
        path: '^packages/(accounting-web|accounting-contracts|accounting|eventsourcing|observability|policy)',
        pathNot: '^packages/accounting-contracts/src/types',
      },
      comment: 'UI-Business should only import domain contracts, not other business packages',
    },

    // Accounting-Web should not import from domain packages
    {
      name: 'accounting-web-no-domain-imports',
      severity: 'error',
      from: {
        path: '^packages/accounting-web/src',
      },
      to: {
        path: '^packages/(accounting|eventsourcing|observability|policy)',
      },
      comment: 'Accounting-Web should only import UI primitives and contracts, not domain packages',
    },

    // Domain packages should not import UI packages
    {
      name: 'domain-no-ui-imports',
      severity: 'error',
      from: {
        path: '^packages/(accounting|eventsourcing|policy)/src',
      },
      to: {
        path: '^packages/(ui|ui-business|accounting-web)/src',
      },
      comment: 'Domain packages should not import UI packages',
    },

    // Forbid deep imports into package internals from outside packages
    {
      name: 'no-deep-imports-into-packages',
      severity: 'error',
      from: { path: '^(apps|services)/' },
      to: { path: '^packages/[^/]+/(src|internal)/' },
      comment: 'Consumers must import package public API (package root / index.ts)',
    },

    // Apps may depend on services ONLY through the public entry (index.ts) – no internals
    {
      name: 'apps-only-to-services-public-api',
      severity: 'error',
      from: { path: '^apps/' },
      to: {
        path: '^services/[^/]+/(?!index\\.(ts|js)$).*', // anything that is not the service root entry
        pathNot: '^services/[^/]+/index\\.(ts|js)$',
      },
      comment: 'Apps must import services via their public entry point only',
    },

    // Forbid circular dependencies
    {
      name: 'no-circular',
      severity: 'error',
      from: { pathNot: '(^|/)entities(/|$)' },
      to: {
        circular: true,
      },
      comment: 'Circular dependencies are not allowed except in entity relationships',
    },

    // Forbid orphaned modules
    {
      name: 'no-orphans',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: '.*\\.(config|d)\\.(ts|js)$',
      },
      to: {},
      comment: 'Orphaned files are allowed in build outputs and configuration files',
    },

    // Disallow unresolved imports (typos, missing alias config, etc.)
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: {
        couldNotResolve: true,
      },
    },

    // Prevent declaring the same package in multiple dep types (e.g., dep + peerDep)
    {
      name: 'no-duplicate-dep-types',
      severity: 'error',
      from: {},
      to: { moreThanOneDependencyType: true },
    },

    // Forbid dependencies to deprecated modules
    {
      name: 'no-deprecated-core',
      severity: 'error',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$',
      },
    },
  ],
  options: {
    // TS/alias aware resolution (adjust path if your tsconfig lives elsewhere)
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    doNotFollow: {
      path: '(^|/)node_modules($|/)|(^|/)(dist|build|.next)($|/)',
    },
    exclude: {
      path:
        '(^|/)(node_modules|dist|build|coverage|.next|storybook-static)($|/)|' +
        '\\.(test|spec|stories)\\.(ts|tsx|js|jsx)$|(__mocks__|__fixtures__)',
    },

    // Enhanced options for UI ecosystem validation
    enhancedResolveOptions: {
      // Enable better module resolution for UI packages
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      mainFields: ['module', 'main'],
    },

    // Custom reporters for UI ecosystem violations
    reporterOptions: {
      dot: {
        collapsePattern: '^packages/ui/src/(primitives|components|hooks|utils)/',
        theme: {
          graph: {
            splines: 'ortho',
          },
          modules: [
            {
              criteria: { matchesFocus: true },
              attributes: { fillcolor: 'lime' },
            },
            {
              criteria: { source: '^packages/ui/src' },
              attributes: { fillcolor: 'lightblue' },
            },
            {
              criteria: { source: '^packages/ui-business/src' },
              attributes: { fillcolor: 'lightgreen' },
            },
            {
              criteria: { source: '^apps' },
              attributes: { fillcolor: 'lightyellow' },
            },
          ],
        },
      },
    },
  },
};
