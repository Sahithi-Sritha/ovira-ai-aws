# OVIRA AI
## Women's Health Intelligence Platform

**Engineering Design Overview**

---

## Executive Summary

### What is OVIRA AI?

OVIRA AI is a full-stack AI-powered health companion for women experiencing menstrual health challenges. The platform combines symptom tracking, conversational AI assistance, and clinical report generation into a unified system designed for the Indian healthcare market.

### The Problem

Women struggle to communicate menstrual health symptoms effectively to healthcare providers. Symptoms are scattered across notes apps, calendars, and memory. Cultural taboos around menstruation limit access to accurate information. Doctor consultations are brief (15 minutes average) and lack structured health history, leading to delayed care for conditions like PCOS and endometriosis.

### The Solution

A comprehensive platform that:
- Tracks daily symptoms with automatic cycle pattern analysis
- Provides AI-powered health guidance trained on menstrual health knowledge
- Generates doctor-ready health reports with statistical analysis and risk assessment
- Enables structured pre-visit health summaries for gynecologist consultations

### Target Users

**Primary:** Indian women aged 18-45 with menstrual health concerns  
**Secondary:** Women managing PCOS, endometriosis, or irregular cycles requiring long-term tracking  
**Future:** Healthcare providers through clinical portal (Q4 2025)

### Key Engineering Innovation

**Hybrid AI Architecture:** The system intelligently routes queries between a domain-specific fine-tuned model (hosted on EC2) and a general-purpose LLM (Amazon Bedrock) based on content classification. This approach achieves 66% cost reduction compared to single-model architectures while maintaining response quality through a multi-layer fallback chain.

### Core Value Proposition

1. Intelligent symptom tracking with automatic cycle predictions
2. 24/7 AI companion trained on 23,820 menstrual health Q&As
3. Privacy-first design compliant with Indian DPDP Act
4. Cost-optimized infrastructure enabling affordable scaling
5. Medically safe AI responses with compliance guardrails

---

## Product Journey

### Complete User Flow

```
┌──────────────┐
│  Sign Up     │  Email verification via Cognito
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Onboarding  │  6-step health profile wizard
│              │  • Menstrual history
│              │  • Health conditions
│              │  • Lifestyle & diet
│              │  • Personal health goals
│              │  → Builds personalized AI context
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Dashboard   │  Cycle tracking hub
│              │  • Period countdown
│              │  • Current cycle phase
│              │  • Logging streak
│              │  • Health notifications
└──────┬───────┘
       │
       ├─────────────────────┬─────────────────────┬─────────────────┐
       ↓                     ↓                     ↓                 ↓
┌──────────────┐     ┌──────────────┐     ┌──────────────┐  ┌──────────────┐
│ Log Symptoms │     │  Chat with   │     │Generate      │  │Upload Medical│
│              │     │  AI (Aria)   │     │Health Reports│  │Documents     │
│ • Flow       │     │              │     │              │  │              │
│ • Pain       │     │ • Menstrual  │     │ • Statistical│  │ • Blood tests│
│ • Mood       │     │   health Q&A │     │   analysis   │  │ • Ultrasounds│
│ • Energy     │     │ • Personalized│    │ • Risk flags │  │ • Prescriptions│
│ • Sleep      │     │   to profile │     │ • Doctor Q's │  │              │
│ • Symptoms   │     │              │     │              │  │              │
└──────┬───────┘     └──────────────┘     └──────┬───────┘  └──────────────┘
       │                                          │
       └──────────────────────────────────────────┘
                            ↓
                   ┌──────────────┐
                   │Find Doctors  │  Browse gynecologists
                   └──────┬───────┘
                          ↓
                   ┌──────────────┐
                   │Book          │  Schedule appointment
                   │Appointment   │  Generate pre-visit summary
                   └──────┬───────┘
                          ↓
                   ┌──────────────┐
                   │Send Summary  │  Email health report to doctor
                   │to Doctor     │
                   └──────┬───────┘
                          ↓
                   ┌──────────────┐
                   │Doctor Visit  │  Structured consultation
                   └──────────────┘
```

