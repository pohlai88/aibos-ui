import { z } from 'zod';
import { safeSet, isSafeKey } from './safe-object';

/**
 * Argument validation schemas for CLI scripts
 * Provides type-safe argument parsing with validation
 */

/**
 * Base schema for common CLI arguments
 */
const BaseArguments = z.object({
  help: z.boolean().optional().default(false),
  verbose: z.boolean().optional().default(false),
});

/**
 * Schema for analyze-bundle script
 */
export const AnalyzeBundleArgs = BaseArguments.extend({
  input: z.string().min(1, 'Input path is required'),
  output: z.string().optional(),
  format: z.enum(['json', 'html', 'text']).optional().default('text'),
  includeStats: z.boolean().optional().default(true),
});

/**
 * Schema for convert-to-aliases script
 */
export const ConvertAliasesArgs = BaseArguments.extend({
  input: z.string().min(1, 'Input directory is required'),
  output: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
  backup: z.boolean().optional().default(true),
});

/**
 * Schema for fix-double-paths script
 */
export const FixDoublePathsArgs = BaseArguments.extend({
  input: z.string().min(1, 'Input directory is required'),
  output: z.string().optional(),
  pattern: z.string().optional().default('**/*.{ts,tsx,js,jsx}'),
});

/**
 * Schema for scan-components script
 */
export const ScanComponentsArgs = BaseArguments.extend({
  input: z.string().min(1, 'Input directory is required'),
  output: z.string().optional(),
  extensions: z.array(z.string()).optional().default(['.tsx', '.ts']),
  exclude: z.array(z.string()).optional().default([]),
});

/**
 * Schema for validate-usage-map script
 */
export const ValidateUsageMapArgs = BaseArguments.extend({
  input: z.string().min(1, 'Input file is required'),
  output: z.string().optional(),
  strict: z.boolean().optional().default(false),
});

/**
 * Parse command line arguments with validation
 */
export function parseArgs<T extends z.ZodTypeAny>(
  schema: T,
  args: string[] = process.argv.slice(2),
): z.infer<T> {
  try {
    // Convert args array to object
    const argumentObject: Record<string, unknown> = {};

    for (let index = 0; index < args.length; index++) {
      const argument = args[index];
      if (!argument) continue;

      if (argument.startsWith('--')) {
        const key = argument.slice(2);
        const nextArgument = args[index + 1];

        // Validate key is safe before using it
        if (!isSafeKey(key)) {
          throw new Error(`Invalid argument key: ${key}`);
        }

        // Handle boolean flags
        if (nextArgument === undefined || nextArgument.startsWith('-')) {
          safeSet(argumentObject, key, true);
        } else {
          // Handle key-value pairs
          safeSet(argumentObject, key, nextArgument);
          index++; // Skip next argument as it's the value
        }
      } else if (argument.startsWith('-')) {
        // Handle short flags
        const key = argument.slice(1);
        if (!isSafeKey(key)) {
          throw new Error(`Invalid argument key: ${key}`);
        }
        safeSet(argumentObject, key, true);
      } else {
        // Handle positional arguments
        if (!argumentObject.input) {
          safeSet(argumentObject, 'input', argument);
        } else if (!argumentObject.output) {
          safeSet(argumentObject, 'output', argument);
        }
      }
    }

    return schema.parse(argumentObject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid arguments:');
      error.errors.forEach((err: z.ZodIssue) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nUsage examples:');
      console.error('  pnpm run analyze-bundle -- --input src --output report.json');
      console.error('  pnpm run scan-components -- --input src/components --verbose');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Display help information for a script
 */
export function showHelp(scriptName: string, description: string, examples: string[] = []): void {
  console.log(`\n📖 ${scriptName}`);
  console.log(`   ${description}\n`);

  if (examples.length > 0) {
    console.log('Examples:');
    examples.forEach((example) => {
      console.log(`   ${example}`);
    });
    console.log();
  }
}

/**
 * Common argument patterns
 */
export const COMMON_PATTERNS = {
  INPUT_OUTPUT: {
    input: 'Input file or directory path',
    output: 'Output file path (optional)',
  },
  VERBOSE_HELP: {
    verbose: 'Enable verbose output',
    help: 'Show this help message',
  },
} as const;
