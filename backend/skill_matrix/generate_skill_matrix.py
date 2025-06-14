import os
import openai
import logging
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from skill_competency_test.generate_questions import process_skill_matrix

# Import the skills embedding service for taxonomy integration
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from services.skills_embedding_service import SkillsEmbeddingService

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

# Initialize Skills Embedding Service for taxonomy integration
try:
    skills_service = SkillsEmbeddingService()
    logger.info("Skills Embedding Service initialized successfully")
    
    # Test the connection by checking taxonomy table
    test_result = skills_service.supabase.table('skills_taxonomy').select('count').limit(1).execute()
    logger.info(f"Skills taxonomy connection verified - table accessible")
    
except Exception as e:
    logger.error(f"Failed to initialize Skills Embedding Service: {str(e)}")
    logger.error(f"Environment check:")
    logger.error(f"  OPENAI_API_KEY: {'✓' if os.getenv('OPENAI_API_KEY') else '✗'}")
    logger.error(f"  SUPABASE_URL: {'✓' if os.getenv('SUPABASE_URL') else '✗'}")
    logger.error(f"  SUPABASE_SERVICE_KEY: {'✓' if os.getenv('SUPABASE_SERVICE_KEY') else '✗'}")
    skills_service = None

def standardize_skills_with_taxonomy(skill_matrix: dict, organization: str = None) -> dict:
    """
    Standardize skills using the skills taxonomy for consistent naming and IDs.
    This ensures 100% consistency when the same inputs are processed multiple times.
    
    Args:
        skill_matrix: The raw skill matrix from AI generation
        organization: Organization context for skill creation
        
    Returns:
        dict: Skill matrix with taxonomy-standardized skills
    """
    if not skills_service:
        logger.warning("⚠️ Skills service not available, falling back to legacy ID system")
        logger.warning("   This will create fallback_ skills instead of using canonical taxonomy")
        return add_consistent_skill_ids(skill_matrix)
    
    logger.info("🔄 Standardizing skills using taxonomy system...")
    logger.info(f"📊 Input skill matrix categories: {list(skill_matrix.keys())}")
    
    standardized_matrix = {}
    
    # Process each category
    for category_key, skills_list in skill_matrix.items():
        if not isinstance(skills_list, list):
            standardized_matrix[category_key] = skills_list
            continue
            
        standardized_skills = []
        
        for skill in skills_list:
            if not isinstance(skill, dict):
                continue
                
            skill_name = skill.get('name', '')
            description = skill.get('description', '')
            competency_level = skill.get('competency_level', 50)
            
            # Map category names to taxonomy categories
            taxonomy_category = map_to_taxonomy_category(category_key)
            
            try:
                # Find or create standardized skill
                standardized_skill = find_or_create_skill(
                    skill_name=skill_name,
                    description=description,
                    category=taxonomy_category,
                    source_type=determine_source_type(category_key),
                    organization=organization,
                    competency_level=competency_level,
                    original_skill=skill
                )
                
                if standardized_skill:
                    standardized_skills.append(standardized_skill)
                else:
                    # Fallback to original skill with generated ID
                    skill_copy = skill.copy()
                    skill_copy['id'] = f"fallback_{len(standardized_skills) + 1}"
                    standardized_skills.append(skill_copy)
                    
            except Exception as e:
                logger.error(f"Error standardizing skill '{skill_name}': {str(e)}")
                # Fallback to original skill
                skill_copy = skill.copy()
                skill_copy['id'] = f"error_{len(standardized_skills) + 1}"
                standardized_skills.append(skill_copy)
        
        standardized_matrix[category_key] = standardized_skills
    
    logger.info(f"Standardized {sum(len(v) if isinstance(v, list) else 0 for v in standardized_matrix.values())} skills using taxonomy")
    return standardized_matrix

def map_to_taxonomy_category(matrix_category: str) -> str:
    """Map skill matrix categories to taxonomy categories"""
    category_mapping = {
        'technical_skills': 'technical_skills',
        'soft_skills': 'soft_skills', 
        'domain_knowledge': 'domain_knowledge',
        'standard_operating_procedures': 'standard_operating_procedures'
    }
    return category_mapping.get(matrix_category, 'technical_skills')

def determine_source_type(category_key: str) -> str:
    """Determine source type based on category"""
    if category_key == 'standard_operating_procedures':
        return 'sop'
    elif category_key == 'domain_knowledge':
        return 'domain_knowledge'
    else:
        return 'job_description'

def normalize_skill_name_for_matching(skill_name: str) -> str:
    """Normalize skill name for better matching with taxonomy"""
    # Remove common suffixes and normalize
    normalized = skill_name.lower().strip()
    
    # Handle common variations
    replacements = {
        'javascript (es6+)': 'javascript',
        'js (es6+)': 'javascript',
        'node.js': 'nodejs',
        'react.js': 'react',
        'vue.js': 'vue',
        'css/scss': 'css',
        'html/css': 'html',
        'python 3': 'python',
        'unit testing (jest, vitest)': 'jest',
        'unit testing': 'testing',
        'api integration': 'api',
        'communication (verbal and written)': 'communication',
        'team collaboration': 'collaboration',
        'problem solving': 'problem-solving',
        'attention to detail': 'attention-to-detail'
    }
    
    for pattern, replacement in replacements.items():
        if pattern in normalized:
            return replacement
    
    # Remove parenthetical content and extra descriptors
    import re
    normalized = re.sub(r'\([^)]*\)', '', normalized).strip()
    normalized = re.sub(r'\s+', ' ', normalized)  # Multiple spaces to single
    
    return normalized

def determine_auto_creation_eligibility(skill_name: str, category: str, source_type: str, 
                                      organization: str = None, description: str = "") -> bool:
    """
    Determine if a skill should be automatically added to taxonomy based on various factors.
    
    Args:
        skill_name: Name of the skill
        category: Category of the skill
        source_type: Source that generated this skill
        organization: Organization context
        description: Skill description
        
    Returns:
        bool: True if skill should be auto-created, False if it needs review
    """
    # Always auto-create SOP and domain knowledge skills (high trust sources)
    if source_type in ['sop', 'domain_knowledge']:
        logger.info(f"✅ Auto-creating skill '{skill_name}' (trusted source: {source_type})")
        return True
    
    # Auto-create common technical skills that follow standard patterns
    if category == 'technical_skills' and is_common_technical_skill(skill_name):
        logger.info(f"✅ Auto-creating skill '{skill_name}' (common technical skill pattern)")
        return True
    
    # Auto-create skills from established organizations (if we have organization data)
    if organization and is_trusted_organization(organization):
        logger.info(f"✅ Auto-creating skill '{skill_name}' (trusted organization: {organization})")
        return True
    
    # Auto-create skills that appear frequently in our pending skills
    if has_sufficient_usage_frequency(skill_name, category):
        logger.info(f"✅ Auto-creating skill '{skill_name}' (sufficient usage frequency)")
        return True
    
    # For job descriptions, be more conservative - require review
    if source_type == 'job_description':
        logger.info(f"📋 Skill '{skill_name}' from job description will require review")
        return False
    
    # Default to requiring review for unknown sources
    logger.info(f"🔍 Skill '{skill_name}' requires review (source: {source_type})")
    return False

