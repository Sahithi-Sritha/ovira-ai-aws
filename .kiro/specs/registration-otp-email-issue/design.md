# Registration OTP Email Issue Bugfix Design

## Overview

The registration process is failing because the application immediately attempts to sign in users after signup without waiting for email verification. AWS Cognito requires email verification for new users, but the current flow tries to authenticate unconfirmed users, resulting in "Incorrect credentials. Please try again." error instead of the expected OTP email flow. The fix involves implementing proper email verification handling and redirecting users to a verification page where they can enter the OTP code sent to their email.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a new user completes signup and the system attempts immediate authentication without email verification
- **Property (P)**: The desired behavior when users register - they should receive an OTP email and be redirected to a verification page
- **Preservation**: Existing login behavior for confirmed users and other authentication flows that must remain unchanged
- **signUpUser**: The function in `src/lib/aws/cognito.ts` that handles Cognito user registration
- **signUp**: The function in `src/contexts/auth-context.tsx` that orchestrates the signup flow including profile creation
- **UserNotConfirmedException**: AWS Cognito error thrown when attempting to authenticate unconfirmed users

## Bug Details

### Fault Condition

The bug manifests when a new user completes the registration form and submits it. The `signUp` function in the auth context successfully creates the user in Cognito and DynamoDB, but then immediately attempts to sign in the user with `signInUser(email, password)`. Since AWS Cognito requires email verification for new users, this authentication attempt fails with a "NotAuthorizedException" error, which gets mapped to "Incorrect credentials. Please try again." instead of triggering the OTP email verification flow.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { email: string, password: string, displayName: string }
  OUTPUT: boolean
  
  RETURN userIsNewRegistration(input.email)
         AND cognitoUserCreatedSuccessfully(input)
         AND immediateSignInAttempted(input.email, input.password)
         AND userNotConfirmed(input.email)
END FUNCTION
```

### Examples

- **New user registration**: User enters "john@example.com", creates account → sees "Incorrect credentials" error instead of "Check your email for verification code"
- **Existing confirmed user login**: User with verified email logs in → works correctly (should be preserved)
- **Password reset flow**: User requests password reset → receives email correctly (should be preserved)
- **Google signup attempt**: User tries Google signup → shows appropriate "not configured" message (should be preserved)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Existing users with confirmed emails must continue to authenticate successfully through the login flow
- Password reset functionality must continue to send emails and work as expected
- Google signup error handling must remain unchanged
- DynamoDB profile creation during signup must continue to work
- All non-registration authentication flows must remain unaffected

**Scope:**
All inputs that do NOT involve new user registration should be completely unaffected by this fix. This includes:
- Login attempts by existing confirmed users
- Password reset requests
- Google authentication attempts
- Profile updates and other authenticated operations

## Hypothesized Root Cause

Based on the code analysis, the root cause is in the `signUp` function in `src/contexts/auth-context.tsx`:

1. **Immediate Authentication Attempt**: After successfully creating a user with `signUpUser()`, the function immediately calls `signInUser(email, password)` without checking if the user needs email verification.

2. **Missing Verification Flow**: The application lacks a verification page and flow to handle the OTP email verification step that Cognito requires.

3. **Incorrect Error Handling**: The `NotAuthorizedException` error from attempting to authenticate an unconfirmed user gets mapped to "Incorrect credentials" instead of guiding the user to verify their email.

4. **Missing Confirmation Check**: The code doesn't differentiate between signup completion (user created, needs verification) and signin completion (user authenticated and ready to use app).

## Correctness Properties

Property 1: Fault Condition - Registration OTP Email Flow

_For any_ new user registration where the user completes the signup form with valid credentials, the fixed signUp function SHALL create the user in Cognito, send an OTP verification email, redirect to a verification page, and NOT attempt immediate authentication.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Existing Authentication Behavior

_For any_ authentication attempt that is NOT a new user registration (existing user login, password reset, etc.), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for confirmed users and other auth flows.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

**File**: `src/contexts/auth-context.tsx`

**Function**: `signUp`

**Specific Changes**:
1. **Remove Immediate Sign-In**: Remove the `signInUser(email, password)` call after successful user creation
2. **Add Verification Redirect**: Instead of signing in, redirect to a new verification page
3. **Update Success Flow**: Change the success path to indicate verification is needed rather than completing authentication
4. **Preserve Profile Creation**: Keep the DynamoDB profile creation as it works correctly
5. **Update Error Handling**: Add specific handling for signup vs signin errors

**File**: `src/app/(auth)/verify/page.tsx` (new file)

**Function**: New verification page component

**Specific Changes**:
1. **Create Verification UI**: Build a page where users can enter the OTP code from their email
2. **Add Resend Functionality**: Allow users to request a new verification code
3. **Handle Confirmation**: Implement code verification and automatic signin after confirmation
4. **Error Handling**: Provide clear feedback for invalid/expired codes

**File**: `src/lib/aws/cognito.ts`

**Function**: Add new verification functions

**Specific Changes**:
1. **Add confirmSignUp**: Function to verify the OTP code
2. **Add resendConfirmationCode**: Function to resend verification email
3. **Update Error Messages**: Add specific error handling for verification-related errors

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that new user registration fails with "Incorrect credentials" error instead of sending OTP email.

**Test Plan**: Write tests that simulate new user registration and assert that the user receives proper verification flow instead of authentication errors. Run these tests on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **New User Registration Test**: Create account with valid email → should fail with "Incorrect credentials" on unfixed code
2. **Cognito User Creation Test**: Verify user is created in Cognito but not confirmed → should show unconfirmed status
3. **Profile Creation Test**: Verify DynamoDB profile is created → should succeed even on unfixed code
4. **Immediate Login Attempt**: Try to login immediately after signup → should fail with authentication error

**Expected Counterexamples**:
- Users see "Incorrect credentials" instead of verification instructions
- No OTP email is sent (because signup succeeds but verification flow is missing)
- Users cannot complete registration despite valid credentials

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := signUp_fixed(input.email, input.password, input.displayName)
  ASSERT userCreatedInCognito(input.email)
  ASSERT profileCreatedInDynamoDB(input.email)
  ASSERT verificationEmailSent(input.email)
  ASSERT redirectedToVerificationPage()
  ASSERT NOT authenticatedImmediately()
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT signIn_original(input) = signIn_fixed(input)
  ASSERT resetPassword_original(input) = resetPassword_fixed(input)
  ASSERT otherAuthFlows_original(input) = otherAuthFlows_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-registration inputs

**Test Plan**: Observe behavior on UNFIXED code first for existing user login and other auth flows, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Existing User Login Preservation**: Observe that confirmed users can login successfully on unfixed code, then verify this continues after fix
2. **Password Reset Preservation**: Observe that password reset emails work on unfixed code, then verify this continues after fix
3. **Error Handling Preservation**: Observe that login errors for wrong passwords work on unfixed code, then verify this continues after fix

### Unit Tests

- Test new user registration creates Cognito user without immediate authentication
- Test verification page handles OTP code entry and validation
- Test resend verification code functionality
- Test confirmed user login continues to work
- Test error handling for invalid verification codes

### Property-Based Tests

- Generate random valid registration data and verify proper verification flow is triggered
- Generate random existing user credentials and verify login behavior is preserved
- Test that all non-registration authentication scenarios continue working across many inputs

### Integration Tests

- Test full registration flow from signup form to email verification to first login
- Test that users can successfully complete verification and access the application
- Test that verification emails are actually sent and contain valid codes
- Test error scenarios like expired codes, invalid codes, and network failures