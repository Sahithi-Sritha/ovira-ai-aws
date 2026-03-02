# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Registration OTP Email Flow
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that new user registration with valid credentials (email, password, displayName) creates user in Cognito, sends OTP verification email, redirects to verification page, and does NOT attempt immediate authentication
  - The test assertions should match the Expected Behavior Properties from design: userCreatedInCognito, profileCreatedInDynamoDB, verificationEmailSent, redirectedToVerificationPage, NOT authenticatedImmediately
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: users see "Incorrect credentials" instead of verification instructions, no OTP email sent, immediate authentication attempted on unconfirmed user
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Authentication Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (existing user login, password reset, other auth flows)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test cases: existing confirmed user login succeeds, password reset emails work, error handling for wrong passwords works, Google signup error handling works
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Fix for registration OTP email issue

  - [x] 3.1 Update signUp function in auth-context.tsx
    - Remove immediate signInUser(email, password) call after successful user creation
    - Add redirect to verification page instead of attempting authentication
    - Update success flow to indicate verification is needed rather than completing authentication
    - Preserve DynamoDB profile creation functionality
    - Update error handling to distinguish between signup and signin errors
    - _Bug_Condition: isBugCondition(input) where userIsNewRegistration AND immediateSignInAttempted AND userNotConfirmed_
    - _Expected_Behavior: userCreatedInCognito AND verificationEmailSent AND redirectedToVerificationPage AND NOT authenticatedImmediately_
    - _Preservation: Existing login behavior for confirmed users and other authentication flows_
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 3.2 Create verification page component
    - Create new file src/app/(auth)/verify/page.tsx
    - Build verification UI where users can enter OTP code from email
    - Add resend verification code functionality
    - Implement code verification and automatic signin after confirmation
    - Provide clear error handling for invalid/expired codes
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Add verification functions to cognito.ts
    - Add confirmSignUp function to verify OTP code
    - Add resendConfirmationCode function to resend verification email
    - Update error messages for verification-related errors
    - Ensure proper error handling for UserNotConfirmedException
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Registration OTP Email Flow
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [-] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Authentication Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.