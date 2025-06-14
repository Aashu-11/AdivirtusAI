import os
import openai
import logging
import json
import math
import re
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from crewai import Crew, Process
from .crew_agents import QuestionGenerationAgents
from .crew_tasks import QuestionGenerationTasks

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    raise Exception(f"Failed to initialize Supabase client: {str(e)}")

# Context management functions
def count_tokens(text: str) -> int:
    """Estimate token count for a given text"""
    # Rough estimation: 1 token ≈ 4 characters
    return len(str(text)) // 4

def truncate_context(context: str, max_tokens: int = 2000) -> str:
    """Truncate context to fit within token limits"""
    if count_tokens(context) <= max_tokens:
        return context
    
    # Truncate to approximately max_tokens * 4 characters
    max_chars = max_tokens * 4
    truncated = context[:max_chars]
    
    # Try to end at a complete sentence
    last_period = truncated.rfind('.')
    if last_period > max_chars * 0.8:  # If we found a period in the last 20%
        truncated = truncated[:last_period + 1]
    
    return truncated + "... [TRUNCATED]"

def optimize_skill_context(skills: list, max_skills: int = 5) -> list:
    """Limit the number of skills to reduce context size"""
    if len(skills) <= max_skills:
        return skills
    
    # Take the first max_skills most important ones
    return skills[:max_skills]

def simplify_skill_data(skill: dict) -> dict:
    """Simplify skill data structure to reduce context size"""
    return {
        'id': skill.get('id'),
        'name': skill.get('name'),
        'category': skill.get('category', 'technical'),
        'importance': skill.get('importance', 'medium')
    }

def manage_previous_questions_context(previous_questions: list, max_questions: int = 3) -> list:
    """Limit previous questions context to reduce size"""
    if len(previous_questions) <= max_questions:
        return previous_questions
    
    # Take the most recent questions
    recent_questions = previous_questions[-max_questions:]
    
    # Simplify each question to just essential info
    simplified = []
    for q in recent_questions:
        simplified.append({
            'question': q.get('question', '')[:200],  # Truncate question text
            'type': q.get('type'),
            'skills': [skill.get('name') for skill in q.get('assigned_skills', [])][:3]  # Max 3 skill names
        })
    
    return simplified

