from simple_salesforce import Salesforce
from app.models.tenant import User
from app.models.shared import Tenant
import requests

class SalesforceService:
    @staticmethod
    def get_client(tenant: Tenant) -> Salesforce:
        """
        Initializes a Salesforce client for the given tenant using their stored credentials/tokens.
        In a real scenario, you'd use OAuth to exchange refresh_token for a new access token here.
        """
        # Example OAuth token exchange (Mocked for conceptual illustration)
        # access_token = refresh_oauth_token(tenant.salesforce_refresh_token)
        
        # Using a dummy session id for now to show the setup
        if not tenant.salesforce_instance_url:
            raise ValueError("Salesforce instance URL not configured for tenant.")
            
        sf = Salesforce(
            instance_url=tenant.salesforce_instance_url,
            session_id="MOCK_SESSION_ID", # Replace with actual OAuth access token
            client_id="YOUR_CONNECTED_APP_CLIENT_ID"
        )
        return sf

    @staticmethod
    def sync_user_to_salesforce(tenant: Tenant, user: User):
        """
        Pushes a user record to the tenant's Salesforce org as a Contact.
        """
        try:
            sf = SalesforceService.get_client(tenant)
            contact_data = {
                "FirstName": user.first_name,
                "LastName": user.last_name or "Unknown",
                "Email": user.email,
                "Description": "Synced from Membership Platform"
            }
            
            if user.salesforce_id:
                # Update existing contact
                sf.Contact.update(user.salesforce_id, contact_data)
            else:
                # Create new contact
                result = sf.Contact.create(contact_data)
                if result.get("success"):
                    # We should save this ID back to our DB
                    return result.get("id")
                    
        except Exception as e:
            # Log error, retry later, etc.
            print(f"Error syncing to Salesforce: {e}")
            return None