def is_common_technical_skill(skill_name: str) -> bool:
    """Check if skill matches common technical skill patterns"""
    skill_lower = skill_name.lower()
    
    # Common programming languages
    programming_languages = [
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 
        'php', 'ruby', 'kotlin', 'swift', 'dart', 'scala', 'r', 'matlab'
    ]
    
    # Common frameworks
    frameworks = [
        'react', 'vue', 'angular', 'django', 'flask', 'spring', 'express',
        'nextjs', 'nuxt', 'laravel', 'rails', 'asp.net', 'flutter', 'xamarin'
    ]
    
    # Common tools and technologies
    tools = [
        'docker', 'kubernetes', 'git', 'jenkins', 'aws', 'azure', 'gcp',
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'nginx'
    ]
    
    all_common_skills = programming_languages + frameworks + tools
    
    # Check if the skill name contains any of these common terms
    for common_skill in all_common_skills:
        if common_skill in skill_lower:
            return True
    
    return False

def is_trusted_organization(organization: str) -> bool:
    """Check if organization is in our trusted list"""
    if not organization:
        return False
    
    # For now, we'll be conservative and require manual review
    # This could be expanded with a list of known reputable companies
    trusted_patterns = [
        'university', 'college', 'institute', 'government', 'gov',
        # Add specific trusted organizations as needed
    ]
    
    org_lower = organization.lower()
    return any(pattern in org_lower for pattern in trusted_patterns)

def has_sufficient_usage_frequency(skill_name: str, category: str) -> bool:
    """Check if skill has been requested frequently enough to auto-approve"""
    try:
        if not skills_service:
            return False
            
        # Check how many times this skill has been created as pending
        result = skills_service.supabase.table('pending_skills').select('id').eq('skill_name', skill_name).eq('category', category).execute()
        
        frequency_count = len(result.data) if result.data else 0
        
        # Auto-create if we've seen this skill 3+ times
        if frequency_count >= 3:
            logger.info(f"📊 Skill '{skill_name}' has been requested {frequency_count} times, auto-creating")
            return True
            
        return False
        
    except Exception as e:
        logger.error(f"Error checking skill frequency for '{skill_name}': {str(e)}")
        return False

def track_skill_for_auto_promotion(skill_name: str, category: str, organization: str = None):
    """Track skills that might be candidates for auto-promotion to taxonomy"""
    try:
        if not skills_service:
            return
            
        # Store tracking data for later analysis
        tracking_data = {
            'skill_name': skill_name,
            'category': category,
            'organization': organization,
            'tracked_at': datetime.now().isoformat(),
            'source': 'job_description'
        }
        
        # This could be stored in a separate tracking table for analytics
        logger.info(f"📈 Tracking skill '{skill_name}' for potential auto-promotion")
        
    except Exception as e:
        logger.error(f"Error tracking skill '{skill_name}': {str(e)}")

def determine_skill_subcategory(skill_name: str, category: str, description: str = "") -> str:
    """Determine the subcategory for a skill based on its name, category, and description"""
    
    if category == 'technical_skills':
        skill_lower = skill_name.lower()
        
        # Programming Languages
        programming_languages = [
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust',
            'php', 'ruby', 'kotlin', 'swift', 'dart', 'scala', 'r', 'matlab', 'perl',
            'shell', 'bash', 'powershell', 'sql', 'html', 'css', 'scss'
        ]
        if any(lang in skill_lower for lang in programming_languages):
            return 'programming_languages'
        
        # Frameworks & Libraries
        frameworks = [
            'react', 'vue', 'angular', 'django', 'flask', 'spring', 'express',
            'nextjs', 'nuxt', 'laravel', 'rails', 'asp.net', 'flutter', 'xamarin',
            'bootstrap', 'tailwind', 'jquery', 'lodash', 'redux', 'vuex'
        ]
        if any(framework in skill_lower for framework in frameworks):
            return 'frameworks_libraries'
        
        # Databases
        databases = [
            'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite',
            'oracle', 'sql server', 'cassandra', 'dynamodb', 'firestore', 'database'
        ]
        if any(db in skill_lower for db in databases):
            return 'databases'
        
        # Cloud & DevOps
        cloud_devops = [
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform',
            'ansible', 'gitlab', 'github actions', 'ci/cd', 'devops', 'cloud'
        ]
        if any(tool in skill_lower for tool in cloud_devops):
            return 'cloud_devops'
        
        # Testing
        testing_tools = [
            'jest', 'vitest', 'cypress', 'selenium', 'junit', 'pytest', 'testing',
            'unit testing', 'integration testing', 'e2e testing'
        ]
        if any(test in skill_lower for test in testing_tools):
            return 'testing'
        
        # Design & UI/UX
        design_tools = [
            'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'design',
            'ui/ux', 'user experience', 'user interface', 'wireframing'
        ]
        if any(design in skill_lower for design in design_tools):
            return 'design_tools'
        
        # API & Integration
        api_terms = [
            'api', 'rest', 'graphql', 'microservices', 'integration', 'webhook'
        ]
        if any(api in skill_lower for api in api_terms):
            return 'api_integration'
        
        # Default for technical skills
        return 'general_technical'
    
    elif category == 'domain_knowledge':
        skill_lower = skill_name.lower()
        
        # Finance & FinTech
        fintech_terms = [
            'financial', 'banking', 'fintech', 'payment', 'trading', 'investment',
            'compliance', 'regulatory', 'kyc', 'aml', 'blockchain', 'cryptocurrency'
        ]
        if any(term in skill_lower for term in fintech_terms):
            return 'fintech'
        
        # Healthcare
        healthcare_terms = [
            'healthcare', 'medical', 'clinical', 'patient', 'hospital', 'pharma',
            'hipaa', 'electronic health records', 'ehr'
        ]
        if any(term in skill_lower for term in healthcare_terms):
            return 'healthcare'
        
        # E-commerce
        ecommerce_terms = [
            'ecommerce', 'e-commerce', 'retail', 'marketplace', 'shopping',
            'inventory', 'order management', 'payment processing'
        ]
        if any(term in skill_lower for term in ecommerce_terms):
            return 'ecommerce'
        
        # Education
        education_terms = [
            'education', 'learning', 'training', 'curriculum', 'academic',
            'university', 'school', 'course', 'instruction'
        ]
        if any(term in skill_lower for term in education_terms):
            return 'education'
        
        # Default for domain knowledge
        return 'industry_specific'
    
    elif category == 'soft_skills':
        skill_lower = skill_name.lower()
        
        # Leadership & Management
        leadership_terms = [
            'leadership', 'management', 'team lead', 'supervisor', 'director',
            'project management', 'people management'
        ]
        if any(term in skill_lower for term in leadership_terms):
            return 'leadership_management'
        
        # Communication
        communication_terms = [
            'communication', 'presentation', 'public speaking', 'writing',
            'verbal', 'written', 'interpersonal'
        ]
        if any(term in skill_lower for term in communication_terms):
            return 'communication'
        
        # Problem Solving
        problem_solving_terms = [
            'problem solving', 'analytical', 'critical thinking', 'decision making',
            'troubleshooting', 'creativity'
        ]
        if any(term in skill_lower for term in problem_solving_terms):
            return 'problem_solving'
        
        # Collaboration
        collaboration_terms = [
            'collaboration', 'teamwork', 'team player', 'cross-functional',
            'stakeholder management'
        ]
        if any(term in skill_lower for term in collaboration_terms):
            return 'collaboration'
        
        # Default for soft skills
        return 'interpersonal'
    
    elif category == 'standard_operating_procedures':
        skill_lower = skill_name.lower()
        
        # Customer Service
        customer_terms = [
            'customer', 'client', 'support', 'service', 'onboarding', 'retention'
        ]
        if any(term in skill_lower for term in customer_terms):
            return 'customer_service'
        
        # Quality Assurance
        qa_terms = [
            'quality', 'testing', 'review', 'audit', 'compliance', 'standards'
        ]
        if any(term in skill_lower for term in qa_terms):
            return 'quality_assurance'
        
        # Operations
        operations_terms = [
            'operations', 'workflow', 'process', 'procedure', 'documentation'
        ]
        if any(term in skill_lower for term in operations_terms):
            return 'operations'
        
        # Default for SOPs
        return 'general_procedures'
    
    # Return None if no subcategory determined
    return None