def clean_json_string(json_str: str) -> str:
    """
    Clean a JSON string by removing markdown formatting and ensuring valid JSON structure.
    Special care is taken to preserve code fields exactly as provided.
    """
    try:
        # If it's already a dict, just return it as JSON string
        if isinstance(json_str, dict):
            return json.dumps(json_str)
            
        # Convert CrewOutput to string if needed
        json_str = str(json_str)
        
        # Log the input for debugging
        logger.info(f"Cleaning JSON string: {json_str[:200]}...")
            
        # Remove markdown code blocks if present
        if '```json' in json_str:
            json_str = json_str.split('```json')[1].split('```')[0]
        elif '```' in json_str:
            json_str = json_str.split('```')[1]
        
        # Try to find JSON content even if it's embedded in text
        # Look for patterns like "Here is the JSON:" followed by actual JSON
        import re
        
        # Find the first occurrence of { and last occurrence of }
        start_idx = json_str.find('{')
        if start_idx == -1:
            # Try to find if the agent mentioned JSON but didn't provide it
            if any(keyword in json_str.lower() for keyword in ['json', 'questions', 'complete', 'assessment']):
                logger.warning("Agent mentioned JSON but didn't provide actual JSON content")
                # Try to extract any structured content
                if 'questions' in json_str.lower():
                    logger.info("Attempting to create fallback JSON structure")
                    # Create a minimal valid structure for debugging
                    return json.dumps({
                        "questions": [],
                        "error": "Agent did not provide JSON content",
                        "raw_response": json_str[:500]
                    })
            raise ValueError("No JSON object found in string")
        
        # Find the matching closing brace
        brace_count = 0
        end_idx = -1
        for i in range(start_idx, len(json_str)):
            if json_str[i] == '{':
                brace_count += 1
            elif json_str[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break
        
        if end_idx == -1:
            raise ValueError("No matching closing brace found in JSON string")
            
        json_str = json_str[start_idx:end_idx + 1]
        
        # Try to parse as-is first
        try:
            parsed = json.loads(json_str)
            # Validate that code fields are preserved
            logger.info("JSON parsed successfully, validating code field preservation...")
            return json.dumps(parsed)
        except json.JSONDecodeError:
            logger.info("Initial JSON parse failed, attempting to fix common issues...")
        
        # More careful handling of code fields - preserve them exactly
        # Don't modify anything that looks like code content
        def preserve_code_content(text):
            """Preserve code fields by temporarily replacing them with placeholders"""
            code_fields = {}
            placeholder_counter = 0
            
            # Find and preserve code fields - more comprehensive patterns
            code_patterns = [
                r'"code"\s*:\s*"([^"]*(?:\\.[^"]*)*)"',
                r'"code_template"\s*:\s*"([^"]*(?:\\.[^"]*)*)"',
                r'"buggy_code"\s*:\s*"([^"]*(?:\\.[^"]*)*)"',
                r'"expected_code"\s*:\s*"([^"]*(?:\\.[^"]*)*)"',
                r'"solution"\s*:\s*"([^"]*(?:\\.[^"]*)*)"'
            ]
            
            for pattern in code_patterns:
                matches = re.finditer(pattern, text, re.DOTALL)
                for match in matches:
                    placeholder = f"__CODE_PLACEHOLDER_{placeholder_counter}__"
                    code_fields[placeholder] = match.group(0)
                    text = text.replace(match.group(0), f'"placeholder": "{placeholder}"')
                    placeholder_counter += 1
            
            return text, code_fields
        
        # Preserve code fields before cleaning
        json_str, code_fields = preserve_code_content(json_str)
        
        # Fix common JSON issues with quotes (but avoid code fields)
        def fix_quotes_and_arrays(text):
            """Fix problematic quote patterns and array syntax"""
            # Fix single quotes around arrays/objects
            text = re.sub(r"'(\[[^\]]*\])'", r'"\1"', text)
            text = re.sub(r"'(\{[^\}]*\})'", r'"\1"', text)
            
            # Fix unescaped quotes in strings (but not in placeholders)
            def fix_unescaped_quotes(match):
                key = match.group(1)
                value = match.group(2)
                if "__CODE_PLACEHOLDER_" in value:
                    return match.group(0)
                # Escape internal quotes
                escaped_value = value.replace('"', '\\"')
                return f'{key}: "{escaped_value}"'
            
            # Pattern for "key": 'value with "quotes"'
            text = re.sub(r'("[^"]*")\s*:\s*\'([^\']*)\'' , fix_unescaped_quotes, text)
            
            return text
        
        # Apply the fixes
        json_str = fix_quotes_and_arrays(json_str)
        
        # Remove trailing commas
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # Ensure proper line endings
        json_str = json_str.replace('\r\n', '\n')
        
        # Remove any extra whitespace
        json_str = json_str.strip()
        
        # Restore code fields
        for placeholder, original_code in code_fields.items():
            json_str = json_str.replace(f'"placeholder": "{placeholder}"', original_code)
        
        # Try to parse again
        try:
            parsed = json.loads(json_str)
            logger.info("JSON successfully cleaned and parsed with code preservation")
            return json.dumps(parsed)
        except json.JSONDecodeError as e:
            logger.error(f"JSON still invalid after cleaning: {e}")
            logger.error(f"Cleaned JSON: {json_str[:500]}...")
            
            # Last resort: try to manually fix specific patterns
            try:
                # More aggressive fix for nested structures
                json_str = re.sub(r'(["\'])(.*?)(["\'])\s*:\s*(["\'])(.*?)(["\'])', 
                                 lambda m: f'"{m.group(2)}": "{m.group(5).replace(chr(34), chr(92)+chr(34))}"', 
                                 json_str)
                
                parsed = json.loads(json_str)
                logger.info("JSON successfully parsed after aggressive fix")
                return json.dumps(parsed)
            except:
                # Final fallback - return a valid error structure
                logger.error("All JSON cleaning attempts failed, returning error structure")
                return json.dumps({
                    "error": "Failed to parse JSON",
                    "raw_content": json_str[:200],
                    "type": "parsing_error"
                })
        
    except Exception as e:
        logger.error(f"Error cleaning JSON string: {str(e)}")
        logger.error(f"Input string: {json_str[:500]}...")
        # Return a valid error structure instead of raising
        return json.dumps({
            "error": f"JSON cleaning failed: {str(e)}",
            "raw_content": str(json_str)[:200] if json_str else "No content",
            "type": "cleaning_error"
        })

def validate_skills_against_taxonomy(skills_list: list, category: str) -> list:
    """
    Validate skills against the skills taxonomy and log any inconsistencies.
    This helps ensure that skills from ideal_skill_matrix align with the canonical taxonomy.
    
    Args:
        skills_list: List of skills to validate
        category: Category of skills (technical, soft, domain, sop)
    
    Returns:
        List of validated skills with any necessary corrections
    """
    try:
        from services.skills_embedding_service import SkillsEmbeddingService
        skills_service = SkillsEmbeddingService()
        
        validated_skills = []
        inconsistencies = []
        
        for skill in skills_list:
            skill_name = skill.get('name', '')
            skill_description = skill.get('description', '')
            
            # Check if skill exists in taxonomy
            canonical_skill = skills_service.get_skill_by_name(skill_name, category)
            
            if canonical_skill:
                # Skill exists in taxonomy - use canonical version
                validated_skills.append({
                    **skill,
                    'canonical_name': canonical_skill['canonical_name'],
                    'taxonomy_id': canonical_skill['id'],
                    'is_canonical': skill_name == canonical_skill['canonical_name']
                })
                
                if skill_name != canonical_skill['canonical_name']:
                    inconsistencies.append({
                        'original': skill_name,
                        'canonical': canonical_skill['canonical_name'],
                        'category': category
                    })
            else:
                # Skill not in taxonomy - might need to be added
                similar_skills, should_add = skills_service.find_similar_skills_for_new_skill(
                    skill_name, skill_description, category
                )
                
                if similar_skills:
                    logger.warning(f"Skill '{skill_name}' not in taxonomy but similar to: {similar_skills[0]['canonical_name']}")
                    inconsistencies.append({
                        'original': skill_name,
                        'suggested': similar_skills[0]['canonical_name'],
                        'similarity': similar_skills[0].get('similarity', 0),
                        'category': category,
                        'action': 'consider_merge'
                    })
                else:
                    logger.info(f"Skill '{skill_name}' is unique - should be added to taxonomy")
                    inconsistencies.append({
                        'original': skill_name,
                        'category': category,
                        'action': 'add_to_taxonomy'
                    })
                
                # Use original skill for now
                validated_skills.append(skill)
        
        if inconsistencies:
            logger.warning(f"Found {len(inconsistencies)} taxonomy inconsistencies in {category} skills:")
            for inc in inconsistencies[:5]:  # Show first 5
                logger.warning(f"  {inc}")
        
        return validated_skills
        
    except Exception as e:
        logger.warning(f"Could not validate {category} skills against taxonomy: {str(e)}")
        return skills_list  # Return original skills if validation fails

def analyze_and_club_skills(skill_matrix: dict) -> dict:
    """
    Analyze skill matrix and create skill clubs for efficient question generation.
    Extract detailed skill information including descriptions, competency levels, and SOP context.
    Returns skill clubs and remaining individual skills with full context.
    """
    try:
        logger.info("Analyzing skill matrix for context-aware question generation...")
        
        # Extract SOP context if available
        sop_context = skill_matrix.get('sop_context', {'has_sop_data': False})
        has_sop_data = sop_context.get('has_sop_data', False)
        
        if has_sop_data:
            logger.info("SOP context found in skill matrix - integrating procedural context")
            sop_summary = sop_context.get('sop_summary', {})
            logger.info(f"SOP Summary: {sop_summary}")
        else:
            logger.info("No SOP context found - using standard skill analysis")
        
        # Extract Domain Knowledge context if available
        domain_knowledge_context = skill_matrix.get('domain_knowledge_context', {'has_domain_knowledge': False})
        has_domain_knowledge = domain_knowledge_context.get('has_domain_knowledge', False)
        
        if has_domain_knowledge:
            logger.info("Domain Knowledge context found in skill matrix - integrating domain-specific expertise")
            domain_summary = domain_knowledge_context.get('domain_summary', {})
            logger.info(f"Domain Knowledge Summary: {domain_summary}")
        else:
            logger.info("No Domain Knowledge context found - using standard skill analysis")
        
        technical_skills = []
        soft_skills = []
        domain_knowledge_skills = []
        sop_skills = []  # ADDED: SOP skills category
        
        # Extract all skills with full details and categorize them
        for category_name, category_data in skill_matrix.items():
            # Skip metadata contexts
            if category_name in ['sop_context', 'domain_knowledge_context']:
                continue
                
            category_name_lower = category_name.lower().replace(' ', '_').replace('-', '_')
            
            # Determine skill category type
            is_soft_skill = any(soft_cat in category_name_lower for soft_cat in 
                               ['soft_skills', 'communication', 'leadership', 'teamwork', 'management'])
            is_domain_knowledge = 'domain_knowledge' in category_name_lower
            is_sop_skill = any(sop_cat in category_name_lower for sop_cat in 
                              ['standard_operating_procedures', 'standard_operating', 'sop', 'procedure', 'protocol', 'compliance'])  # ADDED: SOP detection
            
            # Get skills from category
            skills_in_category = []
            if isinstance(category_data, dict) and 'skills' in category_data:
                skills_in_category = category_data.get('skills', [])
            elif isinstance(category_data, list):
                skills_in_category = category_data
            
            # Add skills to appropriate category with full metadata
            for skill in skills_in_category:
                if isinstance(skill, dict):
                    skill_description = skill.get('description', '')
                    
                    skill_info = {
                        'id': skill.get('id', f"skill_{len(technical_skills + soft_skills + domain_knowledge_skills) + 1}"),
                        'name': skill.get('name', 'Unknown'),
                        'description': skill_description,
                        'competency_level': skill.get('competency_level', skill.get('competency', 50)),
                        'category': category_name,
                        'associated_metrics': skill.get('associated_metrics', []),
                        'knowledge_areas': skill.get('knowledge_areas', []) if is_domain_knowledge else [],
                        'business_impact': skill.get('business_impact', '') if is_domain_knowledge else '',
                        'procedural_requirements': skill.get('procedural_requirements', []) if is_sop_skill else [],  # ADDED: SOP-specific data
                        'compliance_requirements': skill.get('compliance_requirements', []) if is_sop_skill else [],  # ADDED: SOP-specific data
                        'quality_standards': skill.get('quality_standards', []) if is_sop_skill else [],  # ADDED: SOP-specific data
                        'full_context': {
                            'technologies': extract_technologies_from_description(skill_description),
                            'frameworks': extract_frameworks_from_description(skill_description),
                            'languages': extract_languages_from_description(skill_description),
                            'focus_areas': extract_focus_areas_from_description(skill_description),
                            'has_sop_procedures': has_sop_data and check_skill_in_sop_procedures(skill.get('name', ''), skill_description),
                            'has_domain_knowledge': has_domain_knowledge and check_skill_in_domain_knowledge(skill.get('name', ''), skill_description),
                            'domain_concepts': extract_domain_concepts_from_description(skill_description) if has_domain_knowledge else []
                        },
                        'sop_context': {
                            'has_sop_data': has_sop_data,
                            'procedural_requirements': extract_procedural_requirements_from_description(skill_description) if has_sop_data else [],
                            'compliance_mentions': extract_compliance_mentions_from_description(skill_description) if has_sop_data else [],
                            'quality_standards': extract_quality_standards_from_description(skill_description) if has_sop_data else []
                        },
                        'domain_knowledge_context': {
                            'has_domain_knowledge': has_domain_knowledge,
                            'industry_concepts': extract_industry_concepts_from_description(skill_description) if has_domain_knowledge else [],
                            'regulatory_requirements': extract_regulatory_requirements_from_description(skill_description) if has_domain_knowledge else [],
                            'business_terminology': extract_business_terminology_from_description(skill_description) if has_domain_knowledge else []
                        }
                    }
                    
                    if is_sop_skill:
                        sop_skills.append(skill_info)  # ADDED: SOP skills categorization
                    elif is_soft_skill:
                        soft_skills.append(skill_info)
                    elif is_domain_knowledge:
                        domain_knowledge_skills.append(skill_info)
                    else:
                        technical_skills.append(skill_info)
        
        logger.info(f"Found {len(technical_skills)} technical skills, {len(soft_skills)} soft skills, {len(domain_knowledge_skills)} domain knowledge areas, and {len(sop_skills)} SOP skills")  # ADDED: SOP skills count
        
        # Validate skills against taxonomy for consistency (if available)
        logger.info("Validating skills against taxonomy for consistency...")
        try:
            technical_skills = validate_skills_against_taxonomy(technical_skills, 'technical')
            soft_skills = validate_skills_against_taxonomy(soft_skills, 'soft')
            domain_knowledge_skills = validate_skills_against_taxonomy(domain_knowledge_skills, 'domain_knowledge')
            sop_skills = validate_skills_against_taxonomy(sop_skills, 'sop')
            logger.info("✅ Skills taxonomy validation completed")
        except Exception as e:
            logger.warning(f"⚠️ Skills taxonomy validation failed: {str(e)}")
            logger.warning("Proceeding with original skills without taxonomy validation")
        
        # Log skill details for context awareness including SOP context
        logger.info("=== TECHNICAL SKILLS CONTEXT ===")
        for skill in technical_skills:
            logger.info(f"  {skill['name']} (Level: {skill['competency_level']})")
            logger.info(f"    Description: {skill['description'][:100]}...")
            logger.info(f"    Technologies: {skill['full_context']['technologies']}")
            logger.info(f"    Frameworks: {skill['full_context']['frameworks']}")
            logger.info(f"    Languages: {skill['full_context']['languages']}")
            if has_sop_data:
                logger.info(f"    SOP Procedures: {skill['full_context']['has_sop_procedures']}")
                if skill['sop_context']['procedural_requirements']:
                    logger.info(f"    Procedural Requirements: {skill['sop_context']['procedural_requirements']}")
            if has_domain_knowledge:
                logger.info(f"    Domain Knowledge: {skill['full_context']['has_domain_knowledge']}")
                if skill['domain_knowledge_context']['industry_concepts']:
                    logger.info(f"    Industry Concepts: {skill['domain_knowledge_context']['industry_concepts']}")
        
        # Create context-aware skill clubs for technical skills with SOP awareness
        skill_clubs = []
        
        # Enhanced skill patterns based on actual technologies and SOP procedures
        skill_patterns = [
            # Frontend frameworks and libraries
            {
                'name': 'frontend_framework',
                'keywords': ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'ui', 'interface'],
                'description': 'Frontend framework development with user interface procedures',
                'sop_keywords': ['interface', 'user experience', 'frontend', 'display', 'interaction']
            },
            {
                'name': 'styling_responsive',
                'keywords': ['css', 'scss', 'sass', 'tailwind', 'styled', 'responsive', 'ui', 'ux'],
                'description': 'Styling and responsive design with design standards',
                'sop_keywords': ['design', 'layout', 'responsive', 'mobile', 'accessibility']
            },
            {
                'name': 'javascript_typescript',
                'keywords': ['javascript', 'typescript', 'es6', 'async', 'promises'],
                'description': 'Modern JavaScript/TypeScript development with coding standards',
                'sop_keywords': ['coding', 'programming', 'development', 'scripting']
            },
            
            # Backend technologies
            {
                'name': 'backend_api',
                'keywords': ['python', 'django', 'flask', 'fastapi', 'node', 'express', 'api', 'rest'],
                'description': 'Backend API development with service procedures',
                'sop_keywords': ['api', 'service', 'backend', 'server', 'integration']
            },
            {
                'name': 'database_storage',
                'keywords': ['sql', 'postgresql', 'mysql', 'mongodb', 'database', 'query'],
                'description': 'Database and storage systems with data handling procedures',
                'sop_keywords': ['database', 'data', 'storage', 'backup', 'query']
            },
            
            # DevOps and tools
            {
                'name': 'devops_deployment',
                'keywords': ['docker', 'kubernetes', 'aws', 'deployment', 'ci/cd', 'git'],
                'description': 'DevOps and deployment with operational procedures',
                'sop_keywords': ['deployment', 'operations', 'infrastructure', 'monitoring', 'maintenance']
            },
            
            # Data and analytics
            {
                'name': 'data_analysis',
                'keywords': ['pandas', 'numpy', 'data', 'analysis', 'visualization', 'machine learning'],
                'description': 'Data analysis and processing with analytical procedures',
                'sop_keywords': ['analysis', 'data processing', 'reporting', 'metrics', 'analytics']
            },
            
            # Quality and compliance (SOP-specific)
            {
                'name': 'quality_compliance',
                'keywords': ['quality', 'compliance', 'standard', 'procedure', 'documentation'],
                'description': 'Quality assurance and compliance procedures',
                'sop_keywords': ['quality', 'compliance', 'standard', 'procedure', 'audit', 'documentation']
            },
            
            # Domain-specific knowledge areas
            {
                'name': 'financial_domain',
                'keywords': ['financial', 'fintech', 'banking', 'payment', 'trading', 'risk', 'compliance'],
                'description': 'Financial technology and banking domain expertise',
                'domain_keywords': ['fintech', 'banking', 'payment', 'trading', 'risk management', 'financial regulations']
            },
            {
                'name': 'healthcare_biotech',
                'keywords': ['healthcare', 'biotech', 'medical', 'pharmaceutical', 'clinical', 'patient'],
                'description': 'Healthcare and biotechnology domain expertise',
                'domain_keywords': ['healthcare', 'biotech', 'medical', 'pharmaceutical', 'clinical', 'patient care']
            },
            {
                'name': 'regulatory_compliance',
                'keywords': ['regulatory', 'compliance', 'legal', 'gdpr', 'hipaa', 'sox', 'audit'],
                'description': 'Regulatory compliance and legal domain knowledge',
                'domain_keywords': ['regulatory', 'compliance', 'legal', 'gdpr', 'hipaa', 'sox', 'audit']
            }
        ]
        
        # Try to form clubs based on enhanced patterns with SOP awareness
        used_skills = set()
        
        for pattern in skill_patterns:
            pattern_skills = []
            for skill in technical_skills:
                if skill['id'] in used_skills:
                    continue
                    
                skill_text = f"{skill['name']} {skill['description']}".lower()
                skill_context = skill['full_context']
                
                # Enhanced matching using skill context and SOP awareness
                matches = 0
                for keyword in pattern['keywords']:
                    if (keyword in skill_text or 
                        keyword in ' '.join(skill_context['technologies']).lower() or
                        keyword in ' '.join(skill_context['frameworks']).lower() or
                        keyword in ' '.join(skill_context['languages']).lower()):
                        matches += 1
                
                # Additional matching for SOP-related keywords if SOP data is available
                if has_sop_data and 'sop_keywords' in pattern:
                    for sop_keyword in pattern['sop_keywords']:
                        if (sop_keyword in skill_text or
                            any(sop_keyword in req.lower() for req in skill['sop_context']['procedural_requirements']) or
                            any(sop_keyword in comp.lower() for comp in skill['sop_context']['compliance_mentions'])):
                            matches += 0.5  # SOP matches get half weight
                
                # Additional matching for domain knowledge keywords if domain knowledge is available
                if has_domain_knowledge and 'domain_keywords' in pattern:
                    for domain_keyword in pattern['domain_keywords']:
                        if (domain_keyword in skill_text or
                            any(domain_keyword in concept.lower() for concept in skill['domain_knowledge_context']['industry_concepts']) or
                            any(domain_keyword in req.lower() for req in skill['domain_knowledge_context']['regulatory_requirements'])):
                            matches += 0.7  # Domain knowledge matches get higher weight
                        
                if matches > 0:
                    pattern_skills.append(skill)
                    
            # If we have 2-4 skills that match this pattern, create a club
            if 2 <= len(pattern_skills) <= 4:
                club_skills = pattern_skills[:4]  # Limit to 4 skills per club
                
                # Collect SOP context for the club
                club_sop_context = {
                    'has_sop_procedures': any(skill['full_context']['has_sop_procedures'] for skill in club_skills),
                    'procedural_requirements': list(set([req for skill in club_skills 
                                                       for req in skill['sop_context']['procedural_requirements']])),
                    'compliance_mentions': list(set([comp for skill in club_skills 
                                                   for comp in skill['sop_context']['compliance_mentions']])),
                    'quality_standards': list(set([qual for skill in club_skills 
                                                 for qual in skill['sop_context']['quality_standards']]))
                }
                
                # Collect Domain Knowledge context for the club
                club_domain_context = {
                    'has_domain_knowledge': any(skill['full_context']['has_domain_knowledge'] for skill in club_skills),
                    'industry_concepts': list(set([concept for skill in club_skills 
                                                 for concept in skill['domain_knowledge_context']['industry_concepts']])),
                    'regulatory_requirements': list(set([req for skill in club_skills 
                                                       for req in skill['domain_knowledge_context']['regulatory_requirements']])),
                    'business_terminology': list(set([term for skill in club_skills 
                                                    for term in skill['domain_knowledge_context']['business_terminology']]))
                }
                
                skill_clubs.append({
                    'type': 'club',
                    'skills': club_skills,
                    'theme': pattern['name'],
                    'description': pattern['description'],
                    'skill_count': len(club_skills),
                    'primary_technologies': list(set([tech for skill in club_skills 
                                                    for tech in skill['full_context']['technologies']]))[:5],
                    'primary_frameworks': list(set([fw for skill in club_skills 
                                                  for fw in skill['full_context']['frameworks']]))[:3],
                    'primary_languages': list(set([lang for skill in club_skills 
                                                 for lang in skill['full_context']['languages']]))[:3],
                    'sop_context': club_sop_context,
                    'domain_knowledge_context': club_domain_context
                })
                
                # Mark these skills as used
                for skill in club_skills:
                    used_skills.add(skill['id'])
                
                logger.info(f"Created context-aware club '{pattern['name']}': {[s['name'] for s in club_skills]}")
                logger.info(f"  Technologies: {skill_clubs[-1]['primary_technologies']}")
                logger.info(f"  Frameworks: {skill_clubs[-1]['primary_frameworks']}")
                logger.info(f"  Languages: {skill_clubs[-1]['primary_languages']}")
                if has_sop_data and club_sop_context['has_sop_procedures']:
                    logger.info(f"  SOP Procedures: {club_sop_context['procedural_requirements'][:3]}")
                if has_domain_knowledge and club_domain_context['has_domain_knowledge']:
                    logger.info(f"  Domain Knowledge: {club_domain_context['industry_concepts'][:3]}")
        
        # Add remaining technical skills as individual skills with full context
        remaining_technical = [skill for skill in technical_skills if skill['id'] not in used_skills]
        
        for skill in remaining_technical:
            skill_clubs.append({
                'type': 'individual',
                'skills': [skill],
                'theme': skill['name'].lower().replace(' ', '_'),
                'description': skill['description'],
                'skill_count': 1,
                'primary_technologies': skill['full_context']['technologies'],
                'primary_frameworks': skill['full_context']['frameworks'],
                'primary_languages': skill['full_context']['languages'],
                'sop_context': skill['sop_context'],
                'domain_knowledge_context': skill['domain_knowledge_context']
            })
        
        return {
            'technical_skills': technical_skills,  # Add this for comprehensive coverage
            'technical_skill_clubs': skill_clubs,
            'soft_skills': soft_skills,
            'domain_knowledge_skills': domain_knowledge_skills,
            'sop_skills': sop_skills,  # ADDED: Include SOP skills in return
            'total_technical_skills': len(technical_skills),
            'total_soft_skills': len(soft_skills),
            'total_domain_knowledge': len(domain_knowledge_skills),
            'total_sop_skills': len(sop_skills),  # ADDED: SOP skills count
            'skill_context_summary': {
                'all_technologies': list(set([tech for skill in technical_skills 
                                            for tech in skill['full_context']['technologies']])),
                'all_frameworks': list(set([fw for skill in technical_skills 
                                          for fw in skill['full_context']['frameworks']])),
                'all_languages': list(set([lang for skill in technical_skills 
                                         for lang in skill['full_context']['languages']])),
                'average_competency': sum(skill['competency_level'] for skill in technical_skills) / len(technical_skills) if technical_skills else 0,
                'sop_context': sop_context,
                'domain_knowledge_context': domain_knowledge_context
            }
        }
        
    except Exception as e:
        logger.error(f"Error analyzing skills for context-aware clubbing: {str(e)}")
        return {
            'technical_skills': [],  # Add this for comprehensive coverage
            'technical_skill_clubs': [],
            'soft_skills': [],
            'domain_knowledge_skills': [],
            'sop_skills': [],  # ADDED: Include SOP skills in error case
            'total_technical_skills': 0,
            'total_soft_skills': 0,
            'total_domain_knowledge': 0,
            'total_sop_skills': 0,  # ADDED: SOP skills count in error case
            'skill_context_summary': {
                'all_technologies': [],
                'all_frameworks': [],
                'all_languages': [],
                'average_competency': 0,
                'sop_context': {'has_sop_data': False},
                'domain_knowledge_context': {'has_domain_knowledge': False}
            }
        }

