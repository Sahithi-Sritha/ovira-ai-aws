'use client';

import { FlowIndicatorProps, SymptomIndicatorProps } from './types';

export function FlowIndicator({ flowLevel }: FlowIndicatorProps) {
  // This component is no longer needed as we'll use background colors
  return null;
}

export function SymptomIndicator({ hasSymptoms }: SymptomIndicatorProps) {
  if (!hasSymptoms) return null;

  return (
    <div
      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full absolute top-1 right-1"
      aria-label="Has symptoms logged"
    />
  );
}