#!/usr/bin/env python3
"""
Debug test for web search implementation
"""

import os
import logging
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None
    print("❌ OpenAI library not installed")

def debug_web_search_for_learning_resources(query: str) -> dict:
    """
    Debug version of OpenAI web search to see what's happening
    """
    if not OPENAI_API_KEY or not OpenAI:
        logger.error("OpenAI API key or library not available for web search")
        return {"error": "Web search not available", "validated_resources": []}
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        print(f"🔍 Starting web search for: {query}")
        print("📞 Making API call...")
        
        # Use the correct Chat Completions API with web search model
        response = client.chat.completions.create(
            model="gpt-4o-mini-search-preview",
            messages=[{
                "role": "user",
                "content": f"Find current, high-quality learning resources for: {query}\n\n"
                          "Please provide:\n"
                          "- Title and description\n"
                          "- URL\n"
                          "- Platform/source\n"
                          "- Content type (video, article, course, documentation)\n"
                          "- Difficulty level\n"
                          "- Publication date (prefer 2024-2025)\n"
                          "- Author credentials\n\n"
                          "Focus on resources that are:\n"
                          "- Currently accessible and working\n"
                          "- High quality with good reviews/ratings\n"
                          "- Suitable for different learning levels\n"
                          "- Mix of free and premium options"
            }]
        )
        
        print("✅ API call completed!")
        
        raw_content = response.choices[0].message.content
        annotations = response.choices[0].message.annotations if hasattr(response.choices[0].message, 'annotations') else []
        
        print(f"📝 Content length: {len(raw_content)}")
        print(f"📋 Total annotations: {len(annotations)}")
        
        # Debug: Show first 500 chars of content
        print(f"\n📄 Content preview:\n{raw_content[:500]}...")
        
        # Debug: Show annotation details
        print(f"\n🔍 Analyzing annotations:")
        for i, ann in enumerate(annotations):
            print(f"  Annotation {i+1}: type={ann.type}")
            if hasattr(ann, 'url_citation'):
                print(f"    URL: {ann.url_citation.url}")
                print(f"    Title: {ann.url_citation.title}")
        
        validated_resources = []
        url_citation_count = 0
        
        for ann in annotations:
            if ann.type == "url_citation":
                url_citation_count += 1
                url = ann.url_citation.url
                title = ann.url_citation.title or ""
                
                print(f"\n🌐 Testing URL {url_citation_count}: {title[:50]}...")
                print(f"   URL: {url}")
                
                # Quick HEAD request to check URL validity
                try:
                    head_resp = requests.head(url, timeout=10, allow_redirects=True)
                    print(f"   Status: {head_resp.status_code}")
                    
                    if head_resp.status_code == 200:
                        validated_resources.append({
                            "url": url,
                            "title": title,
                            "start_index": ann.url_citation.start_index,
                            "end_index": ann.url_citation.end_index,
                            "status_code": head_resp.status_code,
                            "validated": True
                        })
                        print(f"   ✅ URL validated successfully!")
                    else:
                        print(f"   ⚠️ URL returned non-200 status: {head_resp.status_code}")
                        
                except requests.RequestException as e:
                    print(f"   ❌ URL validation failed: {str(e)}")
                    continue
        
        print(f"\n📊 Summary:")
        print(f"   Total annotations: {len(annotations)}")
        print(f"   URL citations: {url_citation_count}")
        print(f"   Validated URLs: {len(validated_resources)}")
        
        return {
            "query": query,
            "content": raw_content,
            "validated_resources": validated_resources,
            "total_citations": len(annotations),
            "url_citations": url_citation_count,
            "debug_info": {
                "content_preview": raw_content[:200],
                "annotation_types": [ann.type for ann in annotations]
            }
        }
        
    except Exception as e:
        print(f"❌ Web search failed for query '{query}': {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
        return {
            "error": str(e),
            "query": query,
            "content": f"Web search failed for: {query}",
            "validated_resources": []
        }

def test_multiple_queries():
    """Test multiple different query types to see what works"""
    
    test_queries = [
        "Python tutorial 2024",
        "JavaScript beginner guide",
        "React development course",
        "learn SQL database",
        "machine learning basics"
    ]
    
    print("🧪 Testing Multiple Queries")
    print("=" * 50)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n🔍 Test {i}/{len(test_queries)}: {query}")
        print("-" * 40)
        
        result = debug_web_search_for_learning_resources(query)
        
        if "error" in result:
            print(f"❌ Failed: {result['error']}")
        else:
            print(f"✅ Found {len(result['validated_resources'])} working URLs")
            
        print("-" * 40)

def test_single_query():
    """Test a single query in detail"""
    query = "Python FastAPI tutorial 2024 beginner"
    
    print("🔍 Detailed Single Query Test")
    print("=" * 50)
    
    result = debug_web_search_for_learning_resources(query)
    
    if "error" not in result:
        print(f"\n✅ SUCCESS!")
        print(f"📊 Results:")
        print(f"   Query: {result['query']}")
        print(f"   Total citations: {result['total_citations']}")
        print(f"   URL citations: {result['url_citations']}")
        print(f"   Validated URLs: {len(result['validated_resources'])}")
        
        if result['validated_resources']:
            print(f"\n🔗 Working URLs found:")
            for i, resource in enumerate(result['validated_resources'], 1):
                print(f"   {i}. {resource['title'][:60]}...")
                print(f"      {resource['url']}")
        else:
            print(f"\n⚠️ No working URLs found")
            print(f"Debug info: {result['debug_info']}")
    else:
        print(f"❌ FAILED: {result['error']}")

if __name__ == "__main__":
    print("🚀 Starting Web Search Debug Tests")
    print("=" * 60)
    
    if not OPENAI_API_KEY:
        print("❌ No OpenAI API key found in environment")
        exit(1)
    
    if not OpenAI:
        print("❌ OpenAI library not available")
        exit(1)
    
    # Run single detailed test first
    test_single_query()
    
    print("\n" + "=" * 60)
    
    # Then test multiple queries
    test_multiple_queries()
    
    print("\n🏁 Debug tests completed!")
