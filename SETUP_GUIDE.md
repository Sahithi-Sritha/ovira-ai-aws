# Ovira AI - Setup Guide

## Quick Start for Demo

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your AWS credentials:
```bash
cp .env.example .env.local
```

Required variables:
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET`

### 3. Create DynamoDB Tables
```bash
npm run db:create-tables
```

### 4. Seed Demo Data
```bash
node scripts/seed-demo-data.mjs
```

This creates a demo account (`demo@ovira.ai`) with 365 days of realistic PCOS symptom data for **Priya Sharma**.

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Login as Demo User
Click **"Try Demo Account"** on the homepage to see the app with pre-populated data.

---

## PWA Installation

The app now includes Progressive Web App capabilities:

1. **Desktop:** After visiting the dashboard, a browser prompt will appear to install the app
2. **Mobile:** Use the browser's "Add to Home Screen" option
3. **Manual:** Click the "Install App" button in the dashboard header

The PWA install banner appears automatically after 30 seconds on the dashboard (for users who haven't dismissed it).

---

## Features Added

### PWA Install Button
- Located in dashboard header (desktop)
- Auto-dismissible banner after 30 seconds (all devices)
- Remembers user preference for 7 days
- Full offline support with service worker caching

### Demo Account Fixed
- Demo user ID now matches seed script: `demo-user-ovira-2025`
- All demo data properly loads (symptoms, appointments, chat history, doctors)
- 365 days of realistic PCOS symptom patterns

---

## Project Structure

```
ovira-ai-aws/
├── src/
│   ├── app/                    # Next.js pages (App Router)
│   ├── components/             # Reusable UI components
│   │   └── pwa/                # PWA components
│   │       └── InstallButton.tsx
│   ├── contexts/               # React Context providers
│   ├── lib/                    # Utility functions
│   └── types/                  # TypeScript types
├── public/
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
├── scripts/                    # Database and setup scripts
└── knowledge/                  # RAG knowledge base files
```

---

## Troubleshooting

### Demo Account Shows No Data
**Solution:** Run the seed script:
```bash
node scripts/seed-demo-data.mjs
```

### PWA Install Button Not Showing
**Reasons:**
- Already installed (check if running in standalone mode)
- Recently dismissed (waits 7 days before showing again)
- Browser doesn't support PWA (Safari has limited support)

### AWS Errors
**Solution:** Verify `.env.local` has valid AWS credentials and region

---

## Documentation

- **High-Level Design:** `OVIRA_HIGH_LEVEL_DESIGN.md`
- **Interview Architecture Guide:** `OVIRA_INTERVIEW_ARCHITECTURE_GUIDE.md`
- **Presentation Document:** `OVIRA_PROJECT_PRESENTATION_DOCUMENT.md`

---

## Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes (Serverless)
- **Database:** Amazon DynamoDB
- **Storage:** Amazon S3
- **AI:** Amazon Bedrock (Claude, Nova), MenstLLaMA (EC2)
- **Auth:** Amazon Cognito
- **PWA:** Service Workers, Web App Manifest

---

## Support

For issues or questions:
1. Check the documentation files listed above
2. Review the `.env.example` for required environment variables
3. Ensure all DynamoDB tables are created (`npm run db:create-tables`)
4. Verify demo data is seeded (`node scripts/seed-demo-data.mjs`)
