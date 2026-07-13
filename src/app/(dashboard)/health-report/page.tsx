'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { Printer, FileText, ArrowLeft, Loader2, ClipboardList, Shield, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

// Import new dashboard sections
import PatientSummary from '@/components/reports/PatientSummary';
import HealthSnapshot from '@/components/reports/HealthSnapshot';
import HealthTimeline from '@/components/reports/HealthTimeline';
import HealthAnalytics from '@/components/reports/HealthAnalytics';
import AIInsights from '@/components/reports/AIInsights';
import MedicalDocuments from '@/components/reports/MedicalDocuments';
import DoctorNotes from '@/components/reports/DoctorNotes';
import PrintFooter from '@/components/reports/PrintFooter';

// Types (keep existing structure)
interface HealthReportData {
    executiveSummary: string;
    cycleInsights: {
        overallPattern: string;
        averagePainLevel: number;
        flowPatternDescription: string;
        cycleRegularity: string;
    };
    symptomAnalysis: {
        mostFrequentSymptoms: { symptom: string; count: number; percentage: number }[];
        painTrend: string;
        moodPattern: string;
        sleepQuality: string;
        energyPattern: string;
        notableCorrelations: string[];
    };
    riskAssessment: {
        condition: string;
        riskLevel: 'low' | 'medium' | 'high';
        confidence: string | number;
        indicators: string[];
        recommendation: string;
    }[];
    recommendations: string[];
    questionsForDoctor: string[];
    lifestyleTips: string[];
    urgentFlags: string[];
    generatedAt: string;
    periodStart: string;
    periodEnd: string;
    totalLogsAnalyzed: number;
    patientInfo: {
        name: string;
        ageRange: string;
        conditions: string[];
        averageCycleLength: number;
    };
    statistics: {
        totalLogs: number;
        avgPain: number;
        avgPainScore?: number;
        avgSleep: number;
        avgSleepHours?: number;
        heavyFlowDays: number;
        lowEnergyDays: number;
        poorMoodDays: number;
        topSymptoms: string[] | { symptom: string; count: number; percentage: number }[];
        moodCounts: Record<string, number>;
        flowCounts: Record<string, number>;
        energyCounts: Record<string, number>;
        highPainDays: number;
        flowDays: number;
    };
    citations?: { source: string; excerpt: string }[];
    ragEnabled?: boolean;
}

export default function HealthReportPage() {
    const { user, userProfile } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [report, setReport] = useState<HealthReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user) return;

            try {
                const response = await fetch(`/api/symptoms?userId=${user.username}&limit=90`);
                const data = await response.json();

                if (data.success && data.logs) {
                    const logs = data.logs.map((log: any) => ({
                        ...log,
                        date: { toDate: () => new Date(log.date) },
                    }));
                    setLogs(logs);
                }
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [user]);

    const generateReport = async () => {
        if (logs.length === 0) return;

        setGenerating(true);
        setError(null);

        try {
            const serializedLogs = logs.map((log) => ({
                id: log.id,
                date: log.date?.toDate?.()?.toISOString() || new Date().toISOString(),
                flowLevel: log.flowLevel,
                painLevel: log.painLevel,
                mood: log.mood,
                energyLevel: log.energyLevel,
                sleepHours: log.sleepHours,
                symptoms: log.symptoms || [],
                notes: log.notes || '',
            }));

            const response = await fetch('/api/health-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logs: serializedLogs,
                    userProfile: {
                        displayName: userProfile?.displayName || 'Patient',
                        ageRange: userProfile?.ageRange || '',
                        conditions: userProfile?.conditions || [],
                        averageCycleLength: userProfile?.averageCycleLength || 28,
                        lastPeriodStart: userProfile?.lastPeriodStart,
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to generate report');
            }

            setReport(data);
        } catch (err) {
            console.error('Error generating report:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 print:max-w-none print:space-y-4 print:p-4">
            {/* Header - Hidden on print */}
            <div className="flex items-center gap-4 mb-6 print:hidden">
                <Link href="/reports" className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Health Report</h1>
                    <p className="text-text-secondary">AI-Generated Healthcare Dashboard</p>
                </div>
                <div className="flex gap-2">
                    {report && (
                        <Button variant="secondary" onClick={handlePrint} leftIcon={<Printer size={18} />}>
                            Print Report
                        </Button>
                    )}
                    <Button
                        onClick={generateReport}
                        isLoading={generating}
                        disabled={logs.length === 0}
                        leftIcon={<FileText size={18} />}
                    >
                        {report ? 'Regenerate' : 'Generate Report'}
                    </Button>
                </div>
            </div>

            {/* No logs state */}
            {logs.length === 0 && (
                <Card variant="elevated" className="text-center py-12">
                    <CardContent>
                        <ClipboardList className="w-16 h-16 text-text-muted mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">No Symptom Logs Yet</h2>
                        <p className="text-text-secondary mb-4">Start logging to generate your health report</p>
                        <Link href="/log">
                            <Button>Log First Entry</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Error state */}
            {error && (
                <Card variant="outlined" className="border-error/30 bg-error/5">
                    <CardContent className="pt-6">
                        <p className="text-error">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Pre-generation state */}
            {logs.length > 0 && !report && !generating && (
                <Card variant="elevated">
                    <CardContent className="pt-6 text-center py-12">
                        <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Ready to Generate Report</h2>
                        <p className="text-text-secondary mb-6">
                            Analyzing <span className="font-semibold text-primary">{logs.length}</span> symptom logs
                        </p>
                        <Button onClick={generateReport} size="lg" leftIcon={<FileText size={20} />}>
                            Generate AI Health Report
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ═══ HEALTHCARE DASHBOARD ═══ */}
            {report && (
                <div className="space-y-6 print:space-y-4">
                    {/* Clinical Guidelines Badge */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3 print:bg-white print:border-gray-300">
                        <Shield className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-indigo-800">
                                ⚕️ Analysis based on WHO, ACOG, and NIH guidelines
                            </p>
                            <p className="text-xs text-indigo-600 mt-0.5">
                                For informational purposes only. Not a medical diagnosis.
                            </p>
                            {report.ragEnabled && (
                                <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1">
                                    <BookOpen size={12} />
                                    Powered by clinical knowledge base
                                </p>
                            )}
                        </div>
                    </div>

                    {/* SECTION 1: Patient Summary */}
                    <PatientSummary 
                        report={report} 
                        userProfile={userProfile}
                        logs={logs}
                    />

                    {/* SECTION 2: Health Snapshot (KPIs) */}
                    <HealthSnapshot report={report} />

                    {/* SECTION 3: Health Timeline */}
                    <HealthTimeline 
                        report={report} 
                        userProfile={userProfile}
                        logs={logs}
                    />

                    {/* SECTION 4: Health Analytics */}
                    <HealthAnalytics logs={logs} report={report} />

                    {/* SECTION 5: AI Insights */}
                    <AIInsights report={report} />

                    {/* SECTION 6: Medical Documents */}
                    <MedicalDocuments userId={user?.username} />

                    {/* SECTION 7: Doctor Notes */}
                    <DoctorNotes />

                    {/* SECTION 8: Print Footer */}
                    <PrintFooter generatedAt={report.generatedAt} />
                </div>
            )}
        </div>
    );
}
