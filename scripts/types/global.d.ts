/// <reference lib="esnext" />
/// <reference types="node" />

// Node.js globals for scripts
declare const process: typeof globalThis.process;
declare const console: typeof globalThis.console;
declare const require: typeof globalThis.require;
declare const module: typeof globalThis.module;
declare const exports: typeof globalThis.exports;
declare const __dirname: string;
declare const __filename: string;