### Value Accumulation

The platform's value increases with usage:
- More symptom logs → Better cycle predictions
- Richer health context → More personalized AI responses
- Historical data → More accurate health reports
- Pattern detection → Earlier identification of health risks

---

## High-Level Architecture

```
                            ┌──────────────────────┐
                            │   Next.js Web App    │
                            │  React 18 + TypeScript│
                            └──────────┬───────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     │                                   │
             ┌───────▼────────┐              ┌──────────▼─────────┐
             │ Amazon Cognito │              │   API Layer        │
             │ Authentication │              │  13 Serverless     │
             │                │              │  Routes            │
             └────────────────┘              └──────────┬─────────┘
                                                        │
                                    ┌───────────────────┼───────────────────┐
                                    │                   │                   │
                          ┌─────────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
                          │   AI Router      │  │  DynamoDB   │  │    Amazon S3    │
                          │ Smart Classifier │  │  8 Tables   │  │   3 Buckets     │
                          └─────────┬────────┘  └─────────────┘  └─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │ (70%)         │ (30%)         │
         ┌──────────▼──────┐  ┌────▼────────┐  ┌──▼──────────────┐
         │  MenstLLaMA     │  │   Bedrock   │  │  Static         │
         │  EC2 Instance   │  │   Claude    │  │  Fallback       │
         │  Domain Model   │  │  + Local RAG│  │                 │
         └─────────────────┘  └─────┬───────┘  └─────────────────┘
                                    │
                              ┌─────▼──────┐
                              │ Knowledge  │
                              │   Files    │
                              │ WHO, ACOG  │
                              └────────────┘
```

### Architecture Philosophy

The system follows a **serverless-first approach** with strategic exceptions for cost optimization. All components scale independently with zero operational overhead, except for the domain-specific AI model which runs on managed EC2 for cost efficiency. The architecture prioritizes resilience through multi-layer fallbacks, ensuring the system degrades gracefully rather than failing completely. Health data remains isolated within user-scoped partitions, and personally identifiable information never reaches AI models.

---

## System Flow

### Complete AI Request Journey

A user asks: *"Why do I get cramps before my period?"*

**1. User Input → Frontend**  
The message is captured in the chat interface. The frontend fetches the user's complete health context from DynamoDB (age range, health conditions, cycle information, recent symptoms).

**2. Frontend → API Layer**  
POST request to `/api/chat` with the message, conversation history, and user ID.

**3. API Layer → Health Context Builder**  
The API constructs a comprehensive health profile by:
- Fetching user demographics and health conditions
- Retrieving uploaded medical documents with AI summaries
- Calculating 30-day symptom trends (average pain, common symptoms)
- Combining into a structured context string

**4. API Layer → AI Router**  
The router analyzes the message content:
- Detects menstrual health keywords ("cramps", "period")
- Classification result: Domain-specific query
- Routes to specialized model

**5. AI Router → MenstLLaMA (EC2)**  
The domain model receives:
- User message
- Complete health context
- Conversation history (last 10 messages)

The fine-tuned LLaMA 3 model processes the request using knowledge from 23,820 Indian menstrual health conversations.

**6. MenstLLaMA → Response Generation**  
If successful, returns specialized response.  
If EC2 is unavailable, fallback chain activates:
- Try Bedrock Claude with local RAG
- Try Bedrock Claude without RAG  
- Try Amazon Nova Micro
- Return static keyword-based response

**7. Response → Medical Safety Layer**  
The sanitization function checks for prohibited medical terms:
- "diagnose", "prescribe", "treatment", "cure"
- Flags violations for human review
- Logs to CloudWatch for compliance audit

**8. API Response → Frontend**  
Returns JSON containing:
- AI-generated message
- Model used (displayed as badge)
- Citations (if RAG was used)
- Performance metadata

