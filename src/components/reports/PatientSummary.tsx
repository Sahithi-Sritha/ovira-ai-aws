'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { User, Calendar, Activity, Heart } from 'lucide-react';

interface PatientSummaryProps {
    report: any;
    userProfile: any;
    logs: any[];
}

export default function PatientSummary({ report, userProfile, logs }: PatientSummaryProps) {
    // Calculate current cycle day
    const lastPeriod = userProfile?.lastPeriodStart ? new Date(userProfile.lastPeriodStart) : null;
    const currentCycleDay = lastPeriod 
        ? Math.floor((new Date().getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : null;

    // Determine health status based on risk assessment
    const getHealthStatus = () => {
        const urgentFlags = report.urgentFlags?.length || 0;
        const highRisks = report.riskAssessment?.filter((r: any) => r.riskLevel === 'high').length || 0;
        
        if (urgentFlags > 0 || highRisks > 0) return { label: 'Needs Attention', color: 'bg-red-500', text: 'text-red-700', bgLight: 'bg-red-50' };
        if (report.riskAssessment?.some((r: any) => r.riskLevel === 'medium')) return { label: 'Monitor', color: 'bg-yellow-500', text: 'text-yellow-700', bgLight: 'bg-yellow-50' };
        return { label: 'Stable', color: 'bg-green-500', text: 'text-green-700', bgLight: 'bg-green-50' };
    };

    const healthStatus = getHealthStatus();

    return (
        <Card variant="elevated" className="print:shadow-none print:border print:border-gray-300">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Patient Summary</CardTitle>
                            <p className="text-sm text-text-secondary mt-1">
                                Report Generated: {formatDate(report.generatedAt)}
                            </p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${healthStatus.bgLight} border border-current ${healthStatus.text} flex items-center gap-2 print:border-2`}>
                        <div className={`w-3 h-3 rounded-full ${healthStatus.color}`}></div>
                        <span className="font-semibold text-sm">{healthStatus.label}</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
                    <div className="space-y-1">
                        <p className="text-xs text-text-muted uppercase tracking-wide">Patient Name</p>
                        <p className="text-base font-semibold">{report.patientInfo?.name || 'Patient'}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-text-muted uppercase tracking-wide">Age Range</p>
                        <p className="text-base font-semibold">{report.patientInfo?.ageRange || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-text-muted uppercase tracking-wide flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Current Cycle Day
                        </p>
                        <p className="text-base font-semibold">
                            {currentCycleDay ? `Day ${currentCycleDay}` : 'N/A'}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-text-muted uppercase tracking-wide flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Avg Cycle Length
                        </p>
                        <p className="text-base font-semibold">
                            {report.patientInfo?.averageCycleLength || 28} days
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-text-muted uppercase tracking-wide">Primary Condition</p>
                        <p className="text-base font-semibold">
                            {report.patientInfo?.conditions?.[0] || 'None reported'}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-text-muted uppercase tracking-wide">Cycle Regularity</p>
                        <p className="text-base font-semibold">{report.cycleInsights?.cycleRegularity || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-text-muted uppercase tracking-wide flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            Last Period
                        </p>
                        <p className="text-base font-semibold">
                            {lastPeriod ? formatDate(lastPeriod) : 'Not recorded'}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-text-muted uppercase tracking-wide">Logs Analyzed</p>
                        <p className="text-base font-semibold">{report.totalLogsAnalyzed || logs.length}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
