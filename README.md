# Team Up

A calm, intentional daily habit tracking and accountability circle web application built with Next.js and Supabase.

## Features

- **Daily Habits & Intentions**: Set small, manageable daily goals with identity-based habit framing.
- **Circles & Accountability**: Share progress, reflections, and encouragement with teammates.
- **Calm & Thoughtful UI**: Distraction-free, responsive design inspired by mindful habit building.
- **Authentication & Persistence**: Powered by Supabase for secure auth and real-time state.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS & Vanilla CSS modules
- **Backend / Database**: Supabase (PostgreSQL, Auth, SSR)
- **Deployment**: Vercel

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

