from crewai import Agent, Task, Crew, Process
from textwrap import dedent
import json
from datetime import datetime
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('SUPABASE_URL', ''),
    os.getenv('SUPABASE_SERVICE_KEY', '')
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_json_string(json_str: str) -> str:
    """Clean JSON string by removing markdown formatting and code blocks."""
    # Remove markdown code blocks if present
    if '```json' in json_str:
        json_str = json_str.split('```json')[1].split('```')[0]
    elif '```' in json_str:
        json_str = json_str.split('```')[1]
    
    # Remove any leading/trailing whitespace
    json_str = json_str.strip()
    
    return json_str

def generate_skill_questions(skill_matrix: dict, user_id: str, assessment_id: str, skill_matrix_id: str) -> dict:
    """
    Generate skill competency test questions using CrewAI with context awareness.
    
    Args:
        skill_matrix (dict): The skill matrix data
        user_id (str): User's UUID
        assessment_id (str): Assessment's UUID
        skill_matrix_id (str): Skill matrix's UUID
    
    Returns:
        dict: Generated questions
    """
    try:
        # Create the Question Generator Agent
        question_generator = Agent(
            role='Technical Assessment Question Generator',
            goal='Generate high-quality, contextually relevant technical assessment questions based on real-world scenarios with detailed context',
            backstory=dedent("""You are an expert technical interviewer with deep knowledge of 
            software development, system design, and technical assessment. You excel at creating 
            questions that accurately evaluate candidates' skills and experience through real-world 
            scenarios. You have extensive experience in various industries and understand how to 
            tailor questions to specific job roles and responsibilities. You are particularly skilled 
            at providing rich context and real-world examples that help candidates better understand 
            and relate to the questions."""),
            verbose=True,
            allow_delegation=False
        )

        # Create the Question Reviewer Agent
        question_reviewer = Agent(
            role='Technical Assessment Question Reviewer',
            goal='Review and improve technical assessment questions for clarity, relevance, and real-world applicability with rich context',
            backstory=dedent("""You are a senior technical interviewer with extensive experience 
            in evaluating candidates across different industries. You ensure questions are clear, 
            relevant, and effectively assess the required skills through practical scenarios. 
            You have a keen eye for identifying questions that truly reflect real-world challenges
            and excel at providing detailed context that helps candidates understand the full scope
            of the problem."""),
            verbose=True,
            allow_delegation=False
        )

        # Create the Question Refiner Agent
        question_refiner = Agent(
            role='Technical Assessment Question Refiner',
            goal='Refine questions to ensure progressive difficulty and real-world contextual relevance with detailed examples',
            backstory=dedent("""You are an expert in creating progressive assessment questions 
            that build upon previous answers and reflect real-world career progression. You ensure 
            each question is appropriately challenging and relevant to the candidate's demonstrated 
            knowledge and the job role's requirements. You excel at providing rich context and 
            real-world examples that help candidates better understand the full scope of each question."""),
            verbose=True,
            allow_delegation=False
        )

        # Create tasks for each agent
        generate_task = Task(
            description=dedent(f"""
            Generate the first technical assessment question based on the following skill matrix:
            {json.dumps(skill_matrix, indent=2)}
            
            The question should:
            1. Be based on a real-world scenario that the candidate might encounter in their role
            2. Test multiple skills from the matrix in a practical context
            3. Include realistic business context and constraints
            4. Be of easy difficulty to establish a baseline
            5. Focus on immediate, hands-on application of skills
            6. Include specific details about the business context and requirements
            7. Provide a detailed real-world example or case study
            8. Include specific metrics or KPIs that would be relevant
            
            Return the response as a JSON object with the following structure:
            {{
                "questions": [
                    {{
                        "id": "q1",
                        "question": "Detailed scenario-based question",
                        "context": "Business context and specific requirements",
                        "real_world_example": "Detailed example or case study",
                        "expected_skills": ["skill1", "skill2"],
                        "difficulty": "easy",
                        "scenario_type": "real-world",
                        "business_impact": "description of business impact",
                        "relevant_metrics": ["metric1", "metric2"],
                        "stakeholder_perspectives": ["perspective1", "perspective2"],
                        "industry_example": "Specific industry case study or example"
                    }}
                ]
            }}
            """),
            agent=question_generator
        )

        review_task = Task(
            description=dedent("""
            Review the generated question for:
            1. Real-world applicability and relevance
            2. Business context clarity and completeness
            3. Practical skill assessment effectiveness
            4. Realistic constraints and requirements
            5. Ability to assess multiple skills in context
            6. Potential business impact of the solution
            7. Quality and relevance of the real-world example
            8. Clarity of stakeholder perspectives
            9. Appropriateness of metrics/KPIs
            10. Suitability of difficulty level for first question
            
            Provide feedback and suggest improvements if needed.
            """),
            agent=question_reviewer
        )

        refine_task = Task(
            description=dedent("""
            Based on the first question and its review, generate 7 additional questions that:
            1. Build upon the skills demonstrated in previous questions
            2. Introduce new aspects of the required skills
            3. Maintain appropriate difficulty progression
            4. Provide different types of real-world scenarios
            
            Question progression should be:
            - Questions 2-3: Daily operational challenges (easy difficulty)
            - Questions 4-5: Project-level challenges with multiple stakeholders (medium difficulty)
            - Questions 6-7: Strategic initiatives and long-term impact (hard difficulty)
            - Question 8: Complex scenario integrating all skills with business impact (hard difficulty)
            
            Each question should:
            1. Test multiple skills from the matrix in a practical context
            2. Include realistic business scenarios and constraints
            3. Have clear difficulty progression
            4. Focus on practical application
            5. Include specific business context and requirements
            6. Consider stakeholder management and communication
            7. Address potential business impact
            8. Provide a detailed real-world example or case study
            9. Include relevant metrics or KPIs
            10. Present multiple stakeholder perspectives
            11. Include specific industry examples and case studies
            
            Difficulty levels should be determined by:
            - Easy: Basic concepts, single skill focus, straightforward scenarios
            - Medium: Multiple skills, moderate complexity, some stakeholder management
            - Hard: Complex scenarios, multiple stakeholders, strategic thinking required
            
            Return all eight questions in the same JSON structure with the additional fields:
            - scenario_type: Type of real-world scenario
            - business_impact: Description of business impact
            - stakeholder_involvement: Key stakeholders to consider
            - constraints: Real-world constraints to consider
            - real_world_example: Detailed example or case study
            - relevant_metrics: List of relevant metrics or KPIs
            - stakeholder_perspectives: Different stakeholder viewpoints
            - industry_context: Specific industry context and challenges
            - success_criteria: Clear criteria for evaluating the solution
            - industry_example: Specific industry case study or example
            - difficulty: One of ["easy", "medium", "hard"] based on complexity
            """),
            agent=question_refiner
        )

        # Create the crew with the agents and tasks
        crew = Crew(
            agents=[question_generator, question_reviewer, question_refiner],
            tasks=[generate_task, review_task, refine_task],
            verbose=True,
            process=Process.sequential
        )

        # Execute the crew's tasks
        result = crew.kickoff()
        logger.info(f"CrewAI result: {result}")

        # Clean and parse the JSON response
        cleaned_json = clean_json_string(result)
        questions = json.loads(cleaned_json)
        
        # Store in Supabase
        data = {
            'user_id': user_id,
            'assessment_id': assessment_id,
            'skill_matrix_id': skill_matrix_id,
            'questions': questions,
            'answers': None,
            'created_at': datetime.now().isoformat()
        }

        result = supabase.table('sct_initial').insert(data).execute()
        logger.info(f"Successfully stored questions for user {user_id}")
        
        return questions

    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise 