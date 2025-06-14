#!/usr/bin/env python3
"""
Test SOP and Domain Knowledge Auto-Addition to Taxonomy
"""

import logging
from skill_matrix.generate_skill_matrix import generate_ideal_skill_matrix
from services.skills_embedding_service import SkillsEmbeddingService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test data with NEW skills not in initial taxonomy
TEST_JOB_DESCRIPTION = {
    "title": "Data Scientist",
    "description": "We are looking for a Data Scientist to join our team",
    "requirements": ["Python", "Machine Learning", "Statistics"]
}

TEST_SOP_DATA = {
    "purpose": "Data processing and model deployment procedures",
    "procedures": [
        {
            "name": "ML Model Validation Process",
            "steps": ["Cross-validation", "A/B testing", "Performance monitoring"]
        },
        {
            "name": "Data Quality Assurance",
            "steps": ["Data profiling", "Anomaly detection", "Schema validation"]
        }
    ]
}

TEST_DOMAIN_KNOWLEDGE = {
    "domain_info": {
        "primary_domain": "Healthcare Analytics",
        "sub_domains": ["Clinical Data Analysis", "Patient Outcome Prediction"]
    },
    "technologies": ["FHIR Standards", "Clinical Decision Support Systems"],
    "methodologies": ["Evidence-Based Medicine", "Predictive Modeling"]
}

def test_taxonomy_auto_addition():
    """Test that SOP and domain knowledge skills are automatically added to taxonomy"""
    
    logger.info("Testing automatic taxonomy addition for SOP and domain knowledge skills...")
    
    # Initialize skills service to check taxonomy before/after
    skills_service = SkillsEmbeddingService()
    
    # Check initial taxonomy size
    initial_result = skills_service.supabase.table('skills_taxonomy').select('count', count='exact').execute()
    initial_count = initial_result.count
    logger.info(f"Initial taxonomy size: {initial_count} skills")
    
    # Generate skill matrix with SOP and domain knowledge
    skill_matrix = generate_ideal_skill_matrix(
        job_description_data=TEST_JOB_DESCRIPTION,
        user_id="test_sop_user",
        assessment_id="test_sop_assessment",
        sop_data=TEST_SOP_DATA,
        domain_knowledge_data=TEST_DOMAIN_KNOWLEDGE
    )
    
    # Check final taxonomy size
    final_result = skills_service.supabase.table('skills_taxonomy').select('count', count='exact').execute()
    final_count = final_result.count
    logger.info(f"Final taxonomy size: {final_count} skills")
    
    # Calculate new skills added
    new_skills_added = final_count - initial_count
    logger.info(f"New skills automatically added: {new_skills_added}")
    
    # Check for SOP skills in taxonomy
    sop_skills = skills_service.supabase.table('skills_taxonomy').select('*').eq('source_type', 'sop').execute()
    logger.info(f"SOP skills in taxonomy: {len(sop_skills.data)}")
    
    # Check for domain knowledge skills in taxonomy
    domain_skills = skills_service.supabase.table('skills_taxonomy').select('*').eq('source_type', 'domain_knowledge').execute()
    logger.info(f"Domain knowledge skills in taxonomy: {len(domain_skills.data)}")
    
    # Verify skills in generated matrix have taxonomy matches
    sop_skills_in_matrix = skill_matrix.get('standard_operating_procedures', [])
    domain_skills_in_matrix = skill_matrix.get('domain_knowledge', [])
    
    logger.info(f"SOP skills in matrix: {len(sop_skills_in_matrix)}")
    logger.info(f"Domain knowledge skills in matrix: {len(domain_skills_in_matrix)}")
    
    # Check taxonomy matching for SOP skills
    sop_taxonomy_matched = sum(1 for skill in sop_skills_in_matrix if skill.get('taxonomy_matched', False))
    domain_taxonomy_matched = sum(1 for skill in domain_skills_in_matrix if skill.get('taxonomy_matched', False))
    
    logger.info(f"SOP skills matched to taxonomy: {sop_taxonomy_matched}/{len(sop_skills_in_matrix)}")
    logger.info(f"Domain skills matched to taxonomy: {domain_taxonomy_matched}/{len(domain_skills_in_matrix)}")
    
    # Test results
    success = True
    
    if new_skills_added == 0:
        logger.warning("⚠️  No new skills were added to taxonomy - this might indicate an issue")
        success = False
    
    if sop_taxonomy_matched < len(sop_skills_in_matrix) * 0.8:  # 80% threshold
        logger.warning("⚠️  Low SOP skill taxonomy matching rate")
        success = False
    
    if domain_taxonomy_matched < len(domain_skills_in_matrix) * 0.8:  # 80% threshold
        logger.warning("⚠️  Low domain knowledge skill taxonomy matching rate")
        success = False
    
    if success:
        logger.info("✅ SOP and Domain Knowledge auto-addition test PASSED!")
    else:
        logger.error("❌ SOP and Domain Knowledge auto-addition test FAILED!")
    
    return success

if __name__ == "__main__":
    logger.info("Starting SOP and Domain Knowledge Auto-Addition Test")
    logger.info("=" * 60)
    
    test_passed = test_taxonomy_auto_addition()
    
    if test_passed:
        logger.info("\n🎉 AUTO-ADDITION TEST PASSED!")
        logger.info("SOP and domain knowledge skills are being automatically added to taxonomy.")
    else:
        logger.error("\n❌ AUTO-ADDITION TEST FAILED!")
        logger.error("Check the implementation for issues with auto-addition logic.") 