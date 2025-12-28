# Ovira AI - Women's Health & Period Tracker

<div align="center">

**AI-powered women's health companion for period tracking, symptom logging, and preventive care insights.**

[Live Demo](#) • [Documentation](#features) • [Contributing](#contributing)

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

### 🤖 AI Health Companion
- Google Gemini-powered chat assistant
- Empathetic, stigma-free responses
- Educational health information
- Medical disclaimer integration
- Suggested starter questions

### 📊 Health Reports
- Pattern analysis across logged data
- Risk flag detection (anemia, PCOS indicators)
- Personalized recommendations
- Export-ready for doctor visits

### 🔒 Privacy & Security
- Firebase Authentication (Email/Password + Google)
- Encrypted data storage in Firestore
- User-only data access via security rules
- Data export and account deletion

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project (Blaze plan for Gemini API calls)
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   cd "d:\Ovira mvp\ovira techsprint\ovira-ai"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Gemini API Key (server-side only)
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Deploy Firebase security rules**
   ```bash
   firebase deploy --only firestore:rules,storage
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
│   │   ├── api/                  # API routes (chat, analyze)
│   │   ├── layout.tsx            # Root layout with AuthProvider
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css           # Design system
│   ├── components/
│   │   └── ui/                   # Reusable UI components
│   ├── contexts/
│   │   └── auth-context.tsx      # Authentication state management
│   ├── lib/
│   │   ├── firebase/             # Firebase configuration
│   │   └── utils/                # Utility functions
│   └── types/                    # TypeScript type definitions
├── firebase/
│   ├── firestore.rules           # Firestore security rules
│   └── storage.rules             # Storage security rules
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

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Gemini API
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Dates**: date-fns

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

## ⚠️ Medical Disclaimer

> Ovira AI provides health insights for **informational purposes only**. This is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare provider for medical concerns.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## 📄 License

MIT License - see LICENSE file for details.

---

<div align="center">
Made with ❤️ for women's health
</div>