**9. Frontend → User Display**  
The response renders with:
- Formatted markdown text
- Source citations as footnotes
- Model indicator badge
- Conversation saved to DynamoDB

The entire journey completes in approximately 2 seconds, with the majority of time spent in model inference rather than infrastructure overhead.

---

## Engineering Decisions

| Decision | Reason | Tradeoff | Alternative Considered |
|----------|--------|----------|----------------------|
| **Hybrid AI Architecture** | Cost optimization: 70% of queries routed to fixed-cost domain model (EC2), 30% to pay-per-token general LLM (Bedrock). Domain specialization provides better accuracy for menstrual health queries. | Added routing complexity. Single point of failure with EC2 (mitigated by fallback chain). Operational overhead for EC2 management. | Single LLM for all queries (3x more expensive: $5,625 vs $1,958/month at 100K users) |
| **Local RAG with TF-IDF** | Eliminates API costs ($0 vs $30/month for Bedrock Knowledge Bases). Synchronous execution without network latency. Simpler debugging with interpretable word frequencies. | Lower semantic accuracy (80% vs 95% for neural embeddings). No cross-lingual support. Weaker on paraphrased queries. | Bedrock Knowledge Bases with Titan Embeddings (managed service, higher accuracy, monthly cost) |
| **DynamoDB over RDS** | Serverless-compatible with HTTP API, no connection pooling issues. Auto-scaling with pay-per-request billing. Predictable sub-10ms latency for key-based queries. | No SQL joins, requires denormalized data model. Eventual consistency on Global Secondary Indexes. Learning curve for query pattern design. | PostgreSQL on RDS (relational model, SQL queries, connection limits in serverless) |
| **Client-Side Cycle Analysis** | Zero API latency for dashboard updates. Reduced infrastructure costs through fewer API calls. Calculations work offline. | Logic duplication if server-side calculations needed later. Limited by browser compute (acceptable for date arithmetic). | Server-side calculation in API routes (higher latency, more API load) |
| **Serverless (Next.js/Vercel)** | Zero operational overhead. Auto-scaling from zero to thousands of requests. Unified codebase for frontend and backend with shared TypeScript types. | Cold starts add 400ms on first request to new worker. Limited to 10-second execution on free tier. Less control over runtime environment. | Containerized Express.js on ECS (more control, warm starts, operational complexity) |
| **Cognito for Authentication** | Managed service eliminates auth implementation. Email verification built-in. JWT standard for API security. Free tier covers first 50K users. | Less UI customization flexibility. SECRET_HASH complexity for API calls. | Auth0 (expensive beyond free tier), Firebase Auth (vendor lock-in), custom JWT (security risk) |
| **Medical Safety Guardrails** | Regulatory compliance with Indian DPDP Act. Prevents diagnostic claims that create legal liability. Maintains trust through responsible AI. | False positives may flag benign content. Requires human review queue (not yet fully implemented). Over-filtering could degrade UX. | No guardrails (legal risk), Block all flagged responses (poor UX), Third-party content moderation API (cost) |

---

## Security & Privacy

### Authentication

```
User credentials → Calculate SECRET_HASH (HMAC-SHA256)
                 ↓
         Cognito authenticates
                 ↓
    Returns JWT tokens (id, access, refresh)
                 ↓
      Stored in browser localStorage
                 ↓
    API validates JWT signature on every request
```

**Security Measure:** SECRET_HASH prevents unauthorized clients from calling Cognito APIs. Only the server possesses the CLIENT_SECRET required for HMAC calculation.

---

### Authorization

**Current Implementation:**  
API routes receive `userId` from request body and validate against token claims.

**Known Gap:**  
The system currently trusts client-provided `userId` rather than extracting from JWT token. This creates a trust boundary issue. Production deployment will extract `userId` from validated token claims.

---

### Medical AI Safety

**Challenge:** AI models may generate diagnostic language ("you have PCOS") which violates medical regulations and creates legal liability.

