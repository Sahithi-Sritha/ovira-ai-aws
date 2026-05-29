# 🔑 Environment Variables Reference

Quick reference guide for all environment variables used in Ovira AI.

## 📊 Variables Summary

| Category | Required | Optional | Total |
|----------|----------|----------|-------|
| AWS Core | 3 | 0 | 3 |
| Cognito | 3 | 2 | 5 |
| DynamoDB | 8 | 0 | 8 |
| Bedrock | 3 | 2 | 5 |
| S3 | 2 | 2 | 4 |
| MenstLLaMA | 0 | 1 | 1 |
| Redis | 0 | 2 | 2 |
| SES | 0 | 2 | 2 |
| Next.js | 2 | 0 | 2 |
| App | 1 | 1 | 2 |
| **TOTAL** | **22** | **12** | **34** |

---

## 🔴 Required Variables (22)

These MUST be set for the app to function:

### AWS Core (3)
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
```

### Amazon Cognito (3)
```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Amazon DynamoDB (8)
```bash
DYNAMODB_USERS_TABLE=ovira-users
DYNAMODB_SYMPTOMS_TABLE=ovira-symptoms
DYNAMODB_REPORTS_TABLE=ovira-reports
DYNAMODB_CHAT_TABLE=ovira-chat-history
DYNAMODB_ARTICLES_TABLE=ovira-articles
DYNAMODB_DOCUMENTS_TABLE=ovira-documents
DYNAMODB_DOCTORS_TABLE=ovira-doctors
DYNAMODB_APPOINTMENTS_TABLE=ovira-appointments
```

### Amazon Bedrock (3)
```bash
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_FALLBACK_MODEL_ID=amazon.nova-micro-v1:0
BEDROCK_REGION=us-east-1
```

### Amazon S3 (2)
```bash
S3_REPORTS_BUCKET=ovira-reports-prototype
NEXT_PUBLIC_S3_REPORTS_BUCKET=ovira-reports-prototype
```

### Next.js (2)
```bash
NEXTAUTH_SECRET=your_generated_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Application (1)
```bash
NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

## 🟡 Optional Variables (12)

These enhance functionality but aren't required:

