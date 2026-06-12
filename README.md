# 🚀 LeadFlow — Lead Management System

LeadFlow is a full-stack lead management CRM featuring role-based access control, concurrency-safe least-loaded agent auto-assignment, activity auditing, and report exports.

---

### 🌐 Live Deployment Links
* **Frontend App (Vercel)**: [https://lead-management-one-neon.vercel.app/](https://lead-management-one-neon.vercel.app/)
* **Backend API Server (Render)**: [https://lead-management-w79i.onrender.com/](https://lead-management-w79i.onrender.com/)
* **Swagger API Docs**: [https://lead-management-w79i.onrender.com/api/docs](https://lead-management-w79i.onrender.com/api/docs)

---

## 🛠️ Tech Stack & Architecture
* **Frontend**: React 18, Vite, Bootstrap 5, Axios
* **Backend**: Node.js, Express, `express-validator` (validation), `helmet` (security)
* **Database**: PostgreSQL (Supabase)
* **Security**: Stateless JWT Auth, rate-limiting on auth (`10req/15m`) and API endpoints (`100req/1m`).
* **Concurrency**: PostgreSQL advisory locks (`pg_advisory_xact_lock`) for race-free agent assignment.

---

## 📁 Folder Structure
```text
lead-management/
├── backend/            # Express API Server
│   ├── src/            # Middlewares, routes, controllers, and services
│   └── migrations/     # Database schemas and seed data
└── frontend/           # React Client App
    └── src/            # Components, pages, layouts, and API clients
```

---

## ⚙️ Environment Configuration
Create a `.env` file in the `/backend` folder:
```env
DATABASE_URL=postgresql://user:password@host:port/dbname?pgbouncer=true
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
PORT=5000
```

---

## 📦 Setup & Database Migration
1. **Install Dependencies**:
   ```bash
   # From root folder
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. **Run Migrations & Seed Data**:
   This runs `/backend/migrations/001_init.sql` to build the schema and seed 5 default users:
   ```bash
   cd backend
   npm run migrate
   ```
   *Note: Seed users include `admin@test.com`, `manager@test.com`, and `agent1@test.com` (password for all: `password123`).*

---

## 🏃 Running the Application
* **Backend (Port 5000)**:
  ```bash
  cd backend
  npm run dev      # Development hot-reload
  # OR
  npm start        # Production start
  ```
* **Frontend (Port 5173)**:
  ```bash
  cd frontend
  npm run dev      # Local dev server (proxies to live backend by default)
  ```

---

## 📊 Database Design & ER Diagram
```mermaid
erDiagram
    users {
        uuid id PK
        varchar name
        varchar email UK
        text password_hash
        varchar role
        boolean is_active
        timestamp created_at
    }
    leads {
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
    activity_logs {
        uuid id PK
        uuid lead_id FK
        varchar action
        uuid performed_by FK
        jsonb meta
        timestamp created_at
    }
    users ||--o{ leads : "assigned_to / created_by"
    users ||--o{ activity_logs : "performed_by"
    leads ||--o{ activity_logs : "has"
```

---

## 🔌 API Endpoints
Interactive swagger documentation is available live at `/api/docs`.
* **POST `/api/auth/login`**: Authenticates user and returns JWT.
* **POST `/api/leads`**: Creates a lead and auto-assigns it to the least-loaded agent using transaction locks.
* **GET `/api/leads`**: Returns paginated, filterable, and sorted list of leads.
* **GET `/api/leads/export`**: Exports leads database to CSV (role-restricted).
* **DELETE `/api/leads/:id`**: Performs soft delete (`deleted_at = NOW()`).

---

## 🧠 Key Assumptions & Tradeoffs
### Assumptions:
1. **Agent Workload**: Defined as the number of active leads currently assigned to an agent (excluding statuses `won` and `lost`).
2. **Soft Deletes**: Soft deletes are used to prevent data loss. Historical records in `activity_logs` remain intact when a lead is removed.
3. **JWT Statelessness**: Token verification happens entirely on the gateway/middleware level.

### Tradeoffs:
1. **Advisory Locks vs DB-wide Serializable Transactions**: Used `pg_advisory_xact_lock(1001)` to serialize assignment checks on lead creation. This prevents double-assignment race conditions under concurrent load without locking the whole table, maintaining higher query throughput.
2. **In-Memory Rate Limiting**: Selected `express-rate-limit`'s default memory store for simplicity. For containerized production scaling, migrating to a Redis-backed rate limiter is recommended.
