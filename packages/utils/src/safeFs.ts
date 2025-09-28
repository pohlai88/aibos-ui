/// <reference types="node" />
import path from 'node:path';
import fs from 'node:fs';

/**
 * Safely joins paths while preventing directory traversal attacks.
 *
 * @param root - The root directory path
 * @param segments - Additional path segments to join
 * @returns The resolved path if it's within the root directory
 * @throws Error if path traversal is detected
 *
 * @example
 * ```typescript
 * // Safe usage
 * const filePath = safeJoin('/app/uploads', 'user123', 'document.pdf');
 * // Returns: '/app/uploads/user123/document.pdf'
 *
 * // Throws error for traversal attempts
 * safeJoin('/app/uploads', '../../../etc/passwd');
 * // Throws: "Path traversal detected"
 * ```
 */
export function safeJoin(root: string, ...segments: string[]): string {
  const base = path.resolve(root);
  const target = path.resolve(base, ...segments);

  // Check if the target path is within the base directory
  if (target === base || target.startsWith(base + path.sep)) {
    return target;
  }

  throw new Error(`Path traversal detected: attempted to access ${target} outside of ${base}`);
}

/**
 * Safely resolves a path relative to a root directory.
 *
 * @param root - The root directory path
 * @param relativePath - The relative path to resolve
 * @returns The resolved path if it's within the root directory
 * @throws Error if path traversal is detected
 */
export function safeResolve(root: string, relativePath: string): string {
  return safeJoin(root, relativePath);
}

/**
 * Validates that a path is safe (within the allowed root).
 *
 * @param root - The root directory path
 * @param targetPath - The path to validate
 * @returns true if the path is safe, false otherwise
 */
export function isPathSafe(root: string, targetPath: string): boolean {
  try {
    safeJoin(root, targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely validates and resolves a path with additional constraints
 * Used by build scripts to ensure file operations are secure
 */
export function safePath(
  root: string,
  relativePath: string,
  options: {
    mustExist?: boolean;
    allowedExtensions?: string[];
    allowDirectories?: boolean;
  } = {},
): string {
  const { mustExist = false, allowedExtensions, allowDirectories = true } = options;

  // Use existing safeJoin for path validation
  const absolutePath = safeJoin(root, relativePath);

  // Check file extension if specified
  if (allowedExtensions && !allowDirectories) {
    const extension = path.extname(absolutePath);
    if (!allowedExtensions.includes(extension)) {
      throw new Error(
        `Disallowed file type: ${extension}. Allowed: ${allowedExtensions.join(', ')}`,
      );
    }
  }

  // Check existence if required
  if (mustExist && !fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  return absolutePath;
}

/**
 * Safely read a file with path validation
 */
export function readFileSafe(
  root: string,
  filePath: string,
  options: {
    encoding?: 'utf8' | 'utf16le' | 'latin1' | 'base64' | 'hex' | 'ascii' | 'binary';
    allowedExtensions?: string[];
  } = {},
): string {
  const { encoding = 'utf8', allowedExtensions } = options;
  const validatedPath = safePath(root, filePath, {
    mustExist: true,
    allowedExtensions: allowedExtensions ?? [],
    allowDirectories: false,
  });

  return fs.readFileSync(validatedPath, encoding);
}

/**
 * Safely write a file with path validation and directory creation
 */
export function writeFileSafe(
  root: string,
  filePath: string,
  data: string,
  options: {
    encoding?: 'utf8' | 'utf16le' | 'latin1' | 'base64' | 'hex' | 'ascii' | 'binary';
    createDirectories?: boolean;
  } = {},
): void {
  const { encoding = 'utf8', createDirectories = true } = options;
  const validatedPath = safePath(root, filePath, { allowDirectories: false });

  if (createDirectories) {
    const dir = path.dirname(validatedPath);
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(validatedPath, data, encoding);
}

/**
 * Safely read directory contents with path validation
 */
export function readDirectorySafe(
  root: string,
  dirPath: string,
  options: {
    withFileTypes?: boolean;
    recursive?: boolean;
  } = {},
): string[] | fs.Dirent[] {
  const { withFileTypes = false, recursive = false } = options;
  const validatedPath = safePath(root, dirPath, { allowDirectories: true });

  if (!fs.existsSync(validatedPath)) {
    return [];
  }

  try {
    const entries = fs.readdirSync(validatedPath, { withFileTypes: withFileTypes as true });

    if (!recursive || !withFileTypes) {
      return entries;
    }

    // Recursively collect all files
    const allFiles: fs.Dirent[] = [];
    for (const entry of entries as fs.Dirent[]) {
      if (entry.isDirectory()) {
        const subPath = path.join(validatedPath, entry.name);
        const subFiles = readDirectorySafe(root, subPath, {
          withFileTypes: true,
          recursive: true,
        }) as fs.Dirent[];
        allFiles.push(...subFiles);
      } else {
        allFiles.push(entry);
      }
    }

    return allFiles;
  } catch {
    return [];
  }
}

/**
 * Safely check if a file exists
 */
export function existsSafe(root: string, filePath: string): boolean {
  try {
    const validatedPath = safePath(root, filePath, { allowDirectories: true });
    return fs.existsSync(validatedPath);
  } catch {
    return false;
  }
}

/**
 * Safely get file statistics
 */
export function statSafe(root: string, filePath: string): fs.Stats | undefined {
  try {
    const validatedPath = safePath(root, filePath, { allowDirectories: true });
    return fs.statSync(validatedPath);
  } catch {
    return undefined;
  }
}

/**
 * Common file extensions for different types
 */
export const EXTENSIONS = {
  TYPESCRIPT: ['.ts', '.tsx'],
  JAVASCRIPT: ['.js', '.jsx', '.mjs', '.cjs'],
  JSON: ['.json'],
  MARKDOWN: ['.md', '.mdx'],
  STYLES: ['.css', '.scss', '.sass', '.less'],
  ALL_SOURCE: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
} as const;