def extract_technologies_from_description(description: str) -> list:
    """Extract specific technologies mentioned in skill descriptions."""
    tech_keywords = [
        'vue.js', 'vue', 'react', 'angular', 'svelte', 'next.js', 'nuxt',
        'javascript', 'typescript', 'python', 'java', 'c#', 'go', 'rust',
        'html', 'css', 'scss', 'sass', 'tailwind', 'bootstrap',
        'node.js', 'express', 'fastapi', 'django', 'flask', 'spring',
        'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'docker', 'kubernetes', 'aws', 'azure', 'gcp',
        'git', 'jenkins', 'github', 'gitlab'
    ]
    
    found_techs = []
    description_lower = description.lower()
    
    for tech in tech_keywords:
        if tech.lower() in description_lower:
            found_techs.append(tech)
    
    return found_techs

def extract_frameworks_from_description(description: str) -> list:
    """Extract frameworks mentioned in skill descriptions."""
    framework_keywords = [
        'vue.js', 'react', 'angular', 'svelte', 'next.js', 'nuxt',
        'django', 'flask', 'fastapi', 'express', 'spring boot',
        'tailwind', 'bootstrap', 'material-ui', 'ant design'
    ]
    
    found_frameworks = []
    description_lower = description.lower()
    
    for fw in framework_keywords:
        if fw.lower() in description_lower:
            found_frameworks.append(fw)
    
    return found_frameworks

def extract_languages_from_description(description: str) -> list:
    """Extract programming languages mentioned in skill descriptions."""
    language_keywords = [
        'javascript', 'typescript', 'python', 'java', 'c#', 'go', 'rust',
        'php', 'ruby', 'swift', 'kotlin', 'dart', 'html', 'css', 'sql'
    ]
    
    found_languages = []
    description_lower = description.lower()
    
    for lang in language_keywords:
        if lang.lower() in description_lower:
            found_languages.append(lang)
    
    return found_languages

def extract_focus_areas_from_description(description: str) -> list:
    """Extract focus areas from skill description"""
    if not description:
        return []
    
    focus_patterns = [
        # Performance and optimization
        r'\b(performance|optimization|speed|efficiency|scalability)\b',
        # Security
        r'\b(security|authentication|authorization|encryption|protection)\b',
        # Testing and quality
        r'\b(testing|quality|debugging|validation|verification)\b',
        # Design and UX
        r'\b(design|ux|ui|user.?experience|interface|usability)\b',
        # Architecture and patterns
        r'\b(architecture|pattern|design.?pattern|mvc|mvvm|microservice)\b',
        # Data and analytics
        r'\b(data|analytics|reporting|visualization|metrics)\b',
        # Mobile and responsive
        r'\b(mobile|responsive|adaptive|cross.?platform)\b',
        # Accessibility
        r'\b(accessibility|a11y|wcag|inclusive)\b'
    ]
    
    focus_areas = []
    for pattern in focus_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        focus_areas.extend([match.lower() for match in matches])
    
    return list(set(focus_areas))

def check_skill_in_sop_procedures(skill_name: str, skill_description: str) -> bool:
    """Check if a skill is mentioned in SOP procedures based on keywords"""
    if not skill_name or not skill_description:
        return False
    
    # Keywords that indicate SOP procedural involvement
    sop_indicators = [
        'procedure', 'protocol', 'standard', 'guideline', 'policy',
        'compliance', 'requirement', 'documentation', 'process',
        'workflow', 'step', 'instruction', 'method', 'practice',
        'audit', 'quality', 'control', 'review', 'validation'
    ]
    
    text_to_check = f"{skill_name} {skill_description}".lower()
    return any(indicator in text_to_check for indicator in sop_indicators)

def extract_procedural_requirements_from_description(description: str) -> list:
    """Extract procedural requirements mentioned in skill descriptions"""
    if not description:
        return []
    
    procedural_patterns = [
        # Direct procedure mentions
        r'\b(follow\s+(?:procedure|protocol|guideline|standard)s?|adhere\s+to\s+(?:procedure|protocol)s?)\b',
        r'\b(implement\s+(?:procedure|protocol|standard|guideline)s?)\b',
        r'\b(according\s+to\s+(?:procedure|protocol|standard|sop)s?)\b',
        # Compliance requirements
        r'\b(compliance\s+with|comply\s+with|meet\s+(?:standard|requirement)s?)\b',
        r'\b(regulatory\s+(?:requirement|compliance|standard)s?)\b',
        # Documentation requirements
        r'\b(document(?:ation)?\s+(?:procedure|process|step)s?)\b',
        r'\b(maintain\s+(?:record|documentation|log)s?)\b',
        # Quality requirements
        r'\b(quality\s+(?:standard|control|assurance|check)s?)\b',
        r'\b(ensure\s+(?:quality|standard|compliance))\b'
    ]
    
    requirements = []
    for pattern in procedural_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        requirements.extend(matches)
    
    return list(set([req.strip() for req in requirements if req.strip()]))

def extract_compliance_mentions_from_description(description: str) -> list:
    """Extract compliance-related mentions from skill descriptions"""
    if not description:
        return []
    
    compliance_patterns = [
        # Standards and regulations
        r'\b(ISO\s+\d+|GDPR|HIPAA|SOX|PCI.?DSS|NIST)\b',
        r'\b(regulatory\s+(?:compliance|requirement|standard)s?)\b',
        r'\b(industry\s+(?:standard|regulation|compliance)s?)\b',
        # Audit and governance
        r'\b(audit\s+(?:trail|log|compliance|requirement)s?)\b',
        r'\b(governance\s+(?:framework|policy|procedure)s?)\b',
        # Risk and security compliance
        r'\b(security\s+(?:compliance|policy|standard)s?)\b',
        r'\b(risk\s+(?:management|assessment|compliance))\b',
        # Data compliance
        r'\b(data\s+(?:protection|privacy|compliance|governance))\b'
    ]
    
    mentions = []
    for pattern in compliance_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        mentions.extend(matches)
    
    return list(set([mention.strip() for mention in mentions if mention.strip()]))

def extract_quality_standards_from_description(description: str) -> list:
    """Extract quality standards mentioned in skill descriptions"""
    if not description:
        return []
    
    quality_patterns = [
        # Quality frameworks
        r'\b(quality\s+(?:assurance|control|management|standard)s?)\b',
        r'\b(QA|QC|TQM|Six\s+Sigma|Lean)\b',
        # Testing standards
        r'\b(testing\s+(?:standard|protocol|procedure)s?)\b',
        r'\b(test\s+(?:plan|case|procedure|protocol)s?)\b',
        # Performance standards
        r'\b(performance\s+(?:standard|metric|benchmark|target)s?)\b',
        r'\b(SLA|KPI|OLA)\b',
        # Code quality
        r'\b(code\s+(?:quality|standard|review|style)s?)\b',
        r'\b(coding\s+(?:standard|guideline|convention)s?)\b',
        # Best practices
        r'\b(best\s+practice|industry\s+practice|standard\s+practice)s?\b'
    ]
    
    standards = []
    for pattern in quality_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        standards.extend(matches)
    
    return list(set([standard.strip() for standard in standards if standard.strip()]))

def check_skill_in_domain_knowledge(skill_name: str, skill_description: str) -> bool:
    """Check if a skill is related to domain knowledge based on keywords"""
    if not skill_name or not skill_description:
        return False
    
    # Keywords that indicate domain knowledge involvement
    domain_indicators = [
        'industry', 'domain', 'business', 'regulatory', 'compliance',
        'sector', 'market', 'industry-specific', 'domain-specific',
        'business context', 'industry standards', 'regulatory requirements',
        'sector knowledge', 'domain expertise', 'industry practices'
    ]
    
    text_to_check = f"{skill_name} {skill_description}".lower()
    return any(indicator in text_to_check for indicator in domain_indicators)

def extract_domain_concepts_from_description(description: str) -> list:
    """Extract domain concepts mentioned in skill descriptions"""
    if not description:
        return []
    
    concept_patterns = [
        # Financial domain concepts
        r'\b(fintech|banking|payment|trading|risk\s+management|financial\s+regulations?)\b',
        r'\b(cryptocurrency|blockchain|digital\s+payments?|mobile\s+banking)\b',
        r'\b(credit\s+scoring|fraud\s+detection|anti[-\s]money\s+laundering|aml)\b',
        
        # Healthcare/Biotech concepts
        r'\b(healthcare|biotech|medical|pharmaceutical|clinical|patient\s+care)\b',
        r'\b(electronic\s+health\s+records?|ehr|hipaa|medical\s+devices?)\b',
        r'\b(drug\s+discovery|clinical\s+trials?|bioinformatics)\b',
        
        # Technology domain concepts
        r'\b(cloud\s+computing|devops|microservices|containerization)\b',
        r'\b(artificial\s+intelligence|machine\s+learning|data\s+science)\b',
        r'\b(cybersecurity|information\s+security|data\s+privacy)\b',
        
        # General business concepts
        r'\b(supply\s+chain|logistics|e[-\s]commerce|customer\s+experience)\b',
        r'\b(business\s+intelligence|analytics|reporting|dashboards?)\b'
    ]
    
    concepts = []
    for pattern in concept_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        concepts.extend([match.lower() for match in matches])
    
    return list(set(concepts))

def extract_industry_concepts_from_description(description: str) -> list:
    """Extract industry-specific concepts mentioned in skill descriptions"""
    if not description:
        return []
    
    industry_patterns = [
        # Industry verticals
        r'\b(fintech|banking|finance|healthcare|biotech|pharmaceutical)\b',
        r'\b(e[-\s]commerce|retail|manufacturing|logistics|supply\s+chain)\b',
        r'\b(education|edtech|media|entertainment|gaming)\b',
        r'\b(energy|utilities|transportation|automotive|aerospace)\b',
        
        # Business domains
        r'\b(customer\s+relationship\s+management|crm|enterprise\s+resource\s+planning|erp)\b',
        r'\b(human\s+resources?|hr|talent\s+management|recruiting)\b',
        r'\b(marketing\s+automation|digital\s+marketing|social\s+media)\b',
        
        # Technical domains
        r'\b(internet\s+of\s+things|iot|artificial\s+intelligence|ai|machine\s+learning|ml)\b',
        r'\b(blockchain|cryptocurrency|digital\s+assets?|web3)\b',
        r'\b(augmented\s+reality|ar|virtual\s+reality|vr|mixed\s+reality)\b'
    ]
    
    concepts = []
    for pattern in industry_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        concepts.extend([match.lower() for match in matches])
    
    return list(set(concepts))

