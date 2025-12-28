'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase/firebase';
import { UserProfile, OnboardingData } from '@/types';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    error: string | null;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    completeOnboarding: (data: OnboardingData) => Promise<void>;
    refreshUserProfile: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Ensure we're mounted before Firebase operations
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch user profile from Firestore
    const fetchUserProfile = async (uid: string) => {
        if (!db) return;
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
            } else {
                setUserProfile(null);
            }
        } catch (err: any) {
            console.error('Error fetching user profile:', err);
            // Don't show error for offline - might be new user
            if (!err.message?.includes('offline')) {
                setError('Unable to load profile. Please check your connection.');
            }
            setUserProfile(null);
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        if (!mounted || !auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                await fetchUserProfile(user.uid);
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [mounted]);

    const clearError = () => setError(null);

    // Sign up with email/password
    const signUp = async (email: string, password: string, displayName: string) => {
        if (!auth || !db) {
            setError('Authentication service not available. Please refresh the page.');
            throw new Error('Firebase not initialized');
        }

        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);

            // Update display name
            await updateProfile(result.user, { displayName });

            // Create initial user profile
            const profile: Partial<UserProfile> = {
                uid: result.user.uid,
                email: result.user.email!,
                displayName,
                onboardingComplete: false,
                createdAt: Timestamp.now(),
                averageCycleLength: 28,
                conditions: [],
                language: 'en',
                ageRange: '25-34',
            };

            await setDoc(doc(db, 'users', result.user.uid), profile);
            setUserProfile(profile as UserProfile);
        } catch (err: any) {
            const message = getFirebaseErrorMessage(err.code);
            setError(message);
            throw err;
        }
    };

    // Sign in with email/password
    const signIn = async (email: string, password: string) => {
        if (!auth) {
            setError('Authentication service not available. Please refresh the page.');
            throw new Error('Firebase not initialized');
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            const message = getFirebaseErrorMessage(err.code);
            setError(message);
            throw err;
        }
    };

    // Sign in with Google
    const signInWithGoogle = async () => {
        if (!auth || !googleProvider || !db) {
            setError('Authentication service not available. Please refresh the page.');
            throw new Error('Firebase not initialized');
        }

        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Check if user profile exists
            const docRef = doc(db, 'users', result.user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // Create profile for new Google user
                const profile: Partial<UserProfile> = {
                    uid: result.user.uid,
                    email: result.user.email!,
                    displayName: result.user.displayName || undefined,
                    photoURL: result.user.photoURL || undefined,
                    onboardingComplete: false,
                    createdAt: Timestamp.now(),
                    averageCycleLength: 28,
                    conditions: [],
                    language: 'en',
                    ageRange: '25-34',
                };

                await setDoc(docRef, profile);
                setUserProfile(profile as UserProfile);
            }
        } catch (err: any) {
            const message = getFirebaseErrorMessage(err.code);
            setError(message);
            throw err;
        }
    };

    // Logout
    const logout = async () => {
        if (!auth) throw new Error('Firebase not initialized');
        await signOut(auth);
        setUserProfile(null);
    };

    // Reset password
    const resetPassword = async (email: string) => {
        if (!auth) throw new Error('Firebase not initialized');
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err: any) {
            const message = getFirebaseErrorMessage(err.code);
            setError(message);
            throw err;
        }
    };

    // Complete onboarding
    const completeOnboarding = async (data: OnboardingData) => {
        if (!user || !db) throw new Error('No user logged in or Firebase not initialized');

        const updates: Partial<UserProfile> = {
            ageRange: data.ageRange,
            conditions: data.conditions,
            language: data.language,
            onboardingComplete: true,
        };

        await setDoc(doc(db, 'users', user.uid), updates, { merge: true });

        setUserProfile((prev) => prev ? { ...prev, ...updates } : null);
    };

    // Refresh user profile
    const refreshUserProfile = async () => {
        if (user) {
            await fetchUserProfile(user.uid);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                loading,
                error,
                signUp,
                signIn,
                signInWithGoogle,
                logout,
                resetPassword,
                completeOnboarding,
                refreshUserProfile,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

function getFirebaseErrorMessage(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'An account with this email already exists';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/weak-password':
            return 'Password is too weak. Use at least 6 characters';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later';
        case 'auth/popup-closed-by-user':
            return 'Sign-in was cancelled';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection';
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled. Please contact support.';
        default:
            return 'An error occurred. Please try again';
    }
}