### Cognito Optional (2)
```bash
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Bedrock Knowledge Bases (2)
```bash
BEDROCK_CHATBOT_KB_ID=XXXXXXXXXX
BEDROCK_CLINICAL_KB_ID=YYYYYYYYYY
```
*Without these: AI responses won't have RAG grounding*

### S3 Additional Buckets (2)
```bash
S3_DOCUMENTS_BUCKET=ovira-documents
S3_KNOWLEDGE_BASE_BUCKET=ovira-knowledge-base
```

### MenstLLaMA (1)
```bash
MENSTLLAMA_EC2_URL=http://your-ec2-public-ip:8080
```
*Without this: Domain queries fall back to Bedrock*

### Upstash Redis (2)
```bash
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx
```
*Without these: Rate limiting is disabled*

### Amazon SES (2)
```bash
SES_FROM_EMAIL=noreply@yourdomain.com
SES_REGION=us-east-1
```
*Without these: Email features won't work*

### Application (1)
```bash
DEBUG=false
NODE_ENV=development
```

---

## 🎯 Variable Usage by Feature

### Core Authentication
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET`
- `NEXT_PUBLIC_AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### AI Chat (Aria)
- `BEDROCK_MODEL_ID`
- `BEDROCK_FALLBACK_MODEL_ID`
- `BEDROCK_REGION`
- `BEDROCK_CHATBOT_KB_ID` (optional)
- `MENSTLLAMA_EC2_URL` (optional)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Symptom Logging
- `DYNAMODB_SYMPTOMS_TABLE`
- `DYNAMODB_USERS_TABLE`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

### Health Reports
- `DYNAMODB_REPORTS_TABLE`
- `DYNAMODB_SYMPTOMS_TABLE`
- `S3_REPORTS_BUCKET`
- `BEDROCK_CLINICAL_KB_ID` (optional)
- `BEDROCK_MODEL_ID`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Doctor Booking
- `DYNAMODB_DOCTORS_TABLE`
- `DYNAMODB_APPOINTMENTS_TABLE`
- `SES_FROM_EMAIL` (optional)
- `SES_REGION` (optional)

### Document Upload
- `DYNAMODB_DOCUMENTS_TABLE`
- `S3_DOCUMENTS_BUCKET` (optional)
- `NEXT_PUBLIC_S3_REPORTS_BUCKET`

### Rate Limiting
- `UPSTASH_REDIS_REST_URL` (optional)
- `UPSTASH_REDIS_REST_TOKEN` (optional)

---

## 🔍 Variable Naming Conventions

### `NEXT_PUBLIC_*` Prefix
Variables with this prefix are exposed to the browser (client-side).
**⚠️ Never put secrets in NEXT_PUBLIC_* variables!**

Examples:
- ✅ `NEXT_PUBLIC_COGNITO_USER_POOL_ID` (safe - public identifier)
- ✅ `NEXT_PUBLIC_APP_URL` (safe - public URL)
- ❌ `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY` (NEVER do this!)

### Server-Side Only
Variables without `NEXT_PUBLIC_` are only available in server-side code (API routes, server components).

Examples:
- `AWS_SECRET_ACCESS_KEY`
- `COGNITO_CLIENT_SECRET`
- `NEXTAUTH_SECRET`

---

## 🛠️ How to Get Each Value

| Variable | Where to Get It |
|----------|-----------------|
| `AWS_ACCESS_KEY_ID` | IAM Console → Users → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | IAM Console → Create access key |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Cognito Console → User pools → Your pool |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Cognito → App integration → App clients |
| `COGNITO_CLIENT_SECRET` | Cognito → App clients → Show client secret |
| `DYNAMODB_*_TABLE` | DynamoDB Console → Tables (or use default names) |
| `BEDROCK_MODEL_ID` | Bedrock Console → Model access |
| `BEDROCK_*_KB_ID` | Bedrock Console → Knowledge bases |
| `S3_*_BUCKET` | S3 Console → Buckets (or create new) |
| `MENSTLLAMA_EC2_URL` | EC2 Console → Instance → Public IPv4 DNS |
| `UPSTASH_REDIS_REST_URL` | Upstash Console → Database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Database → REST API |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |

---

## 🚨 Security Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore`
- Use different credentials for dev/staging/production
- Rotate AWS access keys regularly
- Use IAM roles with minimal permissions
- Generate strong NEXTAUTH_SECRET (32+ characters)
- Use environment-specific S3 buckets

### ❌ DON'T:
- Commit `.env.local` to Git
- Share credentials in Slack/email
- Use root AWS account credentials
- Put secrets in `NEXT_PUBLIC_*` variables
- Use production credentials in development
- Hardcode secrets in source code

---

## 📝 Environment-Specific Configurations

### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEBUG=true
```

### Staging (.env.staging)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.ovira.ai
DEBUG=false
# Use staging-specific AWS resources
```

### Production (.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ovira.ai
DEBUG=false
# Use production AWS resources with strict IAM policies
```

---

## 🧪 Testing Your Configuration

### Quick Test Script

Create `test-env.js`:
```javascript
const requiredVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
  'NEXT_PUBLIC_COGNITO_CLIENT_ID',
  'COGNITO_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
];

const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ Missing required variables:', missing);
  process.exit(1);
}

console.log('✅ All required environment variables are set!');
```

Run:
```bash
node -r dotenv/config test-env.js
```

---

## 📞 Support

If you're missing a variable or unsure about a value:
1. Check `SETUP_GUIDE.md` for detailed setup instructions
2. Review AWS Console for resource identifiers
3. Verify `.env.local` is in the project root
4. Restart dev server after changing variables

---

**Last Updated:** 2026-05-29
