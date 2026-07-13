'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface HealthAnalyticsProps {
    logs: any[];
    report: any;
}

export default function HealthAnalytics({ logs, report }: HealthAnalyticsProps) {
    if (logs.length === 0) {
        return (
            <Card variant="elevated">
                <CardContent className="py-12 text-center">
                    <p className="text-text-secondary">No data available for analytics</p>
                </CardContent>
            </Card>
        );
    }

    // ponytail: Prepare chart data - one function per chart type
    const prepareTimeSeriesData = (field: string) => {
        return logs
            .sort((a, b) => new Date(a.date?.toDate?.() || a.date).getTime() - new Date(b.date?.toDate?.() || b.date).getTime())
            .map(log => ({
                date: new Date(log.date?.toDate?.() || log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: log[field] || 0,
            }));
    };

    const prepareSymptomFrequency = () => {
        const symptomCounts: Record<string, number> = {};
        logs.forEach(log => {
            (log.symptoms || []).forEach((symptom: string) => {
                symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
            });
        });
        return Object.entries(symptomCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([symptom, count]) => ({ symptom, count }));
    };

    const prepareDistributionData = (field: string) => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            const value = log[field] || 'unknown';
            counts[value] = (counts[value] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const cycleData = prepareTimeSeriesData('painLevel');
    const painData = prepareTimeSeriesData('painLevel');
    const moodMapping: Record<string, number> = { terrible: 1, bad: 2, neutral: 3, good: 4, great: 5 };
    const moodData = logs.map(log => ({
        date: new Date(log.date?.toDate?.() || log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: moodMapping[log.mood] || 3,
    }));
    const flowMapping: Record<string, number> = { none: 0, light: 1, medium: 2, heavy: 3 };
    const flowData = logs.map(log => ({
        date: new Date(log.date?.toDate?.() || log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: flowMapping[log.flowLevel] || 0,
    }));
    const symptomFrequency = prepareSymptomFrequency();
    const symptomDistribution = prepareDistributionData('symptoms');
    const energyDistribution = prepareDistributionData('energyLevel');

    const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#14B8A6'];

    const charts = [
        {
            title: 'Pain Level Trend',
            chart: (
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={painData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2} name="Pain Level" />
                    </LineChart>
                </ResponsiveContainer>
            ),
        },
        {
            title: 'Mood Trend',
            chart: (
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={moodData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} name="Mood Score" />
                    </LineChart>
                </ResponsiveContainer>
            ),
        },
        {
            title: 'Flow Intensity',
            chart: (
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={flowData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 3]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#EC4899" fill="#EC4899" fillOpacity={0.6} name="Flow Level" />
                    </AreaChart>
                </ResponsiveContainer>
            ),
        },
        {
            title: 'Symptom Frequency',
            chart: symptomFrequency.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={symptomFrequency} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="symptom" type="category" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                </ResponsiveContainer>
            ) : <p className="text-center text-text-secondary py-12">No symptoms logged</p>,
        },
    ];

    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold">Health Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                {charts.map((item, index) => (
                    <Card key={index} variant="elevated" padding="md" className="print:shadow-none print:border print:border-gray-200">
                        <h3 className="text-sm font-semibold mb-3">{item.title}</h3>
                        {item.chart}
                    </Card>
                ))}
            </div>
        </div>
    );
}
