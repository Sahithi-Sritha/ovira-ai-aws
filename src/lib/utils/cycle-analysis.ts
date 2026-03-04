import { differenceInDays } from 'date-fns';

export interface CycleInfo {
    averageCycleLength: number;
    lastPeriodStart: Date;
    cycleDay: number;
    daysUntilNextPeriod: number;
    currentPhase: string;
    periodStartDates: Date[];
    hasSufficientData: boolean;
}

interface LogEntry {
    date: string;
    flowLevel: string;
    [key: string]: any;
}

/**
 * Parse a date string (YYYY-MM-DD or ISO) into a local Date object.
 */
function parseLocalDate(dateStr: string): Date {
    if (dateStr.includes('T')) {
        return new Date(dateStr);
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/**
 * Format a Date as YYYY-MM-DD string using local time.
 */
function toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Detect period start dates from symptom logs.
 * A period start = a day with flow (light/medium/heavy) preceded by a day with no flow or no log.
 */
export function detectPeriodStartDates(logs: LogEntry[]): Date[] {
    if (!logs || logs.length === 0) return [];

    // Sort logs by date ascending
    const sorted = [...logs].sort((a, b) => {
        return parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime();
    });

    const periodStarts: Date[] = [];
    let inPeriod = false;

    for (let i = 0; i < sorted.length; i++) {
        const log = sorted[i];
        const hasFlow = log.flowLevel && log.flowLevel !== 'none';

        if (hasFlow && !inPeriod) {
            // This is the start of a new period
            periodStarts.push(parseLocalDate(log.date));
            inPeriod = true;
        } else if (!hasFlow) {
            inPeriod = false;
        }

        // Also detect a gap of 14+ days between flow days as a new period
        if (hasFlow && inPeriod && i > 0) {
            const prevFlowIdx = findPreviousFlowDay(sorted, i);
            if (prevFlowIdx >= 0) {
                const gap = differenceInDays(
                    parseLocalDate(log.date),
                    parseLocalDate(sorted[prevFlowIdx].date)
                );
                if (gap >= 14) {
                    // This is a new period, not a continuation
                    periodStarts.push(parseLocalDate(log.date));
                }
            }
        }
    }

    return periodStarts;
}

/**
 * Find the index of the previous day with flow before index i.
 */
function findPreviousFlowDay(logs: LogEntry[], currentIdx: number): number {
    for (let j = currentIdx - 1; j >= 0; j--) {
        if (logs[j].flowLevel && logs[j].flowLevel !== 'none') {
            return j;
        }
    }
    return -1;
}

/**
 * Calculate average cycle length from period start dates.
 * Filters out outliers (<21 or >45 days).
 */
export function calculateAverageCycleLength(periodStartDates: Date[]): number {
    if (periodStartDates.length < 2) return 28; // Default

    const gaps: number[] = [];
    for (let i = 1; i < periodStartDates.length; i++) {
        const gap = differenceInDays(periodStartDates[i], periodStartDates[i - 1]);
        // Filter outliers
        if (gap >= 21 && gap <= 45) {
            gaps.push(gap);
        }
    }

    if (gaps.length === 0) return 28; // All outliers, use default

    const sum = gaps.reduce((a, b) => a + b, 0);
    return Math.round(sum / gaps.length);
}

/**
 * Determine the cycle phase based on cycle day and cycle length.
 * Uses proportional boundaries instead of hardcoded day numbers.
 */
export function getSmartCyclePhase(cycleDay: number, cycleLength: number): string {
    const menstrualEnd = Math.round(cycleLength * 0.18);   // ~5 days of 28
    const follicularEnd = Math.round(cycleLength * 0.46);  // ~13 days of 28
    const ovulationEnd = Math.round(cycleLength * 0.54);   // ~15 days of 28

    if (cycleDay <= menstrualEnd) return 'Menstrual';
    if (cycleDay <= follicularEnd) return 'Follicular';
    if (cycleDay <= ovulationEnd) return 'Ovulation';
    if (cycleDay <= cycleLength) return 'Luteal';
    return 'Expected Period';
}

/**
 * Get complete cycle info by analyzing symptom logs.
 * Falls back to profile data if insufficient logs.
 */
export function getCurrentCycleInfo(
    logs: LogEntry[],
    profileLastPeriodStart?: Date | null,
    profileCycleLength?: number
): CycleInfo {
    const periodStartDates = detectPeriodStartDates(logs);
    const hasSufficientData = periodStartDates.length >= 2;

    // Use computed data if available, otherwise fall back to profile
    const averageCycleLength = hasSufficientData
        ? calculateAverageCycleLength(periodStartDates)
        : (profileCycleLength || 28);

    const lastPeriodStart = periodStartDates.length > 0
        ? periodStartDates[periodStartDates.length - 1]
        : (profileLastPeriodStart || new Date());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastStart = new Date(lastPeriodStart);
    lastStart.setHours(0, 0, 0, 0);

    const cycleDay = differenceInDays(today, lastStart) + 1;
    const daysUntilNextPeriod = Math.max(0, averageCycleLength - cycleDay + 1);
    const currentPhase = getSmartCyclePhase(cycleDay, averageCycleLength);

    return {
        averageCycleLength,
        lastPeriodStart: lastStart,
        cycleDay,
        daysUntilNextPeriod,
        currentPhase,
        periodStartDates,
        hasSufficientData,
    };
}

/**
 * Calculate logging streak — consecutive days with logs, counting backward from today.
 */
export function calculateLoggingStreak(logs: LogEntry[]): number {
    if (!logs || logs.length === 0) return 0;

    // Get unique dates from logs
    const uniqueDateKeys = new Set<string>();
    for (const log of logs) {
        uniqueDateKeys.add(toDateKey(parseLocalDate(log.date)));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today has a log — if not, start from yesterday
    const todayKey = toDateKey(today);
    let streak = 0;
    let checkDate = new Date(today);

    if (!uniqueDateKeys.has(todayKey)) {
        // Check yesterday — if no log yesterday either, streak is 0
        checkDate.setDate(checkDate.getDate() - 1);
        if (!uniqueDateKeys.has(toDateKey(checkDate))) {
            return 0;
        }
    }

    // Count consecutive days backward
    while (uniqueDateKeys.has(toDateKey(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
}
