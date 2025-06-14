from crewai import Task

class QuestionGenerationTasks:
    """Collection of tasks for technical assessment question generation"""
    
    @staticmethod
    def analyze_skills_task(agent, skill_analysis):
        return Task(
            description=f"""Analyze the skill matrix and create a CONTEXT-AWARE distribution plan for 15 technology-specific questions.
            
            Skill Analysis Data: {skill_analysis}
            
            Your task is to:
            1. Review all technical skill clubs and individual skills WITH THEIR FULL CONTEXT
            2. Identify SPECIFIC technologies, frameworks, and languages mentioned in skill descriptions
            3. Note competency levels for each skill to adjust question difficulty
            4. Plan distribution across question types with TECHNOLOGY-SPECIFIC focus:
               - 4 Pure Coding questions (using their exact tech stack: Vue.js, React, TypeScript, etc.)
               - 3 Debugging questions (with bugs relevant to their frameworks/languages)
               - 3 Theory questions (architecture/best practices in their technology domain)
               - 1 Application question (integrating their specific skills)
               - 4 Soft Skills questions (cover all soft skills comprehensively)
            5. Create skill-to-question-type mapping with SPECIFIC technology requirements
            6. Ensure questions test their ACTUAL skills rather than generic programming
            7. Consider their competency levels when planning question complexity
            
            CRITICAL: Focus on REAL-WORLD scenarios using their SPECIFIC technology stack.
            
            For example:
            - If they have Vue.js + TypeScript + CSS: Create Vue component questions in TypeScript
            - If they have Python + Django + PostgreSQL: Create Django model/API questions
            - If they have React + Node.js + MongoDB: Create full-stack React/Node questions
            
            Focus on realistic skill combinations that match their actual expertise.""",
            expected_output="""A JSON object with technology-specific skill distribution plan:
            {
                "technology_context": {
                    "primary_languages": ["TypeScript", "JavaScript", "CSS"],
                    "primary_frameworks": ["Vue.js", "Tailwind CSS"],
                    "primary_tools": ["Git", "Docker"],
                    "competency_summary": "Frontend-focused with Vue.js expertise (Level 85), strong TypeScript skills (Level 88)"
                },
                "pure_coding": [
                    {
                        "question_id": "coding_1", 
                        "skills": [{"id": "skill_id", "name": "Vue.js or similar frameworks", "category": "technical_skills"}],
                        "technology_focus": "Vue.js component with TypeScript",
                        "suggested_scenario": "Create a responsive Vue component with props validation",
                        "estimated_time": "6-8 minutes",
                        "difficulty_level": "medium-high"
                    }
                ],
                "debugging": [
                    {
                        "question_id": "debug_1",
                        "skills": [{"id": "skill_id", "name": "Vue.js", "category": "technical_skills"}],
                        "technology_focus": "Vue.js reactivity and CSS responsiveness",
                        "suggested_scenario": "Fix Vue component reactivity and responsive design issues",
                        "estimated_time": "5-6 minutes",
                        "bug_types": ["vue_reactivity", "css_responsive"]
                    }
                ],
                "theory": [
                    {
                        "question_id": "theory_1",
                        "skills": [{"id": "skill_id", "name": "Vue.js", "category": "technical_skills"}],
                        "technology_focus": "Vue.js architecture and state management",
                        "suggested_scenario": "Explain Vue.js application architecture for scalability",
                        "estimated_time": "4-5 minutes",
                        "complexity": "architectural_design"
                    }
                ],
                "application": [
                    {
                        "question_id": "app_1",
                        "skills": [
                            {"id": "skill_id", "name": "Vue.js", "category": "technical_skills"},
                            {"id": "skill_id_2", "name": "TypeScript", "category": "technical_skills"},
                            {"id": "skill_id_3", "name": "CSS/SCSS", "category": "technical_skills"}
                        ],
                        "technology_focus": "Full Vue.js application with TypeScript and responsive design",
                        "suggested_scenario": "Design a complete user dashboard using Vue.js, TypeScript, and responsive CSS",
                        "estimated_time": "8-10 minutes",
                        "integration_aspects": ["component_architecture", "type_safety", "responsive_design"]
                    }
                ],
                "soft_skills_coverage": [
                    {"id": "skill_id", "name": "skill_name", "category": "soft_skills"}
                ]
            }""",
            agent=agent
        )
    
    @staticmethod
    def generate_pure_coding_task(agent, skill_distribution):
        return Task(
            description=f"""Generate exactly 4 pure coding questions based on the skill distribution plan.
            
            Skill Distribution: {skill_distribution}
            
            Your task is to:
            1. Create 4 focused coding questions (6-8 minutes each)
            2. Each question should test specific programming skills through function/algorithm implementation
            3. Provide clear problem statements with input/output examples
            4. Include language specification (.tsx, .py, .js, etc.)
            5. Provide expected code structure template (not detailed solution, just structure)
            6. Test core programming concepts like data structures, algorithms, and logic
            7. Ensure questions can be solved with 10-30 lines of clean code
            8. Focus on programming fundamentals, avoid complex frameworks
            9. CRITICAL: Include 'code_template' field for initial code structure if needed
            
            Question Types to Include:
            - Array/String manipulation
            - Algorithm implementation (sorting, searching, etc.)
            - Data structure usage (objects, arrays, maps)
            - Logic and conditional reasoning
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with 4 pure coding questions:
            {
                "pure_coding_questions": [
                    {
                        "id": "coding_1",
                        "type": "pure_coding",
                        "question": "Write a function that receives an array of numbers and returns a new array with only the even numbers.",
                        "language": "typescript",
                        "file_extension": ".tsx",
                        "code_template": "function filterEvenNumbers(numbers: number[]): number[] {\\n  // Your implementation here\\n}",
                        "input_example": "filterEvenNumbers([1, 2, 3, 4, 5, 6])",
                        "expected_output": "[2, 4, 6]",
                        "skills": [
                            {"id": "skill_id", "name": "skill_name", "category": "technical_skills"}
                        ],
                        "difficulty": "medium",
                        "estimated_time": "6-8 minutes",
                        "evaluation_criteria": ["correctness", "efficiency", "code_quality"]
                    }
                ]
            }""",
            agent=agent
        )
    
    @staticmethod
    def generate_debugging_task(agent, skill_distribution):
        return Task(
            description=f"""Generate exactly 3 debugging/code review questions with intentionally buggy code.
            
            Skill Distribution: {skill_distribution}
            
            Your task is to:
            1. Create 3 debugging questions (5-6 minutes each)
            2. Provide realistic buggy code that represents common developer mistakes
            3. Include clear instructions on what to find/fix/optimize
            4. Use single-file examples that are complex enough to be realistic but simple enough to debug quickly
            5. Include different types of bugs: logic errors, performance issues, syntax problems
            6. Specify exactly what the candidate should do (debug, fix, optimize, review)
            7. Provide the "correct" behavior description so candidates know what to aim for
            8. CRITICAL: Store the buggy code in a 'code' field for frontend display
            
            Bug Types to Include:
            - Logic errors in algorithms
            - Performance optimization opportunities
            - Common coding mistakes (off-by-one, null references, etc.)
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with 3 debugging questions:
            {
                "debugging_questions": [
                    {
                        "id": "debug_1",
                        "type": "debugging",
                        "question": "Review this code and fix the bugs. The function should calculate the total price of items in a shopping cart, but it has several issues.",
                        "code": "function calculateTotal(items) {\\n  let total = 0;\\n  for(let i = 0; i <= items.length; i++) {\\n    total += items[i].price * items[i].quantity;\\n  }\\n  return total.toFixed(2);\\n}",
                        "language": "javascript",
                        "file_extension": ".js",
                        "task_instruction": "Find and fix 2-3 bugs in this code",
                        "expected_behavior": "The function should correctly calculate the total price without errors",
                        "bug_types": ["off-by-one error", "missing null checks"],
                        "skills": [
                            {"id": "skill_id", "name": "skill_name", "category": "technical_skills"}
                        ],
                        "difficulty": "medium",
                        "estimated_time": "5-6 minutes",
                        "evaluation_criteria": ["bug_identification", "fix_quality", "edge_case_handling"]
                    }
                ]
            }""",
            agent=agent
        )
    
    @staticmethod
    def generate_theory_task(agent, skill_distribution):
        return Task(
            description=f"""Generate exactly 3 theory/conceptual questions about architecture, best practices, and technology decisions.
            
            Skill Distribution: {skill_distribution}
            
            Your task is to:
            1. Create 3 conceptual questions (4-5 minutes each)
            2. Test architecture decision reasoning and thought processes
            3. Include technology comparison and selection scenarios
            4. Ask about best practices and industry standards
            5. Create questions that require explaining thought processes
            6. Focus on "how would you" and "explain your approach" type questions
            7. Test understanding of trade-offs and design considerations
            
            Question Types to Include:
            - Architecture design decisions
            - Technology selection rationale
            - Best practices explanation
            - Problem-solving approach description
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with 3 theory questions:
            {
                "theory_questions": [
                    {
                        "id": "theory_1",
                        "type": "theory",
                        "question": "You need to design a system that... Explain your approach and the key decisions you would make.",
                        "context": "Realistic business/technical scenario",
                        "focus_area": "system architecture",
                        "skills": [
                            {"id": "skill_id", "name": "skill_name", "category": "technical_skills"}
                        ],
                        "difficulty": "medium",
                        "estimated_time": "4-5 minutes",
                        "evaluation_criteria": ["reasoning_quality", "technical_accuracy", "consideration_of_trade_offs"],
                        "expected_discussion_points": ["scalability", "maintainability", "performance"]
                    }
                ]
            }""",
            agent=agent
        )
    
    @staticmethod
    def generate_application_task(agent, skill_distribution):
        return Task(
            description=f"""Generate exactly 1 comprehensive application-based question that integrates multiple skills.
            
            Skill Distribution: {skill_distribution}
            
            Your task is to:
            1. Create 1 comprehensive application question (8-10 minutes)
            2. Design a realistic business scenario that requires multiple technical skills
            3. Integrate frontend, backend, and system considerations
            4. Test both technical implementation knowledge and business understanding
            5. Create a scenario that mirrors actual work challenges
            6. Require the candidate to consider multiple aspects: UI/UX, data flow, architecture, etc.
            7. Make it complex enough to be realistic but completable in 8-10 minutes
            
            Should combine skills like:
            - Frontend development (React, UI/UX, CSS)
            - Backend systems (APIs, databases, authentication)
            - System design considerations
            - Business logic implementation
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with 1 application question:
            {
                "application_questions": [
                    {
                        "id": "app_1",
                        "type": "application",
                        "question": "You're tasked with building a feature for... Describe your complete approach including frontend, backend, and system considerations.",
                        "business_context": "Realistic business scenario",
                        "requirements": ["requirement1", "requirement2", "requirement3"],
                        "constraints": ["time constraint", "technical constraint"],
                        "skills": [
                            {"id": "skill_id", "name": "skill_name", "category": "technical_skills"}
                        ],
                        "difficulty": "high",
                        "estimated_time": "8-10 minutes",
                        "evaluation_criteria": ["completeness", "feasibility", "technical_depth", "business_understanding"],
                        "expected_components": ["frontend", "backend", "database", "api_design"]
                    }
                ]
            }""",
            agent=agent
        )
    
    @staticmethod
    def generate_soft_skills_task(agent, soft_skills):
        return Task(
            description=f"""Generate exactly 4 soft skills questions that comprehensively cover all soft skills.
            
            Soft Skills to Cover: {soft_skills}
            
            Your task is to:
            1. Create 4 soft skills questions that cover ALL soft skills in the matrix
            2. Use realistic workplace scenarios for each question
            3. Test communication, leadership, teamwork, problem-solving, and adaptability
            4. Create questions that allow objective evaluation of soft skills
            5. Include scenarios that professionals actually encounter
            6. Structure questions for clear, measurable responses
            7. Cover conflict resolution, time management, and collaboration
            
            Question Categories:
            - Communication & Leadership (1 question)
            - Teamwork & Collaboration (1 question) 
            - Problem-Solving & Adaptability (1 question)
            - Professional Skills & Management (1 question)
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with 4 soft skills questions:
            {
                "soft_skills_questions": [
                    {
                        "id": "soft_1",
                        "type": "soft_skills",
                        "question": "Describe a situation where you had to...",
                        "scenario": "Realistic workplace scenario",
                        "skills": [
                            {"id": "skill_id", "name": "skill_name", "category": "soft_skills"}
                        ],
                        "focus_area": "communication_leadership",
                        "estimated_time": "3-4 minutes",
                        "evaluation_criteria": ["clarity", "leadership_potential", "communication_effectiveness"],
                        "response_structure": "STAR method (Situation, Task, Action, Result)"
                    }
                ]
            }""",
            agent=agent
        )
    
    @staticmethod
    def compile_and_review_task(agent, pure_coding, debugging, theory, application, soft_skills):
        return Task(
            description=f"""Compile and review all questions to ensure quality and proper structure.
            
            Pure Coding Questions: {pure_coding}
            Debugging Questions: {debugging}
            Theory Questions: {theory}
            Application Questions: {application}
            Soft Skills Questions: {soft_skills}
            
            Your task is to:
            1. Compile all 15 questions into a single, well-structured assessment
            2. Ensure exactly 15 questions total (4+3+3+1+4)
            3. Verify all questions have proper skill references with IDs
            4. Check for clarity, technical accuracy, and appropriate difficulty
            5. Ensure time estimates are realistic (total ~90-105 minutes)
            6. Validate that all skills from the original matrix are covered
            7. Create a logical flow and progression through the assessment
            8. Add question numbering and clear categorization
            
            Final structure should have:
            - 4 Pure Coding questions (Q1-Q4)
            - 3 Debugging questions (Q5-Q7) 
            - 3 Theory questions (Q8-Q10)
            - 1 Application question (Q11)
            - 4 Soft Skills questions (Q12-Q15)
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with all 15 final questions:
            {
                "final_questions": [
                    {
                        "id": "q1",
                        "question_number": 1,
                        "type": "pure_coding",
                        "category": "Technical - Programming",
                        "question": "Final question text",
                        "skills": [
                            {"id": "skill_id", "name": "skill_name", "category": "technical_skills"}
                        ],
                        "estimated_time": "6-8 minutes",
                        "difficulty": "medium",
                        "language": "typescript",
                        "evaluation_criteria": ["criteria1", "criteria2"]
                    }
                ],
                "assessment_summary": {
                    "total_questions": 15,
                    "total_estimated_time": "90-105 minutes",
                    "question_breakdown": {
                        "pure_coding": 4,
                        "debugging": 3,
                        "theory": 3,
                        "application": 1,
                        "soft_skills": 4
                    }
                }
            }""",
            agent=agent
        )
    
    @staticmethod
    def direct_compile_task(agent, context, pure_coding, debugging, theory, application, soft_skills):
        return Task(
            description=f"""Directly compile all generated questions into a final structured assessment WITHOUT modifying the question content.
            
            Industry Context: {context}
            Pure Coding Questions: {pure_coding}
            Debugging Questions: {debugging}
            Theory Questions: {theory}
            Application Questions: {application}
            Soft Skills Questions: {soft_skills}
            
            Your task is to:
            1. Combine all 15 questions into a single, well-structured assessment
            2. Ensure exactly 15 questions total (4+3+3+1+4)
            3. Add question numbering (Q1-Q15) and clear categorization
            4. PRESERVE ALL ORIGINAL CONTENT - do not modify question text, code, or examples
            5. PRESERVE ALL CODE FIELDS - keep 'code', 'code_template', 'buggy_code' fields exactly as provided
            6. Create logical flow: Coding → Debugging → Theory → Application → Soft Skills
            7. Add assessment summary with total time estimate
            8. Ensure all industry context is preserved where relevant
            9. DO NOT change any technical content, just organize and number the questions
            
            CRITICAL PRESERVATION RULES:
            - Keep all 'code' fields for debugging questions exactly as provided
            - Keep all 'code_template' fields for coding questions exactly as provided  
            - Keep all question text, examples, and technical content unchanged
            - Only add question_number and organize the structure
            
            Final structure should be:
            - Q1-Q4: Pure Coding questions (preserve code_template fields)
            - Q5-Q7: Debugging questions (preserve code fields)
            - Q8-Q10: Theory questions (preserve all content)
            - Q11: Application question (preserve all content)
            - Q12-Q15: Soft Skills questions (preserve all content)
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with all 15 final questions preserving all code fields:
            {
                "final_questions": [
                    {
                        "id": "q1",
                        "question_number": 1,
                        "type": "pure_coding",
                        "category": "Technical - Programming",
                        "question": "Original question text unchanged",
                        "code_template": "Original code template preserved exactly",
                        "language": "typescript",
                        "skills": [
                            {"id": "skill_id", "name": "skill_name", "category": "technical_skills"}
                        ],
                        "estimated_time": "6-8 minutes",
                        "difficulty": "medium",
                        "evaluation_criteria": ["criteria1", "criteria2"]
                    },
                    {
                        "id": "q5",
                        "question_number": 5,
                        "type": "debugging", 
                        "category": "Technical - Debugging",
                        "question": "Original debugging question unchanged",
                        "code": "Original buggy code preserved exactly with proper escaping",
                        "language": "javascript",
                        "skills": [
                            {"id": "skill_id", "name": "skill_name", "category": "technical_skills"}
                        ],
                        "estimated_time": "5-6 minutes",
                        "evaluation_criteria": ["bug_identification", "fix_quality"]
                    }
                ],
                "assessment_summary": {
                    "total_questions": 15,
                    "total_estimated_time": "90-105 minutes",
                    "question_breakdown": {
                        "pure_coding": 4,
                        "debugging": 3,
                        "theory": 3,
                        "application": 1,
                        "soft_skills": 4
                    },
                    "industry_context_applied": true
                }
            }""",
            agent=agent
        )
    
    # Legacy task methods for backward compatibility
    @staticmethod
    def create_context_task(agent, skill_matrix):
        return Task(
            description=f"""Analyze the skill matrix and create real-world contexts for assessment questions.
            Skill Matrix: {skill_matrix}
            
            Your task is to:
            1. Identify key scenarios that test multiple skills
            2. Ensure scenarios reflect current industry challenges
            3. Include realistic constraints and stakeholder considerations
            4. Provide detailed context for each scenario""",
            expected_output="""A JSON object containing scenarios with industry context:
            {
                "scenarios": [
                    {
                        "context": "Detailed industry situation",
                        "skills_tested": ["skill1", "skill2"],
                        "constraints": ["constraint1", "constraint2"],
                        "stakeholders": ["stakeholder1", "stakeholder2"]
                    }
                ]
            }""",
            agent=agent
        )

    @staticmethod
    def create_technical_questions_task(agent, scenarios, question_count=15):
        return Task(
            description=f"""Create exactly {question_count} technical assessment questions based on the provided scenarios.
            Scenarios: {scenarios}
            
            Your task is to:
            1. Design exactly {question_count} questions that test both technical and soft skills from the skill matrix
            2. Ensure questions have appropriate difficulty levels and are mid-sized (not too lengthy, not too short)
            3. Include specific technical requirements
            4. Create evaluation criteria for each question
            5. IMPORTANT: Include the exact skills from the skill matrix that each question is testing, including skill IDs
            6. Identify questions that would benefit from practical coding assessment (for programming languages like Python, JavaScript, Java, etc.)
            7. Mark coding questions with "requires_coding": true for delegation to coding specialist
            8. Verify that exactly {question_count} questions are created, no more and no less
            9. Ensure a balanced mix - not all questions should be coding questions (aim for 30-50% coding questions max)
            10. Each question should be comprehensive enough to assess competency but concise enough to complete in 10-15 minutes
            
            CRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text, headers, or markdown.
            Your response must start with {{ and end with }}.
            
            Example of correct format:
            {{
                "questions": [
                    {{
                        "id": "q1",
                        "question": "Your comprehensive but concise question here",
                        "requires_coding": false,
                        "skills": [{{"id": "skill_1", "name": "Skill Name"}}]
                    }}
                ]
            }}""",
            expected_output=f"""A JSON object containing exactly {question_count} technical questions:
            {{
                "questions": [
                    {{
                        "id": "unique_id",
                        "scenario_reference": "scenario_id",
                        "question": "Detailed question (mid-sized, comprehensive but concise)",
                        "technical_requirements": ["req1", "req2"],
                        "difficulty": "level",
                        "evaluation_criteria": ["criteria1", "criteria2"],
                        "requires_coding": false,
                        "skills": [
                            {{
                                "id": "skill_id_from_matrix",
                                "name": "skill_name_from_matrix",
                                "category": "technical_skills or soft_skills"
                            }}
                        ]
                    }}
                ]
            }}""",
            agent=agent
        )

    @staticmethod
    def create_coding_questions_task(agent, questions_needing_coding):
        return Task(
            description=f"""Convert theoretical technical questions into practical coding questions.
            Questions that need coding: {questions_needing_coding}
            
            Your task is to:
            1. Transform identified questions into short, practical coding challenges
            2. Create questions that require 5-20 lines of code maximum
            3. Focus on specific functions/methods rather than complete applications
            4. Provide clear requirements and expected input/output examples
            5. Avoid complex frameworks or project setups
            6. Keep questions focused on core programming concepts
            7. Maintain the original skill assessment intent
            8. Preserve all skill references and metadata from original questions
            
            IMPORTANT JSON FORMATTING RULES:
            - Use ONLY double quotes for all string values in JSON
            - If you need to include quotes in examples, escape them with backslashes: \\"
            - Never use single quotes in JSON output
            - For input_example and expected_output, use escaped quotes properly
            
            Examples of good coding questions:
            - "Write a function that takes a list of numbers and returns the second largest"
            - "Implement a method to validate email addresses using regex"
            - "Create a function that merges two sorted arrays"
            - "Write a recursive function to calculate factorial"
            
            Examples to AVOID:
            - "Build a React web application for task management"
            - "Create a full REST API with authentication"
            - "Develop a machine learning model to predict..."
            """,
            expected_output="""A JSON object containing coding questions with proper escaping:
            {
                "coding_questions": [
                    {
                        "id": "question_id",
                        "question": "Write a function that...",
                        "requirements": ["Clear requirement 1", "Clear requirement 2"],
                        "input_example": "[\\\"hello\\\", \\\"world\\\"]",
                        "expected_output": "\\\"Hello World\\\"",
                        "programming_language": "python/javascript/etc",
                        "estimated_time": "10-15 minutes",
                        "skills": [
                            {
                                "id": "skill_id_from_matrix",
                                "name": "skill_name_from_matrix",
                                "category": "technical_skills"
                            }
                        ],
                        "difficulty": "easy/medium/hard",
                        "evaluation_criteria": ["criteria1", "criteria2"]
                    }
                ]
            }""",
            agent=agent
        )

    @staticmethod
    def apply_learning_design_task(agent, questions):
        return Task(
            description=f"""Enhance questions with learning design principles.
            Questions: {questions}
            
            Your task is to:
            1. Structure questions for optimal learning assessment
            2. Add progression and scaffolding elements
            3. Include clear learning objectives
            4. Ensure questions follow cognitive learning principles
            5. IMPORTANT: Preserve all skill references from the original questions, including skill IDs""",
            expected_output="""A JSON object containing enhanced questions:
            {
                "enhanced_questions": [
                    {
                        "id": "question_id",
                        "learning_objectives": ["obj1", "obj2"],
                        "cognitive_level": "level",
                        "scaffolding_elements": ["element1", "element2"],
                        "enhanced_question": "Improved question text",
                        "skills": [
                            {
                                "id": "skill_id_from_matrix",
                                "name": "skill_name_from_matrix",
                                "category": "technical_skills or soft_skills"
                            }
                        ]
                    }
                ]
            }""",
            agent=agent
        )

    @staticmethod
    def quality_review_task(agent, enhanced_questions, question_count=15):
        return Task(
            description=f"""Review and finalize exactly {question_count} assessment questions.
            Questions: {enhanced_questions}
            
            Your task is to:
            1. Ensure clarity and unambiguous wording in all {question_count} questions
            2. Validate technical accuracy
            3. Check for appropriate difficulty progression
            4. Verify real-world relevance
            5. Ensure each question is mid-sized (comprehensive but concise, 10-15 minutes to complete)
            6. CRITICALLY IMPORTANT: Include specific skills from the skill matrix for each question with their exact IDs
            7. Confirm that there are exactly {question_count} questions in the final output""",
            expected_output=f"""A JSON object containing exactly {question_count} final questions:
            {{
                "final_questions": [
                    {{
                        "id": "q1",
                        "scenario": "Final scenario text",
                        "context": "Detailed context",
                        "question": "Final question text (mid-sized, comprehensive but concise)",
                        "skills": [
                            {{
                                "id": "skill_id_from_matrix",
                                "name": "skill_name_from_matrix",
                                "category": "technical_skills or soft_skills"
                            }}
                        ],
                        "difficulty": "level",
                        "evaluation_criteria": ["criteria1", "criteria2"],
                        "time_constraint": "10-15 minutes",
                        "industry_domain": "domain"
                    }}
                ]
            }}""",
            agent=agent
        )

    # Individual question generation tasks (NEW APPROACH)
    @staticmethod
    def generate_single_pure_coding_task(agent, question_number, skill_distribution, industry_context, previous_questions="None", variation_hint=""):
        return Task(
            description=f"""Generate exactly ONE high-quality pure coding question that is CONTEXT-AWARE and TECHNOLOGY-SPECIFIC.
            
            Question Number: {question_number}
            Skill Distribution: {skill_distribution}
            Industry Context: {industry_context}
            Previous Questions: {previous_questions}
            Variation Focus: {variation_hint}
            
            CRITICAL CONTEXT-AWARENESS REQUIREMENTS:
            1. Review the skill distribution to identify SPECIFIC technologies, frameworks, and languages mentioned
            2. Check for SOP (Standard Operating Procedures) context in the skill descriptions
            3. If skills mention frontend frameworks - create component-based questions using their preferred framework
            4. If skills mention typed languages - use type-safe syntax and features from their language
            5. If skills mention styling technologies - create responsive design questions using their preferred tools
            6. If skills mention specific competency levels - adjust difficulty accordingly
            7. If SOPs are present - incorporate procedural requirements and quality standards into coding scenarios
            
            SOP INTEGRATION REQUIREMENTS:
            - If skill descriptions mention procedures, standards, or compliance - incorporate these into the coding scenario
            - If quality standards are mentioned - include requirements for code quality, documentation, or testing
            - If procedural requirements exist - create scenarios that require following specific development workflows
            - If compliance mentions are found - include security, data protection, or regulatory considerations
            
            CRITICAL: You MUST generate a question that is completely different from any previous questions.
            Review the previous questions and ensure your new question:
            1. Tests different programming concepts within the user's technology stack
            2. Uses different problem scenarios but relevant to their skills and procedures
            3. Focuses on different algorithms or patterns within their frameworks
            4. Has unique input/output patterns but uses their preferred languages
            5. Incorporates different operational requirements if SOPs are present
            
            Your task is to:
            1. Create 1 focused, high-quality coding question (6-8 minutes)
            2. Use SPECIFIC technologies from the skill matrix (their actual frameworks, languages, tools)
            3. Test the exact skills described in their skill matrix
            4. Provide problem statements relevant to their technology stack AND operational procedures
            5. Include appropriate language specification based on their skills
            6. Provide code template using their preferred frameworks/languages
            7. Test concepts relevant to their described competencies
            8. Focus on real-world scenarios using their technology stack and procedural context
            9. Make it practical and directly applicable to their skill descriptions and operational requirements
            10. ENSURE it's completely different from previous questions but technology-relevant and procedure-aware
            
            EXAMPLES OF CONTEXT-AWARE APPROACH WITH SOP INTEGRATION:
            - If they have component framework skills + quality standards: Create component questions with props, state management, lifecycle, AND code quality requirements
            - If they have typed language skills + documentation procedures: Use generics, interfaces, type safety features AND include documentation requirements
            - If they have styling framework skills + responsive design standards: Implement responsive layouts using their preferred methodology AND meeting accessibility standards
            - If they have backend framework skills + security compliance: Write server-side logic with their preferred patterns AND security compliance requirements
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with 1 context-aware coding question:
            {
                "id": "coding_X",
                "type": "pure_coding",
                "question": "Create a component that renders a responsive layout with props for data display. The component should handle missing data gracefully, implement proper state management, and follow coding standards for documentation and accessibility as per team procedures.",
                "language": "typescript",
                "file_extension": ".tsx",
                "code_template": "// Component template using user's preferred framework and language\\n// Implement component logic here\\n// Add responsive styling using their preferred approach\\n// Follow documentation and quality standards from SOPs",
                "input_example": "{ title: 'Sample Data', description: 'Data description', items: [...] }",
                "expected_output": "Responsive component with proper prop handling, state management, and procedural compliance",
                "technology_focus": "Component framework with typed language and responsive styling",
                "procedural_context": "Code quality standards, documentation requirements, accessibility compliance",
                "skills": [
                    {"id": "skill_id", "name": "Framework Development", "category": "technical_skills"},
                    {"id": "skill_id_2", "name": "Responsive Styling", "category": "technical_skills"}
                ],
                "difficulty": "medium",
                "estimated_time": "6-8 minutes",
                "evaluation_criteria": ["component_structure", "prop_handling", "responsive_design", "code_quality", "procedural_compliance"]
            }""",
            agent=agent
        )
    
    @staticmethod
    def generate_single_debugging_task(agent, question_number, skill_distribution, industry_context, previous_questions="None", variation_hint=""):
        return Task(
            description=f"""Generate exactly ONE high-quality debugging question that is CONTEXT-AWARE and TECHNOLOGY-SPECIFIC.
            
            Question Number: {question_number}
            Skill Distribution: {skill_distribution}
            Industry Context: {industry_context}
            Previous Questions: {previous_questions}
            Variation Focus: {variation_hint}
            
            CRITICAL CONTEXT-AWARENESS REQUIREMENTS:
            1. Review the skill distribution to identify SPECIFIC technologies and frameworks
            2. Check for SOP (Standard Operating Procedures) context in the skill descriptions
            3. Create buggy code using their actual technology stack
            4. Include bugs relevant to their skill descriptions and competency areas
            5. Use realistic scenarios from their domain expertise
            6. Focus on common issues in their preferred technologies
            7. If SOPs are present - include bugs related to procedural non-compliance or quality standard violations
            
            SOP INTEGRATION FOR DEBUGGING:
            - If skill descriptions mention procedures - create bugs that violate established workflows or standards
            - If quality standards are mentioned - include bugs that break quality control, testing, or documentation requirements
            - If compliance requirements exist - create bugs that violate security, data protection, or regulatory standards
            - If procedural requirements are found - include bugs in error handling, logging, or audit trail implementations
            
            CRITICAL: You MUST generate a question that is completely different from any previous questions.
            Review the previous questions and ensure your new question:
            1. Tests different types of bugs within their technology stack
            2. Uses different code scenarios but relevant to their frameworks and procedures
            3. Focuses on different bug patterns within their preferred languages
            4. Has different complexity levels but appropriate to their competency
            5. Addresses different procedural violations if SOPs are present
            
            Your task is to:
            1. Create 1 focused debugging question (5-6 minutes)
            2. Provide buggy code using THEIR SPECIFIC technology stack
            3. Include realistic bugs common in their frameworks/languages
            4. Use scenarios relevant to their skill descriptions AND operational procedures
            5. Test debugging skills appropriate to their competency level
            6. Specify exactly what needs to be debugged in their technology context and procedural context
            7. Provide expected behavior relevant to their technology stack and compliance requirements
            8. CRITICAL: Store the buggy code in a 'code' field for frontend display
            9. Make it realistic and relevant to their actual work context and procedural requirements
            10. ENSURE it's completely different from previous questions but technology-specific and procedure-aware
            
            EXAMPLES OF CONTEXT-AWARE DEBUGGING WITH SOP INTEGRATION:
            - If they have component framework skills + quality procedures: Buggy components with reactivity, lifecycle, or rendering issues AND missing documentation or testing violations
            - If they have typed language skills + compliance requirements: Type-related bugs, interface mismatches, or generic constraints AND data validation or security violations
            - If they have styling framework skills + accessibility standards: Layout bugs, responsive issues, or framework-specific conflicts AND accessibility compliance violations
            - If they have API development skills + audit procedures: Request handling bugs, async patterns, or data parsing errors AND missing logging or audit trail issues
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with 1 context-aware debugging question:
            {
                "id": "debug_X",
                "type": "debugging",
                "question": "Review this component and fix the reactivity, styling, and procedural compliance issues. The component should update the display when data changes, maintain responsive layout, and meet documentation standards.",
                "code": "// Buggy code using user's technology stack\\n// Contains realistic bugs common to their frameworks\\n// Includes reactivity, styling, or logic issues\\n// Also includes procedural violations like missing documentation or compliance issues",
                "language": "framework_language",
                "file_extension": ".ext",
                "task_instruction": "Fix the reactivity issue, add responsive design, and ensure procedural compliance",
                "expected_behavior": "Component should update display when data changes, be responsive across devices, and meet quality/compliance standards",
                "bug_types": ["reactivity_issue", "responsive_layout_problem", "procedural_compliance_violation"],
                "technology_focus": "Component framework with styling methodology",
                "procedural_context": "Documentation standards, quality control requirements, compliance protocols",
                "skills": [
                    {"id": "skill_id", "name": "Component Development", "category": "technical_skills"},
                    {"id": "skill_id_2", "name": "Responsive Design", "category": "technical_skills"}
                ],
                "difficulty": "medium",
                "estimated_time": "5-6 minutes",
                "evaluation_criteria": ["bug_identification", "framework_knowledge", "responsive_design", "fix_quality", "procedural_compliance"]
            }""",
            agent=agent
        )
    
    @staticmethod
    def generate_single_theory_task(agent, question_number, skill_distribution, industry_context, previous_questions="None", variation_hint=""):
        return Task(
            description=f"""Generate exactly ONE high-quality theory/conceptual question that is CONTEXT-AWARE and TECHNOLOGY-SPECIFIC.
            
            Question Number: {question_number}
            Skill Distribution: {skill_distribution}
            Industry Context: {industry_context}
            Previous Questions: {previous_questions}
            Variation Focus: {variation_hint}
            
            CRITICAL CONTEXT-AWARENESS REQUIREMENTS:
            1. Review the skill distribution to identify their SPECIFIC technology stack
            2. Check for SOP (Standard Operating Procedures) context in the skill descriptions
            3. Ask about architectural decisions relevant to their frameworks AND operational procedures
            4. Focus on best practices within their preferred technologies AND compliance requirements
            5. Consider their competency levels when setting question complexity
            6. Use realistic scenarios from their technology domain AND procedural context
            7. If SOPs are present - incorporate governance, compliance, and procedural decision-making
            
            SOP INTEGRATION FOR THEORY QUESTIONS:
            - If skill descriptions mention procedures - ask about workflow design, process optimization, and procedural decision-making
            - If quality standards are mentioned - include questions about quality assurance, testing strategies, and standard implementation
            - If compliance requirements exist - ask about regulatory compliance, audit readiness, and risk management in technical decisions
            - If procedural requirements are found - explore governance frameworks, documentation strategies, and operational excellence
            
            CRITICAL: You MUST generate a question that is completely different from any previous questions.
            Review the previous questions and ensure your new question:
            1. Tests different architectural concepts within their technology stack
            2. Covers different aspects of their preferred frameworks/languages AND operational procedures
            3. Focuses on different design decisions relevant to their skills AND compliance requirements
            4. Uses different business scenarios but appropriate to their expertise AND procedural context
            5. Addresses different governance or compliance aspects if SOPs are present
            
            Your task is to:
            1. Create 1 conceptual question (4-5 minutes)
            2. Focus on architecture/design decisions within their technology stack AND operational framework
            3. Ask about best practices relevant to their specific skills AND procedural requirements
            4. Include technology comparisons within their domain AND compliance considerations
            5. Test understanding of trade-offs in their preferred frameworks AND operational constraints
            6. Create scenarios relevant to their skill descriptions AND procedural contexts
            7. Focus on "how would you" questions within their technology context AND operational environment
            8. Test decision-making appropriate to their competency level AND procedural responsibilities
            9. Make it industry-relevant and technology-specific AND procedure-aware
            10. ENSURE it's completely different from previous questions but contextually relevant and procedurally informed
            
            EXAMPLES OF CONTEXT-AWARE THEORY WITH SOP INTEGRATION:
            - If they have frontend framework skills + quality procedures: Ask about application architecture, state management, scalability patterns AND quality assurance integration, testing strategies
            - If they have styling methodology skills + accessibility standards: Inquire about design system structure, responsive architecture AND accessibility compliance, inclusive design practices
            - If they have API development skills + security compliance: Question about service design, rate limiting, caching strategies AND security protocols, audit logging, data protection
            - If they have database skills + data governance: Explore schema design, optimization, scaling approaches AND data privacy, retention policies, backup procedures
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with 1 context-aware theory question:
            {
                "id": "theory_X",
                "type": "theory",
                "question": "You're building a large-scale application with multiple teams that must comply with data protection regulations and quality standards. Explain your approach to architecture, state management, code organization, and compliance integration. What patterns would you use and how would you ensure procedural adherence?",
                "context": "Large-scale application with multiple development teams and regulatory requirements",
                "focus_area": "Application architecture, scalability, and compliance integration",
                "technology_focus": "Framework ecosystem, state management, component design",
                "procedural_context": "Data protection compliance, quality standards, team governance, audit requirements",
                "skills": [
                    {"id": "skill_id", "name": "Framework Development", "category": "technical_skills"}
                ],
                "difficulty": "medium",
                "estimated_time": "4-5 minutes",
                "evaluation_criteria": ["framework_knowledge", "architectural_thinking", "scalability_considerations", "team_collaboration", "compliance_awareness", "procedural_understanding"],
                "expected_discussion_points": ["component_composition", "state_management", "code_organization", "team_workflows", "compliance_integration", "quality_assurance"]
            }""",
            agent=agent
        )
    
    @staticmethod
    def generate_single_application_task(agent, question_number, skill_distribution, industry_context):
        return Task(
            description=f"""Generate exactly ONE comprehensive application-based question that integrates TECHNICAL SKILLS with DOMAIN KNOWLEDGE.
            
            Question Number: {question_number}
            Skill Distribution: {skill_distribution}
            Industry Context: {industry_context}
            
            CRITICAL DOMAIN KNOWLEDGE INTEGRATION REQUIREMENTS:
            1. Review the skill distribution to identify BOTH technical skills AND domain knowledge requirements
            2. Check for domain-specific expertise areas (fintech, healthcare, biotech, regulatory, etc.)
            3. Integrate domain knowledge into the business scenario and technical requirements
            4. Include industry-specific considerations, regulations, and business terminology
            5. Test understanding of domain-specific challenges, compliance requirements, and business context
            6. Create scenarios that require both technical implementation AND domain expertise
            7. Include regulatory, compliance, or industry-specific constraints where relevant
            
            DOMAIN KNOWLEDGE INTEGRATION EXAMPLES:
            - If domain knowledge includes fintech: Create scenarios involving payment processing, financial regulations, risk management, fraud detection
            - If domain knowledge includes healthcare: Include patient data privacy (HIPAA), medical device regulations, clinical workflows
            - If domain knowledge includes biotech: Consider drug discovery processes, FDA compliance, clinical trial data management
            - If domain knowledge includes e-commerce: Include inventory management, customer experience, payment gateways, analytics
            - If domain knowledge includes regulatory compliance: Include audit trails, data governance, risk assessment, legal requirements
            
            Your task is to:
            1. Create 1 comprehensive application question (8-10 minutes)
            2. Design a realistic business scenario that requires multiple technical skills AND domain expertise
            3. Integrate frontend, backend, system considerations AND domain-specific requirements
            4. Test both technical implementation knowledge AND business/domain understanding
            5. Create a scenario that mirrors actual work challenges in the candidate's domain
            6. Require consideration of: UI/UX, data flow, architecture, AND domain-specific constraints
            7. Include industry-specific regulations, compliance requirements, or business processes
            8. Make it complex enough to be realistic but completable in 8-10 minutes
            9. Ensure domain knowledge is essential to providing a complete solution
            10. Include domain-specific terminology, metrics, and success criteria
            
            CRITICAL: The question must require BOTH technical skills AND domain knowledge to answer completely.
            The candidate should demonstrate understanding of the industry context, regulatory requirements,
            business processes, and technical implementation all together.
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with 1 comprehensive application question integrating domain knowledge:
            {
                "id": "app_X",
                "type": "application",
                "question": "You're tasked with building a secure patient data management system for a telehealth platform that must comply with HIPAA regulations. Describe your complete approach including frontend design for patient/provider interfaces, backend architecture for secure data handling, database design for medical records, API design for third-party integrations, and compliance measures for audit trails and data protection.",
                "business_context": "Healthcare telehealth platform serving multiple medical practices with strict regulatory requirements",
                "domain_context": "Healthcare domain with HIPAA compliance, patient privacy, medical workflows, and regulatory oversight",
                "requirements": ["HIPAA compliance", "secure data handling", "audit trails", "scalable architecture", "user-friendly interfaces", "third-party integrations"],
                "constraints": ["regulatory compliance", "data encryption requirements", "audit logging", "patient consent management", "existing healthcare systems integration"],
                "domain_considerations": ["patient privacy rights", "medical data standards", "healthcare workflows", "provider credentialing", "insurance integration"],
                "skills": [
                    {"id": "skill_id", "name": "skill_name", "category": "technical_skills"},
                    {"id": "domain_skill_id", "name": "healthcare_compliance", "category": "domain_knowledge"}
                ],
                "difficulty": "high",
                "estimated_time": "8-10 minutes",
                "evaluation_criteria": ["completeness", "feasibility", "technical_depth", "business_understanding", "domain_expertise", "compliance_awareness", "regulatory_knowledge"],
                "expected_components": ["frontend", "backend", "database", "api_design", "security_measures", "compliance_framework", "audit_system"],
                "domain_specific_requirements": ["HIPAA compliance implementation", "patient data encryption", "healthcare interoperability standards", "medical workflow integration"]
            }""",
            agent=agent
        )
    
    @staticmethod
    def generate_single_soft_skills_task(agent, question_number, soft_skills, industry_context, previous_questions="None", variation_hint=""):
        return Task(
            description=f"""Generate exactly ONE high-quality soft skills question that is UNIQUE and DIFFERENT from previous questions.
            
            Question Number: {question_number}
            Soft Skills to Cover: {soft_skills}
            Industry Context: {industry_context}
            Previous Questions: {previous_questions}
            Variation Focus: {variation_hint}
            
            CRITICAL: You MUST generate a question that is completely different from any previous questions.
            Review the previous questions and ensure your new question:
            1. Tests different soft skills or combinations of skills
            2. Uses different workplace scenarios and contexts
            3. Focuses on different professional situations
            4. Has different evaluation angles and criteria
            
            Your task is to:
            1. Create 1 soft skills question that covers specific soft skills
            2. Use realistic workplace scenarios for the question
            3. Test communication, leadership, teamwork, problem-solving, or adaptability
            4. Create questions that allow objective evaluation of soft skills
            5. Include scenarios that professionals actually encounter
            6. Structure questions for clear, measurable responses
            7. Make it realistic and industry-relevant
            8. ENSURE it's completely different from previous questions
            
            Question Categories to choose from:
            - Communication & Leadership
            - Teamwork & Collaboration
            - Problem-Solving & Adaptability
            - Professional Skills & Management
            
            CRITICAL: Return ONLY valid JSON with no markdown or explanatory text.""",
            expected_output="""A JSON object with 1 unique soft skills question:
            {
                "id": "soft_X",
                "type": "soft_skills",
                "question": "Describe a situation where you had to explain a complex technical concept to a non-technical stakeholder. How did you ensure they understood the key points?",
                "scenario": "Cross-functional team communication scenario",
                "skills": [
                    {"id": "skill_id", "name": "skill_name", "category": "soft_skills"}
                ],
                "focus_area": "communication_leadership",
                "estimated_time": "3-4 minutes",
                "evaluation_criteria": ["clarity", "leadership_potential", "communication_effectiveness"],
                "response_structure": "STAR method (Situation, Task, Action, Result)"
            }""",
            agent=agent
        ) 