# Project Architecture Presentation Guide

This document outlines the content structure for your mandatory **Architecture Explanation (5–10 slides)**. You can easily copy and paste these outlines into PowerPoint or Google Slides.

---

## Slide 1: Title & Project Overview
* **Title**: LeadFlow — Mini Lead Management System
* **Subtitle**: Technical Architecture & Design Implementation
* **Bullet Points**:
  - Full-stack CRM built with **Node.js/Express**, **PostgreSQL**, and **React (Vite)**.
  - Features role-based access control (RBAC), automatic least-loaded agent assignment, and audit timelines.
  - Production-ready with rate limiting, Swagger OpenAPI docs, and Docker orchestration.

---

## Slide 2: Project Architecture
* **Title**: Multi-Layer Service Architecture
* **Bullet Points**:
  - Separates concerns into distinct layers:
    1. **Routing Layer**: Validates input schemas using `express-validator` middleware.
    2. **Controller Layer**: Coordinates requests and responses; maps HTTP status codes.
    3. **Service Layer**: Houses the core business logic (agent assignment, exports, DB transactions).
    4. **Middleware Layer**: Enforces authentication (JWT), authorization (RBAC), rate-limiting, and audit logging.
    5. **Database Layer**: Manages PostgreSQL connection pools and parameterised query execution.

---

## Slide 3: Database Design Decisions
* **Title**: Normalised PostgreSQL Database Design
* **Bullet Points**:
  - **Normalization (3NF)**: Structured into separate tables: `users` (accounts), `leads` (sales targets), and `activity_logs` (audit history).
  - **Foreign Key Constraints**: Integrates references with defensive cascade actions (`ON DELETE SET NULL` on users, `ON DELETE CASCADE` on logs).
  - **Data Retention Strategy**: Implements **Soft Deletes** (`deleted_at` timestamps) to prevent loss of activity logs and sales history.
  - **Indexing Plan**: Added indexes on `leads(status)`, `leads(assigned_to)`, `leads(created_at DESC)`, and `activity_logs(lead_id)` for high-velocity queries.

---

## Slide 4: Authentication & Security Flow
* **Title**: JWT-Based Authentication & Authorization (RBAC)
* **Bullet Points**:
  - **Authentication**: Stateless authentication using JWT bearer tokens transmitted in authorization headers.
  - **Password Security**: Strong hashing using `bcryptjs` with 10 salt rounds.
  - **Access Control (RBAC)**: Role validation middleware (`allowRoles('admin', 'manager')`) intercepts and protects private endpoints.
  - **Rate Limiting**: Custom limits configured via `express-rate-limit` to block brute-force attempts on auth (`10req/15m`) and standard routes (`100req/1m`).

---

## Slide 5: Lead Auto-Assignment Logic
* **Title**: Concurrency-Safe Least-Loaded Assignment Engine
* **Bullet Points**:
  - **The Algorithm**: Automatically assigns new leads to active agents who have the fewest unresolved leads (status not in `won` or `lost`), using the oldest assignment date as a tie-breaker.
  - **Concurrency Challenge**: Concurrent creation requests under default PG `Read Committed` isolation level can read identical loads, leading to duplicate assignment race conditions.
  - **The Resolution**: Implements a PostgreSQL transaction-level advisory lock (`pg_advisory_xact_lock`) immediately after the transaction begins, serializing assignment checks.

---

## Slide 6: Observability & Monitoring
* **Title**: Activity Logs & Request Auditing
* **Bullet Points**:
  - **Activity Logs**: Automatically logs vital lifecycle events: `lead_created`, `lead_updated`, `lead_assigned`, `status_changed`, and `lead_deleted`.
  - **Request Auditing**: Implements a global audit logger middleware that captures request methods, URLs, user IDs, caller IP addresses, and response status codes, logging them as structured JSON strings.
  - **Resilience**: Third-party email notifications (welcome emails and assignment alerts) run in a non-blocking `fire-and-forget` promise wrapper so mail server down-time never blocks API execution.

---

## Slide 7: Scalability & Production Enhancements
* **Title**: Future Extensibility & Horizontal Scaling
* **Bullet Points**:
  - **Distributed Caching**: Upgrade rate limiting and session validation from memory to a Redis store.
  - **Refresh Token Rotation**: Migrate JWT storage from `localStorage` to secure, HttpOnly cookie exchange cycles.
  - **Task Queue**: Move fire-and-forget notification processes to a background worker queue (e.g., BullMQ) to ensure message delivery guarantees.
