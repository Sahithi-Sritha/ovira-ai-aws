'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FileText, Activity, Pill, Stethoscope, TrendingUp, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface HealthTimelineProps {
    report: any;
    userProfile: any;
    logs: any[];
}

export default function HealthTimeline({ report, userProfile, logs }: HealthTimelineProps) {
    // ponytail: Generate timeline events from available data
    const generateTimelineEvents = () => {
        const events: any[] = [];

        // Add conditions as events
        if (report.patientInfo?.conditions?.length > 0) {
            report.patientInfo.conditions.forEach((condition: string) => {
                if (condition !== 'None of the above') {
                    events.push({
                        date: new Date().toISOString(),
                        category: 'Diagnosis',
                        icon: Stethoscope,
                        description: `Diagnosed with ${condition}`,
                        color: 'text-red-600',
                        bgColor: 'bg-red-50',
                    });
                }
            });
        }

        // Add high pain episodes
        const highPainLogs = logs.filter(log => log.painLevel >= 7).slice(0, 3);
        highPainLogs.forEach(log => {
            events.push({
                date: log.date?.toDate?.() || new Date(log.date),
                category: 'Symptom',
                icon: Activity,
                description: `High pain level recorded (${log.painLevel}/10)`,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
            });
        });

        // Add improvement trends
        if (report.symptomAnalysis?.painTrend?.toLowerCase().includes('improv')) {
            events.push({
                date: new Date().toISOString(),
                category: 'Progress',
                icon: TrendingUp,
                description: report.symptomAnalysis.painTrend,
                color: 'text-green-600',
                bgColor: 'bg-green-50',
            });
        }

        // Add last period as event
        if (userProfile?.lastPeriodStart) {
            events.push({
                date: new Date(userProfile.lastPeriodStart),
                category: 'Cycle',
                icon: Calendar,
                description: 'Last menstrual period',
                color: 'text-pink-600',
                bgColor: 'bg-pink-50',
            });
        }

        // Sort by date descending
        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
    };

    const timelineEvents = generateTimelineEvents();

    if (timelineEvents.length === 0) {
        return (
            <Card variant="elevated" className="print:shadow-none print:border print:border-gray-300">
                <CardHeader>
                    <CardTitle>Health Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-text-secondary">No timeline events available yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card variant="elevated" className="print:shadow-none print:border print:border-gray-300">
            <CardHeader>
                <CardTitle>Health Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {timelineEvents.map((event, index) => (
                        <div key={index} className="flex gap-4 relative">
                            {/* Timeline connector */}
                            {index < timelineEvents.length - 1 && (
                                <div className="absolute left-6 top-12 w-0.5 h-full bg-border print:bg-gray-300"></div>
                            )}

                            {/* Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${event.bgColor} flex items-center justify-center z-10`}>
                                <event.icon className={`w-5 h-5 ${event.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${event.color} ${event.bgColor}`}>
                                        {event.category}
                                    </span>
                                    <span className="text-xs text-text-muted">
                                        {formatDate(event.date)}
                                    </span>
                                </div>
                                <p className="text-sm font-medium">{event.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
