"""
Adivirtus AI Assessment Service
 
This service handles assessment data processing and interpretation.
"""

import logging
import json
from datetime import datetime
from supabase import create_client, Client
import os
import asyncio
from dotenv import load_dotenv

from .interpreter import interpret_assessment
from .interpreter_recommendations import InterpreterRecommendations
from .interpreter.dimension_calculator import DimensionCalculator
from .interpreter.style_distribution import StyleDistribution
from .interpreter.cognitive_load import CognitiveLoadCalculator
from .interpreter.learning_velocity import VelocityPredictor

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

class CombinedInterpreter:
    """Combined interpreter class that delegates to interpreter modules"""
    def __init__(self):
        try:
            from .interpreter_recommendations import InterpreterRecommendations
            from .interpreter.dimension_calculator import DimensionCalculator
            from .interpreter.cognitive_load import CognitiveLoadCalculator
            from .interpreter.learning_velocity import VelocityPredictor
            from .interpreter.style_distribution import StyleDistribution
            
            self.recommendations = InterpreterRecommendations()
            self.dimension_calculator = DimensionCalculator()
            self.cognitive_calculator = CognitiveLoadCalculator()
            self.velocity_predictor = VelocityPredictor()
            self.style_distribution_class = StyleDistribution
            logger.info("CombinedInterpreter initialized successfully with all components")
        except Exception as e:
            logger.error(f"Error initializing CombinedInterpreter: {str(e)}", exc_info=True)
            # Initialize with at least the components that work
            self.recommendations = InterpreterRecommendations()
            self.dimension_calculator = DimensionCalculator()
    
    def interpret_assessment(self, responses):
        """Delegate to the modular interpreter"""
        try:
            logger.debug("Calling interpret_assessment module function")
            return interpret_assessment(responses)
        except Exception as e:
            logger.error(f"Error in interpret_assessment: {str(e)}", exc_info=True)
            raise
    
    def calculate_dimensions(self, responses):
        """Delegate to the dimension calculator"""
        try:
            logger.debug("Calling calculate_dimensions method")
            processed_responses = self._preprocess_responses(responses)
            return self.dimension_calculator.calculate_dimensions(processed_responses)
        except Exception as e:
            logger.error(f"Error in calculate_dimensions: {str(e)}", exc_info=True)
            raise
    
    def _preprocess_responses(self, responses):
        """Pre-process responses before dimension calculation"""
        try:
            processed = {}
            
            # Group responses by parameter
            parameter_responses = {}
            for question_id, response_data in responses.items():
                parameter = response_data.get('parameter')
                if parameter:
                    if parameter not in parameter_responses:
                        parameter_responses[parameter] = []
                    parameter_responses[parameter].append({
                        'question_id': question_id,
                        'value': response_data.get('value'),
                        'timestamp': response_data.get('timestamp')
                    })
            
            # Process each parameter and its responses
            for parameter, responses_list in parameter_responses.items():
                # For parameters with multiple responses, merge them intelligently
                if len(responses_list) > 1:
                    # Sort by timestamp if available
                    responses_list.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
                    
                    # Use most recent response's value
                    most_recent = responses_list[0]
                    value = most_recent['value']
                else:
                    # Only one response
                    value = responses_list[0]['value']
                
                # Create processed data structure
                processed[parameter] = value
            
            return processed
        except Exception as e:
            logger.error(f"Error in _preprocess_responses: {str(e)}", exc_info=True)
            return responses  # Return original responses if preprocessing fails
    
    def generate_content_delivery_recommendations(self, learner_profile):
        """Generate content delivery recommendations using the recommendations module"""
        try:
            logger.debug("Calling generate_content_delivery_recommendations method")
            return self.recommendations.generate_content_delivery_recommendations(learner_profile)
        except Exception as e:
            logger.error(f"Error in generate_content_delivery_recommendations: {str(e)}", exc_info=True)
            raise

