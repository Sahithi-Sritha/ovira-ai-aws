'use client';

import { Card } from '@/components/ui/Card';
import { Activity, Zap, AlertCircle, Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthSnapshotProps {
    report: any;
}

export default function HealthSnapshot({ report }: HealthSnapshotProps) {
    const stats = report.statistics || {};
    
    // Calculate overall health score (0-100)
    const calculateHealthScore = () => {
        const painScore = Math.max(0, 100 - ((stats.avgPain || stats.avgPainScore || 0) * 10));
        const sleepScore = Math.min(100, ((stats.avgSleep || stats.avgSleepHours || 7) / 8) * 100);
        const moodScore = (stats.poorMoodDays / stats.totalLogs) * 100;
        const energyScore = (stats.lowEnergyDays / stats.totalLogs) * 100;
        
        return Math.round((painScore + sleepScore + (100 - moodScore) + (100 - energyScore)) / 4);
    };

    const healthScore = calculateHealthScore();

    const kpis = [
        {
            icon: Activity,
            label: 'Average Cycle Length',
            value: `${report.patientInfo?.averageCycleLength || 28} days`,
            description: report.cycleInsights?.cycleRegularity || 'Regular',
            trend: 'stable',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            icon: AlertCircle,
            label: 'Average Pain Score',
            value: `${(stats.avgPain || stats.avgPainScore || 0).toFixed(1)}/10`,
            description: report.symptomAnalysis?.painTrend || 'Tracking',
            trend: (stats.avgPain || stats.avgPainScore || 0) < 4 ? 'up' : (stats.avgPain || stats.avgPainScore || 0) > 6 ? 'down' : 'stable',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            icon: Zap,
            label: 'Most Frequent Symptom',
            value: stats.topSymptoms?.[0]?.symptom || stats.topSymptoms?.[0] || 'None',
            description: `${report.symptomAnalysis?.mostFrequentSymptoms?.[0]?.count || 0} occurrences`,
            trend: 'stable',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            icon: Heart,
            label: 'Overall Health Score',
            value: `${healthScore}/100`,
            description: healthScore >= 75 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs attention',
            trend: healthScore >= 75 ? 'up' : healthScore >= 50 ? 'stable' : 'down',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
    ];

    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };

    const getTrendColor = (trend: string) => {
        if (trend === 'up') return 'text-green-600 bg-green-50';
        if (trend === 'down') return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold">Health Snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
                {kpis.map((kpi, index) => (
                    <Card key={index} variant="elevated" padding="md" className="print:shadow-none print:border print:border-gray-200">
                        <div className="flex items-start justify-between">
                            <div className={`p-2.5 rounded-lg ${kpi.bgColor}`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getTrendColor(kpi.trend)}`}>
                                {getTrendIcon(kpi.trend)}
                            </div>
                        </div>
                        <div className="mt-4 space-y-1">
                            <p className="text-xs text-text-muted uppercase tracking-wide">{kpi.label}</p>
                            <p className="text-2xl font-bold">{kpi.value}</p>
                            <p className="text-xs text-text-secondary">{kpi.description}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
