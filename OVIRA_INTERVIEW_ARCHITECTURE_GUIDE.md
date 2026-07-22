# OVIRA AI - Interview Architecture Guide

> **Purpose:** This document is designed to introduce OVIRA AI to technical interviewers in under 5 minutes, then serve as a roadmap for deeper technical discussions.

---

## 1. The Story: Why This Project Exists

### The Problem
Women in India face a critical gap in menstrual health management:

- **Poor doctor communication:** "I have bad cramps" doesn't convey severity, frequency, or patterns
- **Scattered information:** Symptoms in notes app, periods on calendar, questions via Google
- **Cultural barriers:** Taboo around menstruation limits access to accurate information
- **Unprepared consultations:** 15-minute doctor visits without structured health history

**Real Impact:** Women delay seeking care, mismanage PCOS/endometriosis, and lack data-driven insights.

### What We Built
A full-stack AI-powered health companion that:

1. **Tracks** daily symptoms with automatic cycle analysis
2. **Explains** through conversational AI trained on menstrual health
3. **Prepares** doctor-ready health reports with risk assessment
4. **Empowers** users with personalized, medically safe insights

### Why It's Interesting
**The Engineering Challenge:** Build a medically compliant AI system that's accurate, affordable, and private—using a hybrid architecture that routes between a domain-specific model and general-purpose LLM.

---

## 2. User Journey: End-to-End Experience

```
┌─────────────┐
│  Sign Up    │  → Email verification via Cognito
└──────┬──────┘
       ↓
┌─────────────┐
│ Onboarding  │  → 6-step wizard: health profile, cycle history, lifestyle
└──────┬──────┘      (Builds AI personalization context)
       ↓
┌─────────────┐
│  Dashboard  │  → Cycle countdown, phase tracking, logging streak
└──────┬──────┘
       ↓
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────┐ │
│  │ Log Symptoms │  │  Chat with AI │  │ Reports │ │
│  │ (Daily)      │  │  (On-demand)  │  │(Pre-doc)│ │
│  └──────────────┘  └───────────────┘  └─────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
       ↓
┌─────────────┐
│Doctor Visit │  → Send AI-generated health summary via email
└─────────────┘
```

**Key Insight:** The value compounds over time—more logs = better AI insights = more useful reports.

---

## 3. System Architecture: The Big Picture

This diagram is the **roadmap for our interview**. You can point to any component and we'll dive deeper.

```
                           ┌──────────────────────┐
                           │   User (Web App)     │
                           │  Next.js + React     │
                           └──────────┬───────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
            ┌───────▼────────┐              ┌──────────▼─────────┐
            │  Authentication │              │    API Layer       │
            │  (Cognito)      │              │  13 API Routes     │
            └─────────────────┘              └──────────┬─────────┘
                                                        │
                                    ┌───────────────────┼───────────────────┐
                                    │                   │                   │
                          ┌─────────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
                          │   AI Router       │  │  Database   │  │    Storage      │
                          │ (Smart Routing)   │  │  DynamoDB   │  │       S3        │
                          └─────────┬─────────┘  │  8 Tables   │  │   3 Buckets     │
                                    │            └─────────────┘  └─────────────────┘
                    ┌───────────────┼───────────────┐
                    │               │               │
         ┌──────────▼──────┐  ┌────▼────────┐  ┌──▼──────────────┐
         │  MenstLLaMA     │  │   Bedrock   │  │  Static         │
         │  (EC2)          │  │   Claude    │  │  Fallback       │
         │  Domain Model   │  │  + RAG      │  │                 │
         └─────────────────┘  └─────────────┘  └─────────────────┘
```

### The Three Core Layers

**1. User Layer**
- Serverless Next.js app (SSR for SEO, API routes for backend)
- Client-side cycle calculations (instant feedback without API calls)
- React Context for global auth state

