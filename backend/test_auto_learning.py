"""
Test Auto-Learning Skills Taxonomy System
=========================================

Test script to validate the auto-learning functionality and demonstrate how it works.
"""

import os
import sys
import logging
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from skill_matrix.auto_learning import AutoLearningEngine, run_auto_learning_analysis, execute_auto_promotion
from services.skills_embedding_service import SkillsEmbeddingService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_auto_learning_system():
    """Test the complete auto-learning system"""
    
    logger.info("🧪 Testing Auto-Learning Skills Taxonomy System")
    logger.info("=" * 60)
    
    try:
        # Initialize the auto-learning engine
        engine = AutoLearningEngine()
        
        if not engine.supabase or not engine.skills_service:
            logger.error("❌ Auto-learning engine initialization failed")
            return False
        
        logger.info("✅ Auto-learning engine initialized successfully")
        
        # Test 1: Analyze pending skills
        logger.info("\n📊 Test 1: Analyzing pending skills...")
        analysis_results = engine.analyze_pending_skills(min_frequency=2, days_back=60)
        
        if 'error' in analysis_results:
            logger.error(f"❌ Analysis failed: {analysis_results['error']}")
            return False
        
        stats = analysis_results['statistics']
        logger.info(f"✅ Analysis complete:")
        logger.info(f"   - Total pending skills: {stats.get('total_pending', 0)}")
        logger.info(f"   - Unique skills: {stats.get('unique_skills', 0)}")
        logger.info(f"   - Auto-promotion candidates: {stats.get('auto_promotion_candidates', 0)}")
        
        # Show some candidates
        candidates = analysis_results.get('candidates', [])
        if candidates:
            logger.info(f"\n🎯 Top auto-promotion candidates:")
            for i, candidate in enumerate(candidates[:3]):  # Show top 3
                logger.info(f"   {i+1}. {candidate['skill_name']} ({candidate['category']})")
                logger.info(f"      Frequency: {candidate['frequency']}, Quality: {candidate['quality_score']:.2f}")
                logger.info(f"      Should auto-promote: {candidate['should_auto_promote']}")
        
        # Test 2: Get taxonomy health metrics
        logger.info("\n🏥 Test 2: Getting taxonomy health metrics...")
        health_metrics = engine.get_taxonomy_health_metrics()
        
        if 'error' in health_metrics:
            logger.error(f"❌ Health metrics failed: {health_metrics['error']}")
            return False
        
        logger.info(f"✅ Health metrics retrieved:")
        logger.info(f"   - Taxonomy skills: {health_metrics['taxonomy_skills']['total']}")
        logger.info(f"   - Pending skills: {health_metrics['pending_skills']['total']}")
        logger.info(f"   - Health score: {health_metrics['health_score']:.1f}/100")
        
        recommendations = health_metrics.get('recommendations', [])
        if recommendations:
            logger.info(f"   - Recommendations:")
            for rec in recommendations:
                logger.info(f"     • {rec}")
        
        # Test 3: Simulate auto-promotion (dry run)
        logger.info("\n🏃 Test 3: Simulating auto-promotion (dry run)...")
        promotion_results = engine.auto_promote_skills(analysis_results, dry_run=True)
        
        if 'error' in promotion_results:
            logger.error(f"❌ Auto-promotion simulation failed: {promotion_results['error']}")
            return False
        
        logger.info(f"✅ Auto-promotion simulation complete:")
        logger.info(f"   - Would promote: {promotion_results['promoted']} skills")
        logger.info(f"   - Would fail: {promotion_results['failed']} skills")
        
        # Show what would be promoted
        details = promotion_results.get('details', [])
        would_promote = [d for d in details if d['action'] == 'would_promote']
        if would_promote:
            logger.info(f"\n📈 Skills that would be auto-promoted:")
            for detail in would_promote:
                logger.info(f"   • {detail['skill_name']} - {detail['reason']}")
        
        # Test 4: Test utility functions
        logger.info("\n🛠 Test 4: Testing utility functions...")
        
        # Test run_auto_learning_analysis function
        logger.info("   Testing run_auto_learning_analysis()...")
        complete_analysis = run_auto_learning_analysis()
        
        if 'analysis' in complete_analysis and 'health_metrics' in complete_analysis:
            logger.info("   ✅ Complete analysis function works")
        else:
            logger.error("   ❌ Complete analysis function failed")
            return False
        
        # Test execute_auto_promotion function (dry run)
        logger.info("   Testing execute_auto_promotion() (dry run)...")
        promotion_test = execute_auto_promotion(dry_run=True)
        
        if 'promoted' in promotion_test:
            logger.info("   ✅ Auto-promotion function works")
        else:
            logger.error("   ❌ Auto-promotion function failed")
            return False
        
        logger.info("\n🎉 All tests passed successfully!")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Test failed with exception: {str(e)}")
        return False

