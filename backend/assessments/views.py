import os
import openai
import logging
import json
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
import PyPDF2
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from skill_matrix.generate_skill_matrix import process_new_assessment
from skill_matrix.gap_analysis import create_baseline_skill_matrix, start_gap_analysis
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .service import assessment_service
from .authentication import SupabaseAuthentication

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Initialize OpenAI client
try:
    if not OPENAI_API_KEY:
        logger.error("OpenAI API key not configured")
        openai_client = None
    else:
        openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {str(e)}")
    openai_client = None

# Initialize Supabase client
try:
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Missing Supabase configuration: URL or service key not set")
        supabase = None
    else:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    supabase = None

def create_resume_prompt(resume_text):
    """Create a prompt for structuring resume data"""
    return f"""
    Parse the following resume text into a structured JSON format. Extract and organize the information clearly.
    
    Return ONLY a valid JSON object with this exact structure:
    {{
        "personal_info": {{
            "name": "",
            "email": "",
            "phone": "",
            "location": "",
            "linkedin": "",
            "portfolio": ""
        }},
        "summary": "",
        "education": [
            {{
                "degree": "",
                "institution": "",
                "year": "",
                "gpa": "",
                "relevant_coursework": []
            }}
        ],
        "experience": [
            {{
                "title": "",
                "company": "",
                "duration": "",
                "location": "",
                "responsibilities": [],
                "achievements": []
            }}
        ],
        "skills": {{
            "technical": [],
            "languages": [],
            "frameworks": [],
            "tools": [],
            "certifications": []
        }},
        "projects": [
            {{
                "name": "",
                "description": "",
                "technologies": [],
                "link": ""
            }}
        ]
    }}
    
    Resume text:
    {resume_text}
    """

def create_jd_prompt(jd_text):
    """Create a prompt for structuring job description data"""
    return f"""
    Parse the following job description text into a structured JSON format. Extract and organize the information clearly.
    
    Return ONLY a valid JSON object with this exact structure:
    {{
        "job_info": {{
            "title": "",
            "company": "",
            "location": "",
            "employment_type": "",
            "experience_level": "",
            "salary_range": ""
        }},
        "description": "",
        "responsibilities": [],
        "requirements": {{
            "education": [],
            "experience": [],
            "technical_skills": [],
            "soft_skills": [],
            "certifications": []
        }},
        "preferred_qualifications": [],
        "benefits": [],
        "company_info": {{
            "about": "",
            "size": "",
            "industry": ""
        }}
    }}
    
    Job description text:
    {jd_text}
    """

def create_sop_prompt(sop_content):
    """Create a prompt for structuring SOP data"""
    return f"""
    Parse the following Standard Operating Procedures (SOP) text into a structured JSON format. Extract and organize the information clearly.
    
    Return ONLY a valid JSON object with this exact structure:
    {{
        "sop_info": {{
            "title": "",
            "department": "",
            "version": "",
            "effective_date": "",
            "review_date": "",
            "owner": ""
        }},
        "purpose": "",
        "scope": "",
        "procedures": [
            {{
                "step_number": "",
                "title": "",
                "description": "",
                "responsible_party": "",
                "tools_required": [],
                "expected_outcome": ""
            }}
        ],
        "quality_standards": [],
        "safety_requirements": [],
        "compliance_requirements": [],
        "training_requirements": [],
        "documentation_requirements": [],
        "key_performance_indicators": [],
        "escalation_procedures": []
    }}
    
    SOP content:
    {sop_content}
    """

