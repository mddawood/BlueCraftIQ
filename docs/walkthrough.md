# Membership Platform Scaffold Walkthrough

I have successfully scaffolded the foundational architecture for the multi-tenant membership platform directly into your workspace (`e:\Coding-related\BlueCraft`).

## Architecture Highlights

1. **Multi-Tenant Routing (Next.js)**:
   - Implemented in [frontend/src/middleware.ts](file:///e:/Coding-related/BlueCraft/frontend/src/middleware.ts) which transparently rewrites subdomains (like `org1.example.com`) to dynamic routes `app/[tenant]`.
   - The tenant layouts are handled in [frontend/src/app/app/[tenant]/layout.tsx](file:///e:/Coding-related/BlueCraft/frontend/src/app/app/%5Btenant%5D/layout.tsx).

2. **Schema-Per-Tenant (FastAPI + SQLAlchemy)**:
   - Shared data (like the Tenant registry) lives in `public`. See [backend/app/models/shared.py](file:///e:/Coding-related/BlueCraft/backend/app/models/shared.py).
   - Tenant-specific data (Users, Memberships) lives in dynamic schemas. See [backend/app/models/tenant.py](file:///e:/Coding-related/BlueCraft/backend/app/models/tenant.py).
   - A FastAPI Dependency automatically switches the Postgres `search_path` to the correct schema based on the subdomain. See [backend/app/api/dependencies.py](file:///e:/Coding-related/BlueCraft/backend/app/api/dependencies.py).

3. **Integrations**:
   - **Stripe**: Services initialized for handling Stripe Checkout creation and Webhook parsing. See [backend/app/services/stripe_svc.py](file:///e:/Coding-related/BlueCraft/backend/app/services/stripe_svc.py).
   - **Salesforce**: Setup a basic sync service using `simple-salesforce` to push Users as Contacts into a Tenant's connected org. See [backend/app/services/salesforce_svc.py](file:///e:/Coding-related/BlueCraft/backend/app/services/salesforce_svc.py).

4. **Security**:
   - Custom JWT authentication implemented. See [backend/app/core/security.py](file:///e:/Coding-related/BlueCraft/backend/app/core/security.py) and [backend/app/api/routes/auth.py](file:///e:/Coding-related/BlueCraft/backend/app/api/routes/auth.py).

## Next Steps

To boot up the project locally:

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic init alembic # to setup initial migrations
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

> [!TIP]
> For local testing with subdomains, you will need to map `127.0.0.1 tenant1.localhost` in your Windows `C:\Windows\System32\drivers\etc\hosts` file, and access `http://tenant1.localhost:3000`.
