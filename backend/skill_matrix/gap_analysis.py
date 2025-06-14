"""
GAP ANALYSIS MODULE
==================

This module handles comprehensive skill gap analysis including:
- Baseline skill matrix creation and management
- Individual Q&A assessment processing
- AI-powered competency evaluation using CrewAI
- Skill matrix transformation and normalization
- Gap analysis dashboard generation
- Coverage validation and skill mapping

Main Functions:
- create_baseline_skill_matrix(): Create realistic baseline from ideal matrix
- start_gap_analysis(): Main entry point for gap analysis process
- analyze_qa_baseline(): Process Q&A pairs for skill assessment
- generate_skill_gap_dashboard(): Create comprehensive gap analysis dashboard

Dependencies:
- Supabase for database operations
- CrewAI for AI-powered skill evaluation
- OpenAI API for competency scoring
"""

import os
import logging
import json
import traceback
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional, Union

from supabase import create_client, Client
from dotenv import load_dotenv
from crewai import Agent, Crew, Task, Process

# ===============================================
# === CONFIGURATION AND INITIALIZATION ===
# ===============================================

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully in gap analysis module")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client in gap analysis: {str(e)}")
    supabase = None

# ===============================================
# === BASELINE SKILL MATRIX MANAGEMENT ===
# ===============================================

def create_baseline_skill_matrix_with_zero_scores(skill_matrix: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a baseline skill matrix with all competency scores set to 0.
    
    This function provides a realistic starting point for gap analysis by setting all skills
    to 0/100 competency instead of showing high ideal scores initially. It also ensures SOPs
    are properly structured in the standard {"skills": [...]} format for frontend compatibility.
    
    Args:
        skill_matrix (Dict[str, Any]): The ideal skill matrix from skill generation
        
    Returns:
        Dict[str, Any]: Baseline skill matrix with all competency scores set to 0
        
    Key Features:
        - Sets all competency and competency_level fields to 0
        - Normalizes SOPs to standard {"skills": [...]} structure  
        - Preserves metadata contexts (sop_context, domain_knowledge_context)
        - Handles both dict and list category structures
        
    Example:
        ideal_matrix = {"technical_skills": {"skills": [{"name": "Vue.js", "competency": 80}]}}
        baseline = create_baseline_skill_matrix_with_zero_scores(ideal_matrix)
        # Result: {"technical_skills": {"skills": [{"name": "Vue.js", "competency": 0}]}}
    """
    baseline_matrix = {}
    
    for category_name, category_data in skill_matrix.items():
        # Skip metadata contexts
        if category_name in ['sop_context', 'domain_knowledge_context'] and isinstance(category_data, dict) and ('has_sop_data' in category_data or 'has_domain_knowledge' in category_data):
            baseline_matrix[category_name] = category_data
            continue
        
        if isinstance(category_data, dict) and 'skills' in category_data:
            # Standard structure: {"category": {"skills": [...]}}
            baseline_matrix[category_name] = {
                'skills': []
            }
            
            for skill in category_data.get('skills', []):
                if isinstance(skill, dict):
                    baseline_skill = skill.copy()
                    # Set competency to 0 for realistic baseline
                    baseline_skill['competency'] = 0
                    baseline_skill['competency_level'] = 0
                    baseline_matrix[category_name]['skills'].append(baseline_skill)
                    
        elif isinstance(category_data, list):
            # Handle SOPs and other array-based categories
            # Normalize SOPs to use standard {"skills": [...]} structure for frontend compatibility
            if 'standard_operating_procedures' in category_name.lower() or 'sop' in category_name.lower():
                # Convert SOPs to standard structure for frontend compatibility
                baseline_matrix['standard_operating_procedures'] = {
                    'skills': []
                }
                
                for skill in category_data:
                    if isinstance(skill, dict):
                        baseline_skill = skill.copy()
                        # Set competency to 0 for realistic baseline
                        baseline_skill['competency'] = 0
                        baseline_skill['competency_level'] = 0
                        baseline_matrix['standard_operating_procedures']['skills'].append(baseline_skill)
                        
                logger.info(f"✅ Normalized SOPs to standard structure: {len(baseline_matrix['standard_operating_procedures']['skills'])} skills")
            else:
                # Other array-based categories (keep as array)
                baseline_matrix[category_name] = []
                
                for skill in category_data:
                    if isinstance(skill, dict):
                        baseline_skill = skill.copy()
                        # Set competency to 0 for realistic baseline
                        baseline_skill['competency'] = 0
                        baseline_skill['competency_level'] = 0
                        baseline_matrix[category_name].append(baseline_skill)
        else:
            # Copy other data as-is
            baseline_matrix[category_name] = category_data
    
    return baseline_matrix

def create_baseline_skill_matrix(sct_initial_id: str) -> str:
    """
    Creates a baseline skill matrix entry with realistic starting scores (0).
    
    This function creates a new baseline_skill_matrix record in the database using
    the ideal skill matrix as a template but with all competency scores set to 0.
    This prevents users from seeing confusing high ideal scores before gap analysis completes.
    
    Args:
        sct_initial_id (str): The ID of the SCT initial record containing assessment data
        
    Returns:
        str: The ID of the created baseline skill matrix record, or None if failed
        
    Process Flow:
        1. Fetch SCT initial data and extract user/assessment info
        2. Retrieve the ideal skill matrix using skill_matrix_id
        3. Create baseline matrix with zero scores using helper function
        4. Insert new baseline_skill_matrix record with 'pending' status
        
    Database Dependencies:
        - sct_initial table: Contains user_id, assessment_id, skill_matrix_id
        - ideal_skill_matrix table: Contains the template skill matrix
        - baseline_skill_matrix table: Target for the new baseline record
        
    Error Handling:
        - Returns None if SCT data not found
        - Returns None if ideal skill matrix not found  
        - Logs all errors with traceback for debugging
    """
    try:
        logger.info(f"Starting creation of baseline skill matrix for SCT ID: {sct_initial_id}")
        
        # Get the SCT initial data
        sct_result = supabase.table('sct_initial').select('*').eq('id', sct_initial_id).single().execute()
        sct_data = sct_result.data
        
        if not sct_data:
            logger.error(f"No SCT initial data found for ID: {sct_initial_id}")
            return None
        
        logger.info(f"Found SCT initial data for ID: {sct_initial_id}")
        
        # Get the user ID and assessment ID
        user_id = sct_data['user_id']
        assessment_id = sct_data['assessment_id']
        ideal_skill_matrix_id = sct_data['skill_matrix_id']
        
        logger.info(f"Using ideal skill matrix ID: {ideal_skill_matrix_id}")
        
        # Get the ideal skill matrix
        ideal_skill_matrix_result = supabase.table('ideal_skill_matrix').select('*').eq('id', ideal_skill_matrix_id).single().execute()
        ideal_skill_matrix_data = ideal_skill_matrix_result.data
        
        if not ideal_skill_matrix_data:
            logger.error(f"No ideal skill matrix found for ID: {ideal_skill_matrix_id}")
            return None
        
        # Create baseline skill matrix with realistic starting scores (0)
        # This prevents showing high ideal scores before gap analysis completes
        baseline_skill_matrix = create_baseline_skill_matrix_with_zero_scores(ideal_skill_matrix_data['skill_matrix'])
        
        logger.info("Created baseline skill matrix with all competencies set to 0 for realistic user experience")
        
        # Create a baseline skill matrix entry
        baseline_data = {
            'user_id': user_id,
            'assessment_id': assessment_id,
            'sct_initial_id': sct_initial_id,
            'ideal_skill_matrix_id': ideal_skill_matrix_id,
            'skill_matrix': baseline_skill_matrix,
            'status': 'pending'
        }
        
        logger.info(f"Inserting baseline skill matrix for user: {user_id}, assessment: {assessment_id}")
        result = supabase.table('baseline_skill_matrix').insert(baseline_data).execute()
        baseline_id = result.data[0]['id']
        
        logger.info(f"Created baseline skill matrix with ID: {baseline_id}")
        return baseline_id
    
    except Exception as e:
        logger.error(f"Error creating baseline skill matrix: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def start_gap_analysis(baseline_id: str) -> bool:
    """
    Start the gap analysis process for a specific baseline ID.
    
    This is the main entry point for gap analysis processing. It manages the database
    status updates and orchestrates the complete analysis workflow.
    
    Args:
        baseline_id (str): The ID of the baseline_skill_matrix record to analyze
        
    Returns:
        bool: True if analysis completed successfully, False otherwise
        
    Process Flow:
        1. Update baseline status to 'in_progress' with start timestamp
        2. Call analyze_qa_baseline() to perform the actual analysis
        3. Update status to 'completed' or 'failed' based on results
        4. Add completion timestamp to database record
        
    Database Updates:
        - Sets status to 'in_progress' at start
        - Records analysis_started_at timestamp
        - Updates to 'completed'/'failed' at end
        - Records analysis_completed_at timestamp
        
    Error Handling:
        - Logs all database and analysis errors
        - Ensures status is updated even if analysis fails
        - Returns False for any error condition
        
    Usage:
        success = start_gap_analysis('baseline-uuid-here')
        if success:
            print("Gap analysis completed successfully")
    """
    try:
        logger.info(f"===============================================")
        logger.info(f"STARTING GAP ANALYSIS FOR BASELINE: {baseline_id}")
        logger.info(f"===============================================")
        
        # Create Supabase client
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.error("Supabase URL or key not set")
            return False
            
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            logger.error(f"Error creating Supabase client: {str(e)}")
            return False
        
        # Update the status to in_progress and record the start time
        try:
            update_data = {
                'status': 'in_progress',
                'analysis_started_at': datetime.utcnow().isoformat()
            }
            
            update_result = supabase.table('baseline_skill_matrix') \
                .update(update_data) \
                .eq('id', baseline_id) \
                .execute()
                
            if hasattr(update_result, 'error') and update_result.error:
                logger.error(f"Error updating baseline status: {update_result.error}")
                return False
                
            logger.info(f"Updated baseline status to in_progress for {baseline_id}")
        except Exception as e:
            logger.error(f"Error updating baseline status: {str(e)}")
            return False
        
        # Run the analysis
        success = analyze_qa_baseline(baseline_id)
        
        # Update the status based on the result
        try:
            update_data = {
                'analysis_completed_at': datetime.utcnow().isoformat()
            }
            
            if success:
                update_data['status'] = 'completed'
            else:
                update_data['status'] = 'failed'
                
            update_result = supabase.table('baseline_skill_matrix') \
                .update(update_data) \
                .eq('id', baseline_id) \
                .execute()
                
            if hasattr(update_result, 'error') and update_result.error:
                logger.error(f"Error updating baseline status after completion: {update_result.error}")
                return False
                
            logger.info(f"Updated baseline status to {update_data['status']} for {baseline_id}")
        except Exception as e:
            logger.error(f"Error updating baseline status after completion: {str(e)}")
            return False
            
        return success
        
    except Exception as e:
        logger.error(f"Error in start_gap_analysis: {str(e)}")
        logger.error(traceback.format_exc())
        return False

# ===============================================
# === UTILITY FUNCTIONS ===
# ===============================================

def parse_to_dict(data: Union[Dict[str, Any], str, Any]) -> Dict[str, Any]:
    """
    Convert various input formats to a dictionary.
    
    This utility function handles the conversion of different data types that might
    be encountered in Q&A processing (JSON strings, objects, etc.) into consistent
    dictionary format for easier processing.
    
    Args:
        data: Input data of various types (dict, str, Any)
        
    Returns:
        Dict[str, Any]: Normalized dictionary representation
        
    Conversion Rules:
        - Dict: Returns as-is
        - JSON string: Parses to dict
        - Invalid JSON string: Returns {'text': str}
        - Other types: Returns {'value': data}
        
    Usage:
        question = parse_to_dict(raw_question_data)
        answer = parse_to_dict(user_response)
    """
    if isinstance(data, dict):
        return data
    
    if isinstance(data, str):
        # Try to parse as JSON
        try:
            parsed = json.loads(data)
            if isinstance(parsed, dict):
                return parsed
        except:
            # Not valid JSON, return as 'text' field
            return {'text': data}
    
    # For any other type, wrap in a dictionary
    return {'value': data}

def normalize_skill_id(skill_id):
    """
    Normalize skill IDs to handle case sensitivity and format inconsistencies.
    
    This function standardizes skill IDs to ensure consistent matching across
    different parts of the system (questions, skill matrix, assessment results).
    
    Args:
        skill_id: The skill ID to normalize (any type, usually string)
        
    Returns:
        str: Normalized skill ID in lowercase without quotes/spaces
        
    Normalization Process:
        1. Convert to string and lowercase
        2. Strip quotes and whitespace
        3. Remove common prefixes (skill_, id_)
        
    Usage:
        norm_id = normalize_skill_id("Skill_Vue_JS_123")
        # Returns: "vue_js_123"
    """
    if not skill_id:
        return ""
    
    # Convert to string, lowercase, and remove quotes/spaces
    normalized = str(skill_id).lower().strip('"\'').strip()
    
    # Remove common prefixes if they exist
    # This can be expanded based on observed patterns
    prefixes = ['skill_', 'id_']
    for prefix in prefixes:
        if normalized.startswith(prefix):
            normalized = normalized[len(prefix):]
    
    return normalized

# ===============================================
# === SKILL MATRIX PROCESSING ===
# ===============================================

def transform_skill_matrix_structure(skill_matrix: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform skill matrix from the original OpenAI format to the standardized format used in gap analysis.
    
    This function converts between different skill matrix formats to ensure consistency
    throughout the gap analysis process. It handles legacy formats and ensures all
    skills have proper IDs and competency fields.
    
    Args:
        skill_matrix (Dict[str, Any]): Input skill matrix in various formats
        
    Returns:
        Dict[str, Any]: Standardized skill matrix with category-based structure
        
    Transformations:
        - Converts technical_skills/soft_skills lists to {"skills": [...]} format
        - Adds missing skill IDs using name-based generation
        - Ensures competency fields exist (competency and competency_level)
        - Preserves SOP context and metadata
        
    Format Conversion:
        Input:  {"technical_skills": [{"name": "Vue.js"}]}
        Output: {"technical_skills": {"skills": [{"id": "vue_js", "name": "Vue.js", "competency": 0}]}}
        
    Error Handling:
        - Returns input unchanged if already in correct format
        - Generates IDs for skills missing them
        - Logs transformation progress
    """
    if not isinstance(skill_matrix, dict):
        return skill_matrix
    
    # Check if it's already in the right format
    has_technical_skills = 'technical_skills' in skill_matrix
    has_soft_skills = 'soft_skills' in skill_matrix
    
    if not (has_technical_skills or has_soft_skills):
        # Already in category format, just ensure skills have IDs
        return ensure_skill_ids(skill_matrix)
    
    logger.info("Transforming skill matrix from OpenAI format to category format...")
    
    transformed = {}
    skill_id_counter = 1
    
    # Transform technical skills
    if has_technical_skills:
        technical_skills = skill_matrix.get('technical_skills', [])
        skills_with_ids = []
        
        for skill in technical_skills:
            if isinstance(skill, dict):
                skill_copy = skill.copy()
                # Add ID if missing
                if 'id' not in skill_copy or not skill_copy.get('id'):
                    skill_name = skill_copy.get('name', f'skill_{skill_id_counter}')
                    skill_id = skill_name.lower().replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '').replace(',', '')
                    skill_id = '_'.join(filter(None, skill_id.split('_')))
                    skill_copy['id'] = skill_id
                    logger.info(f"Added ID '{skill_id}' to technical skill: {skill_name}")
                
                # Ensure competency field exists
                if 'competency' not in skill_copy:
                    skill_copy['competency'] = skill_copy.get('competency_level', 0)
                
                skills_with_ids.append(skill_copy)
                skill_id_counter += 1
        
        transformed['technical_skills'] = {'skills': skills_with_ids}
    
    # Transform soft skills
    if has_soft_skills:
        soft_skills = skill_matrix.get('soft_skills', [])
        skills_with_ids = []
        
        for skill in soft_skills:
            if isinstance(skill, dict):
                skill_copy = skill.copy()
                # Add ID if missing
                if 'id' not in skill_copy or not skill_copy.get('id'):
                    skill_name = skill_copy.get('name', f'skill_{skill_id_counter}')
                    skill_id = skill_name.lower().replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '').replace(',', '')
                    skill_id = '_'.join(filter(None, skill_id.split('_')))
                    skill_copy['id'] = skill_id
                    logger.info(f"Added ID '{skill_id}' to soft skill: {skill_name}")
                
                # Ensure competency field exists
                if 'competency' not in skill_copy:
                    skill_copy['competency'] = skill_copy.get('competency_level', 0)
                
                skills_with_ids.append(skill_copy)
                skill_id_counter += 1
        
        transformed['soft_skills'] = {'skills': skills_with_ids}
    
    # Preserve SOP context if it exists
    if 'sop_context' in skill_matrix:
        transformed['sop_context'] = skill_matrix['sop_context']
    
    logger.info(f"Transformed skill matrix: {len(transformed)} categories with IDs")
    return transformed

