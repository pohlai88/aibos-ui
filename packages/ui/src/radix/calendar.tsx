/**
 * Calendar Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over the Calendar primitive with semantic tokens.
 * Provides accessible calendar components with proper date handling.
 */

import { Calendar as CalendarPrimitive, CalendarDay as CalendarDayPrimitive } from '../primitives/calendar';

const Calendar = CalendarPrimitive;
const CalendarDay = CalendarDayPrimitive;

export { Calendar, CalendarDay };
