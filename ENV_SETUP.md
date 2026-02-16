# Environment Setup Guide

This guide will help you set up the environment variables for the Ovira AI application.

## Prerequisites

- AWS Account with configured services
- AWS CLI installed and configured
- Node.js 18+ installed

## Step 1: Set Up AWS Services

Follow the [AWS Setup Guide](./AWS_SETUP_GUIDE.md) to configure all required AWS services:
- AWS Cognito User Pool
- DynamoDB Tables
- S3 Bucket
- Amazon Bedrock access
- IAM User and Policies

## Step 2: Create Environment File

Create a `.env.local` file in the root directory of the project:

```bash
touch .env.local
```

## Step 3: Add Environment Variables

Copy the following template into your `.env.local` file and replace the placeholder values with your actual AWS credentials and resource IDs:

```env
# AWS Configuration
# Get these from AWS IAM Console > Users > Security credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# AWS Cognito Configuration
# Get these from AWS Cognito Console > User pools
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_cognito_client_id
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# DynamoDB Table Names
# These should match the table names you created in AWS
NEXT_PUBLIC_DYNAMODB_USERS_TABLE=ovira-users
NEXT_PUBLIC_DYNAMODB_SYMPTOMS_TABLE=ovira-symptoms
NEXT_PUBLIC_DYNAMODB_REPORTS_TABLE=ovira-reports
NEXT_PUBLIC_DYNAMODB_CHAT_TABLE=ovira-chat-history

# S3 Configuration
# Get bucket name from AWS S3 Console
NEXT_PUBLIC_S3_REPORTS_BUCKET=ovira-reports-prototype
NEXT_PUBLIC_S3_REGION=us-east-1

# Amazon Bedrock Configuration (Server-side only)
# Ensure you have enabled model access in Bedrock Console
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_FALLBACK_MODEL_ID=amazon.titan-text-express-v1
BEDROCK_REGION=us-east-1

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Verify Configuration

After setting up your environment variables, verify that everything is configured correctly:

1. **Check AWS Credentials:**
   ```bash
   aws sts get-caller-identity
   ```

2. **Verify Cognito User Pool:**
   ```bash
   aws cognito-idp describe-user-pool --user-pool-id <YOUR_USER_POOL_ID>
   ```

3. **Verify DynamoDB Tables:**
   ```bash
   aws dynamodb list-tables
   ```

4. **Verify S3 Bucket:**
   ```bash
   aws s3 ls s3://ovira-reports-prototype
   ```

5. **Verify Bedrock Access:**
   ```bash
   aws bedrock list-foundation-models --region us-east-1
   ```

## Step 5: Run the Application

Once all environment variables are set up:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000)

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - The `.gitignore` file already excludes this file
   - Double-check before committing

2. **Use different credentials for development and production**
   - Create separate IAM users for each environment
   - Use AWS Secrets Manager for production

3. **Rotate credentials regularly**
   - Change access keys every 90 days
   - Enable MFA on your AWS account

4. **Use least privilege IAM policies**
   - Only grant necessary permissions
   - Review and audit permissions regularly

5. **Monitor AWS CloudWatch**
   - Set up alerts for unusual activity
   - Review logs regularly

## Troubleshooting

### Issue: "AWS credentials not configured"
**Solution:** Verify that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set correctly in `.env.local`

### Issue: "Cognito user pool not found"
**Solution:** Check that `NEXT_PUBLIC_COGNITO_USER_POOL_ID` matches your actual user pool ID in AWS Console

### Issue: "DynamoDB table does not exist"
**Solution:** Verify table names in `.env.local` match the tables created in AWS. Run the table creation commands from the AWS Setup Guide.

### Issue: "Bedrock model access denied"
**Solution:** Ensure you have enabled model access in the Amazon Bedrock Console under "Model access"

### Issue: "S3 bucket not found"
**Solution:** Verify the bucket name and ensure it exists in your AWS account

## Additional Resources

- [AWS Setup Guide](./AWS_SETUP_GUIDE.md) - Complete AWS service setup
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Amazon DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Amazon S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

## Support

If you encounter any issues:
1. Check the [AWS Setup Guide](./AWS_SETUP_GUIDE.md)
2. Review AWS CloudWatch logs
3. Verify IAM permissions
4. Check AWS service quotas and limits

For additional help, contact: support@ovira-ai.com
