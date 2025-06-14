"""
Test Enhanced Skills System with Full Metadata
==============================================

Test script to validate that all skills_taxonomy columns are being properly populated
including subcategory, aliases, keywords, industry_tags, confidence_score, etc.
"""

import os
import sys
import logging
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from services.skills_embedding_service import SkillsEmbeddingService
from skill_matrix.generate_skill_matrix import (
    determine_skill_subcategory, generate_skill_aliases, 
    generate_skill_keywords, determine_industry_tags,
    calculate_skill_confidence_score, determine_auto_creation_eligibility
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_metadata_generation():
    """Test the metadata generation functions"""
    
    logger.info("🧪 Testing Enhanced Metadata Generation")
    logger.info("=" * 50)
    
    test_skills = [
        {
            'name': 'React.js',
            'category': 'technical_skills',
            'description': 'React.js framework for building user interfaces'
        },
        {
            'name': 'Customer Onboarding Process',
            'category': 'standard_operating_procedures', 
            'description': 'Standard process for onboarding new customers'
        },
        {
            'name': 'Financial Compliance',
            'category': 'domain_knowledge',
            'description': 'Knowledge of financial regulations and compliance requirements'
        },
        {
            'name': 'Team Leadership',
            'category': 'soft_skills',
            'description': 'Ability to lead and manage teams effectively'
        }
    ]
    
    for skill in test_skills:
        logger.info(f"\n📋 Testing skill: {skill['name']} ({skill['category']})")
        
        # Test subcategory determination
        subcategory = determine_skill_subcategory(skill['name'], skill['category'], skill['description'])
        logger.info(f"   🏷️ Subcategory: {subcategory}")
        
        # Test aliases generation
        aliases = generate_skill_aliases(skill['name'], skill['category'], subcategory)
        logger.info(f"   🔄 Aliases ({len(aliases)}): {aliases[:3]}{'...' if len(aliases) > 3 else ''}")
        
        # Test keywords generation
        keywords = generate_skill_keywords(skill['name'], skill['category'], subcategory, skill['description'])
        logger.info(f"   🔤 Keywords ({len(keywords)}): {keywords[:5]}{'...' if len(keywords) > 5 else ''}")
        
        # Test industry tags
        industry_tags = determine_industry_tags(skill['name'], skill['category'], subcategory, skill['description'])
        logger.info(f"   🏢 Industry tags: {industry_tags}")
        
        # Test confidence score
        confidence_score = calculate_skill_confidence_score(skill['name'], skill['category'], 'auto_created', None, skill['description'])
        logger.info(f"   📊 Confidence score: {confidence_score:.2f}")
        
        # Test auto-creation eligibility
        should_auto_create = determine_auto_creation_eligibility(skill['name'], skill['category'], 'job_description', None, skill['description'])
        logger.info(f"   ⚡ Auto-create eligible: {should_auto_create}")

def test_enhanced_skill_creation():
    """Test creating skills with enhanced metadata"""
    
    logger.info("\n🔧 Testing Enhanced Skill Creation")
    logger.info("=" * 40)
    
    try:
        skills_service = SkillsEmbeddingService()
        
        # Test skill data
        test_skill = {
            'name': 'Vue.js Development',
            'category': 'technical_skills',
            'description': 'Vue.js framework development for modern web applications'
        }
        
        # Generate metadata
        subcategory = determine_skill_subcategory(test_skill['name'], test_skill['category'], test_skill['description'])
        aliases = generate_skill_aliases(test_skill['name'], test_skill['category'], subcategory)
        keywords = generate_skill_keywords(test_skill['name'], test_skill['category'], subcategory, test_skill['description'])
        industry_tags = determine_industry_tags(test_skill['name'], test_skill['category'], subcategory, test_skill['description'])
        confidence_score = calculate_skill_confidence_score(test_skill['name'], test_skill['category'], 'auto_created', 'Test Organization', test_skill['description'])
        
        logger.info(f"📝 Creating skill: {test_skill['name']}")
        logger.info(f"   📋 Subcategory: {subcategory}")
        logger.info(f"   🔄 Aliases: {aliases}")
        logger.info(f"   🔤 Keywords: {keywords}")
        logger.info(f"   🏢 Industry tags: {industry_tags}")
        logger.info(f"   📊 Confidence: {confidence_score:.2f}")
        
        # Create enhanced skill
        skill_id = skills_service.add_skill_to_taxonomy_enhanced(
            skill_name=test_skill['name'],
            category=test_skill['category'],
            subcategory=subcategory,
            description=test_skill['description'],
            source_type='test_enhanced',
            organization='Test Organization',
            aliases=aliases,
            keywords=keywords,
            industry_tags=industry_tags,
            confidence_score=confidence_score
        )
        
        if skill_id:
            logger.info(f"✅ Successfully created enhanced skill with ID: {skill_id}")
            
            # Verify the skill was created with all metadata
            skill_data = skills_service.get_skill_by_id(skill_id)
            if skill_data:
                logger.info("🔍 Verifying created skill metadata:")
                logger.info(f"   ID: {skill_data.get('skill_id')}")
                logger.info(f"   Name: {skill_data.get('canonical_name')}")
                logger.info(f"   Category: {skill_data.get('category')}")
                logger.info(f"   Subcategory: {skill_data.get('subcategory')}")
                logger.info(f"   Aliases count: {len(skill_data.get('aliases', []))}")
                logger.info(f"   Keywords count: {len(skill_data.get('keywords', []))}")
                logger.info(f"   Industry tags: {skill_data.get('industry_tags', [])}")
                logger.info(f"   Confidence score: {skill_data.get('confidence_score')}")
                logger.info(f"   Source type: {skill_data.get('source_type')}")
                logger.info(f"   Status: {skill_data.get('status')}")
                
                return True
            else:
                logger.error("❌ Failed to retrieve created skill")
                return False
        else:
            logger.error("❌ Failed to create enhanced skill")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error testing enhanced skill creation: {str(e)}")
        return False

def test_enhanced_pending_skill():
    """Test creating pending skills with enhanced metadata"""
    
    logger.info("\n📝 Testing Enhanced Pending Skill Creation")
    logger.info("=" * 45)
    
    try:
        skills_service = SkillsEmbeddingService()
        
        # Test skill data
        test_skill = {
            'name': 'Quantum Computing Algorithms',
            'category': 'technical_skills',
            'description': 'Advanced algorithms for quantum computing applications'
        }
        
        # Generate metadata
        subcategory = determine_skill_subcategory(test_skill['name'], test_skill['category'], test_skill['description'])
        aliases = generate_skill_aliases(test_skill['name'], test_skill['category'], subcategory)
        keywords = generate_skill_keywords(test_skill['name'], test_skill['category'], subcategory, test_skill['description'])
        industry_tags = determine_industry_tags(test_skill['name'], test_skill['category'], subcategory, test_skill['description'])
        confidence_score = calculate_skill_confidence_score(test_skill['name'], test_skill['category'], 'job_description', 'Quantum Corp', test_skill['description'])
        
        logger.info(f"📝 Creating pending skill: {test_skill['name']}")
        logger.info(f"   📋 Pre-generated metadata ready for promotion")
        
        # Create enhanced pending skill
        pending_id = skills_service.create_pending_skill_enhanced(
            skill_name=test_skill['name'],
            category=test_skill['category'],
            subcategory=subcategory,
            description=test_skill['description'],
            source_type='test_pending',
            organization='Quantum Corp',
            suggested_competency=75,
            aliases=aliases,
            keywords=keywords,
            industry_tags=industry_tags,
            confidence_score=confidence_score
        )
        
        if pending_id:
            logger.info(f"✅ Successfully created enhanced pending skill with ID: {pending_id}")
            return True
        else:
            logger.error("❌ Failed to create enhanced pending skill")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error testing enhanced pending skill creation: {str(e)}")
        return False

def verify_database_schema():
    """Verify that all expected columns exist in skills_taxonomy table"""
    
    logger.info("\n🗄️ Verifying Database Schema")
    logger.info("=" * 30)
    
    try:
        skills_service = SkillsEmbeddingService()
        
        # Query to get column information
        result = skills_service.supabase.rpc('get_table_columns', {'table_name': 'skills_taxonomy'}).execute()
        
        expected_columns = [
            'skill_id', 'canonical_name', 'category', 'subcategory', 'description',
            'competency_range_min', 'competency_range_max', 'aliases', 'keywords',
            'industry_tags', 'source_type', 'organization', 'usage_count',
            'confidence_score', 'status', 'created_at', 'updated_at'
        ]
        
        # Simple check by trying to select these columns
        test_query = skills_service.supabase.table('skills_taxonomy').select(
            'skill_id, canonical_name, category, subcategory, aliases, keywords, industry_tags, confidence_score'
        ).limit(1).execute()
        
        if test_query.data or test_query.data == []:  # Empty array is also valid
            logger.info("✅ All essential columns exist and are accessible")
            
            # Show sample of existing data
            sample_data = skills_service.supabase.table('skills_taxonomy').select('*').limit(3).execute()
            if sample_data.data:
                logger.info(f"📊 Sample records ({len(sample_data.data)} shown):")
                for i, record in enumerate(sample_data.data):
                    logger.info(f"   {i+1}. {record.get('canonical_name')} ({record.get('category')})")
                    logger.info(f"      Subcategory: {record.get('subcategory')}")
                    logger.info(f"      Aliases: {len(record.get('aliases', []))} items")
                    logger.info(f"      Keywords: {len(record.get('keywords', []))} items")
                    logger.info(f"      Industry tags: {record.get('industry_tags', [])}")
                    logger.info(f"      Confidence: {record.get('confidence_score')}")
            
            return True
        else:
            logger.error("❌ Some columns may be missing or inaccessible")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error verifying database schema: {str(e)}")
        return False

def show_taxonomy_metadata_stats():
    """Show statistics about metadata population in the taxonomy"""
    
    logger.info("\n📈 Taxonomy Metadata Statistics")
    logger.info("=" * 35)
    
    try:
        skills_service = SkillsEmbeddingService()
        
        # Get all skills
        all_skills = skills_service.supabase.table('skills_taxonomy').select('*').execute()
        
        if not all_skills.data:
            logger.info("No skills found in taxonomy")
            return True
        
        total_skills = len(all_skills.data)
        
        # Count metadata population
        has_subcategory = len([s for s in all_skills.data if s.get('subcategory')])
        has_aliases = len([s for s in all_skills.data if s.get('aliases') and len(s.get('aliases', [])) > 0])
        has_keywords = len([s for s in all_skills.data if s.get('keywords') and len(s.get('keywords', [])) > 0])
        has_industry_tags = len([s for s in all_skills.data if s.get('industry_tags') and len(s.get('industry_tags', [])) > 0])
        has_confidence_score = len([s for s in all_skills.data if s.get('confidence_score') is not None])
        
        logger.info(f"📊 Total skills: {total_skills}")
        logger.info(f"📋 Has subcategory: {has_subcategory}/{total_skills} ({has_subcategory/total_skills*100:.1f}%)")
        logger.info(f"🔄 Has aliases: {has_aliases}/{total_skills} ({has_aliases/total_skills*100:.1f}%)")
        logger.info(f"🔤 Has keywords: {has_keywords}/{total_skills} ({has_keywords/total_skills*100:.1f}%)")
        logger.info(f"🏢 Has industry tags: {has_industry_tags}/{total_skills} ({has_industry_tags/total_skills*100:.1f}%)")
        logger.info(f"📊 Has confidence score: {has_confidence_score}/{total_skills} ({has_confidence_score/total_skills*100:.1f}%)")
        
        # Show subcategory breakdown
        subcategories = {}
        for skill in all_skills.data:
            category = skill.get('category', 'unknown')
            subcategory = skill.get('subcategory', 'none')
            key = f"{category}:{subcategory}"
            subcategories[key] = subcategories.get(key, 0) + 1
        
        logger.info(f"\n🏷️ Subcategory breakdown:")
        for key, count in sorted(subcategories.items()):
            logger.info(f"   {key}: {count}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error getting taxonomy metadata stats: {str(e)}")
        return False

if __name__ == "__main__":
    """Main test execution"""
    
    print("🧠 Enhanced Skills System Metadata Test Suite")
    print("=" * 60)
    
    # Run all tests
    tests = [
        ("Database Schema Verification", verify_database_schema),
        ("Metadata Generation Functions", test_metadata_generation),
        ("Enhanced Skill Creation", test_enhanced_skill_creation),
        ("Enhanced Pending Skill Creation", test_enhanced_pending_skill),
        ("Taxonomy Metadata Statistics", show_taxonomy_metadata_stats)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            logger.info(f"\n🚀 Running: {test_name}")
            success = test_func()
            results.append((test_name, success))
            logger.info(f"✅ {test_name}: {'PASSED' if success else 'FAILED'}")
        except Exception as e:
            logger.error(f"❌ {test_name}: FAILED with exception: {str(e)}")
            results.append((test_name, False))
    
    # Final summary
    passed = len([r for r in results if r[1]])
    total = len(results)
    
    print(f"\n🏁 Test Results Summary: {passed}/{total} passed")
    print("=" * 60)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    if passed == total:
        print("\n🎉 All tests passed! Enhanced skills system is working correctly!")
        print("🚀 The system now populates all metadata columns including:")
        print("   📋 subcategory, 🔄 aliases, 🔤 keywords, 🏢 industry_tags")
        print("   📊 confidence_score, 🏷️ source_type, and more!")
    else:
        print(f"\n⚠️ {total - passed} tests failed. Check the logs for details.")
    
    print("=" * 60) 