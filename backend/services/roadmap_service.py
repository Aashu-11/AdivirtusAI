import os
import json
from datetime import datetime
from supabase import create_client, Client
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from dotenv import load_dotenv
import openai
import requests  # <-- Add this import

# Load environment variables from .env file
load_dotenv()

# OpenAI API Key
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai.api_key = OPENAI_API_KEY

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- CrewAI Agent and Tool Classes (refactored from user code) ---

class SupabaseDataTool(BaseTool):
    name: str = "supabase_data_extractor"
    description: str = "Extract user data from Supabase tables including skill gaps and learning profile"
    
    def _run(self, user_id: str) -> str:
        try:
            # Fetch latest baseline_skill_matrix for the user
            skill_gaps_response = supabase.table('baseline_skill_matrix').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(1).execute()
            skill_gaps = None
            if skill_gaps_response.data:
                baseline = skill_gaps_response.data[0]
                skill_gaps = baseline.get('gap_analysis_dashboard')
                if isinstance(skill_gaps, str):
                    try:
                        skill_gaps = json.loads(skill_gaps)
                    except Exception:
                        pass
                print("[DEBUG] Fetched gap_analysis_dashboard:", json.dumps(skill_gaps, indent=2))
                if not skill_gaps and baseline.get('skill_matrix'):
                    skill_gaps = {'message': 'No gap analysis dashboard found. Please complete your skill gap analysis.'}
            else:
                skill_gaps = {'message': 'No baseline skill matrix found. Please complete your assessment.'}

            # Fetch latest lsa_result for the user
            learning_profile_response = supabase.table('lsa_result').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(1).execute()
            learning_profile = None
            if learning_profile_response.data:
                interpreted = learning_profile_response.data[0].get('interpreted_result')
                if isinstance(interpreted, str):
                    try:
                        interpreted = json.loads(interpreted)
                    except Exception:
                        pass
                if isinstance(interpreted, dict):
                    learning_profile = interpreted.get('learnerProfile', interpreted)
                else:
                    learning_profile = interpreted
                print("[DEBUG] Fetched learning_profile:", json.dumps(learning_profile, indent=2))
            else:
                learning_profile = {'message': 'No learning profile found. Please complete your learning style assessment.'}
                print("[DEBUG] No learning profile found.")

            result = {
                "skill_gaps": skill_gaps,
                "learning_profile": learning_profile
            }
            
            # Return as JSON string for CrewAI agents to parse
            return json.dumps(result, indent=2)
        except Exception as e:
            print(f"[ERROR] Exception in SupabaseDataTool: {e}")
            return json.dumps({"error": str(e)})

class WebSearchTool(BaseTool):
    name: str = "web_search"
    description: str = "Search for learning resources online based on skill gaps and learning preferences"
    
    def _run(self, query: str) -> str:
        # Enhanced simulated web search results based on query
        results = []
        skills = query.lower().split()
        
        for skill in skills:
            if any(word in skill for word in ['python', 'programming', 'coding']):
                results.extend([
                    {
                        "title": f"Complete {skill.title()} Programming Course",
                        "url": f"https://www.codecademy.com/learn/{skill}",
                        "description": f"Interactive {skill} programming course with hands-on projects",
                        "type": "course",
                        "difficulty": "beginner"
                    },
                    {
                        "title": f"{skill.title()} Documentation and Tutorials",
                        "url": f"https://docs.python.org/3/tutorial/" if 'python' in skill else f"https://example.com/{skill}-tutorial",
                        "description": f"Official {skill} documentation with comprehensive tutorials",
                        "type": "documentation",
                        "difficulty": "intermediate"
                    }
                ])
            elif any(word in skill for word in ['data', 'analytics', 'analysis']):
                results.extend([
                    {
                        "title": f"Data Analysis with {skill.title()}",
                        "url": f"https://www.coursera.org/learn/data-analysis-{skill}",
                        "description": f"Professional data analysis course covering {skill} fundamentals",
                        "type": "course",
                        "difficulty": "intermediate"
                    }
                ])
            else:
                results.append({
                    "title": f"Learn {skill.title()} - Complete Guide",
                    "url": f"https://www.udemy.com/course/learn-{skill.lower()}",
                    "description": f"Comprehensive {skill} learning resource with practical examples",
                    "type": "course",
                    "difficulty": "beginner"
                })
        
        return json.dumps(results, indent=2)

