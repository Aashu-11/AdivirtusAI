import os
import json
from datetime import datetime
from supabase import create_client, Client
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from dotenv import load_dotenv
import openai

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
    description: str = "Extract user data from Supabase tables"
    
    def _run(self, user_id: str) -> dict:
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
                # Print the fetched skill gaps for debugging
                print("[DEBUG] Fetched gap_analysis_dashboard:", json.dumps(skill_gaps, indent=2))
                # If dashboard is missing but skill_matrix exists, fallback
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
                # Try to extract learnerProfile if present
                if isinstance(interpreted, dict):
                    learning_profile = interpreted.get('learnerProfile', interpreted)
                else:
                    learning_profile = interpreted
                # Print the fetched learning profile for debugging
                print("[DEBUG] Fetched learning_profile:", json.dumps(learning_profile, indent=2))
            else:
                learning_profile = {'message': 'No learning profile found. Please complete your learning style assessment.'}
                print("[DEBUG] No learning profile found.")

            return {
                "skill_gaps": skill_gaps,
                "learning_profile": learning_profile
            }
        except Exception as e:
            print(f"[ERROR] Exception in SupabaseDataTool: {e}")
            return {"error": str(e)}

class WebSearchTool(BaseTool):
    name: str = "web_search"
    description: str = "Search for learning resources online"
    def _run(self, query: str) -> list:
        # Simulate web search results
        return [
            {
                "title": f"Learn {query} - Complete Guide",
                "url": f"https://example.com/learn-{query.lower().replace(' ', '-')}"
            }
        ]

class OpenAITool(BaseTool):
    name: str = "openai_content_generator"
    description: str = "Generate learning content using OpenAI"
    def _run(self, prompt: str) -> str:
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert educational content generator."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=512,
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
            goal='Parse and prioritize skill gaps from gap_analysis_dashboard JSONB data. Analyze gap percentages, prioritize high gaps, and provide actionable recommendations.',
            backstory='You are an expert at understanding skill deficiencies and learning requirements. You analyze gap percentages, highlight the most critical gaps, and recommend focused learning paths.',
            tools=[self.supabase_tool],
            verbose=True,
            allow_delegation=False
        )
    def learning_profile_agent(self):
        return Agent(
            role='Learning Style Analyst',
            goal='Extract and interpret user learning preferences from lsa_result data. Use this to tailor recommendations.',
            backstory='You are an educational psychologist specializing in personalized learning. You extract actionable insights from learning profiles to maximize learning effectiveness.',
            tools=[self.supabase_tool],
            verbose=True,
            allow_delegation=False
        )
    def curriculum_designer_agent(self):
        return Agent(
            role='Learning Path Architect',
            goal='Design progressive, detailed learning sequences for each prioritized skill gap, with actionable steps and resource suggestions.',
            backstory='You are an instructional designer with expertise in competency-based learning. You create step-by-step, actionable learning paths for each high-priority gap.',
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
            goal='Generate custom learning materials for high-priority gaps where resources are insufficient.',
            backstory='You are an educational content creator specializing in personalized materials. You fill resource gaps with engaging, effective content.',
            tools=[self.openai_tool],
            verbose=True,
            allow_delegation=False
        )
    def assessment_designer_agent(self):
        return Agent(
            role='Checkpoint Creator',
            goal='Design skill verification assessments for each learning path, focusing on high-gap areas.',
            backstory='You are an assessment specialist focused on competency validation. You create meaningful assessments for the most critical skill gaps.',
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
            description=f'Extract and analyze skill gaps for user {self.user_id}. Prioritize gaps by percentage and urgency.',
            agent=self.agents.gap_analysis_agent(),
            expected_output="Structured list of prioritized skill gaps with gap percentages and recommendations."
        )
        learning_profile_task = Task(
            description=f'Extract and interpret learning profile for user {self.user_id}.',
            agent=self.agents.learning_profile_agent(),
            expected_output="Detailed learning style profile with actionable preferences."
        )
        curriculum_design_task = Task(
            description='Design progressive, actionable learning sequences for each high-priority skill gap.',
            agent=self.agents.curriculum_designer_agent(),
            expected_output="Structured curriculum design with step-by-step learning paths.",
            context=[gap_analysis_task, learning_profile_task]
        )
        resource_discovery_task = Task(
            description='Find and curate learning resources for each prioritized gap, matching user style.',
            agent=self.agents.resource_discovery_agent(),
            expected_output="Curated list of learning resources with quality ratings.",
            context=[curriculum_design_task]
        )
        content_generation_task = Task(
            description='Generate custom learning materials for high-priority gaps.',
            agent=self.agents.content_generation_agent(),
            expected_output="Custom generated learning content and materials.",
            context=[resource_discovery_task]
        )
        assessment_design_task = Task(
            description='Create skill verification assessments for each learning path, focusing on high-gap areas.',
            agent=self.agents.assessment_designer_agent(),
            expected_output="Comprehensive assessment framework with questions.",
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
        result = crew.kickoff()
        # Convert CrewOutput to dict if needed
        if hasattr(result, 'to_dict'):
            result_dict = result.to_dict()
        elif isinstance(result, dict):
            result_dict = result
        else:
            try:
                result_dict = dict(result)
            except Exception:
                result_dict = {}
        roadmap_data = self._process_crew_results(result_dict)
        return roadmap_data
    def _process_crew_results(self, crew_result):
        return {
            "title": "Personalized Learning Roadmap",
            "description": "AI-generated personalized learning roadmap based on skill gaps and learning profile",
            "skill_gaps": crew_result.get("skill_gaps", []),
            "learning_profile": crew_result.get("learning_profile", {}),
            "learning_paths": crew_result.get("learning_paths", []),
            "total_estimated_hours": crew_result.get("total_estimated_hours", 0),
            "difficulty_level": crew_result.get("difficulty_level", "intermediate"),
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

        # Compose a prompt for OpenAI to generate a classy, in-depth roadmap
        prompt = f"""
You are an expert educational coach. Write a detailed, engaging, and actionable personalized learning roadmap for the user below.

User: {user_name}

Skill Gaps (JSON): {json.dumps(roadmap.get('skill_gaps', {}), indent=2)}
Learning Profile (JSON): {json.dumps(roadmap.get('learning_profile', {}), indent=2)}

Instructions:
- Start with a warm greeting using the user's name.
- If there are no skill gaps or learning profile, explain what the user should do next (e.g., complete assessments).
- If skill gaps are present, analyze the gap percentages and prioritize the highest ones. For each, provide a step-by-step, actionable learning path with resource suggestions, estimated time, and tips tailored to the user's learning style.
- Make the roadmap motivating, clear, and visually structured (use bullet points, sections, etc.).
- End with an encouraging note.
"""
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert educational roadmap writer."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=900,
                temperature=0.7
            )
            roadmap_text = response.choices[0].message.content
        except Exception as e:
            roadmap_text = f"[LLM generation failed: {str(e)}]"

        roadmap["roadmap_text"] = roadmap_text
        roadmap["user_name"] = user_name

        return {
            "success": True,
            "message": "Roadmap generated successfully",
            "data": roadmap
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error generating roadmap: {str(e)}",
            "data": None
        } 