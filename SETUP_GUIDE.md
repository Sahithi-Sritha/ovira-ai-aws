# 🚀 Ovira AI - Complete Setup Guide

This guide will walk you through setting up all the required AWS services and environment variables for Ovira AI.

## 📋 Prerequisites

- Node.js 18+ installed
- AWS Account with billing enabled
- AWS CLI installed and configured
- Basic understanding of AWS services

---

## 🔧 Step-by-Step Setup

### 1️⃣ AWS IAM User Setup

**Create an IAM user with programmatic access:**

1. Go to AWS Console → IAM → Users → Add User
2. User name: `ovira-ai-dev`
3. Select: **Access key - Programmatic access**
4. Attach the following policies:
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonCognitoPowerUser`
   - `AmazonBedrockFullAccess`
   - `AmazonSESFullAccess` (optional)
5. Download the credentials CSV file
6. Copy `Access Key ID` and `Secret Access Key`

**Add to .env:**
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_REGION=us-east-1
```

---

### 2️⃣ Amazon Cognito Setup

**Create User Pool:**

1. Go to AWS Console → Cognito → User Pools → Create
2. **Configure sign-in experience:**
   - Sign-in options: Email
   - User name requirements: Allow email addresses
3. **Configure security requirements:**
   - Password policy: Cognito defaults (or customize)
   - MFA: Optional (recommended: OFF for development)
4. **Configure sign-up experience:**
   - Self-registration: Enabled
   - Required attributes: email, name, birthdate
   - Custom attributes: Add `custom:onboardingComplete` (String)
5. **Configure message delivery:**
   - Email provider: Send email with Cognito (for dev)
   - FROM email address: no-reply@verificationemail.com
6. **Integrate your app:**
   - User pool name: `ovira-ai-users`
   - App client name: `ovira-web-client`
   - **Client secret:** Generate (required for server-side auth)
   - Authentication flows: 
     - ✅ ALLOW_USER_PASSWORD_AUTH
     - ✅ ALLOW_REFRESH_TOKEN_AUTH
     - ✅ ALLOW_USER_SRP_AUTH
7. Review and create

**After creation:**
- Copy **User Pool ID** (format: `us-east-1_xxxxxxxxx`)
- Go to App Integration → App clients → Copy **Client ID**
- Click "Show client secret" → Copy **Client Secret**

**Add to .env:**
```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

### 3️⃣ Amazon DynamoDB Setup

**Option A: Automated Setup (Recommended)**

```bash
# Run the setup script
npm run setup-tables

# Or manually:
node scripts/create-tables.mjs
```

**Option B: Manual Setup**

Create the following tables in DynamoDB Console:

| Table Name | Partition Key | Sort Key | GSI |
|------------|---------------|----------|-----|
| `ovira-users` | `userId` (S) | - | `email-index` on `email` |
| `ovira-symptoms` | `id` (S) | - | `userId-date-index` on `userId` + `date` |
| `ovira-reports` | `reportId` (S) | - | `userId-index` on `userId` |
| `ovira-chat-history` | `userId` (S) | `timestamp` (N) | - |
| `ovira-articles` | `articleId` (S) | - | - |
| `ovira-documents` | `documentId` (S) | - | `userId-index` on `userId` |
| `ovira-doctors` | `doctorId` (S) | - | - |
| `ovira-appointments` | `appointmentId` (S) | - | `userId-index` on `userId` |

**Settings for all tables:**
- Billing mode: On-demand (or Provisioned: 5 RCU / 5 WCU)
- Encryption: AWS owned key

**Add to .env:**
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

---

### 4️⃣ Amazon Bedrock Setup

**Enable Bedrock Models:**

1. Go to AWS Console → Bedrock → Model access
2. Click **Manage model access**
3. Enable the following models:
   - ✅ **Claude 3 Haiku** (anthropic.claude-3-haiku-20240307-v1:0)
   - ✅ **Nova Micro** (amazon.nova-micro-v1:0)
   - ✅ **Titan Text Embeddings V2** (amazon.titan-embed-text-v2:0)
4. Submit request (usually instant approval)

**Add to .env:**
```bash
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_FALLBACK_MODEL_ID=amazon.nova-micro-v1:0
BEDROCK_REGION=us-east-1
```

**Create Knowledge Bases (Optional but Recommended):**

**Chatbot Knowledge Base:**
1. Go to Bedrock → Knowledge bases → Create
2. Name: `ovira-chatbot-kb`
3. Data source: S3
4. Upload documents to S3:
   - WHO Menstrual Health Fact Sheet
   - ACOG PCOS Patient Guide
   - OWH Endometriosis Overview
5. Embeddings model: Titan Text Embeddings V2
6. Vector database: Amazon OpenSearch Serverless (auto-created)
7. Create and sync

**Clinical Knowledge Base:**
1. Repeat above steps
2. Name: `ovira-clinical-kb`
3. Upload clinical documents:
   - ACOG Clinical Practice Guideline No. 7
   - WHO PCOS Guidelines
   - NIH Iron Deficiency Guidelines
   - FIGO Heavy Menstrual Bleeding Guidelines

**Add to .env:**
```bash
BEDROCK_CHATBOT_KB_ID=XXXXXXXXXX
BEDROCK_CLINICAL_KB_ID=YYYYYYYYYY
```

---

### 5️⃣ Amazon S3 Setup

**Create Buckets:**

```bash
# Using AWS CLI
aws s3 mb s3://ovira-reports-prototype --region us-east-1
aws s3 mb s3://ovira-documents --region us-east-1
aws s3 mb s3://ovira-knowledge-base --region us-east-1
```

**Configure CORS for file uploads:**

Create `cors-config.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS:
```bash
aws s3api put-bucket-cors --bucket ovira-reports-prototype --cors-configuration file://cors-config.json
aws s3api put-bucket-cors --bucket ovira-documents --cors-configuration file://cors-config.json
```

