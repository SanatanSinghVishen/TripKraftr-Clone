# AvailNow — Homestay Inventory & Booking SaaS
**Project Documentation & Technical Summary**

## 1. Project Overview
**AvailNow** is a multi-tenant B2B2C Software-as-a-Service (SaaS) application designed specifically for independent homestay and guesthouse owners in India. It bridges the gap between manual WhatsApp-based booking management and complex, expensive hotel software. 

The platform allows property owners to manage their room inventory and track offline bookings, while providing a frictionless, zero-login public availability page for their guests.

### Links
* **Live Web App (Frontend):** [https://trip-kraftr-clone.vercel.app](https://trip-kraftr-clone.vercel.app)
* **Live API (Backend):** [https://tripkraftr.onrender.com](https://tripkraftr.onrender.com)
* **GitHub Repository:** [https://github.com/SanatanSinghVishen/TripKraftr-Clone](https://github.com/SanatanSinghVishen/TripKraftr-Clone)

---

## 2. Architecture & Tech Stack
The project is built as a **Monorepo** containing two independently deployable applications.

### Frontend (React SPA)
* **Framework:** React 19 + Vite
* **Styling:** Tailwind CSS v4 + Vanilla CSS Variables for theming
* **Routing:** React Router v7
* **Key Integrations:** 
  * Context API for global Authentication state management.
  * Custom `fetch` interceptors for centralized API error handling and 401 redirects.
* **Deployment:** Vercel

### Backend (RESTful API)
* **Framework:** Node.js + Express.js
* **Database:** MongoDB (Atlas) accessed via Mongoose ODM
* **Authentication:** 
  * Google OAuth 2.0 via `google-auth-library` (for Homestay Owners)
  * Custom JWT-based authentication (for Super Admins)
* **Security & Performance:** `express-rate-limit` for public endpoints, CORS configuration.
* **Deployment:** Render

---

## 3. Core Features & User Flows

### A. Homestay Owner Flow (The SaaS User)
* **Google OAuth Onboarding:** Frictionless login using Google accounts. No passwords to remember.
* **Property Setup:** Owners configure their property details (Name, Location, Contact, WhatsApp) which generates a unique SEO-friendly URL slug (e.g., `/sunrise-homestay`).
* **Inventory Management:** Owners can add multiple room types (e.g., Deluxe, Suite) setting the total quantity, max occupancy, and meal plans. 
  * *Business Logic:* A "Free Plan" constraint explicitly limits properties to a maximum of 4 total rooms across all room types.
* **Booking Management:** Owners manually log bookings negotiated over WhatsApp/Calls. The system requires check-in/check-out dates and maps them to specific room types.
* **Revenue Tracking:** A dashboard calculates financial metrics, separating Total Booked Amount vs. Advance Collected.

### B. Guest Flow (The Consumer)
* **Frictionless Access:** Guests click the owner's shared link and land on the public availability page. No account creation or login is required.
* **Live Availability Engine:** Guests input their dates, number of people, and rooms needed. The engine calculates checkout dates dynamically and checks database availability in real-time.
* **Offline Handoff:** Once a guest finds an available room, they use pinned "Call" or "WhatsApp" action buttons to contact the owner directly. The platform deliberately omits an online payment gateway to suit the Indian homestay market's preference for UPI/direct negotiation.

### C. Super Admin Flow (The Platform Manager)
* **Role-Based Access Control (RBAC):** A completely isolated authentication flow using email/password and JWTs for platform administrators.
* **Global Dashboard:** Admins can view all registered properties across the platform.
* **Plan Management:** Admins can manually toggle properties between the "Free" and "Paid" tiers, bypassing the 4-room inventory limit for paid users.

---

## 4. Notable Technical Implementations

1. **Dynamic Availability Algorithm:** 
   Instead of keeping a static count of rooms, the backend calculates availability dynamically using **MongoDB overlapping date queries**. It fetches all active bookings intersecting the requested date range, sums the booked quantities per room type, and subtracts them from the total physical inventory to yield an accurate real-time "free count".

2. **Middleware Routing Strategy:** 
   Express routers are strictly isolated. Owner routes utilize an `authenticateHO` (Homestay Owner) JWT middleware, while Admin routes utilize an `authenticateAdmin` middleware. Public routes remain completely unauthenticated but are protected by IP-based rate limiting to prevent scraping.

3. **Client-Side SPA Routing & Vercel:** 
   A `vercel.json` rewrite rule was implemented to route all incoming traffic to `index.html`, allowing React Router to cleanly handle deep links (like Google Auth Callbacks or Public Property Pages) without triggering 404 errors on the static host.

4. **Data Integrity & Normalization:**
   Prices are stored as integers (in Paise) in MongoDB to prevent floating-point inaccuracies, and converted back to Rupees strictly at the API boundaries before reaching the frontend.

---
*Developed by Sanatan Singh Vishen*