def generate_skill_aliases(skill_name: str, category: str, subcategory: str = None) -> list:
    """Generate common aliases for a skill based on its name and category"""
    aliases = []
    skill_lower = skill_name.lower()
    
    # Add the original name variations
    aliases.append(skill_name)
    aliases.append(skill_name.title())
    
    # Technical Skills Aliases
    if category == 'technical_skills':
        if subcategory == 'programming_languages':
            if 'javascript' in skill_lower:
                aliases.extend(['JS', 'JavaScript Programming', 'JavaScript Development', 'ECMAScript'])
            elif 'python' in skill_lower:
                aliases.extend(['Python Programming', 'Python Development', 'Python Scripting'])
            elif 'java' in skill_lower and 'javascript' not in skill_lower:
                aliases.extend(['Java Programming', 'Java Development', 'Java SE', 'Java EE'])
            elif 'typescript' in skill_lower:
                aliases.extend(['TS', 'TypeScript Programming', 'TypeScript Development'])
            elif 'c++' in skill_lower:
                aliases.extend(['CPP', 'C Plus Plus', 'C++ Programming'])
            elif 'c#' in skill_lower:
                aliases.extend(['C Sharp', 'C# Programming', 'C# Development'])
        
        elif subcategory == 'frameworks_libraries':
            if 'react' in skill_lower:
                aliases.extend(['React.js', 'ReactJS', 'React Development', 'React Framework'])
            elif 'vue' in skill_lower:
                aliases.extend(['Vue.js', 'VueJS', 'Vue Framework'])
            elif 'angular' in skill_lower:
                aliases.extend(['AngularJS', 'Angular Framework'])
            elif 'django' in skill_lower:
                aliases.extend(['Django Framework', 'Django Web Framework'])
            elif 'flask' in skill_lower:
                aliases.extend(['Flask Framework', 'Flask Web Framework'])
        
        elif subcategory == 'databases':
            if 'mysql' in skill_lower:
                aliases.extend(['MySQL Database', 'MySQL Development', 'MySQL Administration'])
            elif 'postgresql' in skill_lower:
                aliases.extend(['PostgreSQL Database', 'Postgres', 'PostgreSQL Development'])
            elif 'mongodb' in skill_lower:
                aliases.extend(['MongoDB Database', 'Mongo', 'MongoDB Development'])
        
        elif subcategory == 'cloud_devops':
            if 'aws' in skill_lower:
                aliases.extend(['Amazon Web Services', 'AWS Cloud', 'AWS Development'])
            elif 'azure' in skill_lower:
                aliases.extend(['Microsoft Azure', 'Azure Cloud'])
            elif 'docker' in skill_lower:
                aliases.extend(['Docker Containers', 'Containerization'])
            elif 'kubernetes' in skill_lower:
                aliases.extend(['K8s', 'Container Orchestration'])
    
    # Soft Skills Aliases
    elif category == 'soft_skills':
        if 'communication' in skill_lower:
            aliases.extend(['Communication Skills', 'Verbal Communication', 'Written Communication'])
        elif 'leadership' in skill_lower:
            aliases.extend(['Leadership Skills', 'Team Leadership', 'Management'])
        elif 'problem solving' in skill_lower:
            aliases.extend(['Problem-Solving', 'Analytical Thinking', 'Critical Thinking'])
        elif 'teamwork' in skill_lower or 'collaboration' in skill_lower:
            aliases.extend(['Team Collaboration', 'Collaborative Skills', 'Team Player'])
    
    # Remove duplicates and return
    return list(set(aliases))

