'use client';

import { CalendarGridProps } from './types';
import { DAY_LABELS } from '@/lib/utils/calendar-utils';
import CalendarDay from './CalendarDay';

export default function CalendarGrid({
  dates,
  symptomLogs,
  onDateSelect,
  selectedDate,
}: CalendarGridProps) {
  return (
    <div className="w-full">
      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar dates grid */}
      <div className="grid grid-cols-7 gap-1">
        {dates.map((date, index) => {
          const symptomLog = symptomLogs.get(date.dateString);
          if (symptomLog) {
            console.log(`Found symptom log for ${date.dateString}:`, symptomLog);
          }
          
          return (
            <CalendarDay
              key={`${date.dateString}-${index}`}
              date={date}
              symptomLog={symptomLog}
              isSelected={
                selectedDate
                  ? date.dateString === selectedDate.toISOString().split('T')[0]
                  : false
              }
              onClick={() => onDateSelect(date.date)}
            />
          );
        })}
      </div>
    </div>
  );
}