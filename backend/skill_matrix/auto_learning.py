"""
Auto-Learning Skills Taxonomy System
=====================================

This module provides functionality for automatically learning and improving the skills taxonomy
based on usage patterns, frequency analysis, and quality metrics.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import defaultdict, Counter
from supabase import create_client, Client
from dotenv import load_dotenv

# Import skills service
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from services.skills_embedding_service import SkillsEmbeddingService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Initialize clients
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    skills_service = SkillsEmbeddingService()
    logger.info("Auto-learning system initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize auto-learning system: {str(e)}")
    supabase = None
    skills_service = None


class AutoLearningEngine:
    """Engine for automatically learning and improving skills taxonomy"""
    
    def __init__(self):
        self.supabase = supabase
        self.skills_service = skills_service
        
    def analyze_pending_skills(self, min_frequency: int = 3, days_back: int = 30) -> Dict:
        """
        Analyze pending skills to identify candidates for auto-promotion
        
        Args:
            min_frequency: Minimum times a skill must appear to be considered
            days_back: How many days back to analyze
            
        Returns:
            Dict containing analysis results and recommendations
        """
        try:
            # Get pending skills from the last N days
            cutoff_date = (datetime.now() - timedelta(days=days_back)).isoformat()
            
            result = self.supabase.table('pending_skills').select('*').gte('created_at', cutoff_date).execute()
            
            if not result.data:
                logger.info("No pending skills found for analysis")
                return {"candidates": [], "statistics": {}}
            
            # Analyze frequency patterns
            skill_frequency = defaultdict(list)
            category_stats = defaultdict(int)
            source_stats = defaultdict(int)
            
            for skill in result.data:
                skill_key = (skill['skill_name'], skill['category'])
                skill_frequency[skill_key].append(skill)
                category_stats[skill['category']] += 1
                source_stats[skill['source_type']] += 1
            
            # Find auto-promotion candidates
            candidates = []
            for (skill_name, category), skill_instances in skill_frequency.items():
                if len(skill_instances) >= min_frequency:
                    # Calculate quality metrics
                    quality_score = self._calculate_quality_score(skill_instances)
                    
                    candidate = {
                        'skill_name': skill_name,
                        'category': category,
                        'frequency': len(skill_instances),
                        'quality_score': quality_score,
                        'organizations': list(set(s['organization'] for s in skill_instances if s['organization'])),
                        'sources': list(set(s['source_type'] for s in skill_instances)),
                        'descriptions': [s['description'] for s in skill_instances if s['description']],
                        'should_auto_promote': quality_score > 0.7,
                        'instances': skill_instances
                    }
                    candidates.append(candidate)
            
            # Sort by frequency and quality
            candidates.sort(key=lambda x: (x['frequency'], x['quality_score']), reverse=True)
            
            analysis = {
                'candidates': candidates,
                'statistics': {
                    'total_pending': len(result.data),
                    'unique_skills': len(skill_frequency),
                    'auto_promotion_candidates': len([c for c in candidates if c['should_auto_promote']]),
                    'category_breakdown': dict(category_stats),
                    'source_breakdown': dict(source_stats),
                    'analysis_period_days': days_back
                }
            }
            
            logger.info(f"📊 Analysis complete: {len(candidates)} candidates found, {analysis['statistics']['auto_promotion_candidates']} recommended for auto-promotion")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing pending skills: {str(e)}")
            return {"candidates": [], "statistics": {}}
    
    def auto_promote_skills(self, analysis_results: Dict = None, dry_run: bool = True) -> Dict:
        """
        Automatically promote high-quality, frequently requested skills to taxonomy
        
        Args:
            analysis_results: Results from analyze_pending_skills (will run if not provided)
            dry_run: If True, only log what would be done without making changes
            
        Returns:
            Dict containing promotion results
        """
        try:
            if not analysis_results:
                analysis_results = self.analyze_pending_skills()
            
            candidates = [c for c in analysis_results['candidates'] if c['should_auto_promote']]
            
            if not candidates:
                logger.info("No skills qualify for auto-promotion")
                return {"promoted": 0, "failed": 0, "details": []}
            
            promoted = 0
            failed = 0
            details = []
            
            for candidate in candidates:
                try:
                    if dry_run:
                        logger.info(f"🏃 DRY RUN: Would promote '{candidate['skill_name']}' (frequency: {candidate['frequency']}, quality: {candidate['quality_score']:.2f})")
                        details.append({
                            'skill_name': candidate['skill_name'],
                            'action': 'would_promote',
                            'reason': f"Frequency: {candidate['frequency']}, Quality: {candidate['quality_score']:.2f}"
                        })
                        promoted += 1
                    else:
                        # Actually promote the skill
                        success = self._promote_skill_to_taxonomy(candidate)
                        if success:
                            logger.info(f"✅ Auto-promoted '{candidate['skill_name']}' to taxonomy")
                            # Update pending skills status
                            self._mark_pending_skills_as_auto_promoted(candidate)
                            promoted += 1
                            details.append({
                                'skill_name': candidate['skill_name'],
                                'action': 'promoted',
                                'reason': f"Auto-promoted due to high frequency and quality"
                            })
                        else:
                            logger.error(f"❌ Failed to promote '{candidate['skill_name']}'")
                            failed += 1
                            details.append({
                                'skill_name': candidate['skill_name'],
                                'action': 'failed',
                                'reason': 'Promotion to taxonomy failed'
                            })
                            
                except Exception as e:
                    logger.error(f"Error promoting skill '{candidate['skill_name']}': {str(e)}")
                    failed += 1
            
            result = {
                "promoted": promoted,
                "failed": failed,
                "details": details,
                "dry_run": dry_run
            }
            
            if dry_run:
                logger.info(f"🏃 DRY RUN COMPLETE: Would promote {promoted} skills")
            else:
                logger.info(f"🎓 AUTO-PROMOTION COMPLETE: Promoted {promoted} skills, {failed} failed")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in auto-promotion process: {str(e)}")
            return {"promoted": 0, "failed": 0, "details": [], "error": str(e)}
    
    def get_taxonomy_health_metrics(self) -> Dict:
        """Get metrics about the current state of the skills taxonomy"""
        try:
            # Get taxonomy stats
            taxonomy_result = self.supabase.table('skills_taxonomy').select('category, status').execute()
            taxonomy_skills = taxonomy_result.data if taxonomy_result.data else []
            
            # Get pending skills stats
            pending_result = self.supabase.table('pending_skills').select('category, status').execute()
            pending_skills = pending_result.data if pending_result.data else []
            
            # Calculate metrics
            taxonomy_by_category = Counter(skill['category'] for skill in taxonomy_skills)
            pending_by_category = Counter(skill['category'] for skill in pending_skills)
            
            total_taxonomy = len(taxonomy_skills)
            total_pending = len(pending_skills)
            
            health_score = self._calculate_taxonomy_health_score(total_taxonomy, total_pending)
            
            metrics = {
                'taxonomy_skills': {
                    'total': total_taxonomy,
                    'by_category': dict(taxonomy_by_category)
                },
                'pending_skills': {
                    'total': total_pending,
                    'by_category': dict(pending_by_category)
                },
                'health_score': health_score,
                'recommendations': self._generate_health_recommendations(total_taxonomy, total_pending, pending_by_category),
                'generated_at': datetime.now().isoformat()
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating taxonomy health metrics: {str(e)}")
            return {"error": str(e)}
    
    def _calculate_quality_score(self, skill_instances: List[Dict]) -> float:
        """Calculate quality score for a skill based on various factors"""
        if not skill_instances:
            return 0.0
        
        score = 0.5  # Base score
        
        # Frequency bonus (more frequent = higher quality)
        frequency = len(skill_instances)
        if frequency >= 5:
            score += 0.3
        elif frequency >= 3:
            score += 0.2
        
        # Source diversity bonus
        sources = set(instance['source_type'] for instance in skill_instances)
        if len(sources) > 1:
            score += 0.1
        
        # Organization diversity bonus
        organizations = set(instance['organization'] for instance in skill_instances if instance['organization'])
        if len(organizations) > 1:
            score += 0.1
        
        # Description quality bonus
        descriptions = [instance['description'] for instance in skill_instances if instance['description']]
        if descriptions and any(len(desc) > 50 for desc in descriptions):
            score += 0.1
        
        return min(1.0, score)
    
    def _promote_skill_to_taxonomy(self, candidate: Dict) -> bool:
        """Promote a skill candidate to the main taxonomy with enhanced metadata"""
        try:
            # Use the best description available
            descriptions = [desc for desc in candidate['descriptions'] if desc]
            best_description = max(descriptions, key=len) if descriptions else ""
            
            # Try to get metadata from any instance that has it
            metadata = {}
            for instance in candidate['instances']:
                if instance.get('metadata'):
                    metadata = instance['metadata']
                    break
            
            # Generate metadata if not available
            if not metadata.get('auto_generated_metadata'):
                from skill_matrix.generate_skill_matrix import (
                    determine_skill_subcategory, generate_skill_aliases, 
                    generate_skill_keywords, determine_industry_tags,
                    calculate_skill_confidence_score
                )
                
                subcategory = determine_skill_subcategory(candidate['skill_name'], candidate['category'], best_description)
                aliases = generate_skill_aliases(candidate['skill_name'], candidate['category'], subcategory)
                keywords = generate_skill_keywords(candidate['skill_name'], candidate['category'], subcategory, best_description)
                industry_tags = determine_industry_tags(candidate['skill_name'], candidate['category'], subcategory, best_description)
                confidence_score = calculate_skill_confidence_score(
                    candidate['skill_name'], candidate['category'], 'auto_promoted',
                    candidate['organizations'][0] if candidate['organizations'] else None, best_description
                )
                
                # Create the skill in taxonomy with full metadata
                skill_id = self.skills_service.add_skill_to_taxonomy_enhanced(
                    skill_name=candidate['skill_name'],
                    category=candidate['category'],
                    subcategory=subcategory,
                    description=best_description,
                    source_type='auto_promoted',
                    organization=candidate['organizations'][0] if candidate['organizations'] else None,
                    aliases=aliases,
                    keywords=keywords,
                    industry_tags=industry_tags,
                    confidence_score=confidence_score
                )
            else:
                # Use pre-generated metadata
                skill_id = self.skills_service.add_skill_to_taxonomy_enhanced(
                    skill_name=candidate['skill_name'],
                    category=candidate['category'],
                    subcategory=metadata.get('subcategory'),
                    description=best_description,
                    source_type='auto_promoted',
                    organization=candidate['organizations'][0] if candidate['organizations'] else None,
                    aliases=metadata.get('aliases', []),
                    keywords=metadata.get('keywords', []),
                    industry_tags=metadata.get('industry_tags', []),
                    confidence_score=candidate['quality_score']
                )
            
            return skill_id is not None
            
        except Exception as e:
            logger.error(f"Error promoting skill to taxonomy: {str(e)}")
            return False
    
    def _mark_pending_skills_as_auto_promoted(self, candidate: Dict):
        """Mark pending skill instances as auto-promoted"""
        try:
            for instance in candidate['instances']:
                self.supabase.table('pending_skills').update({
                    'status': 'auto_promoted',
                    'reviewed_at': datetime.now().isoformat(),
                    'review_notes': f'Auto-promoted due to frequency ({candidate["frequency"]}) and quality score ({candidate["quality_score"]:.2f})'
                }).eq('id', instance['id']).execute()
                
        except Exception as e:
            logger.error(f"Error marking pending skills as auto-promoted: {str(e)}")
    
    def _calculate_taxonomy_health_score(self, total_taxonomy: int, total_pending: int) -> float:
        """Calculate overall health score of the taxonomy (0-100)"""
        if total_taxonomy == 0:
            return 0.0
        
        # Ratio of taxonomy to pending skills (higher is better)
        ratio_score = min(100, (total_taxonomy / max(1, total_pending)) * 20)
        
        # Absolute size bonus (having a good base size is important)
        size_score = min(30, total_taxonomy / 2)  # 30 points max for having 60+ skills
        
        # Penalty for too many pending skills
        pending_penalty = min(20, total_pending / 5)  # Penalty grows with pending count
        
        health_score = ratio_score + size_score - pending_penalty
        return max(0, min(100, health_score))
    
    def _generate_health_recommendations(self, total_taxonomy: int, total_pending: int, pending_by_category: Counter) -> List[str]:
        """Generate recommendations for improving taxonomy health"""
        recommendations = []
        
        if total_taxonomy < 20:
            recommendations.append("Taxonomy is quite small - consider reviewing and promoting more pending skills")
        
        if total_pending > total_taxonomy:
            recommendations.append("High number of pending skills - run auto-promotion process more frequently")
        
        # Category-specific recommendations
        for category, count in pending_by_category.items():
            if count > 10:
                recommendations.append(f"High number of pending {category} skills ({count}) - consider manual review and batch promotion")
        
        if not recommendations:
            recommendations.append("Taxonomy health looks good!")
        
        return recommendations


# Utility functions for manual use
def run_auto_learning_analysis():
    """Run a complete auto-learning analysis and return results"""
    engine = AutoLearningEngine()
    
    logger.info("🧠 Starting auto-learning analysis...")
    
    # Get analysis
    analysis = engine.analyze_pending_skills()
    
    # Get health metrics
    health = engine.get_taxonomy_health_metrics()
    
    # Simulate auto-promotion (dry run)
    promotion_preview = engine.auto_promote_skills(analysis, dry_run=True)
    
    results = {
        'analysis': analysis,
        'health_metrics': health,
        'promotion_preview': promotion_preview,
        'timestamp': datetime.now().isoformat()
    }
    
    logger.info("🧠 Auto-learning analysis complete")
    return results

def execute_auto_promotion(dry_run: bool = True):
    """Execute the auto-promotion process"""
    engine = AutoLearningEngine()
    
    logger.info(f"🚀 Starting auto-promotion process (dry_run={dry_run})...")
    
    # Run analysis and promotion
    analysis = engine.analyze_pending_skills()
    results = engine.auto_promote_skills(analysis, dry_run=dry_run)
    
    logger.info("🚀 Auto-promotion process complete")
    return results 