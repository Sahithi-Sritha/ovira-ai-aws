'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ClipboardEdit } from 'lucide-react';

export default function DoctorNotes() {
    return (
        <Card variant="elevated" className="print:shadow-none print:border print:border-gray-300 print:min-h-[300px]">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ClipboardEdit className="w-5 h-5 text-primary" />
                    <CardTitle>Doctor Notes</CardTitle>
                </div>
                <p className="text-xs text-text-muted mt-1">Space for physician observations and recommendations</p>
            </CardHeader>
            <CardContent>
                <div className="min-h-[200px] p-4 border-2 border-dashed border-border rounded-lg print:border-gray-400">
                    <p className="text-sm text-text-muted italic">
                        This section can be filled in by hand after printing, or notes can be added digitally before printing.
                    </p>
                    {/* ponytail: Empty space for writing - simplest solution */}
                    <div className="h-[150px]"></div>
                </div>
            </CardContent>
        </Card>
    );
}