**2. Intelligence Layer** (The Interesting Part)
- **AI Router:** Classifies query → routes to specialized or general model
- **Hybrid Architecture:** 70% traffic to domain model (fixed cost), 30% to Bedrock (pay-per-token)
- **Fallback Chain:** If one model fails, automatically try next (ensures 99.9% uptime)

**3. Data Layer**
- DynamoDB for structured data (users, symptoms, reports)
- S3 for objects (PDF reports, medical documents)
- No connection pooling issues (pure HTTP APIs)

---

## 4. How One AI Request Flows Through the System

**Let's trace a single message: "Why do I get cramps before my period?"**

```
1. User sends message → Frontend
   ↓
2. Frontend fetches health context from DynamoDB
   (age, conditions, cycle info, recent symptoms)
   ↓
3. POST /api/chat { message, userId, history }
   ↓
4. AI Router classifies:
   "cramps" + "period" → Menstrual health keyword detected
   ↓
5. Try MenstLLaMA first:
   - EC2 health check (cached 60s)
   - Send: message + user health context
   - Timeout: 30s
   ↓
6. If MenstLLaMA succeeds:
   → Return specialized response (trained on 23,820 Indian health Q&As)
   
   If MenstLLaMA fails (EC2 down):
   ↓
7. Fallback to Bedrock Claude:
   - Retrieve knowledge from local RAG (WHO, ACOG guidelines)
   - Inject context: system prompt + RAG + user health profile
   - Invoke Claude 3 Haiku
   ↓
8. Sanitize response:
   - Check for prohibited medical terms (diagnose, prescribe, treatment)
   - Log flagged responses for human review
   ↓
9. Return to user:
   { message, citations, model: "MenstLLaMA", ragEnabled: false }
   ↓
10. Frontend displays response with model badge
```

### Why This Flow Matters

**Cost:** MenstLLaMA costs $50/month (fixed), Claude costs $0.25 per 1M tokens. Routing 70% of traffic to MenstLLaMA saves ~$3,700/month at 100K users.

**Accuracy:** Domain model understands "cramps" in menstrual context, not muscle pain.

**Resilience:** If EC2 fails, Bedrock takes over automatically (user sees no error).

---

## 5. Engineering Decisions: The "Why" Behind Everything

### Decision 1: Hybrid AI Architecture

**What We Did:**
Route queries between a fine-tuned LLaMA 3 model (on EC2) and Bedrock Claude based on keyword detection.

**Why:**
- **Cost:** Fixed EC2 cost vs pay-per-token cloud AI
- **Specialization:** MenstLLaMA trained on Indian menstrual health data (cultural context)
- **Privacy:** Sensitive menstrual data stays on our EC2, not sent to external APIs

**Alternative Considered:**
Use only Bedrock Claude for everything.

**Tradeoff:**
- ✅ 66% cost reduction ($1,958 vs $5,625/month at 100K users)
- ✅ Better domain accuracy for menstrual queries
- ❌ Added complexity (routing logic, EC2 maintenance)
- ❌ Single point of failure (EC2 instance) → Mitigated by fallback chain

---

### Decision 2: Local RAG with TF-IDF (Not Bedrock Knowledge Bases)

**What We Did:**
Load medical guidelines (WHO, ACOG, NIH) at runtime, embed with TF-IDF, store in-memory, search with cosine similarity.

**Why:**
- **Cost:** $0 vs $30/month for Bedrock KB
- **Latency:** Synchronous (no network call) vs API round-trip
- **Simplicity:** No external dependencies

**Alternative Considered:**
Use Bedrock Knowledge Bases (managed service with neural embeddings).

**Tradeoff:**
- ✅ Zero API costs
- ✅ No additional latency (in-memory search)
- ❌ Lower accuracy (80% vs 95% for neural embeddings)
- ❌ Only works for keyword-based queries (not semantic)

**Engineering Judgment:**
For medical keyword queries ("PCOS symptoms", "iron deficiency"), TF-IDF is sufficient. The cost savings justify the accuracy tradeoff for an MVP.

---

### Decision 3: DynamoDB Over PostgreSQL (RDS)

