# AvailNow — Homestay Inventory & Booking SaaS

A multi-tenant SaaS web application for homestay/guesthouse owners in India to manage room inventory, record WhatsApp/call-based bookings, and share a public "check availability" link with guests.

## Architecture

```
TripKraftr-Clone/
├── frontend/          → React + Vite + Tailwind CSS (deploys to Vercel/Netlify)
├── backend/           → Express + Mongoose API (deploys to Render/Railway)
└── README.md
```

The frontend and backend are **independently deployable** — they each have their own `package.json`, `node_modules`, and `.env`. They communicate only via HTTP through `VITE_API_BASE_URL`.

## User Roles

| Role | Auth | Description |
|------|------|-------------|
| **Homestay Owner** | Google OAuth 2.0 | Manages property, rooms, bookings, revenue |
| **Guest** | None (public) | Checks availability via shared link, contacts owner directly |
| **Super Admin** | Email + password | Internal ops dashboard over all homestays |

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- Google OAuth 2.0 credentials ([Cloud Console](https://console.cloud.google.com/apis/credentials))

### Backend

```bash
cd backend
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.
npm install
npm run dev          # http://localhost:4000
```

**Seed the super admin user:**
```bash
npm run seed:admin
# Default credentials: admin@availnow.in / admin123
```

### Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:4000 (default, proxied by Vite in dev)
npm install
npm run dev          # http://localhost:5173
```

The Vite dev server proxies `/api` and `/auth` requests to `localhost:4000`, so no CORS issues in local dev.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `MONGODB_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Secret for signing JWTs | — |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:4000/auth/google/callback` |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `FREE_PLAN_ROOM_LIMIT` | Max rooms on free plan | `4` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:4000` |

## Deployment

### Backend → Render / Railway / Fly.io

- **Root directory:** `backend/`
- **Build command:** `npm install`
- **Start command:** `npm start`
- Set all backend env vars in the hosting dashboard
- Attach a MongoDB Atlas cluster

### Frontend → Vercel / Netlify

- **Root directory:** `frontend/`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- Set `VITE_API_BASE_URL` to your deployed backend URL

## API Endpoints

### Auth
- `GET /auth/google` — Redirect to Google OAuth
- `GET /auth/google/callback` — OAuth callback
- `POST /auth/admin/login` — Admin login
- `GET /auth/me` — Current identity

### Properties (Owner, authenticated)
- `POST /api/properties` — Create property
- `GET /api/properties/me` — Get my property
- `PATCH /api/properties/:id` — Update property

### Room Types (Owner, authenticated)
- `POST /api/properties/:id/rooms` — Add room type
- `PATCH /api/rooms/:id` — Update room type
- `DELETE /api/rooms/:id` — Delete room type
- `GET /api/properties/:id/rooms` — List room types

### Bookings (Owner, authenticated)
- `POST /api/properties/:id/bookings` — Block rooms
- `GET /api/properties/:id/bookings` — List bookings
- `PATCH /api/bookings/:id` — Update booking
- `DELETE /api/bookings/:id` — Cancel booking

### Revenue (Owner, authenticated)
- `GET /api/properties/:id/revenue` — Revenue summary

### Public (No auth)
- `GET /api/public/:slug` — Property details
- `GET /api/public/:slug/availability` — Check availability
- `POST /api/public/:slug/view` — Log page view

### Admin (Admin, authenticated)
- `GET /api/admin/overview` — Stats overview
- `GET /api/admin/properties` — All properties
- `GET /api/admin/properties/:id/analytics` — View counts
- `PATCH /api/admin/properties/:id/plan` — Toggle plan

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router
- **Backend:** Node.js, Express, Mongoose, JWT, Google Auth Library
- **Database:** MongoDB
- **Styling:** Warm cream/white aesthetic with Inter font