def generate_skill_keywords(skill_name: str, category: str, subcategory: str = None, description: str = "") -> list:
    """Generate relevant keywords for a skill"""
    keywords = []
    skill_lower = skill_name.lower()
    desc_lower = description.lower()
    
    # Base keywords from skill name
    keywords.extend(skill_name.lower().split())
    
    # Category-specific keywords
    if category == 'technical_skills':
        keywords.append('programming')
        keywords.append('technology')
        keywords.append('development')
        
        if subcategory == 'programming_languages':
            keywords.extend(['coding', 'scripting', 'software'])
        elif subcategory == 'frameworks_libraries':
            keywords.extend(['framework', 'library', 'toolkit'])
        elif subcategory == 'databases':
            keywords.extend(['database', 'data', 'storage', 'query'])
        elif subcategory == 'cloud_devops':
            keywords.extend(['cloud', 'infrastructure', 'deployment', 'automation'])
        elif subcategory == 'testing':
            keywords.extend(['testing', 'quality', 'automation', 'verification'])
    
    elif category == 'soft_skills':
        keywords.extend(['interpersonal', 'professional', 'workplace'])
        
        if subcategory == 'communication':
            keywords.extend(['speaking', 'writing', 'presentation'])
        elif subcategory == 'leadership_management':
            keywords.extend(['management', 'leadership', 'influence'])
        elif subcategory == 'problem_solving':
            keywords.extend(['analytical', 'critical', 'solution'])
    
    elif category == 'domain_knowledge':
        keywords.extend(['industry', 'domain', 'business'])
        
        if subcategory == 'fintech':
            keywords.extend(['finance', 'banking', 'financial'])
        elif subcategory == 'healthcare':
            keywords.extend(['medical', 'clinical', 'patient'])
    
    # Extract keywords from description
    if description:
        # Common important words from descriptions
        important_words = ['development', 'management', 'analysis', 'design', 'implementation', 
                         'optimization', 'integration', 'automation', 'testing', 'security']
        for word in important_words:
            if word in desc_lower:
                keywords.append(word)
    
    # Remove duplicates and filter out common stop words
    stop_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'}
    keywords = [k for k in set(keywords) if k not in stop_words and len(k) > 2]
    
    return keywords

def determine_industry_tags(skill_name: str, category: str, subcategory: str = None, description: str = "") -> list:
    """Determine relevant industry tags for a skill"""
    tags = []
    skill_lower = skill_name.lower()
    desc_lower = description.lower()
    
    # Universal skills
    if category == 'soft_skills':
        tags.append('universal')
        
        if subcategory == 'leadership_management':
            tags.append('management')
        if subcategory == 'communication':
            tags.append('business')
    
    # Technical skills industry mapping
    elif category == 'technical_skills':
        tags.append('technology')
        tags.append('software')
        
        if subcategory == 'programming_languages':
            if any(lang in skill_lower for lang in ['javascript', 'html', 'css', 'react', 'vue', 'angular']):
                tags.extend(['web_development', 'frontend'])
            if any(lang in skill_lower for lang in ['python', 'java', 'node', 'django', 'spring']):
                tags.extend(['backend', 'web_development'])
            if 'python' in skill_lower:
                tags.extend(['data_science', 'ai_ml', 'automation'])
            if any(lang in skill_lower for lang in ['java', 'c#', 'spring']):
                tags.extend(['enterprise', 'fintech'])
        
        elif subcategory == 'databases':
            tags.extend(['database', 'backend', 'data_management'])
            
        elif subcategory == 'cloud_devops':
            tags.extend(['cloud', 'devops', 'infrastructure'])
            
        elif subcategory == 'frameworks_libraries':
            if any(fw in skill_lower for fw in ['react', 'vue', 'angular']):
                tags.extend(['frontend', 'web_development'])
            if any(fw in skill_lower for fw in ['django', 'flask', 'spring', 'express']):
                tags.extend(['backend', 'web_development'])
    
    # Domain knowledge industry mapping
    elif category == 'domain_knowledge':
        if subcategory == 'fintech':
            tags.extend(['fintech', 'banking', 'finance'])
        elif subcategory == 'healthcare':
            tags.extend(['healthcare', 'medical'])
        elif subcategory == 'ecommerce':
            tags.extend(['ecommerce', 'retail'])
        elif subcategory == 'education':
            tags.extend(['education', 'training'])
    
    # SOP industry mapping
    elif category == 'standard_operating_procedures':
        tags.extend(['operations', 'process_management'])
        
        if subcategory == 'customer_service':
            tags.extend(['customer_service', 'support'])
        elif subcategory == 'quality_assurance':
            tags.extend(['quality', 'compliance'])
    
    return list(set(tags))

def calculate_skill_confidence_score(skill_name: str, category: str, source_type: str, 
                                   organization: str = None, description: str = "") -> float:
    """Calculate confidence score for a skill based on various factors"""
    
    base_score = 0.5  # Start with 50%
    
    # Source type confidence
    source_confidence = {
        'manual': 1.0,
        'sop': 0.95,
        'domain_knowledge': 0.9,
        'auto_created': 0.8,
        'job_description': 0.7,
        'auto_promoted': 0.85
    }
    base_score = source_confidence.get(source_type, 0.6)
    
    # Common skill bonus
    if category == 'technical_skills' and is_common_technical_skill(skill_name):
        base_score += 0.1
    
    # Description quality bonus
    if description and len(description) > 50:
        base_score += 0.1
    elif description and len(description) > 20:
        base_score += 0.05
    
    # Organization trust bonus
    if organization and is_trusted_organization(organization):
        base_score += 0.1
    
    # Ensure score is between 0.1 and 1.0
    return max(0.1, min(1.0, base_score))

