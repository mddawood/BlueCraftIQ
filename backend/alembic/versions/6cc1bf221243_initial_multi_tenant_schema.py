"""initial_multi_tenant_schema

Revision ID: 6cc1bf221243
Revises: 
Create Date: 2026-08-31 01:18:22.547829

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6cc1bf221243'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create tenants table
    op.create_table('tenants',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('subdomain', sa.String(), nullable=False),
        sa.Column('schema_name', sa.String(), nullable=False),
        sa.Column('plan', sa.String(), nullable=False, server_default="free"),
        sa.Column('status', sa.String(), nullable=False, server_default="active"),
        sa.Column('rate_limit_per_minute', sa.Integer(), nullable=False, server_default="100"),
        sa.Column('stripe_account_id', sa.String(), nullable=True),
        sa.Column('salesforce_refresh_token', sa.String(), nullable=True),
        sa.Column('salesforce_instance_url', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default="true"),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('schema_name'),
        schema='public'
    )
    op.create_index(op.f('ix_public_tenants_subdomain'), 'tenants', ['subdomain'], unique=True, schema='public')

    # 2. Create users table
    op.create_table('users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('middle_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('mobile', sa.String(), nullable=True),
        sa.Column('street_address', sa.String(), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('state', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default="true"),
        sa.Column('is_superuser', sa.Boolean(), nullable=True, server_default="false"),
        sa.Column('is_super_admin', sa.Boolean(), nullable=False, server_default="false"),
        sa.Column('salesforce_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['public.tenants.id']),
        schema='public'
    )
    op.create_index(op.f('ix_public_users_email'), 'users', ['email'], unique=True, schema='public')
    op.create_index(op.f('ix_public_users_tenant_id'), 'users', ['tenant_id'], unique=False, schema='public')

    # 3. Create membership_tiers table
    op.create_table('membership_tiers',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('stripe_product_id', sa.String(), nullable=True),
        sa.Column('stripe_price_id', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['public.tenants.id']),
        schema='public'
    )
    op.create_index(op.f('ix_public_membership_tiers_tenant_id'), 'membership_tiers', ['tenant_id'], unique=False, schema='public')

    # 4. Create subscriptions table
    op.create_table('subscriptions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('tier_id', sa.UUID(), nullable=False),
        sa.Column('stripe_subscription_id', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True, server_default="active"),
        sa.Column('current_period_end', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['public.tenants.id']),
        sa.ForeignKeyConstraint(['user_id'], ['public.users.id']),
        sa.ForeignKeyConstraint(['tier_id'], ['public.membership_tiers.id']),
        schema='public'
    )
    op.create_index(op.f('ix_public_subscriptions_tenant_id'), 'subscriptions', ['tenant_id'], unique=False, schema='public')

    # 5. Create usage_events table
    op.create_table('usage_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('path', sa.String(), nullable=False),
        sa.Column('method', sa.String(), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['public.tenants.id']),
        schema='public'
    )
    op.create_index(op.f('ix_public_usage_events_tenant_id'), 'usage_events', ['tenant_id'], unique=False, schema='public')
    op.create_index(op.f('ix_public_usage_events_timestamp'), 'usage_events', ['timestamp'], unique=False, schema='public')

    # --- Postgres RLS Policies and Setup ---
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;")
        op.execute("ALTER TABLE public.users FORCE ROW LEVEL SECURITY;")
        op.execute("ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;")
        op.execute("ALTER TABLE public.membership_tiers FORCE ROW LEVEL SECURITY;")
        op.execute("ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;")
        op.execute("ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;")
        
        op.execute("""
            CREATE POLICY tenant_isolation_policy ON public.users
            USING (
                current_setting('app.bypass_rls', true) = 'true'
                OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
            );
        """)
        op.execute("""
            CREATE POLICY tenant_isolation_policy ON public.membership_tiers
            USING (
                current_setting('app.bypass_rls', true) = 'true'
                OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
            );
        """)
        op.execute("""
            CREATE POLICY tenant_isolation_policy ON public.subscriptions
            USING (
                current_setting('app.bypass_rls', true) = 'true'
                OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
            );
        """)


def downgrade() -> None:
    """Downgrade schema."""
    # --- Remove Postgres RLS Policies ---
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP POLICY IF EXISTS tenant_isolation_policy ON public.users;")
        op.execute("ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;")
        op.execute("DROP POLICY IF EXISTS tenant_isolation_policy ON public.membership_tiers;")
        op.execute("ALTER TABLE public.membership_tiers DISABLE ROW LEVEL SECURITY;")
        op.execute("DROP POLICY IF EXISTS tenant_isolation_policy ON public.subscriptions;")
        op.execute("ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;")

    op.drop_table('usage_events', schema='public')
    op.drop_table('subscriptions', schema='public')
    op.drop_table('membership_tiers', schema='public')
    op.drop_table('users', schema='public')
    op.drop_table('tenants', schema='public')
