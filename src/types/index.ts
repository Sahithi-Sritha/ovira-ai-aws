// User Profile
export interface UserProfile {
    id?: string; // Optional for backward compatibility
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    ageRange: '18-24' | '25-34' | '35-44' | '45+';
    conditions: string[];
    language: string;
    onboardingComplete: boolean;
    createdAt: string; // ISO 8601 string
    lastPeriodStart?: string; // ISO 8601 string
    averageCycleLength: number;
}

// Symptom Log
export interface SymptomLog {
    id: string;
    userId: string;
    date: string; // ISO 8601 string
    flowLevel: 'none' | 'light' | 'medium' | 'heavy';
    painLevel: number; // 0-10
    mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
    energyLevel: 'high' | 'medium' | 'low';
    sleepHours: number;
    notes?: string;
    symptoms?: string[];
    createdAt: string; // ISO 8601 string
    updatedAt?: string; // ISO 8601 string
}

// Health Report
export interface HealthReport {
    id: string;
    userId: string;
    generatedAt: string; // ISO 8601 string
    periodStart: string; // ISO 8601 string
    periodEnd: string; // ISO 8601 string
    pdfUrl: string;
    riskFlags: RiskFlag[];
    summary?: string;
}

// Risk Flag
export interface RiskFlag {
    type: 'anemia' | 'pcos' | 'endometriosis' | 'urgent' | 'general';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation?: string;
}

// Chat Message
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string; // ISO 8601 string
}

// Onboarding Data
export interface OnboardingData {
    ageRange: UserProfile['ageRange'];
    conditions: string[];
    language: string;
    acceptedTerms: boolean;
    acceptedMedicalDisclaimer: boolean;
}

// Health Conditions List
export const HEALTH_CONDITIONS = [
    'PCOS',
    'Endometriosis',
    'Fibroids',
    'Thyroid Disorder',
    'Anemia',
    'Diabetes',
    'Hypertension',
    'None of the above',
] as const;

// Mood Options
export const MOOD_OPTIONS = [
    { value: 'great', label: 'Great', emoji: '😊' },
    { value: 'good', label: 'Good', emoji: '🙂' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' },
    { value: 'bad', label: 'Bad', emoji: '😔' },
    { value: 'terrible', label: 'Terrible', emoji: '😢' },
] as const;

// Flow Levels
export const FLOW_LEVELS = [
    { value: 'none', label: 'None', color: '#E5E7EB' },
    { value: 'light', label: 'Light', color: '#FCA5A5' },
    { value: 'medium', label: 'Medium', color: '#EF4444' },
    { value: 'heavy', label: 'Heavy', color: '#991B1B' },
] as const;

// Energy Levels
export const ENERGY_LEVELS = [
    { value: 'low', label: 'Low', icon: '🔋' },
    { value: 'medium', label: 'Medium', icon: '⚡' },
    { value: 'high', label: 'High', icon: '🚀' },
] as const;

// Symptoms List
export const SYMPTOM_OPTIONS = [
    'Cramps',
    'Headache',
    'Bloating',
    'Breast tenderness',
    'Acne',
    'Fatigue',
    'Nausea',
    'Back pain',
    'Insomnia',
    'Mood swings',
    'Anxiety',
    'Cravings',
] as const;

// Languages
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'pt', name: 'Português' },
    { code: 'fr', name: 'Français' },
] as const;