**What We Did:**
Use DynamoDB with partition key = userId for all user-scoped data.

**Why:**
- **Serverless-compatible:** HTTP API, no connection pooling
- **Auto-scaling:** Pay-per-request, no capacity planning
- **Predictable latency:** < 10ms for GetItem by key

**Alternative Considered:**
PostgreSQL on RDS (relational, SQL queries, joins).

**Tradeoff:**
- ✅ No connection limit issues in serverless
- ✅ Scales to millions of requests automatically
- ❌ No joins → Must denormalize data (e.g., store `avgCycleLength` in user profile)
- ❌ Eventual consistency on Global Secondary Indexes

**Engineering Judgment:**
User-scoped queries don't need joins. Denormalization is acceptable for this data model.

---

### Decision 4: Client-Side Cycle Analysis

**What We Did:**
Calculate cycle day, phase (Menstrual/Follicular/Ovulation/Luteal), and next period prediction in the browser using logged symptoms.

**Why:**
- **Instant feedback:** No API latency (0ms vs 200ms+)
- **Reduced API calls:** Dashboard loads once, calculates locally
- **Offline-capable:** Works even if API is slow

**Alternative Considered:**
Server-side calculation in API route.

**Tradeoff:**
- ✅ Faster user experience
- ✅ Lower infrastructure costs (fewer API calls)
- ❌ Logic duplication if server-side needed later
- ❌ Limited by browser compute (but cycle math is trivial)

**Engineering Judgment:**
Simple arithmetic (date math, averages) is perfect for client-side. No reason to hit the server.

---

### Decision 5: Serverless (Next.js on Vercel) Over Containerized Backend

**What We Did:**
Build API routes in Next.js, deploy to Vercel (wraps AWS Lambda).

**Why:**
- **Zero ops:** No EC2 management, auto-scaling, auto-patching
- **Faster development:** Co-locate frontend/backend code, shared TypeScript types
- **Cost-efficient:** Pay only for execution time (scales to zero)

**Alternative Considered:**
Express.js backend on ECS (containers) or EC2.

**Tradeoff:**
- ✅ No infrastructure management
- ✅ Auto-scaling built-in
- ✅ Vercel handles CDN, SSL, deployments
- ❌ Cold starts (~400ms overhead on first request)
- ❌ Less control over runtime (15-minute Lambda timeout, but Vercel limits to 10s on free tier)

**Engineering Judgment:**
For an MVP, zero ops overhead is more valuable than avoiding cold starts. Can migrate to containers later if needed.

---

## 6. Security & Privacy: Protecting Sensitive Health Data

### Authentication Flow

```
User submits email + password
   ↓
Calculate SECRET_HASH = HMAC-SHA256(ClientId + Email, ClientSecret)
   ↓
Cognito authenticates → Returns JWT tokens
   ↓
Store in localStorage: { idToken, accessToken, refreshToken }
   ↓
API validates JWT signature on every request
```

**Key Security Measure:** SECRET_HASH prevents unauthorized clients from calling Cognito APIs.

---

### Medical Safety Guardrails

**The Problem:** AI models might say "you have PCOS" (medical diagnosis) → Legal liability, violates Indian DPDP Act.

**Our Solution:**

1. **System Prompt Engineering**
```
NEVER use: diagnose, treatment, cure, prescribe, disease

Use instead: "what you're experiencing", "ways to manage", 
"patterns consistent with", "worth discussing with your doctor"
```

2. **Response Sanitization**
```typescript
function sanitizeResponse(text) {
  const prohibited = ['diagnose', 'treatment', 'prescribe', ...];
  if (text includes any prohibited term) {
    log to CloudWatch for human review
  }
  return text; // Don't block (avoid over-filtering)
}
```

3. **Human Review Queue**
Flagged responses logged for weekly audit (not yet implemented, but infrastructure ready).

**Engineering Judgment:**
Balancing compliance with user experience. Blocking every response with "diagnosis" would break conversations. Logging for review is pragmatic.