def ensure_skill_ids(skill_matrix: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure all skills in the matrix have IDs, generating them if missing.
    
    This function scans through all categories in the skill matrix and ensures
    every skill has a unique ID. Missing IDs are generated from skill names
    using a consistent naming convention.
    
    Args:
        skill_matrix (Dict[str, Any]): Skill matrix to process
        
    Returns:
        Dict[str, Any]: Enhanced skill matrix with all skills having IDs
        
    ID Generation:
        - Uses skill name converted to lowercase with underscores
        - Removes special characters and normalizes format
        - Ensures uniqueness with incremental counters
        
    Processing:
        - Handles both {"skills": [...]} and direct array formats
        - Skips metadata contexts (sop_context, domain_knowledge_context)
        - Logs all generated IDs for tracking
        
    Example:
        Input:  {"name": "Vue.js Framework"}
        Output: {"id": "vue_js_framework", "name": "Vue.js Framework"}
    """
    enhanced_matrix = skill_matrix.copy()
    skill_id_counter = 1
    
    for category_name, category_data in enhanced_matrix.items():
        # UPDATED: Only skip pure metadata contexts, not SOP skill categories
        if category_name in ['sop_context', 'domain_knowledge_context'] and isinstance(category_data, dict) and ('has_sop_data' in category_data or 'has_domain_knowledge' in category_data):
            continue  # Skip only if it's the metadata structure
            
        category_skills = []
        if isinstance(category_data, dict) and 'skills' in category_data:
            category_skills = category_data.get('skills', [])
        elif isinstance(category_data, list):
            category_skills = category_data
            
        for skill in category_skills:
            if isinstance(skill, dict):
                # Add ID if missing
                if 'id' not in skill or not skill.get('id'):
                    skill_name = skill.get('name', f'skill_{skill_id_counter}')
                    skill_id = skill_name.lower().replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '').replace(',', '')
                    skill_id = '_'.join(filter(None, skill_id.split('_')))
                    skill['id'] = skill_id
                    logger.info(f"Added ID '{skill_id}' to skill: {skill_name}")
                skill_id_counter += 1
    
    return enhanced_matrix


# ===============================================
# === SKILL COVERAGE VALIDATION ===
# ===============================================

def extract_skill_assignments(questions: List[Dict]) -> Dict[str, Any]:
    """
    Extract skill assignments and coverage information from questions.
    
    This function analyzes the questions to understand which skills are explicitly
    tested by each question, creating a comprehensive mapping for assessment purposes.
    
    Args:
        questions (List[Dict]): List of questions with comprehensive skill coverage metadata
        
    Returns:
        Dict[str, Any]: Contains skill-to-question mapping and coverage analysis
        
    Return Structure:
        {
            'skill_to_questions': {skill_id: [question_info, ...]},
            'question_to_skills': {question_id: [skill_list]},
            'explicitly_tested_skills': set(skill_ids),
            'question_types': {question_id: question_type},
            'total_questions': int,
            'questions_with_assignments': int
        }
        
    Processing Features:
        - Extracts assigned_skills and domain_knowledge_skills from questions
        - Handles both explicit assignments and legacy expected_skills format
        - Tracks question types for assessment confidence levels
        - Creates bidirectional mappings for efficient lookups
        
    Usage:
        assignments = extract_skill_assignments(assessment_questions)
        tested_skills = assignments['explicitly_tested_skills']
    """
    skill_to_questions = {}
    question_to_skills = {}
    explicitly_tested_skills = set()
    question_types = {}
    
    logger.info("Extracting skill assignments from comprehensive coverage questions...")
    
    for i, question in enumerate(questions):
        question_dict = parse_to_dict(question)
        question_id = question_dict.get('id', f'question_{i+1}')
        question_type = question_dict.get('type', 'unknown')
        
        # Extract assigned skills from the new comprehensive format
        assigned_skills = question_dict.get('assigned_skills', [])
        domain_knowledge_skills = question_dict.get('domain_knowledge_skills', [])
        skill_coverage = question_dict.get('skill_coverage', {})
        
        question_types[question_id] = question_type
        
        # Combine regular skills and domain knowledge skills for comprehensive tracking
        all_skills_for_question = assigned_skills + domain_knowledge_skills
        
        if all_skills_for_question:
            question_to_skills[question_id] = all_skills_for_question
            if domain_knowledge_skills:
                logger.info(f"Question {question_id} ({question_type}) explicitly tests {len(assigned_skills)} technical skills + {len(domain_knowledge_skills)} domain knowledge skills")
            else:
                logger.info(f"Question {question_id} ({question_type}) explicitly tests {len(assigned_skills)} skills")
            
            for skill in all_skills_for_question:
                skill_dict = parse_to_dict(skill)
                skill_id = skill_dict.get('id')
                skill_name = skill_dict.get('name', 'Unknown')
                
                # If no ID, create one from name
                if not skill_id and skill_name != 'Unknown':
                    skill_id = skill_name.lower().replace(' ', '_').replace('-', '_')
                    logger.info(f"Generated skill ID '{skill_id}' from name '{skill_name}'")
                
                if skill_id:
                    explicitly_tested_skills.add(skill_id)
                    if skill_id not in skill_to_questions:
                        skill_to_questions[skill_id] = []
                    
                    # Determine if this is a domain knowledge skill
                    is_domain_knowledge = skill in domain_knowledge_skills
                    
                    skill_to_questions[skill_id].append({
                        'question_id': question_id,
                        'question_type': question_type,
                        'skill_name': skill_name,
                        'focus_area': skill_coverage.get('focus_area', ''),
                        'is_domain_knowledge': is_domain_knowledge,
                        'skill_category': skill_dict.get('category', 'unknown')
                    })
        else:
            logger.warning(f"Question {question_id} has no assigned_skills metadata")
    
    logger.info(f"Found explicit skill assignments for {len(explicitly_tested_skills)} skills across {len(questions)} questions")
    
    return {
        'skill_to_questions': skill_to_questions,
        'question_to_skills': question_to_skills,
        'explicitly_tested_skills': explicitly_tested_skills,
        'question_types': question_types,
        'total_questions': len(questions),
        'questions_with_assignments': len(question_to_skills)
    }


def validate_comprehensive_coverage(skill_matrix: Dict[str, Any], questions: List[Dict]) -> Dict[str, Any]:
    """
    Validate that the comprehensive coverage system properly covered the skill matrix.
    
    This function performs a comprehensive analysis to ensure that the generated questions
    adequately cover all skills in the skill matrix, providing quality metrics for assessment.
    
    Args:
        skill_matrix (Dict[str, Any]): The ideal skill matrix containing all target skills
        questions (List[Dict]): List of questions with coverage metadata
        
    Returns:
        Dict[str, Any]: Comprehensive coverage validation results
        
    Return Structure:
        {
            'total_skills': int,
            'explicitly_tested': int,
            'covered_skills': int,
            'uncovered_skills': List[str],
            'coverage_percentage': float,
            'skill_assignments': Dict,
            'skill_categories': Dict,
            'coverage_quality': str  # 'excellent', 'good', 'fair', 'poor'
        }
        
    Coverage Quality Metrics:
        - Excellent: >= 95% coverage
        - Good: >= 85% coverage  
        - Fair: >= 75% coverage
        - Poor: < 75% coverage
        
    Processing:
        - Extracts all skills from skill matrix (excluding metadata contexts)
        - Maps question assignments to skill coverage
        - Calculates coverage percentages and quality ratings
        - Identifies uncovered skills for improvement
    """
    logger.info("Validating comprehensive skill coverage...")
    
    # Extract all skills from the matrix
    all_matrix_skills = set()
    skill_categories = {}
    
    for category_name, category_data in skill_matrix.items():
        # UPDATED: Only skip pure metadata contexts, not SOP skill categories
        if category_name in ['sop_context', 'domain_knowledge_context'] and isinstance(category_data, dict) and ('has_sop_data' in category_data or 'has_domain_knowledge' in category_data):
            continue  # Skip only if it's the metadata structure
            
        category_skills = []
        if isinstance(category_data, dict) and 'skills' in category_data:
            category_skills = category_data.get('skills', [])
        elif isinstance(category_data, list):
            category_skills = category_data
            
        for skill in category_skills:
            if isinstance(skill, dict):
                skill_id = skill.get('id')
                skill_name = skill.get('name', 'Unknown')
                if skill_id:
                    all_matrix_skills.add(skill_id)
                    skill_categories[skill_id] = {
                        'category': category_name,
                        'name': skill_name,
                        'description': skill.get('description', '')
                    }
                elif skill_name:  # If no ID but has name, try to match by name
                    # Normalize the name for matching
                    normalized_name = skill_name.lower().replace(' ', '_').replace('-', '_')
                    all_matrix_skills.add(normalized_name)
                    skill_categories[normalized_name] = {
                        'category': category_name,
                        'name': skill_name,
                        'description': skill.get('description', '')
                    }
    
    # Extract skill assignments from questions
    skill_assignments = extract_skill_assignments(questions)
    explicitly_tested = skill_assignments['explicitly_tested_skills']
    
    # Calculate coverage metrics
    covered_skills = all_matrix_skills.intersection(explicitly_tested)
    uncovered_skills = all_matrix_skills - explicitly_tested
    
    coverage_percentage = len(covered_skills) / len(all_matrix_skills) * 100 if all_matrix_skills else 0
    
    logger.info(f"Coverage Analysis:")
    logger.info(f"  Total skills in matrix: {len(all_matrix_skills)}")
    logger.info(f"  Explicitly tested skills: {len(explicitly_tested)}")
    logger.info(f"  Covered skills: {len(covered_skills)}")
    logger.info(f"  Coverage percentage: {coverage_percentage:.1f}%")
    
    if uncovered_skills:
        logger.warning(f"Uncovered skills ({len(uncovered_skills)}): {uncovered_skills}")
    
    return {
        'total_skills': len(all_matrix_skills),
        'explicitly_tested': len(explicitly_tested),
        'covered_skills': len(covered_skills),
        'uncovered_skills': list(uncovered_skills),
        'coverage_percentage': coverage_percentage,
        'skill_assignments': skill_assignments,
        'skill_categories': skill_categories,
        'coverage_quality': 'excellent' if coverage_percentage >= 95 else 
                           'good' if coverage_percentage >= 85 else
                           'fair' if coverage_percentage >= 75 else 'poor'
    }


def create_skill_evidence_map(questions: List[Dict], answers: List[Dict], skill_assignments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a map of skills to their evidence from Q&A pairs.
    
    This function builds a comprehensive evidence map that connects each skill to the
    specific Q&A pairs that provide evidence for competency assessment. This enables
    more targeted and accurate skill evaluation.
    
    Args:
        questions (List[Dict]): List of assessment questions
        answers (List[Dict]): List of user answers/responses
        skill_assignments (Dict[str, Any]): Skill assignment data from extract_skill_assignments
        
    Returns:
        Dict[str, Any]: Map of skill IDs to their evidence and assessment confidence
        
    Evidence Map Structure:
        {
            skill_id: {
                'skill_name': str,
                'evidence_sources': [
                    {
                        'question_id': str,
                        'question_text': str,
                        'user_answer': str,
                        'question_type': str
                    }
                ],
                'assessment_confidence': str,  # 'direct', 'inferred', 'low'
                'question_types': List[str]
            }
        }
        
    Features:
        - Links skills to specific Q&A evidence
        - Tracks assessment confidence levels
        - Truncates long text for performance
        - Groups evidence by skill for comprehensive analysis
    """
    skill_evidence = {}
    question_to_skills = skill_assignments['question_to_skills']
    question_types = skill_assignments['question_types']
    
    logger.info("Creating skill evidence map from Q&A data...")
    
    # Create Q&A pairs
    qa_pairs = []
    for i, answer in enumerate(answers):
        answer_dict = parse_to_dict(answer)
        question_id = answer_dict.get('questionId')
        user_answer = answer_dict.get('answer', '')
        
        # Find corresponding question
        corresponding_question = None
        if i < len(questions):
            corresponding_question = questions[i]
        else:
            # Try to find by ID
            for q in questions:
                q_dict = parse_to_dict(q)
                if q_dict.get('id') == question_id:
                    corresponding_question = q
                    break
        
        if corresponding_question:
            qa_pairs.append({
                'question': corresponding_question,
                'answer': answer_dict,
                'user_answer': user_answer,
                'question_id': question_id or f'question_{i+1}'
            })
    
    # Map evidence to skills
    for qa_pair in qa_pairs:
        question_id = qa_pair['question_id']
        question_dict = parse_to_dict(qa_pair['question'])
        question_text = question_dict.get('question', '')
        question_type = question_types.get(question_id, 'unknown')
        user_answer = qa_pair['user_answer']
        
        # Get skills assigned to this question
        assigned_skills = question_to_skills.get(question_id, [])
        
        for skill in assigned_skills:
            skill_dict = parse_to_dict(skill)
            skill_id = skill_dict.get('id')
            skill_name = skill_dict.get('name', 'Unknown')
            
            if skill_id:
                if skill_id not in skill_evidence:
                    skill_evidence[skill_id] = {
                        'skill_name': skill_name,
                        'evidence_sources': [],
                        'assessment_confidence': 'direct',  # Direct because explicitly assigned
                        'question_types': []
                    }
                
                skill_evidence[skill_id]['evidence_sources'].append({
                    'question_id': question_id,
                    'question_text': question_text[:200] + '...' if len(question_text) > 200 else question_text,
                    'user_answer': user_answer[:300] + '...' if len(user_answer) > 300 else user_answer,
                    'question_type': question_type
                })
                
                if question_type not in skill_evidence[skill_id]['question_types']:
                    skill_evidence[skill_id]['question_types'].append(question_type)
    
    logger.info(f"Created evidence map for {len(skill_evidence)} skills with direct assessment evidence")
    
    return skill_evidence

# ===============================================
# === INDIVIDUAL Q&A ASSESSMENT ENGINE ===
# ===============================================

def analyze_question_answer(question: Dict[str, Any], answer: Dict[str, Any], skill_matrix: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes a question and answer pair to determine skill competency adjustments.
    
    This function performs detailed analysis of a single Q&A pair to assess competency
    for associated skills. It handles skill extraction, AI evaluation, and skill matrix updates.
    
    Args:
        question (Dict[str, Any]): Question data with associated skills
        answer (Dict[str, Any]): User's answer/response data  
        skill_matrix (Dict[str, Any]): Current skill matrix to update
        
    Returns:
        Dict[str, Any]: Updated skill matrix with new competency scores
        
    Process Flow:
        1. Extract and validate question and answer data
        2. Identify associated skills (from 'skills' or 'expected_skills' fields)
        3. Map skill names to skill matrix entries if needed
        4. Call AI evaluation agent for competency scoring
        5. Update skill matrix with new scores and assessment details
        
    AI Evaluation:
        - Uses GPT-4.1-nano for competency scoring (0-100 scale)
        - Provides detailed root problem analysis
        - Handles both technical and soft skills
        - Adds assessment metadata to skill records
        
    Error Handling:
        - Returns unchanged matrix if inputs invalid
        - Logs warnings for missing skills or data
        - Provides fallback scoring for evaluation failures
    """
    try:
        # Validate inputs
        if not question or not answer or not skill_matrix:
            logger.warning("Missing required inputs for question analysis")
            return skill_matrix
            
        # Extract the question data
        question_text = question.get('question', '')
        expected_answer = question.get('answer', '')
        
        if not question_text:
            logger.warning("No question text found, skipping analysis")
            return skill_matrix
        
        # Try to get skills from different possible formats
        skills = []
        
        # First check for the new structured format
        if 'skills' in question:
            skills_data = question.get('skills', [])
            # Ensure skills is a list
            if isinstance(skills_data, list):
                skills = skills_data
                logger.info(f"Found skills in 'skills' field: {len(skills)}")
            else:
                logger.warning(f"'skills' field is not a list: {type(skills_data).__name__}")
                # Try to convert to list if it's a dictionary
                if isinstance(skills_data, dict):
                    skills = [skills_data]
                    logger.info(f"Converted dictionary 'skills' to list with 1 item")
        # Fall back to legacy expected_skills format if needed
        elif 'expected_skills' in question:
            expected_skill_names = question.get('expected_skills', [])
            if not isinstance(expected_skill_names, list):
                logger.warning(f"'expected_skills' field is not a list: {type(expected_skill_names).__name__}")
                if isinstance(expected_skill_names, str):
                    expected_skill_names = [expected_skill_names]
                    logger.info(f"Converted string 'expected_skills' to list with 1 item")
                else:
                    expected_skill_names = []
                    
            logger.info(f"Found {len(expected_skill_names)} skill names in 'expected_skills' field")
            
            # Convert skill names to skill objects by looking them up in the skill matrix
            for skill_name in expected_skill_names:
                if not skill_name or not isinstance(skill_name, str):
                    logger.warning(f"Invalid skill name: {skill_name}")
                    continue
                    
                # Search for this skill in the matrix categories
                found = False
                for category_key in skill_matrix.keys():
                    # UPDATED: Only skip pure metadata contexts, not SOP skill categories
                    if category_key in ['sop_context', 'domain_knowledge_context'] and isinstance(skill_matrix.get(category_key, {}), dict) and ('has_sop_data' in skill_matrix.get(category_key, {}) or 'has_domain_knowledge' in skill_matrix.get(category_key, {})):
                        continue  # Skip only if it's the metadata structure
                        
                    category_data = skill_matrix.get(category_key, {})
                    
                    # Handle different skill matrix structures
                    category_skills = []
                    if isinstance(category_data, dict) and 'skills' in category_data:
                        # Standard structure: {"category": {"skills": [...]}}
                        category_skills = category_data.get('skills', [])
                    elif isinstance(category_data, list):
                        # Alternative structure: {"category": [...]}
                        category_skills = category_data
                    
                    for skill in category_skills:
                        if not isinstance(skill, dict):
                            continue
                            
                        skill_name_in_matrix = skill.get('name', '')
                        if skill_name_in_matrix and skill_name_in_matrix.lower() == skill_name.lower():
                            # Create a skill reference
                            skills.append({
                                'id': skill.get('id', f"skill_{len(skills) + 1}"),
                                'name': skill.get('name'),
                                'category': category_key
                            })
                            found = True
                            logger.info(f"Mapped skill name '{skill_name}' to skill ID: {skill.get('id')}")
                            break
                    
                    if found:
                        break
                        
                if not found:
                    logger.warning(f"Could not find skill '{skill_name}' in skill matrix")
        
        logger.info(f"Extracted question text: {question_text[:50]}...")
        logger.info(f"Number of skills associated with question: {len(skills)}")
        
        if not skills:
            logger.warning(f"No skills associated with question: {question_text[:50]}...")
            return skill_matrix
        
        # Validate skills data
        valid_skills = []
        for i, skill in enumerate(skills):
            if not isinstance(skill, dict):
                logger.warning(f"Skill {i+1} is not a dictionary: {skill}")
                continue
                
            # Ensure skill has required fields
            if 'id' not in skill:
                skill['id'] = f"skill_{i+1}"
                logger.info(f"Generated missing ID for skill: {skill.get('name', 'Unknown')}")
                
            if 'name' not in skill:
                skill['name'] = f"Unknown Skill {i+1}"
                logger.warning(f"Generated missing name for skill ID: {skill['id']}")
                
            valid_skills.append(skill)
                
        if not valid_skills:
            logger.warning("No valid skills found after validation")
            return skill_matrix
        
        # Log the skills
        for i, skill in enumerate(valid_skills):
            skill_name = skill.get('name', 'Unknown')
            skill_id = skill.get('id', 'No ID')
            category = skill.get('category', 'Unknown')
            logger.info(f"Skill {i+1}: {skill_name} (ID: {skill_id}, Category: {category})")
        
        # Extract the user's answer
        user_answer = answer.get('answer', '')
        if not user_answer:
            logger.warning("No user answer found, using default score")
            # Assign default scores for missing answers
            updated_matrix = skill_matrix.copy()
            for skill in valid_skills:
                logger.info(f"Assigning default score of 25 for unanswered question to skill: {skill['name']}")
            return updated_matrix
            
        logger.info(f"User answer: {user_answer[:50]}...")
        
        # Use the GPT agent to evaluate the competency
        logger.info(f"Evaluating competency using GPT agent...")
        competency_results = evaluate_competency(question_text, expected_answer, user_answer, valid_skills)
        
        if not competency_results:
            logger.warning("No competency scores returned from evaluation")
            return skill_matrix
        
        # Log the competency scores with color
        logger.info(f"Received competency scores: {competency_results}")
        for skill_id, result_data in competency_results.items():
            # Extract score and root problem
            score = result_data["score"] if isinstance(result_data, dict) else result_data
            root_problem = result_data.get("root_problem") if isinstance(result_data, dict) else None
            
            # Find skill name for better logging
            skill_name = next((s.get('name', 'Unknown') for s in skills if s.get('id') == skill_id), 'Unknown')
            
            # Use different colors based on score range
            if score >= 80:
                logger.info(f"\033[92m✓ High competency: {skill_name} (ID: {skill_id}) - Score: {score}/100 \033[0m")  # Green
            elif score >= 40:
                logger.info(f"\033[94m→ Medium competency: {skill_name} (ID: {skill_id}) - Score: {score}/100 \033[0m")  # Blue
            else:
                logger.info(f"\033[93m⚠ Low competency: {skill_name} (ID: {skill_id}) - Score: {score}/100 \033[0m")  # Yellow
            
            # Log root problem if available
            if root_problem:
                logger.info(f"  Root problem: {root_problem}")
        
        # Transform the skill matrix structure to standardized format
        logger.info("Transforming skill matrix to standardized format...")
        updated_matrix = transform_skill_matrix_structure(skill_matrix)
        
        # Debug: Dump the current skill matrix structure to better understand it
        logger.info("Current skill matrix structure:")
        all_skill_ids = []
        for category, content in updated_matrix.items():
            # UPDATED: Only skip pure metadata contexts, not SOP skill categories
            if category in ['sop_context', 'domain_knowledge_context'] and isinstance(content, dict) and ('has_sop_data' in content or 'has_domain_knowledge' in content):
                continue  # Skip only if it's the metadata structure
                
            if isinstance(content, dict) and 'skills' in content:
                logger.info(f"  Category '{category}' has {len(content.get('skills', []))} skills (dict structure)")
                # Log each skill ID in this category to help with debugging
                if 'skills' in content and isinstance(content['skills'], list):
                    for skill in content['skills']:
                        if isinstance(skill, dict) and 'id' in skill:
                            logger.info(f"    - Skill ID: {skill['id']}, Name: {skill.get('name', 'Unknown')}, Competency: {skill.get('competency', 'None')}")
                            all_skill_ids.append(skill['id'])
            elif isinstance(content, list):
                logger.info(f"  Category '{category}' has {len(content)} skills (list structure)")
                # Log each skill ID in this category
                for skill in content:
                    if isinstance(skill, dict) and 'id' in skill:
                        logger.info(f"    - Skill ID: {skill['id']}, Name: {skill.get('name', 'Unknown')}, Competency: {skill.get('competency', 'None')}")
                        all_skill_ids.append(skill['id'])
            
            skill_matrix = updated_matrix  # Use the transformed matrix
        
        # Build a normalized ID mapping for matching skills
        normalized_skill_map = {}
        
        # Build a normalized ID map for efficient lookups
        for category_key, category_data in skill_matrix.items():
            if isinstance(category_data, dict) and 'skills' in category_data:
                for i, skill in enumerate(category_data.get('skills', [])):
                    if 'id' in skill:
                        norm_id = normalize_skill_id(skill['id'])
                        normalized_skill_map[norm_id] = {
                            'category': category_key,
                            'original_id': skill['id'],
                            'structure': 'dict' if isinstance(category_data, dict) else 'list',
                            'index': i
                        }
            elif isinstance(category_data, list):
                for i, skill in enumerate(category_data):
                    if 'id' in skill:
                        norm_id = normalize_skill_id(skill['id'])
                        normalized_skill_map[norm_id] = {
                            'category': category_key,
                            'original_id': skill['id'],
                            'structure': 'list',
                            'index': i
                        }
        
        # Also build a name-based mapping for fallback
        name_to_location = {}
        for category_key, category_data in skill_matrix.items():
            if isinstance(category_data, dict) and 'skills' in category_data:
                for i, skill in enumerate(category_data.get('skills', [])):
                    if 'name' in skill:
                        name = skill['name'].lower()
                        name_to_location[name] = {
                            'category': category_key,
                            'structure': 'dict' if isinstance(category_data, dict) else 'list',
                            'index': i
                        }
            elif isinstance(category_data, list):
                for i, skill in enumerate(category_data):
                    if 'name' in skill:
                        name = skill['name'].lower()
                        name_to_location[name] = {
                            'category': category_key,
                            'structure': 'list',
                            'index': i
                        }
        
        # Log the normalized ID mapping
        logger.info(f"Normalized skill ID mapping:")
        for norm_id, info in normalized_skill_map.items():
            logger.info(f"  {norm_id} -> {info['original_id']} (Category: {info['category']})")
        
        # Update the skill matrix based on the competency evaluation
        updated_matrix = skill_matrix.copy()
        updates_made = 0
        
        # Process each competency result for updating
        for skill_id, result_data in competency_results.items():
            # Extract score and root problem
            score = result_data["score"] if isinstance(result_data, dict) else result_data
            root_problem = result_data.get("root_problem") if isinstance(result_data, dict) else None
            
            # Normalize the skill ID for matching
            norm_skill_id = normalize_skill_id(skill_id)
            
            # Try to find the skill using normalized ID
            skill_found = False
            
            # First attempt: Use the normalized ID mapping
            if norm_skill_id in normalized_skill_map:
                skill_info = normalized_skill_map[norm_skill_id]
                category = skill_info['category']
                structure = skill_info['structure']
                index = skill_info['index']
                
                logger.info(f"Found skill {skill_id} via normalized mapping in category {category}")
                
                if structure == 'dict':
                    current = updated_matrix[category]['skills'][index].get('competency', 
                            updated_matrix[category]['skills'][index].get('competency_level', 0))
                    new_score = max(0, min(100, score))
                    updated_matrix[category]['skills'][index]['competency'] = new_score
                    # Also update competency_level for consistency
                    updated_matrix[category]['skills'][index]['competency_level'] = max(0, min(100, score))
                    
                    # Add the root_problem to the skill data
                    if root_problem:
                        if 'assessment_details' not in updated_matrix[category]['skills'][index]:
                            updated_matrix[category]['skills'][index]['assessment_details'] = {}
                        updated_matrix[category]['skills'][index]['assessment_details']['root_problem'] = root_problem
                        updated_matrix[category]['skills'][index]['assessment_details']['question_text'] = question_text[:150] + '...' if len(question_text) > 150 else question_text
                    
                    logger.info(f"Updated skill {skill_id} competency from {current} to {new_score} in category {category}")
                    if root_problem:
                        logger.info(f"Added root problem for skill {skill_id}: {root_problem[:50]}...")
                    updates_made += 1
                elif structure == 'list':
                    current = updated_matrix[category][index].get('competency',
                            updated_matrix[category][index].get('competency_level', 0))
                    new_score = max(0, min(100, score))
                    updated_matrix[category][index]['competency'] = new_score
                    # Also update competency_level for consistency  
                    updated_matrix[category][index]['competency_level'] = max(0, min(100, score))
                    
                    # Add the root_problem to the skill data
                    if root_problem:
                        if 'assessment_details' not in updated_matrix[category][index]:
                            updated_matrix[category][index]['assessment_details'] = {}
                        updated_matrix[category][index]['assessment_details']['root_problem'] = root_problem
                        updated_matrix[category][index]['assessment_details']['question_text'] = question_text[:150] + '...' if len(question_text) > 150 else question_text
                    
                    logger.info(f"Updated skill {skill_id} competency from {current} to {new_score} in category {category}")
                    if root_problem:
                        logger.info(f"Added root problem for skill {skill_id}: {root_problem[:50]}...")
                    updates_made += 1
            
            # Second attempt: Try to match by name if we have a skill name from the question
            if not skill_found:
                # Find skill name from the skills list
                skill_name = next((s.get('name', '').lower() for s in skills if normalize_skill_id(s.get('id')) == norm_skill_id or s.get('id') == skill_id), None)
                
                if skill_name and skill_name in name_to_location:
                    skill_info = name_to_location[skill_name]
                    category = skill_info['category']
                    structure = skill_info['structure']
                    index = skill_info['index']
                    
                    logger.info(f"Found skill {skill_id} via name '{skill_name}' in category {category}")
                    
                    if structure == 'dict':
                        current = updated_matrix[category]['skills'][index].get('competency', 
                                updated_matrix[category]['skills'][index].get('competency_level', 0))
                        new_score = max(0, min(100, score))
                        updated_matrix[category]['skills'][index]['competency'] = new_score
                        # Also update competency_level for consistency
                        updated_matrix[category]['skills'][index]['competency_level'] = max(0, min(100, score))
                        
                        # Add the root_problem to the skill data
                        if root_problem:
                            if 'assessment_details' not in updated_matrix[category]['skills'][index]:
                                updated_matrix[category]['skills'][index]['assessment_details'] = {}
                            updated_matrix[category]['skills'][index]['assessment_details']['root_problem'] = root_problem
                            updated_matrix[category]['skills'][index]['assessment_details']['question_text'] = question_text[:150] + '...' if len(question_text) > 150 else question_text
                        
                        logger.info(f"Updated skill by name '{skill_name}' competency from {current} to {new_score}")
                        if root_problem:
                            logger.info(f"Added root problem for skill {skill_name}: {root_problem[:50]}...")
                        updates_made += 1
                    elif structure == 'list':
                        current = updated_matrix[category][index].get('competency',
                                updated_matrix[category][index].get('competency_level', 0))
                        new_score = max(0, min(100, score))
                        updated_matrix[category][index]['competency'] = new_score
                        # Also update competency_level for consistency  
                        updated_matrix[category][index]['competency_level'] = max(0, min(100, score))
                        
                        # Add the root_problem to the skill data
                        if root_problem:
                            if 'assessment_details' not in updated_matrix[category][index]:
                                updated_matrix[category][index]['assessment_details'] = {}
                            updated_matrix[category][index]['assessment_details']['root_problem'] = root_problem
                            updated_matrix[category][index]['assessment_details']['question_text'] = question_text[:150] + '...' if len(question_text) > 150 else question_text
                        
                        logger.info(f"Updated skill by name '{skill_name}' competency from {current} to {new_score}")
                        if root_problem:
                            logger.info(f"Added root problem for skill {skill_name}: {root_problem[:50]}...")
                        updates_made += 1
                    skill_found = True
            
            # If skill not found after all attempts, log detailed warning
            if not skill_found:
                logger.warning(f"Failed to locate skill {skill_id} in the skill matrix")
                logger.warning(f"Normalized ID: {norm_skill_id}")
                logger.warning(f"Available normalized IDs: {list(normalized_skill_map.keys())}")
                logger.warning(f"Available skill names: {list(name_to_location.keys())}")
        
        logger.info(f"Total updates made to skill matrix: {updates_made}")
        return updated_matrix
        
    except Exception as e:
        logger.error(f"Error analyzing Q&A: {str(e)}")
        logger.error(traceback.format_exc())
        return skill_matrix

def evaluate_competency(question: str, expected_answer: str, user_answer: str, skills: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Uses a GPT agent to evaluate the competency level of skills based on the answer.
    Returns a dictionary containing skill IDs with their competency scores (0-100) 
    and root problems for low scores.
    """
    try:
        logger.info("Creating competency evaluator agent...")
        
        # Validate skills list
        if not skills:
            logger.warning("No skills provided for competency evaluation")
            return {}
            
        # Filter out invalid skill entries
        valid_skills = []
        for skill in skills:
            if not isinstance(skill, dict):
                logger.warning(f"Skipping non-dictionary skill: {skill}")
                continue
                
            skill_id = skill.get('id')
            if not skill_id:
                logger.warning(f"Skipping skill without ID: {skill}")
                continue
                
            valid_skills.append(skill)
            
        if not valid_skills:
            logger.warning("No valid skills found after filtering")
            return {}
        
        # Check if OpenAI API key is set
        if not OPENAI_API_KEY:
            logger.error("OpenAI API key is not set. Cannot evaluate competency.")
            return {}
        
        # Create a competency evaluator agent
        try:
            # Try CrewAI v2 format first
            evaluator_agent = Agent(
                role="Senior Technical Competency Evaluator",
                goal="Provide precise, detailed competency evaluation with comprehensive root problem analysis for each skill based on user responses",
                backstory="""You are a world-class technical assessment expert with 20+ years of experience evaluating 
                candidates across all technical domains. You excel at:
                
                - Identifying precise competency levels from 0-100 with high accuracy
                - Providing detailed, actionable root problem analysis for skill gaps
                - Recognizing when users demonstrate above-average competency and what makes them strong
                - Understanding both technical and soft skills assessment
                - Analyzing coding responses for syntax, logic, best practices, and problem-solving approach
                - Evaluating theoretical knowledge depth and practical application ability
                
                You NEVER give generic assessments. Every evaluation is specific, detailed, and actionable.
                You provide concrete examples of what was missing or what was done well.
                For high-performing answers, you identify the specific strengths demonstrated.""",
                verbose=True,
                allow_delegation=False,
                config={
                    "model": "gpt-4.1-nano-2025-04-14",
                    "temperature": 0.3  # Lower temperature for more consistent evaluations
                }
            )
            logger.info("Using CrewAI v2 format for agents")
        except (TypeError, ValueError) as e:
            # Fall back to v1 format if v2 fails
            logger.warning(f"Falling back to CrewAI v1 format due to: {e}")
            evaluator_agent = Agent(
                role="Senior Technical Competency Evaluator",
                goal="Provide precise, detailed competency evaluation with comprehensive root problem analysis for each skill based on user responses",
                backstory="""You are a world-class technical assessment expert with 20+ years of experience evaluating 
                candidates across all technical domains. You excel at:
                
                - Identifying precise competency levels from 0-100 with high accuracy
                - Providing detailed, actionable root problem analysis for skill gaps
                - Recognizing when users demonstrate above-average competency and what makes them strong
                - Understanding both technical and soft skills assessment
                - Analyzing coding responses for syntax, logic, best practices, and problem-solving approach
                - Evaluating theoretical knowledge depth and practical application ability
                
                You NEVER give generic assessments. Every evaluation is specific, detailed, and actionable.
                You provide concrete examples of what was missing or what was done well.
                For high-performing answers, you identify the specific strengths demonstrated.""",
                verbose=True,
                allow_delegation=False,
                llm_config={
                    "model": "gpt-4.1-nano-2025-04-14",
                    "temperature": 0.3
                }
            )
        
        # Convert the skills list to a more readable format for the agent
        skills_text = "\n".join([
            f"- {skill.get('name', 'Unknown Skill')} (ID: {skill.get('id')}): {skill.get('description', 'No description')}"
            for skill in valid_skills
        ])
        skill_ids = [skill.get('id') for skill in valid_skills]
        
        logger.info(f"Creating evaluation task for {len(skill_ids)} skills...")
        
        # Create the evaluation task with enhanced instructions
        evaluation_task = Task(
            description=f"""
            CRITICAL TASK: Evaluate the user's competency level for each skill based on their answer to the question.
            
            QUESTION:
            {question}
            
            EXPECTED ANSWER:
            {expected_answer}
            
            USER'S ANSWER:
            {user_answer}
            
            SKILLS TO EVALUATE:
            {skills_text}
            
            EVALUATION INSTRUCTIONS:
            
            1. COMPETENCY SCORING (0-100 scale):
               - 0-10: No knowledge/completely incorrect/admits no experience
               - 11-20: Minimal understanding/major errors/very basic concepts only
               - 21-40: Basic competency/some correct concepts but significant gaps
               - 41-60: Intermediate competency/good understanding with some errors
               - 61-80: Advanced competency/strong understanding with minor gaps
               - 81-95: Expert competency/comprehensive knowledge with excellent application
               - 96-100: Master level/exceptional depth and insight
            
            2. ROOT PROBLEM ANALYSIS REQUIREMENTS:
               
               For LOW scores (0-60):
               - Identify SPECIFIC knowledge gaps (what concepts are missing)
               - Point out incorrect assumptions or misconceptions
               - Note missing technical details or best practices
               - Highlight areas where understanding is superficial
               - Suggest specific areas for improvement
               
               For HIGH scores (70-100):
               - Identify specific strengths demonstrated
               - Note advanced concepts or best practices used correctly
               - Highlight problem-solving approach quality
               - Mention any innovative or efficient solutions shown
               - Note depth of understanding demonstrated
               
               For CODING questions specifically:
               - Evaluate: syntax correctness, algorithm efficiency, edge case handling
               - Assess: code organization, readability, best practices
               - Check: understanding of language features, problem-solving approach
               - Note: any security considerations, performance implications
            
            3. SPECIAL CASE HANDLING:
               - If user admits "no experience" or "don't know": Score 0-5 with specific learning path
               - If answer is completely off-topic: Score 0-10 with explanation of what was expected
               - If answer shows partial knowledge: Score proportionally with specific gaps identified
               - If answer exceeds expectations: Score 80+ with specific strengths noted
            
            RETURN FORMAT: Valid JSON only, no explanatory text:
            {{
                "skill_id_1": {{
                    "score": 85,
                    "root_problem": "Demonstrates strong understanding of API integration patterns including proper error handling and security considerations. Shows advanced knowledge of rate limiting and authentication flows. Could improve by mentioning specific tools like Postman or Swagger for API documentation."
                }},
                "skill_id_2": {{
                    "score": 25,
                    "root_problem": "Shows basic understanding of responsive design concepts but lacks knowledge of modern CSS Grid and Flexbox techniques. Missing understanding of mobile-first approach and breakpoint strategy. No mention of accessibility considerations or cross-browser compatibility testing."
                }}
            }}
            
            SKILL IDs TO USE: {skill_ids}
            
            REMEMBER: 
            - Every skill must have a detailed, specific root_problem analysis
            - Scores must accurately reflect the user's demonstrated competency
            - Be precise about what was done well or what was missing
            - Never use generic phrases like "No specific details available"
            """,
            expected_output="""A JSON object containing detailed competency scores and comprehensive root problem analysis:
            {
                "skill_id": {
                    "score": 75,
                    "root_problem": "Detailed, specific analysis of competency level with actionable insights"
                }
            }""",
            agent=evaluator_agent
        )
        
        # Create a crew with just the evaluator agent
        try:
            # Try the newer CrewAI v2 format first
            evaluation_crew = Crew(
                agents=[evaluator_agent],
                tasks=[evaluation_task],
                verbose=True,
                process=Process.sequential
            )
            logger.info("Using CrewAI v2 format for crew")
        except (TypeError, ValueError) as e:
            # Fall back to v1 format
            logger.warning(f"Falling back to CrewAI v1 format for crew due to: {e}")
            # Some versions may require different parameter ordering
            try:
                evaluation_crew = Crew(
                    agents=[evaluator_agent],
                    tasks=[evaluation_task],
                    verbose=True,
                    process=Process.sequential
                )
            except Exception as crew_error:
                logger.error(f"Failed to create crew with standard parameters: {crew_error}")
                # Final fallback
                try:
                    evaluation_crew = Crew(
                        tasks=[evaluation_task],
                        agents=[evaluator_agent],
                        process=Process.sequential,
                        verbose=True
                    )
                except Exception as final_error:
                    logger.error(f"All crew creation attempts failed: {final_error}")
                    # Return default scores as last resort
                    default_scores = {skill.get('id'): {"score": 50, "root_problem": None} for skill in valid_skills}
                    logger.warning(f"Using default scores due to crew creation errors: {default_scores}")
                    return default_scores
        
        logger.info("Running competency evaluation...")
        
        # Run the evaluation
        try:
            result = evaluation_crew.kickoff()
        except Exception as eval_error:
            logger.error(f"Error during evaluation: {eval_error}")
            # Return default scores if evaluation fails
            default_scores = {skill.get('id'): {"score": 50, "root_problem": None} for skill in valid_skills}
            logger.warning(f"Using default scores due to evaluation error: {default_scores}")
            return default_scores
        
        # Convert CrewOutput to string for processing (CrewAI v0.11.0 compatibility)
        try:
            # Log the type and attributes for debugging
            logger.info(f"Result type: {type(result).__name__}")
            if hasattr(result, '__dict__'):
                logger.info(f"Result attributes: {list(result.__dict__.keys())}")
            
            # In CrewAI v0.11.0, result is a CrewOutput object with a .raw attribute
            if hasattr(result, 'raw'):
                result_str = result.raw
                logger.info(f"Received evaluation result (from .raw): {result_str[:200]}...")
            elif hasattr(result, 'output'):
                result_str = str(result.output)
                logger.info(f"Received evaluation result (from .output): {result_str[:200]}...")
            else:
                result_str = str(result)
                logger.info(f"Received evaluation result (converted to str): {result_str[:200]}...")
        except Exception as str_error:
            logger.warning(f"Could not convert result to string: {str_error}")
            result_str = ""
        
        # Parse the result to extract the competency scores and root problems
        # Looking for a JSON object in the result
        import re
        
        # Try to extract JSON from the result string
        json_match = re.search(r'\{.*\}', result_str, re.DOTALL)
        
        if json_match:
            try:
                evaluation_data = json.loads(json_match.group(0))
                logger.info(f"Competency evaluation parsed as JSON: {evaluation_data}")
                
                # Validate evaluation data
                validated_data = {}
                for skill_id, data in evaluation_data.items():
                    # Handle both dictionary and single score format for backward compatibility
                    if isinstance(data, dict):
                        score = data.get("score", 0)
                        root_problem = data.get("root_problem")
                    else:
                        # Old format with just a score number
                        score = data
                        root_problem = None
                    
                    # Ensure score is numeric
                    try:
                        score_value = int(score)
                        # Ensure within range 0-100
                        score_value = max(0, min(100, score_value))
                        validated_data[skill_id] = {
                            "score": score_value,
                            "root_problem": root_problem
                        }
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid score value for skill {skill_id}: {score}")
                        validated_data[skill_id] = {
                            "score": 50,  # Default to middle value
                            "root_problem": "Error parsing competency score"
                        }
                
                return validated_data
            except json.JSONDecodeError as json_err:
                logger.error(f"Failed to parse JSON from result: {json_err}")
                # If JSON parsing fails, try a simpler approach to extract at least scores
                scores = {}
                for skill_id in skill_ids:
                    # Look for patterns like "skill_id": 75
                    match = re.search(rf'["\']({skill_id})["\']:\s*(\d+)', result_str)
                    if match:
                        scores[match.group(1)] = {
                            "score": int(match.group(2)),
                            "root_problem": None  # Can't extract root problem with regex
                        }
                
                if scores:
                    logger.info(f"Extracted basic competency scores using regex: {scores}")
                    return scores
        
        # Log error with safe string conversion
        try:
            error_preview = result_str[:200] if result_str else "Empty result"
        except:
            error_preview = "Could not extract preview"
        logger.error(f"Failed to parse competency scores from result: {error_preview}...")
        
        # Return default scores as a fallback
        default_scores = {skill.get('id'): {"score": 50, "root_problem": None} for skill in valid_skills}
        logger.info(f"Using default scores as fallback: {default_scores}")
        return default_scores
        
    except Exception as e:
        logger.error(f"Error in competency evaluation: {str(e)}")
        logger.error(traceback.format_exc())
        # Return default scores for error recovery
        default_scores = {skill.get('id'): {"score": 50, "root_problem": None} for skill in skills if isinstance(skill, dict) and skill.get('id')}
        logger.warning(f"Using default scores due to error: {default_scores}")
        return default_scores

# ===============================================
# === GAP ANALYSIS DASHBOARD GENERATION ===
# ===============================================

def generate_skill_gap_dashboard(skill_matrix: Dict[str, Any], baseline_id: str = None) -> Dict[str, Any]:
    """
    Generates a consolidated dashboard view of skill gaps and root problems including domain knowledge analysis.
    
    This function creates a comprehensive dashboard that analyzes all skills in the matrix
    and categorizes them by type and competency level. It provides detailed gap analysis,
    root problem identification, and actionable insights for improvement.
    
    Args:
        skill_matrix (Dict[str, Any]): Complete skill matrix with assessed competency scores
        baseline_id (str, optional): Baseline ID to fetch ideal skill matrix for accurate gap calculation
        
    Returns:
        Dict[str, Any]: Comprehensive dashboard with categorized gaps and analysis
        
    Dashboard Structure:
        {
            'technical_skill_gaps': List[Dict],      # Technical skills with competency < 70
            'soft_skill_gaps': List[Dict],           # Soft skills with competency < 70
            'domain_knowledge_gaps': List[Dict],     # Domain knowledge with competency < 70
            'sop_skill_gaps': List[Dict],           # SOP skills with competency < 70
            'summary': {
                'total_skills': int,
                'technical_skills': int,
                'soft_skills': int,
                'domain_knowledge_skills': int,
                'sop_skills': int,
                'skills_with_gaps': int,
                'average_competency': float
            },
            'generated_at': str  # ISO timestamp
        }
        
    Gap Analysis Features:
        - Category-specific arrays to eliminate redundancy
        - Competency threshold: skills < 70/100 considered gaps
        - FIXED: Includes both competency (current) and competency_level (ideal) for accurate gap calculation
        - Root problem analysis from AI assessment details
        - Evidence and assessment type tracking
        - Color-coded competency levels in logs
        - Business impact analysis for domain knowledge
        - Compliance requirements for SOP skills
        
    Performance:
        - Processes all skill categories in single pass
        - Memory efficient with category-specific storage
        - Comprehensive logging with visual indicators
    """
    dashboard = {
        # REMOVED: "skill_gaps": [] - eliminating redundant general array
        "technical_skill_gaps": [],
        "soft_skill_gaps": [],
        "domain_knowledge_gaps": [],
        "sop_skill_gaps": [],  # ADDED: Support for SOP skills
        "generated_at": datetime.utcnow().isoformat(),
        "summary": {
            "total_skills": 0,
            "technical_skills": 0,
            "soft_skills": 0,
            "domain_knowledge_skills": 0,
            "sop_skills": 0,  # ADDED: Count SOP skills
            "skills_with_gaps": 0,
            "average_competency": 0
        }
    }

    # ✅ PHASE 1 FIX: Fetch ideal skill matrix for accurate gap calculation
    ideal_skill_matrix = None
    if baseline_id:
        try:
            logger.info(f"🔍 Fetching ideal skill matrix for baseline: {baseline_id}")
            baseline_result = supabase.table('baseline_skill_matrix').select('ideal_skill_matrix_id').eq('id', baseline_id).single().execute()
            if baseline_result.data:
                ideal_matrix_id = baseline_result.data['ideal_skill_matrix_id']
                ideal_result = supabase.table('ideal_skill_matrix').select('skill_matrix').eq('id', ideal_matrix_id).single().execute()
                if ideal_result.data:
                    ideal_skill_matrix = ideal_result.data['skill_matrix']
                    logger.info(f"✅ Successfully loaded ideal skill matrix for accurate gap calculation")
                else:
                    logger.warning(f"⚠️ No ideal skill matrix found for ID: {ideal_matrix_id}")
            else:
                logger.warning(f"⚠️ No baseline found for ID: {baseline_id}")
        except Exception as e:
            logger.error(f"❌ Error fetching ideal skill matrix: {str(e)}")
            ideal_skill_matrix = None

    total_skills = 0
    technical_skills_count = 0
    soft_skills_count = 0
    domain_knowledge_skills_count = 0
    sop_skills_count = 0  # ADDED: Track SOP skills
    skills_with_gaps = 0
    competency_sum = 0

    # ✅ PHASE 1 FIX: Helper function to get ideal competency level for a skill
    def get_ideal_competency_level(skill_name: str, skill_id: str, category: str) -> int:
        """Get the ideal competency level for a skill from the ideal skill matrix"""
        if not ideal_skill_matrix:
            return 100  # Default fallback if no ideal matrix available
        
        # Search in the ideal skill matrix for this skill
        for ideal_category_name, ideal_category_data in ideal_skill_matrix.items():
            if ideal_category_name.lower() == category.lower():
                ideal_skills = []
                if isinstance(ideal_category_data, dict) and 'skills' in ideal_category_data:
                    ideal_skills = ideal_category_data.get('skills', [])
                elif isinstance(ideal_category_data, list):
                    ideal_skills = ideal_category_data
                
                for ideal_skill in ideal_skills:
                    if isinstance(ideal_skill, dict):
                        # Match by name or ID
                        if (ideal_skill.get('name', '').lower() == skill_name.lower() or 
                            ideal_skill.get('id') == skill_id):
                            return ideal_skill.get('competency_level', ideal_skill.get('competency', 100))
        
        # If not found, try searching across all categories
        for ideal_category_name, ideal_category_data in ideal_skill_matrix.items():
            if ideal_category_name in ['sop_context', 'domain_knowledge_context']:
                continue
            ideal_skills = []
            if isinstance(ideal_category_data, dict) and 'skills' in ideal_category_data:
                ideal_skills = ideal_category_data.get('skills', [])
            elif isinstance(ideal_category_data, list):
                ideal_skills = ideal_category_data
            
            for ideal_skill in ideal_skills:
                if isinstance(ideal_skill, dict):
                    if (ideal_skill.get('name', '').lower() == skill_name.lower() or 
                        ideal_skill.get('id') == skill_id):
                        return ideal_skill.get('competency_level', ideal_skill.get('competency', 100))
        
        logger.warning(f"⚠️ Could not find ideal competency for skill: {skill_name} ({skill_id}) in category: {category}")
        return 100  # Default fallback

    # Process each category in the skill matrix including domain knowledge and SOPs
    logger.info("==== COMPREHENSIVE SKILL COMPETENCY SUMMARY (INCLUDING DOMAIN KNOWLEDGE AND SOPs) ====")
    for category_name, category_data in skill_matrix.items():
        # UPDATED: Only skip pure metadata contexts, not SOP skill categories
        if category_name in ['sop_context', 'domain_knowledge_context'] and isinstance(category_data, dict) and ('has_sop_data' in category_data or 'has_domain_knowledge' in category_data):
            continue  # Skip only if it's the metadata structure
            
        category_skills = []
        
        # Handle different data structures
        if isinstance(category_data, dict) and 'skills' in category_data:
            category_skills = category_data.get('skills', [])
        elif isinstance(category_data, list):
            category_skills = category_data
        
        # Skip empty categories
        if not category_skills:
            continue
        
        # Determine skill category type
        is_soft_skills = any(soft_cat in category_name.lower() for soft_cat in 
                           ['soft_skills', 'communication', 'leadership', 'teamwork', 'management'])
        is_domain_knowledge = 'domain_knowledge' in category_name.lower()
        is_sop_skills = any(sop_cat in category_name.lower() for sop_cat in 
                           ['standard_operating_procedures', 'standard_operating', 'sop', 'procedure', 'protocol', 'compliance'])  # UPDATED: Added full category name
        
        # Add category type indicator
        category_type_indicator = ""
        if is_sop_skills:
            category_type_indicator = " [SOP SKILLS]"  # ADDED
        elif is_domain_knowledge:
            category_type_indicator = " [DOMAIN KNOWLEDGE]"
        elif is_soft_skills:
            category_type_indicator = " [SOFT SKILLS]"
        else:
            category_type_indicator = " [TECHNICAL]"
            
        logger.info(f"\nCategory: {category_name.upper()}{category_type_indicator}")
        logger.info("-" * 40)
        
        # Process each skill in this category
        for skill in category_skills:
            if not isinstance(skill, dict):
                continue
                
            total_skills += 1
            
            # Count by skill type
            if is_sop_skills:
                sop_skills_count += 1  # ADDED: Count SOP skills
            elif is_domain_knowledge:
                domain_knowledge_skills_count += 1
            elif is_soft_skills:
                soft_skills_count += 1
            else:
                technical_skills_count += 1
            
            # Handle both competency field names and ensure ID exists
            competency = skill.get('competency', skill.get('competency_level', 0))
            competency_sum += competency
            
            # Generate ID if missing
            if 'id' not in skill or not skill.get('id'):
                skill_id = f'skill_{category_name}_{total_skills}'
                skill['id'] = skill_id
                logger.info(f"Generated ID '{skill_id}' for dashboard skill: '{skill.get('name', 'Unknown')}'")
            else:
                skill_id = skill['id']
                
            skill_name = skill.get('name', 'Unnamed Skill')
            
            # Determine competency level and use colors
            level = "Unknown"
            color_code = "\033[97m"  # Default: white
            
            if competency >= 80:
                level = "Expert"
                color_code = "\033[92m"  # Green
            elif competency >= 60:
                level = "Advanced"
                color_code = "\033[94m"  # Blue
            elif competency >= 40:
                level = "Intermediate"
                color_code = "\033[96m"  # Cyan
            elif competency >= 20:
                level = "Basic"
                color_code = "\033[93m"  # Yellow
            else:
                level = "Novice"
                color_code = "\033[91m"  # Red
            
            # Print skill competency with color
            logger.info(f"{color_code}{skill_name} (ID: {skill_id}): {competency}/100 - {level}\033[0m")
            
            # Check if this skill has a low competency (indicating a gap)
            if competency < 70:  # Threshold for considering a skill as having a gap
                skills_with_gaps += 1
                
                # Extract assessment details if available
                assessment_details = skill.get('assessment_details', {})
                root_problem = assessment_details.get('root_problem', 'Assessment not completed - comprehensive analysis needed')
                question_text = assessment_details.get('question_text', '')
                assessment_type = assessment_details.get('assessment_type', 'standard')
                evidence = assessment_details.get('evidence', '')
                
                # ✅ PHASE 1 FIX: Get ideal competency level and calculate accurate gap percentage
                ideal_competency = get_ideal_competency_level(skill_name, skill_id, category_name)
                gap_percentage = max(0, ideal_competency - competency)  # Ensure non-negative gap
                
                # Log the gap with details including accurate gap calculation
                logger.info(f"  \033[93m⚠ GAP IDENTIFIED - Root problem: {root_problem[:100]}...\033[0m")
                logger.info(f"  📊 Gap Analysis: Current: {competency}/100, Ideal: {ideal_competency}/100, Gap: {gap_percentage}%")
                if evidence:
                    logger.info(f"  🔍 Evidence: {evidence[:80]}...")
                
                # Create skill gap entry with type classification
                skill_gap = {
                    "id": skill_id,
                    "name": skill_name,
                    "category": category_name,
                    "skill_type": "sop" if is_sop_skills else "domain_knowledge" if is_domain_knowledge else "soft_skills" if is_soft_skills else "technical",  # UPDATED: Added SOP type
                    "competency": competency,  # Current level (0-70 for gaps)
                    "competency_level": ideal_competency,  # ✅ ADDED: Ideal level for accurate gap calculation
                    "gap_percentage": gap_percentage,  # ✅ ADDED: Accurate gap calculation (ideal - current)
                    "root_problem": root_problem,
                    "question_text": question_text,
                    "assessment_type": assessment_type,
                    "evidence": evidence,
                    "description": skill.get('description', ''),
                    "knowledge_areas": skill.get('knowledge_areas', []) if is_domain_knowledge else [],
                    "business_impact": skill.get('business_impact', '') if is_domain_knowledge else '',
                    "procedural_requirements": skill.get('procedural_requirements', []) if is_sop_skills else [],  # ADDED: SOP-specific data
                    "compliance_requirements": skill.get('compliance_requirements', []) if is_sop_skills else []  # ADDED: SOP-specific data
                }
                
                # MODIFIED: Add to appropriate category-specific array (including SOPs)
                if is_sop_skills:
                    dashboard["sop_skill_gaps"].append(skill_gap)  # ADDED: SOP skills category
                    logger.info(f"  📋 Added to SOP SKILLS gaps")
                elif is_domain_knowledge:
                    dashboard["domain_knowledge_gaps"].append(skill_gap)
                    logger.info(f"  📚 Added to DOMAIN KNOWLEDGE gaps")
                elif is_soft_skills:
                    dashboard["soft_skill_gaps"].append(skill_gap)
                    logger.info(f"  🤝 Added to SOFT SKILLS gaps")
                else:
                    dashboard["technical_skill_gaps"].append(skill_gap)
                    logger.info(f"  🔧 Added to TECHNICAL gaps")
                    
            else:
                # For high competency skills, also log the positive analysis
                assessment_details = skill.get('assessment_details', {})
                if assessment_details.get('root_problem'):
                    logger.info(f"  \033[92m✅ STRENGTH - {assessment_details['root_problem'][:100]}...\033[0m")
    
    # Calculate summary statistics
    if total_skills > 0:
        dashboard["summary"]["total_skills"] = total_skills
        dashboard["summary"]["technical_skills"] = technical_skills_count
        dashboard["summary"]["soft_skills"] = soft_skills_count
        dashboard["summary"]["domain_knowledge_skills"] = domain_knowledge_skills_count
        dashboard["summary"]["sop_skills"] = sop_skills_count  # ADDED: Include SOP skills
        dashboard["summary"]["skills_with_gaps"] = skills_with_gaps
        average_competency = round(competency_sum / total_skills, 1)
        dashboard["summary"]["average_competency"] = average_competency
        
        # Log summary statistics with category breakdown
        logger.info("\n==== SKILL GAP ANALYSIS SUMMARY (CATEGORY-SPECIFIC) ====")
        logger.info(f"Total skills evaluated: {total_skills}")
        logger.info(f"  - Technical skills: {technical_skills_count}")
        logger.info(f"  - Soft skills: {soft_skills_count}")
        logger.info(f"  - Domain knowledge skills: {domain_knowledge_skills_count}")
        logger.info(f"  - SOP skills: {sop_skills_count}")
        logger.info(f"Skills with gaps: {skills_with_gaps} ({round(skills_with_gaps/total_skills*100, 1)}%)")
        
        # Log category-specific gap counts
        technical_gaps_count = len(dashboard["technical_skill_gaps"])
        soft_gaps_count = len(dashboard["soft_skill_gaps"])
        domain_gaps_count = len(dashboard["domain_knowledge_gaps"])
        sop_gaps_count = len(dashboard["sop_skill_gaps"])  # ADDED: SOP gaps count
        
        logger.info(f"Gap breakdown by category:")
        logger.info(f"  - Technical gaps: {technical_gaps_count}")
        logger.info(f"  - Soft skill gaps: {soft_gaps_count}")
        logger.info(f"  - Domain knowledge gaps: {domain_gaps_count}")
        logger.info(f"  - SOP skill gaps: {sop_gaps_count}")  # ADDED: Log SOP gaps
        
        # Color code for average competency
        avg_color = "\033[92m"  # Green
        if average_competency < 40:
            avg_color = "\033[91m"  # Red
        elif average_competency < 70:
            avg_color = "\033[93m"  # Yellow
            
        logger.info(f"Average competency: {avg_color}{average_competency}/100\033[0m")
        
        # Sort skill gaps by competency (lowest first) for each category
        dashboard["technical_skill_gaps"].sort(key=lambda x: x["competency"])
        dashboard["soft_skill_gaps"].sort(key=lambda x: x["competency"])
        dashboard["domain_knowledge_gaps"].sort(key=lambda x: x["competency"])
        dashboard["sop_skill_gaps"].sort(key=lambda x: x["competency"])  # ADDED: Sort SOP gaps
    
    return dashboard

def get_current_skill_score(skill_matrix: Dict[str, Any], skill_id: str) -> int:
    """
    Get the current competency score for a skill from the skill matrix.
    """
    for category_name, category_data in skill_matrix.items():
        category_skills = []
        if isinstance(category_data, dict) and 'skills' in category_data:
            category_skills = category_data.get('skills', [])
        elif isinstance(category_data, list):
            category_skills = category_data
            
        for skill in category_skills:
            if isinstance(skill, dict) and skill.get('id') == skill_id:
                return skill.get('competency_level', 0)
    
    return 0  # Default if skill not found


def calculate_updated_score(current_score: int, new_evidence_score: int) -> int:
    """
    Calculate an updated skill score based on current score and new evidence.
    Uses a weighted average that gives more weight to consistent evidence.
    """
    if current_score == 0:
        return new_evidence_score
    
    # Calculate the difference between scores
    score_diff = abs(current_score - new_evidence_score)
    
    if score_diff <= 5:
        # Scores are very close - use simple average
        return round((current_score + new_evidence_score) / 2)
    elif score_diff <= 15:
        # Moderate difference - weighted average favoring current score
        return round((current_score * 0.7) + (new_evidence_score * 0.3))
    else:
        # Large difference - investigate more carefully
        if new_evidence_score > current_score:
            # New evidence shows improvement - be more conservative
            return round((current_score * 0.8) + (new_evidence_score * 0.2))
        else:
            # New evidence shows decline - be more responsive
            return round((current_score * 0.6) + (new_evidence_score * 0.4))


def fix_skill_id_mismatch(skill_matrix: Dict[str, Any], questions: List[Dict]) -> Dict[str, Any]:
    """
    Fix skill ID mismatches between questions and skill matrix by creating a name-based mapping.
    This ensures skills can be found even if their IDs were generated differently.
    """
    logger.info("Fixing skill ID mismatches between questions and skill matrix...")
    
    # Extract all question skill IDs and their names
    question_skills = {}
    for question in questions:
        question_dict = parse_to_dict(question)
        assigned_skills = question_dict.get('assigned_skills', [])
        
        for skill in assigned_skills:
            skill_dict = parse_to_dict(skill)
            skill_id = skill_dict.get('id')
            skill_name = skill_dict.get('name')
            if skill_id and skill_name:
                question_skills[skill_id] = skill_name
    
    # Extract all matrix skill IDs and their names
    matrix_skills = {}
    skill_name_to_id = {}
    
    for category_name, category_data in skill_matrix.items():
        if category_name == 'sop_context':
            continue
            
        category_skills = []
        if isinstance(category_data, dict) and 'skills' in category_data:
            category_skills = category_data.get('skills', [])
        elif isinstance(category_data, list):
            category_skills = category_data
            
        for skill in category_skills:
            if isinstance(skill, dict):
                skill_id = skill.get('id')
                skill_name = skill.get('name')
                if skill_id and skill_name:
                    matrix_skills[skill_id] = skill_name
                    skill_name_to_id[skill_name.lower().strip()] = skill_id
    
    logger.info(f"Question skills: {question_skills}")
    logger.info(f"Matrix skills: {matrix_skills}")
    
    # Find mismatches and create mapping
    skill_id_mapping = {}
    
    for question_skill_id, question_skill_name in question_skills.items():
        if question_skill_id not in matrix_skills:
            # Try to find by name
            normalized_name = question_skill_name.lower().strip()
            if normalized_name in skill_name_to_id:
                matrix_skill_id = skill_name_to_id[normalized_name]
                skill_id_mapping[question_skill_id] = matrix_skill_id
                logger.info(f"MAPPED: '{question_skill_id}' ({question_skill_name}) -> '{matrix_skill_id}'")
            else:
                logger.warning(f"NO MATCH FOUND: '{question_skill_id}' ({question_skill_name})")
        else:
            # Direct match exists
            skill_id_mapping[question_skill_id] = question_skill_id
    
    return skill_id_mapping

def apply_skill_id_mapping_to_questions(questions: List[Dict], skill_id_mapping: Dict[str, str]) -> List[Dict]:
    """
    Apply skill ID mapping to questions to fix mismatches.
    """
    logger.info("Applying skill ID mapping to questions...")
    
    updated_questions = []
    for question in questions:
        question_dict = parse_to_dict(question).copy()
        
        # Update assigned_skills with correct IDs
        if 'assigned_skills' in question_dict:
            updated_assigned_skills = []
            for skill in question_dict['assigned_skills']:
                skill_dict = parse_to_dict(skill).copy()
                old_id = skill_dict.get('id')
                if old_id and old_id in skill_id_mapping:
                    new_id = skill_id_mapping[old_id]
                    skill_dict['id'] = new_id
                    logger.info(f"Updated skill ID in question: {old_id} -> {new_id}")
                updated_assigned_skills.append(skill_dict)
            question_dict['assigned_skills'] = updated_assigned_skills
        
        # Update skills field if it exists
        if 'skills' in question_dict:
            updated_skills = []
            for skill in question_dict['skills']:
                skill_dict = parse_to_dict(skill).copy()
                old_id = skill_dict.get('id')
                if old_id and old_id in skill_id_mapping:
                    new_id = skill_id_mapping[old_id]
                    skill_dict['id'] = new_id
                    logger.info(f"Updated skill ID in question skills: {old_id} -> {new_id}")
                updated_skills.append(skill_dict)
            question_dict['skills'] = updated_skills
        
        updated_questions.append(question_dict)
    
    return updated_questions

def analyze_qa_baseline(baseline_id: str) -> bool:
    """
    Analyze the question and answer pairs for a given baseline ID.
    
    This is the core analysis function that processes all Q&A pairs from an assessment
    to generate comprehensive competency scores. It uses individual question-by-question
    assessment with AI agents for maximum accuracy.
    
    Args:
        baseline_id (str): The ID of the baseline_skill_matrix record to analyze
        
    Returns:
        bool: True if analysis completed successfully, False otherwise
        
    Main Process Flow:
        1. Fetch baseline record and extract assessment/user info
        2. Retrieve assessment questions and user answers from database
        3. Load and transform skill matrix for processing
        4. Extract skill assignments and validate coverage
        5. Process each Q&A pair individually with AI evaluation
        6. Generate comprehensive gap analysis dashboard
        7. Update database with results and completion status
        
    AI Processing Features:
        - Individual Q&A assessment vs. bulk processing
        - Enhanced skill mapping and coverage validation
        - CrewAI agents for detailed competency scoring
        - Skill evidence mapping for targeted assessment
        - Root problem analysis for each skill gap
        
    Database Operations:
        - Fetches from: baseline_skill_matrix, question_answers, user_answers
        - Updates: skill_matrix, gap_analysis_dashboard, status
        - Logs: Assessment progress and error details
        
    Performance:
        - Expected duration: 30-60 seconds for typical assessments
        - Memory efficient with streaming Q&A processing
        - Comprehensive error handling and recovery
    """
    try:
        logger.info(f"===============================================")
        logger.info(f"ANALYZING QUESTION/ANSWERS FOR BASELINE: {baseline_id}")
        logger.info(f"===============================================")
        
        # Create Supabase client
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.error("Supabase URL or key not set")
            return False
            
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            logger.error(f"Error creating Supabase client: {str(e)}")
            return False
        
        # Get the baseline skill matrix
        try:
            baseline_result = supabase.table('baseline_skill_matrix').select('*').eq('id', baseline_id).single().execute()
            baseline_data = baseline_result.data
            
            if not baseline_data:
                logger.error(f"No baseline skill matrix found for ID: {baseline_id}")
                return False
        except Exception as e:
            logger.error(f"Error fetching baseline skill matrix: {str(e)}")
            return False
        
        # Get the SCT initial data with questions and answers
        try:
            sct_initial_id = baseline_data['sct_initial_id']
            logger.info(f"Fetching SCT initial data for ID: {sct_initial_id}")
            
            sct_result = supabase.table('sct_initial').select('*').eq('id', sct_initial_id).single().execute()
            sct_data = sct_result.data
            
            if not sct_data:
                logger.error(f"No SCT initial data found for ID: {sct_initial_id}")
                return False
        except Exception as e:
            logger.error(f"Error fetching SCT initial data: {str(e)}")
            return False
        
        # Debug log the structure of SCT data
        logger.info(f"SCT data keys: {list(sct_data.keys())}")
        
        # Extract and process questions properly, handling nested structures
        questions_data = sct_data.get('questions', {})
        answers = sct_data.get('answers', [])
        
        # If questions_data is a dictionary, check for nested structures
        if isinstance(questions_data, dict) and 'final_questions' in questions_data:
            logger.info("Found questions under 'final_questions' key")
            questions = questions_data.get('final_questions', [])
        elif isinstance(questions_data, dict) and 'questions' in questions_data:
            logger.info("Found questions under 'questions' key")
            questions = questions_data.get('questions', [])
        else:
            # If not in a nested structure, use as is
            questions = questions_data if isinstance(questions_data, list) else [questions_data]
            
        logger.info(f"Found {len(questions)} questions and {len(answers)} answers")
        
        if not questions or not answers:
            logger.error(f"No questions or answers found in SCT initial data: {sct_initial_id}")
            return False
        
        # Create a copy of the skill matrix for modification
        skill_matrix = baseline_data['skill_matrix']
        
        # Check if skills have already been assessed to prevent redundant processing
        already_assessed_skills = set()
        for category_name, category_data in skill_matrix.items():
            category_skills = []
            if isinstance(category_data, dict) and 'skills' in category_data:
                category_skills = category_data.get('skills', [])
            elif isinstance(category_data, list):
                category_skills = category_data
                
            for skill in category_skills:
                if isinstance(skill, dict) and 'id' in skill:
                    # Check if skill has assessment_details indicating it was already processed
                    if 'assessment_details' in skill and skill['assessment_details']:
                        already_assessed_skills.add(skill['id'])
                        logger.info(f"✅ Skill {skill['id']} ({skill.get('name', 'Unknown')}) already assessed")
        
        if already_assessed_skills:
            logger.info(f"Found {len(already_assessed_skills)} skills already assessed: {list(already_assessed_skills)}")
            logger.info("These skills will be skipped to prevent duplicate processing")
        
        # FIX SKILL ID MISMATCHES
        logger.info("=== FIXING SKILL ID MISMATCHES ===")
        skill_id_mapping = fix_skill_id_mismatch(skill_matrix, questions)
        questions = apply_skill_id_mapping_to_questions(questions, skill_id_mapping)
        logger.info("=== SKILL ID MISMATCHES FIXED ===")
        
        # Build a map of question IDs to original questions for reference
        question_id_map = {}
        for q in questions:
            if isinstance(q, dict) and 'id' in q:
                question_id_map[q['id']] = q
                
        logger.info(f"Created question ID map with {len(question_id_map)} entries")
        
        # VALIDATE COMPREHENSIVE COVERAGE
        logger.info("=== VALIDATING COMPREHENSIVE SKILL COVERAGE ===")
        coverage_validation = validate_comprehensive_coverage(skill_matrix, questions)
        logger.info(f"Coverage Quality: {coverage_validation['coverage_quality'].upper()}")
        logger.info(f"Coverage Percentage: {coverage_validation['coverage_percentage']:.1f}%")
        
        # Extract skill assignments for enhanced assessment
        skill_assignments = coverage_validation['skill_assignments']
        
        # Create skill evidence map
        skill_evidence_map = create_skill_evidence_map(questions, answers, skill_assignments)
        logger.info(f"Created evidence map for {len(skill_evidence_map)} skills")
        
        # Define enhanced data availability for this analysis
        has_enhanced_data = skill_assignments is not None and skill_evidence_map is not None
        explicitly_tested_skills = skill_assignments.get('explicitly_tested_skills', set()) if has_enhanced_data else set()
        
        # CHOOSE ASSESSMENT STRATEGY
        # Option 1: Individual Q&A processing (recommended for detailed assessment)
        # Option 2: Comprehensive assessment (faster but less detailed)
        
        # You can switch between strategies by changing this flag
        USE_INDIVIDUAL_QA_PROCESSING = True  # Set to False for comprehensive assessment
        
        if USE_INDIVIDUAL_QA_PROCESSING:
            logger.info("🚀 STARTING ENHANCED INDIVIDUAL Q&A PROCESSING...")
            logger.info(f"📊 Processing {len(answers)} Q&A pairs for detailed assessment")
            
            # CRITICAL: Log initial skill matrix state to detect changes
            initial_scores = {}
            for category_name, category_data in skill_matrix.items():
                if category_name in ['sop_context', 'domain_knowledge_context']:
                    continue
                category_skills = []
                if isinstance(category_data, dict) and 'skills' in category_data:
                    category_skills = category_data.get('skills', [])
                elif isinstance(category_data, list):
                    category_skills = category_data
                
                for skill in category_skills:
                    if isinstance(skill, dict) and 'id' in skill:
                        skill_id = skill['id']
                        competency = skill.get('competency', skill.get('competency_level', 0))
                        initial_scores[skill_id] = competency
                        logger.info(f"  📋 INITIAL: {skill.get('name', 'Unknown')} ({skill_id}): {competency}/100")
            
            logger.info(f"🎯 Tracking {len(initial_scores)} skills for change detection")
            
            # Process each Q&A pair individually with enhanced mapping
            individual_results = {}
            updates_made = 0
            processed_skills = set()  # Track processed skills to avoid duplicates
            processed_skills.update(already_assessed_skills)  # Start with already assessed skills
            assessment_failures = 0
            
            for i, answer in enumerate(answers):
                try:
                    logger.info(f"")
                    logger.info(f"🔍 PROCESSING Q&A PAIR {i+1}/{len(answers)} (ENHANCED INDIVIDUAL)")
                    logger.info(f"========================================================")
                    
                    # Get the corresponding question for this answer
                    question = None
                    answer_dict = parse_to_dict(answer)
                    question_id = answer_dict.get('questionId')
                    
                    if question_id and question_id in question_id_map:
                        question = question_id_map[question_id]
                        logger.info(f"Found question with ID {question_id}")
                    else:
                        # If we can't find by ID, try to use the question at the same index
                        if i < len(questions):
                            question = questions[i]
                            question_dict = parse_to_dict(question)
                            question_id = question_dict.get('id', f'question_{i+1}')
                            logger.info(f"Using question at index {i} with ID {question_id}")
                        else:
                            logger.warning(f"No question found for answer at index {i}")
                            continue
                    
                    # Skip if no valid question found
                    if not question:
                        logger.warning(f"Skipping answer at index {i} due to missing question")
                        continue
                    
                    # CRITICAL: Check if user actually answered
                    user_answer = answer_dict.get('answer', '')
                    if not user_answer or user_answer.strip() == "":
                        logger.warning(f"⚠️ Empty user answer for Q&A pair {i+1}, skipping assessment")
                        continue
                    
                    logger.info(f"📝 User answer preview: {user_answer[:150]}...")
                    
                    # Assess this individual Q&A pair with enhanced mapping
                    logger.info(f"🎯 Calling enhanced assessment for Q&A {i+1}...")
                    qa_results = assess_individual_qa_with_enhanced_mapping(
                        question, 
                        answer_dict, 
                        skill_matrix,
                        skill_assignments=skill_assignments,
                        skill_evidence_map=skill_evidence_map
                    )
                    
                    logger.info(f"📊 Assessment returned: {len(qa_results) if qa_results else 0} skill results")
                    
                    if qa_results:
                        # Process skills with smart re-evaluation logic
                        new_qa_results = {}
                        re_evaluated_skills = {}
                        
                        for skill_id, skill_data in qa_results.items():
                            if skill_id not in processed_skills:
                                # First time assessing this skill
                                new_qa_results[skill_id] = skill_data
                                processed_skills.add(skill_id)
                                logger.info(f"🆕 First assessment for {skill_id}")
                            else:
                                # Re-evaluate existing skill with new evidence
                                current_score = get_current_skill_score(skill_matrix, skill_id)
                                new_score = skill_data.get('score', 0)
                                
                                # Smart score adjustment based on new evidence
                                updated_score = calculate_updated_score(current_score, new_score)
                                
                                if updated_score != current_score:
                                    # Update the skill with new score
                                    updated_skill_data = skill_data.copy()
                                    updated_skill_data['score'] = updated_score
                                    updated_skill_data['re_evaluation'] = True
                                    updated_skill_data['previous_score'] = current_score
                                    re_evaluated_skills[skill_id] = updated_skill_data
                                    
                                    logger.info(f"🔄 Re-evaluated {skill_id}: {current_score} → {updated_score}/100 (Q&A {i+1})")
                                else:
                                    logger.info(f"✓ Confirmed {skill_id}: {current_score}/100 (consistent with Q&A {i+1})")
                        
                        # Apply both new assessments and re-evaluations
                        all_updates = {**new_qa_results, **re_evaluated_skills}
                        
                        if all_updates:
                            # Store results for this Q&A pair
                            individual_results.update(all_updates)
                            
                            # Apply results to skill matrix immediately
                            skill_matrix = apply_assessment_results_to_matrix(
                                skill_matrix, 
                                all_updates, 
                                explicitly_tested_skills
                            )
                            updates_made += len(all_updates)
                            
                            new_count = len(new_qa_results)
                            re_eval_count = len(re_evaluated_skills)
                            logger.info(f"✅ Processed Q&A pair {i+1}: {new_count} new + {re_eval_count} re-evaluated = {len(all_updates)} total")
                        else:
                            logger.info(f"ℹ️  Q&A pair {i+1}: No skill updates needed (all scores confirmed)")
                    else:
                        logger.error(f"❌ No assessment results for Q&A pair {i+1}")
                        assessment_failures += 1
                        
                except Exception as e:
                    logger.error(f"❌ ERROR processing Q&A pair {i+1}: {str(e)}")
                    logger.error(traceback.format_exc())
                    assessment_failures += 1
            
            # CRITICAL: Verify that scores actually changed
            logger.info(f"")
            logger.info(f"🏁 INDIVIDUAL PROCESSING COMPLETE")
            logger.info(f"=====================================")
            logger.info(f"✅ Total updates made: {updates_made}")
            logger.info(f"🎯 Skills processed: {len(processed_skills)}")
            logger.info(f"❌ Assessment failures: {assessment_failures}")
            
            # Check for actual changes in skill matrix
            final_scores = {}
            changes_detected = 0
            for category_name, category_data in skill_matrix.items():
                if category_name in ['sop_context', 'domain_knowledge_context']:
                    continue
                category_skills = []
                if isinstance(category_data, dict) and 'skills' in category_data:
                    category_skills = category_data.get('skills', [])
                elif isinstance(category_data, list):
                    category_skills = category_data
                
                for skill in category_skills:
                    if isinstance(skill, dict) and 'id' in skill:
                        skill_id = skill['id']
                        competency = skill.get('competency', skill.get('competency_level', 0))
                        final_scores[skill_id] = competency
                        
                        initial_score = initial_scores.get(skill_id, 0)
                        if competency != initial_score:
                            changes_detected += 1
                            logger.info(f"🔄 CHANGED: {skill.get('name', 'Unknown')} ({skill_id}): {initial_score} → {competency}/100")
                        else:
                            logger.info(f"⚠️ UNCHANGED: {skill.get('name', 'Unknown')} ({skill_id}): {competency}/100")
            
            logger.info(f"📊 Final verification: {changes_detected}/{len(final_scores)} skills changed")
            
            if changes_detected == 0:
                # Check if this is actually correct behavior (user answered "i dont know" to everything)
                if assessment_failures == 0 and updates_made > 0:
                    logger.info("✅ ASSESSMENT WORKED CORRECTLY: No score changes needed")
                    logger.info("All skills remain at baseline scores because user demonstrated no competency")
                    logger.info("This is the expected result for 'i dont know' answers")
                else:
                    logger.error("🚨 CRITICAL: NO SKILL SCORES CHANGED - ASSESSMENT DID NOT RUN PROPERLY!")
                    logger.error("This suggests the individual Q&A processing failed or results weren't applied")
                    if assessment_failures > 0:
                        logger.error(f"🚨 {assessment_failures} assessment failures detected - this may explain the issue")
                    return False
            
            # Set comprehensive_results for downstream processing
            comprehensive_results = individual_results
        if comprehensive_results:
                # Add metadata for individual processing
                comprehensive_results['_metadata'] = {
                    'comprehensive_skill_mapping': True,
                    'coverage_quality': coverage_validation.get('coverage_quality', 'unknown'),
                    'coverage_percentage': coverage_validation.get('coverage_percentage', 0),
                    'explicitly_tested_count': len(explicitly_tested_skills),
                    'total_skills_count': len(set(skill['id'] for category_data in skill_matrix.values() 
                                                 for skill in (category_data.get('skills', []) if isinstance(category_data, dict) 
                                                              else category_data if isinstance(category_data, list) else [])
                                                 if isinstance(skill, dict) and 'id' in skill)),
                    'enhanced_assessment': True,
                    'processing_method': 'individual_qa',
                    'skill_id_mapping_applied': True
                }
                logger.info(f"Completed individual Q&A processing: {updates_made} skill updates across {len(answers)} questions")
        else:
            # COMPREHENSIVE ASSESSMENT APPROACH (Original)
            logger.info("Using COMPREHENSIVE assessment with enhanced skill mappings...")
            
            # For now, use the individual processing results as comprehensive results
            # This is a fallback when individual processing is not enabled
            comprehensive_results = individual_results if individual_results else {}
        
        if comprehensive_results:
            logger.info(f"✅ Assessment completed successfully!")
            
            # Log enhanced assessment summary
            if has_enhanced_data and '_metadata' in comprehensive_results:
                metadata = comprehensive_results['_metadata']
                logger.info(f"=== ENHANCED ASSESSMENT SUMMARY ===")
                logger.info(f"Coverage Quality: {metadata.get('coverage_quality', 'unknown').upper()}")
                logger.info(f"Coverage Percentage: {metadata.get('coverage_percentage', 0):.1f}%")
                logger.info(f"Explicitly Tested: {metadata.get('explicitly_tested_count', 0)} skills")
                logger.info(f"Total Skills: {metadata.get('total_skills_count', 0)} skills")
                logger.info(f"Enhanced Mode: {metadata.get('enhanced_assessment', False)}")
                logger.info(f"===================================")
        else:
            logger.error("❌ No assessment results returned - assessment failed!")
            return False
        
        # Generate skill gap dashboard
        logger.info("🎯 Generating skill gap dashboard...")
        dashboard = generate_skill_gap_dashboard(skill_matrix, baseline_id)
        
        # Store the updated skill matrix and dashboard
        try:
            update_data = {
                'skill_matrix': skill_matrix,
                'gap_analysis_dashboard': dashboard,
                'analysis_completed_at': datetime.utcnow().isoformat()
            }
            
            logger.info(f"💾 Updating database with assessment results...")
            
            update_result = supabase.table('baseline_skill_matrix') \
                .update(update_data) \
                .eq('id', baseline_id) \
                .execute()
        
            if hasattr(update_result, 'error') and update_result.error:
                logger.error(f"❌ Database update failed: {update_result.error}")
                return False
        
            logger.info(f"✅ Successfully stored updated skill matrix and gap analysis")
            logger.info(f"📊 Dashboard includes {len(dashboard.get('technical_skill_gaps', []))} technical gaps")
            logger.info(f"📊 Dashboard includes {len(dashboard.get('soft_skill_gaps', []))} soft skill gaps") 
            logger.info(f"📊 Dashboard includes {len(dashboard.get('domain_knowledge_gaps', []))} domain knowledge gaps")
            logger.info(f"📊 Dashboard includes {len(dashboard.get('sop_skill_gaps', []))} SOP skill gaps")
            
        except Exception as e:
            logger.error(f"❌ Error storing analysis results: {str(e)}")
            logger.error(traceback.format_exc())
            return False
        
        logger.info("===============================================")
        logger.info("🎉 GAP ANALYSIS COMPLETED SUCCESSFULLY")
        logger.info("===============================================")
        return True
        
    except Exception as e:
        logger.error(f"Error in analyze_qa_baseline: {str(e)}")
        logger.error(traceback.format_exc())
        return False 

# ===============================================
# === ENHANCED AI EVALUATION ENGINE ===
# ===============================================

def assess_individual_qa_with_enhanced_mapping(
    question: Dict[str, Any], 
    answer: Dict[str, Any], 
    skill_matrix: Dict[str, Any],
    skill_assignments: Dict[str, Any] = None,
    skill_evidence_map: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Assess a single Q&A pair with enhanced skill mapping awareness.
    
    This function provides the most accurate skill assessment by using explicit skill assignments
    when available, leveraging evidence mapping for context, and using CrewAI agents for detailed
    competency evaluation. It represents the cutting-edge of individual Q&A assessment.
    
    Args:
        question (Dict[str, Any]): Single question dict with skill assignments
        answer (Dict[str, Any]): Single answer dict with user response
        skill_matrix (Dict[str, Any]): The skill matrix to update
        skill_assignments (Dict[str, Any], optional): Explicit skill assignment mapping
        skill_evidence_map (Dict[str, Any], optional): Evidence map for targeted assessment
        
    Returns:
        Dict[str, Any]: Assessment results with skill competency updates
        
    Assessment Modes:
        - ENHANCED: Uses explicit skill assignments + evidence mapping (highest accuracy)
        - STANDARD: Uses legacy skill extraction from questions (good accuracy)  
        - FALLBACK: Basic skill identification when assignments missing (basic accuracy)
        
    AI Processing:
        - CrewAI agent specialized for individual Q&A assessment
        - GPT-4.1-nano model for detailed competency scoring (0-100 scale)
        - Root problem analysis with specific evidence extraction
        - Question-specific evaluation considering intended skill testing
        - JSON result parsing with comprehensive validation
        
    Key Features:
        - Confidence level tracking based on available data quality
        - Skill validation and preparation before assessment
        - Detailed logging of assessment process and results
        - Graceful fallback when enhanced data unavailable
        - Comprehensive error handling with specific recovery strategies
    """
    try:
        logger.info("Starting ENHANCED individual Q&A assessment...")
        
        # Check if we have enhanced data
        has_enhanced_data = skill_assignments is not None and skill_evidence_map is not None
        question_dict = parse_to_dict(question)
        answer_dict = parse_to_dict(answer)
        
        question_id = question_dict.get('id', 'unknown_question')
        question_text = question_dict.get('question', '')
        user_answer = answer_dict.get('answer', '')
        
        if not question_text or not user_answer:
            logger.warning(f"Missing question text or user answer for question {question_id}")
            return {}
        
        # Get explicitly assigned skills for this specific question
        assigned_skills = []
        assessment_confidence = 'standard'
        
        if has_enhanced_data:
            question_to_skills = skill_assignments.get('question_to_skills', {})
            if question_id in question_to_skills:
                assigned_skills = question_to_skills[question_id]
                assessment_confidence = 'high'
                logger.info(f"✅ Enhanced mode: Question {question_id} explicitly tests {len(assigned_skills)} skills")
            else:
                logger.warning(f"Question {question_id} has no explicit skill assignments")
                # Fall back to legacy skill extraction
                assigned_skills = question_dict.get('skills', question_dict.get('expected_skills', []))
                assessment_confidence = 'fallback'
        else:
            # Legacy mode - extract skills from question
            assigned_skills = question_dict.get('skills', question_dict.get('expected_skills', []))
            logger.info(f"Standard mode: Processing question {question_id} with legacy skill extraction")
        
        if not assigned_skills:
            logger.warning(f"No skills found for question {question_id}")
            return {}
        
        # Validate and prepare skills for assessment
        valid_skills = []
        for skill in assigned_skills:
            skill_dict = parse_to_dict(skill)
            if 'id' in skill_dict and 'name' in skill_dict:
                valid_skills.append(skill_dict)
        
        if not valid_skills:
            logger.warning(f"No valid skills after processing for question {question_id}")
            return {}
        
        logger.info(f"Assessing {len(valid_skills)} skills for question {question_id}")
        for skill in valid_skills:
            logger.info(f"  - {skill.get('name', 'Unknown')} (ID: {skill.get('id')})")
        
        # Check if OpenAI API key is available
        if not OPENAI_API_KEY:
            logger.error("OpenAI API key not available for individual Q&A assessment")
            return {}
        
        # Create individual Q&A evaluator agent
        try:
            qa_evaluator_agent = Agent(
                role="Individual Q&A Skill Evaluator",
                goal="Provide precise competency evaluation for specific skills based on a single question-answer pair",
                backstory=f"""You are a focused assessment expert who evaluates specific skills based on individual Q&A pairs. 
                
                Assessment confidence level: {assessment_confidence.upper()}
                
                You excel at:
                - Analyzing specific responses to targeted questions
                - Identifying precise skill competency levels from focused evidence
                - Providing detailed, actionable feedback for individual skills
                - Understanding the relationship between questions and specific skills
                - Giving accurate scores based on direct evidence from the response
                
                You focus on the specific skills that this question was designed to test, providing accurate 
                and detailed assessment based on the user's actual response.""",
                verbose=True,
                allow_delegation=False,
                config={
                    "model": "gpt-4.1-nano-2025-04-14",
                    "temperature": 0.2
                }
            )
        except Exception as e:
            logger.warning(f"Failed to create individual Q&A evaluator: {e}")
            return {}
        
        # Create skills description for the agent
        skills_text = "\n".join([
            f"- {skill.get('name', 'Unknown')} (ID: {skill.get('id')}): {skill.get('description', 'No description available')}"
            for skill in valid_skills
        ])
        
        skill_ids = [skill.get('id') for skill in valid_skills]
        
        # Create individual Q&A evaluation task
        qa_task = Task(
            description=f"""
            INDIVIDUAL Q&A SKILL ASSESSMENT TASK:
            
            Evaluate the specific skills that this question was designed to test based on the user's answer.
            
            QUESTION:
            {question_text}
            
            USER'S ANSWER:
            {user_answer}
            
            SKILLS TO EVALUATE (designed for this specific question):
            {skills_text}
            
            ASSESSMENT CONFIDENCE: {assessment_confidence.upper()}
            
            EVALUATION INSTRUCTIONS:
            
            1. FOCUSED ASSESSMENT: This question was specifically designed to test these skills
               - Analyze how well the user's answer demonstrates competency in each skill
               - Look for specific evidence in the response that shows understanding or gaps
               - Consider the question's intent and what skills it was meant to evaluate
            
            2. COMPETENCY SCORING (0-100):
               - 0-10: No evidence of skill or explicit admission of no knowledge
               - 11-30: Minimal understanding, major gaps, incorrect application
               - 31-50: Basic competency with significant areas for improvement
               - 51-70: Good competency with some minor gaps or errors
               - 71-85: Advanced competency, strong understanding demonstrated
               - 86-100: Expert level competency with exceptional insight
            
            3. DETAILED ROOT PROBLEM ANALYSIS:
               
               For EACH skill, provide specific analysis:
               - What specific evidence from the answer supports the score
               - What knowledge gaps or errors were identified
               - What the user did well (for higher scores)
               - Specific recommendations for improvement
               - How this response relates to the skill requirements
            
            4. QUESTION-SPECIFIC EVALUATION:
               - Consider what this question was specifically testing
               - Evaluate based on the expected demonstration of skills
               - Note if the user went beyond expectations or fell short
               - Identify specific strengths or weaknesses shown
            
            RETURN FORMAT: JSON only, using EXACT skill IDs:
            {{
                "skill_id_1": {{
                    "score": 75,
                    "root_problem": "User demonstrated solid understanding of [specific concept] by [specific evidence from response]. Shows good grasp of [strength] but could improve [specific gap]. Recommendation: [specific learning suggestion]",
                    "assessment_type": "direct",
                    "evidence": "Specific quote or reference from user's answer that supports this assessment"
                }},
                "skill_id_2": {{
                    "score": 45,
                    "root_problem": "Limited understanding shown. User [specific issue identified]. Missing knowledge of [specific concepts]. Evidence: [specific part of answer]. Needs improvement in [specific areas]",
                    "assessment_type": "direct",
                    "evidence": "Specific evidence from the response"
                }}
            }}
            
            SKILL IDs TO USE: {skill_ids}
            
            Focus on this specific Q&A pair. Provide detailed, actionable feedback based on actual evidence from the response.
            """,
            expected_output=f"""JSON object with detailed assessment of skills: {skill_ids}""",
            agent=qa_evaluator_agent
        )
        
        # Execute individual Q&A assessment
        logger.info(f"Running individual Q&A assessment for question {question_id}...")
        
        crew = Crew(
            agents=[qa_evaluator_agent],
            tasks=[qa_task],
            verbose=True,
            process=Process.sequential
        )
        
        try:
            logger.info(f"⏱️ Starting CrewAI execution for question {question_id}...")
            result = crew.kickoff()
            logger.info(f"✅ CrewAI execution completed for question {question_id}")
        except Exception as crew_error:
            logger.error(f"❌ CrewAI execution failed for question {question_id}: {str(crew_error)}")
            logger.error(traceback.format_exc())
            return {}
        
        # Process the result
        try:
            if hasattr(result, 'raw'):
                result_str = result.raw
            else:
                result_str = str(result)
                
            logger.info(f"Raw assessment result (first 300 chars): {result_str[:300]}...")
            
            # Extract JSON from result
            import re
            json_match = re.search(r'\{.*\}', result_str, re.DOTALL)
            
            if json_match:
                assessment_data = json.loads(json_match.group(0))
                logger.info(f"Individual Q&A assessment completed for {len(assessment_data)} skills")
                
                # Add metadata about this assessment
                for skill_id, result_data in assessment_data.items():
                    if isinstance(result_data, dict):
                        result_data['question_id'] = question_id
                        result_data['assessment_confidence'] = assessment_confidence
                        result_data['individual_qa_assessment'] = True
                
                return assessment_data
            else:
                logger.error("No JSON found in individual Q&A assessment result")
                return {}
        
        except Exception as e:
            logger.error(f"Error processing individual Q&A assessment result: {e}")
            return {}
    
    except Exception as e:
        logger.error(f"Error in individual Q&A assessment: {e}")
        logger.error(traceback.format_exc())
        return {}

# ===============================================
# === SKILL MATRIX UPDATE ENGINE ===
# ===============================================

def apply_assessment_results_to_matrix(
    skill_matrix: Dict[str, Any], 
    assessment_results: Dict[str, Any], 
    explicitly_tested_skills: set
) -> Dict[str, Any]:
    """
    Apply assessment results to the skill matrix.
    
    This function takes the results from AI-powered individual Q&A assessment and applies
    them to the skill matrix, updating competency scores and adding detailed assessment
    metadata for each skill.
    
    Args:
        skill_matrix (Dict[str, Any]): The skill matrix to update
        assessment_results (Dict[str, Any]): Dict of skill_id -> assessment data
        explicitly_tested_skills (set): Set of skill IDs that were explicitly tested
        
    Returns:
        Dict[str, Any]: Updated skill matrix with new competency scores and details
        
    Update Process:
        1. Build comprehensive skill mapping across all matrix categories
        2. Iterate through assessment results for each skill
        3. Locate skill in matrix by ID and determine structure type
        4. Update competency score with bounds checking (0-100)
        5. Add comprehensive assessment details to skill record
        6. Log updates with skill type and confidence indicators
        
    Assessment Details Added:
        - root_problem: Detailed analysis of competency gaps/strengths
        - assessment_type: Type of assessment performed ('individual', 'direct', etc.)
        - evidence: Specific evidence from user responses
        - question_id: ID of question that generated this assessment
        - individual_qa_assessment: Flag indicating individual processing
        
    Features:
        - Handles both dict {"skills": [...]} and list [...] category structures
        - Comprehensive skill location across all matrix categories
        - Bounds checking for competency scores (0-100 range)
        - Enhanced logging with confidence and skill type indicators
        - Special handling for domain knowledge and SOP skills
        - Error handling for missing or invalid skills
    """
    updated_matrix = skill_matrix.copy()
    
    # Build skill mapping for efficient updates, including domain knowledge skills
    skill_map = {}
    for category_name, category_data in skill_matrix.items():
        # UPDATED: Only skip pure metadata contexts, not SOP skill categories
        if category_name in ['sop_context', 'domain_knowledge_context'] and isinstance(category_data, dict) and ('has_sop_data' in category_data or 'has_domain_knowledge' in category_data):
            continue  # Skip only if it's the metadata structure
            
        category_skills = []
        if isinstance(category_data, dict) and 'skills' in category_data:
            category_skills = category_data.get('skills', [])
        elif isinstance(category_data, list):
            category_skills = category_data
        
        for i, skill in enumerate(category_skills):
            if isinstance(skill, dict) and 'id' in skill:
                skill_map[skill['id']] = {
                    'category': category_name,
                    'index': i,
                    'structure': 'dict' if isinstance(category_data, dict) else 'list'
                }
    
    # Apply each assessment result
    for skill_id, result_data in assessment_results.items():
        if skill_id == '_metadata':  # Skip metadata
            continue
            
        if skill_id in skill_map:
            skill_info = skill_map[skill_id]
            category = skill_info['category']
            index = skill_info['index']
            structure = skill_info['structure']
            
            score = result_data.get('score', 0)
            root_problem = result_data.get('root_problem', '')
            assessment_type = result_data.get('assessment_type', 'individual')
            evidence = result_data.get('evidence', '')
            question_id = result_data.get('question_id', '')
            
            # Update the skill based on structure
            if structure == 'dict':
                current = updated_matrix[category]['skills'][index].get('competency', 
                        updated_matrix[category]['skills'][index].get('competency_level', 0))
                updated_matrix[category]['skills'][index]['competency'] = max(0, min(100, score))
                updated_matrix[category]['skills'][index]['competency_level'] = max(0, min(100, score))
                
                # Add assessment details
                if 'assessment_details' not in updated_matrix[category]['skills'][index]:
                    updated_matrix[category]['skills'][index]['assessment_details'] = {}
                
                updated_matrix[category]['skills'][index]['assessment_details'].update({
                    'root_problem': root_problem,
                    'assessment_type': assessment_type,
                    'evidence': evidence,
                    'question_id': question_id,
                    'individual_qa_assessment': True
                })
            else:  # list structure
                current = updated_matrix[category][index].get('competency',
                        updated_matrix[category][index].get('competency_level', 0))
                updated_matrix[category][index]['competency'] = max(0, min(100, score))
                updated_matrix[category][index]['competency_level'] = max(0, min(100, score))
                
                # Add assessment details
                if 'assessment_details' not in updated_matrix[category][index]:
                    updated_matrix[category][index]['assessment_details'] = {}
                
                updated_matrix[category][index]['assessment_details'].update({
                    'root_problem': root_problem,
                    'assessment_type': assessment_type,
                    'evidence': evidence,
                    'question_id': question_id,
                    'individual_qa_assessment': True
                })
            
            # Get skill name and type for logging
            skill_name = skill_matrix[category]['skills'][index].get('name', 'Unknown') if structure == 'dict' else skill_matrix[category][index].get('name', 'Unknown')
            confidence_indicator = "🎯" if skill_id in explicitly_tested_skills else "🔍"
            
            # Determine if this is a domain knowledge skill
            is_domain_knowledge = 'domain_knowledge' in category.lower() or 'domain_knowledge' in skill_id.lower()
            skill_type_indicator = "🏢" if is_domain_knowledge else ""  # Business building emoji for domain knowledge
            
            logger.info(f"✅ {confidence_indicator}{skill_type_indicator} Updated {skill_name} (ID: {skill_id}): {current} → {score}/100 [Q: {question_id}]{' [DOMAIN KNOWLEDGE]' if is_domain_knowledge else ''}")
            
        else:
            logger.warning(f"Could not find skill {skill_id} in skill matrix for update")
    
    return updated_matrix
