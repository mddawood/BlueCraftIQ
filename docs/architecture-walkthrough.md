# SaaS Architecture Walkthrough: Multi-Tenancy & Governance

This document describes the SaaS multi-tenant architecture, Row-Level Security (RLS) implementation, API governance, rate limiting, and administration setup for the membership platform.

---

## 1. System Overview & Core Stack

The application is a multi-tenant SaaS platform built to sell memberships for non-profit organizations.

### Tech Stack
* **Backend**: Python (FastAPI), SQLAlchemy ORM, Alembic migrations, PostgreSQL database.
* **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons.
* **Services**: Redis (rate-limiting cache), Stripe (billing/subscriptions), Salesforce (member sync).

### Folder Structure & Modules
```
/
├── backend/
│   ├── alembic/                 # Migration scripts (including initial schema & RLS setup)
│   └── app/
│       ├── api/
│       │   ├── dependencies.py  # Auth & tenant dependencies (get_current_super_admin, get_current_user)
│       │   └── routes/
│       │       ├── admin.py     # Super admin REST endpoints (tenant management, impersonation)
│       │       └── auth.py      # Core signup, login, and register-tenant endpoints
│       ├── core/
│       │   ├── config.py        # Settings validation (Pydantic Settings)
│       │   ├── context.py       # ContextVar definitions (tenant_id_var, bypass_rls_var)
│       │   └── security.py      # JWT token creation and password hashing
│       ├── db/
│       │   └── session.py       # DB engine, session initialization, and transaction RLS hooks
│       ├── models/
│       │   ├── shared.py        # Tenants model (resides in 'public' schema)
│       │   ├── tenant.py        # Business models (User, MembershipTier, Subscription)
│       │   └── usage_events.py  # API requests logs for billing and analytics
│       └── services/
│           ├── rate_limiter.py  # Sliding-window rate limiter (Redis/Memory fallback)
│           └── stripe_svc.py    # stripe connects and webhook services
└── frontend/
    └── src/
        ├── middleware.ts        # Next.js subdomain routing & admin dashboard path rewriting
        └── app/
            └── app/
                ├── admin/       # Global Super Admin Dashboard
                └── [tenant]/    # Tenant dashboard, login, checkout, and signup pages
```

---

## 2. Multi-Tenancy & Row-Level Security (RLS)

The platform utilizes a **single-database, shared-schema** multi-tenant model. Isolation is enforced directly at the database layer using Postgres Row-Level Security (RLS) policies.

