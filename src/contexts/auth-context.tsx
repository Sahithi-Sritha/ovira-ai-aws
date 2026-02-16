'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signUpUser,
    signInUser,
    signOutUser,
    getCurrentUser,
    resetPassword as cognitoResetPassword,
    getCognitoErrorMessage,
    CognitoAuthUser,
} from '@/lib/aws/cognito';
import {
    createUserProfile,
    getUserProfile,
    updateUserProfile as updateUserProfileDB,
} from '@/lib/aws/dynamodb';
import { UserProfile, OnboardingData } from '@/types';

interface AuthContextType {
    user: CognitoAuthUser | null;
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
    const [user, setUser] = useState<CognitoAuthUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Ensure we're mounted before operations
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch user profile from DynamoDB
    const fetchUserProfile = async (userId: string) => {
        try {
            const profile = await getUserProfile(userId);
            setUserProfile(profile);
        } catch (err: any) {
            console.error('Error fetching user profile:', err);
            if (!err.message?.includes('offline')) {
                setError('Unable to load profile. Please check your connection.');
            }
            setUserProfile(null);
        }
    };

    // Check for current user on mount
    useEffect(() => {
        if (!mounted) {
            setLoading(false);
            return;
        }

        const checkCurrentUser = async () => {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);

                if (currentUser) {
                    await fetchUserProfile(currentUser.username);
                } else {
                    setUserProfile(null);
                }
            } catch (err) {
                console.error('Error checking current user:', err);
                setUser(null);
                setUserProfile(null);
            } finally {
                setLoading(false);
            }
        };

        checkCurrentUser();
    }, [mounted]);

    const clearError = () => setError(null);

    // Sign up with email/password
    const signUp = async (email: string, password: string, displayName: string) => {
        try {
            const cognitoUser = await signUpUser(email, password, displayName);

            // Create initial user profile in DynamoDB
            const profile: Partial<UserProfile> = {
                uid: cognitoUser.getUsername(),
                email: email,
                displayName,
                onboardingComplete: false,
                createdAt: new Date().toISOString() as any,
                averageCycleLength: 28,
                conditions: [],
                language: 'en',
                ageRange: '25-34',
            };

            await createUserProfile(profile);
            
            // Sign in the user after signup
            const authUser = await signInUser(email, password);
            setUser(authUser);
            setUserProfile(profile as UserProfile);
        } catch (err: any) {
            const message = getCognitoErrorMessage(err);
            setError(message);
            throw err;
        }
    };

    // Sign in with email/password
    const signIn = async (email: string, password: string) => {
        try {
            const authUser = await signInUser(email, password);
            setUser(authUser);
            await fetchUserProfile(authUser.username);
        } catch (err: any) {
            const message = getCognitoErrorMessage(err);
            setError(message);
            throw err;
        }
    };

    // Sign in with Google (placeholder - requires Cognito Identity Pool setup)
    const signInWithGoogle = async () => {
        setError('Google sign-in requires additional AWS Cognito Identity Pool configuration. Please use email/password for now.');
        throw new Error('Google sign-in not yet configured');
    };

    // Logout
    const logout = async () => {
        await signOutUser();
        setUser(null);
        setUserProfile(null);
    };

    // Reset password
    const resetPassword = async (email: string) => {
        try {
            await cognitoResetPassword(email);
        } catch (err: any) {
            const message = getCognitoErrorMessage(err);
            setError(message);
            throw err;
        }
    };

    // Complete onboarding
    const completeOnboarding = async (data: OnboardingData) => {
        if (!user) throw new Error('No user logged in');

        const updates: Partial<UserProfile> = {
            ageRange: data.ageRange,
            conditions: data.conditions,
            language: data.language,
            onboardingComplete: true,
        };

        await updateUserProfileDB(user.username, updates);
        setUserProfile((prev) => prev ? { ...prev, ...updates } : null);
    };

    // Refresh user profile
    const refreshUserProfile = async () => {
        if (user) {
            await fetchUserProfile(user.username);
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