**Add to .env:**
```bash
S3_REPORTS_BUCKET=ovira-reports-prototype
NEXT_PUBLIC_S3_REPORTS_BUCKET=ovira-reports-prototype
S3_DOCUMENTS_BUCKET=ovira-documents
S3_KNOWLEDGE_BASE_BUCKET=ovira-knowledge-base
```

---

### 6️⃣ MenstLLaMA EC2 Setup (Optional)

**Launch EC2 Instance:**

1. Go to EC2 → Launch Instance
2. **Name:** `ovira-menstllama-server`
3. **AMI:** Ubuntu Server 22.04 LTS
4. **Instance type:** t3.medium (minimum) or t3.large (recommended)
5. **Key pair:** Create or select existing
6. **Security group:** 
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 8080) from anywhere (or your app's IP)
7. **Storage:** 30 GB gp3
8. Launch instance

**Deploy MenstLLaMA:**

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Run deployment script (if available)
# Or manually install:
sudo apt update && sudo apt install -y python3-pip
pip3 install llama-cpp-python fastapi uvicorn

# Download MenstLLaMA model (GGUF format)
wget https://huggingface.co/your-model-path/menstllama-q4.gguf

# Create inference server (see scripts/deploy-menstllama-ec2.sh)
# Start server
uvicorn main:app --host 0.0.0.0 --port 8080
```

**Add to .env:**
```bash
MENSTLLAMA_EC2_URL=http://your-ec2-public-ip:8080
```

---

### 7️⃣ Upstash Redis Setup (Optional - for Rate Limiting)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up / Log in
3. Create Database → Redis
4. Name: `ovira-ratelimit`
5. Region: Choose closest to your AWS region
6. Copy **REST URL** and **REST Token**

**Add to .env:**
```bash
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx
```

---

### 8️⃣ Generate Application Secrets

**Generate NEXTAUTH_SECRET:**

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Add to .env:**
```bash
NEXTAUTH_SECRET=your_generated_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🎯 Final Setup Steps

### 1. Create .env.local file

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your actual values
# (Use the values you collected from steps 1-8)
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Setup

```bash
# Check if tables exist
node scripts/check-tables.mjs

# Test AWS connections
npm run test
```

### 4. Seed Demo Data (Optional)

```bash
# Creates demo user "Priya" with 365 days of data
node scripts/seed-demo-data.mjs
```

### 5. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## ✅ Setup Checklist

Use this checklist to track your progress:

- [ ] AWS IAM user created with credentials
- [ ] Cognito User Pool created
- [ ] Cognito App Client created (with secret)
- [ ] All 8 DynamoDB tables created
- [ ] Bedrock models enabled (Claude Haiku, Nova Micro)
- [ ] Bedrock Knowledge Bases created (optional)
- [ ] S3 buckets created with CORS configured
- [ ] MenstLLaMA EC2 deployed (optional)
- [ ] Upstash Redis created (optional)
- [ ] NEXTAUTH_SECRET generated
- [ ] .env.local file created and populated
- [ ] Dependencies installed (`npm install`)
- [ ] Development server running (`npm run dev`)

---

## 🐛 Troubleshooting

### Issue: "AWS credentials not configured"
**Solution:** Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set in `.env.local`

### Issue: "Cognito User Pool not found"
**Solution:** Verify `NEXT_PUBLIC_COGNITO_USER_POOL_ID` matches your actual User Pool ID

### Issue: "DynamoDB table does not exist"
**Solution:** Run `node scripts/create-tables.mjs` to create all tables

### Issue: "Bedrock model access denied"
**Solution:** Go to Bedrock Console → Model access → Enable required models

### Issue: "CORS error when uploading files"
**Solution:** Apply CORS configuration to S3 buckets (see Step 5)

### Issue: "MenstLLaMA not responding"
**Solution:** 
- Check EC2 instance is running
- Verify security group allows port 8080
- Test: `curl http://your-ec2-ip:8080/health`

---

## 📚 Additional Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Amazon Cognito Developer Guide](https://docs.aws.amazon.com/cognito/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Enable debug mode: `DEBUG=true` in .env.local
4. Check browser console for client-side errors

---

**🎉 Congratulations! Your Ovira AI development environment is ready!**
