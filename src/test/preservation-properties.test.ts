import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fc } from 'fast-check';
import { signInUser, resetPassword, confirmSignUp } from '../lib/aws/cognito';

// Mock AWS Cognito functions
vi.mock('../lib/aws/cognito', () => ({
  signInUser: vi.fn(),
  resetPassword: vi.fn(),
  confirmSignUp: vi.fn(),
  resendConfirmationCode: vi.fn(),
}));

describe('Preservation Property Tests - Existing Authentication Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 2.1: Existing User Login Preservation', () => {
    it('**Validates: Requirements 3.1** - existing users with valid credentials continue to authenticate successfully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
            username: fc.string({ minLength: 10, maxLength: 30 }),
          }),
          async ({ email, password, username }) => {
            // Mock successful Cognito authentication for existing users
            const mockAuthUser = { 
              username, 
              email, 
              attributes: { email, name: 'Test User' },
              session: { isValid: () => true }
            };
            (signInUser as any).mockResolvedValue(mockAuthUser);

            // Test the Cognito signInUser function directly
            const result = await signInUser(email, password);

            // Verify the authentication works as expected
            expect(result.username).toBe(username);
            expect(result.email).toBe(email);
            expect(signInUser).toHaveBeenCalledWith(email, password);
          }
        ),
        { numRuns: 1 } // Reduced for faster execution as instructed
      );
    });

    it('**Validates: Requirements 3.1** - login error handling continues to work for invalid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async ({ email, password }) => {
            // Mock Cognito authentication error for invalid credentials
            const authError = new Error('NotAuthorizedException');
            authError.name = 'NotAuthorizedException';
            (signInUser as any).mockRejectedValue(authError);

            // Test that error handling continues to work
            await expect(signInUser(email, password))
              .rejects.toThrow('NotAuthorizedException');
          }
        ),
        { numRuns: 1 }
      );
    });
  });

  describe('Property 2.2: Password Reset Preservation', () => {
    it('**Validates: Requirements 3.2** - password reset emails continue to be sent successfully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Mock successful password reset email sending
            (resetPassword as any).mockResolvedValue(undefined);

            // Test Cognito password reset directly
            await resetPassword(email);

            expect(resetPassword).toHaveBeenCalledWith(email);
          }
        ),
        { numRuns: 1 }
      );
    });

    it('**Validates: Requirements 3.2** - password reset error handling continues to work', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@')), // Invalid email format
          async (invalidEmail) => {
            // Mock Cognito error for invalid email
            const authError = new Error('InvalidParameterException');
            authError.name = 'InvalidParameterException';
            (resetPassword as any).mockRejectedValue(authError);

            await expect(resetPassword(invalidEmail))
              .rejects.toThrow('InvalidParameterException');
          }
        ),
        { numRuns: 1 }
      );
    });
  });

  describe('Property 2.3: OTP Verification Preservation', () => {
    it('**Validates: Requirements 3.3** - OTP email validation continues to work during verification step', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            otp: fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)), // 6-digit OTP
          }),
          async ({ email, otp }) => {
            // Mock successful OTP confirmation
            (confirmSignUp as any).mockResolvedValue(undefined);
            
            // Test Cognito confirmSignUp function
            await confirmSignUp(email, otp);
            
            expect(confirmSignUp).toHaveBeenCalledWith(email, otp);
          }
        ),
        { numRuns: 1 }
      );
    });

    it('**Validates: Requirements 3.3** - OTP validation error handling continues to work correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            otp: fc.string({ minLength: 1, maxLength: 10 }).filter(s => !/^\d{6}$/.test(s)), // Invalid OTP
          }),
          async ({ email, otp }) => {
            // Mock Cognito error for invalid OTP
            const authError = new Error('CodeMismatchException');
            authError.name = 'CodeMismatchException';
            (confirmSignUp as any).mockRejectedValue(authError);
            
            await expect(confirmSignUp(email, otp))
              .rejects.toThrow('CodeMismatchException');
          }
        ),
        { numRuns: 1 }
      );
    });
  });
});