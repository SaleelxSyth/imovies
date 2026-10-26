# 🎬 iMovies - Real-Time MERN Cinema Ticket Booking Platform

[![CI Pipeline](https://github.com/imovies/imovies/actions/workflows/ci.yml/badge.svg)](https://github.com/imovies/imovies/actions)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-v16%2B-green.svg)](https://nodejs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4-black.svg)](https://socket.io)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-v5.3-purple.svg)](https://getbootstrap.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Ready-brightgreen.svg)](https://www.mongodb.com)

**iMovies** is a full-stack, college-project-grade cinema ticket booking platform built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js). It features real-time seat availability via **Socket.io**, atomic seat locking with 5-minute countdown timers, instant QR-coded printable tickets, Razorpay and fast one-click demo payment gateways, comprehensive review moderation, and an administrative control center.

---

## 🌟 Key Features

### Customer Experience
- **Cinematic Experience**: Dark noir aesthetics with amber and crimson neon highlights, responsive on desktop, tablet, and mobile.
- **Real-Time Seat Management**:
  - Live seat updates via Socket.io rooms (`show:<id>`).
  - Atomic seat locking with a 5-minute TTL countdown timer preventing double booking.
  - Visual curved cinema screen with tiered pricing: **Regular**, **Premium**, and **Recliner**.
  - Maximum 8 seats per booking transaction.
- **Smart Movie Catalog**: Multi-faceted filtering by genre, language, theatre, city (Mumbai, Bengaluru, Delhi), status (Now Showing / Coming Soon), and release date.
- **Movie Trailers**: Integrated YouTube modal preview.
- **Instant Digital Passes**: Printable cinema tickets equipped with verified **QR Code** and barcode data.
- **Cancellation & 100% Refunds**: Automatic full refund calculation if cancelled more than 2 hours prior to showtime; real-time seat release.
- **Watchlist & Reviews**: Bookmark favorite movies; verified star ratings with average score recalculation.
- **In-App & Email Notifications**: Real-time alerts for confirmations and cancellations.

### Admin Management
- **Analytics KPI Dashboard**: Live stats for total revenue, confirmed bookings, registered users, and seat occupancy percentage.
- **Top Grossing Movies & Trends**: Real-time sales breakdown.
- **Movie Catalog Manager**: Add movies with custom poster upload (via Multer), edit status, and delete.
- **Theatre & Multi-Screen Setup**: Configure screen dimensions, row letters, and seat capacities.
- **Show Scheduling**: Schedule shows with **automatic seat generation** according to screen layout.
- **Customer Bookings Oversight**: Search transactions by code and audit payment logs.
- **Review Moderation**: Approve or hide audience reviews.
- **User Management**: Inspect users and toggle block/unblock privileges.

---

## 🏗️ Architecture & Layered Design

```
imovies/
├── server/
│   ├── index.js                # Express app, Socket.io, HTTP server, error handling
│   ├── config/
│   │   ├── db.js               # Mongoose connection & embedded fallback
│   │   └── env.js              # Environment schema validation
│   ├── models/                 # User, Movie, Theatre, Show, Seat, Booking, Payment, Review, Notification
│   ├── middleware/             # auth (JWT), rateLimiter, error, upload (Multer), validate
│   ├── services/               # authService, seatService, bookingService, paymentService, showService
│   ├── controllers/            # Controller endpoints matching REST specifications
│   ├── routes/                 # Express route handlers mounted on /api
│   ├── sockets/
│   │   └── seatSocket.js       # Socket.io room management & seat lock broadcast
│   ├── utils/                  # Winston/Morgan logger, cleanupJob, qrGenerator
│   ├── seed/
│   │   └── seed.js             # 1 Admin, 2 Users, 11 Movies, 3 Theatres, 7-day shows
│   └── tests/                  # Jest & Supertest suites (Auth, Movie, SeatLock, Booking)
├── client/
│   ├── src/
│   │   ├── components/         # Navbar, Footer, MovieCard, SeatGrid, PrintableTicket, Loader
│   │   ├── pages/              # Home, Movies, Detail, SeatSelection, Checkout, Confirmation, Admin
│   │   ├── redux/              # Redux Toolkit store and slices
│   │   ├── services/           # Axios interceptor instance, Socket.io client
│   │   ├── index.css           # Custom cinema stylesheet + Bootstrap 5
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── postman_collection.json     # Complete Postman collection covering all endpoints
├── ecosystem.config.js         # PM2 production configuration
└── README.md
```

---

## 🔑 Seeded Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@imovies.com` | `Admin@123` | Full Admin Control Center, CRUD, Moderation |
| **User 1** | `john@example.com` | `User@123` | Bookings, Watchlist, Reviews |
| **User 2** | `sarah@example.com` | `User@123` | Bookings, Watchlist, Reviews |

> **Pro Tip**: The Sign-In page (`/login`) includes one-click demo login buttons for both Admin and User roles.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v16+ (tested on Node v20/v24)
- **MongoDB**: Local MongoDB on `mongodb://127.0.0.1:27017/Imovies` or MongoDB Atlas.
  *(Note: A zero-configuration in-memory fallback is automatically included for rapid development).*

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
npm run seed       # Seeds Admin, users, 11 movies, 3 theatres, and shows for 7 days
npm run dev        # Starts Express server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```

Visit **http://localhost:5173** in your browser.

---

## 🧪 Automated Testing

The backend includes comprehensive Jest and Supertest test suites verifying:
1. **Authentication Workflows**: Registration, JWT tokens, login verification, input validation, role checks.
2. **Movie Catalog & Filtering**: Search queries, language/genre filtering, admin movie creation.
3. **Real-Time Seat Concurrency**: Demonstrates that two concurrent requests attempting to lock the exact same seat simultaneously results in exactly one winner (200) and one conflict rejection (409), preventing double booking.
4. **End-to-End Booking Lifecycle**: Atomic seat lock → pending reservation → payment verification → booked status commitment → booking retrieval → 100% refund cancellation and seat release.

Run tests:
```bash
cd server
npm test
```

---

## 🎥 Live Real-Time Demo Walkthrough

### Test Real-Time Seat Synchronization Across Two Browsers
1. Open **Browser 1** (e.g. Chrome) at `http://localhost:5173` and log in as `john@example.com`.
2. Open **Browser 2** (e.g. Incognito / Edge) and log in as `sarah@example.com`.
3. In both browsers, navigate to the same movie (e.g. *Interstellar: Beyond Horizons*) and select the same showtime.
4. In **Browser 1**, click seat **A1**:
   - In **Browser 1**, seat **A1** turns electric cyan (Selected).
   - In **Browser 2**, seat **A1** instantly changes in real-time to amber with a lock icon (`locked by other customer`) without reloading the page!
5. In **Browser 1**, deselect seat **A1**:
   - In **Browser 2**, seat **A1** unlocks back to available slate gray in real-time.

### Test Booking & Payment Flow
1. Select seats **B1** and **B2**.
2. Click **Proceed to Checkout**.
3. Observe the **5-minute lock countdown timer**.
4. Click **One-Click Fast Demo Pay** (or choose Razorpay test gateway).
5. Watch the booking confirmation pass appear with your unique booking code (e.g. `IMV-7A9B2C4D`) and printable QR code!
6. Open **My Bookings** to view the confirmed ticket or cancel it for an immediate refund.

---

## 📡 REST API Summary

All endpoints are prefixed with `/api`.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new user account |
| `POST` | `/auth/login` | Public | Login with email & password, returns JWT |
| `GET` | `/auth/me` | Protected | Get authenticated user profile |
| `POST` | `/auth/logout` | Public | Clear auth cookie |
| `GET` | `/movies` | Public | Get movies (search, filter by genre, language, city, sort, page) |
| `GET` | `/movies/:id` | Public | Get movie details |
| `POST` | `/movies` | Admin | Create movie (supports poster upload) |
| `DELETE`| `/movies/:id` | Admin | Delete movie and associated shows |
| `GET` | `/theatres` | Public | List theatres (filter by city) |
| `POST` | `/theatres` | Admin | Create theatre with screen layouts |
| `GET` | `/shows` | Public | Query shows by movie, theatre, date, city |
| `GET` | `/shows/:id` | Public | Get show details with seat map |
| `POST` | `/shows` | Admin | Schedule show and auto-generate tiered seats |
| `POST` | `/shows/:id/seats/lock` | Protected | Atomically lock up to 8 seats (5-min TTL) |
| `POST` | `/shows/:id/seats/unlock` | Protected | Release locked seats |
| `POST` | `/bookings` | Protected | Create pending booking from locked seats |
| `GET` | `/bookings/my` | Protected | Get user's upcoming and past bookings |
| `PUT` | `/bookings/:id/cancel` | Protected | Cancel booking with 100% refund policy |
| `POST` | `/payments/create-order`| Protected | Create Razorpay / mock payment order |
| `POST` | `/payments/verify` | Protected | Verify payment signature and commit seats |
| `GET` | `/admin/stats` | Admin | Get revenue, bookings, user stats, occupancy |
| `GET` | `/admin/reports/revenue` | Admin | Aggregate daily revenue by date range |
| `PATCH` | `/users/:id/block` | Admin | Block or unblock a user account |

*(Import `postman_collection.json` into Postman for ready-to-test requests).*

---

## 🚢 Deployment Guide

### Frontend (Vercel / Netlify)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Environment variables: `VITE_API_URL=https://your-backend.onrender.com/api`, `VITE_SOCKET_URL=https://your-backend.onrender.com`

### Backend (Render / EC2 / Railway)
1. Build command: `npm install`
2. Start command: `node index.js`
3. Environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `MOCK_PAYMENT_MODE=true`

---

## ⚖️ License
MIT License. Developed for Academic Project Demonstrations & Advanced Full-Stack Portfolios.