---

### Data Privacy

**What We DON'T Send to AI:**
- ❌ Email, name, phone number
- ❌ Raw medical documents (blood test PDFs)
- ❌ Identifiable information

**What We DO Send:**
- ✅ Age range (25-30, not exact birthdate)
- ✅ Structured health data (conditions: ["PCOS"], not free-text diagnoses)
- ✅ Symptom summaries (avgPainLevel: 6.5, not "severe pain every morning")

**Why This Matters:**
If Bedrock gets compromised, attackers see aggregated stats, not personally identifiable health records.

---

### Known Security Gaps (And Roadmap)

| Vulnerability | Current State | Mitigation Plan |
|---------------|---------------|-----------------|
| **Client-provided userId** | API trusts userId from request body | Extract from JWT token in API routes |
| **localStorage XSS risk** | JWT tokens accessible to JavaScript | Migrate to httpOnly cookies |
| **No CSRF protection** | State-changing requests unprotected | Add CSRF tokens |
| **No request signing** | API calls unsigned | Implement HMAC request signing |

**Why We Haven't Fixed Yet:**
MVP prioritizes feature velocity. These are scheduled for Q2 2025 security hardening sprint.

---

## 7. Scalability: Current Limits & Growth Strategy

### Current Architecture Capacity

| Component | Capacity | Bottleneck |
|-----------|----------|------------|
| **Next.js (Vercel)** | ~100 req/sec | Function concurrency limit (free tier) |
| **MenstLLaMA EC2** | ~10 req/sec | Single t3.large instance |
| **DynamoDB** | Unlimited | Auto-scales with pay-per-request |
| **Bedrock** | 10K tokens/min | Service quota (can request increase) |
| **S3** | Unlimited | Virtually infinite |

**Current Supported Users:** ~1,000 concurrent users before MenstLLaMA saturates.

---

### Scaling Strategy (3 Phases)

**Phase 1: 0 → 10K Users (Q1-Q2 2025)**

Improvements:
- Upgrade Vercel to Pro ($20/month) → Removes concurrency limits
- Request Bedrock quota increase (10K → 100K tokens/min)
- Add CloudFront CDN for static assets (60% load reduction)

Cost: +$20/month  
Timeline: 2 weeks

---

**Phase 2: 10K → 100K Users (Q3-Q4 2025)**

Improvements:
- **MenstLLaMA Auto-Scaling:**
  - Application Load Balancer
  - Auto Scaling Group (2-10 instances)
  - Health check monitoring
  - Cost: $200/month for 4 instances

- **Redis Cache Layer:**
  - Cache user profiles (80% read hit rate)
  - Reduce DynamoDB reads by 80%
  - Cost: $10/month (Upstash)

- **Async Report Generation:**
  - Move PDF generation to SQS queue
  - Lambda workers process in background
  - Email user when ready (vs blocking HTTP request)

Cost: +$210/month  
Timeline: 6 weeks

---

**Phase 3: 100K+ Users (2026)**

Improvements:
- **Multi-Region Deployment:**
  - DynamoDB Global Tables (US, India, EU)
  - Route 53 latency-based routing
  - Replicated S3 buckets

- **Microservices Architecture:**
  - Separate services: chat, reports, appointments
  - API Gateway with service mesh
  - Independent scaling per service

- **ML-Based Predictions:**
  - Train LSTM model for cycle length prediction
  - Anomaly detection for health risks
  - SageMaker for inference

Cost: ~$5,000/month  
Timeline: 6 months

---

### Cost Scaling Projection

```
Current (1K users):    $50/month
Phase 1 (10K users):   $250/month
Phase 2 (100K users):  $1,960/month  (~$0.02 per user)
Phase 3 (1M users):    $15,000/month (~$0.015 per user)
```

**Key Insight:** Cost per user *decreases* with scale due to fixed infrastructure costs amortized across more users.

---

### Known Bottlenecks

**1. MenstLLaMA EC2 (Single Point of Failure)**