class OpenAITool(BaseTool):
    name: str = "openai_content_generator"
    description: str = "Generate learning content, assessments, and educational materials using OpenAI"
    
    def _run(self, prompt: str) -> str:
        try:
            if not isinstance(prompt, str):
                prompt = json.dumps(prompt, indent=2)
            
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert educational content generator specializing in personalized learning materials, curriculum design, and assessment creation."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating content: {str(e)}"

class LearningRoadmapAgents:
    def __init__(self):
        self.supabase_tool = SupabaseDataTool()
        self.web_search_tool = WebSearchTool()
        self.openai_tool = OpenAITool()

    def gap_analysis_agent(self):
        return Agent(
            role='Skill Gap Interpreter',
            goal='Extract user data from Supabase and analyze skill gaps from gap_analysis_dashboard. Identify the top 3-5 highest priority skill gaps based on percentages and provide detailed analysis.',
            backstory='You are a learning analytics specialist who excels at interpreting skill assessment data. You analyze gap percentages, identify critical learning needs, and prioritize skills that will have the maximum impact on the learner\'s growth.',
            tools=[self.supabase_tool],
            verbose=True,
            allow_delegation=False
        )

    def learning_profile_agent(self):
        return Agent(
            role='Learning Style Analyst',
            goal='Extract and analyze the user\'s learning profile from lsa_result data. Identify learning preferences, strengths, and optimal learning modalities.',
            backstory='You are an educational psychologist specializing in learning styles and preferences. You interpret learning assessment results to understand how individuals learn best and what teaching methods will be most effective.',
            tools=[self.supabase_tool],
            verbose=True,
            allow_delegation=False
        )

    def curriculum_designer_agent(self):
        return Agent(
            role='Learning Path Architect',
            goal='Design comprehensive, step-by-step learning paths for identified skill gaps. Create structured curricula with clear progression, milestones, and learning objectives tailored to the user\'s learning style.',
            backstory='You are an expert instructional designer with 15+ years of experience creating competency-based learning curricula. You specialize in breaking down complex skills into manageable learning modules with clear progression paths.',
            tools=[self.openai_tool],
            verbose=True,
            allow_delegation=False
        )

    def resource_discovery_agent(self):
        return Agent(
            role='Content Curator',
            goal='Find and evaluate learning resources for each prioritized gap, matching user learning style and gap severity.',
            backstory='You are a digital librarian with expertise in educational content discovery. You find the best resources for each skill gap and learning style.',
            tools=[self.web_search_tool, self.openai_tool],
            verbose=True,
            allow_delegation=False
        )

    def content_generation_agent(self):
        return Agent(
            role='AI Content Creator',
            goal='Generate custom learning materials, practice exercises, and study guides for skill gaps where additional resources are needed. Create content that matches the user\'s learning style and skill level.',
            backstory='You are an AI-powered educational content creator specializing in personalized learning materials. You create engaging, effective content including practice exercises, study guides, and interactive learning modules.',
            tools=[self.openai_tool],
            verbose=True,
            allow_delegation=False
        )

    def assessment_designer_agent(self):
        return Agent(
            role='Checkpoint Creator',
            goal='Design skill verification assessments, quizzes, and practical exercises for each learning path. Create assessments that accurately measure skill acquisition and provide meaningful feedback.',
            backstory='You are an assessment design specialist focused on competency-based evaluation. You create practical, relevant assessments that help learners validate their progress and identify areas for improvement.',
            tools=[self.openai_tool],
            verbose=True,
            allow_delegation=False
        )