def demo_skill_creation_scenarios():
    """Demonstrate different skill creation scenarios"""
    
    logger.info("🎭 Demonstrating Auto-Learning Scenarios")
    logger.info("=" * 50)
    
    try:
        skills_service = SkillsEmbeddingService()
        
        # Scenario 1: Common technical skill (should auto-create)
        logger.info("\n📝 Scenario 1: Common technical skill")
        logger.info("   Creating skill: 'React.js' (technical_skills)")
        
        # This would be called from the skill matrix generation
        from skill_matrix.generate_skill_matrix import determine_auto_creation_eligibility
        
        should_auto_create = determine_auto_creation_eligibility(
            skill_name="React.js",
            category="technical_skills", 
            source_type="job_description",
            organization="Tech Company Inc",
            description="React.js framework for building user interfaces"
        )
        
        logger.info(f"   Result: {'✅ Auto-create' if should_auto_create else '📝 Pending review'}")
        
        # Scenario 2: SOP skill (should auto-create)
        logger.info("\n📝 Scenario 2: SOP skill")
        logger.info("   Creating skill: 'Customer Onboarding Process' (sop_skills)")
        
        should_auto_create = determine_auto_creation_eligibility(
            skill_name="Customer Onboarding Process",
            category="sop_skills",
            source_type="sop",
            organization="Adivirtus AI",
            description="Standard operating procedure for customer onboarding"
        )
        
        logger.info(f"   Result: {'✅ Auto-create' if should_auto_create else '📝 Pending review'}")
        
        # Scenario 3: Obscure skill (should require review)
        logger.info("\n📝 Scenario 3: Obscure/custom skill")
        logger.info("   Creating skill: 'Quantum Programming Paradigms' (technical_skills)")
        
        should_auto_create = determine_auto_creation_eligibility(
            skill_name="Quantum Programming Paradigms",
            category="technical_skills",
            source_type="job_description", 
            organization="Unknown Company",
            description="Advanced quantum computing concepts"
        )
        
        logger.info(f"   Result: {'✅ Auto-create' if should_auto_create else '📝 Pending review'}")
        
        logger.info("\n🎭 Scenario demonstration complete!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Scenario demonstration failed: {str(e)}")
        return False

def show_current_taxonomy_stats():
    """Show current state of skills taxonomy"""
    
    logger.info("📊 Current Skills Taxonomy Statistics")
    logger.info("=" * 40)
    
    try:
        skills_service = SkillsEmbeddingService()
        
        # Get taxonomy stats
        taxonomy_result = skills_service.supabase.table('skills_taxonomy').select('category, status').execute()
        taxonomy_skills = taxonomy_result.data if taxonomy_result.data else []
        
        # Get pending stats
        pending_result = skills_service.supabase.table('pending_skills').select('category, status').execute()
        pending_skills = pending_result.data if pending_result.data else []
        
        # Count by category
        from collections import Counter
        taxonomy_by_category = Counter(skill['category'] for skill in taxonomy_skills)
        pending_by_category = Counter(skill['category'] for skill in pending_skills)
        
        logger.info(f"\n📚 Skills Taxonomy ({len(taxonomy_skills)} total):")
        for category, count in taxonomy_by_category.items():
            logger.info(f"   - {category}: {count}")
        
        logger.info(f"\n⏳ Pending Skills ({len(pending_skills)} total):")
        for category, count in pending_by_category.items():
            logger.info(f"   - {category}: {count}")
        
        # Calculate ratio
        if len(taxonomy_skills) > 0:
            ratio = len(pending_skills) / len(taxonomy_skills)
            logger.info(f"\n📈 Pending/Taxonomy Ratio: {ratio:.2f}")
            
            if ratio > 1:
                logger.info("   ⚠️ High pending ratio - consider running auto-promotion")
            elif ratio > 0.5:
                logger.info("   📊 Moderate pending ratio - monitor regularly")
            else:
                logger.info("   ✅ Good pending ratio - taxonomy is healthy")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to get taxonomy stats: {str(e)}")
        return False

if __name__ == "__main__":
    """Main test execution"""
    
    print("🧠 Auto-Learning Skills Taxonomy Test Suite")
    print("=" * 60)
    
    # Show current state
    show_current_taxonomy_stats()
    
    # Run main tests
    success = test_auto_learning_system()
    
    # Demo scenarios
    demo_skill_creation_scenarios()
    
    # Final result
    if success:
        print("\n✅ All tests completed successfully!")
        print("🚀 Auto-learning system is ready to use!")
    else:
        print("\n❌ Some tests failed. Check logs for details.")
    
    print("=" * 60) 