Current: Single t3.large instance, no load balancer, no redundancy.

Failure scenario: If EC2 crashes, 70% of AI traffic falls back to Bedrock → Costs spike 3x.

Mitigation: Auto-scaling group behind ALB (Phase 2).

---

**2. Bedrock Throttling**

Current: 10K tokens/min quota, ~20 requests/sec at 500 tokens/request.

Failure scenario: At 2K concurrent users, Bedrock throttles → Retry logic kicks in → Higher latency.

Mitigation: Request quota increase + implement queue-based processing.

---

**3. Cold Starts (Vercel Functions)**

Current: ~400ms overhead on first request to a new worker.

Failure scenario: Traffic spike → Many cold starts → Slow dashboard loads.

Mitigation: Upgrade to Vercel Pro (provisioned concurrency) or add edge caching.

---

## 8. Future Roadmap: Where This Is Going

### Current State (MVP - Q1 2025)

What's Live:
- ✅ User authentication (email/password via Cognito)
- ✅ 6-step health profile onboarding
- ✅ Daily symptom logging with cycle analysis
- ✅ AI chatbot (Aria) with hybrid routing
- ✅ Health report generation (doctor-ready PDFs)
- ✅ Doctor discovery and appointment booking
- ✅ Medical document upload to S3
- ✅ Local RAG with medical guidelines

---

### Next Quarter (Q2 2025)

**High-Priority Improvements:**

1. **Security Hardening** (1 week)
   - Extract userId from JWT (not client-provided)
   - Migrate to httpOnly cookies (eliminate XSS risk)
   - Add CSRF protection

2. **Email Integration** (3 days)
   - Enable Amazon SES for appointment summaries
   - Send doctor reports via email

3. **Medication Tracking** (1 week)
   - Log prescriptions and refills
   - Reminder notifications

4. **Social Login** (1 week)
   - Google OAuth via Cognito Identity Pool
   - Reduce signup friction

5. **Push Notifications** (2 weeks)
   - Period reminders (3 days before expected start)
   - Logging streak milestones

---

### Long-Term Vision (2025-2026)

**OVIRA CLINIC (Healthcare Provider Portal)**

Target: Gynecologists and fertility clinics

Features:
- Provider dashboard to view patient health summaries
- Appointment management with video consultations
- FHIR export for EHR integration
- Prescription management

Revenue Model: $99/month per provider subscription

---

**OVIRA PREDICT (ML-Powered Insights)**

Features:
- LSTM model for cycle length prediction
- Fertility window optimization
- Anomaly detection (unusual pain patterns → flag for doctor)
- Risk scoring (PCOS/endometriosis likelihood based on symptoms)

Tech Stack: SageMaker for training, Lambda for inference

---

**OVIRA CONNECT (Community Features)**

Features:
- Anonymous forums (AI-moderated)
- Peer support groups
- Monthly expert Q&A webinars

Challenge: Content moderation at scale, mental health support protocols

---

### Technology Improvements (Technical Debt)

**High Priority:**
1. Implement comprehensive testing (unit, integration, E2E) → Currently 0% coverage
2. Enable DynamoDB Point-in-Time Recovery (backup protection)
3. Add error tracking (Sentry) and structured logging
4. Infrastructure as Code (Terraform for all AWS resources)

**Medium Priority:**
5. Optimize bundle size (850KB → 500KB via code splitting)
6. Implement API response caching (Redis/CloudFront)
7. Upgrade RAG to Sentence Transformers (80% → 95% accuracy)
8. Add load testing (target: 1000 concurrent users)

---

## 9. Key Technical Highlights (What Makes This Interesting)

### 1. Hybrid AI Routing: Cost Optimization Through Smart Classification

**The Innovation:**
Instead of sending all queries to an expensive cloud LLM, we route based on domain detection.

```
70% of traffic → MenstLLaMA (fixed $50/month)
30% of traffic → Bedrock Claude (pay-per-token)

Savings: $3,700/month at 100K users (66% cost reduction)
```

