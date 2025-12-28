'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { HEALTH_CONDITIONS, SUPPORTED_LANGUAGES, OnboardingData } from '@/types';
import { Check, ChevronLeft, ChevronRight, Shield, Heart, Globe, Calendar } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<OnboardingData>({
        ageRange: '25-34',
        conditions: [],
        language: 'en',
        acceptedTerms: false,
        acceptedMedicalDisclaimer: false,
    });

    const { completeOnboarding } = useAuth();
    const router = useRouter();

    const handleNext = () => {
        if (step < 4) {
            setStep((step + 1) as Step);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((step - 1) as Step);
        }
    };

    const handleComplete = async () => {
        if (!data.acceptedTerms || !data.acceptedMedicalDisclaimer) return;

        setLoading(true);
        try {
            await completeOnboarding(data);
            router.push('/dashboard');
        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCondition = (condition: string) => {
        setData((prev) => ({
            ...prev,
            conditions: prev.conditions.includes(condition)
                ? prev.conditions.filter((c) => c !== condition)
                : [...prev.conditions, condition],
        }));
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <div className="w-full max-w-lg animate-slide-in-up">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${s < step
                                        ? 'bg-primary text-white'
                                        : s === step
                                            ? 'bg-primary text-white ring-4 ring-primary/20'
                                            : 'bg-surface border-2 border-border text-text-muted'
                                    }`}
                            >
                                {s < step ? <Check size={16} /> : s}
                            </div>
                        ))}
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>
                </div>

                <Card variant="elevated" padding="lg">
                    {/* Step 1: Age Range */}
                    {step === 1 && (
                        <>
                            <CardHeader className="text-center">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                    <Calendar className="w-7 h-7 text-primary" />
                                </div>
                                <CardTitle>What&apos;s your age range?</CardTitle>
                                <CardDescription>This helps us personalize your experience</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['18-24', '25-34', '35-44', '45+'] as const).map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setData((prev) => ({ ...prev, ageRange: range }))}
                                            className={`p-4 rounded-xl border-2 text-center transition-all ${data.ageRange === range
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <span className="font-medium">{range}</span>
                                            <span className="block text-sm text-text-secondary mt-1">years old</span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 2: Health Conditions */}
                    {step === 2 && (
                        <>
                            <CardHeader className="text-center">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                                    <Heart className="w-7 h-7 text-accent" />
                                </div>
                                <CardTitle>Any known conditions?</CardTitle>
                                <CardDescription>Select all that apply (optional)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2">
                                    {HEALTH_CONDITIONS.map((condition) => (
                                        <button
                                            key={condition}
                                            onClick={() => toggleCondition(condition)}
                                            className={`p-3 rounded-xl border-2 text-sm text-left transition-all flex items-center gap-2 ${data.conditions.includes(condition)
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${data.conditions.includes(condition)
                                                        ? 'bg-primary border-primary'
                                                        : 'border-border'
                                                    }`}
                                            >
                                                {data.conditions.includes(condition) && (
                                                    <Check size={12} className="text-white" />
                                                )}
                                            </div>
                                            {condition}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 3: Language */}
                    {step === 3 && (
                        <>
                            <CardHeader className="text-center">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                                    <Globe className="w-7 h-7 text-secondary" />
                                </div>
                                <CardTitle>Preferred language?</CardTitle>
                                <CardDescription>We&apos;ll communicate with you in this language</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => setData((prev) => ({ ...prev, language: lang.code }))}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${data.language === lang.code
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <span className="font-medium">{lang.name}</span>
                                            {data.language === lang.code && (
                                                <Check size={20} className="text-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 4: Privacy & Disclaimer */}
                    {step === 4 && (
                        <>
                            <CardHeader className="text-center">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
                                    <Shield className="w-7 h-7 text-success" />
                                </div>
                                <CardTitle>Almost there!</CardTitle>
                                <CardDescription>Please review and accept to continue</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Privacy Terms */}
                                    <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                                        <h4 className="font-medium mb-2">Privacy & Data Usage</h4>
                                        <p className="text-sm text-text-secondary">
                                            Your health data is encrypted and stored securely. We never share your personal
                                            information with third parties. You can export or delete your data at any time.
                                        </p>
                                        <label className="flex items-center gap-3 mt-4 cursor-pointer">
                                            <div
                                                onClick={() =>
                                                    setData((prev) => ({ ...prev, acceptedTerms: !prev.acceptedTerms }))
                                                }
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${data.acceptedTerms
                                                        ? 'bg-primary border-primary'
                                                        : 'border-border hover:border-primary'
                                                    }`}
                                            >
                                                {data.acceptedTerms && <Check size={12} className="text-white" />}
                                            </div>
                                            <span className="text-sm">I accept the privacy policy and terms</span>
                                        </label>
                                    </div>

                                    {/* Medical Disclaimer */}
                                    <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                                        <h4 className="font-medium mb-2 text-warning">Medical Disclaimer</h4>
                                        <p className="text-sm text-text-secondary">
                                            Ovira AI provides health insights for informational purposes only. This is{' '}
                                            <strong>not</strong> a substitute for professional medical advice, diagnosis,
                                            or treatment. Always consult a healthcare provider for medical concerns.
                                        </p>
                                        <label className="flex items-center gap-3 mt-4 cursor-pointer">
                                            <div
                                                onClick={() =>
                                                    setData((prev) => ({
                                                        ...prev,
                                                        acceptedMedicalDisclaimer: !prev.acceptedMedicalDisclaimer,
                                                    }))
                                                }
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${data.acceptedMedicalDisclaimer
                                                        ? 'bg-warning border-warning'
                                                        : 'border-border hover:border-warning'
                                                    }`}
                                            >
                                                {data.acceptedMedicalDisclaimer && <Check size={12} className="text-white" />}
                                            </div>
                                            <span className="text-sm">I understand and accept this disclaimer</span>
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                        {step > 1 && (
                            <Button variant="ghost" onClick={handleBack} leftIcon={<ChevronLeft size={20} />}>
                                Back
                            </Button>
                        )}
                        <div className="flex-1" />
                        {step < 4 ? (
                            <Button onClick={handleNext} rightIcon={<ChevronRight size={20} />}>
                                Continue
                            </Button>
                        ) : (
                            <Button
                                onClick={handleComplete}
                                isLoading={loading}
                                disabled={!data.acceptedTerms || !data.acceptedMedicalDisclaimer}
                            >
                                Get Started
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