class LearningRoadmapCrew:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.agents = LearningRoadmapAgents()

    def create_tasks(self):
        gap_analysis_task = Task(
            description=f'Use the supabase_data_extractor tool to fetch data for user {self.user_id}. Analyze the skill gaps from gap_analysis_dashboard and identify the top 3-5 highest priority skills based on gap percentages. Provide detailed analysis of each gap including current level, target level, and learning priority.',
            agent=self.agents.gap_analysis_agent(),
            expected_output="Detailed analysis of top 3-5 skill gaps with percentages, priority levels, and specific learning needs for each gap."
        )

        learning_profile_task = Task(
            description=f'Use the supabase_data_extractor tool to fetch learning profile data for user {self.user_id}. Extract and interpret learning style preferences, optimal learning modalities, and any specific learning needs or preferences.',
            agent=self.agents.learning_profile_agent(),
            expected_output="Comprehensive learning style profile including preferred learning methods, optimal content types, and personalized learning recommendations."
        )

        curriculum_design_task = Task(
            description='Based on the identified skill gaps and learning profile, design detailed learning paths for each priority skill. Create step-by-step curricula with clear milestones, learning objectives, and progression sequences. Ensure the curriculum matches the learner\'s preferred learning style.',
            agent=self.agents.curriculum_designer_agent(),
            expected_output="Structured learning paths for each skill gap with detailed curricula, milestones, time estimates, and learning objectives.",
            context=[gap_analysis_task, learning_profile_task]
        )

        resource_discovery_task = Task(
            description='For each skill identified in the curriculum design, search for and curate high-quality learning resources. Find diverse content types (courses, tutorials, documentation, practice exercises) that match the learner\'s style and skill level. Evaluate resource quality and relevance.',
            agent=self.agents.resource_discovery_agent(),
            expected_output="Curated list of learning resources for each skill gap, including resource descriptions, URLs, difficulty levels, and relevance ratings.",
            context=[curriculum_design_task]
        )

        content_generation_task = Task(
            description='Generate custom learning materials for skill gaps where additional resources are needed. Create practice exercises, study guides, code examples, or other learning materials that complement the curated resources and match the learner\'s preferences.',
            agent=self.agents.content_generation_agent(),
            expected_output="Custom generated learning materials including practice exercises, study guides, examples, and supplementary content for each skill gap.",
            context=[resource_discovery_task]
        )

        assessment_design_task = Task(
            description='Design comprehensive skill assessments for each learning path. Create practical exercises, quizzes, and project-based assessments that accurately measure skill acquisition. Include both formative assessments (progress checks) and summative assessments (final skill validation).',
            agent=self.agents.assessment_designer_agent(),
            expected_output="Complete assessment framework with quizzes, practical exercises, and projects for each skill gap, including assessment criteria and feedback mechanisms.",
            context=[content_generation_task]
        )

        return [gap_analysis_task, learning_profile_task, curriculum_design_task, resource_discovery_task, content_generation_task, assessment_design_task]

    def generate_roadmap(self):
        crew = Crew(
            agents=[
                self.agents.gap_analysis_agent(),
                self.agents.learning_profile_agent(),
                self.agents.curriculum_designer_agent(),
                self.agents.resource_discovery_agent(),
                self.agents.content_generation_agent(),
                self.agents.assessment_designer_agent()
            ],
            tasks=self.create_tasks(),
            process=Process.sequential,
            verbose=True
        )
        
        try:
            result = crew.kickoff()
            print("[DEBUG] CrewAI execution completed successfully")
        except Exception as e:
            print(f"[ERROR] CrewAI execution failed: {str(e)}")
            result = None

        # Process CrewAI results
        task_outputs = {}
        if result:
            try:
                # CrewAI returns a CrewOutput object with task_outputs
                if hasattr(result, 'tasks_output') and result.tasks_output:
                    for i, task_output in enumerate(result.tasks_output):
                        task_name = [
                            'gap_analysis_task',
                            'learning_profile_task', 
                            'curriculum_design_task',
                            'resource_discovery_task',
                            'content_generation_task',
                            'assessment_design_task'
                        ][i]
                        
                        # Extract the raw output text
                        if hasattr(task_output, 'raw'):
                            task_outputs[task_name] = task_output.raw
                        elif hasattr(task_output, 'output'):
                            task_outputs[task_name] = task_output.output
                        else:
                            task_outputs[task_name] = str(task_output)
                
                print("[DEBUG] Successfully extracted task outputs:")
                for task_name, output in task_outputs.items():
                    print(f"[DEBUG] {task_name}: {output[:200]}..." if len(str(output)) > 200 else f"[DEBUG] {task_name}: {output}")
                
            except Exception as e:
                print(f"[ERROR] Failed to extract task outputs: {str(e)}")

        # If no task outputs were extracted, use fallback
        if not task_outputs:
            print("[DEBUG] No task outputs extracted, using fallback messages")
            task_outputs = {
                "gap_analysis_task": "Unable to analyze skill gaps. Please ensure you have completed your skill assessment.",
                "learning_profile_task": "Unable to extract learning profile. Please complete your learning style assessment.",
                "curriculum_design_task": "Unable to generate curriculum without skill gap and learning profile data.",
                "resource_discovery_task": "Unable to curate resources without identified skill gaps.",
                "content_generation_task": "Unable to generate custom content without curriculum design.",
                "assessment_design_task": "Unable to create assessments without defined learning paths."
            }

        # Process the data for roadmap structure
        roadmap_data = self._process_crew_results(task_outputs)
        
        # Add individual agent outputs
        roadmap_data.update({
            "gap_analysis_output": task_outputs.get("gap_analysis_task", "No output generated"),
            "learning_profile_output": task_outputs.get("learning_profile_task", "No output generated"),
            "curriculum_design_output": task_outputs.get("curriculum_design_task", "No output generated"),
            "resource_discovery_output": task_outputs.get("resource_discovery_task", "No output generated"),
            "content_generation_output": task_outputs.get("content_generation_task", "No output generated"),
            "assessment_design_output": task_outputs.get("assessment_design_task", "No output generated")
        })

        return roadmap_data

    def _is_valid_url(self, url):
        """Check if a URL is reachable (status 200)."""
        try:
            resp = requests.head(url, allow_redirects=True, timeout=5)
            return resp.status_code == 200
        except Exception:
            return False

    def _process_crew_results(self, task_outputs):
        # Extract structured data from task outputs
        skill_gaps = {}
        learning_profile = {}
        learning_paths = []
        curated_resources = []

        # Try to extract JSON data from gap analysis
        gap_analysis = task_outputs.get("gap_analysis_task", "")
        if "skill_gaps" in gap_analysis.lower():
            try:
                # Simple extraction - in production you'd want more robust parsing
                import re
                json_match = re.search(r'\{.*\}', gap_analysis, re.DOTALL)
                if json_match:
                    skill_gaps = json.loads(json_match.group())
            except:
                pass

        # Try to extract resources from resource discovery output
        resource_output = task_outputs.get("resource_discovery_task", "")
        if "http" in resource_output:
            import re
            urls = re.findall(r'https?://[^\s]+', resource_output)
            for url in urls:
                if self._is_valid_url(url):
                    curated_resources.append({
                        "title": f"Learning Resource",
                        "url": url,
                        "description": "Curated learning resource"
                    })
                else:
                    # Optionally, you can log or flag invalid URLs
                    print(f"[DEBUG] Skipping invalid resource URL: {url}")

        return {
            "title": "Personalized Learning Roadmap",
            "description": "AI-generated personalized learning roadmap based on skill gaps and learning profile",
            "skill_gaps": skill_gaps,
            "learning_profile": learning_profile,
            "learning_paths": learning_paths,
            "curated_resources": curated_resources,
            "total_estimated_hours": 40,  # Default estimate
            "difficulty_level": "intermediate",
            "created_at": datetime.now().isoformat(),
            "status": "active",
            "completion_percentage": 0.0
        }