**Three-Layer Approach:**

1. **System Prompt Engineering**
```
Prohibited terms: diagnose, treatment, cure, prescribe, disease
Required alternatives: "pattern consistent with", "worth discussing with doctor"
```

2. **Response Sanitization**
```typescript
function sanitizeResponse(text) {
  if (contains prohibited medical terms) {
    log to CloudWatch with timestamp and term
    flag for human review
  }
  return text; // Don't block to avoid over-filtering
}
```

3. **Human Review Queue**  
Flagged responses logged for weekly compliance audit. Infrastructure ready for SQS-based review workflow.

---

### Privacy Protection

**Data Minimization:**

What is NOT sent to AI models:
- Email addresses, full names
- Exact birthdates (only age ranges: "25-30")
- Raw medical documents
- Personally identifiable health records

What IS sent to AI models:
- Aggregated statistics (average pain level: 6.5)
- Structured health data (conditions: ["PCOS"])
- De-identified symptom summaries

**Encryption:**
- At rest: DynamoDB AWS-managed encryption, S3 AES256
- In transit: TLS 1.2+ for all connections
- Storage: JWT tokens in localStorage (migration to httpOnly cookies planned)

---

### Sensitive Data Handling

**Document Upload Flow:**
```
User selects file → Generate presigned S3 URL (1-hour expiry)
                  ↓
         Direct upload to S3 (bypasses API)
                  ↓
      Metadata saved to DynamoDB
                  ↓
    Path scoping: documents/{userId}/{timestamp}_{filename}
```

**Access Control:**  
All S3 objects are private. Downloads use presigned URLs with 24-hour expiry. Users can only access documents within their `userId` path.

---

### Compliance Status

| Regulation | Status | Implementation |
|------------|--------|----------------|
| **Indian DPDP Act** | Partial | User consent for data processing, right to deletion implemented. Full audit trail pending. |
| **HIPAA (US)** | Not Compliant | No Business Associate Agreement, missing comprehensive audit logs. |
| **GDPR (EU)** | Partial | Right to access and portability implemented. Data retention policies pending. |

---

## Scalability

### Current Architecture Capacity

| Component | Current Limit | Constraint |
|-----------|---------------|------------|
| Next.js (Vercel) | ~100 req/sec | Function concurrency (free tier) |
| MenstLLaMA EC2 | ~10 req/sec | Single t3.large instance |
| DynamoDB | Unlimited | Auto-scales with pay-per-request |
| Bedrock | 10K tokens/min | Service quota (increase requestable) |
| Amazon S3 | Unlimited | 5,500 PUT/sec, 55K GET/sec per prefix |

**Supported Concurrent Users:** Approximately 1,000 before MenstLLaMA saturation.

---

### Known Bottlenecks

**1. MenstLLaMA Single Point of Failure**

Current: Single EC2 instance, no load balancer, no redundancy.

Impact: If EC2 fails, 70% of AI traffic falls back to Bedrock, causing 3x cost spike.

**2. Bedrock Throttling**

Current: 10K tokens/min quota supports ~20 requests/sec at 500 tokens/request.

Impact: At 2K concurrent users, throttling triggers exponential backoff, increasing latency.

**3. Vercel Cold Starts**

Current: 400ms overhead on first request to new worker.

Impact: Traffic spikes create multiple cold starts, slowing dashboard loads.

---

### Scaling Strategy

**Phase 1: 10K Users**

Improvements:
- Upgrade Vercel to Pro tier (removes concurrency limits)
- Request Bedrock quota increase (10K → 100K tokens/min)
- Add CloudFront CDN for static assets (60% load reduction)

Cost Impact: +$20/month  
Timeline: 2 weeks

---

**Phase 2: 100K Users**

Improvements:
- **MenstLLaMA Auto-Scaling:**
  - Application Load Balancer
  - Auto Scaling Group (2-10 instances based on request rate)
  - Health check monitoring with automatic instance replacement
  
