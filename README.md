# Ovira AI - Women's Health Symptom Intelligence Platform

<div align="center">

**AI-powered women's health companion for symptom tracking, pattern analysis, and decision-support insights using AWS services.**

[AWS Setup Guide](./AWS_SETUP_GUIDE.md) • [Migration Plan](./AWS_MIGRATION_PLAN.md) • [Documentation](#features)

</div>

---

## ✨ Features

### 🗓️ Smart Period Tracking
- Cycle day indicator with phase visualization
- Next period prediction based on cycle history
- Customizable average cycle length

### 📝 Symptom Logging
- Flow level tracking (none, light, medium, heavy)
- Pain scale (0-10) with visual slider
- Mood tracking with emoji icons
- Energy level monitoring
- Sleep hours logging
- Additional symptom checkboxes
- Optional notes

### 🤖 AI Health Companion (AWS Bedrock)
- Amazon Bedrock-powered chat assistant (Claude 3 Haiku)
- Empathetic, stigma-free responses
- Educational health information (non-diagnostic)
- Decision-support only - encourages professional consultation
- Medical safety guardrails
- Suggested starter questions

### 📊 Health Reports
- Pattern analysis across logged data
- Non-diagnostic statistical indicators
- Personalized recommendations
- Export-ready for doctor visits
- Stored securely in Amazon S3

### 🔒 Privacy & Security
- AWS Cognito Authentication (Email/Password)
- Encrypted data storage in DynamoDB
- End-to-end encryption (TLS 1.3)
- Data encryption at rest (KMS)
- User-only data access via IAM policies
- Data export and account deletion

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS Account with configured services (see [AWS Setup Guide](./AWS_SETUP_GUIDE.md))
- AWS CLI installed and configured

### Installation

1. **Clone the repository**
   ```bash
   cd OVIRA
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up AWS services**
   
   Follow the comprehensive [AWS Setup Guide](./AWS_SETUP_GUIDE.md) to configure:
   - AWS Cognito User Pool
   - DynamoDB Tables
   - S3 Bucket
   - Amazon Bedrock access
   - IAM User and Policies

4. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key

   # AWS Cognito
   NEXT_PUBLIC_AWS_REGION=us-east-1
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_user_pool_id
   NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
   NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=your_identity_pool_id

   # DynamoDB Tables
   NEXT_PUBLIC_DYNAMODB_USERS_TABLE=ovira-users
   NEXT_PUBLIC_DYNAMODB_SYMPTOMS_TABLE=ovira-symptoms
   NEXT_PUBLIC_DYNAMODB_REPORTS_TABLE=ovira-reports
   NEXT_PUBLIC_DYNAMODB_CHAT_TABLE=ovira-chat-history

   # S3
   NEXT_PUBLIC_S3_REPORTS_BUCKET=ovira-reports-prototype
   NEXT_PUBLIC_S3_REGION=us-east-1

   # Amazon Bedrock
   BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
   BEDROCK_FALLBACK_MODEL_ID=amazon.titan-text-express-v1
   BEDROCK_REGION=us-east-1
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
ovira-ai/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth routes (login, signup, onboarding)
│   │   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── api/                  # API routes (chat, analyze, reports)
│   │   ├── layout.tsx            # Root layout with AuthProvider
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css           # Design system
│   ├── components/
│   │   └── ui/                   # Reusable UI components
│   ├── contexts/
│   │   └── auth-context.tsx      # AWS Cognito authentication state
│   ├── lib/
│   │   └── aws/                  # AWS service integrations
│   │       ├── config.ts         # AWS configuration
│   │       ├── cognito.ts        # Cognito authentication
│   │       ├── dynamodb.ts       # DynamoDB operations
│   │       ├── s3.ts             # S3 file operations
│   │       └── bedrock.ts        # Bedrock AI services
│   └── types/                    # TypeScript type definitions
├── .kiro/specs/ovira-ai/         # Design & requirements docs
├── AWS_SETUP_GUIDE.md            # Comprehensive AWS setup guide
├── AWS_MIGRATION_PLAN.md         # Migration from Firebase to AWS
└── ENV_SETUP.md                  # Environment setup guide
```

---

## 🎨 Design System

### Color Palette

| Token | Usage |
|-------|-------|
| `primary` (#7C3AED) | Primary actions, main brand color |
| `secondary` (#14B8A6) | Secondary actions |
| `accent` (#EC4899) | Highlights, badges |
| `success` (#10B981) | Success states |
| `warning` (#F59E0B) | Warning indicators |
| `error` (#EF4444) | Error states |

### Typography
- **Font**: Inter (Google Fonts)
- Premium, medical-grade aesthetic
- Accessible spacing and sizing

---

## 🔧 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: AWS Cognito
- **Database**: Amazon DynamoDB
- **Storage**: Amazon S3
- **AI**: Amazon Bedrock (Claude 3 Haiku, Titan Text Express)
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Dates**: date-fns
- **PDF Generation**: @react-pdf/renderer

---

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in page |
| `/signup` | Create account |
| `/onboarding` | User setup wizard |
| `/dashboard` | Main dashboard |
| `/log` | Symptom logging form |
| `/chat` | AI chat interface |
| `/reports` | Health analysis |
| `/settings` | User settings |

---

## 🏗️ AWS Architecture

### Services Used

1. **AWS Cognito**: User authentication and authorization
2. **Amazon DynamoDB**: NoSQL database for user data and symptom logs
3. **Amazon S3**: Secure storage for health reports (PDFs)
4. **Amazon Bedrock**: AI/LLM services for chat and analysis
5. **AWS IAM**: Access control and security policies
6. **AWS KMS**: Encryption key management

### Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web/Mobile    │    │   API Gateway    │    │  Lambda/Next.js │
│   Frontend      │◄──►│   + Cognito      │◄──►│   API Routes    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AI Processing Layer                       │
│  ┌─────────────────┐              ┌─────────────────────────────┐│
│  │ Amazon Bedrock  │              │     Pattern Analysis        ││
│  │ (Claude/Titan)  │              │   (Statistical Models)      ││
│  └─────────────────┘              └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                              │
│  ┌─────────────────┐              ┌─────────────────────────────┐│
│  │   DynamoDB      │              │         Amazon S3           ││
│  │ (User & Symptom │              │  (Reports & Documents)      ││
│  │     Data)       │              │                             ││
│  └─────────────────┘              └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Medical Disclaimer & Responsible AI

> **IMPORTANT**: Ovira AI provides health insights for **informational and decision-support purposes only**. This is NOT a substitute for professional medical advice, diagnosis, or treatment.

### Responsible AI Principles

1. **Non-Diagnostic**: All AI outputs are statistical patterns, not medical diagnoses
2. **Decision-Support Only**: Provides information to support healthcare decisions
3. **Encourages Consultation**: Always recommends consulting healthcare providers
4. **Medical Safety Guardrails**: Blocks diagnostic and treatment language
5. **Transparent Limitations**: Clear about AI capabilities and boundaries
6. **Synthetic Data Training**: No real patient data used in AI training

### Prohibited AI Outputs

The system is designed to NEVER:
- Provide medical diagnoses
- Recommend specific treatments or medications
- Name diseases or medical conditions
- Replace professional medical consultation

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🔐 Security

### Reporting Security Issues

Please report security vulnerabilities to: security@ovira-ai.com

### Security Features

- End-to-end encryption (TLS 1.3)
- Data encryption at rest (AWS KMS)
- AWS Cognito MFA support
- IAM least privilege access
- Regular security audits
- OWASP compliance

---

## 📊 Cost Estimate

### Prototype Phase (~100 users)

- **AWS Cognito**: Free (< 50K MAUs)
- **DynamoDB**: ~$5-10/month
- **S3**: ~$1-5/month
- **Bedrock**: ~$10-50/month
- **Total**: ~$16-65/month

### Production Phase (10K users)

- **AWS Cognito**: ~$50/month
- **DynamoDB**: ~$50-100/month
- **S3**: ~$10-20/month
- **Bedrock**: ~$200-500/month
- **Total**: ~$310-670/month

---

## 📚 Documentation

- [AWS Setup Guide](./AWS_SETUP_GUIDE.md) - Complete AWS service setup
- [Migration Plan](./AWS_MIGRATION_PLAN.md) - Firebase to AWS migration details
- [Design Document](./.kiro/specs/ovira-ai/design.md) - System architecture
- [Requirements Document](./.kiro/specs/ovira-ai/requirements.md) - Feature requirements

---

## 🆘 Support

For issues or questions:
- Check [AWS Setup Guide](./AWS_SETUP_GUIDE.md)
- Review CloudWatch logs
- Open an issue on GitHub
- Contact: support@ovira-ai.com

---

<div align="center">
Made with ❤️ for women's health | Powered by AWS
</div>