def find_or_create_skill(skill_name: str, description: str, category: str, 
                        source_type: str, organization: str = None, 
                        competency_level: int = 50, original_skill: dict = None) -> dict:
    """
    Find existing skill in taxonomy or create new one if unique enough
    
    Args:
        skill_name: Name of the skill
        description: Skill description
        category: Taxonomy category
        source_type: Source of the skill (job_description, sop, etc.)
        organization: Organization context
        competency_level: Required competency level
        original_skill: Original skill object with additional data
        
    Returns:
        dict: Standardized skill object
    """
    try:
        logger.info(f"🔍 Looking for skill: '{skill_name}' in category: {category}")
        
        # First, check if we have an exact match in taxonomy
        existing_skill = skills_service.get_skill_by_name(skill_name, category)
        
        if existing_skill:
            logger.info(f"✅ Found exact match for skill: {skill_name}")
            # Increment usage count
            skills_service.increment_skill_usage(existing_skill['skill_id'])
            
            # Return standardized skill object
            return create_standardized_skill_object(
                existing_skill, competency_level, description, original_skill
            )
        
        # Try normalized name matching
        normalized_name = normalize_skill_name_for_matching(skill_name)
        if normalized_name != skill_name.lower():
            logger.info(f"🔄 Trying normalized name: '{normalized_name}' for '{skill_name}'")
            existing_skill = skills_service.get_skill_by_name(normalized_name, category)
            
            if existing_skill:
                logger.info(f"✅ Found normalized match for skill: {skill_name} -> {normalized_name}")
                # Increment usage count
                skills_service.increment_skill_usage(existing_skill['skill_id'])
                
                # Return standardized skill object
                return create_standardized_skill_object(
                    existing_skill, competency_level, description, original_skill
                )
        
        # If no exact match, find similar skills
        similar_skills, should_add_as_new = skills_service.find_similar_skills_for_new_skill(
            skill_name=skill_name,
            description=description,
            category=category,
            similarity_threshold=0.85
        )
        
        if similar_skills and not should_add_as_new:
            # Use the most similar existing skill
            best_match = similar_skills[0]
            logger.info(f"Using similar skill '{best_match['canonical_name']}' for '{skill_name}' (similarity: {best_match.get('similarity', 0):.3f})")
            
            # Increment usage count
            skills_service.increment_skill_usage(best_match['skill_id'])
            
            return create_standardized_skill_object(
                best_match, competency_level, description, original_skill
            )
        
        # Create new skill if unique enough
        if should_add_as_new or len(similar_skills) == 0:
            # Auto-learn: Create skills automatically based on source quality and frequency
            should_auto_create = determine_auto_creation_eligibility(
                skill_name, category, source_type, organization, description
            )
            
            if should_auto_create:
                # Generate comprehensive skill data
                subcategory = determine_skill_subcategory(skill_name, category, description)
                aliases = generate_skill_aliases(skill_name, category, subcategory)
                keywords = generate_skill_keywords(skill_name, category, subcategory, description)
                industry_tags = determine_industry_tags(skill_name, category, subcategory, description)
                confidence_score = calculate_skill_confidence_score(skill_name, category, source_type, organization, description)
                
                # Automatically add to taxonomy for future use with all metadata
                new_skill_id = skills_service.add_skill_to_taxonomy_enhanced(
                    skill_name=skill_name,
                    category=category,
                    subcategory=subcategory,
                    description=description,
                    source_type=source_type,
                    organization=organization,
                    aliases=aliases,
                    keywords=keywords,
                    industry_tags=industry_tags,
                    confidence_score=confidence_score
                )
                
                if new_skill_id:
                    logger.info(f"🎓 Auto-learned and added new skill to taxonomy: '{skill_name}' (source: {source_type})")
                    logger.info(f"   📋 Subcategory: {subcategory}, Confidence: {confidence_score:.2f}")
                    logger.info(f"   🏷️ Industry tags: {industry_tags}")
                    new_skill = skills_service.get_skill_by_id(new_skill_id)
                    if new_skill:
                        return create_standardized_skill_object(
                            new_skill, competency_level, description, original_skill
                        )
            else:
                # Create pending skill for review (less common/trusted sources)
                # Also generate metadata for pending skills to speed up future promotion
                subcategory = determine_skill_subcategory(skill_name, category, description)
                aliases = generate_skill_aliases(skill_name, category, subcategory)
                keywords = generate_skill_keywords(skill_name, category, subcategory, description)
                industry_tags = determine_industry_tags(skill_name, category, subcategory, description)
                confidence_score = calculate_skill_confidence_score(skill_name, category, source_type, organization, description)
                
                pending_id = skills_service.create_pending_skill_enhanced(
                    skill_name=skill_name,
                    category=category,
                    subcategory=subcategory,
                    description=description,
                    source_type=source_type,
                    organization=organization,
                    suggested_competency=competency_level,
                    aliases=aliases,
                    keywords=keywords,
                    industry_tags=industry_tags,
                    confidence_score=confidence_score
                )
                
                if pending_id:
                    logger.info(f"📝 Created pending skill for review: {skill_name}")
                    logger.info(f"   📋 Prepared metadata - Subcategory: {subcategory}, Confidence: {confidence_score:.2f}")
                    
                    # For job descriptions, also track for potential auto-promotion
                    if source_type == 'job_description':
                        track_skill_for_auto_promotion(skill_name, category, organization)
        
        # Fallback: return original skill with generated taxonomy-style ID
        logger.warning(f"⚠️ Creating fallback skill for '{skill_name}' in category '{category}'")
        logger.warning(f"   - No exact match found")
        logger.warning(f"   - No normalized match found")
        logger.warning(f"   - No similar skills found or should_add_as_new={should_add_as_new}")
        return create_fallback_skill_object(skill_name, competency_level, description, original_skill)
        
    except Exception as e:
        logger.error(f"❌ Error in find_or_create_skill for '{skill_name}': {str(e)}")
        logger.error(f"   - Category: {category}")
        logger.error(f"   - Source type: {source_type}")
        import traceback
        logger.error(f"   - Stack trace: {traceback.format_exc()}")
        return create_fallback_skill_object(skill_name, competency_level, description, original_skill)

def create_standardized_skill_object(taxonomy_skill: dict, competency_level: int, 
                                   description: str, original_skill: dict = None) -> dict:
    """Create a standardized skill object from taxonomy data"""
    skill_obj = {
        'id': taxonomy_skill['skill_id'],
        'name': taxonomy_skill['canonical_name'],
        'competency_level': competency_level,
        'description': description or taxonomy_skill.get('description', ''),
        'taxonomy_matched': True,
        'skill_id': taxonomy_skill['skill_id'],
        'category': taxonomy_skill['category'],
        'subcategory': taxonomy_skill.get('subcategory'),
        'aliases': taxonomy_skill.get('aliases', []),
        'keywords': taxonomy_skill.get('keywords', [])
    }
    
    # Preserve additional fields from original skill
    if original_skill:
        for key, value in original_skill.items():
            if key not in skill_obj and key != 'name':
                skill_obj[key] = value
    
    return skill_obj

def create_fallback_skill_object(skill_name: str, competency_level: int, 
                                description: str, original_skill: dict = None) -> dict:
    """Create a fallback skill object when taxonomy matching fails"""
    # Generate a consistent ID from skill name
    skill_id = f"fallback_{skill_name.lower().replace(' ', '_').replace('-', '_')}"
    
    skill_obj = {
        'id': skill_id,
        'name': skill_name,
        'competency_level': competency_level,
        'description': description,
        'taxonomy_matched': False,
        'skill_id': skill_id
    }
    
    # Preserve additional fields from original skill
    if original_skill:
        for key, value in original_skill.items():
            if key not in skill_obj and key != 'name':
                skill_obj[key] = value
    
    return skill_obj