def generate_user_roadmap(user_id: str) -> dict:
    """Generate a complete personalized learning roadmap for a user."""
    try:
        roadmap_crew = LearningRoadmapCrew(user_id)
        roadmap = roadmap_crew.generate_roadmap()

        # Extract user name if possible
        user_name = "Learner"
        learning_profile = roadmap.get("learning_profile", {})
        if isinstance(learning_profile, dict):
            user_name = learning_profile.get("name") or learning_profile.get("full_name") or user_id[:8]

        # Generate comprehensive roadmap text using OpenAI
        gap_analysis = roadmap.get("gap_analysis_output", "")
        learning_style = roadmap.get("learning_profile_output", "")
        
        prompt = f"""
Create a comprehensive, personalized learning roadmap for {user_name}.

**Skill Gap Analysis:**
{gap_analysis}

**Learning Style Profile:**
{learning_style}

**Instructions:**
- Start with a warm, personalized greeting
- If skill gaps exist, prioritize the top 3-5 most critical ones
- For each priority skill, provide:
  * Current vs target proficiency levels
  * Step-by-step learning path with specific milestones
  * Recommended resources and learning methods
  * Time estimates and difficulty progression
  * Assessment checkpoints
- Tailor recommendations to the user's learning style preferences
- Include motivational messaging and clear next steps
- End with an encouraging conclusion

Make the roadmap actionable, specific, and engaging. Use clear formatting with sections and bullet points.
"""

        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert learning coach who creates detailed, personalized educational roadmaps."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1200,
                temperature=0.7
            )
            roadmap_text = response.choices[0].message.content
        except Exception as e:
            roadmap_text = f"Unable to generate personalized roadmap text: {str(e)}"

        roadmap["roadmap_text"] = roadmap_text
        roadmap["user_name"] = user_name

        return {
            "success": True,
            "message": "Roadmap generated successfully",
            "data": roadmap
        }
    except Exception as e:
        print(f"[ERROR] Error in generate_user_roadmap: {str(e)}")
        return {
            "success": False,
            "message": f"Error generating roadmap: {str(e)}",
            "data": None
        }