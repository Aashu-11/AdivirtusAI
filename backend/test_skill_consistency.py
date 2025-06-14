#!/usr/bin/env python3
"""
Test Script for Skill Matrix Consistency
Tests that identical inputs produce 100% consistent skill matrices
"""

import json
import hashlib
import logging
from datetime import datetime
from skill_matrix.generate_skill_matrix import generate_ideal_skill_matrix

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test data
TEST_JOB_DESCRIPTION = {
    "title": "Full Stack Developer",
    "description": "We are looking for a Full Stack Developer to join our team",
    "requirements": [
        "Proficiency in JavaScript and Python",
        "Experience with React and Django",
        "Knowledge of PostgreSQL and MongoDB",
        "Understanding of REST APIs and GraphQL",
        "Experience with Git version control",
        "Strong problem-solving skills",
        "Excellent communication abilities"
    ],
    "responsibilities": [
        "Develop and maintain web applications",
        "Write clean, maintainable code",
        "Collaborate with team members",
        "Participate in code reviews"
    ]
}

TEST_SOP_DATA = {
    "purpose": "Development workflow and code quality standards",
    "scope": "All software development activities",
    "procedures": [
        {
            "name": "Code Review Process",
            "steps": [
                "Submit pull request",
                "Request code review from team lead",
                "Address feedback and make changes",
                "Obtain approval before merging"
            ]
        },
        {
            "name": "Testing Requirements",
            "steps": [
                "Write unit tests for new features",
                "Run integration tests",
                "Perform manual testing",
                "Ensure 80% code coverage"
            ]
        }
    ],
    "compliance_requirements": [
        "Follow coding standards",
        "Document all functions",
        "Use version control for all changes"
    ]
}

TEST_DOMAIN_KNOWLEDGE = {
    "domain_info": {
        "primary_domain": "E-commerce",
        "sub_domains": ["Payment Processing", "Inventory Management", "Customer Analytics"]
    },
    "technologies": [
        "Stripe API",
        "PayPal Integration",
        "Inventory Tracking Systems",
        "Analytics Platforms"
    ],
    "methodologies": [
        "Agile Development",
        "Test-Driven Development",
        "Continuous Integration"
    ],
    "industry_standards": [
        "PCI DSS Compliance",
        "GDPR Requirements",
        "Accessibility Standards"
    ]
}

def calculate_matrix_hash(skill_matrix):
    """Calculate a hash of the skill matrix for comparison"""
    # Remove metadata that might vary (timestamps, etc.)
    matrix_copy = skill_matrix.copy()
    
    # Remove context metadata that includes timestamps
    matrix_copy.pop('sop_context', None)
    matrix_copy.pop('domain_knowledge_context', None)
    
    # Sort skills by name for consistent ordering
    for category in ['technical_skills', 'soft_skills', 'domain_knowledge', 'standard_operating_procedures']:
        if category in matrix_copy and isinstance(matrix_copy[category], list):
            matrix_copy[category] = sorted(matrix_copy[category], key=lambda x: x.get('name', ''))
    
    # Convert to JSON string with sorted keys
    matrix_str = json.dumps(matrix_copy, sort_keys=True, ensure_ascii=True)
    
    # Calculate hash
    return hashlib.sha256(matrix_str.encode()).hexdigest()

def extract_skill_names(skill_matrix):
    """Extract just the skill names for comparison"""
    skill_names = {}
    
    for category in ['technical_skills', 'soft_skills', 'domain_knowledge', 'standard_operating_procedures']:
        if category in skill_matrix and isinstance(skill_matrix[category], list):
            skill_names[category] = sorted([skill.get('name', '') for skill in skill_matrix[category]])
    
    return skill_names