def add_consistent_skill_ids(skill_matrix: dict) -> dict:
    """
    Add consistent, explicit skill IDs to the skill matrix.
    This ensures skills have predictable IDs for assessment mapping.
    """
    logger.info("Adding consistent skill IDs to skill matrix...")
    
    enhanced_matrix = skill_matrix.copy()
    skill_id_counter = 1
    
    # Process technical skills first (they usually come first in questions)
    if 'technical_skills' in enhanced_matrix:
        enhanced_matrix['technical_skills'] = process_skills_category(
            enhanced_matrix['technical_skills'], 'technical', skill_id_counter
        )
        # Update counter based on how many technical skills we processed
        skill_id_counter = len(enhanced_matrix['technical_skills']) + 1
    
    # Process soft skills
    if 'soft_skills' in enhanced_matrix:
        enhanced_matrix['soft_skills'] = process_skills_category(
            enhanced_matrix['soft_skills'], 'soft', skill_id_counter
        )
        # Update counter based on how many soft skills we processed
        skill_id_counter = len(enhanced_matrix.get('technical_skills', [])) + len(enhanced_matrix['soft_skills']) + 1
    
    # Process domain knowledge with specialized IDs
    if 'domain_knowledge' in enhanced_matrix:
        enhanced_matrix['domain_knowledge'] = process_domain_knowledge_category(
            enhanced_matrix['domain_knowledge'], skill_id_counter
        )
    
    # Process standard operating procedures with specialized IDs
    if 'standard_operating_procedures' in enhanced_matrix:
        enhanced_matrix['standard_operating_procedures'] = process_sop_category(
            enhanced_matrix['standard_operating_procedures'], 1  # Start SOP IDs from 1
        )
        
    logger.info(f"Enhanced skill matrix with consistent skill IDs")
    return enhanced_matrix

def process_skills_category(skills_list: list, category_type: str, starting_counter: int) -> list:
    """
    Process a category of skills and assign consistent IDs.
    """
    logger.info(f"Processing {category_type} skills starting from ID {starting_counter}")
    
    enhanced_skills = []
    skill_counter = starting_counter
    
    for skill in skills_list:
        if isinstance(skill, dict):
            skill_copy = skill.copy()
            
            # Generate consistent ID from category and counter
            skill_id = f"skill_{skill_counter}"
            skill_copy['id'] = skill_id
            
            skill_name = skill_copy.get('name', f'skill_{skill_counter}')
            logger.info(f"Assigned ID '{skill_id}' to {category_type} skill: {skill_name}")
            
            enhanced_skills.append(skill_copy)
            skill_counter += 1
    
    return enhanced_skills

def process_domain_knowledge_category(domain_knowledge_list: list, starting_counter: int) -> list:
    """
    Process domain knowledge items and assign consistent IDs with specialized naming.
    """
    logger.info(f"Processing domain knowledge items starting from ID {starting_counter}")
    
    enhanced_domain_knowledge = []
    domain_counter = 1
    
    for domain_item in domain_knowledge_list:
        if isinstance(domain_item, dict):
            domain_copy = domain_item.copy()
            
            # Generate domain-specific ID
            domain_id = f"domain_knowledge_{domain_counter}"
            domain_copy['id'] = domain_id
            
            domain_name = domain_copy.get('name', f'domain_knowledge_{domain_counter}')
            logger.info(f"Assigned ID '{domain_id}' to domain knowledge: {domain_name}")
            
            enhanced_domain_knowledge.append(domain_copy)
            domain_counter += 1
    
    return enhanced_domain_knowledge

def process_sop_category(sop_list: list, starting_counter: int) -> list:
    """
    Process standard operating procedure items and assign consistent IDs with specialized naming.
    """
    logger.info(f"Processing SOP items starting from ID {starting_counter}")
    
    enhanced_sop = []
    sop_counter = starting_counter
    
    for sop_item in sop_list:
        if isinstance(sop_item, dict):
            sop_copy = sop_item.copy()
            
            # Generate SOP-specific ID
            sop_id = f"sop_{sop_counter}"
            sop_copy['id'] = sop_id
            
            sop_name = sop_copy.get('name', f'sop_{sop_counter}')
            logger.info(f"Assigned ID '{sop_id}' to SOP: {sop_name}")
            
            enhanced_sop.append(sop_copy)
            sop_counter += 1
    
    return enhanced_sop

def create_skill_id_registry() -> dict:
    """
    Create a registry of skill names to consistent IDs.
    This helps maintain consistency across different parts of the system.
    """
    # Standard skill order for consistency
    technical_skill_order = [
        "WordPress",
        "HTML", 
        "CSS",
        "JavaScript",
        "CakePHP",
        "Adobe Creative Suite (Dreamweaver, Flash 8, Fireworks 8, Acrobat 8)",
        "Networking Systems and Concepts",
        "Windows Environment (Windows XP, Microsoft Office)"
    ]
    
    soft_skill_order = [
        "Communication",
        "Problem-solving", 
        "Attention to Detail",
        "Adaptability",
        "Team Collaboration",
        "Creativity"
    ]
    
    registry = {}
    skill_counter = 1
    
    # Assign technical skills first
    for skill_name in technical_skill_order:
        registry[skill_name.lower()] = f"skill_{skill_counter}"
        skill_counter += 1
    
    # Assign soft skills next
    for skill_name in soft_skill_order:
        registry[skill_name.lower()] = f"skill_{skill_counter}"
        skill_counter += 1
    
    logger.info(f"Created skill ID registry with {len(registry)} skills")
    return registry

def clean_json_string(json_str: str) -> str:
    """
    Clean a JSON string by removing markdown formatting and ensuring valid JSON structure.
    
    Args:
        json_str (str): The JSON string to clean
        
    Returns:
        str: Cleaned JSON string
    """
    try:
        # Remove markdown code blocks if present
        if '```json' in json_str:
            json_str = json_str.split('```json')[1].split('```')[0]
        elif '```' in json_str:
            json_str = json_str.split('```')[1]
        
        # Remove any text before the first {
        json_str = json_str[json_str.find('{'):]
        
        # Remove any text after the last }
        json_str = json_str[:json_str.rfind('}')+1]
        
        # Remove any trailing commas
        json_str = json_str.replace(',\n}', '\n}')
        json_str = json_str.replace(',\n]', '\n]')
        
        # Ensure proper line endings
        json_str = json_str.replace('\r\n', '\n')
        
        # Remove any extra whitespace
        json_str = json_str.strip()
        
        # Validate JSON structure
        try:
            # Try to parse and re-stringify to ensure valid JSON
            parsed = json.loads(json_str)
            json_str = json.dumps(parsed)
        except json.JSONDecodeError as e:
            logger.error(f"JSON validation error: {str(e)}")
            raise
        
        return json_str
    except Exception as e:
        logger.error(f"Error cleaning JSON string: {str(e)}")
        raise

