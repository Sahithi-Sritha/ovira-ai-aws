# AWS Setup Guide for Ovira AI

This guide will help you set up the required AWS services for the Ovira AI platform.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Node.js 18+ installed
- Basic understanding of AWS services

## Step 1: Create AWS Cognito User Pool

### 1.1 Create User Pool

```bash
aws cognito-idp create-user-pool \
  --pool-name ovira-user-pool \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true}" \
  --auto-verified-attributes email \
  --mfa-configuration OPTIONAL \
  --email-configuration EmailSendingAccount=COGNITO_DEFAULT \
  --region us-east-1
```

Save the `UserPoolId` from the response.

### 1.2 Create User Pool Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --client-name ovira-web-client \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
  --region us-east-1
```

Save the `ClientId` from the response.

### 1.3 Create Identity Pool (Optional - for Google Sign-In)

```bash
aws cognito-identity create-identity-pool \
  --identity-pool-name ovira-identity-pool \
  --allow-unauthenticated-identities false \
  --cognito-identity-providers ProviderName=cognito-idp.us-east-1.amazonaws.com/<YOUR_USER_POOL_ID>,ClientId=<YOUR_CLIENT_ID> \
  --region us-east-1
```

## Step 2: Create DynamoDB Tables

### 2.1 Users Table

```bash
aws dynamodb create-table \
  --table-name ovira-users \
  --attribute-definitions \
    AttributeName=uid,AttributeType=S \
  --key-schema \
    AttributeName=uid,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2.2 Symptoms Table

```bash
aws dynamodb create-table \
  --table-name ovira-symptoms \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
    AttributeName=date,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=date-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=date,KeyType=RANGE}],Projection={ProjectionType=ALL}" \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2.3 Reports Table

```bash
aws dynamodb create-table \
  --table-name ovira-reports \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=reportId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=reportId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2.4 Chat History Table

```bash
aws dynamodb create-table \
  --table-name ovira-chat-history \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=sessionId_timestamp,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=sessionId_timestamp,KeyType=RANGE \
  --time-to-live-specification \
    "Enabled=true,AttributeName=ttl" \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Step 3: Create S3 Bucket

### 3.1 Create Bucket

```bash
aws s3api create-bucket \
  --bucket ovira-reports-prototype \
  --region us-east-1
```

### 3.2 Enable Encryption

```bash
aws s3api put-bucket-encryption \
  --bucket ovira-reports-prototype \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 3.3 Enable Versioning

```bash
aws s3api put-bucket-versioning \
  --bucket ovira-reports-prototype \
  --versioning-configuration Status=Enabled
```

### 3.4 Configure CORS (for web uploads)

```bash
aws s3api put-bucket-cors \
  --bucket ovira-reports-prototype \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }'
```

## Step 4: Enable Amazon Bedrock

### 4.1 Request Model Access

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access" in the left sidebar
3. Click "Manage model access"
4. Enable access to:
   - Anthropic Claude 3 Haiku
   - Amazon Titan Text Express
5. Submit the request (usually instant approval)

### 4.2 Verify Access

```bash
aws bedrock list-foundation-models --region us-east-1
```

## Step 5: Create IAM User and Policies

### 5.1 Create IAM Policy

Create a file named `ovira-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:*",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:cognito-idp:us-east-1:*:userpool/*",
        "arn:aws:dynamodb:us-east-1:*:table/ovira-*",
        "arn:aws:s3:::ovira-reports-prototype/*",
        "arn:aws:bedrock:us-east-1::foundation-model/*"
      ]
    }
  ]
}
```

Apply the policy:

```bash
aws iam create-policy \
  --policy-name OviraAppPolicy \
  --policy-document file://ovira-policy.json
```

### 5.2 Create IAM User

```bash
aws iam create-user --user-name ovira-app-user
```

### 5.3 Attach Policy to User

```bash
aws iam attach-user-policy \
  --user-name ovira-app-user \
  --policy-arn arn:aws:iam::<YOUR_ACCOUNT_ID>:policy/OviraAppPolicy
```

### 5.4 Create Access Keys

```bash
aws iam create-access-key --user-name ovira-app-user
```

Save the `AccessKeyId` and `SecretAccessKey` from the response.

## Step 6: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<YOUR_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY>

# AWS Cognito
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<YOUR_USER_POOL_ID>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<YOUR_CLIENT_ID>
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=<YOUR_IDENTITY_POOL_ID>

# DynamoDB Tables
NEXT_PUBLIC_DYNAMODB_USERS_TABLE=ovira-users
NEXT_PUBLIC_DYNAMODB_SYMPTOMS_TABLE=ovira-symptoms
NEXT_PUBLIC_DYNAMODB_REPORTS_TABLE=ovira-reports
NEXT_PUBLIC_DYNAMODB_CHAT_TABLE=ovira-chat-history

# S3
NEXT_PUBLIC_S3_REPORTS_BUCKET=ovira-reports-prototype
NEXT_PUBLIC_S3_REGION=us-east-1

# Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_FALLBACK_MODEL_ID=amazon.titan-text-express-v1
BEDROCK_REGION=us-east-1
```

## Step 7: Install Dependencies and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Step 8: Test the Setup

1. Open http://localhost:3000
2. Try to sign up with a new account
3. Verify email (check console for verification code if using Cognito default email)
4. Log in and test symptom logging
5. Test the AI chat assistant
6. Generate a health report

## Security Best Practices

1. **Never commit `.env.local` to version control**
2. **Use AWS Secrets Manager** for production credentials
3. **Enable MFA** on your AWS account
4. **Rotate access keys** regularly
5. **Use least privilege** IAM policies
6. **Enable CloudTrail** for audit logging
7. **Set up CloudWatch alarms** for unusual activity

## Cost Optimization

1. **DynamoDB**: Use on-demand billing for prototype phase
2. **S3**: Enable lifecycle policies to archive old reports
3. **Bedrock**: Monitor token usage and set budget alerts
4. **Cognito**: Free tier covers up to 50,000 MAUs

## Troubleshooting

### Cognito Issues
- Verify user pool and client IDs are correct
- Check password policy requirements
- Ensure email verification is configured

### DynamoDB Issues
- Verify table names match environment variables
- Check IAM permissions for DynamoDB operations
- Ensure GSI is created for date-based queries

### Bedrock Issues
- Verify model access is enabled in AWS Console
- Check region availability for Bedrock
- Ensure IAM user has bedrock:InvokeModel permission

### S3 Issues
- Verify bucket name is globally unique
- Check CORS configuration for web uploads
- Ensure encryption is enabled

## Next Steps

1. Set up AWS Amplify for hosting
2. Configure custom domain
3. Set up CloudWatch monitoring
4. Implement backup strategies
5. Set up CI/CD pipeline

## Support

For issues or questions:
- Check AWS documentation
- Review CloudWatch logs
- Contact AWS Support (if you have a support plan)

## Cost Estimate (Prototype Phase)

- **Cognito**: Free (< 50K MAUs)
- **DynamoDB**: ~$5-10/month (on-demand)
- **S3**: ~$1-5/month (< 100GB)
- **Bedrock**: ~$10-50/month (depends on usage)
- **Total**: ~$16-65/month for prototype phase
