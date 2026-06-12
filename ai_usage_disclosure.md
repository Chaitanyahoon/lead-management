# AI Usage Disclosure

This document discloses the usage of AI assistance in the development and prototyping phases of the LeadFlow system.

## 1. AI Tools Utilized
- **Claude (Anthropic)**: Utilized to assist with specific UI presets, responsive styling choices, and the implementation of the CSV export utility.

## 2. What AI Was Used For
- **UI Design Presets**: Assisted in setting up responsive CSS variables, Bootstrap 5 column structures, and theme transition styles in the user interface.
- **CSV Export Functionality**: Assisted in prototyping the backend CSV parsing loop and client-side download handler.

## 3. Manual Refactoring and Engineering Input
- **Architecture and Core Logic**: The entire system architecture (Routes-Controllers-Services separation), JWT authentication middleware, role-based access control filters, PostgreSQL database normalization, transactional least-loaded agent assignment query, soft-delete mechanisms, and advisory locks were designed, engineered, and built manually by the author.
- **Database & Deployment Configurations**: Structured PostgreSQL tables, defined foreign key indexes, configured Supabase connections, and prepared environment setups for Render and Vercel.
