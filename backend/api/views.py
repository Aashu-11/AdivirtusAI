from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response
from .models import TestModel
from .serializers import TestModelSerializer
import openai
from dotenv import load_dotenv
import os
from typing import Dict, Any
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from datetime import datetime
from supabase import create_client, Client
import threading
import traceback
import logging
from assessments.authentication import SupabaseAuthentication

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure API keys
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Create your views here.

class TestModelViewSet(viewsets.ModelViewSet):
    queryset = TestModel.objects.all()
    serializer_class = TestModelSerializer

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint to verify the system is operational.
    """
    status = {
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'environment': os.getenv('DJANGO_ENV', 'development'),
        'supabase': {
            'url': SUPABASE_URL,
            'status': 'unknown',
        },
        'openai': {
            'api_key_configured': bool(OPENAI_API_KEY),
            'status': 'unknown',
        },
        'components': {
            'skill_matrix': 'ok',
            'technical_assessment': 'ok',
        }
    }
    
    # Check Supabase connection
    try:
        if SUPABASE_URL and SUPABASE_KEY:
            # Initialize Supabase client
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            
            # Try a simple query
            result = supabase.table('skills').select('count').limit(1).execute()
            
            if result.data is not None:
                status['supabase']['status'] = 'ok'
            else:
                status['supabase']['status'] = 'error'
        else:
            status['supabase']['status'] = 'not_configured'
    except Exception as e:
        status['supabase']['status'] = f'error: {str(e)}'
        
    # Check OpenAI API (without making an actual API call)
    if OPENAI_API_KEY:
        status['openai']['status'] = 'configured'
    else:
        status['openai']['status'] = 'not_configured'
    
    # Set overall status
    if status['supabase']['status'] != 'ok' or status['openai']['status'] == 'not_configured':
        status['status'] = 'degraded'
        
    return JsonResponse(status)

@api_view(['GET'])
def test_endpoint(request) -> Response:
    """
    A test endpoint that returns a simple message
    """
    return Response(
        {
            "status": "success",
            "message": "Hello from the backend API!",
            "data": {
                "name": "Adivirtus Backend",
                "version": "1.0.0"
            }
        },
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
def chat(request) -> Response:
    """
    Chat endpoint that uses either OpenAI or Groq API to generate responses
    """
    try:
        message = request.data.get('message')
        user_id = request.data.get('user_id')
        provider = request.data.get('provider', 'groq').lower()

        if not message:
            return Response(
                {"error": "Message is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not GROQ_API_KEY and provider == 'groq':
            return Response(
                {"error": "Groq API key is not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not OPENAI_API_KEY and provider == 'openai':
            return Response(
                {"error": "OpenAI API key is not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Configure the appropriate API client
        if provider == 'groq':
            client = openai.OpenAI(
                api_key=GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1",
                default_headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}"
                }
            )
            model = "llama3-8b-8192"
        else:
            client = openai.OpenAI(
                api_key=OPENAI_API_KEY,
                base_url="https://api.openai.com/v1"
            )
            model = "gpt-4.1-nano-2025-04-14"

        # Call the API
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": message}
            ],
            max_tokens=150,
            temperature=0.7
        )

        # Extract the response
        chat_response = response.choices[0].message.content

        return Response(
            {
                "status": "success",
                "response": chat_response,
                "provider": provider
            },
            status=status.HTTP_200_OK
        )

    except openai.AuthenticationError as e:
        print(f"Authentication error: {str(e)}")
        return Response(
            {
                "status": "error",
                "message": "API authentication failed",
                "error": str(e)
            },
            status=status.HTTP_401_UNAUTHORIZED
        )
    except openai.APIError as e:
        print(f"API error: {str(e)}")
        return Response(
            {
                "status": "error",
                "message": "API request failed",
                "error": str(e)
            },
            status=status.HTTP_502_BAD_GATEWAY
        )
    except Exception as e:
        print(f"Unexpected error in chat endpoint: {str(e)}")
        return Response(
            {
                "status": "error",
                "message": "An unexpected error occurred",
                "error": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
def start_gap_analysis(request, baseline_id=None):
    """
    Start a gap analysis for the specified baseline ID.
    This is an asynchronous operation that will return immediately.
    The gap analysis will run in the background.
    """
    if not baseline_id:
        return Response(
            {"error": "Baseline ID is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Log details about the request
    logger.info(f"Starting gap analysis for baseline ID: {baseline_id}")
    
    # Start the gap analysis in a background thread
    def run_gap_analysis():
        try:
            # Import the module function with a different name to avoid conflict
            from skill_matrix.gap_analysis import start_gap_analysis as run_gap_analysis_process
            success = run_gap_analysis_process(baseline_id)
            if success:
                logger.info(f"Gap analysis completed successfully for baseline {baseline_id}")
            else:
                logger.error(f"Gap analysis failed for baseline {baseline_id}")
        except Exception as e:
            logger.error(f"Error during gap analysis for baseline {baseline_id}: {str(e)}")
            logger.error(traceback.format_exc())
    
    # Create and start the background thread
    thread = threading.Thread(target=run_gap_analysis)
    thread.daemon = True  # Daemonize the thread so it doesn't block server shutdown
    thread.start()
    
    # Return a response immediately, without waiting for the gap analysis to complete
    return Response({
        "message": "Gap analysis started successfully",
        "baseline_id": baseline_id,
        "status": "in_progress"
    })

@api_view(['GET'])
@authentication_classes([SupabaseAuthentication])
def get_baseline_skill_matrix(request, baseline_id=None):
    """
    Get baseline skill matrix data for a specific baseline ID.
    Returns the skill matrix with ideal and baseline competency scores.
    """
    if not baseline_id:
        return Response(
            {"error": "Baseline ID is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.error("Supabase URL or key not set")
            return Response(
                {"error": "Server configuration error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        # Create Supabase client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Get the baseline skill matrix
        baseline_result = supabase.table('baseline_skill_matrix').select('*').eq('id', baseline_id).single().execute()
        
        if hasattr(baseline_result, 'error') and baseline_result.error:
            logger.error(f"Error fetching baseline skill matrix: {baseline_result.error}")
            return Response(
                {"error": "Failed to fetch baseline skill matrix"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        baseline_data = baseline_result.data
        
        if not baseline_data:
            return Response(
                {"error": "Baseline skill matrix not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Get the ideal skill matrix
        ideal_skill_matrix_id = baseline_data.get('ideal_skill_matrix_id')
        
        if not ideal_skill_matrix_id:
            logger.warning(f"No ideal skill matrix ID found in baseline {baseline_id}")
            ideal_matrix_data = None
        else:
            ideal_result = supabase.table('ideal_skill_matrix').select('*').eq('id', ideal_skill_matrix_id).single().execute()
            
            if hasattr(ideal_result, 'error') and ideal_result.error:
                logger.error(f"Error fetching ideal skill matrix: {ideal_result.error}")
                ideal_matrix_data = None
            else:
                ideal_matrix_data = ideal_result.data
        
        # Return the baseline and ideal skill matrices
        return Response({
            "baseline_skill_matrix": baseline_data.get('skill_matrix'),
            "ideal_skill_matrix": ideal_matrix_data.get('skill_matrix') if ideal_matrix_data else None,
            "status": baseline_data.get('status', 'unknown'),
            "analysis_started_at": baseline_data.get('analysis_started_at'),
            "analysis_completed_at": baseline_data.get('analysis_completed_at')
        })
        
    except Exception as e:
        logger.error(f"Error in get_baseline_skill_matrix: {str(e)}")
        logger.error(traceback.format_exc())
        return Response(
            {"error": f"Server error: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
