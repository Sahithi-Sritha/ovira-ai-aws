'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Upload, File, X, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export default function UploadDocumentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [category, setCategory] = useState('ultrasound');
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return 'Only PDF, JPG, and PNG files are accepted';
        }
        if (file.size > MAX_FILE_SIZE) {
            return 'File size must be less than 10MB';
        }
        return null;
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            const validationError = validateFile(droppedFile);
            if (validationError) {
                setError(validationError);
                return;
            }
            setFile(droppedFile);
            setError('');
            
            // Generate preview for images
            if (droppedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result as string);
                reader.readAsDataURL(droppedFile);
            } else {
                setPreview(null);
            }
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const validationError = validateFile(selectedFile);
            if (validationError) {
                setError(validationError);
                return;
            }
            setFile(selectedFile);
            setError('');

            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result as string);
                reader.readAsDataURL(selectedFile);
            } else {
                setPreview(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setUploadState('uploading');
        setProgress(0);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.username);
        formData.append('category', category);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const response = await fetch('/api/documents', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setProgress(100);

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Upload failed');
            }

            setUploadState('success');
            setTimeout(() => router.push('/settings?tab=documents'), 2000);
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Upload failed');
            setUploadState('error');
        }
    };

    return (
        <div className="container max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/settings?tab=documents">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft size={20} />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Upload Medical Document</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Document Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: 'ultrasound', label: 'Ultrasound' },
                            { value: 'blood-test', label: 'Blood Report' },
                            { value: 'hormone-test', label: 'Hormone Test' },
                            { value: 'pcos-diagnosis', label: 'PCOS Diagnosis' },
                            { value: 'prescription', label: 'Prescription' },
                            { value: 'other', label: 'Other' },
                        ].map(cat => (
                            <button
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                                    category === cat.value
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border hover:border-primary/50'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    {!file ? (
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                                dragActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                            }`}
                        >
                            <Upload size={48} className="mx-auto mb-4 text-text-muted" />
                            <p className="text-lg font-medium mb-2">Drop your file here</p>
                            <p className="text-sm text-text-secondary mb-4">or</p>
                            <label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileInput}
                                    className="hidden"
                                />
                                <Button as="span" variant="outline">
                                    Browse Files
                                </Button>
                            </label>
                            <p className="text-xs text-text-muted mt-4">
                                Accepted: PDF, JPG, PNG (max 10MB)
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-surface-elevated rounded-xl">
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                                ) : (
                                    <div className="w-16 h-16 bg-surface flex items-center justify-center rounded-lg">
                                        <File size={32} className="text-text-muted" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-text-secondary">
                                        {(file.size / 1024).toFixed(0)} KB
                                    </p>
                                </div>
                                {uploadState === 'idle' && (
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setPreview(null);
                                        }}
                                        className="p-2 hover:bg-surface rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            {uploadState === 'uploading' && (
                                <div className="space-y-2">
                                    <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-center text-text-secondary">
                                        Uploading... {progress}%
                                    </p>
                                </div>
                            )}

                            {uploadState === 'success' && (
                                <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-xl text-success animate-fade-in">
                                    <CheckCircle size={24} />
                                    <p className="font-medium">Upload successful! Redirecting...</p>
                                </div>
                            )}

                            {uploadState === 'error' && (
                                <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error">
                                    <AlertCircle size={24} />
                                    <p>{error}</p>
                                </div>
                            )}

                            {error && uploadState === 'idle' && (
                                <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error">
                                    <AlertCircle size={24} />
                                    <p>{error}</p>
                                </div>
                            )}

                            {uploadState === 'idle' && (
                                <Button onClick={handleUpload} className="w-full" size="lg">
                                    <Upload size={20} />
                                    Upload Document
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
