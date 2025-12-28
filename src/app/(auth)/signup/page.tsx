'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Mail, Lock, Eye, EyeOff, User, Check } from 'lucide-react';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUp, signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!acceptTerms) {
            setError('Please accept the terms and conditions');
            return;
        }

        setLoading(true);

        try {
            await signUp(email, password, name);
            router.push('/onboarding');
        } catch (err: any) {
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setError('');
        setLoading(true);

        try {
            await signInWithGoogle();
            router.push('/onboarding');
        } catch (err: any) {
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(password);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <div className="w-full max-w-md animate-slide-in-up">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">Ovira AI</h1>
                    <p className="text-text-secondary">Start your health journey today</p>
                </div>

                <Card variant="elevated" padding="lg">
                    <CardHeader>
                        <CardTitle>Create Account</CardTitle>
                        <CardDescription>Join thousands tracking their wellness</CardDescription>
                    </CardHeader>

                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Full Name"
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                leftIcon={<User size={20} />}
                                required
                            />

                            <Input
                                label="Email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                leftIcon={<Mail size={20} />}
                                required
                            />

                            <div>
                                <Input
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    leftIcon={<Lock size={20} />}
                                    rightIcon={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    }
                                    required
                                />
                                {password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${level <= passwordStrength.level
                                                            ? passwordStrength.color
                                                            : 'bg-border'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-xs ${passwordStrength.textColor}`}>
                                            {passwordStrength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Input
                                label="Confirm Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                leftIcon={<Lock size={20} />}
                                error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
                                required
                            />

                            {/* Terms Checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div
                                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${acceptTerms
                                            ? 'bg-primary border-primary'
                                            : 'border-border group-hover:border-primary'
                                        }`}
                                    onClick={() => setAcceptTerms(!acceptTerms)}
                                >
                                    {acceptTerms && <Check size={14} className="text-white" />}
                                </div>
                                <span className="text-sm text-text-secondary">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-primary hover:underline">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" className="text-primary hover:underline">
                                        Privacy Policy
                                    </Link>
                                </span>
                            </label>

                            <Button type="submit" fullWidth isLoading={loading} disabled={!acceptTerms}>
                                Create Account
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-surface text-text-muted">or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            fullWidth
                            onClick={handleGoogleSignUp}
                            disabled={loading}
                            leftIcon={
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            }
                        >
                            Continue with Google
                        </Button>

                        <p className="mt-6 text-center text-sm text-text-secondary">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
                                Sign in
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function getPasswordStrength(password: string) {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
        return { level: 1, label: 'Weak', color: 'bg-error', textColor: 'text-error' };
    } else if (score <= 2) {
        return { level: 2, label: 'Fair', color: 'bg-warning', textColor: 'text-warning' };
    } else if (score <= 3) {
        return { level: 3, label: 'Good', color: 'bg-info', textColor: 'text-info' };
    } else {
        return { level: 4, label: 'Strong', color: 'bg-success', textColor: 'text-success' };
    }
}

function getErrorMessage(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'An account with this email already exists';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/weak-password':
            return 'Password is too weak';
        case 'auth/popup-closed-by-user':
            return 'Sign-up cancelled';
        default:
            return 'An error occurred. Please try again';
    }
}
