"""
Background tasks for assessment interpretation.

This module contains functions for processing assessment data asynchronously.
"""

import logging
import asyncio
import threading
from datetime import datetime
import os
from supabase import create_client, Client

from .service import assessment_service

logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

try:
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Missing Supabase configuration: URL or service key not set")
        supabase = None
    else:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully in tasks module")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    supabase = None


def interpret_assessment_background(assessment_id):
    """
    Start interpretation of an assessment in a background thread.
    
    Args:
        assessment_id: UUID of the assessment to process
    """
    logger.info(f"Starting background interpretation for assessment: {assessment_id}")
    
    # Create and start the background thread
    thread = threading.Thread(
        target=_run_async_interpretation,
        args=(assessment_id,)
    )
    thread.daemon = True
    thread.start()
    
    return {"status": "processing", "assessment_id": assessment_id}


def _run_async_interpretation(assessment_id):
    """
    Run async interpretation in a separate thread.
    
    Args:
        assessment_id: UUID of the assessment to process
    """
    # Create a new event loop for this thread
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Run the async interpretation task
        result = loop.run_until_complete(
            assessment_service.process_assessment(assessment_id)
        )
        logger.info(f"Background interpretation completed for assessment: {assessment_id}")
        logger.debug(f"Interpretation result: {result}")
    except Exception as e:
        logger.error(f"Error in background interpretation: {str(e)}")
    finally:
        loop.close()


def start_interpreter_listener():
    """
    Start a background thread that listens for new assessment submissions
    and triggers interpretation.
    
    In a production environment, this would be a separate worker service or use
    a proper task queue like Celery.
    """
    logger.info("Starting assessment interpreter listener")
    
    # Create and start the listener thread
    thread = threading.Thread(
        target=_run_interpreter_listener
    )
    thread.daemon = True
    thread.start()
    
    return {"status": "started"}


def _run_interpreter_listener():
    """
    Run the interpreter listener that polls for new assessments.
    
    This is a simplified implementation - in production this would use
    proper event-driven architecture or a message queue.
    """
    if not supabase:
        logger.error("Cannot start interpreter listener: Supabase client not initialized")
        return
    
    logger.info("Interpreter listener thread started")
    
    # Create a new event loop for this thread
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Run the async polling task
        loop.run_until_complete(_poll_for_new_assessments())
    except Exception as e:
        logger.error(f"Error in interpreter listener: {str(e)}")
    finally:
        loop.close()


async def _poll_for_new_assessments():
    """
    Poll for new assessments with pending interpretation.
    """
    poll_interval = 60  # seconds
    
    while True:
        try:
            # Find assessments that have lsa_result entries with 'pending' status
            # or that don't have lsa_result entries at all
            
            # First, get all assessments with pending results
            pending_results = await _fetch_pending_results()
            
            for result in pending_results:
                logger.info(f"Processing pending result for assessment: {result['assessment_id']}")
                await assessment_service.process_assessment(result['assessment_id'])
            
            # Next, check for assessments without results
            missing_results = await _fetch_assessments_without_results()
            
            for assessment in missing_results:
                logger.info(f"Processing assessment with no results: {assessment['id']}")
                
                # Create initial pending result
                try:
                    def create_pending_result():
                        return supabase.table('lsa_result').insert({
                            'user_id': assessment['user_id'],
                            'assessment_id': assessment['id'],
                            'interpreted_result': {
                                'status': 'pending',
                                'creation_timestamp': datetime.now().isoformat()
                            }
                        }).execute()
                    
                    await asyncio.to_thread(create_pending_result)
                    
                    # Process the assessment
                    await assessment_service.process_assessment(assessment['id'])
                except Exception as e:
                    logger.error(f"Error processing assessment {assessment['id']}: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error polling for new assessments: {str(e)}")
        
        # Wait for next poll
        await asyncio.sleep(poll_interval)


async def _fetch_pending_results():
    """
    Fetch lsa_result entries with 'pending' status.
    
    Returns:
        List of result data
    """
    try:
        def fetch_data():
            response = supabase.table('lsa_result').select('*').filter('interpreted_result', 'cs', '{"status":"pending"}').execute()
            return response.data
        
        return await asyncio.to_thread(fetch_data)
    except Exception as e:
        logger.error(f"Error fetching pending results: {str(e)}")
        return []


async def _fetch_assessments_without_results():
    """
    Fetch assessments that don't have corresponding lsa_result entries.
    
    Returns:
        List of assessment data
    """
    try:
        def fetch_data():
            # This query works in SQL but isn't directly possible with the Supabase client
            # In a real implementation, you would use a stored procedure or complex query
            
            # Get all assessment IDs
            assessments = supabase.table('lsa_assessment').select('id, user_id').execute()
            
            # Get all result assessment IDs
            results = supabase.table('lsa_result').select('assessment_id').execute()
            
            # Filter assessments without results
            result_ids = set(r['assessment_id'] for r in results.data)
            missing = [a for a in assessments.data if a['id'] not in result_ids]
            
            return missing
        
        return await asyncio.to_thread(fetch_data)
    except Exception as e:
        logger.error(f"Error fetching assessments without results: {str(e)}")
        return [] 