**Why It's Hard:**
- Balancing accuracy (keyword matching is simple but effective for medical terms)
- Handling fallback gracefully (users never see errors)
- Managing EC2 infrastructure (ops burden vs cost savings)

---

### 2. Local RAG: Eliminating External Dependencies

**The Innovation:**
Instead of paying $30/month for Bedrock Knowledge Bases, we:
- Load medical guidelines (WHO, ACOG) into memory
- Embed with TF-IDF (synchronous, no API calls)
- Search with cosine similarity (< 5ms latency)

**Why It's Hard:**
- Cold start overhead (~200ms to embed all chunks on first request)
- Accuracy tradeoff (TF-IDF vs neural embeddings)
- Memory management (5MB per worker, negligible but must monitor)

---

### 3. Medical Safety: Engineering Compliance

**The Challenge:**
AI models can generate medical advice → Legal liability under Indian DPDP Act.

**Our Approach:**
- System prompt engineering (prohibit diagnostic language)
- Post-processing validation (flag prohibited terms)
- Human review queue (not yet implemented)

**Why It's Interesting:**
AI safety isn't just about technical controls—it's about balancing compliance with user experience. Over-filtering breaks conversations.

---

### 4. Serverless-First: Zero Ops Overhead

**The Decision:**
Build entirely on serverless (Next.js API routes, DynamoDB, Lambda) except for MenstLLaMA.

**Why It's Hard:**
- Cold starts require optimization (lazy loading, edge caching)
- DynamoDB requires different data modeling (no joins)
- Limited control over runtime (15-minute Lambda timeout)

**Why It's Worth It:**
- No infrastructure management (no EC2 patching, no RDS backups)
- Auto-scaling built-in (DynamoDB, Lambda, Vercel CDN)
- Cost efficiency (scales to zero during low traffic)

---

### 5. Client-Side Intelligence: Instant User Experience

**The Innovation:**
Calculate cycle predictions in the browser using symptom logs.

```typescript
function getCurrentCycleInfo(logs) {
  // Detect period starts (flow after 7+ day gap)
  // Calculate average cycle length
  // Compute current phase (Menstrual/Follicular/Ovulation/Luteal)
  // Predict next period
  return { cycleDay, phase, daysUntilNextPeriod };
}
```

**Why It's Hard:**
- Handling edge cases (irregular cycles, missing data)
- Balancing accuracy vs simplicity (7-day gap heuristic is good enough)
- Maintaining parity with server-side logic (if ever needed)

**Why It's Worth It:**
- Zero latency (0ms vs 200ms+ API call)
- Works offline (no network dependency)
- Reduces infrastructure costs (fewer API calls)

---

## 10. Interview Discussion Guide

### How to Use This Document

**First 5 Minutes (Overview):**
1. Show Section 1 (The Story) → Explain the problem and solution
2. Show Section 3 (Architecture Diagram) → Point to major components
3. Show Section 4 (AI Request Flow) → Trace one example end-to-end

**Next 20-40 Minutes (Deep Dive):**
The interviewer can point to any component in the architecture diagram and ask:

- "Tell me more about the AI Router"
  → Section 4 (AI Request Flow) + Section 5 (Decision 1: Hybrid AI)

- "Why DynamoDB instead of PostgreSQL?"
  → Section 5 (Decision 3: DynamoDB)

- "How do you handle medical safety?"
  → Section 6 (Security & Privacy)

- "What happens when you hit 100K users?"
  → Section 7 (Scalability: Phase 2)

- "Walk me through the data model"
  → Refer to HLD Section 4.8 (Database Schema)

- "How does authentication work?"
  → Section 6 (Authentication Flow)

---

### Recommended Interview Flow

**Opening (5 min):**
- Start with the problem (Section 1)
- Show architecture diagram (Section 3)
- "I can go deeper into any component you'd like"

