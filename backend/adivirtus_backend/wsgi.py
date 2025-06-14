"""
WSGI config for adivirtus_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os
import logging
from django.core.wsgi import get_wsgi_application
from django.conf import settings

logger = logging.getLogger(__name__)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adivirtus_backend.settings')

application = get_wsgi_application()

# Start the assessment interpreter listener
try:
    from assessments.tasks import start_interpreter_listener
    
    # Only start in production or when explicitly enabled
    if not settings.DEBUG or os.getenv('ENABLE_BACKGROUND_TASKS') == 'true':
        logger.info("Starting assessment interpreter listener")
        start_interpreter_listener()
        logger.info("Assessment interpreter listener started")
    else:
        logger.info("Assessment interpreter listener not started in debug mode")
except Exception as e:
    logger.error(f"Failed to start assessment interpreter listener: {str(e)}")
