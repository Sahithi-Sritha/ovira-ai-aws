'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FileText, CheckCircle2, Loader2 } from 'lucide-react';

interface MedicalDocumentsProps {
    userId?: string;
}

export default function MedicalDocuments({ userId }: MedicalDocumentsProps) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/documents?userId=${userId}`);
                const data = await response.json();
                
                if (data.success && data.documents) {
                    setDocuments(data.documents);
                }
            } catch (error) {
                console.error('Error fetching documents:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [userId]);

    if (loading) {
        return (
            <Card variant="elevated" className="print:shadow-none print:border print:border-gray-300">
                <CardHeader>
                    <CardTitle>Medical Documents Used</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card variant="elevated" className="print:shadow-none print:border print:border-gray-300">
            <CardHeader>
                <CardTitle>Medical Documents Used</CardTitle>
            </CardHeader>
            <CardContent>
                {documents.length === 0 ? (
                    <p className="text-center text-text-secondary py-6">
                        No medical documents uploaded yet.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {documents.map((doc, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-surface-elevated border border-border rounded-lg print:bg-white print:border-gray-300">
                                <FileText className="w-5 h-5 text-primary" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{doc.filename}</p>
                                    <p className="text-xs text-text-muted capitalize">
                                        {doc.category?.replace('_', ' ')} • {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs font-medium">Included in AI Analysis</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
