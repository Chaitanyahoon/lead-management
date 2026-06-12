# AI Usage Disclosure

This document discloses the usage of AI assistance in the development, user interface styling, and deployment phases of the LeadFlow system.

## 1. AI Tools Utilized
- **Claude (Anthropic) / Gemini**: Utilized to assist with specific UI components, responsive layout presets, and deployment configurations.

## 2. What AI Was Used For
- **UI Design & Layouts**: Assisted in building the UI structure, styling cards, and implementing responsive layouts using design templates from **Shadcn UI** and **ReactBits**.
- **Deployment & Environments**: Assisted in setting up deployment configurations, environment variables, routing rewrites (e.g., `vercel.json` and CORS settings), and database seed scripts.

## 3. Manual Refactoring and Engineering Input
- **Architecture & Core Logic**: The entire system architecture (Routes-Controllers-Services separation), JWT authentication middleware, role-based access control filters, PostgreSQL database normalization, transactional least-loaded agent assignment query, soft-delete mechanisms, and pg advisory locks were designed, engineered, and built manually by the author.
- **Database Schema**: Structured the PostgreSQL tables, defined foreign key indexes, and integrated Supabase.