### Tenant Isolation Flow
1. **Context Initialization**: Every request is intercepted by [`tenant_context_middleware`](file:///e:/Coding-related/BlueCraft/backend/app/main.py#L30) in the backend. It resolves the `tenant_id` (either from the subdomain in public/anonymous routes, or from the cryptographically signed `tenant_id` claim in JWT headers for authenticated routes).
2. **Context Storage**: The middleware sets `tenant_id_var` and `bypass_rls_var` ContextVars in Python's request-local store.
3. **Transaction Hook**: In [`session.py`](file:///e:/Coding-related/BlueCraft/backend/app/db/session.py#L38), an `after_begin` event listener hook is registered on SQLAlchemy's session. Upon starting *any* transaction, the hook runs:
   ```sql
   SET LOCAL app.current_tenant_id = '<resolved_tenant_id>';
   SET LOCAL app.bypass_rls = 'false';
   ```
4. **Database Enforced RLS**: Every tenant-owned table (`users`, `membership_tiers`, `subscriptions`) is configured in Postgres with RLS policies:
   ```sql
   CREATE POLICY tenant_isolation_policy ON public.users
   USING (
       current_setting('app.bypass_rls', true) = 'true'
       OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
   );
   ```
   If a query runs, Postgres filters rows automatically by matching the session variable `app.current_tenant_id` against the row's `tenant_id` column. If a query tries to access data belonging to a different tenant, Postgres yields zero rows.

### Auth Token (JWT) Claim
When a user logs in, the backend encodes both `tenant_id` and `is_super_admin` properties directly into the JWT token payload. This is extracted during subsequent API requests to resolve tenant boundaries securely.

### Instant Org Creation
During signup at `POST /api/v1/auth/register-tenant`, the application registers both a new `Tenant` organization and its first user (admin) in a single database transaction:
1. Validates the organization subdomain and email globally (RLS is bypassed during check).
2. Inserts the new `Tenant` record.
3. Obtains the new tenant's UUID and runs `SET LOCAL app.current_tenant_id = '<new_id>'` inside the session transaction.
4. Creates the administrative user bound to the tenant.
5. Commits the transaction.

---

## 3. Governance Limits & Rate Limiting

To prevent a single tenant from hogging shared system resources, limits are enforced at two levels:

### API Rate Limiting
API requests are rate-limited on a sliding window using a Redis Sorted Set. If Redis is not running locally, the system falls back automatically to an in-memory dictionary.
* **Storage**: Plan limits are stored directly in the `tenants` table (`rate_limit_per_minute` column).
* **Configuration**:
  * **Free**: 100 requests / minute
  * **Pro**: 1000 requests / minute
  * **Enterprise**: Unlimited ($1,000,000$ requests / minute check)
* **Keying**: Keyed by `tenant_id` instead of IP address to ensure fair sharing.

### Database Query Timeout
During transaction begins, the database runs:
```sql
SET LOCAL statement_timeout = 5000;
```
If any query takes longer than 5 seconds (5000ms), Postgres automatically terminates the query, preventing a single tenant's heavy or runaway queries from degrading database performance for other tenants.

---

## 4. Super Admin Panel & Support Impersonation

The global admin panel is accessible at `http://localhost:3000/admin`.

### Access Control
* Accessible only by users where the user record has `is_super_admin` set to `True`.
* Backed by endpoints under `/api/v1/admin/*` that are guarded by the `get_current_super_admin` dependency. These routes run SQL commands setting `app.bypass_rls = 'true'` to allow reading/writing data across all tenants.

### Admin Capabilities
* **Tenants Directory**: Lists all tenants, their plans, status, and API requests counts.
* **Plan Modification**: Changes plan levels, which automatically updates the tenant's API rate limits.
* **Suspension**: Suspending a tenant updates their status to `suspended` and disables their active status, blocking their users from logging in or using the dashboard.
* **Impersonation**: Clicking **Impersonate Organization** calls the backend to generate a valid user token for the tenant and redirects the support agent directly to `http://[subdomain].localhost:3000/dashboard`, logged in with that tenant's user session.

---

## 5. Local Setup & Running Commands

Follow these steps to run the SaaS stack locally:

### Prerequisites
1. Python (3.10+)
2. Node.js (18+)
3. Redis (optional; rate limiter uses memory fallback if not present)

### Environment Variables (`backend/.env` & `frontend/.env`)
Set these values in your configuration:
```env
# BACKEND (.env)
PROJECT_NAME="Membership Platform"
API_V1_STR="/api/v1"
SECRET_KEY="development_secret_key_change_me"
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/membership_db" # Or sqlite fallback
REDIS_URL="redis://localhost:6379/0" # Optional

# FRONTEND (.env)
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
NEXT_PUBLIC_BASE_DOMAIN="localhost:3000"
```

### Setup Database & Migrations
To initialize the Postgres database schema and RLS policies, run the Alembic command in the `backend/` folder:
```powershell
cd backend
.\venv\Scripts\activate
# Apply migrations to database
alembic upgrade head
```

### Running the Services
1. **Backend**:
   ```powershell
   cd backend
   .\venv\Scripts\activate
   uvicorn app.main:app --reload --port 8000
   ```
2. **Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```
   Open `http://localhost:3000` to access the site. To test multi-tenancy subdomains locally, use domains like `http://msmc.localhost:3000/`.