def extract_regulatory_requirements_from_description(description: str) -> list:
    """Extract regulatory requirements mentioned in skill descriptions"""
    if not description:
        return []
    
    regulatory_patterns = [
        # General compliance frameworks
        r'\b(gdpr|general\s+data\s+protection\s+regulation)\b',
        r'\b(hipaa|health\s+insurance\s+portability)\b',
        r'\b(sox|sarbanes[-\s]oxley|pci[-\s]dss|payment\s+card\s+industry)\b',
        r'\b(iso\s+27001|iso\s+9001|nist|cobit)\b',
        
        # Industry-specific regulations
        r'\b(mifid|basel\s+iii|dodd[-\s]frank|ccar)\b',
        r'\b(fda|food\s+and\s+drug\s+administration|gmp|good\s+manufacturing)\b',
        r'\b(ferpa|coppa|ccpa|california\s+consumer\s+privacy)\b',
        
        # General regulatory terms
        r'\b(compliance|audit|regulatory\s+requirement|legal\s+requirement)\b',
        r'\b(data\s+protection|privacy\s+policy|terms\s+of\s+service)\b',
        r'\b(risk\s+management|control\s+framework|governance)\b'
    ]
    
    requirements = []
    for pattern in regulatory_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        requirements.extend([match.lower() for match in matches])
    
    return list(set(requirements))

def extract_business_terminology_from_description(description: str) -> list:
    """Extract business terminology mentioned in skill descriptions"""
    if not description:
        return []
    
    business_patterns = [
        # Business metrics and KPIs
        r'\b(kpi|key\s+performance\s+indicator|roi|return\s+on\s+investment)\b',
        r'\b(revenue|profit\s+margin|cost\s+reduction|efficiency\s+gains?)\b',
        r'\b(customer\s+acquisition\s+cost|cac|lifetime\s+value|ltv|churn\s+rate)\b',
        
        # Business processes
        r'\b(business\s+process|workflow|operational\s+efficiency)\b',
        r'\b(stakeholder\s+management|change\s+management|project\s+management)\b',
        r'\b(vendor\s+management|supplier\s+relations?|contract\s+management)\b',
        
        # Strategic terms
        r'\b(digital\s+transformation|business\s+strategy|competitive\s+advantage)\b',
        r'\b(market\s+analysis|customer\s+insights?|business\s+intelligence)\b',
        r'\b(scalability|growth\s+strategy|business\s+model)\b'
    ]
    
    terminology = []
    for pattern in business_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        terminology.extend([match.lower() for match in matches])
    
    return list(set(terminology))

