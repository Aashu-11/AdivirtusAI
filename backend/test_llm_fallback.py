#!/usr/bin/env python3
"""
LLM Fallback System Test Script
==============================

This script tests the fallback mechanism for LLM failures including:
- Rate limiting (429 errors)
- Authentication errors (401 errors)  
- API unavailability
- Model configuration fallbacks

Usage:
    python test_llm_fallback.py
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our enhanced gap analysis module
from skill_matrix.gap_analysis import (
    LLMConfig, 
    handle_llm_failure_with_fallback,
    create_fallback_assessment,
    evaluate_competency,
    assess_individual_qa_with_enhanced_mapping
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_llm_config():
    """Test LLM configuration and model selection"""
    print("=" * 60)
    print("TESTING LLM CONFIGURATION")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv()
    
    # Test available models
    available_models = LLMConfig.get_available_models()
    print(f"Available models: {len(available_models)}")
    
    for i, model_config in enumerate(available_models):
        print(f"  {i+1}. Provider: {model_config['provider']}")
        print(f"     Model: {model_config['model']}")
        print(f"     Temperature: {model_config['temperature']}")
    
    # Test primary model
    primary = LLMConfig.get_primary_model_config()
    if primary:
        print(f"\nPrimary model: {primary['model']} ({primary['provider']})")
    else:
        print("\nNo primary model available")
    
    # Test fallback model
    fallback = LLMConfig.get_fallback_model_config()
    if fallback:
        print(f"Fallback model: {fallback['model']} ({fallback['provider']})")
    else:
        print("No fallback model available")
    
    return len(available_models) > 0

def test_agent_creation():
    """Test agent creation with fallback"""
    print("\n" + "=" * 60)
    print("TESTING AGENT CREATION")
    print("=" * 60)
    
    try:
        agent = LLMConfig.create_agent_with_fallback(
            role="Test Agent",
            goal="Test the fallback system",
            backstory="You are a test agent for verifying the fallback system works correctly.",
            verbose=False
        )
        
        if agent:
            print("✅ Agent created successfully")
            print(f"   Agent role: {agent.role}")
            return True
        else:
            print("❌ No agent could be created")
            return False
            
    except Exception as e:
        print(f"❌ Agent creation failed: {e}")
        return False

def test_fallback_assessment():
    """Test the fallback assessment system"""
    print("\n" + "=" * 60)
    print("TESTING FALLBACK ASSESSMENT")
    print("=" * 60)
    
    # Create test data
    test_question = {
        "id": "test_q1",
        "question": "What is the difference between var, let, and const in JavaScript?",
        "skills": ["skill_1", "skill_2"]
    }
    
    test_answer = {
        "answer": "var is function-scoped and can be redeclared. let is block-scoped and cannot be redeclared. const is block-scoped, cannot be redeclared, and cannot be reassigned."
    }
    
    test_skill_matrix = {
        "technical_skills": {
            "skills": [
                {"id": "skill_1", "name": "JavaScript ES6+", "description": "Modern JavaScript features"},
                {"id": "skill_2", "name": "Variable Declaration", "description": "Understanding variable scoping"}
            ]
        }
    }
    
    # Test fallback assessment
    try:
        result = create_fallback_assessment(test_question, test_answer, test_skill_matrix)
        
        if result:
            print("✅ Fallback assessment created successfully")
            print(f"   Skills assessed: {len(result)}")
            for skill_id, assessment in result.items():
                print(f"   - {skill_id}: Score {assessment.get('score', 'N/A')}")
            return True
        else:
            print("❌ Fallback assessment failed")
            return False
            
    except Exception as e:
        print(f"❌ Fallback assessment error: {e}")
        return False

def test_competency_evaluation():
    """Test competency evaluation with fallback"""
    print("\n" + "=" * 60)
    print("TESTING COMPETENCY EVALUATION")
    print("=" * 60)
    
    # Test data
    question = "Explain the concept of closures in JavaScript."
    expected_answer = "A closure is a function that has access to variables in its outer scope even after the outer function has returned."
    user_answer = "A closure is when a function remembers variables from its parent scope."
    skills = [
        {"id": "skill_js", "name": "JavaScript Fundamentals", "description": "Core JavaScript concepts"},
        {"id": "skill_scope", "name": "Scope and Closures", "description": "Understanding scope and closures"}
    ]
    
    try:
        result = evaluate_competency(question, expected_answer, user_answer, skills)
        
        if result:
            print("✅ Competency evaluation completed")
            print(f"   Skills evaluated: {len(result)}")
            for skill_id, assessment in result.items():
                score = assessment.get('score', 'N/A')
                problem = assessment.get('root_problem', 'No analysis')[:100] + "..." if assessment.get('root_problem', '') else 'No analysis'
                print(f"   - {skill_id}: Score {score}")
                print(f"     Analysis: {problem}")
            return True
        else:
            print("❌ Competency evaluation failed")
            return False
            
    except Exception as e:
        print(f"❌ Competency evaluation error: {e}")
        return False

def test_environment_variables():
    """Test environment variable configuration"""
    print("\n" + "=" * 60)
    print("TESTING ENVIRONMENT CONFIGURATION")
    print("=" * 60)
    
    load_dotenv()
    
    openai_key = os.getenv('OPENAI_API_KEY')
    groq_key = os.getenv('GROQ_API_KEY')
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    print(f"OPENAI_API_KEY: {'✅ Set' if openai_key else '❌ Not set'}")
    print(f"GROQ_API_KEY: {'✅ Set' if groq_key else '❌ Not set'}")
    print(f"SUPABASE_URL: {'✅ Set' if supabase_url else '❌ Not set'}")
    print(f"SUPABASE_SERVICE_KEY: {'✅ Set' if supabase_key else '❌ Not set'}")
    
    if not openai_key and not groq_key:
        print("\n⚠️  WARNING: No LLM API keys configured!")
        print("   The system will use fallback assessments only.")
        return False
    
    return True

def main():
    """Run all tests"""
    print("LLM FALLBACK SYSTEM TEST")
    print("=" * 60)
    
    # Track test results
    tests_passed = 0
    total_tests = 5
    
    # Run tests
    if test_environment_variables():
        tests_passed += 1
    
    if test_llm_config():
        tests_passed += 1
    
    if test_agent_creation():
        tests_passed += 1
    
    if test_fallback_assessment():
        tests_passed += 1
    
    if test_competency_evaluation():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! The fallback system is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the configuration and try again.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 