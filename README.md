# 🏠 AI Smart Hostel Registration & Student Assistant System

A production-ready, AI-powered hostel management system with a chat-first interface, JWT security, OpenAI integration, document uploads, and a role-based admin dashboard.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🤖 AI Chatbot | GPT-4o powered conversational registration |
| 🎤 Voice Input | Web Speech API (no external API key) |
| 📄 Document Upload | PDF/JPG/PNG with drag & drop |
| 🔐 Zero Trust Security | JWT + bcrypt + helmet + rate limiting + sanitization |
| 👤 Role-Based Access | Student / Admin portals |
| 📊 Admin Dashboard | Stats, student table, approve/reject, broadcast notifications |
| 📱 Mobile-First | Responsive glassmorphism dark UI |

---

## 📁 Project Structure

```
College Ai/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/   # MongoDB connection
│   │   ├── models/   # User, Student, Notification schemas
│   │   ├── routes/   # Express routers
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth, RBAC, sanitize
│   │   └── utils/    # Winston logger
│   ├── .env.example
│   └── server.js
└── frontend/         # React + Vite + Tailwind
    └── src/
        ├── api/      # Axios service layer
        ├── context/  # AuthContext
        ├── hooks/    # useVoice
        ├── pages/    # All screens
        └── components/ # Layout, shared UI
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- OpenAI API key

### 1. Clone & Install

```bash
# Backend
cd "College Ai/backend"
npm install

# Frontend
cd "../frontend"
npm install
```

### 2. Configure Environment

```bash
cd "College Ai/backend"
copy .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://...your Atlas URI...
JWT_SECRET=a_long_random_secret_string
OPENAI_API_KEY=sk-...your key...
ALLOWED_ORIGINS=http://localhost:5173
MAX_FILE_SIZE_MB=10
ADMIN_SECRET=your_admin_creation_secret
```

### 3. Create Admin Account

After running the server, register via the API with the admin secret header:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your_admin_creation_secret" \
  -d '{"name":"Admin","email":"admin@hostel.com","password":"Admin@1234","role":"admin"}'
```

Or set `ADMIN_SECRET` in .env and use the Login page with the above credentials.

### 4. Run the App

```bash
# Terminal 1 — Backend (from backend folder)
npm run dev

# Terminal 2 — Frontend (from frontend folder)
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔒 Security Architecture

```
Client Request
    │
    ├── Helmet (HTTP security headers)
    ├── CORS (allowlist only)
    ├── Rate Limiter (200 req/15min global; 15 req/15min for auth)
    ├── Body Size Limiter (1MB)
    ├── NoSQL Sanitizer (prevents $operator injection)
    ├── XSS Cleaner (strips script tags from inputs)
    ├── JWT Verify Middleware (every protected route)
    ├── RBAC Middleware (role enforcement)
    └── Controller (business logic)
```

- Passwords: **bcrypt** with cost factor 12
- Tokens: **JWT** with configurable expiry (default 7 days)
- Brute force: **Account lockout** after 5 failed attempts (15 min)
- Files: **MIME + size validation**, user-scoped directories, sanitized filenames
- Logs: **Winston** with rotating files (error.log + combined.log)

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Get JWT |
| GET | `/api/auth/me` | JWT | Current user |
| POST | `/api/chat` | Student | Chat with AI |
| GET | `/api/chat/history` | Student | Chat history |
| POST | `/api/upload` | Student | Upload document |
| GET | `/api/upload/documents` | Student | List documents |
| GET | `/api/student/profile` | Student | View profile |
| PUT | `/api/student/profile` | Student | Update profile |
| GET | `/api/student/notifications` | JWT | Notifications |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/students` | Admin | Student list |
| PUT | `/api/admin/students/:id/status` | Admin | Approve/reject |
| POST | `/api/admin/notify` | Admin | Broadcast notification |

---

## ☁️ Deployment (Free)

### Backend → Render.com
1. Push `backend/` to a GitHub repo
2. New Web Service on Render → connect repo
3. Build: `npm install` · Start: `npm start`
4. Add all `.env` variables in Render's Environment tab

### Frontend → Vercel
1. Push `frontend/` to a GitHub repo
2. Import on Vercel → Framework: Vite
3. Add env: `VITE_API_URL=https://your-render-app.onrender.com/api`
4. Update `vite.config.js` proxy target OR use `VITE_API_URL` in apiService.js

### Database → MongoDB Atlas
- Free M0 cluster (512MB, more than enough)
- Whitelist all IPs (0.0.0.0/0) for cloud hosting

---

## 📱 Voice Input

Supported in **Chrome** and **Edge** (desktop + Android Chrome). Uses browser's built-in Web Speech API — no external key needed. Set to `en-IN` (Indian English) for optimal accuracy.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| AI | OpenAI GPT-4o Mini |
| Auth | JWT + bcrypt |
| Security | helmet, cors, express-rate-limit, mongo-sanitize, xss-clean |
| Logging | Winston + Morgan |
| File Upload | Multer |
| Voice | Web Speech API |

---

## 📄 License

MIT — Free to use and modify for educational and commercial purposes.
