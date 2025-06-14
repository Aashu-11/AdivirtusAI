"""
Adivirtus AI Assessment Interpreter - Base Module

This defines the main AssessmentInterpreter class that coordinates the
interpretation of assessment responses.
"""

import logging
from .style_distribution import StyleDistribution
from .cognitive_load import CognitiveLoadCalculator
from .learning_velocity import VelocityPredictor
from .dimension_calculator import DimensionCalculator

logger = logging.getLogger(__name__)

class AssessmentInterpreter:
    """
    Main interpreter class for assessment results
    
    This class coordinates the interpretation of assessment responses to generate
    a comprehensive learner profile with learning styles, optimal conditions,
    content preferences, and velocity predictions.
    """
    
    def __init__(self):
        """Initialize the interpreter with necessary components"""
        # Parameter weight configuration
        self.parameter_weights = {
            # Core learning style weights
            'LearningStyle-Technical': 1.0,
            'LearningStyle-Creative': 0.8,
            'LearningStyle-Memory': 0.9,
            'LearningStyle-ContextDependent': 0.9,
            'LearningStyle-MultimodalPreferences': 1.0,
            'LearningStyle-Technology': 0.8,
            'LearningStyle-LogicalProcessing': 0.9,
            'LearningStyle-SelfAssessment': 1.2,  # Higher weight for direct self-assessment
            
            # Learning efficiency weights
            'LearningEfficiency-TimeOfDay': 0.7,
            'LearningEfficiency-Duration': 0.8,
            
            # Cognitive factors weights
            'HoneyMumford-Collaborative': 0.7,
            'HoneyMumford-Individual': 0.8,
            'CognitiveLoad': 0.6,
            'CognitiveLoad-Management': 0.7,
            'Attention-Context': 0.6,
            
            # Knowledge acquisition weights
            'SkillAcquisition-Complexity': 0.9,
            'PriorKnowledgeIntegration': 0.7,
            'Knowledge-Transfer': 0.6,
            
            # Environmental factors weights
            'PsychologicalSafety': 0.5,
            'MediaPreference': 0.6,
            'DistractionSensitivity': 0.5,
            
            # Performance factors weights
            'FeedbackUtilization': 0.7,
            'FeedbackTiming': 0.6,
            'Problem-Solution-Mapping': 0.6,
            'Learning-Adaptability': 0.5,
            
            # Motivation and velocity weights
            'Motivation-Drivers': 0.6,
            'LearningVelocity': 0.8
        }
        
        # Initialize component calculators
        self.dimension_calculator = DimensionCalculator()
        self.cognitive_calculator = CognitiveLoadCalculator()
        self.velocity_predictor = VelocityPredictor()
        
        # Content format matching matrix
        self.content_format_matrix = {
            'Visual': {
                'primary': ['video-tutorials', 'infographics', 'diagrams', 'visual-demos', 'animated-examples'],
                'secondary': ['written-guides-with-images', 'screencasts', 'interactive-visualizations']
            },
            'Auditory': {
                'primary': ['audio-lectures', 'podcasts', 'narrated-presentations', 'discussion-groups', 'verbal-instructions'],
                'secondary': ['interactive-discussions', 'audio-summaries', 'read-aloud-content']
            },
            'Kinesthetic': {
                'primary': ['hands-on-exercises', 'interactive-simulations', 'practice-projects', 'role-playing', 'problem-solving-activities'],
                'secondary': ['guided-walkthroughs', 'step-by-step-instructions', 'lab-environments']
            },
            'ReadWrite': {
                'primary': ['written-manuals', 'detailed-documentation', 'text-based-tutorials', 'note-taking-exercises', 'written-summaries'],
                'secondary': ['annotated-guides', 'text-with-reflection-questions', 'writing-assignments']
            }
        }
    
    def interpret_assessment(self, responses):
        """
        Interpret assessment responses to generate a learner profile
        
        Args:
            responses: Dict - Raw assessment responses
            
        Returns:
            Dict - Complete learner profile with all dimensions
        """
        # Preprocess the responses
        processed_responses = self.preprocess_responses(responses)
        
        # Calculate learning dimensions
        dimensions = self.dimension_calculator.calculate_dimensions(processed_responses)
        
        # Calculate cognitive load profile
        cognitive_load = self.cognitive_calculator.calculate_load_dimensions(processed_responses)
        
        # Generate basic learner profile
        learner_profile = self.generate_learner_profile(dimensions, cognitive_load)
        
        # Predict learning velocity
        velocity = self.velocity_predictor.predict_velocity(
            dimensions, 
            cognitive_load,
            learner_profile['learningStyles']
        )
        
        # Add velocity prediction to profile
        learner_profile['velocityPrediction'] = velocity
        
        # Add raw dimensions for debugging/analysis
        learner_profile['rawDimensions'] = dimensions
        
        return learner_profile
    
    def preprocess_responses(self, responses):
        """
        Process raw assessment responses into a structured format
        
        Args:
            responses: Dict - Raw assessment responses
            
        Returns:
            Dict - Processed responses with additional metadata
        """
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
            # Get base weight for this parameter
            base_weight = self.parameter_weights.get(parameter, 0.5)
            
            # Calculate consistency across multiple responses to same parameter
            consistency_score = self._calculate_response_consistency(responses_list)
            
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
            data = {
                'value': value,
                'raw_responses': responses_list,
                'weight': base_weight,
                'distribution': self._create_style_distribution(parameter, value)
            }
            
            # Apply consistency factor to weight (reduced from 20% to 10% max boost)
            consistency_factor = 1.0 + (consistency_score * 0.1)
            
            # Update the weight with consistency factor
            data['weight'] = min(1.0, data['weight'] * consistency_factor)
            
            # Add consistency metadata
            data['consistency_score'] = consistency_score
            data['adjusted_weight'] = data['weight']
            
            # Remove raw responses to keep the object clean
            data.pop('raw_responses', None)
            
            processed[parameter] = data
        
        return processed
    
    def _create_style_distribution(self, parameter, value):
        """
        Create a StyleDistribution object from a response value
        
        Args:
            parameter: String - Parameter of the question
            value: Mixed - Response value (can be string or complex object)
            
        Returns:
            StyleDistribution - Distribution of learning styles
        """
        # For parameters that directly map to learning styles
        vark_parameters = [
            'LearningStyle-Technical', 'LearningStyle-Creative', 'LearningStyle-Memory',
            'LearningStyle-ContextDependent', 'LearningStyle-Technology'
        ]
        
        multimodal_parameters = [
            'LearningStyle-MultimodalPreferences', 'LearningStyle-LogicalProcessing'
        ]
        
        # Handle special case for self-assessment
        if parameter == 'LearningStyle-SelfAssessment':
            # For the direct self-assessment question
            if value == 'Multimodal':
                # Equal weight for all VARK modalities
                return StyleDistribution({
                    'Visual': 0.25, 
                    'Auditory': 0.25, 
                    'Kinesthetic': 0.25, 
                    'ReadWrite': 0.25
                })
            return StyleDistribution(value)
        
        # Handle direct VARK parameters
        if parameter in vark_parameters:
            return StyleDistribution(value)
        
        # Handle multimodal parameters with complex values
        if parameter in multimodal_parameters:
            if isinstance(value, dict):
                return StyleDistribution(value)
            
            # Handle hyphenated values like 'Visual-Kinesthetic'
            if isinstance(value, str) and '-' in value:
                styles = value.split('-')
                if len(styles) == 2:
                    # Default distribution for hyphenated pairs
                    return StyleDistribution({
                        styles[0]: 0.6,
                        styles[1]: 0.4
                    })
            
            return StyleDistribution(value)  # Fallback for simple string values
        
        # Default case - no distribution
        return None
    
    def _calculate_response_consistency(self, responses):
        """
        Calculate consistency score for multiple responses to the same parameter
        
        This uses semantic similarity for complex values rather than exact matches
        
        Args:
            responses: List - Multiple responses for the same parameter
            
        Returns:
            float - Consistency score from 0-1 (higher is more consistent)
        """
        if not responses or len(responses) <= 1:
            return 1.0  # Default max consistency for single responses
            
        # Simple implementation: If all values are identical, max consistency
        values = [r['value'] for r in responses]
        
        # Handle complex values (dictionaries)
        if any(isinstance(v, dict) for v in values):
            # Create StyleDistribution objects for each value
            distributions = []
            for value in values:
                if isinstance(value, dict):
                    distributions.append(StyleDistribution(value))
                else:
                    distributions.append(StyleDistribution(value))
            
            # Calculate pairwise similarity scores
            similarity_sum = 0
            comparison_count = 0
            
            for i in range(len(distributions)):
                for j in range(i+1, len(distributions)):
                    similarity_sum += distributions[i].similarity_score(distributions[j])
                    comparison_count += 1
            
            # Average similarity
            if comparison_count > 0:
                return similarity_sum / comparison_count
            
            return 0.5  # Moderate consistency if can't determine
            
        # For simple string values, calculate ratio of most common value
        value_counts = {}
        for value in values:
            value_counts[value] = value_counts.get(value, 0) + 1
            
        most_common_count = max(value_counts.values())
        return most_common_count / len(values)
    
    def generate_learner_profile(self, dimensions, cognitive_load):
        """
        Generate learner profile based on calculated dimensions
        
        Args:
            dimensions: Dict - Calculated dimension values
            cognitive_load: Dict - Cognitive load dimensions
            
        Returns:
            Dict - Comprehensive learner profile
        """
        # Determine primary and secondary learning styles (VARK)
        vark_styles = {
            'Visual': dimensions.get('VisualLearning', 0),
            'Auditory': dimensions.get('AuditoryLearning', 0),
            'Kinesthetic': dimensions.get('KinestheticLearning', 0),
            'ReadWrite': dimensions.get('ReadWriteLearning', 0)
        }
        
        # Check for strong multimodal preference
        multimodal_score = dimensions.get('MultimodalLearning', 0)
        if multimodal_score > 0.6:  # Threshold for strong multimodal preference
            vark_styles['Multimodal'] = multimodal_score
        
        sorted_vark_styles = sorted(vark_styles.items(), key=lambda x: x[1], reverse=True)
        sorted_vark_styles = [{"style": style, "score": score} for style, score in sorted_vark_styles]
        
        # Determine primary and secondary learning approaches (Honey & Mumford)
        hm_styles = {
            'Activist': dimensions.get('Activist', 0),
            'Reflector': dimensions.get('Reflector', 0),
            'Theorist': dimensions.get('Theorist', 0),
            'Pragmatist': dimensions.get('Pragmatist', 0)
        }
        
        sorted_hm_styles = sorted(hm_styles.items(), key=lambda x: x[1], reverse=True)
        sorted_hm_styles = [{"style": style, "score": score} for style, score in sorted_hm_styles]
        
        # Create the comprehensive learner profile
        profile = {
            'learningStyles': {
                'primary': sorted_vark_styles[0]['style'],
                'secondary': sorted_vark_styles[1]['style'],
                'scores': vark_styles,
                'is_multimodal': multimodal_score > 0.6  # Flag for strong multimodal learning
            },
            'learningApproaches': {
                'primary': sorted_hm_styles[0]['style'],
                'secondary': sorted_hm_styles[1]['style'],
                'scores': hm_styles
            },
            'optimalConditions': {
                'timing': dimensions.get('OptimalTiming', 0.5),
                'duration': dimensions.get('OptimalDuration', 0.5),
                'environment': dimensions.get('LearningEnvironment', 0.5)
            },
            'contentPreferences': {
                'sequencing': dimensions.get('ContentSequencing', 0.5),
                'feedback': dimensions.get('FeedbackMechanism', 0.5),
                'motivation': dimensions.get('MotivationalSystem', 0.5),
                'knowledgeIntegration': dimensions.get('KnowledgeAssimilation', 0.5)
            },
            'cognitiveProfile': cognitive_load
        }
        
        # Add calculated style blend for multimodal learners
        if profile['learningStyles']['is_multimodal']:
            top_styles = sorted_vark_styles[:3]
            if len(top_styles) >= 2 and top_styles[1]['score'] > 0.4:
                profile['learningStyles']['style_blend'] = [
                    {"style": style_data['style'], "weight": style_data['score']} 
                    for style_data in top_styles 
                    if style_data['score'] > 0.2  # Only include meaningful scores
                ]
        
        return profile

    def preprocess_dimensions(self, answers):
        """
        Preprocess raw answers into uniform dimensions
        
        Args:
            answers: Dict of raw answers keyed by question ID
            
        Returns:
            Dict of processed dimension values
        """
        dimensions = {}
        consistency_scores = {}
        response_times = []
        
        # Group answers by parameter
        param_answers = {}
        for q_id, answer_data in answers.items():
            param = answer_data.get('parameter')
            if param:
                if param not in param_answers:
                    param_answers[param] = []
                param_answers[param].append(answer_data)
        
        # Process each parameter group
        for param, param_data in param_answers.items():
            # For most parameters, just take the value directly
            if len(param_data) == 1:
                # Simple case - only one question for this parameter
                answer_value = param_data[0].get('value')
                dimensions[param] = answer_value
                
                # Track response time if available
                if 'response_time' in param_data[0]:
                    response_times.append(param_data[0]['response_time'])
            else:
                # Parameter has multiple questions - calculate consistency
                values = [item.get('value') for item in param_data]
                
                # For learning style, calculate consistency between answers
                if param.startswith('LearningStyle'):
                    consistency = self._calculate_style_consistency(values)
                    consistency_scores[param] = consistency
                    
                    # Store all values for advanced processing
                    for i, data in enumerate(param_data):
                        sub_param = f"{param}_{i}"
                        dimensions[sub_param] = data.get('value')
                        
                    # Default to most common value for primary dimension
                    dimensions[param] = self._get_most_common(values)
                    
                # Special handling for LearningVelocity dimensions
                elif param.startswith('LearningVelocity'):
                    # Store each sub-dimension with its specific parameter
                    for data in param_data:
                        # Extract the sub-parameter (after the dash)
                        parts = data.get('parameter', '').split('-')
                        if len(parts) > 1:
                            sub_param = data.get('parameter')  # Use full parameter with dash
                            dimensions[sub_param] = data.get('value')
                            
                            # Track response time if available
                            if 'response_time' in data:
                                response_times.append(data['response_time'])
                
                # For other multi-question dimensions, store all values
                else:
                    for i, data in enumerate(param_data):
                        sub_param = f"{param}_{i}"
                        dimensions[sub_param] = data.get('value')
                        
                    # Default to first value for primary dimension
                    dimensions[param] = param_data[0].get('value')
        
        # Add metadata about answer patterns
        if consistency_scores:
            dimensions['consistency_scores'] = consistency_scores
            
        # Calculate average response time if available
        if response_times:
            dimensions['avg_response_time'] = sum(response_times) / len(response_times)
        
        return dimensions

    def _calculate_style_consistency(self, values):
        """
        Calculate consistency score between multiple style-related answers
        
        Args:
            values: List of style values from different questions
            
        Returns:
            float: Consistency score (0-1 scale, 1 being perfectly consistent)
        """
        if not values or len(values) <= 1:
            return 1.0  # Default to perfect consistency for single answers
            
        # Count occurrences of each value
        value_counts = {}
        for val in values:
            if isinstance(val, dict):  # Handle multimodal values
                for style_key in val.keys():
                    value_counts[style_key] = value_counts.get(style_key, 0) + val.get(style_key, 0.5)
            else:
                value_counts[val] = value_counts.get(val, 0) + 1
        
        # Get total possible count (if all values were the same)
        total_possible = len(values)
        
        # Find the most common value's count
        if not value_counts:
            return 0.5  # Default if we couldn't extract proper values
            
        max_count = max(value_counts.values())
        
        # Calculate consistency as ratio of most common to total
        return max_count / total_possible
    
    def _get_most_common(self, values):
        """
        Get the most common value from a list
        
        Args:
            values: List of values
            
        Returns:
            Most common value
        """
        if not values:
            return None
            
        # Count occurrences
        value_counts = {}
        for val in values:
            if val is not None:
                if isinstance(val, dict):  # Handle multimodal values
                    # For dictionaries, we'll use the key with highest weight
                    highest_key = max(val.items(), key=lambda x: x[1])[0]
                    value_counts[highest_key] = value_counts.get(highest_key, 0) + 1
                else:
                    value_counts[val] = value_counts.get(val, 0) + 1
        
        # Find most common
        if not value_counts:
            return values[0]  # Default to first if counting failed
            
        return max(value_counts.items(), key=lambda x: x[1])[0] 