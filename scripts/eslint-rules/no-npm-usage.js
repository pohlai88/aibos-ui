/**
 * ESLint Rule: Block NPM Usage
 *
 * This rule prevents npm usage in the monorepo to ensure
 * consistent package management with pnpm.
 */

export default {
  rules: {
    'no-npm-usage': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow npm usage in favor of pnpm',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          noNpmUsage:
            'Use pnpm instead of npm. This monorepo requires pnpm for consistent package management.',
          noNpmScripts: 'Use pnpm scripts instead of npm scripts.',
          noNpmInstall: 'Use "pnpm install" instead of "npm install".',
          noNpmRun: 'Use "pnpm run" instead of "npm run".',
          noNpmAdd: 'Use "pnpm add" instead of "npm add".',
          noNpmRemove: 'Use "pnpm remove" instead of "npm remove".',
          noNpmUpdate: 'Use "pnpm update" instead of "npm update".',
          noNpmPublish: 'Use "pnpm publish" instead of "npm publish".',
        },
      },

      create(context) {
        return {
          // Check for npm usage in string literals
          Literal(node) {
            if (typeof node.value === 'string') {
              const value = node.value;

              // Check for npm commands (but not pnpm)
              if (value.includes('npm ') && !value.includes('pnpm')) {
                if (value.includes('npm install')) {
                  context.report({
                    node,
                    messageId: 'noNpmInstall',
                  });
                } else if (value.includes('npm run')) {
                  context.report({
                    node,
                    messageId: 'noNpmRun',
                  });
                } else if (value.includes('npm add')) {
                  context.report({
                    node,
                    messageId: 'noNpmAdd',
                  });
                } else if (value.includes('npm remove')) {
                  context.report({
                    node,
                    messageId: 'noNpmRemove',
                  });
                } else if (value.includes('npm update')) {
                  context.report({
                    node,
                    messageId: 'noNpmUpdate',
                  });
                } else if (value.includes('npm publish')) {
                  context.report({
                    node,
                    messageId: 'noNpmPublish',
                  });
                } else {
                  context.report({
                    node,
                    messageId: 'noNpmUsage',
                  });
                }
              }
            }
          },

          // Check for npm usage in template literals
          TemplateLiteral(node) {
            const text = node.quasis.map((q) => q.value.raw).join('');
            if (text.includes('npm ') && !text.includes('pnpm')) {
              context.report({
                node,
                messageId: 'noNpmUsage',
              });
            }
          },

          // Check for npm usage in comments
          Program(node) {
            const sourceCode = context.getSourceCode();
            const comments = sourceCode.getAllComments();

            comments.forEach((comment) => {
              if (comment.value.includes('npm ') && !comment.value.includes('pnpm')) {
                context.report({
                  node: comment,
                  messageId: 'noNpmUsage',
                });
              }
            });
          },
        };
      },
    },
    'no-npm-scripts': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow npm scripts usage',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          noNpmScripts: 'Use pnpm scripts instead of npm scripts.',
        },
      },
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              node.value.includes('npm run') &&
              !node.value.includes('pnpm')
            ) {
              context.report({
                node,
                messageId: 'noNpmScripts',
              });
            }
          },
        };
      },
    },
    'no-npm-install': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow npm install usage',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          noNpmInstall: 'Use "pnpm install" instead of "npm install".',
        },
      },
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              node.value.includes('npm install') &&
              !node.value.includes('pnpm')
            ) {
              context.report({
                node,
                messageId: 'noNpmInstall',
              });
            }
          },
        };
      },
    },
    'no-npm-run': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow npm run usage',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          noNpmRun: 'Use "pnpm run" instead of "npm run".',
        },
      },
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              node.value.includes('npm run') &&
              !node.value.includes('pnpm')
            ) {
              context.report({
                node,
                messageId: 'noNpmRun',
              });
            }
          },
        };
      },
    },
    'no-npm-add': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow npm add usage',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          noNpmAdd: 'Use "pnpm add" instead of "npm add".',
        },
      },
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              node.value.includes('npm add') &&
              !node.value.includes('pnpm')
            ) {
              context.report({
                node,
                messageId: 'noNpmAdd',
              });
            }
          },
        };
      },
    },
    'no-npm-remove': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow npm remove usage',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          noNpmRemove: 'Use "pnpm remove" instead of "npm remove".',
        },
      },
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              node.value.includes('npm remove') &&
              !node.value.includes('pnpm')
            ) {
              context.report({
                node,
                messageId: 'noNpmRemove',
              });
            }
          },
        };
      },
    },
    'no-npm-update': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow npm update usage',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          noNpmUpdate: 'Use "pnpm update" instead of "npm update".',
        },
      },
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              node.value.includes('npm update') &&
              !node.value.includes('pnpm')
            ) {
              context.report({
                node,
                messageId: 'noNpmUpdate',
              });
            }
          },
        };
      },
    },
    'no-npm-publish': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow npm publish usage',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          noNpmPublish: 'Use "pnpm publish" instead of "npm publish".',
        },
      },
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              node.value.includes('npm publish') &&
              !node.value.includes('pnpm')
            ) {
              context.report({
                node,
                messageId: 'noNpmPublish',
              });
            }
          },
        };
      },
    },
  },
};