**Technical Deep Dive (20-30 min):**
Interviewer-led based on their interests:
- AI/LLM engineers → Section 4 (AI Request Flow), Section 9.1-9.2
- Backend engineers → Section 5 (Engineering Decisions), Section 7 (Scalability)
- Full-stack engineers → Section 2 (User Journey), Section 4 (System Flow)
- Security engineers → Section 6 (Security & Privacy)

**Closing (5-10 min):**
- Discuss tradeoffs made (Section 5: All decisions have tradeoffs)
- Future roadmap (Section 8)
- Challenges faced and lessons learned

---

### Strong Talking Points

**1. Cost Optimization:**
"The hybrid AI architecture saves 66% on AI costs—$1,960 vs $5,625 per month at 100K users."

**2. Engineering Judgment:**
"We chose TF-IDF over neural embeddings for RAG because keyword-based medical queries don't need semantic understanding. The accuracy tradeoff (80% vs 95%) is acceptable for MVP, and we save $30/month."

**3. Progressive Enhancement:**
"The system works even if everything fails. If MenstLLaMA is down, Bedrock takes over. If Bedrock throttles, we have Nova Micro. If all AI fails, we return static keyword-based responses. Users never see an error."

**4. Balancing Compliance & UX:**
"We can't block every AI response with prohibited terms—that would break conversations. Instead, we log flagged responses for human review. It's about being pragmatic within regulatory constraints."

**5. Serverless Tradeoffs:**
"Cold starts add 400ms latency, but zero ops overhead is more valuable for an MVP. We can migrate to containers if cold starts become a real bottleneck at scale."

---

### Common Interviewer Questions & Where to Find Answers

| Question | Reference |
|----------|-----------|
| "Why AWS over GCP/Azure?" | Section 5 (Decision: Bedrock exclusive to AWS) |
| "How do you prevent AI from diagnosing?" | Section 6 (Medical Safety Guardrails) |
| "What's your database schema?" | Refer to HLD Section 4.8 |
| "How does RAG work?" | Section 5 (Decision 2: Local RAG) |
| "What happens at 1M users?" | Section 7 (Phase 3: Microservices) |
| "Why Next.js over separate frontend/backend?" | Section 5 (Decision 5: Serverless) |
| "How do you handle authentication?" | Section 6 (Authentication Flow) |
| "What are your security vulnerabilities?" | Section 6 (Known Security Gaps) |
| "How do you test this?" | Section 8 (Technical Debt: 0% coverage currently) |

---

## Appendix: Quick Reference

### System Metrics at a Glance

| Metric | Value |
|--------|-------|
| **Supported Concurrent Users** | ~1,000 (MVP) |
| **API Endpoints** | 13 routes |
| **Database Tables** | 8 (DynamoDB) |
| **Storage Buckets** | 3 (S3) |
| **AI Models** | 3 (MenstLLaMA, Claude, Nova) |
| **Average API Latency** | 500ms (CRUD), 2s (AI) |
| **Cost per User (100K DAU)** | $0.02/month |
| **Cost Savings (Hybrid AI)** | 66% vs Bedrock-only |

---

### Technology Stack (One-Line Summary)

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | Next.js 15 + React 18 | SSR for SEO, API routes eliminate separate backend |
| **Authentication** | Amazon Cognito | Managed service, JWT tokens, email verification built-in |
| **Database** | DynamoDB | Serverless, auto-scaling, no connection pooling |
| **Storage** | Amazon S3 | 99.999999999% durability, presigned URLs for security |
| **Primary AI** | Claude 3 Haiku (Bedrock) | Best price/performance, 200K context window |
| **Domain AI** | MenstLLaMA (EC2) | Fine-tuned on 23,820 Indian health Q&As |
| **Fallback AI** | Amazon Nova Micro | 10x cheaper than Claude for simple queries |
| **RAG** | Local TF-IDF | Zero API costs vs $30/month for Bedrock KB |
| **Rate Limiting** | Upstash Redis | Serverless-native, global edge network |
| **Hosting** | Vercel | Zero config, auto-scaling, edge CDN included |