- **Caching Layer:**
  - Redis for user profiles (80% read hit rate)
  - DynamoDB read reduction by 80%
  
- **Async Processing:**
  - SQS queue for PDF report generation
  - Lambda workers process in background
  - Email notification when complete

Cost Impact: +$210/month  
Timeline: 6 weeks

---

**Phase 3: 1M Users**

Improvements:
- **Multi-Region Deployment:**
  - DynamoDB Global Tables (US, India, EU)
  - Route 53 latency-based routing
  - Replicated S3 buckets per region
  
- **Microservices Architecture:**
  - Separate services: chat, reports, appointments
  - Independent scaling per service
  - API Gateway with rate limiting
  
- **Machine Learning:**
  - LSTM models for cycle prediction
  - Anomaly detection for health risks
  - SageMaker for inference

Cost Impact: ~$5,000/month (cost per user decreases: $0.015 vs $0.02)  
Timeline: 6 months

---

### Cost Scaling Projection

```
Current (1K users):     $50/month
Phase 1 (10K users):    $250/month
Phase 2 (100K users):   $1,960/month   ($0.020 per user)
Phase 3 (1M users):     $15,000/month  ($0.015 per user)
```

The architecture achieves economies of scale through fixed infrastructure costs amortized across growing user base.

---

## Future Roadmap

### Current Capabilities (Q1 2025)

**Authentication & Onboarding**
- Email/password authentication via Cognito
- 6-step health profile wizard with AI context generation
- Profile management and settings

**Health Tracking**
- Daily symptom logging (flow, pain, mood, energy, sleep)
- Automatic cycle detection and phase calculation
- Period prediction based on historical data
- Streak tracking and notifications

**AI Features**
- Conversational AI assistant (Aria) with hybrid routing
- Domain-specific responses from MenstLLaMA
- General health queries via Bedrock Claude
- Local RAG with medical guideline integration
- Medical safety guardrails

**Clinical Tools**
- AI-generated health reports with risk assessment
- PDF export for doctor consultations
- Medical document upload and storage
- Doctor discovery and appointment booking
- Pre-visit health summary generation

---

### Near-Term Improvements (Q2 2025)

**Security Hardening** (1 week)
- Extract userId from JWT tokens (eliminate trust boundary)
- Migrate to httpOnly cookies (XSS protection)
- Implement CSRF token validation

**Email Integration** (3 days)
- Enable Amazon SES for appointment summaries
- Send health reports to doctors via email
- Automated reminders

**Enhanced Tracking** (2 weeks)
- Medication logging and refill reminders
- Nutrition tracking integrated with symptoms
- Exercise correlation analysis

**User Experience** (1 week)
- Google OAuth via Cognito Identity Pool
- Push notifications for period reminders
- Progressive Web App offline capabilities

---

### Long-Term Vision (2025-2026)

**OVIRA CLINIC (Healthcare Provider Portal)**

Platform for gynecologists and fertility clinics:
- Provider dashboard with patient health summaries
- Appointment scheduling with video consultation
- FHIR export for Electronic Health Record integration
- Prescription management and tracking
- Patient progress monitoring

Revenue model: $99/month per provider subscription

---

**OVIRA PREDICT (ML-Powered Analytics)**

Advanced predictive capabilities:
- LSTM models for cycle length prediction
- Fertility window optimization using historical patterns
- Anomaly detection for unusual symptom patterns
- Risk scoring for PCOS and endometriosis likelihood
- Personalized health recommendations

Technology: SageMaker for training, Lambda for inference

---

**OVIRA CONNECT (Community Platform)**

Peer support and expert guidance:
- Anonymous moderated forums
- Condition-specific support groups
- Monthly expert Q&A webinars with gynecologists
- Educational content library

Challenge: Content moderation at scale, mental health support protocols

---

**Technology Improvements**

