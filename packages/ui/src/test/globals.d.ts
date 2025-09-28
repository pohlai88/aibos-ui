export {};

declare global {
  function __ioTriggerAll(
    entries: Array<Partial<IntersectionObserverEntry>>
  ): void;
  function __ioTriggerFor(
    entries: Array<Partial<IntersectionObserverEntry>>
  ): void;
  function __ioGetObservers(): unknown[];

  function __roTriggerAll(
    entries: Array<Partial<ResizeObserverEntry>>
  ): void;
  function __roTriggerFor(
    entries: Array<Partial<ResizeObserverEntry>>
  ): void;
  function __roGetObservers(): unknown[];
}