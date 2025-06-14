from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import os
import json
from datetime import datetime

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Simple health check endpoint for backend status monitoring.
    """
    status = {
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'environment': os.getenv('DJANGO_ENV', 'development'),
        'version': '0.1.0',  # Update this with your version
        'api': 'Adivirtus Backend',
    }
    
    return JsonResponse(status) 