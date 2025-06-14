import os
import logging
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from supabase import create_client, Client
from dotenv import load_dotenv
from asgiref.sync import sync_to_async

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Initialize Supabase client
try:
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Missing Supabase configuration: URL or service key not set")
        supabase = None
    else:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    supabase = None

class SupabaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            logger.debug("No Authorization header found")
            return None

        try:
            # Extract the token from the Authorization header
            parts = auth_header.split(' ')
            logger.info(f"🔍 Auth header parts: {len(parts)} parts - First: '{parts[0] if parts else 'None'}', Has second: {len(parts) > 1}")
            
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                logger.warning(f"Malformed Authorization header: {auth_header[:50]}...")
                return None
                
            token = parts[1]
            if not token:
                logger.warning("Empty token found in Authorization header")
                return None
                
            logger.info(f"🔑 Extracted token (first 20 chars): {token[:20]}...")

            # Check if Supabase client is available
            if supabase is None:
                logger.error("Supabase client is not initialized properly")
                return None
                
            # Verify the token with Supabase
            try:
                user = supabase.auth.get_user(token)
                if not user or not hasattr(user, 'user') or not user.user:
                    logger.warning("Invalid user response from Supabase")
                    return None
            except Exception as auth_error:
                logger.error(f"Token validation error: {str(auth_error)}")
                return None

            # Get the user ID from the user object
            user_id = user.user.id
            user_email = user.user.email
            
            if not user_id:
                logger.warning("No user ID found in authenticated user data")
                return None

            logger.info(f"Authenticated user: {user_id}")

            # Get or create the Django user
            User = get_user_model()
            django_user, created = User.objects.get_or_create(
                username=user_id,
                defaults={'email': user_email}
            )

            return (django_user, token)

        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            logger.error(f"User object: {user if 'user' in locals() else 'Not available'}")
            # Return None instead of raising an exception to allow anonymous access where permitted
            return None
            
    # Add an async-compatible authentication method
    async def authenticate_async(self, request):
        """Async-compatible version of authenticate for use with async views"""
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            logger.debug("No Authorization header found (async)")
            return None

        try:
            # Extract the token from the Authorization header
            parts = auth_header.split(' ')
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                logger.warning(f"Malformed Authorization header (async): {auth_header}")
                return None
                
            token = parts[1]
            if not token:
                logger.warning("Empty token found in Authorization header (async)")
                return None

            # Check if Supabase client is available
            if supabase is None:
                logger.error("Supabase client is not initialized properly (async)")
                return None
                
            # Verify the token with Supabase - wrapped in sync_to_async
            @sync_to_async
            def get_supabase_user():
                try:
                    return supabase.auth.get_user(token)
                except Exception as auth_error:
                    logger.error(f"Token validation error (async): {str(auth_error)}")
                    return None
                
            user = await get_supabase_user()
            if not user or not hasattr(user, 'user') or not user.user:
                logger.warning("Invalid user response from Supabase (async)")
                return None

            # Get the user ID from the user object
            user_id = user.user.id
            user_email = user.user.email
            
            if not user_id:
                logger.warning("No user ID found in authenticated user data (async)")
                return None

            logger.info(f"Authenticated user (async): {user_id}")

            # Get or create the Django user - wrapped in sync_to_async
            @sync_to_async
            def get_or_create_user():
                User = get_user_model()
                return User.objects.get_or_create(
                    username=user_id,
                    defaults={'email': user_email}
                )
                
            django_user, created = await get_or_create_user()
            return (django_user, token)

        except Exception as e:
            logger.error(f"Authentication error (async): {str(e)}")
            logger.error(f"User object: {user if 'user' in locals() else 'Not available'}")
            # Return None instead of raising an exception to allow anonymous access where permitted
            return None 