def generate_ideal_skill_matrix(job_description_data: dict, user_id: str, assessment_id: str, sop_data: dict = None, domain_knowledge_data: dict = None) -> dict:
    """
    Generate an ideal skill matrix based on the job description, SOP data, and domain knowledge using OpenAI's GPT-4 model.
    
    Args:
        job_description_data (dict): Parsed job description data
        user_id (str): User's UUID
        assessment_id (str): Assessment's UUID
        sop_data (dict, optional): Parsed SOP data for procedure context
        domain_knowledge_data (dict, optional): Parsed domain knowledge data for domain-specific expertise
    
    Returns:
        dict: Generated ideal skill matrix
    """
    try:
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        # Build the SOP context section
        sop_context = ""
        if sop_data:
            logger.info("Including SOP data in skill matrix generation")
            sop_context = f"""
        
        STANDARD OPERATING PROCEDURES (SOP) CONTEXT:
        {json.dumps(sop_data, indent=2)}
        
        IMPORTANT: Integrate the SOP procedures into technical skill descriptions. For skills mentioned in the SOPs:
        - Include specific procedure requirements in the skill description
        - Reference quality standards and compliance requirements
        - Mention required tools and expected outcomes from the SOPs
        - Include safety and documentation requirements where applicable
        - Connect skills to actual operational procedures the candidate will need to follow
        """
        else:
            logger.info("No SOP data provided - generating skill matrix from job description only")
        
        # Build the Domain Knowledge context section
        domain_knowledge_context = ""
        if domain_knowledge_data:
            logger.info("Including Domain Knowledge data in skill matrix generation")
            domain_knowledge_context = f"""
        
        DOMAIN KNOWLEDGE CONTEXT:
        {json.dumps(domain_knowledge_data, indent=2)}
        
        IMPORTANT: Extract domain-specific knowledge requirements from the above data. Use this to identify:
        - Industry-specific competencies required for the role
        - Domain concepts and principles that candidates should understand
        - Specialized knowledge areas relevant to the business domain
        - Industry standards and compliance requirements
        - Domain-specific tools, platforms, and technologies
        - Business context and industry terminology
        - Regulatory and compliance knowledge needs
        - Domain expertise levels required for effective job performance
        """
        else:
            logger.info("No Domain Knowledge data provided - generating skill matrix without domain-specific context")
        
        # Prepare the enhanced prompt with SOP and Domain Knowledge integration
        context_description = "job description"
        if sop_data and domain_knowledge_data:
            context_description += ", Standard Operating Procedures (SOPs), and Domain Knowledge"
        elif sop_data:
            context_description += " and Standard Operating Procedures (SOPs)"
        elif domain_knowledge_data:
            context_description += " and Domain Knowledge"
        
        prompt = f"""Based on the following {context_description}, create a comprehensive skill matrix that includes technical skills, soft skills, and domain knowledge requirements.
        For each skill, provide:
        1. Skill name
        2. Required competency level (1-100)
        3. Description of how this skill is applied in the job{' and relevant SOP procedures' if sop_data else ''}
        4. Associated metrics (for technical skills) or key indicators (for soft skills)
        
        Job Description:
        {job_description_data}{sop_context}{domain_knowledge_context}
        
        Return the response as a JSON object with the following structure:
        {{
            "technical_skills": [
                {{
                    "name": "Technical Skill Name",
                    "competency_level": 80,
                    "description": "How this skill is applied in the job{' including specific SOP procedure requirements, quality standards, and operational context' if sop_data else ''}",
                    "associated_metrics": [
                        {{
                            "name": "Associated Soft Skill/Competency",
                            "importance": "high/medium/low",
                            "description": "How this metric relates to the technical skill"
                        }}
                    ]
                }}
            ],
            "soft_skills": [
                {{
                    "name": "Soft Skill Name",
                    "competency_level": 80,
                    "description": "How this skill is applied in the job{' and procedural context' if sop_data else ''}",
                    "key_indicators": [
                        "Specific behavior or outcome that demonstrates this skill"
                    ]
                }}
            ],
            "domain_knowledge": [
                {{
                    "name": "Domain Knowledge Area",
                    "competency_level": 80,
                    "description": "Specific domain expertise required for the role, including industry concepts, regulations, and specialized knowledge",
                    "knowledge_areas": [
                        "Specific knowledge area or concept within this domain"
                    ],
                    "business_impact": "How this domain knowledge impacts business operations and decision-making"
                }}
            ]{f''',
            "standard_operating_procedures": [
                {{
                    "name": "SOP Procedure Name",
                    "competency_level": 80,
                    "description": "Specific procedural knowledge and execution capability required for this standard operating procedure",
                    "procedural_requirements": [
                        "Specific step or requirement from the SOP"
                    ],
                    "compliance_requirements": [
                        "Compliance standard or regulatory requirement"
                    ],
                    "quality_standards": [
                        "Quality control measure or standard"
                    ],
                    "business_impact": "How proper execution of this SOP impacts business operations and outcomes"
                }}
            ]''' if sop_data else ''}
        }}
        
        Guidelines:
        1. Technical skills should include:
           - Programming languages
           - Frameworks and tools
           - Technical methodologies
           - Core technical competencies{' and SOP-defined procedures' if sop_data else ''}
           - Each technical skill should have 2-3 associated soft skills/metrics
        
        2. Soft skills should include:
           - Communication abilities
           - Leadership qualities
           - Problem-solving approaches
           - Team collaboration
           - Adaptability{' and procedural compliance' if sop_data else ''}
           - Each soft skill should have 2-3 specific indicators
        
        3. Domain knowledge should include:
           - Industry-specific expertise and concepts
           - Business domain understanding (e.g., fintech, biotech, healthcare, etc.)
           - Regulatory and compliance knowledge
           - Domain-specific methodologies and best practices
           - Industry standards and frameworks
           - Specialized terminology and business context
           - Each domain knowledge area should have 2-3 knowledge areas and clear business impact
        
        {'''4. Standard Operating Procedures (SOPs) should include:
           - Specific procedural competencies derived from the SOP data
           - Process execution and compliance knowledge
           - Quality control and audit procedures
           - Documentation and record-keeping requirements
           - Safety and regulatory compliance procedures
           - Each SOP skill should have 2-3 procedural requirements and compliance requirements
           - Focus on executable procedural knowledge, not just awareness''' if sop_data else ''}
        
        {'''5''' if sop_data else '''4'''}. Competency levels (1-100):
           - 1-30: Basic understanding
           - 31-60: Intermediate proficiency
           - 61-80: Advanced expertise
           - 81-100: Expert/mastery level
        
        {'''6. SOP Integration Requirements:
           - Create SEPARATE SOP skills for each major procedure from the SOP data
           - For technical skills mentioned in SOPs, include specific procedure steps in descriptions
           - Reference quality standards and compliance requirements from SOPs
           - Mention required tools and expected outcomes
           - Include safety and documentation requirements
           - Connect skills to operational procedures
           - Ensure SOP skills are assessable competencies, not just documentation awareness''' if sop_data else ''}
        
        Ensure all competency levels are between 1-100 and descriptions are specific to the job role{' and operational procedures' if sop_data else ''}.
        Return ONLY the JSON object, no markdown formatting or additional text.
        """

        # Use OpenAI directly for better control
        response = client.chat.completions.create(
            model="gpt-4.1-nano-2025-04-14",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a professional HR analyst creating detailed skill matrices for job roles{' with operational procedure context' if sop_data else ''}{' and domain-specific expertise requirements' if domain_knowledge_data else ''}. Return only valid JSON without any markdown formatting or additional text."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.1,  # Low temperature for consistent outputs
            max_tokens=4000
        )

        # Get and clean the response
        raw_response = response.choices[0].message.content
        logger.info(f"Raw response from OpenAI: {raw_response}")
        
        # Clean the JSON string
        cleaned_json = clean_json_string(raw_response)
        logger.info(f"Cleaned JSON: {cleaned_json}")
        
        # Parse to ensure it's valid JSON
        skill_matrix = json.loads(cleaned_json)
        
        # Standardize skills using taxonomy for consistency
        # Extract organization from user context if available  
        organization = None  # TODO: Extract from user/assessment context
        
        # Use the new taxonomy-based standardization
        skill_matrix = standardize_skills_with_taxonomy(skill_matrix, organization)
        
        # Add SOP context to the skill matrix metadata for later use
        if sop_data:
            skill_matrix['sop_context'] = {
                'has_sop_data': True,
                'sop_summary': {
                    'purpose': sop_data.get('purpose', ''),
                    'scope': sop_data.get('scope', ''),
                    'key_procedures': len(sop_data.get('procedures', [])),
                    'compliance_requirements': len(sop_data.get('compliance_requirements', [])),
                    'safety_requirements': len(sop_data.get('safety_requirements', []))
                }
            }
            logger.info(f"Added SOP context metadata to skill matrix")
        else:
            skill_matrix['sop_context'] = {'has_sop_data': False}
        
        # Add Domain Knowledge context to the skill matrix metadata for later use
        if domain_knowledge_data:
            skill_matrix['domain_knowledge_context'] = {
                'has_domain_knowledge': True,
                'domain_summary': {
                    'primary_domain': domain_knowledge_data.get('domain_info', {}).get('primary_domain', ''),
                    'sub_domains': len(domain_knowledge_data.get('domain_info', {}).get('sub_domains', [])),
                    'key_technologies': len(domain_knowledge_data.get('technologies', [])),
                    'methodologies': len(domain_knowledge_data.get('methodologies', [])),
                    'industry_standards': len(domain_knowledge_data.get('industry_standards', [])),
                    'knowledge_areas': len(domain_knowledge_data.get('key_knowledge_areas', []))
                }
            }
            logger.info(f"Added Domain Knowledge context metadata to skill matrix")
        else:
            skill_matrix['domain_knowledge_context'] = {'has_domain_knowledge': False}
        
        # Store in Supabase
        data = {
            'user_id': user_id,
            'assessment_id': assessment_id,
            'skill_matrix': skill_matrix,
            'created_at': datetime.now().isoformat()
        }

        result = supabase.table('ideal_skill_matrix').insert(data).execute()
        logger.info(f"Successfully stored skill matrix for user {user_id}")
        
        # After successful insert, trigger question generation
        try:
            process_skill_matrix(result.data[0]['id'])
            logger.info(f"Triggered question generation for skill matrix {result.data[0]['id']}")
        except Exception as e:
            logger.error(f"Failed to generate questions: {str(e)}")
            # Don't fail the request if question generation fails
            # Just log the error and continue
        
        return skill_matrix

    except Exception as e:
        logger.error(f"Error generating skill matrix: {str(e)}")
        raise

