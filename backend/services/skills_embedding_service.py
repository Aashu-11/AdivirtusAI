import openai
import logging
import json
from typing import List, Dict, Optional, Tuple, Any
from supabase import create_client
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

class SkillsEmbeddingService:
    """
    Service for managing skill embeddings and similarity matching with dynamic taxonomy updates
    """
    
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
    def generate_skill_embedding(self, skill_name: str, description: str = "", category: str = "") -> List[float]:
        """
        Generate embedding for a skill using OpenAI's text-embedding-ada-002
        
        Args:
            skill_name: Name of the skill
            description: Optional description for context
            category: Optional category for context
            
        Returns:
            List of floats representing the embedding vector
        """
        # Create comprehensive text for embedding
        text_parts = [skill_name]
        if category:
            text_parts.append(f"Category: {category}")
        if description:
            text_parts.append(f"Description: {description}")
            
        text_content = " | ".join(text_parts)
        
        try:
            response = self.openai_client.embeddings.create(
                input=text_content,
                model="text-embedding-ada-002"
            )
            
            embedding = response.data[0].embedding
            logger.info(f"Generated embedding for skill: '{skill_name}' (dimension: {len(embedding)})")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding for skill '{skill_name}': {str(e)}")
            raise
    
    def store_skill_embedding(self, skill_id: str, skill_name: str, description: str = "", category: str = "") -> bool:
        """
        Generate and store skill embedding in database
        
        Args:
            skill_id: Unique identifier for the skill
            skill_name: Display name of the skill
            description: Optional description
            category: Optional category
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Generate embedding
            embedding = self.generate_skill_embedding(skill_name, description, category)
            
            # Create text content for storage
            text_parts = [skill_name]
            if category:
                text_parts.append(f"Category: {category}")
            if description:
                text_parts.append(f"Description: {description}")
            text_content = " | ".join(text_parts)
            
            # Store in database
            data = {
                'skill_id': skill_id,
                'embedding': embedding,
                'text_content': text_content,
                'embedding_version': 'ada-002'
            }
            
            result = self.supabase.table('skills_embeddings').insert(data).execute()
            
            if result.data:
                logger.info(f"Successfully stored embedding for skill: {skill_name}")
                return True
            else:
                logger.error(f"Failed to store embedding for skill: {skill_name}")
                return False
                
        except Exception as e:
            logger.error(f"Error storing embedding for skill '{skill_name}': {str(e)}")
            return False
    
    def find_similar_skills(self, query_embedding: List[float], threshold: float = 0.8, limit: int = 5, category: str = None) -> List[Dict]:
        """
        Find similar skills using vector similarity search
        
        Args:
            query_embedding: Vector embedding to search for
            threshold: Minimum similarity threshold (0-1)
            limit: Maximum number of results
            category: Optional category filter
            
        Returns:
            List of similar skills with metadata
        """
        try:
            # Use the SQL function for vector similarity search
            result = self.supabase.rpc('match_skills', {
                'query_embedding': query_embedding,
                'match_threshold': threshold,
                'match_count': limit
            }).execute()
            
            similar_skills = result.data if result.data else []
            
            # Filter by category if provided
            if category and similar_skills:
                similar_skills = [skill for skill in similar_skills if skill.get('category') == category]
            
            logger.info(f"Found {len(similar_skills)} similar skills above threshold {threshold}")
            return similar_skills
            
        except Exception as e:
            logger.error(f"Error finding similar skills: {str(e)}")
            return []
    
    def find_similar_skills_for_new_skill(self, skill_name: str, description: str = "", category: str = None, 
                                        similarity_threshold: float = 0.85) -> Tuple[List[Dict], bool]:
        """
        Find similar skills for a potentially new skill and determine if it should be merged
        
        Args:
            skill_name: Name of the new skill
            description: Optional description
            category: Optional category
            similarity_threshold: Threshold for considering skills similar
            
        Returns:
            Tuple of (similar_skills_list, should_add_as_new)
        """
        try:
            # Generate embedding for the new skill
            query_embedding = self.generate_skill_embedding(skill_name, description, category)
            
            # Use specialized function for new skill detection
            result = self.supabase.rpc('find_similar_skills_for_new', {
                'query_embedding': query_embedding,
                'skill_name': skill_name,
                'category': category,
                'similarity_threshold': similarity_threshold
            }).execute()
            
            similar_skills = result.data if result.data else []
            
            # Determine if we should add as new skill
            should_merge = any(skill.get('should_merge', False) for skill in similar_skills)
            should_add_as_new = not should_merge and len(similar_skills) == 0
            
            if should_merge:
                logger.info(f"Skill '{skill_name}' should merge with existing skill: {similar_skills[0]['canonical_name']}")
            elif should_add_as_new:
                logger.info(f"Skill '{skill_name}' is unique enough to add as new skill")
            else:
                logger.info(f"Skill '{skill_name}' has similar skills but requires review")
            
            return similar_skills, should_add_as_new
            
        except Exception as e:
            logger.error(f"Error analyzing new skill '{skill_name}': {str(e)}")
            return [], True  # Default to adding as new if error occurs
    
    def create_pending_skill(self, skill_name: str, category: str, description: str = "", 
                           source_type: str = "manual", source_data: dict = None, 
                           organization: str = None, suggested_competency: int = None) -> Optional[str]:
        """
        Create a pending skill entry for review
        
        Args:
            skill_name: Name of the skill
            category: Category of the skill
            description: Optional description
            source_type: Source that generated this skill (sop, domain_knowledge, etc.)
            source_data: Original data that led to this skill
            organization: Organization context
            suggested_competency: Suggested competency level
            
        Returns:
            ID of created pending skill or None if failed
        """
        try:
            # Find similar skills to help with review
            similar_skills, should_add_as_new = self.find_similar_skills_for_new_skill(
                skill_name, description, category
            )
            
            # Calculate confidence score based on similarity and source
            confidence_score = self._calculate_confidence_score(
                similar_skills, source_type, organization
            )
            
            # Determine if auto-approval is appropriate
            auto_approved = (
                confidence_score > 0.9 and 
                should_add_as_new and 
                source_type in ['sop', 'domain_knowledge']
            )
            
            # Create pending skill entry
            pending_data = {
                'skill_name': skill_name,
                'category': category,
                'description': description,
                'suggested_competency_level': suggested_competency,
                'source_type': source_type,
                'source_data': source_data or {},
                'organization': organization,
                'similarity_to_existing': similar_skills[0]['similarity'] if similar_skills else 0.0,
                'similar_skills': similar_skills,
                'confidence_score': confidence_score,
                'auto_approved': auto_approved,
                'status': 'approved' if auto_approved else 'pending'
            }
            
            result = self.supabase.table('pending_skills').insert(pending_data).execute()
            
            if result.data:
                pending_id = result.data[0]['id']
                logger.info(f"Created pending skill: '{skill_name}' (ID: {pending_id}, Auto-approved: {auto_approved})")
                
                # If auto-approved, immediately promote to taxonomy
                if auto_approved:
                    self.approve_pending_skill(pending_id)
                
                return pending_id
            
            return None
            
        except Exception as e:
            logger.error(f"Error creating pending skill '{skill_name}': {str(e)}")
            return None
    
    def approve_pending_skill(self, pending_id: str, reviewer_id: str = None) -> bool:
        """
        Approve a pending skill and add it to the main taxonomy
        
        Args:
            pending_id: ID of the pending skill
            reviewer_id: Optional ID of the reviewer
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get pending skill data
            pending_result = self.supabase.table('pending_skills').select('*').eq('id', pending_id).single().execute()
            
            if not pending_result.data:
                logger.error(f"Pending skill not found: {pending_id}")
                return False
            
            pending_skill = pending_result.data
            
            # Generate skill_id
            skill_id = self._generate_skill_id(pending_skill['skill_name'])
            
            # Create taxonomy entry
            taxonomy_data = {
                'skill_id': skill_id,
                'canonical_name': pending_skill['skill_name'],
                'category': pending_skill['category'],
                'description': pending_skill['description'],
                'source_type': pending_skill['source_type'],
                'organization': pending_skill['organization'],
                'confidence_score': pending_skill['confidence_score'],
                'status': 'active',
                'approved_by': reviewer_id,
                'approved_at': datetime.now().isoformat()
            }
            
            # Insert into taxonomy
            taxonomy_result = self.supabase.table('skills_taxonomy').insert(taxonomy_data).execute()
            
            if not taxonomy_result.data:
                logger.error(f"Failed to create taxonomy entry for pending skill: {pending_id}")
                return False
            
            # Store embedding
            embedding_success = self.store_skill_embedding(
                skill_id,
                pending_skill['skill_name'],
                pending_skill['description'],
                pending_skill['category']
            )
            
            if not embedding_success:
                logger.error(f"Failed to store embedding for approved skill: {skill_id}")
                # Don't fail the approval, just log the error
            
            # Update pending skill status
            self.supabase.table('pending_skills').update({
                'status': 'approved',
                'reviewed_at': datetime.now().isoformat(),
                'reviewed_by': reviewer_id
            }).eq('id', pending_id).execute()
            
            logger.info(f"Successfully approved and added skill: '{pending_skill['skill_name']}' (ID: {skill_id})")
            return True
            
        except Exception as e:
            logger.error(f"Error approving pending skill {pending_id}: {str(e)}")
            return False
    
    def get_skill_by_id(self, skill_id: str) -> Optional[Dict]:
        """Get skill information by skill_id"""
        try:
            result = self.supabase.table('skills_taxonomy').select('*').eq('skill_id', skill_id).single().execute()
            return result.data if result.data else None
        except Exception as e:
            logger.error(f"Error getting skill by ID {skill_id}: {str(e)}")
            return None
    
    def increment_skill_usage(self, skill_id: str) -> bool:
        """Increment usage count for a skill"""
        try:
            self.supabase.rpc('increment_skill_usage', {'p_skill_id': skill_id}).execute()
            return True
        except Exception as e:
            logger.error(f"Error incrementing usage for skill {skill_id}: {str(e)}")
            return False
    
    def _generate_skill_id(self, skill_name: str) -> str:
        """Generate a unique skill_id from skill name"""
        # Convert to lowercase, replace spaces/special chars with underscores
        base_id = skill_name.lower()
        base_id = ''.join(c if c.isalnum() else '_' for c in base_id)
        base_id = '_'.join(part for part in base_id.split('_') if part)  # Remove empty parts
        
        # Ensure uniqueness
        counter = 0
        skill_id = base_id
        
        while True:
            # Check if skill_id exists
            existing = self.supabase.table('skills_taxonomy').select('skill_id').eq('skill_id', skill_id).execute()
            if not existing.data:
                break
            
            counter += 1
            skill_id = f"{base_id}_{counter}"
        
        return skill_id
    
    def _calculate_confidence_score(self, similar_skills: List[Dict], source_type: str, organization: str = None) -> float:
        """Calculate confidence score for a new skill"""
        base_confidence = 0.7
        
        # Boost confidence for structured sources
        if source_type in ['sop', 'domain_knowledge']:
            base_confidence += 0.2
        
        # Reduce confidence if very similar skills exist
        if similar_skills:
            max_similarity = max(skill.get('similarity', 0) for skill in similar_skills)
            if max_similarity > 0.8:
                base_confidence -= 0.3
        
        # Organization-specific skills get slight boost
        if organization:
            base_confidence += 0.1
        
        return min(1.0, max(0.0, base_confidence))
    
    def get_skill_by_name(self, skill_name: str, category: str = None) -> Optional[Dict]:
        """
        Get skill by name (case-insensitive) from taxonomy
        
        Args:
            skill_name: Name of the skill to find
            category: Optional category filter
            
        Returns:
            Skill data if found, None otherwise
        """
        try:
            query = self.supabase.table('skills_taxonomy').select('*')
            
            # Try exact name match first
            query = query.eq('canonical_name', skill_name)
            if category:
                query = query.eq('category', category)
            
            result = query.eq('status', 'active').execute()
            
            if result.data:
                return result.data[0]
            
            # Try case-insensitive match
            query = self.supabase.table('skills_taxonomy').select('*')
            query = query.ilike('canonical_name', skill_name)
            if category:
                query = query.eq('category', category)
            
            result = query.eq('status', 'active').execute()
            
            if result.data:
                return result.data[0]
            
            # Try alias matching
            result = self.supabase.table('skills_taxonomy').select('*').contains('aliases', [skill_name]).eq('status', 'active').execute()
            
            if result.data:
                return result.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting skill by name '{skill_name}': {str(e)}")
            return None
    
    def add_skill_to_taxonomy(self, skill_name: str, category: str, description: str = "",
                             source_type: str = "manual", organization: str = None,
                             subcategory: str = None) -> Optional[str]:
        """
        Directly add a skill to taxonomy (for auto-approved skills)
        
        Args:
            skill_name: Name of the skill
            category: Category of the skill
            description: Description of the skill
            source_type: Source type
            organization: Organization context
            subcategory: Optional subcategory
            
        Returns:
            skill_id if successful, None otherwise
        """
        try:
            # Generate unique skill_id
            skill_id = self._generate_skill_id(skill_name)
            
            # Create taxonomy entry
            taxonomy_data = {
                'skill_id': skill_id,
                'canonical_name': skill_name,
                'category': category,
                'subcategory': subcategory,
                'description': description,
                'source_type': source_type,
                'organization': organization,
                'confidence_score': 1.0,
                'status': 'active'
            }
            
            result = self.supabase.table('skills_taxonomy').insert(taxonomy_data).execute()
            
            if result.data:
                # Store embedding
                embedding_success = self.store_skill_embedding(
                    skill_id, skill_name, description, category
                )
                
                if embedding_success:
                    logger.info(f"Successfully added skill to taxonomy: '{skill_name}' (ID: {skill_id})")
                    return skill_id
                else:
                    logger.error(f"Added skill to taxonomy but failed to store embedding: {skill_id}")
                    return skill_id  # Still return the skill_id as the taxonomy entry was created
            
            return None
            
        except Exception as e:
            logger.error(f"Error adding skill to taxonomy '{skill_name}': {str(e)}")
            return None

    def add_skill_to_taxonomy_enhanced(self, skill_name: str, category: str, subcategory: str = None,
                                     description: str = "", source_type: str = "auto_created", 
                                     organization: str = None, aliases: list = None, keywords: list = None,
                                     industry_tags: list = None, confidence_score: float = 1.0, 
                                     created_by: str = None) -> str:
        """
        Add a new skill to the taxonomy with comprehensive metadata ensuring ALL columns are filled
        
        Args:
            skill_name: Name of the skill
            category: Category (technical_skills, soft_skills, etc.)
            subcategory: Subcategory for better organization
            description: Skill description
            source_type: How this skill was created
            organization: Organization context
            aliases: List of alternative names for this skill
            keywords: List of relevant keywords
            industry_tags: List of industry/domain tags
            confidence_score: Confidence score for this skill (0.0-1.0)
            created_by: UUID of user who created this skill
            
        Returns:
            str: skill_id if successful, None if failed
        """
        try:
            # Generate skill_id (normalized name)
            skill_id = self._generate_skill_id(skill_name)
            
            # Check if skill already exists
            existing = self.supabase.table('skills_taxonomy').select('*').eq('skill_id', skill_id).execute()
            if existing.data:
                logger.info(f"Skill '{skill_name}' already exists in taxonomy")
                # Update usage count
                self.increment_skill_usage(skill_id)
                return existing.data[0]['skill_id']
            
            # Ensure subcategory is determined if not provided
            if not subcategory:
                subcategory = self._determine_comprehensive_subcategory(skill_name, category, description)
                logger.info(f"Auto-determined subcategory for '{skill_name}': {subcategory}")
            
            # Generate comprehensive metadata if not provided
            if not aliases:
                aliases = self._generate_comprehensive_aliases(skill_name, category, subcategory)
            
            if not keywords:
                keywords = self._generate_comprehensive_keywords(skill_name, category, subcategory, description)
            
            if not industry_tags:
                industry_tags = self._determine_comprehensive_industry_tags(skill_name, category, subcategory, description)
            
            # Ensure description is meaningful
            if not description or len(description.strip()) < 10:
                description = self._generate_skill_description(skill_name, category, subcategory)
                logger.info(f"Auto-generated description for '{skill_name}'")
            
            # Determine competency ranges based on category and skill type
            competency_min, competency_max = self._determine_competency_ranges(category, subcategory)
            
            # Calculate confidence score if not provided or enhance existing
            if confidence_score == 1.0:  # Default value, recalculate
                confidence_score = self._calculate_enhanced_confidence_score(
                    skill_name, category, source_type, organization, description, subcategory
                )
            
            # Ensure confidence score is within valid range
            confidence_score = max(0.0, min(1.0, confidence_score))
            
            # Get current timestamp
            current_time = datetime.now().isoformat()
            
            # Prepare comprehensive skill data with ALL fields
            skill_data = {
                # Required fields
                'skill_id': skill_id,
                'canonical_name': skill_name.strip(),
                'category': category,
                
                # Enhanced optional fields with proper defaults
                'subcategory': subcategory,
                'description': description.strip() if description else f"Professional competency in {skill_name}",
                'competency_range_min': competency_min,
                'competency_range_max': competency_max,
                
                # Array fields with proper handling
                'aliases': aliases or [],
                'keywords': keywords or [],
                'industry_tags': industry_tags or [],
                
                # Metadata fields
                'source_type': source_type or 'auto_created',
                'organization': organization,
                'usage_count': 1,  # Start with 1 since we're creating it
                'confidence_score': round(confidence_score, 2),
                'status': 'active',
                
                # Timestamp fields
                'created_at': current_time,
                'updated_at': current_time,
                
                # User attribution (if available)
                'created_by': created_by,
                # approved_by and approved_at will be NULL for auto-created skills
            }
            
            # Log the comprehensive data being inserted
            logger.info(f"📝 Creating comprehensive skill entry for '{skill_name}':")
            logger.info(f"   📋 Category: {category} → Subcategory: {subcategory}")
            logger.info(f"   🏷️ Aliases: {len(aliases)} | Keywords: {len(keywords)} | Industry tags: {len(industry_tags)}")
            logger.info(f"   📊 Competency range: {competency_min}-{competency_max}")
            logger.info(f"   🎯 Confidence score: {confidence_score:.2f}")
            logger.info(f"   🔧 Source: {source_type} | Organization: {organization or 'N/A'}")
            
            # Insert with comprehensive data
            result = self.supabase.table('skills_taxonomy').insert(skill_data).execute()
            
            if result.data:
                # Store embedding with enhanced text content
                embedding_text = self._create_comprehensive_embedding_text(
                    skill_name, description, category, subcategory, aliases, keywords
                )
                
                embedding_success = self.store_skill_embedding(
                    skill_id, skill_name, embedding_text, category
                )
                
                if embedding_success:
                    logger.info(f"✅ Successfully added comprehensive skill '{skill_name}' to taxonomy")
                    logger.info(f"   🆔 Skill ID: {skill_id}")
                    logger.info(f"   📊 All {len(skill_data)} columns populated")
                    logger.info(f"   🎯 Vector embedding stored")
                else:
                    logger.warning(f"⚠️ Added skill to taxonomy but failed to store embedding: {skill_id}")
                
                return skill_id
            else:
                logger.error(f"❌ Failed to add skill '{skill_name}' to taxonomy - no data returned")
                return None
                
        except Exception as e:
            logger.error(f"💥 Error adding comprehensive skill to taxonomy: {str(e)}")
            import traceback
            logger.error(f"📍 Stack trace: {traceback.format_exc()}")
            return None

    def _determine_comprehensive_subcategory(self, skill_name: str, category: str, description: str = "") -> str:
        """Comprehensive subcategory determination covering all edge cases"""
        skill_lower = skill_name.lower()
        desc_lower = description.lower() if description else ""
        combined_text = f"{skill_lower} {desc_lower}"
        
        if category == 'technical_skills':
            # Programming Languages - Enhanced patterns
            programming_patterns = [
                'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust',
                'php', 'ruby', 'kotlin', 'swift', 'dart', 'scala', 'r', 'matlab', 'perl',
                'c programming', 'shell scripting', 'bash', 'powershell', 'sql', 'plsql',
                'html', 'css', 'scss', 'sass', 'lua', 'assembly', 'cobol', 'fortran'
            ]
            if any(lang in combined_text for lang in programming_patterns):
                return 'programming_languages'
            
            # Frameworks & Libraries - Enhanced patterns
            framework_patterns = [
                'react', 'vue', 'angular', 'svelte', 'django', 'flask', 'fastapi',
                'spring', 'express', 'nextjs', 'nuxt', 'laravel', 'rails', 'asp.net',
                'flutter', 'xamarin', 'ionic', 'bootstrap', 'tailwind', 'jquery',
                'redux', 'vuex', 'mobx', 'webpack', 'vite', 'babel', 'electron',
                'framework', 'library', '.js', '.css', 'ui library'
            ]
            if any(framework in combined_text for framework in framework_patterns):
                return 'frameworks_libraries'
            
            # Databases - Enhanced patterns
            database_patterns = [
                'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite',
                'oracle', 'sql server', 'cassandra', 'dynamodb', 'firestore', 'supabase',
                'neo4j', 'influxdb', 'clickhouse', 'database', 'db', 'nosql', 'rdbms'
            ]
            if any(db in combined_text for db in database_patterns):
                return 'databases'
            
            # Cloud & DevOps - Enhanced patterns
            cloud_devops_patterns = [
                'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform',
                'ansible', 'gitlab', 'github actions', 'ci/cd', 'devops', 'cloud',
                'helm', 'vagrant', 'chef', 'puppet', 'saltstack', 'nginx', 'apache',
                'load balancer', 'microservices', 'serverless', 'lambda'
            ]
            if any(tool in combined_text for tool in cloud_devops_patterns):
                return 'cloud_devops'
            
            # Mobile Development - Enhanced patterns
            mobile_patterns = [
                'ios', 'android', 'mobile', 'swift', 'objective-c', 'kotlin',
                'react native', 'flutter', 'xamarin', 'ionic', 'cordova', 'phonegap',
                'mobile development', 'app development', 'xcode', 'android studio'
            ]
            if any(mobile in combined_text for mobile in mobile_patterns):
                return 'mobile_development'
            
            # Data Science & AI - Enhanced patterns
            data_ai_patterns = [
                'machine learning', 'artificial intelligence', 'data science', 'tensorflow',
                'pytorch', 'scikit-learn', 'pandas', 'numpy', 'jupyter', 'data analysis',
                'deep learning', 'neural network', 'nlp', 'computer vision', 'ai',
                'ml', 'data mining', 'predictive modeling', 'statistics'
            ]
            if any(data_ai in combined_text for data_ai in data_ai_patterns):
                return 'data_science_ai'
            
            # Testing & QA - Enhanced patterns
            testing_patterns = [
                'testing', 'test automation', 'selenium', 'cypress', 'jest', 'vitest',
                'junit', 'pytest', 'unit test', 'integration test', 'e2e test',
                'quality assurance', 'qa', 'tdd', 'bdd', 'test driven'
            ]
            if any(test in combined_text for test in testing_patterns):
                return 'testing_qa'
            
            # Web Technologies - Enhanced patterns
            web_patterns = [
                'api', 'rest', 'graphql', 'websocket', 'http', 'json', 'xml',
                'web development', 'frontend', 'backend', 'full stack', 'web services',
                'oauth', 'jwt', 'authentication', 'authorization', 'cors'
            ]
            if any(web in combined_text for web in web_patterns):
                return 'web_technologies'
            
            # Development Tools - Enhanced patterns
            dev_tools_patterns = [
                'git', 'github', 'gitlab', 'bitbucket', 'vscode', 'intellij', 'eclipse',
                'vim', 'emacs', 'sublime', 'atom', 'postman', 'insomnia', 'jira',
                'confluence', 'slack', 'teams', 'ide', 'editor', 'version control'
            ]
            if any(tool in combined_text for tool in dev_tools_patterns):
                return 'development_tools'
            
            # Security - Enhanced patterns  
            security_patterns = [
                'security', 'cybersecurity', 'encryption', 'cryptography', 'ssl', 'tls',
                'oauth', 'saml', 'ldap', 'penetration testing', 'vulnerability',
                'firewall', 'network security', 'application security'
            ]
            if any(sec in combined_text for sec in security_patterns):
                return 'security'
            
            return 'general_technical'
            
        elif category == 'soft_skills':
            # Leadership patterns
            leadership_patterns = [
                'leadership', 'management', 'strategic', 'vision', 'decision making',
                'delegation', 'mentoring', 'coaching', 'team building', 'influence',
                'change management', 'performance management'
            ]
            if any(lead in combined_text for lead in leadership_patterns):
                return 'leadership'
            
            # Communication patterns
            communication_patterns = [
                'communication', 'presentation', 'public speaking', 'writing', 'listening',
                'negotiation', 'feedback', 'storytelling', 'cross-cultural'
            ]
            if any(comm in combined_text for comm in communication_patterns):
                return 'communication'
            
            # Cognitive patterns
            cognitive_patterns = [
                'thinking', 'problem solving', 'analytical', 'critical', 'creative',
                'research', 'learning', 'pattern recognition', 'logical reasoning',
                'systems thinking', 'attention to detail'
            ]
            if any(cog in combined_text for cog in cognitive_patterns):
                return 'cognitive'
            
            # Interpersonal patterns
            interpersonal_patterns = [
                'team', 'collaboration', 'empathy', 'relationship', 'networking',
                'cultural', 'social', 'customer service', 'interpersonal'
            ]
            if any(inter in combined_text for inter in interpersonal_patterns):
                return 'interpersonal'
            
            # Personal effectiveness patterns
            personal_patterns = [
                'time management', 'self', 'stress', 'motivation', 'work-life balance',
                'goal setting', 'accountability', 'resilience', 'organization'
            ]
            if any(personal in combined_text for personal in personal_patterns):
                return 'personal_effectiveness'
            
            # Adaptability patterns
            adaptability_patterns = [
                'adaptability', 'flexibility', 'change', 'innovation', 'continuous improvement'
            ]
            if any(adapt in combined_text for adapt in adaptability_patterns):
                return 'adaptability_innovation'
            
            # Project management patterns
            project_patterns = [
                'project', 'planning', 'resource', 'risk', 'stakeholder', 'milestone'
            ]
            if any(proj in combined_text for proj in project_patterns):
                return 'project_management'
            
            # Ethics patterns
            ethics_patterns = [
                'ethics', 'ethical', 'integrity', 'moral', 'values', 'principles'
            ]
            if any(eth in combined_text for eth in ethics_patterns):
                return 'ethics_integrity'
            
            return 'general_soft_skills'
            
        elif category == 'domain_knowledge':
            # Industry-specific patterns
            industry_patterns = {
                'fintech': ['financial', 'banking', 'payment', 'blockchain', 'cryptocurrency', 'trading', 'investment'],
                'healthcare': ['medical', 'healthcare', 'patient', 'clinical', 'hospital', 'pharmaceutical', 'hipaa'],
                'ecommerce_retail': ['ecommerce', 'retail', 'shopping', 'marketplace', 'inventory', 'pos'],
                'education_technology': ['education', 'learning', 'student', 'curriculum', 'lms', 'teaching'],
                'manufacturing_industrial': ['manufacturing', 'industrial', 'production', 'factory', 'supply chain'],
                'legal_compliance': ['legal', 'compliance', 'regulation', 'audit', 'gdpr', 'privacy'],
                'gaming_entertainment': ['gaming', 'game', 'entertainment', 'media', 'content'],
                'government_public_sector': ['government', 'public', 'civic', 'policy', 'municipal'],
                'energy_utilities': ['energy', 'utility', 'power', 'electric', 'renewable'],
                'real_estate_property': ['real estate', 'property', 'construction', 'building'],
                'transportation_logistics': ['transportation', 'logistics', 'shipping', 'delivery', 'fleet'],
                'insurance_risk': ['insurance', 'risk', 'claims', 'underwriting', 'actuarial']
            }
            
            for subcategory, patterns in industry_patterns.items():
                if any(pattern in combined_text for pattern in patterns):
                    return subcategory
            
            return 'general_domain'
            
        elif category == 'standard_operating_procedures':
            # SOP-specific patterns
            sop_patterns = {
                'code_quality_review': ['code review', 'pull request', 'coding standards', 'refactoring', 'documentation'],
                'security_compliance': ['security', 'privacy', 'access control', 'compliance', 'audit', 'backup'],
                'testing_qa_procedures': ['testing', 'quality assurance', 'bug reporting', 'test case', 'regression'],
                'deployment_operations': ['deployment', 'environment', 'monitoring', 'rollback', 'maintenance'],
                'project_management': ['agile', 'scrum', 'estimation', 'milestone', 'stakeholder'],
                'communication_collaboration': ['meeting', 'knowledge sharing', 'feedback', 'collaboration'],
                'incident_support': ['incident', 'support', 'escalation', 'customer service'],
                'data_management_privacy': ['data governance', 'data retention', 'database management', 'migration'],
                'development_standards': ['api design', 'performance optimization', 'ui/ux guidelines']
            }
            
            for subcategory, patterns in sop_patterns.items():
                if any(pattern in combined_text for pattern in patterns):
                    return subcategory
            
            return 'general_procedures'
        
        # Fallback
        return f'general_{category.replace("_", "")}'

    def _generate_comprehensive_aliases(self, skill_name: str, category: str, subcategory: str = None) -> list:
        """Generate comprehensive aliases for better skill matching"""
        aliases = []
        skill_lower = skill_name.lower()
        
        # Basic variations
        aliases.append(skill_name.title())  # Title case
        aliases.append(skill_name.upper())  # Upper case
        aliases.append(skill_name.replace('-', ' ').replace('_', ' '))  # Space variations
        aliases.append(skill_name.replace(' ', '-').replace('_', '-'))  # Hyphen variations
        aliases.append(skill_name.replace(' ', '_').replace('-', '_'))  # Underscore variations
        
        # Technology-specific aliases
        tech_aliases = {
            'javascript': ['JS', 'ECMAScript', 'ES6', 'ES2015', 'NodeJS'],
            'typescript': ['TS', 'TypeScript Programming'],
            'python': ['Python Programming', 'Python Development', 'Python Scripting'],
            'react': ['ReactJS', 'React.js', 'React Development'],
            'angular': ['AngularJS', 'Angular Framework'],
            'vue': ['VueJS', 'Vue.js', 'Vue Framework'],
            'node.js': ['NodeJS', 'Node', 'Node.js Development'],
            'aws': ['Amazon Web Services', 'Amazon AWS'],
            'gcp': ['Google Cloud Platform', 'Google Cloud'],
            'azure': ['Microsoft Azure', 'Azure Cloud']
        }
        
        for tech, tech_aliases_list in tech_aliases.items():
            if tech in skill_lower:
                aliases.extend(tech_aliases_list)
        
        # Remove duplicates and original name
        aliases = list(set([alias for alias in aliases if alias != skill_name and alias]))
        return aliases[:10]  # Limit to top 10
    
    def _generate_comprehensive_keywords(self, skill_name: str, category: str, subcategory: str = None, description: str = "") -> list:
        """Generate comprehensive keywords for semantic matching"""
        keywords = []
        
        # Extract words from skill name and description
        text_words = set()
        for text in [skill_name, description]:
            if text:
                words = text.lower().replace('-', ' ').replace('_', ' ').split()
                text_words.update([word.strip('.,()[]{}') for word in words if len(word) > 2])
        
        keywords.extend(list(text_words))
        
        # Category-specific keywords
        category_keywords = {
            'technical_skills': ['technology', 'programming', 'development', 'software', 'technical', 'coding'],
            'soft_skills': ['communication', 'leadership', 'teamwork', 'professional', 'behavioral'],
            'domain_knowledge': ['industry', 'business', 'domain', 'expertise', 'knowledge', 'specialized'],
            'standard_operating_procedures': ['procedure', 'process', 'workflow', 'standard', 'compliance', 'protocol']
        }
        
        if category in category_keywords:
            keywords.extend(category_keywords[category])
        
        # Subcategory-specific keywords
        if subcategory:
            subcategory_words = subcategory.replace('_', ' ').split()
            keywords.extend(subcategory_words)
        
        # Remove duplicates and short words
        keywords = list(set([kw for kw in keywords if len(kw) > 2]))
        return keywords[:15]  # Limit to top 15
    
    def _determine_comprehensive_industry_tags(self, skill_name: str, category: str, subcategory: str = None, description: str = "") -> list:
        """Determine comprehensive industry tags"""
        industry_tags = []
        combined_text = f"{skill_name} {description} {subcategory or ''}".lower()
        
        # Universal tags based on category
        if category == 'technical_skills':
            industry_tags.extend(['software_development', 'technology', 'it'])
            
        elif category == 'soft_skills':
            industry_tags.extend(['universal', 'professional_development', 'workplace'])
            
        # Industry-specific patterns
        industry_patterns = {
            'fintech': ['financial', 'banking', 'payment', 'blockchain', 'trading', 'investment'],
            'healthcare': ['medical', 'healthcare', 'clinical', 'pharmaceutical', 'hipaa'],
            'ecommerce': ['ecommerce', 'retail', 'shopping', 'marketplace'],
            'education': ['education', 'learning', 'academic', 'student'],
            'manufacturing': ['manufacturing', 'industrial', 'production'],
            'legal': ['legal', 'compliance', 'regulation', 'law'],
            'gaming': ['gaming', 'entertainment', 'media'],
            'government': ['government', 'public', 'civic'],
            'energy': ['energy', 'utility', 'power'],
            'real_estate': ['real estate', 'property', 'construction'],
            'transportation': ['transportation', 'logistics', 'shipping'],
            'insurance': ['insurance', 'risk', 'claims']
        }
        
        for industry, patterns in industry_patterns.items():
            if any(pattern in combined_text for pattern in patterns):
                industry_tags.append(industry)
        
        # Technology-specific tags
        if 'web' in combined_text or 'frontend' in combined_text or 'backend' in combined_text:
            industry_tags.append('web_development')
        if 'mobile' in combined_text or 'ios' in combined_text or 'android' in combined_text:
            industry_tags.append('mobile_development')
        if 'data' in combined_text or 'analytics' in combined_text:
            industry_tags.append('data_science')
        if 'cloud' in combined_text or 'aws' in combined_text or 'azure' in combined_text:
            industry_tags.append('cloud_computing')
        
        # Remove duplicates
        return list(set(industry_tags[:8]))  # Limit to 8 tags
    
    def _generate_skill_description(self, skill_name: str, category: str, subcategory: str = None) -> str:
        """Generate a meaningful skill description"""
        
        # Category-specific description templates
        templates = {
            'technical_skills': f"Professional competency in {skill_name}, including practical application, best practices, and integration within technical workflows.",
            'soft_skills': f"Demonstrated ability in {skill_name}, essential for effective workplace collaboration and professional development.",
            'domain_knowledge': f"Specialized knowledge and expertise in {skill_name}, including industry-specific concepts, practices, and applications.",
            'standard_operating_procedures': f"Proficiency in executing {skill_name} according to established protocols, ensuring compliance and quality standards."
        }
        
        base_description = templates.get(category, f"Professional competency in {skill_name}.")
        
        # Add subcategory context if available
        if subcategory:
            subcategory_readable = subcategory.replace('_', ' ').title()
            base_description += f" This skill falls within the {subcategory_readable} domain."
        
        return base_description
    
    def _determine_competency_ranges(self, category: str, subcategory: str = None) -> tuple:
        """Determine appropriate competency ranges based on category and subcategory"""
        
        # Default ranges by category
        ranges = {
            'technical_skills': (1, 100),
            'soft_skills': (1, 100), 
            'domain_knowledge': (1, 100),
            'standard_operating_procedures': (1, 100)
        }
        
        # All categories use full range for flexibility
        return ranges.get(category, (1, 100))
    
    def _calculate_enhanced_confidence_score(self, skill_name: str, category: str, source_type: str, 
                                           organization: str = None, description: str = "", 
                                           subcategory: str = None) -> float:
        """Calculate enhanced confidence score based on multiple factors"""
        
        base_score = 0.7  # Base confidence
        
        # Source type scoring
        source_scores = {
            'sop': 0.95,
            'domain_knowledge': 0.90,
            'auto_created': 0.75,
            'job_description': 0.70,
            'manual': 0.80
        }
        
        source_score = source_scores.get(source_type, 0.70)
        
        # Skill name quality scoring
        name_score = 0.8
        if len(skill_name.strip()) < 3:
            name_score = 0.5
        elif len(skill_name.strip()) > 50:
            name_score = 0.6
        elif ' ' in skill_name and len(skill_name.split()) > 1:
            name_score = 0.85  # Multi-word skills are often more specific
        
        # Description quality scoring
        desc_score = 0.7
        if description and len(description.strip()) > 20:
            desc_score = 0.9
        elif description and len(description.strip()) > 10:
            desc_score = 0.8
        
        # Subcategory scoring
        subcategory_score = 0.8
        if subcategory and subcategory != f'general_{category.replace("_", "")}':
            subcategory_score = 0.9
        
        # Organization scoring
        org_score = 0.8
        if organization:
            org_score = 0.85
        
        # Calculate weighted average
        final_score = (
            source_score * 0.3 +
            name_score * 0.25 +
            desc_score * 0.2 +
            subcategory_score * 0.15 +
            org_score * 0.1
        )
        
        # Ensure score is within valid range
        return max(0.0, min(1.0, final_score))
    
    def _create_comprehensive_embedding_text(self, skill_name: str, description: str, 
                                           category: str, subcategory: str = None, 
                                           aliases: list = None, keywords: list = None) -> str:
        """Create comprehensive text for embedding generation"""
        
        embedding_parts = [skill_name]
        
        if description:
            embedding_parts.append(description)
        
        if subcategory:
            embedding_parts.append(f"Category: {subcategory.replace('_', ' ')}")
        
        if aliases:
            embedding_parts.append(f"Also known as: {', '.join(aliases[:5])}")
        
        if keywords:
            embedding_parts.append(f"Related to: {', '.join(keywords[:8])}")
        
        return ' | '.join(embedding_parts)

    def create_pending_skill_enhanced(self, skill_name: str, category: str, subcategory: str = None,
                                    description: str = "", source_type: str = "job_description", 
                                    organization: str = None, suggested_competency: int = None,
                                    aliases: list = None, keywords: list = None, industry_tags: list = None,
                                    confidence_score: float = 0.7) -> Optional[str]:
        """
        Create a pending skill with comprehensive metadata for faster review and promotion
        
        Args:
            skill_name: Name of the skill
            category: Category of the skill
            subcategory: Subcategory for better organization
            description: Description of the skill
            source_type: Source type
            organization: Organization context
            suggested_competency: Suggested competency level
            aliases: List of alternative names for this skill
            keywords: List of relevant keywords
            industry_tags: List of industry/domain tags
            confidence_score: Confidence score for this skill (0.0-1.0)
            
        Returns:
            pending_id if successful, None if failed
        """
        try:
            # Generate comprehensive metadata if not provided
            if not subcategory:
                subcategory = self._determine_comprehensive_subcategory(skill_name, category, description)
            
            if not aliases:
                aliases = self._generate_comprehensive_aliases(skill_name, category, subcategory)
            
            if not keywords:
                keywords = self._generate_comprehensive_keywords(skill_name, category, subcategory, description)
            
            if not industry_tags:
                industry_tags = self._determine_comprehensive_industry_tags(skill_name, category, subcategory, description)
            
            if not description or len(description.strip()) < 10:
                description = self._generate_skill_description(skill_name, category, subcategory)
            
            # Create pending skill data with enhanced metadata
            pending_data = {
                'skill_name': skill_name.strip(),
                'category': category,
                'subcategory': subcategory,
                'description': description.strip(),
                'source_type': source_type,
                'organization': organization,
                'suggested_competency_level': suggested_competency,
                'confidence_score': round(confidence_score, 2),
                'status': 'pending',
                # Store metadata as JSON for easy promotion
                'metadata': {
                    'aliases': aliases or [],
                    'keywords': keywords or [],
                    'industry_tags': industry_tags or [],
                    'auto_generated_metadata': True,
                    'competency_range_min': 1,
                    'competency_range_max': 100
                }
            }
            
            logger.info(f"📝 Creating comprehensive pending skill for '{skill_name}':")
            logger.info(f"   📋 Category: {category} → Subcategory: {subcategory}")
            logger.info(f"   🏷️ Generated {len(aliases)} aliases, {len(keywords)} keywords, {len(industry_tags)} industry tags")
            logger.info(f"   🎯 Confidence score: {confidence_score:.2f}")
            
            result = self.supabase.table('pending_skills').insert(pending_data).execute()
            
            if result.data:
                pending_id = result.data[0]['id']
                logger.info(f"✅ Created comprehensive pending skill: '{skill_name}' (ID: {pending_id})")
                logger.info(f"   📋 Pre-generated metadata ready for promotion")
                return pending_id
            
            return None
            
        except Exception as e:
            logger.error(f"💥 Error creating comprehensive pending skill '{skill_name}': {str(e)}")
            import traceback
            logger.error(f"📍 Stack trace: {traceback.format_exc()}")
            return None 