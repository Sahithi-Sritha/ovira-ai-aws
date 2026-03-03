/**
 * Calendar utility functions for date calculations and formatting
 */

export interface CalendarDate {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  dateString: string; // ISO format YYYY-MM-DD
}

/**
 * Get the first day of the month (0 = Sunday, 6 = Saturday)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Generate calendar dates for a given month (including adjacent month dates)
 * Returns 42 dates (6 weeks × 7 days) for consistent grid layout
 */
export function generateCalendarDates(year: number, month: number): CalendarDate[] {
  const dates: CalendarDate[] = [];
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Previous month dates
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    dates.push({
      date,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: false,
      isFuture: date > today,
      dateString: formatDateToISO(date),
    });
  }

  // Current month dates
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    dates.push({
      date,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isFuture: date > today,
      dateString: formatDateToISO(date),
    });
  }

  // Next month dates (fill to 42 total)
  const remainingDays = 42 - dates.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    dates.push({
      date,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: false,
      isFuture: date > today,
      dateString: formatDateToISO(date),
    });
  }

  return dates;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Format month and year for display (e.g., "January 2024")
 */
export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Get month key for caching (YYYY-MM format)
 */
export function getMonthKey(year: number, month: number): string {
  const monthStr = String(month + 1).padStart(2, '0');
  return `${year}-${monthStr}`;
}

/**
 * Parse month key back to year and month
 */
export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number);
  return { year, month: month - 1 };
}

/**
 * Get start and end dates for a month (for data fetching)
 */
export function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: formatDateToISO(start),
    end: formatDateToISO(end),
  };
}

/**
 * Check if navigation to next month is allowed (not future)
 */
export function canNavigateToNextMonth(year: number, month: number): boolean {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  if (year > currentYear) return false;
  if (year === currentYear && month >= currentMonth) return false;
  return true;
}

/**
 * Day of week labels
 */
export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
