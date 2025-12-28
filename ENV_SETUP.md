# Environment Variables for Ovira AI

Create a `.env.local` file with the following variables:

```env
# Firebase Configuration
# Get these from Firebase Console > Project Settings > Your apps > Web app
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API Key (server-side only - do not prefix with NEXT_PUBLIC_)
# Get this from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```
