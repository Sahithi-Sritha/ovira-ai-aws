'use client';

import { CalendarLegendProps } from './types';

export default function CalendarLegend({ showSymptomIndicator }: CalendarLegendProps) {
  const flowLevels = [
    { level: 'light', bgClass: 'bg-pink-200', label: 'Light Flow' },
    { level: 'medium', bgClass: 'bg-pink-400', label: 'Medium Flow' },
    { level: 'heavy', bgClass: 'bg-red-600', label: 'Heavy Flow' },
  ];

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Legend</h4>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Flow intensity legend */}
        <div className="flex flex-col sm:flex-row gap-3">
          <span className="text-xs text-gray-600 font-medium">Flow Intensity:</span>
          <div className="flex gap-3">
            {flowLevels.map(({ level, bgClass, label }) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded ${bgClass} border border-gray-300 flex items-center justify-center`}
                  aria-hidden="true"
                >
                  <span className={`text-xs font-bold ${level === 'heavy' ? 'text-white' : 'text-gray-700'}`}>
                    {level === 'light' ? 'L' : level === 'medium' ? 'M' : 'H'}
                  </span>
                </div>
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Symptom indicator legend */}
        {showSymptomIndicator && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">Symptoms:</span>
            <div className="relative w-6 h-6 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-0.5 right-0.5" aria-hidden="true" />
              <span className="text-xs text-gray-500">•</span>
            </div>
            <span className="text-xs text-gray-600">Symptoms Logged</span>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Period days are highlighted with colored backgrounds. Click any date to log symptoms.
      </div>
    </div>
  );
}