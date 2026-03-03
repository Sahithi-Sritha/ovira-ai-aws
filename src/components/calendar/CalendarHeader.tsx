'use client';

import { CalendarHeaderProps } from './types';
import { formatMonthYear } from '@/lib/utils/calendar-utils';

export default function CalendarHeader({
  year,
  month,
  onPreviousMonth,
  onNextMonth,
  canNavigateNext,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={onPreviousMonth}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Previous month"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <h3
        className="text-xl font-semibold text-gray-900"
        aria-live="polite"
      >
        {formatMonthYear(year, month)}
      </h3>

      <button
        onClick={onNextMonth}
        disabled={!canNavigateNext}
        className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
          canNavigateNext
            ? 'hover:bg-gray-100 text-gray-700'
            : 'text-gray-300 cursor-not-allowed'
        }`}
        aria-label="Next month"
        aria-disabled={!canNavigateNext}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
