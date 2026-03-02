import { vi } from 'vitest'

// Mock AWS Cognito
vi.mock('amazon-cognito-identity-js', () => ({
  CognitoUserPool: vi.fn(),
  CognitoUser: vi.fn(),
  AuthenticationDetails: vi.fn(),
  CognitoUserAttribute: vi.fn(),
  CognitoUserSession: vi.fn(),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))