High Priority:
- Comprehensive test coverage (unit, integration, E2E)
- DynamoDB Point-in-Time Recovery for backup protection
- Structured logging and error tracking (Sentry)
- Infrastructure as Code with Terraform

Medium Priority:
- Bundle size optimization (850KB → 500KB)
- API response caching layer (Redis/CloudFront)
- RAG upgrade to Sentence Transformers (accuracy improvement)
- Load testing for 1000+ concurrent users

---

## Technology Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 + React 18 + TypeScript | Server-side rendering for SEO, unified frontend/backend codebase, type safety |
| **UI Components** | Tailwind CSS + shadcn/ui | Utility-first styling, copy-paste component primitives (no package bloat) |
| **Authentication** | Amazon Cognito | Managed user directory, email verification, JWT token issuance |
| **API Layer** | Next.js API Routes | Serverless functions with automatic scaling, co-located with frontend |
| **Database** | Amazon DynamoDB | Serverless NoSQL, HTTP API (no connection pooling), auto-scaling, sub-10ms latency |
| **Object Storage** | Amazon S3 | Health report PDFs, medical documents, knowledge base files |
| **Primary AI** | Claude 3 Haiku (Bedrock) | Best price/performance ratio ($0.25/1M tokens), 200K context window |
| **Domain AI** | MenstLLaMA (EC2) | Fine-tuned LLaMA 3 8B on 23,820 Indian menstrual health Q&As, fixed cost |
| **Fallback AI** | Amazon Nova Micro (Bedrock) | Cost-efficient fallback model (10x cheaper than Claude) |
| **RAG** | Local TF-IDF Embeddings | Zero-cost keyword-based retrieval, synchronous execution |
| **Knowledge Base** | Text Files (WHO, ACOG, NIH) | Medical guidelines loaded at runtime, in-memory vector search |
| **Rate Limiting** | Upstash Redis | Serverless-friendly rate limiting with global edge network |
| **Email** | Amazon SES | Appointment summaries and health report delivery |
| **Data Visualization** | Recharts | React-native charts for cycle tracking and symptom trends |
| **Form Management** | react-hook-form | Minimal re-renders, built-in validation |
| **Date Utilities** | date-fns | Tree-shakeable date manipulation, small bundle size |
| **PDF Generation** | @react-pdf/renderer | Client-side PDF creation for health reports |
| **Hosting** | Vercel | Zero-config deployment, automatic HTTPS, global CDN |

---

### Database Schema Overview

| Table | Partition Key | Sort Key | Purpose |
|-------|---------------|----------|---------|
| ovira-users | userId | - | User profiles, health context, cycle information |
| ovira-symptoms | userId | date (YYYY-MM-DD) | Daily symptom logs (flow, pain, mood, energy) |
| ovira-reports | userId | reportId | Generated health reports metadata |
| ovira-chat-history | userId | messageId | Conversation history (last 10 messages) |
| ovira-documents | userId | docId | Uploaded medical documents metadata |
| ovira-doctors | userId | doctorId | User's preferred gynecologists |
| ovira-appointments | userId | appointmentId | Doctor bookings and pre-visit summaries |
| ovira-articles | articleId | - | AI-personalized health content library |

**Design Principle:** Every table uses `userId` as partition key for user-scoped queries. No Scan operations—all queries use GetItem or Query with partition keys for optimal performance.

---

### AI Model Routing

| Query Type | Model | Cost | Accuracy |
|------------|-------|------|----------|
| Menstrual health (70% traffic) | MenstLLaMA on EC2 | $50/month (fixed) | High (domain-specific) |
| General health (30% traffic) | Claude 3 Haiku | $0.25/1M tokens | High (general-purpose) |
| Fallback (throttling) | Amazon Nova Micro | $0.025/1M tokens | Medium |
| Final fallback (all fail) | Static keyword responses | $0 | Low |

**Result:** 66% cost reduction compared to single-model architecture while maintaining response quality through intelligent routing.

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Project Status:** MVP Production-Ready

---

