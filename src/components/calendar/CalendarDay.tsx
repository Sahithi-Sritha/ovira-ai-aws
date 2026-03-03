'use client';

import React from 'react';
import { CalendarDayProps } from './types';
import { SymptomIndicator } from './indicators';

function CalendarDay({
  date,
  symptomLog,
  isSelected,
  onClick,
}: CalendarDayProps) {
  // Debug logging
  if (symptomLog) {
    console.log(`CalendarDay for ${date.dayNumber}:`, {
      date: date.date.toISOString().split('T')[0],
      flowLevel: symptomLog.flowLevel,
      hasLog: !!symptomLog
    });
  }

  const hasSymptoms = symptomLog && (
    (symptomLog.symptoms && symptomLog.symptoms.length > 0) ||
    symptomLog.notes ||
    symptomLog.painLevel > 0
  );

  const handleClick = () => {
    if (!date.isFuture) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !date.isFuture) {
      event.preventDefault();
      onClick();
    }
  };

  // Get background color based on flow level
  const getBackgroundColor = () => {
    if (!symptomLog) {
      console.log(`No symptomLog for day ${date.dayNumber}`);
      return '';
    }
    
    console.log(`Day ${date.dayNumber} has flowLevel: ${symptomLog.flowLevel}`);
    
    if (symptomLog.flowLevel === 'none') {
      return '';
    }
    
    switch (symptomLog.flowLevel) {
      case 'light':
        return 'bg-pink-200'; // Light pink
      case 'medium':
        return 'bg-pink-400'; // Medium pink
      case 'heavy':
        return 'bg-red-600'; // Dark red
      default:
        console.log(`Unknown flowLevel: ${symptomLog.flowLevel}`);
        return '';
    }
  };

  // Get text color for contrast
  const getTextColor = () => {
    if (symptomLog?.flowLevel === 'heavy') {
      return 'text-white'; // White text on dark red background
    }
    return date.isCurrentMonth ? 'text-gray-900' : 'text-gray-400';
  };

  const backgroundColorClass = getBackgroundColor();
  const textColorClass = getTextColor();

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={date.isFuture}
      className={`
        relative aspect-square p-1 text-sm transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg
        ${date.isFuture 
          ? 'cursor-not-allowed opacity-50' 
          : 'cursor-pointer'
        }
      `}
      aria-label={`${date.date.toLocaleDateString()}, ${symptomLog ? `${symptomLog.flowLevel} flow` : 'no data'}`}
      aria-disabled={date.isFuture}
    >
      <div className={`
        flex items-center justify-center w-10 h-10 mx-auto rounded-full transition-colors
        ${backgroundColorClass}
        ${!backgroundColorClass && date.isCurrentMonth 
          ? 'hover:bg-gray-100' 
          : !backgroundColorClass 
          ? 'hover:bg-gray-50' 
          : 'hover:opacity-80'
        }
        ${date.isToday 
          ? 'ring-2 ring-blue-500' 
          : ''
        }
        ${isSelected 
          ? 'ring-2 ring-blue-600 ring-offset-1' 
          : ''
        }
      `}>
        <span className={`font-medium ${textColorClass}`}>
          {date.dayNumber}
        </span>
      </div>
      
      {/* Symptom indicator */}
      <SymptomIndicator hasSymptoms={!!hasSymptoms} />
    </button>
  );
}

export default React.memo(CalendarDay);