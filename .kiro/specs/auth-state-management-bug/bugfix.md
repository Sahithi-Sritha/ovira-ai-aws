# Bugfix Requirements Document

## Introduction

This document addresses critical authentication state management bugs in the Ovira AI application. Two related issues prevent users from successfully completing the authentication flow:

1. After successful login, users are not redirected to the dashboard page
2. During onboarding completion, the system throws "No user logged in" error even though the user has authenticated

These bugs break the core user authentication flow and prevent new users from accessing the application after signup and login.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user successfully logs in via the login page (with or without OTP challenge) THEN the system attempts to redirect to `/dashboard` but the AuthContext user state remains null

1.2 WHEN a user completes the onboarding form and clicks "Get Started" THEN the system throws error "No user logged in" at `completeOnboarding` function because the user state is undefined/null

1.3 WHEN the login page stores authentication tokens in localStorage and calls `router.push('/dashboard')` THEN the AuthContext does not update its user state before the redirect occurs

1.4 WHEN a user navigates to the onboarding page after signup THEN the AuthContext user state is not populated even though authentication tokens exist in localStorage

### Expected Behavior (Correct)

2.1 WHEN a user successfully logs in via the login page THEN the system SHALL update the AuthContext user state with the authenticated user information AND redirect to `/dashboard` with the user state populated

2.2 WHEN a user completes the onboarding form and clicks "Get Started" THEN the system SHALL successfully call `completeOnboarding` with a valid user object AND redirect to `/dashboard`

2.3 WHEN the login page stores authentication tokens in localStorage THEN the system SHALL notify the AuthContext to refresh its user state before redirecting

2.4 WHEN a user navigates to the onboarding page after signup THEN the system SHALL populate the AuthContext user state from the stored authentication tokens

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user who is not logged in attempts to access protected routes THEN the system SHALL CONTINUE TO redirect them to the login page

3.2 WHEN a user successfully logs out THEN the system SHALL CONTINUE TO clear the user state and authentication tokens

3.3 WHEN the AuthContext checks for a current user on mount THEN the system SHALL CONTINUE TO call `getCurrentUser()` and fetch the user profile

3.4 WHEN authentication tokens are invalid or expired THEN the system SHALL CONTINUE TO handle errors gracefully and clear the user state

3.5 WHEN a user signs up with email verification required THEN the system SHALL CONTINUE TO display the appropriate verification message

3.6 WHEN a user completes onboarding with valid user state THEN the system SHALL CONTINUE TO update the user profile with onboarding data
