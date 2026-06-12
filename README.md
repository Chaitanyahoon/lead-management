# 🚀 LeadFlow — Mini Lead Management System

A full-stack lead management application built with **Node.js**, **Express**, **PostgreSQL**, and **React**. Designed for teams that need to capture, assign, track, and manage sales leads with role-based access control, automatic agent assignment, activity logging, and email notifications.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Migration](#database-migration)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [Docker Setup](#docker-setup)
- [API Documentation](#api-documentation)
- [Lead Assignment Logic](#lead-assignment-logic)
- [Activity Logging](#activity-logging)
- [Email Notifications](#email-notifications)
- [Swagger Documentation](#swagger-documentation)
- [Rate Limiting](#rate-limiting)
- [Assumptions](#assumptions)
- [Tradeoffs](#tradeoffs)
- [Future Improvements](#future-improvements)

---

## Project Overview

LeadFlow is a mini CRM system purpose-built for small-to-medium sales teams. It provides:

- A **backend REST API** for managing users, leads, and activity logs
- A **React frontend** dashboard for interacting with the system
- **Automatic lead assignment** using a least-loaded algorithm
- **Role-based access control** (Admin, Manager, Agent)
- **Activity audit trail** for every lead interaction

The system is designed to be production-ready with input validation, rate limiting, structured error handling, and Swagger API documentation.

---

## Features

### Authentication & Authorization
- JWT-based stateless authentication
- Role-based access control (RBAC) with three roles: `admin`, `manager`, `agent`
- Password hashing with bcrypt (salt rounds: 10)
- Protected routes on both backend and frontend

### Lead Management
- Full CRUD operations on leads
- Automatic assignment to the least-loaded agent on creation
- Filtering by status, source, and free-text search (name/email/phone)
- Sorting by name, status, source, or creation date
- Pagination with configurable page size (max 100)

### Dashboard & Analytics
- Total lead count with breakdown by status
- Pipeline progress bar visualization
- Lead distribution by source
- Agent workload overview

### Activity Tracking
- Automatic logging of all lead lifecycle events
- Timeline view with performer attribution
- Tracks: creation, updates, status changes, assignments, deletions

### Notifications
- Welcome email on user registration
- Lead assignment email to agents
- Fire-and-forget pattern — email failures never crash the app

### Developer Experience
- Swagger/OpenAPI interactive documentation
- Rate limiting on all endpoints
- Structured audit logging
- Consistent JSON error responses

---

## Architecture

```
┌─────────────────┐         ┌─────────────────────────────────────┐
│                 │  HTTP    │            Backend (Express)        │
│  React Frontend │◄───────►│                                     │
│  (Vite + React  │  :5173  │  ┌─────────┐  ┌──────────────────┐ │
│   Router + BS5) │         │  │ Middleware│  │     Modules      │ │
│                 │         │  │ ─ auth   │  │ ─ auth (service, │ │
└─────────────────┘         │  │ ─ rate   │  │   controller,    │ │
                            │  │   limit  │  │   routes)        │ │
                            │  │ ─ role   │  │ ─ leads          │ │
                            │  │   check  │  │ ─ activity       │ │
                            │  │ ─ audit  │  └──────────────────┘ │
                            │  └─────────┘           │            │
                            │        │               │            │
                            │        ▼               ▼            │
                            │  ┌──────────────────────────┐       │
                            │  │    PostgreSQL Database    │       │
                            │  │  ─ users                 │       │
                            │  │  ─ leads                 │       │
                            │  │  ─ activity_logs         │       │
                            │  └──────────────────────────┘       │
                            │        │                            │
                            │        ▼                            │
                            │  ┌──────────────────────────┐       │
                            │  │   Gmail SMTP (Nodemailer)│       │
                            │  └──────────────────────────┘       │
                            └─────────────────────────────────────┘
                                       :5000
```

### Request Lifecycle

```
Client Request
  → Rate Limiter (apiLimiter / authLimiter)
    → Audit Logger (attaches res.on('finish'))
      → Auth Middleware (JWT verification)
        → Role Check Middleware (optional)
          → Validation (express-validator)
            → Controller (thin layer)
              → Service (business logic + DB queries)
                → PostgreSQL
              ← Response
            ← JSON { success, data/message }
          ← Audit log emitted on finish
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express** | Web framework |
| **PostgreSQL** | Relational database |
| **pg** | PostgreSQL client for Node.js |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT authentication |
| **express-validator** | Input validation |
| **nodemailer** | Email notifications (Gmail SMTP) |
| **swagger-jsdoc** | OpenAPI spec generation from JSDoc |
| **swagger-ui-express** | Interactive API docs UI |
| **express-rate-limit** | Request rate limiting |
| **cors** | Cross-origin resource sharing |
| **dotenv** | Environment variable management |
| **nodemon** | Dev server with auto-reload |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **Vite** | Build tool and dev server |
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **Bootstrap 5** | Responsive CSS framework |
| **Bootstrap Icons** | Icon library (CDN) |
| **React Toastify** | Toast notifications |
| **Context API** | State management (auth) |

---

## Folder Structure

```
lead-management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # PostgreSQL pool + query helper
│   │   │   ├── mailer.js             # Nodemailer Gmail transporter
│   │   │   └── swagger.js            # OpenAPI 3.0 spec config
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT Bearer verification
│   │   │   ├── roleCheck.js          # allowRoles(...) factory
│   │   │   ├── rateLimiter.js        # authLimiter + apiLimiter
│   │   │   └── auditLogger.js        # Structured JSON audit log
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js    # POST /register, /login, /logout, GET /me
│   │   │   │   ├── auth.controller.js
│   │   │   │   └── auth.service.js
│   │   │   ├── leads/
│   │   │   │   ├── leads.routes.js   # CRUD + /stats
│   │   │   │   ├── leads.controller.js
│   │   │   │   └── leads.service.js
│   │   │   └── activity/
│   │   │       ├── activity.routes.js
│   │   │       ├── activity.controller.js
│   │   │       └── activity.service.js
│   │   ├── utils/
│   │   │   └── emailService.js       # sendWelcomeEmail, sendLeadAssignmentEmail
│   │   └── app.js                    # Express entry point
│   ├── migrations/
│   │   └── 001_init.sql              # Tables, indexes, seed data
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js              # Axios instance + JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Auth state + login/logout
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── LeadTable.jsx          # Sortable table with role-gated actions
│   │   │   ├── Pagination.jsx         # Smart pagination with ellipsis
│   │   │   └── ProtectedRoute.jsx     # Auth + role guard
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx          # Stats cards + pipeline bar
│   │   │   ├── LeadsList.jsx          # Filterable, searchable lead list
│   │   │   ├── CreateLead.jsx
│   │   │   ├── EditLead.jsx
│   │   │   └── LeadDetails.jsx        # Info card + activity timeline
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## Installation

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **PostgreSQL** ≥ 14.x

### Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd lead-management

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory. Use `.env.example` as a template:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/lead_management` |
| `JWT_SECRET` | Secret key for signing JWTs | — (required) |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `PORT` | Backend server port | `5000` |
| `EMAIL_USER` | Gmail address for notifications | — (optional) |
| `EMAIL_PASS` | Gmail App Password (16 chars) | — (optional) |

> **Note:** Email notifications are optional. If `EMAIL_USER`/`EMAIL_PASS` are not set, the app runs normally — emails simply won't be sent, and a warning is logged at startup.

### Generating a Gmail App Password

1. Enable 2-Step Verification on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use the 16-character password as `EMAIL_PASS`

---

## Database Migration

### Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE lead_management;
\q
```

### Run the Migration

You can execute migrations automatically using the Node.js runner:

```bash
cd backend
npm run migrate
```

Alternatively, you can run the SQL script against your local database or Supabase SQL editor:

```bash
psql "your-postgres-connection-string" -f backend/migrations/001_init.sql
```

This creates:

| Table | Description |
|---|---|
| `users` | User accounts with roles and hashed passwords |
| `leads` | Lead records with status, source, and assignment |
| `activity_logs` | Audit trail for all lead actions |

**Indexes created:**
- `leads(status)` — fast status filtering
- `leads(assigned_to)` — fast agent lookup
- `leads(created_at DESC)` — fast chronological sorting
- `activity_logs(lead_id)` — fast activity retrieval per lead

### Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar name
        varchar email UK
        text password_hash
        varchar role
        boolean is_active
        timestamp created_at
    }
    LEADS {
        uuid id PK
        varchar name
        varchar email
        varchar phone
        varchar source
        varchar status
        uuid assigned_to FK
        text notes
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    ACTIVITY_LOGS {
        uuid id PK
        uuid lead_id FK
        varchar action
        uuid performed_by FK
        jsonb meta
        timestamp created_at
    }

    USERS ||--o{ LEADS : "assigned_to / created_by"
    USERS ||--o{ ACTIVITY_LOGS : "performed_by"
    LEADS ||--o{ ACTIVITY_LOGS : "has"
```

### Seed Data

The migration inserts 5 test users (password for all: `password123`):

| Email | Role |
|---|---|
| `admin@test.com` | admin |
| `manager@test.com` | manager |
| `agent1@test.com` | agent |
| `agent2@test.com` | agent |
| `agent3@test.com` | agent |

---

## Running the Backend

```bash
cd backend

# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be available at **http://localhost:5000**.

Health check:
```bash
curl http://localhost:5000/api/health
# → { "success": true, "message": "API is running 🚀" }
```

---

## Running the Frontend

```bash
cd frontend

# Development
npm run dev

# Production build
npm run build
npm run preview
```

The frontend will be available at **http://localhost:5173**.

> **Important:** The backend must be running on port 5000 for the frontend to work. The Axios base URL is configured to `http://localhost:5000/api`.

---

## Docker Setup

### docker-compose.yml

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: leadflow-db
    environment:
      POSTGRES_DB: lead_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/migrations/001_init.sql:/docker-entrypoint-initdb.d/001_init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: leadflow-api
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/lead_management
      JWT_SECRET: super-secret-jwt-key-change-in-production
      JWT_EXPIRES_IN: 7d
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: leadflow-ui
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["node", "src/app.js"]
```

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Run with Docker

```bash
docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| PostgreSQL | localhost:5432 |

---

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Register a new user |
| `POST` | `/auth/login` | No | Login and receive JWT |
| `GET` | `/auth/me` | Yes | Get current user profile |
| `POST` | `/auth/logout` | Yes | Logout (client-side token discard) |

#### Leads

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/leads` | Yes | admin, manager | Create a new lead |
| `GET` | `/leads` | Yes | all | List leads (paginated, filterable) |
| `GET` | `/leads/stats` | Yes | admin, manager | Dashboard statistics |
| `GET` | `/leads/:id` | Yes | all | Get lead by ID |
| `PUT` | `/leads/:id` | Yes | all | Update a lead |
| `DELETE` | `/leads/:id` | Yes | admin, manager | Delete a lead |

#### Activity

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/activity/lead/:leadId` | Yes | Get activity log for a lead |

### Query Parameters (GET /leads)

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Results per page (max 100) |
| `status` | string | — | Filter: new, contacted, qualified, won, lost |
| `source` | string | — | Filter: web, referral, cold_call, social, other |
| `search` | string | — | ILIKE search on name, email, phone |
| `sortBy` | string | created_at | Sort field: name, created_at, status, source |
| `order` | string | desc | Sort direction: asc, desc |

### Response Format

All responses follow a consistent structure:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Error description"
}

// Paginated
{
  "success": true,
  "data": [ ... ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Example: Login → Create Lead Flow

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@test.com", "password": "password123"}'

# Response → { "success": true, "data": { "user": {...}, "token": "eyJ..." } }

# 2. Create a lead (use token from step 1)
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{"name": "Rahul Sharma", "email": "rahul@example.com", "source": "web"}'

# Response → 201 with lead data + auto-assigned agent
```

---

## Lead Assignment Logic

When a new lead is created, it is **automatically assigned** to the least-loaded active agent using this algorithm:

### Least-Loaded Algorithm

```sql
SELECT u.id, COUNT(l.id) AS lead_count
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id
  AND l.status NOT IN ('won', 'lost')
WHERE u.role = 'agent' AND u.is_active = true
GROUP BY u.id
ORDER BY lead_count ASC, MAX(COALESCE(l.created_at, '1970-01-01')) ASC
LIMIT 1
```

**How it works:**

1. Query all **active agents** (role = `'agent'`, is_active = `true`)
2. Count each agent's **active leads** (status NOT IN `'won'`, `'lost'`)
3. Pick the agent with the **fewest active leads**
4. On tie, prefer the agent who was **assigned least recently** (by `MAX(created_at)`)
5. If **no agents exist**, `assigned_to` is set to `NULL`

**Race condition protection:** The agent query and lead INSERT run inside a PostgreSQL `BEGIN`/`COMMIT` **transaction** to prevent two concurrent requests from assigning to the same agent when loads are equal.

---

## Activity Logging

Every significant lead event is automatically recorded in the `activity_logs` table:

| Action | Trigger | Meta (JSONB) |
|---|---|---|
| `lead_created` | New lead inserted | `{ assigned_to: <agent_id> }` |
| `lead_updated` | Any field updated | `{ updatedFields: ["name", "status"] }` |
| `status_changed` | Status field changes | `{ from: "new", to: "qualified" }` |
| `lead_assigned` | assigned_to changes | `{ to: <new_agent_id> }` |
| `lead_deleted` | Lead removed | `null` |

### Timeline View

The frontend displays a visual timeline of all activities on the Lead Details page, showing:
- Action icon and label (color-coded)
- Performer name
- Timestamp
- Status transition badges (for status changes)
- Updated field names (for updates)

---

## Email Notifications

### Emails Sent

| Event | Recipient | Subject |
|---|---|---|
| User registration | New user | "Welcome to Lead Management System" |
| Lead auto-assignment | Assigned agent | "New Lead Assigned: {lead_name}" |

### Design Principles

- **Fire-and-forget:** Emails are dispatched without `await` in the main request flow. Failures are caught and logged to console — they never crash the app or slow down API responses.
- **Dual format:** Every email includes both HTML (styled) and plain text versions.
- **Graceful degradation:** If email credentials are not configured, the app starts normally with a console warning. All other functionality works without email.

---

## Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:5000/api/docs
```

- No authentication required to access the docs
- Supports "Try it out" for all endpoints
- JWT Bearer auth can be configured in the Authorize dialog
- Includes schemas for `User`, `Lead`, `ActivityLog`, and `Error`

The Swagger spec is auto-generated from JSDoc comments in the route files using `swagger-jsdoc`.

---

## Rate Limiting

Two rate limiters protect the API:

| Limiter | Scope | Window | Max Requests | Purpose |
|---|---|---|---|---|
| `authLimiter` | `/api/auth/*` | 15 minutes | 10 | Prevent brute-force login/registration |
| `apiLimiter` | `/api/*` | 1 minute | 100 | General abuse protection |

When a limit is exceeded, the API returns:

```json
{
  "success": false,
  "message": "Too many attempts. Please try again after 15 minutes."
}
```

Rate limit headers are included in responses (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) per the IETF draft standard.

---

## Assumptions

1. **Single-instance deployment.** Rate limiting uses in-memory storage; for multi-instance deployments, a Redis-backed store is needed.
2. **Gmail SMTP.** Email is configured for Gmail; other providers would require transporter config changes.
3. **Stateless JWT.** Logout is client-side only (token discard). There is no server-side token blacklist.
4. **PostgreSQL availability.** The app assumes PostgreSQL is running and accessible at startup.
5. **Trust in assigned agents.** Agents can update the status and notes on their own leads, but cannot reassign leads.
6. **No multi-tenancy.** The system supports a single organization.
7. **Seed data passwords.** All seed users share the same password hash for `password123`.
8. **Frontend CORS.** The backend allows all origins (`cors()` with defaults). Restrict in production.

---

## Tradeoffs

| Decision | Rationale | Alternative |
|---|---|---|
| **pg (raw SQL)** over an ORM | Full control over queries, no ORM overhead, transparent SQL for the least-loaded algorithm | Sequelize, Prisma, TypeORM |
| **JWT in localStorage** | Simple implementation, works across tabs | httpOnly cookies (more secure against XSS) |
| **Hard delete** for leads | Simpler implementation; cascade handles activity logs | Soft delete with `deleted_at` column |
| **Fire-and-forget emails** | Doesn't block the API response | Message queue (Bull, RabbitMQ) for guaranteed delivery |
| **In-memory rate limiting** | Zero dependencies, works out of the box | Redis-backed store for distributed systems |
| **Console audit logging** | Minimal setup for development | Structured logging to ELK/Datadog/CloudWatch |
| **Bootstrap 5** over custom CSS | Rapid development, consistent responsive design | Tailwind CSS, custom design system |
| **Context API** over Redux | Sufficient for auth-only global state | Redux/Zustand for complex state |
| **No WebSocket** | REST is sufficient for current requirements | WebSocket/SSE for real-time lead updates |

---

## Future Improvements

### High Priority
- [ ] **Refresh token rotation** — Implement refresh tokens with httpOnly cookies
- [ ] **Soft delete** — Add `deleted_at` column instead of hard deleting leads
- [ ] **Redis rate limiting** — Support horizontal scaling
- [ ] **Server-side token blacklist** — Proper logout invalidation
- [ ] **Input sanitization** — Add `xss-clean` or `helmet` middleware

### Medium Priority
- [ ] **Lead import/export** — CSV upload and download
- [ ] **Bulk operations** — Multi-select and bulk status update
- [ ] **Lead notes timeline** — Separate notes from lead metadata
- [ ] **Assignment rules engine** — Configure assignment by source, region, or skill
- [ ] **Email templates** — Handlebars/EJS-based dynamic email templates
- [ ] **File attachments** — Upload documents per lead (S3/MinIO)

### Low Priority
- [ ] **WebSocket notifications** — Real-time lead assignment alerts
- [ ] **Dark mode** — Theme toggle in the frontend
- [ ] **Internationalization** — Multi-language support (i18n)
- [ ] **Reporting module** — Charts, date-range filters, export to PDF
- [ ] **Webhook integrations** — Notify external systems on lead events
- [ ] **Multi-tenancy** — Organization-level data isolation
- [ ] **Mobile app** — React Native client

---

## License

This project is for educational and demonstration purposes.

---

<p align="center">
  Built with ❤️ using Node.js, React, and PostgreSQL
</p>
