import stripe
from app.core.config import settings
from app.models.tenant import Subscription, User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

stripe.api_key = settings.STRIPE_API_KEY

class StripeService:
    @staticmethod
    async def create_checkout_session(tenant_stripe_account_id: str, price_id: str, user: User, success_url: str, cancel_url: str):
        """
        Creates a Stripe Checkout Session on behalf of a tenant (using Stripe Connect).
        If tenant_stripe_account_id is None, it uses the platform's standard Stripe account.
        """
        stripe_kwargs = {}
        if tenant_stripe_account_id:
            stripe_kwargs["stripe_account"] = tenant_stripe_account_id

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user.email,
            client_reference_id=str(user.id),
            **stripe_kwargs
        )
        return session

    @staticmethod
    async def handle_webhook_event(payload: bytes, sig_header: str, db: AsyncSession):
        """
        Handles Stripe webhooks to update subscriptions.
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            raise Exception("Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise Exception("Invalid signature")

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            # Implement subscription activation logic here
            user_id = session.get("client_reference_id")
            subscription_id = session.get("subscription")
            # Update user subscription in DB...
            
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            # Implement subscription cancellation logic here
            
        return {"status": "success"}
