/**
 * Type declarations for @testing-library/user-event
 * Fixes TypeScript module resolution issues
 */

declare module '@testing-library/user-event' {
  interface UserEventInstance {
    clear: (element: Element) => Promise<void>;
    click: (element: Element) => Promise<void>;
    copy: (element: Element) => Promise<void>;
    cut: (element: Element) => Promise<void>;
    dblClick: (element: Element) => Promise<void>;
    deselectOptions: (element: Element, values: string | string[]) => Promise<void>;
    hover: (element: Element) => Promise<void>;
    keyboard: (text: string) => Promise<void>;
    pointer: (coords: { target: Element; coords?: { x?: number; y?: number } }) => Promise<void>;
    paste: (element: Element, text?: string) => Promise<void>;
    selectOptions: (element: Element, values: string | string[]) => Promise<void>;
    tripleClick: (element: Element) => Promise<void>;
    type: (element: Element, text: string) => Promise<void>;
    unhover: (element: Element) => Promise<void>;
    upload: (element: Element, files: File | File[]) => Promise<void>;
    tab: () => Promise<void>;
  }
  
  const userEvent: {
    setup: () => UserEventInstance;
    clear: (element: Element) => Promise<void>;
    click: (element: Element) => Promise<void>;
    copy: (element: Element) => Promise<void>;
    cut: (element: Element) => Promise<void>;
    dblClick: (element: Element) => Promise<void>;
    deselectOptions: (element: Element, values: string | string[]) => Promise<void>;
    hover: (element: Element) => Promise<void>;
    keyboard: (text: string) => Promise<void>;
    pointer: (coords: { target: Element; coords?: { x?: number; y?: number } }) => Promise<void>;
    paste: (element: Element, text?: string) => Promise<void>;
    selectOptions: (element: Element, values: string | string[]) => Promise<void>;
    tripleClick: (element: Element) => Promise<void>;
    type: (element: Element, text: string) => Promise<void>;
    unhover: (element: Element) => Promise<void>;
    upload: (element: Element, files: File | File[]) => Promise<void>;
    tab: () => Promise<void>;
  };
  
  export default userEvent;
}
