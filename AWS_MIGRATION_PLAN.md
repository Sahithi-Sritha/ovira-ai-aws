# AWS Migration Plan for Ovira AI

## Overview
Migrating from Firebase/Google Cloud services to AWS infrastructure following the architecture defined in `.kiro/specs/ovira-ai/design.md` and `.kiro/specs/ovira-ai/requirements.md`.

## Service Mapping

### 1. Authentication
- **From**: Firebase Authentication
- **To**: AWS Cognito
- **Changes**:
  - User Pool for email/password authentication
  - Identity Pool for federated identities (Google, Apple)
  - JWT token-based authentication
  - MFA support (SMS/TOTP)

### 2. Database
- **From**: Firestore
- **To**: DynamoDB
- **Changes**:
  - NoSQL document structure maintained
  - Table design:
    - `Users` table (userId as partition key)
    - `Symptoms` table (userId as partition key, timestamp as sort key)
    - `Reports` table (userId as partition key, reportId as sort key)
    - `ChatHistory` table (userId as partition key, sessionId#timestamp as sort key)

### 3. File Storage
- **From**: Firebase Storage
- **To**: Amazon S3
- **Changes**:
  - Bucket: `ovira-reports-prototype`
  - Server-side encryption (SSE-KMS)
  - Presigned URLs for secure downloads

### 4. AI Services
- **From**: Google Gemini API
- **To**: Amazon Bedrock
- **Changes**:
  - Model: Claude 3 Haiku (primary)
  - Model: Titan Text Express (fallback)
  - Custom guardrails for medical safety
  - Non-diagnostic output enforcement

### 5. Hosting
- **From**: Firebase Hosting
- **To**: AWS Amplify
- **Changes**:
  - CI/CD pipeline
  - Environment variable management
  - Custom domain support

## Implementation Steps

### Phase 1: AWS Infrastructure Setup
1. Create AWS Cognito User Pool
2. Set up DynamoDB tables
3. Create S3 buckets
4. Configure Bedrock access
5. Set up IAM roles and policies

### Phase 2: Code Migration
1. Replace Firebase SDK with AWS SDK
2. Update authentication logic
3. Migrate database operations
4. Update file storage operations
5. Replace Gemini AI with Bedrock

### Phase 3: Testing & Validation
1. Test authentication flows
2. Validate data operations
3. Test AI responses
4. Verify file uploads/downloads
5. End-to-end testing

### Phase 4: Deployment
1. Update environment variables
2. Deploy to AWS Amplify
3. Monitor and validate
4. Performance optimization

## Files to Modify

### Core Configuration
- `src/lib/firebase/firebase.ts` → `src/lib/aws/config.ts`
- `src/contexts/auth-context.tsx` → Update to use Cognito
- `package.json` → Replace Firebase dependencies with AWS SDK

### API Routes
- `src/app/api/chat/route.ts` → Use Bedrock instead of Gemini
- `src/app/api/analyze/route.ts` → Use DynamoDB for data retrieval
- `src/app/api/health-report/route.ts` → Use Bedrock + S3

### Environment Variables
```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_user_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=your_identity_pool_id

# DynamoDB
DYNAMODB_USERS_TABLE=ovira-users
DYNAMODB_SYMPTOMS_TABLE=ovira-symptoms
DYNAMODB_REPORTS_TABLE=ovira-reports
DYNAMODB_CHAT_TABLE=ovira-chat-history

# S3
S3_REPORTS_BUCKET=ovira-reports-prototype
S3_REGION=us-east-1

# Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_REGION=us-east-1
```

## Dependencies to Add
```json
{
  "@aws-sdk/client-cognito-identity-provider": "^3.x",
  "@aws-sdk/client-dynamodb": "^3.x",
  "@aws-sdk/lib-dynamodb": "^3.x",
  "@aws-sdk/client-s3": "^3.x",
  "@aws-sdk/s3-request-presigner": "^3.x",
  "@aws-sdk/client-bedrock-runtime": "^3.x",
  "@aws-amplify/auth": "^6.x",
  "amazon-cognito-identity-js": "^6.x"
}
```

## Dependencies to Remove
```json
{
  "firebase": "^11.1.0",
  "@google/generative-ai": "^0.21.0"
}
```

## Responsible AI Compliance
All AI implementations must follow the guidelines in design.md:
- Non-diagnostic outputs only
- Decision-support purpose clearly stated
- Encouragement of professional medical consultation
- Custom guardrails to block medical diagnosis/treatment language
- Prohibited words: diagnose, treatment, cure, disease, prescribe

## Security Considerations
- End-to-end encryption (TLS 1.3)
- Data encryption at rest (KMS)
- IAM least privilege access
- Cognito MFA support
- S3 bucket policies
- DynamoDB encryption

## Cost Optimization
- DynamoDB on-demand billing
- S3 Standard storage class
- Bedrock on-demand pricing
- Lambda for serverless compute
- CloudWatch for monitoring

## Rollback Plan
- Keep Firebase configuration as backup
- Feature flags for gradual migration
- Data export before migration
- Parallel running during transition

## Timeline
- Phase 1: 2-3 days
- Phase 2: 3-4 days
- Phase 3: 2-3 days
- Phase 4: 1-2 days
- **Total**: 8-12 days for complete migration

## Success Criteria
- All authentication flows working with Cognito
- All data operations using DynamoDB
- AI chat using Bedrock with proper guardrails
- Reports generated and stored in S3
- Performance meets prototype phase targets
- Zero data loss during migration