def create_domain_knowledge_prompt(domain_knowledge_content):
    """Create a prompt for structuring domain knowledge data"""
    return f"""
    Parse the following domain-specific knowledge content into a structured JSON format. Extract and organize technical information, frameworks, methodologies, and domain concepts.
    
    Return ONLY a valid JSON object with this exact structure:
    {{
        "domain_info": {{
            "primary_domain": "",
            "sub_domains": [],
            "expertise_level": "",
            "years_of_experience": ""
        }},
        "technologies": [
            {{
                "category": "",
                "name": "",
                "version": "",
                "proficiency_level": "",
                "use_cases": [],
                "related_tools": []
            }}
        ],
        "frameworks_and_libraries": [
            {{
                "name": "",
                "category": "",
                "version": "",
                "key_features": [],
                "common_patterns": []
            }}
        ],
        "methodologies": [
            {{
                "name": "",
                "description": "",
                "practices": [],
                "benefits": [],
                "implementation_steps": []
            }}
        ],
        "concepts_and_principles": [
            {{
                "concept": "",
                "explanation": "",
                "related_skills": [],
                "practical_applications": []
            }}
        ],
        "best_practices": [
            {{
                "area": "",
                "practices": [],
                "rationale": "",
                "common_pitfalls": []
            }}
        ],
        "tools_and_platforms": [
            {{
                "category": "",
                "name": "",
                "purpose": "",
                "integration_points": [],
                "alternatives": []
            }}
        ],
        "industry_standards": [
            {{
                "standard": "",
                "description": "",
                "compliance_requirements": [],
                "impact": ""
            }}
        ],
        "key_knowledge_areas": [],
        "technical_specifications": [],
        "performance_considerations": [],
        "security_aspects": []
    }}
    
    Domain Knowledge content:
    {domain_knowledge_content}
    """