---

### Data Model Summary

**Users Table:**
```
Partition Key: userId
Attributes: email, profile data, health context summary, cycle info
GSI: EmailIndex (for login lookups)
```

**Symptoms Table:**
```
Partition Key: userId
Sort Key: date (YYYY-MM-DD)
Attributes: flowLevel, painLevel, mood, energy, sleep, symptoms[], notes
```

**Reports Table:**
```
Partition Key: userId
Sort Key: reportId
Attributes: generatedAt, pdfUrl, riskFlags[], summary
```

**Design Principle:** 
Every table uses `userId` as partition key → All queries are user-scoped → No hot partitions, efficient access patterns.

---

### Cost Breakdown (100K DAU)

| Service | Monthly Cost |
|---------|--------------|
| DynamoDB | $31.38 |
| Bedrock Claude | $1,687.50 |
| MenstLLaMA EC2 (4 instances) | $200.00 |
| S3 | $10.00 |
| Cognito | $0.00 (free tier) |
| Vercel Pro | $20.00 |
| Upstash Redis | $10.00 |
| **Total** | **$1,958.88** |

**Key Insight:** AI costs dominate (97% of total). Optimizing AI routing is the primary cost lever.

---

### Fallback Chain (When Things Fail)

```
Primary:   MenstLLaMA (EC2)        → 70% of traffic
           ↓ (if down)
Backup 1:  Bedrock Claude + RAG    → 30% of traffic + fallback
           ↓ (if throttled)
Backup 2:  Bedrock Claude (no RAG) → Degraded but functional
           ↓ (if throttled)
Backup 3:  Bedrock Nova Micro      → Cheap, lower quality
           ↓ (if throttled)
Final:     Static keyword response  → Always works
```

**Result:** 99.9% uptime for AI responses even with service failures.

---

### What Would I Do Differently in Production?

**1. Security:**
- Extract userId from JWT (not client-provided) → Current trust boundary issue
- Migrate to httpOnly cookies → Eliminate XSS risk from localStorage
- Add CSRF protection → Prevent cross-site request forgery

**2. Testing:**
- Implement 80% unit test coverage → Currently 0%
- Add E2E tests with Playwright → Catch integration issues
- Load testing with k6 → Validate 1000 concurrent users

**3. Infrastructure:**
- Terraform for all AWS resources → Currently manual Console setup
- Enable DynamoDB Point-in-Time Recovery → No backups currently
- Add Sentry for error tracking → Currently only console.log

**4. Observability:**
- Structured logging with Winston → Currently console.log
- CloudWatch custom metrics (API latency, AI costs) → No metrics dashboard
- Real-time alerting (PagerDuty) → No alerting currently

**5. Scalability:**
- MenstLLaMA auto-scaling group → Currently single instance (SPOF)
- Redis cache for user profiles → Reduce DynamoDB reads by 80%
- Async report generation (SQS + Lambda) → Don't block HTTP requests

**Why Not Done Yet:** MVP prioritizes feature velocity. These are planned for Q2-Q3 2025.

---

## Final Thoughts

### What This Project Demonstrates

**Technical Skills:**
- Full-stack development (React, Next.js, TypeScript)
- Cloud architecture (AWS: Cognito, DynamoDB, S3, Bedrock, EC2)
- AI/LLM integration (prompt engineering, RAG, hybrid routing)
- System design (scalability, security, cost optimization)

**Engineering Judgment:**
- Making deliberate tradeoffs (accuracy vs cost, ops vs control)
- Balancing compliance with user experience
- Knowing when "good enough" is acceptable for MVP

**Product Thinking:**
- Understanding user pain points deeply
- Building for a specific market (Indian women's health)
- Progressive value delivery (works day 1, gets better over time)

---

**Document Purpose:** This guide is designed to help you communicate your project clearly in interviews. Start high-level, then dive deep based on interviewer interest. The architecture diagram is your roadmap—every component can be explored in detail.

---

*End of Interview Architecture Guide*
