import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPhaseColor(phase: string): string {
  const colors: Record<string, string> = {
    'Menstrual': 'text-red-500',
    'Follicular': 'text-green-500',
    'Ovulatory': 'text-purple-500',
    'Luteal': 'text-orange-500'
  };
  return colors[phase] || 'text-gray-500';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
