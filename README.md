# EduQuestJr – Gamified ECD Learning Platform (Ages 1-8)

A premium, gamified early childhood learning ecosystem with adaptive AI, Montessori-aligned structure, and subscription-based access.

## Tech Stack

- **Frontend:** React 18 + Vite (SPA)
- **Backend:** Node.js + Express.js (REST API)
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Auth:** JWT + role-based access + email verification
- **Payments:** PayPal Subscription API (sandbox + live)
- **AI:** Groq, Gemini, Cohere, Hugging Face, Deepgram, and more
- **Email:** Nodemailer (Gmail SMTP)
- **Deploy:** Vercel (monorepo)

## Features

- 20+ educational games with progressive difficulty (25+ levels each)
- Level locking system with premium tiers (level 15+)
- XP, coins, streaks, achievements, and sticker shop
- Personalized AI chat companion for children
- Daily challenges with 2x XP bonus
- Parent dashboard with learning analytics and insights
- Child profile with performance overview
- Dark/light mode toggle
- Email verification and password reset
- PayPal subscription (monthly / 6-month / yearly plans)
- Responsive, kid-friendly ECD UX design

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas))

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI, API keys, etc.
npm install
npm run dev
```

API runs at **http://localhost:5000**. Health check: `GET /api/health`

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:5173**. Vite proxy forwards `/api` to the backend.

### 3. First Run

1. Start the backend server
2. Start the frontend dev server
3. Open http://localhost:5173 -> Sign up -> Verify email -> Dashboard -> Add a child -> Play games!

## Deploying to Vercel

This project supports **two deployment strategies**:

### Option A: Monorepo (single Vercel project)

The root `vercel.json` routes `/api/*` to the Express serverless function and everything else to the Vite SPA.

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Vercel will detect the root `vercel.json` automatically
4. Add all environment variables from `server/.env.example` in the Vercel project settings
5. Deploy!

### Option B: Separate deployments (recommended for production)

Deploy the **client** and **server** as two separate Vercel projects:

#### Deploy the API (server)

1. In Vercel, create a new project
2. Set the **Root Directory** to `server`
3. Vercel will use `server/vercel.json` automatically
4. Add all environment variables from `server/.env.example`:
   - `MONGODB_URI` (your MongoDB Atlas connection string)
   - `JWT_SECRET` (a strong random secret)
   - `CLIENT_URL` (your frontend URL, e.g. `https://eduquestjr.vercel.app`)
   - `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_MODE`
   - `PAYPAL_PRODUCT_ID`, `PAYPAL_PLAN_MONTHLY`, `PAYPAL_PLAN_6MONTHS`, `PAYPAL_PLAN_YEARLY`
   - `GMAIL_USER`, `GMAIL_APP_PASSWORD`
   - All AI API keys (`GROQ_API_KEY`, `GEMINI_API_KEY`, etc.)
5. Deploy!

#### Deploy the Frontend (client)

1. In Vercel, create a new project
2. Set the **Root Directory** to `client`
3. Framework: **Vite**
4. Add environment variable:
   - `VITE_API_URL` = your deployed API URL (e.g. `https://eduquestjr-api.vercel.app`)
5. Deploy!

### Important Notes

- **MongoDB Atlas**: Make sure your Atlas cluster allows connections from `0.0.0.0/0` (or Vercel's IP ranges) in Network Access settings.
- **PayPal Webhooks**: In production, add your server URL as a webhook endpoint in the [PayPal Developer Dashboard](https://developer.paypal.com): `https://your-api-url/api/webhook/paypal`
- **Environment Variables**: Never commit `.env` files. Use Vercel's environment variable settings.

## Project Structure

```
EduQuestJr/
├── client/                  # React (Vite) Frontend
│   ├── public/              # Static assets (logo, etc.)
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # Layout, GameLayout, RewardModal, DailyTasks
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── games/           # 20+ game components + registry
│   │   ├── hooks/           # useGameSession
│   │   ├── pages/           # Dashboard, ChildProfile, Subscription, etc.
│   │   └── main.jsx
│   ├── vercel.json          # Vercel config (SPA rewrites)
│   └── package.json
├── server/                  # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/     # Auth, child, game, progress, subscription, AI
│   │   ├── middleware/       # Auth, role, subscription checks
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Seed data, PayPal, email, AI
│   │   ├── utils/           # Error handler
│   │   └── index.js         # Express app + Vercel serverless export
│   ├── vercel.json          # Vercel config (serverless function)
│   └── package.json
├── vercel.json              # Root config (monorepo deployment)
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register (name, email, password) |
| POST | `/api/auth/login` | No | Login (email, password) |
| POST | `/api/auth/verify-email` | No | Verify email with code |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password with code |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/children` | Parent | List children |
| POST | `/api/children` | Parent | Create child |
| GET | `/api/children/:id` | Parent | Get child details |
| GET | `/api/children/:id/analytics` | Parent | Child learning analytics |
| GET | `/api/games` | Optional | List games |
| GET | `/api/games/:slug` | Optional | Get game by slug |
| POST | `/api/progress` | Parent | Submit game result |
| GET | `/api/challenges/daily` | Yes | Get daily challenges |
| POST | `/api/subscription/plan-id` | Yes | Get PayPal plan ID |
| POST | `/api/subscription/activate` | Yes | Activate subscription |
| GET | `/api/subscription/status` | Yes | Subscription status |
| POST | `/api/ai/chat` | Yes | AI chat companion |
| GET | `/api/ai/hint` | Yes | AI game hints |
| GET | `/api/ai/recommendation` | Yes | AI game recommendations |

## License

Proprietary - EduQuestJr
