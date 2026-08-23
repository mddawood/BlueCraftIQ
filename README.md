# Multi-Tenant Membership Platform

This workspace contains a multi-tenant web application for selling memberships to non-profit organizations. 

## Tech Stack
**Backend (`/backend`)**:
- Python, FastAPI
- PostgreSQL (Schema-per-tenant architecture)
- SQLAlchemy ORM (async)
- JWT Authentication
- Stripe (Subscriptions & Connect)
- Salesforce (simple-salesforce sync)

**Frontend (`/frontend`)**:
- Next.js 14 (App Router)
- React, TypeScript, Tailwind CSS
- React Query, React Hook Form, Zod

## Architecture
- **Multi-Tenancy**: The application resolves tenants based on the subdomain (e.g., `org1.example.com`). The backend middleware dynamically switches the database schema to the tenant's schema, while a shared `public` schema holds global tenant records.
- **Frontend Subdomains**: The Next.js middleware rewrites subdomains to dynamic routes `app/[tenant]`.

## Current State
- The initial boilerplate and file scaffolding has been completed.
- The Python virtual environment is set up at `backend/venv` with all dependencies installed.
- Next steps: Initialize the Postgres database, run Alembic migrations, and install the NPM packages in the frontend.

---
*Note for AI Assistants: This project uses a strict schema-per-tenant architecture. Always ensure database queries are scoped to the correct tenant schema via `get_current_tenant_db` dependency.*
