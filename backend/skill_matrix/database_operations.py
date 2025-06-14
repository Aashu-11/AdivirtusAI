"""
Database operations for gap analysis system.
Handles all Supabase interactions for skill matrix and baseline management.
"""

import os
import json
import traceback
from typing import Dict, Any, Optional
from supabase import create_client, Client
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

def create_supabase_client() -> Optional[Client]:
    """Create and return a Supabase client."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Supabase URL or key not set")
        return None
        
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logger.error(f"Error creating Supabase client: {str(e)}")
        return None

def create_baseline_skill_matrix(sct_initial_id: str) -> str:
    """
    Create a baseline skill matrix from the initial SCT results.
    
    Args:
        sct_initial_id: The ID of the initial SCT assessment
        
    Returns:
        The baseline ID if successful, None otherwise
    """
    try:
        logger.info(f"Creating baseline skill matrix from SCT initial: {sct_initial_id}")
        
        supabase = create_supabase_client()
        if not supabase:
            return None
        
        # Get the initial SCT data
        try:
            sct_result = supabase.table('sct_initial').select('*').eq('id', sct_initial_id).execute()
            if not sct_result.data:
                logger.error(f"No SCT initial data found for ID: {sct_initial_id}")
                return None
                
            sct_data = sct_result.data[0]
            skill_matrix = sct_data.get('skill_matrix', {})
            
            if not skill_matrix:
                logger.error("No skill matrix found in SCT initial data")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching SCT initial data: {str(e)}")
            return None
        
        # Store the baseline skill matrix
        try:
            baseline_data = {
                'sct_initial_id': sct_initial_id,
                'skill_matrix': skill_matrix,
                'created_at': 'now()',
                'status': 'created'
            }
            
            result = supabase.table('skill_matrix_baseline').insert(baseline_data).execute()
            
            if result.data:
                baseline_id = result.data[0]['id']
                logger.info(f"✅ Created baseline skill matrix with ID: {baseline_id}")
                return baseline_id
            else:
                logger.error("Failed to create baseline skill matrix")
                return None
                
        except Exception as e:
            logger.error(f"Error storing baseline: {str(e)}")
            return None
            
    except Exception as e:
        logger.error(f"Error in create_baseline_skill_matrix: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def get_baseline_data(baseline_id: str) -> Optional[Dict[str, Any]]:
    """
    Get baseline skill matrix data.
    
    Args:
        baseline_id: The baseline ID
        
    Returns:
        Baseline data if found, None otherwise
    """
    try:
        supabase = create_supabase_client()
        if not supabase:
            return None
            
        result = supabase.table('skill_matrix_baseline').select('*').eq('id', baseline_id).execute()
        
        if result.data:
            return result.data[0]
        else:
            logger.error(f"No baseline found with ID: {baseline_id}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching baseline data: {str(e)}")
        return None

def get_questions_answers(baseline_id: str) -> tuple[Optional[list], Optional[list]]:
    """
    Get questions and answers for a baseline.
    
    Args:
        baseline_id: The baseline ID
        
    Returns:
        Tuple of (questions, answers) or (None, None) if error
    """
    try:
        supabase = create_supabase_client()
        if not supabase:
            return None, None
            
        # Get baseline data to find sct_initial_id
        baseline_result = supabase.table('skill_matrix_baseline').select('sct_initial_id').eq('id', baseline_id).execute()
        
        if not baseline_result.data:
            logger.error(f"No baseline found with ID: {baseline_id}")
            return None, None
            
        sct_initial_id = baseline_result.data[0]['sct_initial_id']
        
        # Get questions and answers
        questions_result = supabase.table('sct_questions').select('*').eq('sct_initial_id', sct_initial_id).execute()
        answers_result = supabase.table('sct_answers').select('*').eq('sct_initial_id', sct_initial_id).execute()
        
        if not questions_result.data:
            logger.warning(f"No questions found for SCT initial ID: {sct_initial_id}")
            return [], []
            
        if not answers_result.data:
            logger.warning(f"No answers found for SCT initial ID: {sct_initial_id}")
            return questions_result.data, []
            
        logger.info(f"Found {len(questions_result.data)} questions and {len(answers_result.data)} answers")
        return questions_result.data, answers_result.data
        
    except Exception as e:
        logger.error(f"Error fetching questions/answers: {str(e)}")
        return None, None

def update_baseline_skill_matrix(baseline_id: str, updated_skill_matrix: Dict[str, Any], dashboard: Dict[str, Any]) -> bool:
    """
    Update the baseline skill matrix with assessment results.
    
    Args:
        baseline_id: The baseline ID
        updated_skill_matrix: The updated skill matrix
        dashboard: The gap analysis dashboard
        
    Returns:
        True if successful, False otherwise
    """
    try:
        supabase = create_supabase_client()
        if not supabase:
            return False
            
        update_data = {
            'skill_matrix': updated_skill_matrix,
            'gap_analysis_dashboard': dashboard,
            'status': 'completed',
            'updated_at': 'now()'
        }
        
        result = supabase.table('skill_matrix_baseline').update(update_data).eq('id', baseline_id).execute()
        
        if result.data:
            logger.info(f"✅ Successfully updated baseline {baseline_id}")
            return True
        else:
            logger.error(f"❌ Failed to update baseline {baseline_id}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error updating baseline: {str(e)}")
        return False

def start_gap_analysis(baseline_id: str) -> bool:
    """
    Start the gap analysis process for a baseline.
    
    Args:
        baseline_id: The baseline ID to analyze
        
    Returns:
        True if successful, False otherwise
    """
    try:
        supabase = create_supabase_client()
        if not supabase:
            return False
            
        # Update status to running
        update_result = supabase.table('skill_matrix_baseline').update({
            'status': 'analyzing',
            'analysis_started_at': 'now()'
        }).eq('id', baseline_id).execute()
        
        if not update_result.data:
            logger.error(f"Failed to update baseline status to 'analyzing'")
            return False
            
        # Import here to avoid circular imports
        from .gap_analysis_core import analyze_qa_baseline
        
        # Run the analysis
        success = analyze_qa_baseline(baseline_id)
        
        if not success:
            # Update status to failed
            supabase.table('skill_matrix_baseline').update({
                'status': 'failed',
                'analysis_completed_at': 'now()'
            }).eq('id', baseline_id).execute()
            
        return success
        
    except Exception as e:
        logger.error(f"Error starting gap analysis: {str(e)}")
        
        # Update status to failed
        try:
            supabase = create_supabase_client()
            if supabase:
                supabase.table('skill_matrix_baseline').update({
                    'status': 'failed',
                    'analysis_completed_at': 'now()'
                }).eq('id', baseline_id).execute()
        except:
            pass
            
        return False 