def create_comprehensive_skill_coverage(skill_analysis: dict) -> dict:
    """
    Create a comprehensive skill coverage plan that ensures every skill in the ideal matrix
    is tested across the 15 questions with optimal distribution.
    
    Args:
        skill_analysis: The analyzed skill data from analyze_and_club_skills
    
    Returns:
        dict: Comprehensive coverage plan with skill-to-question mappings
    """
    logger.info("=== CREATING COMPREHENSIVE SKILL COVERAGE PLAN ===")
    
    # Extract all skills
    all_technical_skills = skill_analysis.get('technical_skills', [])
    all_soft_skills = skill_analysis.get('soft_skills', [])
    all_domain_knowledge_skills = skill_analysis.get('domain_knowledge_skills', [])
    all_sop_skills = skill_analysis.get('sop_skills', [])  # ADDED: SOP skills extraction
    skill_clubs = skill_analysis.get('skill_clubs', [])
    
    logger.info(f"Technical skills to cover: {len(all_technical_skills)}")
    logger.info(f"Soft skills to cover: {len(all_soft_skills)}")
    logger.info(f"Domain knowledge skills to cover: {len(all_domain_knowledge_skills)}")
    logger.info(f"SOP skills to cover: {len(all_sop_skills)}")  # ADDED: SOP skills logging
    logger.info(f"Skill clubs available: {len(skill_clubs)}")
    
    # Question type distribution plan
    question_distribution = {
        'pure_coding': 4,      # Test programming fundamentals
        'debugging': 3,        # Test code review and debugging skills  
        'theory': 3,          # Test architecture and conceptual knowledge
        'application': 1,     # Test integration and real-world application
        'soft_skills': 4      # Test all soft skills comprehensively
    }
    
    # Create skill assignment strategy
    coverage_plan = {
        'all_technical_skills': all_technical_skills,
        'all_soft_skills': all_soft_skills,
        'all_sop_skills': all_sop_skills,  # ADDED: Include SOP skills in coverage plan
        'skill_clubs': skill_clubs,
        'question_distribution': question_distribution,
        'skill_assignments': {},
        'coverage_strategy': {}
    }
    
    # Distribute technical skills across 11 technical questions
    # Strategy: Ensure each skill is tested at least once, prioritize high-level skills
    technical_skills_pool = all_technical_skills.copy()
    
    # Sort skills by competency level (higher first) for priority assignment
    technical_skills_pool.sort(key=lambda x: x.get('competency_level', 0), reverse=True)
    
    # Assign skills to pure coding questions (4 questions)
    coding_assignments = []
    skills_per_coding_question = max(1, len(technical_skills_pool) // 8)  # Spread across coding/debugging
    
    for i in range(4):
        question_skills = []
        
        # Take skills for this question
        for _ in range(min(skills_per_coding_question, len(technical_skills_pool))):
            if technical_skills_pool:
                skill = technical_skills_pool.pop(0)
                question_skills.append(skill)
        
        # Ensure we have at least one skill per question
        if not question_skills and technical_skills_pool:
            question_skills.append(technical_skills_pool.pop(0))
            
        coding_assignments.append({
            'question_type': 'pure_coding',
            'question_number': i + 1,
            'assigned_skills': question_skills,
            'focus_hint': get_coding_focus_hint(i)
        })
    
    # Assign skills to debugging questions (3 questions)
    debugging_assignments = []
    skills_per_debugging_question = max(1, len(technical_skills_pool) // 6)  # Spread across remaining questions
    
    for i in range(3):
        question_skills = []
        
        # Take skills for this question
        for _ in range(min(skills_per_debugging_question, len(technical_skills_pool))):
            if technical_skills_pool:
                skill = technical_skills_pool.pop(0)
                question_skills.append(skill)
        
        # Ensure we have at least one skill per question
        if not question_skills and technical_skills_pool:
            question_skills.append(technical_skills_pool.pop(0))
            
        debugging_assignments.append({
            'question_type': 'debugging',
            'question_number': i + 5,  # Questions 5-7
            'assigned_skills': question_skills,
            'focus_hint': get_debugging_focus_hint(i)
        })
    
    # Assign skills to theory questions (3 questions)
    theory_assignments = []
    skills_per_theory_question = max(1, len(technical_skills_pool) // 4)  # Spread across theory + application
    
    for i in range(3):
        question_skills = []
        
        # Take skills for this question
        for _ in range(min(skills_per_theory_question, len(technical_skills_pool))):
            if technical_skills_pool:
                skill = technical_skills_pool.pop(0)
                question_skills.append(skill)
        
        # Ensure we have at least one skill per question
        if not question_skills and technical_skills_pool:
            question_skills.append(technical_skills_pool.pop(0))
            
        theory_assignments.append({
            'question_type': 'theory',
            'question_number': i + 8,  # Questions 8-10
            'assigned_skills': question_skills,
            'focus_hint': get_theory_focus_hint(i)
        })
    
    # Optimize domain knowledge distribution to prevent overwhelming a single question
    domain_optimization = optimize_domain_knowledge_distribution(all_domain_knowledge_skills)
    optimized_domain_skills = domain_optimization['application_domain_skills']
    theory_domain_skills = domain_optimization.get('theory_domain_skills', [])
    
    # Assign remaining skills + OPTIMIZED domain knowledge + SOP skills to application question (1 question)
    # The application question should test comprehensive integration including domain expertise and SOPs
    application_skills = technical_skills_pool + optimized_domain_skills + all_sop_skills  # Combine remaining technical + optimized domain knowledge + SOPs
    application_assignment = {
        'question_type': 'application',
        'question_number': 11,
        'assigned_skills': application_skills,
        'domain_knowledge_skills': optimized_domain_skills,  # Explicitly track optimized domain knowledge
        'sop_skills': all_sop_skills,  # ADDED: Explicitly track SOP skills
        'focus_hint': 'comprehensive_integration_with_domain_expertise_and_procedures',  # UPDATED: Include procedures
        'domain_optimization': domain_optimization
    }
    
    # Distribute soft skills across 4 soft skill questions
    soft_skills_pool = all_soft_skills.copy()
    soft_skill_assignments = []
    skills_per_soft_question = max(1, len(soft_skills_pool) // 4)
    
    for i in range(4):
        question_skills = []
        
        # Take skills for this question
        for _ in range(min(skills_per_soft_question, len(soft_skills_pool))):
            if soft_skills_pool:
                skill = soft_skills_pool.pop(0)
                question_skills.append(skill)
        
        # Distribute remaining skills if any
        if i == 3 and soft_skills_pool:  # Last question gets remaining
            question_skills.extend(soft_skills_pool)
            soft_skills_pool = []
            
        soft_skill_assignments.append({
            'question_type': 'soft_skills',
            'question_number': i + 12,  # Questions 12-15
            'assigned_skills': question_skills,
            'focus_hint': get_soft_skills_focus_hint(i)
        })
    
    # Build comprehensive assignments
    coverage_plan['skill_assignments'] = {
        'pure_coding': coding_assignments,
        'debugging': debugging_assignments,
        'theory': theory_assignments,
        'application': [application_assignment],
        'soft_skills': soft_skill_assignments
    }
    
    # Create coverage summary - COUNT UNIQUE SKILLS ONLY TO PREVENT DOUBLE COUNTING
    # Note: application_assignment includes technical, domain knowledge, and SOP skills
    
    # Collect all unique technical skills assigned (using sets to prevent duplicates)
    unique_technical_skills_assigned = set()
    
    # Add technical skills from coding, debugging, theory questions
    for assignment_list in [coding_assignments, debugging_assignments, theory_assignments]:
        for assignment in assignment_list:
            for skill in assignment['assigned_skills']:
                unique_technical_skills_assigned.add(skill['id'])
    
    # Add technical skills from application (excluding domain knowledge and SOPs)
    app_domain_ids = {skill['id'] for skill in optimized_domain_skills}
    app_sop_ids = {skill['id'] for skill in all_sop_skills}
    for skill in application_assignment['assigned_skills']:
        if skill['id'] not in app_domain_ids and skill['id'] not in app_sop_ids:
            unique_technical_skills_assigned.add(skill['id'])
    
    # Count unique assignments (not total assignments which can double-count)
    total_technical_assignments = len(unique_technical_skills_assigned)
    
    total_soft_assignments = sum(len(q['assigned_skills']) for q in soft_skill_assignments)
    # Use the optimized distribution for domain knowledge assignments
    total_domain_knowledge_assignments = domain_optimization['total_distributed']
    # SOP skills are assigned to application question
    total_sop_assignments = len(all_sop_skills)  # ADDED: SOP assignments count
    
    coverage_plan['coverage_summary'] = {
        'total_technical_skills': len(all_technical_skills),
        'total_soft_skills': len(all_soft_skills),
        'total_domain_knowledge_skills': len(all_domain_knowledge_skills),
        'total_sop_skills': len(all_sop_skills),  # ADDED: SOP skills total
        'technical_skill_assignments': total_technical_assignments,
        'soft_skill_assignments': total_soft_assignments,
        'domain_knowledge_assignments': total_domain_knowledge_assignments,
        'sop_skill_assignments': total_sop_assignments,  # ADDED: SOP assignments
        'coverage_ratio': {
            'technical': total_technical_assignments / max(len(all_technical_skills), 1),
            'soft': total_soft_assignments / max(len(all_soft_skills), 1),
            'domain_knowledge': total_domain_knowledge_assignments / max(len(all_domain_knowledge_skills), 1),
            'sop': total_sop_assignments / max(len(all_sop_skills), 1)  # ADDED: SOP coverage ratio
        }
    }
    
    logger.info(f"Skill coverage plan created (FIXED - no double counting):")
    logger.info(f"  Technical skills: {len(all_technical_skills)} unique skills → {total_technical_assignments} unique assignments")
    logger.info(f"    Coding questions: {sum(len(set(skill['id'] for skill in q['assigned_skills'])) for q in coding_assignments)} unique skills")
    logger.info(f"    Debugging questions: {sum(len(set(skill['id'] for skill in q['assigned_skills'])) for q in debugging_assignments)} unique skills")
    logger.info(f"    Theory questions: {sum(len(set(skill['id'] for skill in q['assigned_skills'])) for q in theory_assignments)} unique skills")
    logger.info(f"    Application question: {len(unique_technical_skills_assigned & {skill['id'] for skill in application_assignment['assigned_skills']})} technical skills")
    
    if domain_optimization['optimization_applied']:
        logger.info(f"  Domain knowledge skills: {len(all_domain_knowledge_skills)} skills → {total_domain_knowledge_assignments} assignments (optimized distribution)")
        logger.info(f"    Application question: {len(optimized_domain_skills)} domain skills")
        if theory_domain_skills:
            logger.info(f"    Theory questions: {len(theory_domain_skills)} domain skills")
        if domain_optimization.get('skills_not_covered', 0) > 0:
            logger.warning(f"    ⚠️ {domain_optimization['skills_not_covered']} domain skills not covered due to capacity limits")
    else:
        logger.info(f"  Domain knowledge skills: {len(all_domain_knowledge_skills)} skills → {total_domain_knowledge_assignments} assignments (all in application question)")
    
    logger.info(f"  Soft skills: {len(all_soft_skills)} skills → {total_soft_assignments} assignments")
    logger.info(f"  SOP skills: {len(all_sop_skills)} skills → {total_sop_assignments} assignments")  # ADDED: SOP skills logging
    logger.info(f"  Coverage ratio - Technical: {coverage_plan['coverage_summary']['coverage_ratio']['technical']:.2f} (should be ≤ 1.0)")
    logger.info(f"  Coverage ratio - Soft: {coverage_plan['coverage_summary']['coverage_ratio']['soft']:.2f}")
    logger.info(f"  Coverage ratio - Domain Knowledge: {coverage_plan['coverage_summary']['coverage_ratio']['domain_knowledge']:.2f}")
    logger.info(f"  Coverage ratio - SOP: {coverage_plan['coverage_summary']['coverage_ratio']['sop']:.2f}")  # ADDED: SOP coverage ratio logging
    
    return coverage_plan

def get_coding_focus_hint(question_index):
    """Get focus hint for coding questions to ensure variety"""
    hints = [
        'array_string_manipulation',
        'algorithm_implementation', 
        'data_structure_usage',
        'logic_conditional_reasoning'
    ]
    return hints[question_index] if question_index < len(hints) else 'general_programming'

def get_debugging_focus_hint(question_index):
    """Get focus hint for debugging questions to ensure variety"""
    hints = [
        'logic_errors_fixes',
        'performance_optimization',
        'syntax_edge_cases'
    ]
    return hints[question_index] if question_index < len(hints) else 'general_debugging'

def get_theory_focus_hint(question_index):
    """Get focus hint for theory questions to ensure variety"""
    hints = [
        'architecture_design',
        'technology_selection',
        'best_practices_standards'
    ]
    return hints[question_index] if question_index < len(hints) else 'general_theory'

def get_soft_skills_focus_hint(question_index):
    """Get focus hint for soft skills questions to ensure comprehensive coverage"""
    hints = [
        'communication_leadership',
        'teamwork_collaboration', 
        'problem_solving_adaptability',
        'professional_skills_management'
    ]
    return hints[question_index] if question_index < len(hints) else 'general_soft_skills'

def generate_question_with_retry(agent, task_func, max_retries=3, **kwargs):
    """
    Generate a question with retry logic if it fails or produces duplicates.
    """
    for attempt in range(max_retries):
        try:
            logger.info(f"Question generation attempt {attempt + 1}/{max_retries}")
            
            task = task_func(**kwargs)
            crew = Crew(
                agents=[agent],
                tasks=[task],
                process=Process.sequential,
                verbose=True
            )
            
            result = crew.kickoff()
            question_data = json.loads(clean_json_string(str(result)))
            
            # Validate the question data
            if 'question' in question_data and question_data['question'].strip():
                logger.info(f"✅ Successfully generated question on attempt {attempt + 1}")
                return question_data
            else:
                logger.warning(f"⚠️ Invalid question generated on attempt {attempt + 1}")
                
        except Exception as e:
            logger.warning(f"⚠️ Question generation failed on attempt {attempt + 1}: {str(e)}")
            
        if attempt < max_retries - 1:
            logger.info("Retrying question generation...")
    
    logger.error(f"❌ Failed to generate valid question after {max_retries} attempts")
    return None

def generate_skill_questions(skill_matrix: dict, user_id: str, assessment_id: str, skill_matrix_id: str) -> dict:
    """
    Generate skill competency test questions with COMPREHENSIVE SKILL COVERAGE:
    - 11 technical questions (4 pure coding + 3 debugging + 3 theory + 1 application)
    - 4 soft skill questions
    Each question is mapped to specific skills ensuring 100% coverage of the ideal skill matrix.
    
    Args:
        skill_matrix (dict): The skill matrix data
        user_id (str): User's UUID
        assessment_id (str): Assessment's UUID
        skill_matrix_id (str): Skill matrix's UUID
    
    Returns:
        dict: Generated questions with comprehensive skill coverage
    """
    try:
        logger.info("=== GENERATING COMPREHENSIVE SKILL-MAPPED QUESTIONS ===")
        logger.info("Approach: Ensure 100% coverage of ideal skill matrix")
        logger.info("Structure: 11 Technical + 4 Soft Skills = 15 Total Questions")
        
        # DEBUG: Log system state at start
        import os
        import psutil
        logger.info(f"🔧 DEBUG: System environment - OPENAI_API_KEY: {'SET' if os.getenv('OPENAI_API_KEY') else 'NOT SET'}")
        logger.info(f"🔧 DEBUG: System environment - SUPABASE_URL: {'SET' if os.getenv('SUPABASE_URL') else 'NOT SET'}")
        logger.info(f"🔧 DEBUG: System environment - SUPABASE_SERVICE_KEY: {'SET' if os.getenv('SUPABASE_SERVICE_KEY') else 'NOT SET'}")
        
        # DEBUG: Log skill matrix structure
        logger.info(f"🔧 DEBUG: Skill matrix keys: {list(skill_matrix.keys()) if isinstance(skill_matrix, dict) else 'Not a dict'}")
        if isinstance(skill_matrix, dict) and 'skills' in skill_matrix:
            logger.info(f"🔧 DEBUG: Number of skills in matrix: {len(skill_matrix['skills'])}")
            logger.info(f"🔧 DEBUG: Sample skills: {[skill.get('name', 'Unknown') for skill in skill_matrix['skills'][:3]]}")
        
        # DEBUG: Log memory usage and system resources
        try:
            process = psutil.Process()
            logger.info(f"🔧 DEBUG: Memory usage at start: {process.memory_info().rss / 1024 / 1024:.1f} MB")
            logger.info(f"🔧 DEBUG: CPU usage: {psutil.cpu_percent(interval=1):.1f}%")
        except Exception as e:
            logger.warning(f"⚠️ DEBUG: Could not get system stats: {e}")
        
        # Analyze skills and create comprehensive mapping
        skill_analysis = analyze_and_club_skills(skill_matrix)
        
        # Create comprehensive skill coverage plan
        skill_coverage_plan = create_comprehensive_skill_coverage(skill_analysis)
        logger.info(f"Created comprehensive coverage plan for {len(skill_coverage_plan['all_technical_skills'])} technical skills and {len(skill_coverage_plan['all_soft_skills'])} soft skills")
        
        # Initialize agents
        logger.info("Initializing specialized agents...")
        agents = QuestionGenerationAgents()
        tasks = QuestionGenerationTasks()
        
        # Create industry context first
        industry_expert = agents.industry_expert_agent()
        context_task = tasks.create_context_task(
            agent=industry_expert,
            skill_matrix=json.dumps(skill_matrix, indent=2)
        )
        
        context_crew = Crew(
            agents=[industry_expert],
            tasks=[context_task],
            process=Process.sequential,
            verbose=True
        )
        
        logger.info("Generating industry context...")
        logger.info(f"🔧 DEBUG: About to execute context_crew.kickoff() with model: gpt-4.1-nano-2025-04-14")
        logger.info(f"🔧 DEBUG: Context crew agents: {len(context_crew.agents)}, tasks: {len(context_crew.tasks)}")
        
        # Time the execution
        import time
        start_time = time.time()
        try:
            context_result = context_crew.kickoff()
            elapsed_time = time.time() - start_time
            logger.info(f"✅ DEBUG: Context crew completed successfully in {elapsed_time:.2f}s. Result length: {len(str(context_result))}")
            industry_context = truncate_context(str(context_result), max_tokens=1500)
            logger.info(f"🔧 DEBUG: Industry context truncated to {count_tokens(industry_context)} tokens")
        except Exception as e:
            elapsed_time = time.time() - start_time
            logger.error(f"❌ DEBUG: Context crew failed after {elapsed_time:.2f}s with error: {str(e)}")
            logger.error(f"❌ DEBUG: Error type: {type(e).__name__}")
            if hasattr(e, 'response'):
                logger.error(f"❌ DEBUG: HTTP response code: {getattr(e.response, 'status_code', 'Unknown')}")
            if hasattr(e, '__dict__'):
                logger.error(f"❌ DEBUG: Error attributes: {[attr for attr in dir(e) if not attr.startswith('_')]}")
            raise
        
        # Create skill distribution plan with comprehensive coverage
        skill_analyzer = agents.skill_analyzer_agent()
        skill_analysis_task = tasks.analyze_skills_task(
            agent=skill_analyzer,
            skill_analysis=json.dumps(skill_coverage_plan, indent=2)
        )
        
        distribution_crew = Crew(
            agents=[skill_analyzer],
            tasks=[skill_analysis_task],
            process=Process.sequential,
            verbose=True
        )
        
        logger.info("Creating comprehensive skill distribution plan...")
        logger.info(f"🔧 DEBUG: About to execute distribution_crew.kickoff()")
        logger.info(f"🔧 DEBUG: Distribution crew agents: {len(distribution_crew.agents)}, tasks: {len(distribution_crew.tasks)}")
        try:
            distribution_result = distribution_crew.kickoff()
            logger.info(f"✅ DEBUG: Distribution crew completed successfully. Result length: {len(str(distribution_result))}")
            skill_distribution = str(distribution_result)
        except Exception as e:
            logger.error(f"❌ DEBUG: Distribution crew failed with error: {str(e)}")
            logger.error(f"❌ DEBUG: Error type: {type(e).__name__}")
            if hasattr(e, 'response'):
                logger.error(f"❌ DEBUG: HTTP response code: {getattr(e.response, 'status_code', 'Unknown')}")
            raise
        
        # Storage for all questions
        final_questions = []
        question_counter = 1
        
        # Generate Pure Coding Questions (4 individual questions) with skill assignments
        logger.info("=== GENERATING PURE CODING QUESTIONS (4 individual with assigned skills) ===")
        pure_coding_agent = agents.pure_coding_agent()
        coding_assignments = skill_coverage_plan['skill_assignments']['pure_coding']
        
        for i, assignment in enumerate(coding_assignments):
            logger.info(f"Generating Pure Coding Question {i+1}/4...")
            assigned_skills = assignment['assigned_skills']
            focus_hint = assignment['focus_hint']
            
            logger.info(f"  Assigned skills: {[skill['name'] for skill in assigned_skills]}")
            logger.info(f"  Focus hint: {focus_hint}")
            
            # Pass context of previously generated questions to avoid duplicates
            previous_questions = [q for q in final_questions if q.get('type') == 'pure_coding']
            managed_previous = manage_previous_questions_context(previous_questions, max_questions=2)
            simplified_skills = [simplify_skill_data(skill) for skill in optimize_skill_context(assigned_skills, max_skills=4)]
            
            single_coding_task = tasks.generate_single_pure_coding_task(
                agent=pure_coding_agent,
                question_number=question_counter,
                skill_distribution=json.dumps({
                    'assigned_skills': simplified_skills,
                    'focus_hint': focus_hint,
                    'question_context': f"Pure coding question testing: {', '.join([skill['name'] for skill in simplified_skills])}"
                }),
                industry_context=industry_context,
                previous_questions=json.dumps(managed_previous) if managed_previous else "None",
                variation_hint=focus_hint
            )
            
            coding_crew = Crew(
                agents=[pure_coding_agent],
                tasks=[single_coding_task],
                process=Process.sequential,
                verbose=True
            )
            
            logger.info(f"🔧 DEBUG: About to execute coding_crew.kickoff() for question {i+1}/4")
            logger.info(f"🔧 DEBUG: Coding crew agents: {len(coding_crew.agents)}, tasks: {len(coding_crew.tasks)}")
            logger.info(f"🔧 DEBUG: Assigned skills for this question: {[skill['name'] for skill in simplified_skills]}")
            logger.info(f"🔧 DEBUG: Context sizes - Industry: {count_tokens(industry_context)} tokens, Previous: {count_tokens(json.dumps(managed_previous)) if managed_previous else 0} tokens")
            try:
                result = coding_crew.kickoff()
                logger.info(f"✅ DEBUG: Coding crew {i+1} completed successfully. Raw result length: {len(str(result))}")
                question_data = json.loads(clean_json_string(str(result)))
                logger.info(f"✅ DEBUG: Coding question {i+1} JSON parsed successfully")
            except json.JSONDecodeError as e:
                logger.error(f"❌ DEBUG: JSON decode error for coding question {i+1}: {str(e)}")
                logger.error(f"❌ DEBUG: Raw result that failed to parse: {str(result)[:500]}...")
                raise
            except Exception as e:
                logger.error(f"❌ DEBUG: Coding crew {i+1} failed with error: {str(e)}")
                logger.error(f"❌ DEBUG: Error type: {type(e).__name__}")
                if hasattr(e, 'response'):
                    logger.error(f"❌ DEBUG: HTTP response code: {getattr(e.response, 'status_code', 'Unknown')}")
                raise
            
            # Add skill mapping to question data
            if isinstance(question_data, dict):
                question_data['assigned_skills'] = assigned_skills
                question_data['skill_coverage'] = {
                    'skill_ids': [skill['id'] for skill in assigned_skills],
                    'skill_names': [skill['name'] for skill in assigned_skills],
                    'focus_area': focus_hint
                }
            
            question_counter = add_question_with_validation(question_data, final_questions, question_counter, 'Technical - Programming', 'Pure Coding')
        
        # Generate Debugging Questions (3 individual questions) with skill assignments
        logger.info("=== GENERATING DEBUGGING QUESTIONS (3 individual with assigned skills) ===")
        debugging_agent = agents.debugging_agent()
        debugging_assignments = skill_coverage_plan['skill_assignments']['debugging']
        
        debugging_questions_generated = 0
        max_total_attempts = 15  # Total attempts across all debugging questions
        attempt_count = 0
        
        for assignment_idx, assignment in enumerate(debugging_assignments):
            if debugging_questions_generated >= 3:
                break
                
            assigned_skills = assignment['assigned_skills']
            focus_hint = assignment['focus_hint']
            current_question_num = debugging_questions_generated + 1
            
            logger.info(f"Generating Debugging Question {current_question_num}/3...")
            logger.info(f"  Assigned skills: {[skill['name'] for skill in assigned_skills]}")
            logger.info(f"  Focus hint: {focus_hint}")
            
            question_generated = False
            attempts_for_this_question = 0
            max_attempts_per_question = 5
            
            while not question_generated and attempts_for_this_question < max_attempts_per_question and attempt_count < max_total_attempts:
                attempt_count += 1
                attempts_for_this_question += 1
                
                logger.info(f"🔄 Attempting to generate debugging question {current_question_num}/3 (attempt {attempts_for_this_question}/{max_attempts_per_question})")
                
                try:
                    # Get previous debugging questions to avoid duplicates
                    previous_debug_questions = [q for q in final_questions if q.get('type') == 'debugging']
                    managed_previous_debug = manage_previous_questions_context(previous_debug_questions, max_questions=2)
                    simplified_debug_skills = [simplify_skill_data(skill) for skill in optimize_skill_context(assigned_skills, max_skills=4)]
                    
                    # Create the task with assigned skills
                    single_debug_task = tasks.generate_single_debugging_task(
                        agent=debugging_agent,
                        question_number=question_counter,
                        skill_distribution=json.dumps({
                            'assigned_skills': simplified_debug_skills,
                            'focus_hint': focus_hint,
                            'question_context': f"Debugging question testing: {', '.join([skill['name'] for skill in simplified_debug_skills])}"
                        }),
                        industry_context=industry_context,
                        previous_questions=json.dumps(managed_previous_debug) if managed_previous_debug else "None",
                        variation_hint=focus_hint
                    )
                
                    # Create crew and execute
                    debug_crew = Crew(
                        agents=[debugging_agent],
                        tasks=[single_debug_task],
                        process=Process.sequential,
                        verbose=True
                    )
                    
                    logger.info(f"🚀 Executing debugging question generation...")
                    logger.info(f"🔧 DEBUG: About to execute debug_crew.kickoff() for question {current_question_num}/3")
                    logger.info(f"🔧 DEBUG: Debug crew agents: {len(debug_crew.agents)}, tasks: {len(debug_crew.tasks)}")
                    logger.info(f"🔧 DEBUG: Assigned skills: {[skill['name'] for skill in assigned_skills]}")
                    try:
                        result = debug_crew.kickoff()
                        logger.info(f"✅ DEBUG: Debug crew {current_question_num} completed successfully. Raw result length: {len(str(result))}")
                        
                        # Clean and parse the result
                        logger.info(f"📝 Cleaning debugging question JSON...")
                        question_data = json.loads(clean_json_string(str(result)))
                        logger.info(f"✅ DEBUG: Debug question {current_question_num} JSON parsed successfully")
                    except json.JSONDecodeError as e:
                        logger.error(f"❌ DEBUG: JSON decode error for debug question {current_question_num}: {str(e)}")
                        logger.error(f"❌ DEBUG: Raw result that failed to parse: {str(result)[:500]}...")
                        continue
                    except Exception as e:
                        logger.error(f"❌ DEBUG: Debug crew {current_question_num} failed with error: {str(e)}")
                        logger.error(f"❌ DEBUG: Error type: {type(e).__name__}")
                        if hasattr(e, 'response'):
                            logger.error(f"❌ DEBUG: HTTP response code: {getattr(e.response, 'status_code', 'Unknown')}")
                        continue
                    
                    # Validate the question data
                    if not isinstance(question_data, dict) or 'question' not in question_data:
                        logger.warning(f"⚠️ Invalid question structure received: {type(question_data)}")
                        continue
                    
                    # Ensure it has a code field for debugging questions
                    if 'code' not in question_data or not question_data['code']:
                        logger.warning(f"⚠️ Adding missing 'code' field to debugging question")
                        question_data['code'] = """// Sample buggy code - needs debugging
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i <= items.length; i++) {  // Bug: should be < not <=
        total += items[i].price;
    }
    return total;
}"""
                    
                    # Set the question type
                    question_data['type'] = 'debugging'
                    
                    # Add skill mapping to question data
                    question_data['assigned_skills'] = assigned_skills
                    question_data['skill_coverage'] = {
                        'skill_ids': [skill['id'] for skill in assigned_skills],
                        'skill_names': [skill['name'] for skill in assigned_skills],
                        'focus_area': focus_hint
                    }
                    
                    # Check if it's a duplicate
                    if not is_question_duplicate(question_data, final_questions):
                        # Add to final questions
                        question_data['question_number'] = question_counter
                        question_data['category'] = 'Technical - Debugging'
                        final_questions.append(question_data)
                        
                        debugging_questions_generated += 1
                        question_counter += 1
                        question_generated = True
                        
                        logger.info(f"✅ Successfully added debugging question {debugging_questions_generated}/3 (question #{question_counter-1})")
                        
                        # Log the question details
                        logger.info(f"   Question: {question_data['question'][:100]}...")
                        logger.info(f"   Has code: {'✅' if 'code' in question_data else '❌'}")
                        logger.info(f"   Assigned skills: {[skill['name'] for skill in assigned_skills]}")
                        
                    else:
                        logger.warning(f"⚠️ Debugging question {current_question_num} is a duplicate, retrying...")
                        
                except json.JSONDecodeError as e:
                    logger.error(f"❌ JSON parsing failed for debugging question {current_question_num}: {str(e)}")
                    logger.error(f"Raw result: {str(result)[:200]}..." if 'result' in locals() else "No result available")
                except Exception as e:
                    logger.error(f"❌ Error generating debugging question {current_question_num}: {str(e)}")
                    import traceback
                    logger.error(traceback.format_exc())
        
        # Final validation for debugging questions
        final_debug_count = len([q for q in final_questions if q.get('type') == 'debugging'])
        if final_debug_count < 3:
            logger.error(f"❌ Only generated {final_debug_count}/3 debugging questions after {attempt_count} attempts")
            
            # Add fallback debugging questions if needed
            for i in range(3 - final_debug_count):
                fallback_question = {
                    'id': f'debug_fallback_{i+1}',
                    'type': 'debugging',
                    'question': f'Debug the following code to fix the error and explain what was wrong:',
                    'code': f"""// Fallback debugging question {i+1}
function processData(data) {{
    let result = [];
    for (let i = 0; i <= data.length; i++) {{  // Bug: off-by-one error
        result.push(data[i] * 2);
    }}
    return result;
}}""",
                    'expected_fix': 'Change <= to < in the loop condition',
                    'skills': [{'id': 'debugging_skills', 'name': 'Debugging Skills'}],
                    'question_number': question_counter,
                    'category': 'Technical - Debugging'
                }
                final_questions.append(fallback_question)
                question_counter += 1
                logger.warning(f"⚠️ Added fallback debugging question {i+1}")
        else:
            logger.info(f"✅ Successfully generated all {final_debug_count} debugging questions")
        
        # Generate Theory Questions (3 individual questions) with skill assignments
        logger.info("=== GENERATING THEORY QUESTIONS (3 individual with assigned skills) ===")
        theory_agent = agents.theory_agent()
        theory_assignments = skill_coverage_plan['skill_assignments']['theory']
        
        for i, assignment in enumerate(theory_assignments):
            logger.info(f"Generating Theory Question {i+1}/3...")
            assigned_skills = assignment['assigned_skills']
            focus_hint = assignment['focus_hint']
            
            logger.info(f"  Assigned skills: {[skill['name'] for skill in assigned_skills]}")
            logger.info(f"  Focus hint: {focus_hint}")
            
            # Pass context of previously generated questions to avoid duplicates
            previous_questions = [q for q in final_questions if q.get('type') == 'theory']
            managed_previous_theory = manage_previous_questions_context(previous_questions, max_questions=2)
            simplified_theory_skills = [simplify_skill_data(skill) for skill in optimize_skill_context(assigned_skills, max_skills=4)]
            
            single_theory_task = tasks.generate_single_theory_task(
                agent=theory_agent,
                question_number=question_counter,
                skill_distribution=json.dumps({
                    'assigned_skills': simplified_theory_skills,
                    'focus_hint': focus_hint,
                    'question_context': f"Theory question testing: {', '.join([skill['name'] for skill in simplified_theory_skills])}"
                }),
                industry_context=industry_context,
                previous_questions=json.dumps(managed_previous_theory) if managed_previous_theory else "None",
                variation_hint=focus_hint
            )
            
            theory_crew = Crew(
                agents=[theory_agent],
                tasks=[single_theory_task],
                process=Process.sequential,
                verbose=True
            )
            
            logger.info(f"🔧 DEBUG: About to execute theory_crew.kickoff() for question {i+1}/3")
            logger.info(f"🔧 DEBUG: Theory crew agents: {len(theory_crew.agents)}, tasks: {len(theory_crew.tasks)}")
            logger.info(f"🔧 DEBUG: Assigned skills: {[skill['name'] for skill in simplified_theory_skills]}")
            logger.info(f"🔧 DEBUG: Context sizes - Industry: {count_tokens(industry_context)} tokens, Previous: {count_tokens(json.dumps(managed_previous_theory)) if managed_previous_theory else 0} tokens")
            logger.info(f"🔧 DEBUG: Total estimated tokens for this request: {count_tokens(industry_context) + count_tokens(json.dumps(managed_previous_theory)) + count_tokens(json.dumps(simplified_theory_skills)) + 500}")
            try:
                result = theory_crew.kickoff()
                logger.info(f"✅ DEBUG: Theory crew {i+1} completed successfully. Raw result length: {len(str(result))}")
                question_data = json.loads(clean_json_string(str(result)))
                logger.info(f"✅ DEBUG: Theory question {i+1} JSON parsed successfully")
            except json.JSONDecodeError as e:
                logger.error(f"❌ DEBUG: JSON decode error for theory question {i+1}: {str(e)}")
                logger.error(f"❌ DEBUG: Raw result that failed to parse: {str(result)[:500]}...")
                raise
            except Exception as e:
                logger.error(f"❌ DEBUG: Theory crew {i+1} failed with error: {str(e)}")
                logger.error(f"❌ DEBUG: Error type: {type(e).__name__}")
                if hasattr(e, 'response'):
                    logger.error(f"❌ DEBUG: HTTP response code: {getattr(e.response, 'status_code', 'Unknown')}")
                raise
            
            # Add skill mapping to question data
            if isinstance(question_data, dict):
                question_data['assigned_skills'] = assigned_skills
                question_data['skill_coverage'] = {
                    'skill_ids': [skill['id'] for skill in assigned_skills],
                    'skill_names': [skill['name'] for skill in assigned_skills],
                    'focus_area': focus_hint
                }
            
            question_counter = add_question_with_validation(question_data, final_questions, question_counter, 'Technical - Theory', 'Theory')
        
        # Generate Application Question (1 question) with comprehensive skill coverage INCLUDING DOMAIN KNOWLEDGE AND SOPs
        logger.info("=== GENERATING APPLICATION QUESTION (1 comprehensive with assigned skills + domain knowledge + SOPs) ===")
        application_agent = agents.application_agent()
        application_assignment = skill_coverage_plan['skill_assignments']['application'][0]
        assigned_skills = application_assignment['assigned_skills']
        domain_knowledge_skills = application_assignment.get('domain_knowledge_skills', [])
        sop_skills = application_assignment.get('sop_skills', [])  # ADDED: Extract SOP skills
        focus_hint = application_assignment['focus_hint']
        
        logger.info(f"Application question assigned skills: {[skill['name'] for skill in assigned_skills]}")
        logger.info(f"Domain knowledge skills: {[skill['name'] for skill in domain_knowledge_skills]}")
        logger.info(f"SOP skills: {[skill['name'] for skill in sop_skills]}")  # ADDED: Log SOP skills
        logger.info(f"Focus hint: {focus_hint}")
        
        # Create enhanced context that includes domain knowledge and SOPs (with size management)
        simplified_assigned = [simplify_skill_data(skill) for skill in optimize_skill_context(assigned_skills, max_skills=3)]
        simplified_domain = [simplify_skill_data(skill) for skill in optimize_skill_context(domain_knowledge_skills, max_skills=3)]
        simplified_sop = [simplify_skill_data(skill) for skill in optimize_skill_context(sop_skills, max_skills=3)]
        
        application_context = {
            'assigned_skills': simplified_assigned,
            'domain_knowledge_skills': simplified_domain,
            'sop_skills': simplified_sop,
            'focus_hint': focus_hint,
            'question_context': f"Application question testing: {', '.join([skill['name'] for skill in simplified_assigned])}",
            'domain_context': f"Domain: {', '.join([skill['name'] for skill in simplified_domain])}" if simplified_domain else "No specific domain",
            'sop_context': f"Procedures: {', '.join([skill['name'] for skill in simplified_sop])}" if simplified_sop else "No specific procedures",
            'integration_requirements': 'Integrate technical skills with domain knowledge and procedures'
        }
        
        single_app_task = tasks.generate_single_application_task(
            agent=application_agent,
            question_number=question_counter,
            skill_distribution=json.dumps(application_context),
            industry_context=industry_context
        )
        
        app_crew = Crew(
            agents=[application_agent],
            tasks=[single_app_task],
            process=Process.sequential,
            verbose=True
        )
        
        logger.info(f"🔧 DEBUG: About to execute app_crew.kickoff()")
        logger.info(f"🔧 DEBUG: App crew agents: {len(app_crew.agents)}, tasks: {len(app_crew.tasks)}")
        logger.info(f"🔧 DEBUG: Assigned skills: {[skill['name'] for skill in assigned_skills]}")
        logger.info(f"🔧 DEBUG: Domain knowledge skills: {[skill['name'] for skill in domain_knowledge_skills]}")
        logger.info(f"🔧 DEBUG: SOP skills: {[skill['name'] for skill in sop_skills]}")
        try:
            result = app_crew.kickoff()
            logger.info(f"✅ DEBUG: App crew completed successfully. Raw result length: {len(str(result))}")
            question_data = json.loads(clean_json_string(str(result)))
            logger.info(f"✅ DEBUG: Application question JSON parsed successfully")
        except json.JSONDecodeError as e:
            logger.error(f"❌ DEBUG: JSON decode error for application question: {str(e)}")
            logger.error(f"❌ DEBUG: Raw result that failed to parse: {str(result)[:500]}...")
            raise
        except Exception as e:
            logger.error(f"❌ DEBUG: App crew failed with error: {str(e)}")
            logger.error(f"❌ DEBUG: Error type: {type(e).__name__}")
            if hasattr(e, 'response'):
                logger.error(f"❌ DEBUG: HTTP response code: {getattr(e.response, 'status_code', 'Unknown')}")
            raise
        
        # Add skill mapping to question data including domain knowledge and SOPs
        if isinstance(question_data, dict):
            question_data['assigned_skills'] = assigned_skills
            question_data['domain_knowledge_skills'] = domain_knowledge_skills
            question_data['sop_skills'] = sop_skills  # ADDED: Include SOP skills
            question_data['skill_coverage'] = {
                'skill_ids': [skill['id'] for skill in assigned_skills],
                'skill_names': [skill['name'] for skill in assigned_skills],
                'domain_knowledge_ids': [skill['id'] for skill in domain_knowledge_skills],
                'domain_knowledge_names': [skill['name'] for skill in domain_knowledge_skills],
                'sop_ids': [skill['id'] for skill in sop_skills],  # ADDED: SOP skill IDs
                'sop_names': [skill['name'] for skill in sop_skills],  # ADDED: SOP skill names
                'focus_area': focus_hint,
                'includes_domain_expertise': len(domain_knowledge_skills) > 0,
                'includes_sop_procedures': len(sop_skills) > 0  # ADDED: SOP procedures indicator
            }
        
        question_counter = add_question_with_validation(question_data, final_questions, question_counter, 'Technical - Application', 'Application')
        
        # Generate Soft Skills Questions (4 individual questions) with skill assignments
        logger.info("=== GENERATING SOFT SKILLS QUESTIONS (4 individual with assigned skills) ===")
        soft_skills_agent = agents.soft_skills_agent()
        soft_skill_assignments = skill_coverage_plan['skill_assignments']['soft_skills']
        
        for i, assignment in enumerate(soft_skill_assignments):
            logger.info(f"Generating Soft Skills Question {i+1}/4...")
            assigned_skills = assignment['assigned_skills']
            focus_hint = assignment['focus_hint']
            
            logger.info(f"  Assigned skills: {[skill['name'] for skill in assigned_skills]}")
            logger.info(f"  Focus hint: {focus_hint}")
            
            # Pass context of previously generated questions to avoid duplicates
            previous_questions = [q for q in final_questions if q.get('type') == 'soft_skills']
            managed_previous_soft = manage_previous_questions_context(previous_questions, max_questions=2)
            simplified_soft_skills = [simplify_skill_data(skill) for skill in optimize_skill_context(assigned_skills, max_skills=4)]
            
            single_soft_task = tasks.generate_single_soft_skills_task(
                agent=soft_skills_agent,
                question_number=question_counter,
                soft_skills=json.dumps({
                    'assigned_skills': simplified_soft_skills,
                    'focus_hint': focus_hint,
                    'question_context': f"Soft skills question testing: {', '.join([skill['name'] for skill in simplified_soft_skills])}"
                }),
                industry_context=industry_context,
                previous_questions=json.dumps(managed_previous_soft) if managed_previous_soft else "None",
                variation_hint=focus_hint
            )
            
            soft_crew = Crew(
                agents=[soft_skills_agent],
                tasks=[single_soft_task],
                process=Process.sequential,
                verbose=True
            )
            
            logger.info(f"🔧 DEBUG: About to execute soft_crew.kickoff() for question {i+1}/4")
            logger.info(f"🔧 DEBUG: Soft crew agents: {len(soft_crew.agents)}, tasks: {len(soft_crew.tasks)}")
            logger.info(f"🔧 DEBUG: Assigned skills: {[skill['name'] for skill in assigned_skills]}")
            try:
                result = soft_crew.kickoff()
                logger.info(f"✅ DEBUG: Soft crew {i+1} completed successfully. Raw result length: {len(str(result))}")
                question_data = json.loads(clean_json_string(str(result)))
                logger.info(f"✅ DEBUG: Soft question {i+1} JSON parsed successfully")
            except json.JSONDecodeError as e:
                logger.error(f"❌ DEBUG: JSON decode error for soft question {i+1}: {str(e)}")
                logger.error(f"❌ DEBUG: Raw result that failed to parse: {str(result)[:500]}...")
                raise
            except Exception as e:
                logger.error(f"❌ DEBUG: Soft crew {i+1} failed with error: {str(e)}")
                logger.error(f"❌ DEBUG: Error type: {type(e).__name__}")
                if hasattr(e, 'response'):
                    logger.error(f"❌ DEBUG: HTTP response code: {getattr(e.response, 'status_code', 'Unknown')}")
                raise
            
            # Add skill mapping to question data
            if isinstance(question_data, dict):
                question_data['assigned_skills'] = assigned_skills
                question_data['skill_coverage'] = {
                    'skill_ids': [skill['id'] for skill in assigned_skills],
                    'skill_names': [skill['name'] for skill in assigned_skills],
                    'focus_area': focus_hint
                }
            
            question_counter = add_question_with_validation(question_data, final_questions, question_counter, 'Soft Skills', 'Soft Skills')
        
        # Validate final results with comprehensive skill coverage analysis
        logger.info("=== COMPREHENSIVE VALIDATION AND SKILL COVERAGE ANALYSIS ===")
        
        coding_questions = [q for q in final_questions if q.get('type') == 'pure_coding']
        debugging_questions = [q for q in final_questions if q.get('type') == 'debugging']
        theory_questions = [q for q in final_questions if q.get('type') == 'theory']
        application_questions = [q for q in final_questions if q.get('type') == 'application']
        soft_skill_questions = [q for q in final_questions if q.get('type') == 'soft_skills']
        
        # Validate code fields
        debug_with_code = 0
        for debug_q in debugging_questions:
            if 'code' not in debug_q:
                logger.error(f"❌ Debugging question {debug_q.get('id')} missing 'code' field!")
            else:
                debug_with_code += 1
                logger.info(f"✅ Debugging question {debug_q.get('id')} has code field")
        
        # Validate question uniqueness
        unique_questions = set()
        duplicate_count = 0
        for q in final_questions:
            question_text = q.get('question', '').lower().strip()[:50]  # First 50 chars
            if question_text in unique_questions:
                duplicate_count += 1
                logger.warning(f"⚠️ Potential duplicate detected: {question_text}...")
            else:
                unique_questions.add(question_text)
        
        # Comprehensive skill coverage validation - USE ASSIGNMENT PLAN TO AVOID DOUBLE COUNTING
        logger.info("Calculating skill coverage from assignment plan (prevents double counting)...")
        all_covered_technical_skills = set()
        all_covered_soft_skills = set()
        all_covered_domain_knowledge_skills = set()
        all_covered_sop_skills = set()  # ADDED: SOP skills tracking
        
        # Calculate technical skills coverage from assignment plan (no duplicates possible)
        for question_type in ['pure_coding', 'debugging', 'theory']:
            assignments = skill_coverage_plan['skill_assignments'][question_type]
            for assignment in assignments:
                for skill in assignment['assigned_skills']:
                    all_covered_technical_skills.add(skill['id'])
        
        # Application question - carefully separate technical, domain, and SOP skills
        application_assignment = skill_coverage_plan['skill_assignments']['application'][0]
        app_domain_knowledge_skills = application_assignment.get('domain_knowledge_skills', [])
        app_sop_skills = application_assignment.get('sop_skills', [])
        
        # Add domain knowledge and SOP skills
        for skill in app_domain_knowledge_skills:
            all_covered_domain_knowledge_skills.add(skill['id'])
        for skill in app_sop_skills:
            all_covered_sop_skills.add(skill['id'])
        
        # Add technical skills from application (excluding domain and SOP)
        app_domain_ids = {skill['id'] for skill in app_domain_knowledge_skills}
        app_sop_ids = {skill['id'] for skill in app_sop_skills}
        for skill in application_assignment['assigned_skills']:
            if skill['id'] not in app_domain_ids and skill['id'] not in app_sop_ids:
                all_covered_technical_skills.add(skill['id'])
        
        # Calculate soft skills coverage from assignment plan
        soft_skill_assignments = skill_coverage_plan['skill_assignments']['soft_skills']
        for assignment in soft_skill_assignments:
            for skill in assignment['assigned_skills']:
                all_covered_soft_skills.add(skill['id'])
        
        # Calculate coverage ratios
        total_technical_skills = len(skill_coverage_plan['all_technical_skills'])
        total_soft_skills = len(skill_coverage_plan['all_soft_skills'])
        total_domain_knowledge_skills = len(skill_analysis.get('domain_knowledge_skills', []))
        total_sop_skills = len(skill_analysis.get('sop_skills', []))  # ADDED: SOP skills total
        
        technical_coverage_ratio = len(all_covered_technical_skills) / max(total_technical_skills, 1)
        soft_coverage_ratio = len(all_covered_soft_skills) / max(total_soft_skills, 1)
        domain_knowledge_coverage_ratio = len(all_covered_domain_knowledge_skills) / max(total_domain_knowledge_skills, 1)
        sop_coverage_ratio = len(all_covered_sop_skills) / max(total_sop_skills, 1)  # ADDED: SOP coverage ratio
        
        logger.info(f"Generated questions breakdown:")
        logger.info(f"  Pure Coding: {len(coding_questions)}/4")
        logger.info(f"  Debugging: {len(debugging_questions)}/3 ({debug_with_code} with code fields)")
        logger.info(f"  Theory: {len(theory_questions)}/3")
        logger.info(f"  Application: {len(application_questions)}/1")
        logger.info(f"  Soft Skills: {len(soft_skill_questions)}/4")
        logger.info(f"  Total: {len(final_questions)}/15")
        logger.info(f"  Duplicates detected: {duplicate_count}")
        
        # Cross-validation: Check assignment plan vs question metadata consistency
        logger.info("Cross-validating assignment plan against question metadata...")
        metadata_technical_skills = set()
        metadata_soft_skills = set()
        metadata_domain_skills = set()
        metadata_sop_skills = set()
        
        for question in final_questions:
            if 'skill_coverage' in question:
                skill_ids = question['skill_coverage'].get('skill_ids', [])
                domain_knowledge_ids = question['skill_coverage'].get('domain_knowledge_ids', [])
                sop_ids = question['skill_coverage'].get('sop_ids', [])
                question_type = question.get('type', 'unknown')
                
                if question_type in ['pure_coding', 'debugging', 'theory', 'application']:
                    metadata_technical_skills.update(skill_ids)
                    metadata_domain_skills.update(domain_knowledge_ids)
                    metadata_sop_skills.update(sop_ids)
                elif question_type == 'soft_skills':
                    metadata_soft_skills.update(skill_ids)
        
        # Compare assignment plan vs metadata
        assignment_vs_metadata_diff = {
            'technical': len(metadata_technical_skills) - len(all_covered_technical_skills),
            'soft': len(metadata_soft_skills) - len(all_covered_soft_skills),
            'domain': len(metadata_domain_skills) - len(all_covered_domain_knowledge_skills),
            'sop': len(metadata_sop_skills) - len(all_covered_sop_skills)
        }
        
        for skill_type, diff in assignment_vs_metadata_diff.items():
            if diff != 0:
                logger.warning(f"⚠️ {skill_type.title()} skills mismatch: metadata has {diff:+d} more skills than assignment plan")
                if diff > 0:
                    logger.warning(f"   This indicates double-counting in question metadata for {skill_type} skills")
        
        logger.info(f"Skill Coverage Analysis (from assignment plan - accurate):")
        logger.info(f"  Technical Skills: {len(all_covered_technical_skills)}/{total_technical_skills} ({technical_coverage_ratio:.1%})")
        logger.info(f"  Soft Skills: {len(all_covered_soft_skills)}/{total_soft_skills} ({soft_coverage_ratio:.1%})")
        logger.info(f"  Domain Knowledge: {len(all_covered_domain_knowledge_skills)}/{total_domain_knowledge_skills} ({domain_knowledge_coverage_ratio:.1%})")
        logger.info(f"  SOP Skills: {len(all_covered_sop_skills)}/{total_sop_skills} ({sop_coverage_ratio:.1%})")  # ADDED: SOP coverage logging
        
        # Find uncovered skills
        original_technical_skill_ids = {skill['id'] for skill in skill_coverage_plan['all_technical_skills']}
        original_soft_skill_ids = {skill['id'] for skill in skill_coverage_plan['all_soft_skills']}
        original_domain_knowledge_skill_ids = {skill['id'] for skill in skill_analysis.get('domain_knowledge_skills', [])}
        original_sop_skill_ids = {skill['id'] for skill in skill_analysis.get('sop_skills', [])}  # ADDED: SOP skill IDs
        
        uncovered_technical = original_technical_skill_ids - all_covered_technical_skills
        uncovered_soft = original_soft_skill_ids - all_covered_soft_skills
        uncovered_domain_knowledge = original_domain_knowledge_skill_ids - all_covered_domain_knowledge_skills
        uncovered_sop = original_sop_skill_ids - all_covered_sop_skills  # ADDED: Uncovered SOP skills
        
        if uncovered_technical:
            logger.warning(f"⚠️ Uncovered technical skills: {list(uncovered_technical)}")
        if uncovered_soft:
            logger.warning(f"⚠️ Uncovered soft skills: {list(uncovered_soft)}")
        if uncovered_domain_knowledge:
            logger.warning(f"⚠️ Uncovered domain knowledge skills: {list(uncovered_domain_knowledge)}")
        if uncovered_sop:
            logger.warning(f"⚠️ Uncovered SOP skills: {list(uncovered_sop)}")  # ADDED: Log uncovered SOPs
        
        # Overall coverage assessment
        overall_coverage = (len(all_covered_technical_skills) + len(all_covered_soft_skills) + len(all_covered_domain_knowledge_skills) + len(all_covered_sop_skills)) / max(total_technical_skills + total_soft_skills + total_domain_knowledge_skills + total_sop_skills, 1)  # ADDED: Include SOPs in overall coverage
        logger.info(f"Overall Skill Coverage: {overall_coverage:.1%}")
        
        if overall_coverage >= 0.95:
            logger.info("✅ EXCELLENT: Nearly complete skill coverage achieved!")
        elif overall_coverage >= 0.85:
            logger.info("✅ GOOD: Strong skill coverage achieved!")
        elif overall_coverage >= 0.75:
            logger.warning("⚠️ FAIR: Adequate skill coverage but room for improvement")
        else:
            logger.error("❌ POOR: Insufficient skill coverage - many skills untested")
        
        # Warn if we don't have exactly 15 questions
        if len(final_questions) != 15:
            logger.warning(f"⚠️ Expected 15 questions but got {len(final_questions)}")
        
        # Warn if any debugging questions lack code
        if debug_with_code < len(debugging_questions):
            logger.warning(f"⚠️ {len(debugging_questions) - debug_with_code} debugging questions missing code fields")
        
        # Create final structure with comprehensive skill coverage information
        questions_data = {
            'final_questions': final_questions,
            'assessment_summary': {
                'total_questions': len(final_questions),
                'total_estimated_time': '90-105 minutes',
                'question_breakdown': {
                    'pure_coding': len(coding_questions),
                    'debugging': len(debugging_questions),
                    'theory': len(theory_questions),
                    'application': len(application_questions),
                    'soft_skills': len(soft_skill_questions)
                },
                'skill_coverage_analysis': {
                    'technical_skills_covered': len(all_covered_technical_skills),
                    'technical_skills_total': total_technical_skills,
                    'technical_coverage_ratio': technical_coverage_ratio,
                    'soft_skills_covered': len(all_covered_soft_skills),
                    'soft_skills_total': total_soft_skills,
                    'soft_coverage_ratio': soft_coverage_ratio,
                    'domain_knowledge_skills_covered': len(all_covered_domain_knowledge_skills),
                    'domain_knowledge_skills_total': total_domain_knowledge_skills,
                    'domain_knowledge_coverage_ratio': domain_knowledge_coverage_ratio,
                    'sop_skills_covered': len(all_covered_sop_skills),  # ADDED: SOP skills covered
                    'sop_skills_total': total_sop_skills,  # ADDED: SOP skills total
                    'sop_coverage_ratio': sop_coverage_ratio,  # ADDED: SOP coverage ratio
                    'overall_coverage': overall_coverage,
                    'uncovered_technical_skills': list(uncovered_technical),
                    'uncovered_soft_skills': list(uncovered_soft),
                    'uncovered_domain_knowledge_skills': list(uncovered_domain_knowledge),
                    'uncovered_sop_skills': list(uncovered_sop)  # ADDED: Uncovered SOP skills
                },
                'comprehensive_skill_mapping': True,
                'individual_generation': True,
                'duplicates_detected': duplicate_count,
                'debugging_with_code': debug_with_code
            },
            'skill_coverage_plan': skill_coverage_plan['coverage_summary']
        }
        
        # Store in Supabase
        logger.info(f"Storing individual questions in Supabase for user {user_id}...")
        data = {
            'user_id': user_id,
            'assessment_id': assessment_id,
            'skill_matrix_id': skill_matrix_id,
            'questions': questions_data,
            'answers': None,
            'created_at': datetime.now().isoformat()
        }

        try:
            result = supabase.table('sct_initial').insert(data).execute()
            logger.info(f"Successfully stored comprehensive skill-mapped questions for user {user_id}")
            logger.info("=== COMPREHENSIVE SKILL-MAPPED QUESTION GENERATION COMPLETED SUCCESSFULLY ===")
            logger.info(f"✅ Generated {len(final_questions)} questions covering {overall_coverage:.1%} of the ideal skill matrix")
            logger.info(f"✅ Technical Skills Coverage: {len(all_covered_technical_skills)}/{total_technical_skills} ({technical_coverage_ratio:.1%}) - FIXED: No more double counting!")
            logger.info(f"✅ Soft Skills Coverage: {len(all_covered_soft_skills)}/{total_soft_skills} ({soft_coverage_ratio:.1%})")
            logger.info(f"✅ Domain Knowledge Coverage: {len(all_covered_domain_knowledge_skills)}/{total_domain_knowledge_skills} ({domain_knowledge_coverage_ratio:.1%})")
            logger.info(f"✅ SOP Skills Coverage: {len(all_covered_sop_skills)}/{total_sop_skills} ({sop_coverage_ratio:.1%})")  # ADDED: Final SOP coverage summary
            
            # Final validation check
            if technical_coverage_ratio > 1.0:
                logger.error(f"❌ CRITICAL: Technical coverage ratio still > 100% ({technical_coverage_ratio:.1%}) - fix not working!")
            else:
                logger.info(f"✅ SUCCESS: Technical coverage ratio is now within normal bounds ({technical_coverage_ratio:.1%})")
            
            return questions_data
        except Exception as insert_error:
            logger.error(f"Failed to insert data: {str(insert_error)}")
            raise

    except Exception as e:
        logger.error(f"Error generating comprehensive skill-mapped questions: {str(e)}")
        raise

def process_skill_matrix(skill_matrix_id: str):
    """
    Process a skill matrix and generate structured questions for it.
    
    Args:
        skill_matrix_id (str): The UUID of the skill matrix to process
    """
    try:
        # Fetch skill matrix data from Supabase
        result = supabase.table('ideal_skill_matrix').select('*').eq('id', skill_matrix_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise Exception(f"Skill matrix {skill_matrix_id} not found")
        
        skill_matrix = result.data[0]
        
        # Generate structured questions
        generate_skill_questions(
            skill_matrix=skill_matrix['skill_matrix'],
            user_id=skill_matrix['user_id'],
            assessment_id=skill_matrix['assessment_id'],
            skill_matrix_id=skill_matrix_id
        )
        
        logger.info(f"Successfully processed skill matrix {skill_matrix_id} with structured approach")
        
    except Exception as e:
        logger.error(f"Error processing skill matrix {skill_matrix_id}: {str(e)}")
        raise 

def is_question_duplicate(new_question: dict, existing_questions: list) -> bool:
    """
    Check if a new question is a duplicate of any existing questions.
    Returns True if duplicate, False if unique.
    """
    try:
        new_text = new_question.get('question', '').lower().strip()
        if not new_text:
            return False
            
        for existing in existing_questions:
            existing_text = existing.get('question', '').lower().strip()
            if not existing_text:
                continue
                
            # Check for exact match
            if new_text == existing_text:
                logger.warning(f"Found exact duplicate question: {new_text[:50]}...")
                return True
                
            # Check for high similarity (same first 20 words)
            new_words = new_text.split()[:20]
            existing_words = existing_text.split()[:20]
            
            if len(new_words) >= 10 and len(existing_words) >= 10:
                common_words = set(new_words) & set(existing_words)
                similarity_ratio = len(common_words) / max(len(new_words), len(existing_words))
                
                if similarity_ratio > 0.7:  # 70% word similarity threshold
                    logger.warning(f"Found similar question (similarity: {similarity_ratio:.2f}): {new_text[:50]}...")
                    return True
        
        return False
        
    except Exception as e:
        logger.error(f"Error checking question duplicate: {str(e)}")
        return False 

def add_question_with_validation(question_data: dict, final_questions: list, question_counter: int, category: str, question_type: str) -> int:
    """
    Add a question to the final list with duplicate validation and retry if needed.
    Returns the updated question_counter.
    """
    try:
        if 'question' in question_data:
            if not is_question_duplicate(question_data, final_questions):
                question_data['question_number'] = question_counter
                question_data['category'] = category
                final_questions.append(question_data)
                logger.info(f"✅ Added {question_type} Question {question_counter}")
                return question_counter + 1
            else:
                logger.warning(f"⚠️ Detected duplicate {question_type} Question {question_counter}")
                return question_counter  # Don't increment if duplicate
        else:
            logger.error(f"❌ Invalid question data for {question_type} Question {question_counter}")
            return question_counter  # Don't increment if invalid
    except Exception as e:
        logger.error(f"Error adding {question_type} question: {str(e)}")
        return question_counter  # Don't increment on error 

def optimize_domain_knowledge_distribution(all_domain_knowledge_skills: list, max_skills_per_question: int = 8) -> dict:
    """
    Optimize domain knowledge distribution when there are too many domain knowledge skills
    for a single application question. If there are more than max_skills_per_question domain
    knowledge skills, prioritize the most important ones and optionally distribute some to theory questions.
    
    Args:
        all_domain_knowledge_skills: List of all domain knowledge skills
        max_skills_per_question: Maximum number of domain knowledge skills per question
    
    Returns:
        dict: Optimized distribution plan
    """
    logger.info(f"Optimizing domain knowledge distribution for {len(all_domain_knowledge_skills)} skills")
    
    if len(all_domain_knowledge_skills) <= max_skills_per_question:
        logger.info(f"Domain knowledge skills ({len(all_domain_knowledge_skills)}) within limit, no optimization needed")
        return {
            'application_domain_skills': all_domain_knowledge_skills,
            'theory_domain_skills': [],
            'total_distributed': len(all_domain_knowledge_skills),
            'optimization_applied': False
        }
    
    logger.warning(f"Too many domain knowledge skills ({len(all_domain_knowledge_skills)}) for single question, optimizing...")
    
    # Sort by competency level (higher first) to prioritize most important skills
    sorted_skills = sorted(all_domain_knowledge_skills, 
                          key=lambda x: x.get('competency_level', 0), reverse=True)
    
    # Take top skills for application question
    application_skills = sorted_skills[:max_skills_per_question]
    
    # Remaining skills could be integrated into theory questions if needed
    remaining_skills = sorted_skills[max_skills_per_question:]
    
    logger.info(f"Optimized distribution:")
    logger.info(f"  Application question: {len(application_skills)} domain knowledge skills")
    logger.info(f"  Remaining skills: {len(remaining_skills)} (could be integrated into theory questions)")
    
    if remaining_skills:
        logger.warning(f"⚠️ {len(remaining_skills)} domain knowledge skills not assigned to application question")
        logger.warning(f"Consider integrating these into theory questions or creating domain-specific questions")
    
    return {
        'application_domain_skills': application_skills,
        'theory_domain_skills': remaining_skills[:3] if remaining_skills else [],  # Limit for theory questions
        'total_distributed': len(application_skills) + min(len(remaining_skills), 3),
        'optimization_applied': True,
        'skills_not_covered': len(remaining_skills) - min(len(remaining_skills), 3) if remaining_skills else 0
    }