'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TrendingUp, AlertTriangle, MessageSquare, Sparkles } from 'lucide-react';

interface AIInsightsProps {
    report: any;
}

export default function AIInsights({ report }: AIInsightsProps) {
    // ponytail: Extract insights from report structure
    const positiveInsights = [
        report.cycleInsights?.overallPattern,
        report.symptomAnalysis?.painTrend?.includes('improv') ? report.symptomAnalysis.painTrend : null,
        report.symptomAnalysis?.moodPattern?.includes('stable') ? report.symptomAnalysis.moodPattern : null,
    ].filter(Boolean);

    const monitorPoints = report.riskAssessment?.map((risk: any) => ({
        text: risk.description,
        severity: risk.riskLevel,
        confidence: typeof risk.confidence === 'number' ? risk.confidence : 75,
    })) || [];

    const discussionPoints = report.questionsForDoctor || [];

    const getSeverityBadge = (severity: string) => {
        const badges = {
            low: { label: 'Low Risk', class: 'bg-green-50 text-green-700 border-green-200' },
            medium: { label: 'Medium Risk', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            high: { label: 'High Risk', class: 'bg-red-50 text-red-700 border-red-200' },
        };
        return badges[severity as keyof typeof badges] || badges.low;
    };

    return (
        <Card variant="elevated" className="print:shadow-none print:border print:border-gray-300">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <CardTitle>AI Insights</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Positive Trends */}
                {positiveInsights.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold">Positive Trends</h3>
                        </div>
                        <div className="space-y-2">
                            {positiveInsights.map((insight, index) => (
                                <div key={index} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg print:bg-white">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <p className="text-sm flex-1">{insight}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Things To Monitor */}
                {monitorPoints.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <h3 className="font-semibold">Things To Monitor</h3>
                        </div>
                        <div className="space-y-2">
                            {monitorPoints.map((point: any, index: number) => {
                                const badge = getSeverityBadge(point.severity);
                                return (
                                    <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg print:bg-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${badge.class}`}>
                                                {badge.label}
                                            </span>
                                            <span className="text-xs text-text-muted">
                                                Confidence: {point.confidence}%
                                            </span>
                                        </div>
                                        <p className="text-sm">{point.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Discussion Points */}
                {discussionPoints.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold">Discussion Points For Doctor</h3>
                        </div>
                        <div className="space-y-2">
                            {discussionPoints.map((point: string, index: number) => (
                                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg print:bg-white">
                                    <span className="text-blue-600 font-bold">{index + 1}.</span>
                                    <p className="text-sm flex-1">{point}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {positiveInsights.length === 0 && monitorPoints.length === 0 && discussionPoints.length === 0 && (
                    <p className="text-center text-text-secondary py-6">
                        No AI insights available yet. Continue logging to generate insights.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