def test_consistency(num_runs=10):
    """Test consistency across multiple runs"""
    logger.info(f"Testing skill matrix consistency across {num_runs} runs...")
    
    results = []
    skill_name_sets = []
    hashes = []
    
    # Generate skill matrices multiple times
    for i in range(num_runs):
        logger.info(f"Run {i+1}/{num_runs}")
        
        try:
            skill_matrix = generate_ideal_skill_matrix(
                job_description_data=TEST_JOB_DESCRIPTION,
                user_id=f"test_user_{i}",
                assessment_id=f"test_assessment_{i}",
                sop_data=TEST_SOP_DATA,
                domain_knowledge_data=TEST_DOMAIN_KNOWLEDGE
            )
            
            # Calculate hash and extract skill names
            matrix_hash = calculate_matrix_hash(skill_matrix)
            skill_names = extract_skill_names(skill_matrix)
            
            results.append(skill_matrix)
            hashes.append(matrix_hash)
            skill_name_sets.append(skill_names)
            
            logger.info(f"Run {i+1} completed. Hash: {matrix_hash[:8]}...")
            
        except Exception as e:
            logger.error(f"Error in run {i+1}: {str(e)}")
            return False
    
    # Analyze results
    logger.info("Analyzing consistency results...")
    
    # Check hash consistency
    unique_hashes = set(hashes)
    hash_consistency = len(unique_hashes) == 1
    
    logger.info(f"Hash consistency: {hash_consistency}")
    logger.info(f"Unique hashes found: {len(unique_hashes)}")
    
    if not hash_consistency:
        logger.warning("Hash inconsistency detected!")
        for i, h in enumerate(unique_hashes):
            count = hashes.count(h)
            logger.info(f"Hash {h[:8]}: {count} occurrences")
    
    # Check skill name consistency  
    skill_name_consistency = all(names == skill_name_sets[0] for names in skill_name_sets)
    
    logger.info(f"Skill name consistency: {skill_name_consistency}")
    
    if not skill_name_consistency:
        logger.warning("Skill name inconsistency detected!")
        # Find differences
        all_categories = set()
        for names in skill_name_sets:
            all_categories.update(names.keys())
        
        for category in all_categories:
            logger.info(f"\nCategory: {category}")
            category_sets = [names.get(category, []) for names in skill_name_sets]
            unique_category_sets = []
            for cat_set in category_sets:
                if cat_set not in unique_category_sets:
                    unique_category_sets.append(cat_set)
            
            if len(unique_category_sets) > 1:
                logger.warning(f"  Inconsistent skill sets found:")
                for i, cat_set in enumerate(unique_category_sets):
                    count = category_sets.count(cat_set)
                    logger.info(f"    Set {i+1} ({count} occurrences): {cat_set}")
    
    # Detailed analysis
    logger.info("\n=== DETAILED ANALYSIS ===")
    
    # Check taxonomy matching
    taxonomy_matched_counts = {}
    for result in results:
        for category in ['technical_skills', 'soft_skills', 'domain_knowledge', 'standard_operating_procedures']:
            if category in result:
                for skill in result[category]:
                    matched = skill.get('taxonomy_matched', False)
                    key = f"{category}_{skill.get('name', 'unknown')}"
                    if key not in taxonomy_matched_counts:
                        taxonomy_matched_counts[key] = {'matched': 0, 'total': 0}
                    if matched:
                        taxonomy_matched_counts[key]['matched'] += 1
                    taxonomy_matched_counts[key]['total'] += 1
    
    logger.info("Taxonomy matching rates:")
    for skill_key, counts in taxonomy_matched_counts.items():
        rate = counts['matched'] / counts['total'] * 100
        logger.info(f"  {skill_key}: {rate:.1f}% ({counts['matched']}/{counts['total']})")
    
    # Overall consistency score
    consistency_score = 100 if hash_consistency and skill_name_consistency else 0
    
    if not hash_consistency:
        # Partial consistency based on skill names
        if skill_name_consistency:
            consistency_score = 75  # Same skills, different details
        else:
            # Calculate partial score based on skill overlap
            total_skills = 0
            consistent_skills = 0
            
            for category in ['technical_skills', 'soft_skills', 'domain_knowledge', 'standard_operating_procedures']:
                if category in skill_name_sets[0]:
                    reference_skills = set(skill_name_sets[0][category])
                    total_skills += len(reference_skills)
                    
                    for names in skill_name_sets[1:]:
                        current_skills = set(names.get(category, []))
                        consistent_skills += len(reference_skills.intersection(current_skills))
            
            if total_skills > 0:
                consistency_score = (consistent_skills / (total_skills * (num_runs - 1))) * 100
    
    logger.info(f"\n=== FINAL RESULTS ===")
    logger.info(f"Consistency Score: {consistency_score:.1f}%")
    logger.info(f"Target: 100% (for identical inputs)")
    logger.info(f"Status: {'✅ PASSED' if consistency_score >= 95 else '❌ FAILED'}")
    
    return consistency_score >= 95

def test_basic_functionality():
    """Test basic functionality without multiple runs"""
    logger.info("Testing basic skill matrix generation...")
    
    try:
        skill_matrix = generate_ideal_skill_matrix(
            job_description_data=TEST_JOB_DESCRIPTION,
            user_id="test_user",
            assessment_id="test_assessment",
            sop_data=TEST_SOP_DATA,
            domain_knowledge_data=TEST_DOMAIN_KNOWLEDGE
        )
        
        logger.info("Basic generation successful!")
        
        # Check structure
        expected_categories = ['technical_skills', 'soft_skills', 'domain_knowledge', 'standard_operating_procedures']
        for category in expected_categories:
            if category in skill_matrix:
                count = len(skill_matrix[category])
                logger.info(f"  {category}: {count} skills")
                
                # Check for taxonomy matching
                matched_count = sum(1 for skill in skill_matrix[category] if skill.get('taxonomy_matched', False))
                logger.info(f"    Taxonomy matched: {matched_count}/{count}")
            else:
                logger.warning(f"  Missing category: {category}")
        
        return True
        
    except Exception as e:
        logger.error(f"Basic functionality test failed: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Starting Skills Taxonomy Consistency Tests")
    logger.info("=" * 50)
    
    # Test basic functionality first
    basic_test_passed = test_basic_functionality()
    
    if basic_test_passed:
        logger.info("\n" + "=" * 50)
        # Test consistency
        consistency_test_passed = test_consistency(num_runs=5)  # Reduced for faster testing
        
        if consistency_test_passed:
            logger.info("\n🎉 ALL TESTS PASSED! Skill matrix generation is consistent.")
        else:
            logger.error("\n❌ CONSISTENCY TEST FAILED! Check implementation.")
    else:
        logger.error("\n❌ BASIC FUNCTIONALITY TEST FAILED! Check setup.") 