class AssessmentService:
    """Service for handling assessment data and interpretation"""
    
    def __init__(self):
        self.supabase = None
        self.interpreter = CombinedInterpreter()
        self._init_supabase()
        
    def _init_supabase(self):
        """Initialize the Supabase client"""
        try:
            if not SUPABASE_URL or not SUPABASE_KEY:
                logger.error("Missing Supabase configuration: URL or service key not set")
                return
                
            self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("Supabase client initialized successfully in AssessmentService")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            self.supabase = None
    
    async def process_assessment(self, assessment_id):
        """
        Process an assessment by ID and generate interpretation results
        
        Args:
            assessment_id: UUID of the assessment to process
            
        Returns:
            Dict: Interpretation results or error message
        """
        try:
            if not self.supabase:
                self._init_supabase()
                if not self.supabase:
                    return {"error": "Supabase client is not initialized"}
            
            # Fetch assessment data
            logger.info(f"Fetching assessment data for ID: {assessment_id}")
            assessment_data = await self._fetch_assessment_data(assessment_id)
            
            if not assessment_data:
                return {"error": f"Assessment with ID {assessment_id} not found"}
            
            # Extract user_id and answers from assessment data
            user_id = assessment_data.get('user_id')
            answers = assessment_data.get('answers', {})
            
            if not user_id or not answers:
                return {"error": "Invalid assessment data: missing user_id or answers"}
            
            # Check if an interpretation already exists
            existing_interpretation = await self._check_existing_interpretation(assessment_id)
            
            # Process the interpretation directly, even if it exists but is still pending
            if not existing_interpretation or existing_interpretation.get('interpreted_result', {}).get('status') == 'pending':
                # Generate interpretation
                logger.info(f"Generating interpretation for assessment ID: {assessment_id}")
                interpretation_results = await self._generate_interpretation(answers)
                
                # Store interpretation results
                await self._store_interpretation_results(user_id, assessment_id, interpretation_results)
                
                return {"message": "Assessment interpretation completed successfully", "data": interpretation_results}
            else:
                logger.info(f"Interpretation already exists for assessment ID: {assessment_id}")
                return {"message": "Interpretation already exists", "data": existing_interpretation.get('interpreted_result', {})}
            
        except Exception as e:
            logger.error(f"Error processing assessment {assessment_id}: {str(e)}")
            return {"error": f"Failed to process assessment: {str(e)}"}
    
    async def process_pending_results(self):
        """
        Process all pending interpretation results
        
        Returns:
            int: Number of results processed
        """
        try:
            if not self.supabase:
                self._init_supabase()
                if not self.supabase:
                    return 0
            
            # Fetch pending results - using proper JSONB query syntax
            def fetch_pending():
                # Use proper JSON containment operator for JSONB fields
                response = self.supabase.table('lsa_result').select('*')\
                    .filter('interpreted_result', 'cs', '{"status":"pending"}')\
                    .execute()
                return response.data
                
            pending_results = await asyncio.to_thread(fetch_pending)
            
            count = 0
            for result in pending_results:
                try:
                    # Process each pending result
                    await self.process_assessment(result['assessment_id'])
                    count += 1
                except Exception as e:
                    logger.error(f"Error processing pending result {result['id']}: {str(e)}")
            
            return count
            
        except Exception as e:
            logger.error(f"Error processing pending results: {str(e)}")
            return 0
    
    async def _fetch_assessment_data(self, assessment_id):
        """
        Fetch assessment data from Supabase
        
        Args:
            assessment_id: UUID of the assessment
            
        Returns:
            Dict: Assessment data or None
        """
        try:
            # Use asyncio to run the synchronous Supabase call
            def fetch_data():
                response = self.supabase.table('lsa_assessment').select('*').eq('id', assessment_id).single().execute()
                return response.data
            
            return await asyncio.to_thread(fetch_data)
        except Exception as e:
            logger.error(f"Error fetching assessment data: {str(e)}")
            return None
    
    async def _check_existing_interpretation(self, assessment_id):
        """
        Check if interpretation already exists for the assessment
        
        Args:
            assessment_id: UUID of the assessment
            
        Returns:
            Dict: Existing interpretation data or None
        """
        try:
            # Use asyncio to run the synchronous Supabase call
            def check_data():
                response = self.supabase.table('lsa_result').select('*').eq('assessment_id', assessment_id).single().execute()
                return response.data
            
            return await asyncio.to_thread(check_data)
        except Exception as e:
            logger.debug(f"No existing interpretation found: {str(e)}")
            return None
    
    async def _generate_interpretation(self, answers):
        """
        Generate interpretation from assessment answers
        
        Args:
            answers: Dict of assessment answers
            
        Returns:
            Dict: Interpretation results
        """
        try:
            logger.info("Starting interpretation process with new modular structure")
            
            # Using the new interpreter structure
            logger.debug(f"Calling interpret_assessment with answers containing {len(answers)} items")
            learner_profile = self.interpreter.interpret_assessment(answers)
            logger.info("Successfully generated learner profile")
            
            # Generate content delivery recommendations
            logger.debug("Generating content delivery recommendations")
            content_recommendations = self.interpreter.generate_content_delivery_recommendations(learner_profile)
            logger.info("Successfully generated content delivery recommendations")
            
            # Extract consistency scores if available from enhanced interpreter
            consistency_metadata = {}
            if 'rawDimensions' in learner_profile:
                for key, value in learner_profile.get('rawDimensions', {}).items():
                    if isinstance(value, dict) and 'consistency_score' in value:
                        consistency_metadata[key] = value['consistency_score']
            
            # Create interpretation results
            timestamp = datetime.now().isoformat()
            
            # Enhanced metadata with cognitive load factors and probabilistic ranges if available
            enhanced_metadata = {
                "confidence": learner_profile.get('velocityPrediction', {}).get('confidence', 0.7),
                "processingTime": "0",  # Placeholder, would be actual time in production
                "version": "2.0"  # Updated version number
            }
            
            # Add consistency metadata if available
            if consistency_metadata:
                enhanced_metadata["responseConsistency"] = consistency_metadata
            
            # Add probabilistic ranges if available
            if 'probabilisticRanges' in learner_profile.get('velocityPrediction', {}):
                enhanced_metadata["probabilisticTimeRanges"] = learner_profile['velocityPrediction']['probabilisticRanges']
            
            # Add cognitive load factors if available
            if 'cognitiveProfile' in learner_profile:
                enhanced_metadata["cognitiveLoadFactors"] = learner_profile['cognitiveProfile']
            
            interpretation_results = {
                "status": "completed",
                "timestamp": timestamp,
                "learnerProfile": learner_profile,
                "contentRecommendations": content_recommendations,
                "rawResponses": answers,
                "processingMetadata": enhanced_metadata
            }
            
            logger.info("Completed interpretation processing successfully")
            return interpretation_results
            
        except Exception as e:
            logger.error(f"Error generating interpretation: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
    
    async def _store_interpretation_results(self, user_id, assessment_id, interpretation_results):
        """
        Store interpretation results in Supabase
        
        Args:
            user_id: UUID of the user
            assessment_id: UUID of the assessment
            interpretation_results: Dict of interpretation results
            
        Returns:
            bool: Success status
        """
        try:
            # Use asyncio to run the synchronous Supabase call
            def store_data():
                # Check if entry already exists
                existing = self.supabase.table('lsa_result').select('id').eq('assessment_id', assessment_id).execute()
                
                if existing.data:
                    # Update existing record
                    result = self.supabase.table('lsa_result').update({
                        'interpreted_result': interpretation_results
                    }).eq('assessment_id', assessment_id).execute()
                else:
                    # Insert new record
                    result = self.supabase.table('lsa_result').insert({
                        'user_id': user_id,
                        'assessment_id': assessment_id,
                        'interpreted_result': interpretation_results
                    }).execute()
                
                return result.data
            
            result = await asyncio.to_thread(store_data)
            logger.info(f"Stored interpretation results: {result}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing interpretation results: {str(e)}")
            return False

# Create singleton instance of the service
assessment_service = AssessmentService() 