def process_new_assessment(assessment_id: str):
    """
    Process a new assessment and generate its ideal skill matrix.
    
    Args:
        assessment_id (str): The UUID of the assessment to process
    """
    try:
        # Fetch assessment data from Supabase
        result = supabase.table('tsa_assessment').select('*').eq('id', assessment_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise Exception(f"Assessment {assessment_id} not found")
        
        assessment = result.data[0]
        
        # Extract SOP data if available
        sop_data = assessment.get('sop_data')
        if sop_data:
            logger.info(f"Found SOP data for assessment {assessment_id} - integrating into skill matrix generation")
        else:
            logger.info(f"No SOP data found for assessment {assessment_id} - using job description only")
        
        # Extract Domain Knowledge data if available
        domain_knowledge_data = assessment.get('domain_knowledge')
        if domain_knowledge_data:
            logger.info(f"Found Domain Knowledge data for assessment {assessment_id} - integrating into skill matrix generation")
        else:
            logger.info(f"No Domain Knowledge data found for assessment {assessment_id} - using job description and SOP only")
        
        # Generate skill matrix with SOP and Domain Knowledge context
        generate_ideal_skill_matrix(
            job_description_data=assessment['job_description_data'],
            user_id=assessment['user_id'],
            assessment_id=assessment_id,
            sop_data=sop_data,
            domain_knowledge_data=domain_knowledge_data
        )
        
        logger.info(f"Successfully processed assessment {assessment_id}")
        
    except Exception as e:
        logger.error(f"Error processing assessment {assessment_id}: {str(e)}")
        raise 