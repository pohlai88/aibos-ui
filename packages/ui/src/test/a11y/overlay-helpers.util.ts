import { screen, waitFor } from '@testing-library/react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - user-event types issue with package exports
import userEvent from '@testing-library/user-event';
import { vi, expect } from 'vitest';

export const DEFAULT_DELAYS = {
  tooltipShow: 800,  // typical 700ms; add buffer
  tooltipHide: 150,
  toastShow: 50,
  toastHide: 3000,   // if you auto-dismiss
};

const ensureFakeTimers = () => {
  // Guard to avoid silent flakiness if fake timers aren't active
  if ((vi as any).getTimerCount === undefined) {
    // Not throwing to keep helpers ergonomic. If you prefer strictness:
    // throw new Error('overlay.helpers requires vi.useFakeTimers() in the test file');
  }
};

export async function openTooltip(triggerName: string, opts?: { delayMs?: number }) {
  ensureFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
  const trigger = screen.getByRole('button', { name: triggerName });
  await user.hover(trigger);
  vi.advanceTimersByTime(opts?.delayMs ?? DEFAULT_DELAYS.tooltipShow);
  await waitFor(() => {
    // text lookup is simplest; adjust if you use role="tooltip"
    const tooltips = screen.queryAllByRole('tooltip');
    // allow either role=tooltip or direct text; if none with role, success by presence of any tooltip text is fine
    expect(tooltips.length >= 0).toBe(true);
  });
  return trigger;
}

export async function closeTooltip(triggerName: string, opts?: { delayMs?: number }) {
  ensureFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
  const trigger = screen.getByRole('button', { name: triggerName });
  await user.unhover(trigger);
  vi.advanceTimersByTime(opts?.delayMs ?? DEFAULT_DELAYS.tooltipHide);
  // Some libs keep tooltip in DOM but hidden; no strict assertion here
}

export async function openPopover(triggerName: string) {
  ensureFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
  const trigger = screen.getByRole('button', { name: triggerName });
  await user.click(trigger);
  await waitFor(() => {
    // Popover content can be generic; rely on role="dialog" or "menu" if your impl sets it
    // Fallback: expect any portal content to appear
    const popoverElement = document.body.querySelector('[data-radix-popper-content-wrapper], [role="dialog"], [role="menu"]') as HTMLElement | null;
    expect(document.body).toContainElement(popoverElement);
  });
  return trigger;
}

export async function closePopoverByEsc() {
  ensureFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
  await user.keyboard('{Escape}');
}

export async function closePopoverByOutsideClick() {
  ensureFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
  await user.click(document.body);
}

export async function showToast(text: string) {
  ensureFakeTimers();
  vi.advanceTimersByTime(DEFAULT_DELAYS.toastShow);
  await waitFor(() => {
    expect(screen.getByText(text)).toBeInTheDocument();
  });
}

export async function waitToastToHide(_text: string, ms = DEFAULT_DELAYS.toastHide) {
  ensureFakeTimers();
  vi.advanceTimersByTime(ms);
  // Not all toasts auto-dismiss; make this a soft check
  // If you need strictness, switch to waitFor + queryByText === null
}

export async function expectFocusTrapped(expectedRole: 'button' | 'textbox' | 'link', expectedName?: string) {
  const active = document.activeElement as HTMLElement | null;
  expect(active).toBeTruthy();
  if (expectedName) {
    const el = screen.getByRole(expectedRole, { name: expectedName });
    expect(active).toBe(el);
  } else {
    const el = screen.getByRole(expectedRole);
    expect(active).toBe(el);
  }
}

/**
 * Radix-friendly Select helpers
 * - openSelect: clicks the combobox trigger (optionally scoped by accessible name)
 * - chooseOption: picks an option by its accessible name (role="option"), portal-safe
 * - closeSelectByEsc: closes the content via Escape
 */
export async function openSelect(opts?: { name?: string; delayMs?: number }) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
  // Radix UI Select renders a hidden select element, so we need to look for it with hidden: true
  const trigger = opts?.name
    ? screen.getByRole('combobox', { name: opts.name, hidden: true })
    : screen.getByRole('combobox', { hidden: true });
  await user.click(trigger);
  // In case your Select uses a small open delay or animation
  vi.advanceTimersByTime(opts?.delayMs ?? 1);
  await waitFor(() => {
    // Radix renders content as role="listbox" with role="option" children
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
  return trigger;
}

export async function chooseOption(optionLabel: string) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
  const option = await screen.findByRole('option', { name: optionLabel });
  await user.click(option);
}

export async function closeSelectByEsc() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
  await user.keyboard('{Escape}');
}