def extract_text_from_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
        logger.info(f"Successfully extracted text from PDF: {file_path}")
        return text
    except Exception as e:
        logger.error(f"Failed to extract text from PDF {file_path}: {str(e)}")
        raise

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_technical_assessment(request):
    """
    Handle file uploads for technical assessment
    """
    try:
        user_uuid = str(request.user.username)
        logger.info(f"Starting file upload for user: {user_uuid}")
        
        # Check if user has already submitted
        logger.info("Checking if user has already submitted...")
        try:
            result = supabase.table('tsa_assessment').select('id').eq('user_id', user_uuid).execute()
            if result.data and len(result.data) > 0:
                logger.info(f"User {user_uuid} has already submitted assessment")
                return Response({'error': 'You have already submitted your assessment'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error checking existing submission: {str(e)}")
            return Response({'error': 'Failed to check submission status'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get uploaded files
        resume_file = request.FILES.get('resume')
        jd_file = request.FILES.get('job_description')
        sop_file = request.FILES.get('sop')  # Optional SOP file
        sop_text = request.data.get('sop_text')  # Optional SOP text
        sop_type = request.data.get('sop_type')  # 'file' or 'text'
        
        # Get domain knowledge data (optional)
        domain_knowledge_file = request.FILES.get('domain_knowledge')  # Optional Domain Knowledge file
        domain_knowledge_text = request.data.get('domain_knowledge_text')  # Optional Domain Knowledge text
        domain_knowledge_type = request.data.get('domain_knowledge_type')  # 'file' or 'text'

        if not resume_file or not jd_file:
            return Response({'error': 'Both resume and job description files are required'}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Files received - Resume: {resume_file.name}, JD: {jd_file.name}")
        if sop_file:
            logger.info(f"SOP file received: {sop_file.name}")
        elif sop_text:
            logger.info(f"SOP text received: {len(sop_text)} characters")
        
        if domain_knowledge_file:
            logger.info(f"Domain Knowledge file received: {domain_knowledge_file.name}")
        elif domain_knowledge_text:
            logger.info(f"Domain Knowledge text received: {len(domain_knowledge_text)} characters")

        # Save files to temp directory
        temp_dir = os.path.join(settings.BASE_DIR, 'data', 'technical_assessments', 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        resume_path = os.path.join(temp_dir, f'{user_uuid}-resume.pdf')
        jd_path = os.path.join(temp_dir, f'{user_uuid}-jd.pdf')
        sop_path = None
        domain_knowledge_path = None
        
        with open(resume_path, 'wb+') as destination:
            for chunk in resume_file.chunks():
                destination.write(chunk)
        
        with open(jd_path, 'wb+') as destination:
            for chunk in jd_file.chunks():
                destination.write(chunk)
        
        # Handle SOP file if provided
        if sop_type == 'file' and sop_file:
            sop_path = os.path.join(temp_dir, f'{user_uuid}-sop.pdf')
            with open(sop_path, 'wb+') as destination:
                for chunk in sop_file.chunks():
                    destination.write(chunk)
        # Handle SOP text if provided
        elif sop_type == 'text' and sop_text:
            sop_path = os.path.join(temp_dir, f'{user_uuid}-sop.txt')
            with open(sop_path, 'w', encoding='utf-8') as destination:
                destination.write(sop_text)

        # Handle Domain Knowledge file if provided
        if domain_knowledge_type == 'file' and domain_knowledge_file:
            domain_knowledge_path = os.path.join(temp_dir, f'{user_uuid}-domain-knowledge.pdf')
            with open(domain_knowledge_path, 'wb+') as destination:
                for chunk in domain_knowledge_file.chunks():
                    destination.write(chunk)
        # Handle Domain Knowledge text if provided
        elif domain_knowledge_type == 'text' and domain_knowledge_text:
            domain_knowledge_path = os.path.join(temp_dir, f'{user_uuid}-domain-knowledge.txt')
            with open(domain_knowledge_path, 'w', encoding='utf-8') as destination:
                destination.write(domain_knowledge_text)

        logger.info(f"Files saved to temp directory")

        # Extract text from PDFs
        logger.info("Extracting text from PDFs...")
        resume_text = extract_text_from_pdf(resume_path)
        jd_text = extract_text_from_pdf(jd_path)
        
        # Extract SOP content if provided
        sop_content = None
        if sop_type == 'file' and sop_path:
                logger.info("Extracting text from SOP PDF...")
                sop_content = extract_text_from_pdf(sop_path)
        elif sop_type == 'text' and sop_text:
                logger.info("Using SOP text content...")
                sop_content = sop_text

        # Extract Domain Knowledge content if provided
        domain_knowledge_content = None
        if domain_knowledge_type == 'file' and domain_knowledge_path:
                logger.info("Extracting text from Domain Knowledge PDF...")
                domain_knowledge_content = extract_text_from_pdf(domain_knowledge_path)
        elif domain_knowledge_type == 'text' and domain_knowledge_text:
                logger.info("Using Domain Knowledge text content...")
                domain_knowledge_content = domain_knowledge_text

        logger.info(f"Text extraction completed")
        logger.info(f"Resume text length: {len(resume_text)}")
        logger.info(f"JD text length: {len(jd_text)}")
        if sop_content:
            logger.info(f"SOP content length: {len(sop_content)}")
        if domain_knowledge_content:
            logger.info(f"Domain Knowledge content length: {len(domain_knowledge_content)}")

        # Use OpenAI API to structure the data
        logger.info("Using OpenAI API to structure data...")
        
        if not openai_client:
            logger.error("OpenAI client not initialized")
            return Response({'error': 'AI processing service not available'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Create prompts for resume and job description
        resume_prompt = create_resume_prompt(resume_text)
        jd_prompt = create_jd_prompt(jd_text)
        
        # Create SOP prompt if content exists
        sop_prompt = None
        if sop_content:
            sop_prompt = create_sop_prompt(sop_content)

        # Create Domain Knowledge prompt if content exists
        domain_knowledge_prompt = None
        if domain_knowledge_content:
            domain_knowledge_prompt = create_domain_knowledge_prompt(domain_knowledge_content)

        try:
            # Process resume
            resume_response = openai_client.chat.completions.create(
                messages=[{"role": "user", "content": resume_prompt}],
                model="gpt-4.1-nano-2025-04-14",
                temperature=0.1,
                max_tokens=2000
            )
            resume_content = resume_response.choices[0].message.content
            
            # Process job description
            jd_response = openai_client.chat.completions.create(
                messages=[{"role": "user", "content": jd_prompt}],
                model="gpt-4.1-nano-2025-04-14",
                temperature=0.1,
                max_tokens=2000
            )
            jd_content = jd_response.choices[0].message.content
            
            # Process SOP if provided
            sop_structured = None
            if sop_prompt:
                sop_response = openai_client.chat.completions.create(
                    messages=[{"role": "user", "content": sop_prompt}],
                    model="gpt-4.1-nano-2025-04-14",
                    temperature=0.1,
                    max_tokens=2000
                )
                sop_structured = sop_response.choices[0].message.content

            # Process Domain Knowledge if provided
            domain_knowledge_structured = None
            if domain_knowledge_prompt:
                domain_knowledge_response = openai_client.chat.completions.create(
                    messages=[{"role": "user", "content": domain_knowledge_prompt}],
                    model="gpt-4.1-nano-2025-04-14",
                    temperature=0.1,
                    max_tokens=2000
                )
                domain_knowledge_structured = domain_knowledge_response.choices[0].message.content

        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return Response({'error': f'Failed to process documents with AI: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Clean up JSON responses
        try:
            def clean_json_string(json_str):
                # Remove markdown code blocks if present
                if '```json' in json_str:
                    json_str = json_str.split('```json')[1].split('```')[0]
                elif '```' in json_str:
                    json_str = json_str.split('```')[1]
                
                # Clean up any extra whitespace and newlines
                json_str = json_str.strip()
                
                return json_str
            
            # Clean and parse the JSON
            resume_content = clean_json_string(resume_content)
            jd_content = clean_json_string(jd_content)
            
            if sop_structured:
                sop_structured = clean_json_string(sop_structured)
            
            if domain_knowledge_structured:
                domain_knowledge_structured = clean_json_string(domain_knowledge_structured)
            
            logger.info(f"Cleaned resume content: {resume_content}")
            logger.info(f"Cleaned JD content: {jd_content}")
            if sop_structured:
                logger.info(f"Cleaned SOP content: {sop_structured}")
            if domain_knowledge_structured:
                logger.info(f"Cleaned Domain Knowledge content: {domain_knowledge_structured}")
            
            try:
                resume_json = json.loads(resume_content)
                jd_json = json.loads(jd_content)
                sop_json = json.loads(sop_structured) if sop_structured else None
                domain_knowledge_json = json.loads(domain_knowledge_structured) if domain_knowledge_structured else None
                logger.info("Successfully parsed JSON responses")
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {str(e)}")
                logger.error(f"Cleaned resume content: {resume_content}")
                logger.error(f"Cleaned JD content: {jd_content}")
                if sop_structured:
                    logger.error(f"Cleaned SOP content: {sop_structured}")
                if domain_knowledge_structured:
                    logger.error(f"Cleaned Domain Knowledge content: {domain_knowledge_structured}")
                raise
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from OpenAI response: {str(e)}")
            logger.error(f"Resume content: {resume_content}")
            logger.error(f"JD content: {jd_content}")
            if sop_structured:
                logger.error(f"SOP content: {sop_structured}")
            if domain_knowledge_structured:
                logger.error(f"Domain Knowledge content: {domain_knowledge_structured}")
            return Response({
                'error': 'Failed to parse JSON from OpenAI response',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        logger.info("Attempting to store in Supabase...")
        logger.info(f"Supabase URL: {SUPABASE_URL}")
        logger.info(f"Supabase key configured: {'Yes' if SUPABASE_KEY else 'No'}")

        # Store in Supabase
        data = {
            'user_id': user_uuid,
            'resume_data': resume_json,
            'job_description_data': jd_json,
            'created_at': datetime.now().isoformat()
        }
        
        # Add SOP data if available
        if sop_json:
            data['sop_data'] = sop_json
        
        # Add Domain Knowledge data if available
        if domain_knowledge_json:
            data['domain_knowledge'] = domain_knowledge_json
        
        logger.info("Inserting data into Supabase...")
        logger.info(f"Data to insert: {data}")
        
        try:
            if not supabase:
                raise Exception("Supabase client not initialized")
                
            # Use the service role key to bypass RLS
            result = supabase.table('tsa_assessment').insert(data).execute()
            logger.info(f"Supabase insert result: {result}")

            # After successful insert, trigger skill matrix generation
            try:
                process_new_assessment(result.data[0]['id'])
                logger.info(f"Triggered skill matrix generation for assessment {result.data[0]['id']}")
            except Exception as e:
                logger.error(f"Failed to generate skill matrix: {str(e)}")
                # Don't fail the request if skill matrix generation fails
                # Just log the error and continue

        except Exception as e:
            logger.error(f"Failed to insert data into Supabase: {str(e)}")
            return Response({'error': f'Failed to store data in Supabase: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response_data = {
            'message': 'Files processed and stored successfully',
            'resume_data': resume_json,
            'job_description_data': jd_json
        }
        
        if sop_json:
            response_data['sop_data'] = sop_json
        
        if domain_knowledge_json:
            response_data['domain_knowledge'] = domain_knowledge_json

        return Response(response_data)

    except Exception as e:
        logger.error(f"ERROR: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_connection(request):
    """Test endpoint to verify backend connectivity"""
    return Response({
        'status': 'success',
        'message': 'Backend is running',
        'timestamp': datetime.now().isoformat()
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def create_gap_analysis_public(request):
    """
    Creates a baseline skill matrix for gap analysis (public endpoint for Next.js API).
    """
    try:
        logger.info(f"Creating gap analysis via public endpoint")
        
        # Get the SCT initial ID from the request
        sct_initial_id = request.data.get('sct_initial_id')
        if not sct_initial_id:
            return Response({'error': 'SCT initial ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if a baseline skill matrix already exists for this SCT initial
        try:
            result = supabase.table('baseline_skill_matrix').select('id').eq('sct_initial_id', sct_initial_id).execute()
            if result.data and len(result.data) > 0:
                baseline_id = result.data[0]['id']
                logger.info(f"Baseline skill matrix already exists for SCT initial {sct_initial_id}: {baseline_id}")
                return Response({'id': baseline_id, 'message': 'Baseline skill matrix already exists'})
        except Exception as e:
            logger.error(f"Error checking existing baseline skill matrix: {str(e)}")
        
        # Create the baseline skill matrix
        baseline_id = create_baseline_skill_matrix(sct_initial_id)
        if not baseline_id:
            return Response(
                {'error': 'Failed to create baseline skill matrix'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Automatically start the gap analysis in a background thread
        logger.info(f"Automatically starting gap analysis for baseline: {baseline_id}")
        import threading
        thread = threading.Thread(target=start_gap_analysis, args=(baseline_id,))
        thread.start()
        
        return Response({
            'id': baseline_id,
            'message': 'Baseline skill matrix created and gap analysis started successfully'
        })
        
    except Exception as e:
        logger.error(f"Error creating gap analysis: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_gap_analysis(request):
    """
    Creates a baseline skill matrix for gap analysis.
    """
    try:
        user_uuid = str(request.user.username)
        logger.info(f"Creating gap analysis for user: {user_uuid}")
        
        # Get the SCT initial ID from the request
        sct_initial_id = request.data.get('sct_initial_id')
        if not sct_initial_id:
            return Response({'error': 'SCT initial ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if a baseline skill matrix already exists for this SCT initial
        try:
            result = supabase.table('baseline_skill_matrix').select('id').eq('sct_initial_id', sct_initial_id).execute()
            if result.data and len(result.data) > 0:
                baseline_id = result.data[0]['id']
                logger.info(f"Baseline skill matrix already exists for SCT initial {sct_initial_id}: {baseline_id}")
                return Response({'id': baseline_id, 'message': 'Baseline skill matrix already exists'})
        except Exception as e:
            logger.error(f"Error checking existing baseline skill matrix: {str(e)}")
        
        # Create the baseline skill matrix
        baseline_id = create_baseline_skill_matrix(sct_initial_id)
        if not baseline_id:
            return Response(
                {'error': 'Failed to create baseline skill matrix'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Automatically start the gap analysis in a background thread
        logger.info(f"Automatically starting gap analysis for baseline: {baseline_id}")
        import threading
        thread = threading.Thread(target=start_gap_analysis, args=(baseline_id,))
        thread.start()
        
        return Response({
            'id': baseline_id,
            'message': 'Baseline skill matrix created and gap analysis started successfully'
        })
        
    except Exception as e:
        logger.error(f"Error creating gap analysis: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_gap_analysis_api(request):
    """
    Starts the gap analysis process for a baseline skill matrix.
    """
    try:
        user_uuid = str(request.user.username)
        logger.info(f"Starting gap analysis for user: {user_uuid}")
        
        # Get the baseline skill matrix ID from the request
        baseline_id = request.data.get('baseline_id')
        if not baseline_id:
            return Response({'error': 'Baseline skill matrix ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify that the baseline belongs to this user
        try:
            result = supabase.table('baseline_skill_matrix').select('user_id').eq('id', baseline_id).execute()
            if not result.data or len(result.data) == 0:
                return Response({'error': 'Baseline skill matrix not found'}, status=status.HTTP_404_NOT_FOUND)
            
            if result.data[0]['user_id'] != user_uuid:
                return Response({'error': 'Unauthorized access to baseline skill matrix'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Error verifying baseline ownership: {str(e)}")
            return Response({'error': 'Failed to verify baseline ownership'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Start the gap analysis in a background thread to avoid blocking the API
        import threading
        thread = threading.Thread(target=start_gap_analysis, args=(baseline_id,))
        thread.start()
        
        return Response({
            'message': 'Gap analysis started successfully',
            'baseline_id': baseline_id
        })
        
    except Exception as e:
        logger.error(f"Error starting gap analysis: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_gap_analysis_status(request, baseline_id):
    """
    Gets the status of a gap analysis.
    """
    try:
        user_uuid = str(request.user.username)
        logger.info(f"Getting gap analysis status for user: {user_uuid}, baseline: {baseline_id}")
        
        # Verify that the baseline belongs to this user
        try:
            result = supabase.table('baseline_skill_matrix').select('*').eq('id', baseline_id).execute()
            if not result.data or len(result.data) == 0:
                return Response({'error': 'Baseline skill matrix not found'}, status=status.HTTP_404_NOT_FOUND)
            
            baseline_data = result.data[0]
            if baseline_data['user_id'] != user_uuid:
                return Response({'error': 'Unauthorized access to baseline skill matrix'}, status=status.HTTP_403_FORBIDDEN)
            
            # Return the status information
            return Response({
                'id': baseline_id,
                'status': baseline_data['status'],
                'created_at': baseline_data['created_at'],
                'analysis_started_at': baseline_data.get('analysis_started_at'),
                'analysis_completed_at': baseline_data.get('analysis_completed_at')
            })
            
        except Exception as e:
            logger.error(f"Error getting baseline status: {str(e)}")
            return Response({'error': 'Failed to get baseline status'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Error getting gap analysis status: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_baseline_skill_matrix(request, baseline_id):
    """
    Gets the baseline skill matrix.
    """
    try:
        user_uuid = str(request.user.username)
        logger.info(f"Getting baseline skill matrix for user: {user_uuid}, baseline: {baseline_id}")
        
        # Verify that the baseline belongs to this user
        try:
            result = supabase.table('baseline_skill_matrix').select('*').eq('id', baseline_id).execute()
            if not result.data or len(result.data) == 0:
                return Response({'error': 'Baseline skill matrix not found'}, status=status.HTTP_404_NOT_FOUND)
            
            baseline_data = result.data[0]
            if baseline_data['user_id'] != user_uuid:
                return Response({'error': 'Unauthorized access to baseline skill matrix'}, status=status.HTTP_403_FORBIDDEN)
            
            # Get the ideal skill matrix for comparison
            ideal_id = baseline_data['ideal_skill_matrix_id']
            ideal_result = supabase.table('ideal_skill_matrix').select('*').eq('id', ideal_id).execute()
            ideal_data = ideal_result.data[0] if ideal_result.data else None
            
            # Extract the gap analysis dashboard if it exists
            gap_analysis_dashboard = None
            
            # First try from the dedicated column (might not exist in schema)
            try:
                gap_analysis_dashboard = baseline_data.get('gap_analysis_dashboard')
            except Exception:
                # If accessing the column fails, it likely doesn't exist
                pass
                
            # If not found in dedicated column, check session_data
            if not gap_analysis_dashboard and 'session_data' in baseline_data:
                try:
                    session_data = baseline_data['session_data']
                    if isinstance(session_data, dict) and 'gap_analysis_dashboard' in session_data:
                        gap_analysis_dashboard = session_data['gap_analysis_dashboard']
                except Exception as e:
                    logger.error(f"Error extracting dashboard from session_data: {str(e)}")
            
            # If no dashboard exists but analysis is complete, generate one on-the-fly
            if not gap_analysis_dashboard and baseline_data['status'] == 'completed' and baseline_data.get('skill_matrix'):
                try:
                    from skill_matrix.gap_analysis import generate_skill_gap_dashboard
                    gap_analysis_dashboard = generate_skill_gap_dashboard(baseline_data['skill_matrix'], baseline_id)
                    
                    # Save the generated dashboard for future use
                    try:
                        # Try to save to the dedicated column first
                        update_result = supabase.table('baseline_skill_matrix').update({
                            'gap_analysis_dashboard': gap_analysis_dashboard
                        }).eq('id', baseline_id).execute()
                        
                        if hasattr(update_result, 'error') and update_result.error:
                            # If that fails, try to save to session_data
                            logger.warning(f"Column gap_analysis_dashboard likely doesn't exist: {update_result.error}")
                            try:
                                session_update = {
                                    'session_data': {
                                        'gap_analysis_dashboard': gap_analysis_dashboard
                                    }
                                }
                                supabase.table('baseline_skill_matrix').update(session_update).eq('id', baseline_id).execute()
                                logger.info("Stored dashboard in session_data as fallback")
                            except Exception as session_error:
                                logger.error(f"Error saving to session_data: {session_error}")
                    except Exception as update_error:
                        logger.error(f"Error updating gap analysis dashboard: {update_error}")
                except Exception as dashboard_error:
                    logger.error(f"Error generating gap analysis dashboard: {str(dashboard_error)}")
            
            # Return complete skill analysis data
            response_data = {
                'id': baseline_id,
                'status': baseline_data['status'],
                'baseline_skill_matrix': baseline_data['skill_matrix'],
                'ideal_skill_matrix': ideal_data['skill_matrix'] if ideal_data else None,
                'created_at': baseline_data['created_at'],
                'analysis_started_at': baseline_data.get('analysis_started_at'),
                'analysis_completed_at': baseline_data.get('analysis_completed_at'),
                'gap_analysis_dashboard': gap_analysis_dashboard
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error getting baseline skill matrix: {str(e)}")
            return Response({'error': 'Failed to get baseline skill matrix'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Error getting baseline skill matrix: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
def process_assessment(request):
    """
    Process an assessment and generate interpretation results.
    """
    try:
        # Get assessment_id from request body
        assessment_id = request.data.get('assessment_id')
        
        if not assessment_id:
            return Response(
                {'error': 'Assessment ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Start the interpretation process asynchronously
        # In a real production environment, this would be a background task
        # processed by Celery or a similar task queue
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                assessment_service.process_assessment(assessment_id)
            )
        finally:
            loop.close()
        
        if 'error' in result:
            return Response(
                {'error': result['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error processing assessment: {str(e)}")
        return Response(
            {'error': f'Failed to process assessment: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
def trigger_interpretation(request):
    """
    Trigger the interpretation of an assessment.
    """
    try:
        # Get user_id from the authenticated request
        user_id = request.user.id
        
        if not user_id:
            return Response(
                {'error': 'User ID not found in request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the latest assessment for this user
        if not supabase:
            return Response(
                {'error': 'Supabase client is not initialized'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        assessment_response = supabase.table('lsa_assessment') \
            .select('id') \
            .eq('user_id', user_id) \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()
        
        if not assessment_response.data:
            return Response(
                {'error': 'No assessment found for this user'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        assessment_id = assessment_response.data[0]['id']
        
        # Start the interpretation process asynchronously
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                assessment_service.process_assessment(assessment_id)
            )
        finally:
            loop.close()
        
        if 'error' in result:
            return Response(
                {'error': result['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'Assessment interpretation triggered successfully',
            'assessment_id': assessment_id,
            'status': result.get('data', {}).get('status', 'pending')
        })
        
    except Exception as e:
        logger.error(f"Error triggering interpretation: {str(e)}")
        return Response(
            {'error': f'Failed to trigger interpretation: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
@authentication_classes([SupabaseAuthentication])
def get_interpretation_results(request):
    """
    Get interpretation results for a user.
    """
    try:
        # Get user_id from the authenticated request
        user_id = request.user.id
        
        if not user_id:
            return Response(
                {'error': 'User ID not found in request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the latest assessment result for this user
        if not supabase:
            return Response(
                {'error': 'Supabase client is not initialized'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        result_response = supabase.table('lsa_result') \
            .select('*') \
            .eq('user_id', user_id) \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()
        
        if not result_response.data:
            return Response(
                {'error': 'No interpretation results found for this user'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'results': result_response.data[0]
        })
        
    except Exception as e:
        logger.error(f"Error getting interpretation results: {str(e)}")
        return Response(
            {'error': f'Failed to get interpretation results: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def process_pending_interpretations(request):
    """
    Manually process all pending interpretation results.
    """
    try:
        # Start the interpretation process asynchronously
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            count = loop.run_until_complete(
                assessment_service.process_pending_results()
            )
        finally:
            loop.close()
        
        return Response({
            'message': f'Successfully processed {count} pending interpretation results',
            'count': count
        })
        
    except Exception as e:
        logger.error(f"Error processing pending interpretations: {str(e)}")
        return Response(
            {'error': f'Failed to process pending interpretations: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 