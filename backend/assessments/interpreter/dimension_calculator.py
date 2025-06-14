"""
Dimension Calculator for assessment interpretation
"""

import logging

logger = logging.getLogger(__name__)

class DimensionCalculator:
    """
    Calculates learning dimensions from assessment responses
    
    This class implements the logic to transform processed responses into
    learning style dimensions and other learning characteristics.
    """
    
    def __init__(self):
        """Initialize the dimension calculator"""
        # Define dimension mappings (parameters that contribute to dimensions)
        self.dimension_mappings = {
            'VisualLearning': [
                'LearningStyle-Technical', 
                'LearningStyle-Creative', 
                'LearningStyle-Memory',
                'LearningStyle-ContextDependent',
                'LearningStyle-MultimodalPreferences',
                'LearningStyle-Technology',
                'LearningStyle-LogicalProcessing',
                'LearningStyle-SelfAssessment'
            ],
            'AuditoryLearning': [
                'LearningStyle-Technical', 
                'LearningStyle-Creative', 
                'LearningStyle-Memory',
                'LearningStyle-ContextDependent',
                'LearningStyle-MultimodalPreferences',
                'LearningStyle-Technology',
                'LearningStyle-LogicalProcessing',
                'LearningStyle-SelfAssessment'
            ],
            'KinestheticLearning': [
                'LearningStyle-Technical', 
                'LearningStyle-Creative', 
                'LearningStyle-Memory',
                'LearningStyle-ContextDependent',
                'LearningStyle-MultimodalPreferences',
                'LearningStyle-Technology',
                'LearningStyle-LogicalProcessing',
                'LearningStyle-SelfAssessment'
            ],
            'ReadWriteLearning': [
                'LearningStyle-Technical', 
                'LearningStyle-Creative', 
                'LearningStyle-Memory',
                'LearningStyle-ContextDependent',
                'LearningStyle-MultimodalPreferences',
                'LearningStyle-Technology',
                'LearningStyle-LogicalProcessing',
                'LearningStyle-SelfAssessment'
            ],
            'MultimodalLearning': [
                'LearningStyle-MultimodalPreferences',
                'LearningStyle-SelfAssessment'
            ],
            
            'Activist': ['HoneyMumford-Collaborative', 'HoneyMumford-Individual'],
            'Reflector': ['HoneyMumford-Collaborative', 'HoneyMumford-Individual'],
            'Theorist': ['HoneyMumford-Collaborative', 'HoneyMumford-Individual'],
            'Pragmatist': ['HoneyMumford-Collaborative', 'HoneyMumford-Individual'],
            
            'OptimalTiming': ['LearningEfficiency-TimeOfDay', 'Attention-Context'],
            'OptimalDuration': ['LearningEfficiency-Duration', 'Attention-Context', 'CognitiveLoad-Management'],
            
            'LearningEnvironment': ['PsychologicalSafety', 'DistractionSensitivity', 'MediaPreference', 'LearningStyle-Technology'],
            
            'ContentSequencing': ['SkillAcquisition-Complexity', 'LearningVelocity', 'Problem-Solution-Mapping'],
            
            'FeedbackMechanism': ['FeedbackUtilization', 'FeedbackTiming'],
            
            'MotivationalSystem': ['Motivation-Drivers', 'PsychologicalSafety'],
            
            'KnowledgeAssimilation': ['PriorKnowledgeIntegration', 'Knowledge-Transfer', 'ContextualLearning', 'LearningStyle-LogicalProcessing']
        }
        
        # Style mappings for VARK dimensions
        self.style_mappings = {
            'VisualLearning': 'Visual',
            'AuditoryLearning': 'Auditory',
            'KinestheticLearning': 'Kinesthetic',
            'ReadWriteLearning': 'ReadWrite'
        }
        
        # Mapping tables for different parameter types
        self.parameter_mappings = {
            'MediaPreference': {
                'DigitalPreference': {
                    'VisualLearning': 0.7, 
                    'AuditoryLearning': 0.6, 
                    'KinestheticLearning': 0.8, 
                    'ReadWriteLearning': 0.5
                },
                'TraditionalPreference': {
                    'VisualLearning': 0.6, 
                    'AuditoryLearning': 0.4, 
                    'KinestheticLearning': 0.3, 
                    'ReadWriteLearning': 0.9
                },
                'BlendedPreference': {
                    'VisualLearning': 0.7, 
                    'AuditoryLearning': 0.7, 
                    'KinestheticLearning': 0.7, 
                    'ReadWriteLearning': 0.7
                },
                'InteractiveContentPreference': {
                    'VisualLearning': 0.6, 
                    'AuditoryLearning': 0.5, 
                    'KinestheticLearning': 0.9, 
                    'ReadWriteLearning': 0.4
                }
            },
            'Attention-Context': {
                'Intensive': {'OptimalTiming': 0.8, 'OptimalDuration': 0.3},
                'Immersive': {'OptimalTiming': 0.6, 'OptimalDuration': 0.9},
                'Varied': {'OptimalTiming': 0.5, 'OptimalDuration': 0.6},
                'Interactive': {'OptimalTiming': 0.7, 'OptimalDuration': 0.6}
            },
            'LearningEfficiency-TimeOfDay': {
                'Morning': {'OptimalTiming': 0.9},
                'Midday': {'OptimalTiming': 0.7},
                'Afternoon': {'OptimalTiming': 0.6},
                'Evening': {'OptimalTiming': 0.8}
            },
            'LearningEfficiency-Duration': {
                'Short': {'OptimalDuration': 0.3},
                'Medium': {'OptimalDuration': 0.6},
                'Long': {'OptimalDuration': 0.8},
                'Extended': {'OptimalDuration': 0.9}
            }
        }
    
    def calculate_dimensions(self, answers):
        """
        Calculate normalized dimension values from answers
        
        Args:
            answers: Dict of raw answers to assessment questions
            
        Returns:
            Dict of calculated dimension values
        """
        try:
            # Preprocess answers into usable dimensions
            dimensions = self.preprocess_dimensions(answers)
            
            # Map categorical values to normalized scores
            normalized_dimensions = {}
            
            # Process each dimension
            for dim_key, dim_value in dimensions.items():
                if dim_key.startswith('LearningStyle'):
                    # Special handling for learning style dimensions
                    normalized_dimensions[dim_key] = self._process_learning_style(dim_key, dim_value)
                    
                elif dim_key.startswith('LearningVelocity'):
                    # Direct mapping for enhanced velocity dimensions - preserve original values 
                    # These will be processed directly by the VelocityPredictor
                    normalized_dimensions[dim_key] = dim_value
                    
                elif dim_key.startswith('HoneyMumford'):
                    # Process Honey Mumford dimensions
                    normalized_dimensions[dim_key] = self._process_honey_mumford(dim_key, dim_value)
                    
                elif dim_key.startswith('Cognitive'):
                    # Process cognitive dimensions
                    normalized_dimensions[dim_key] = self._process_cognitive(dim_key, dim_value)
                    
                elif dim_key == 'consistency_scores' or dim_key == 'avg_response_time':
                    # Pass through metadata dimensions for confidence calculations
                    normalized_dimensions[dim_key] = dim_value
                    
                else:
                    # Default processing for other dimensions
                    norm_value = self._normalize_dimension(dim_key, dim_value)
                    if norm_value is not None:
                        normalized_dimensions[dim_key] = norm_value
            
            # Calculate derived dimensions
            normalized_dimensions.update(self._calculate_derived_dimensions(normalized_dimensions))
            
            return normalized_dimensions
            
        except Exception as e:
            logger.error(f"Error calculating dimensions: {e}", exc_info=True)
            # Return safe default dimensions
            return self._get_default_dimensions()
    
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
    
    def _process_learning_style(self, dim_key, value):
        """Process learning style dimensions"""
        # For multimodal values (dictionaries with weighted styles)
        if isinstance(value, dict):
            return value
            
        # Direct mapping for categorical values
        style_map = {
            'Visual': 'Visual',
            'Auditory': 'Auditory',
            'Kinesthetic': 'Kinesthetic',
            'ReadWrite': 'ReadWrite',
            'Multimodal': 'Multimodal'
        }
        
        return style_map.get(value, value)
    
    def _process_honey_mumford(self, dim_key, value):
        """Process Honey Mumford learning approach dimensions"""
        # Map to normalized values (0-1 scale)
        approach_map = {
            'Activist': 0.8,
            'Reflector': 0.6,
            'Theorist': 0.7,
            'Pragmatist': 0.75
        }
        
        if value in approach_map:
            return approach_map[value]
        
        return self._normalize_dimension(dim_key, value)
    
    def _process_cognitive(self, dim_key, value):
        """Process cognitive dimensions"""
        # Direct mapping for categorical cognitive values
        if isinstance(value, (int, float)):
            return value
            
        cognitive_map = {
            'Analogical': 0.8,
            'Structural': 0.7,
            'Practical': 0.85,
            'Repetition': 0.6
        }
        
        return cognitive_map.get(value, 0.7)
    
    def _normalize_dimension(self, dim_key, value):
        """Normalize a dimension value to 0-1 scale"""
        # Handle None/empty values
        if value is None:
            return 0.5  # Default mid-point
            
        # For numeric values, ensure they're in 0-1 range
        if isinstance(value, (int, float)):
            return max(0.0, min(1.0, float(value)))
            
        # For string categorical values, map to normalized values
        # based on dimension type
        if dim_key.startswith('Learning-Adaptability'):
            return self._map_adaptability(value)
            
        elif dim_key.startswith('MediaPreference'):
            return self._map_media_preference(value)
            
        elif dim_key.startswith('FeedbackUtilization'):
            return self._map_feedback_utilization(value)
            
        elif dim_key.startswith('SkillAcquisition'):
            return self._map_skill_acquisition(value)
            
        elif dim_key.startswith('DistractionSensitivity'):
            return self._map_distraction_sensitivity(value)
            
        elif dim_key.startswith('Motivation-Drivers'):
            return self._map_motivation_drivers(value)
            
        # Default mapping for other categorical values
        mapping = {}
        for param, weight in self.dimension_mappings.items():
            if dim_key in param:
                # Find parameter mappings that contain this dimension key
                param_map = self._get_parameter_mapping(param, value, dim_key)
                if param_map is not None:
                    return param_map
                
        # If no mapping found, return middle value
        return 0.5
    
    def _map_adaptability(self, value):
        """Map learning adaptability values"""
        mapping = {
            'HighAdaptability': 0.9,
            'MediumAdaptability': 0.7, 
            'LowAdaptability': 0.4,
            'PreemptiveAdaptability': 0.8
        }
        return mapping.get(value, 0.6)
    
    def _map_media_preference(self, value):
        """Map media preference values"""
        mapping = {
            'DigitalPreference': 0.8,
            'TraditionalPreference': 0.4,
            'BlendedPreference': 0.7,
            'InteractiveContentPreference': 0.85
        }
        return mapping.get(value, 0.6)
    
    def _map_feedback_utilization(self, value):
        """Map feedback utilization values"""
        mapping = {
            'Specific': 0.85,
            'Conceptual': 0.7,
            'Dialogic': 0.75,
            'Applied': 0.9
        }
        return mapping.get(value, 0.7)
    
    def _map_skill_acquisition(self, value):
        """Map skill acquisition values"""
        mapping = {
            'Holistic': 0.7,
            'Sequential': 0.6,
            'Application': 0.8,
            'ExampleFirst': 0.85
        }
        return mapping.get(value, 0.7)
    
    def _map_distraction_sensitivity(self, value):
        """Map distraction sensitivity values"""
        mapping = {
            'HighSensitivity': 0.2,
            'ModerateSensitivity': 0.5,
            'LowSensitivity': 0.7,
            'MinimalSensitivity': 0.9
        }
        return mapping.get(value, 0.5)
    
    def _map_motivation_drivers(self, value):
        """Map motivation drivers values"""
        mapping = {
            'Advancement': 0.8,
            'Mastery': 0.9,
            'Recognition': 0.7,
            'Contribution': 0.85
        }
        return mapping.get(value, 0.7)
    
    def _calculate_derived_dimensions(self, dimensions):
        """Calculate derived dimensions from primary dimensions"""
        derived = {}
        
        # Calculate MotivationalSystem from Motivation-Drivers
        if 'Motivation-Drivers' in dimensions:
            derived['MotivationalSystem'] = dimensions['Motivation-Drivers']
            
        # Calculate KnowledgeAssimilation from PriorKnowledgeIntegration
        if 'PriorKnowledgeIntegration' in dimensions:
            knowledge_value = dimensions['PriorKnowledgeIntegration']
            if isinstance(knowledge_value, str):
                # Map categorical values
                mapping = {
                    'Connective': 0.9,
                    'Restructuring': 0.8,
                    'Compartmentalized': 0.5,
                    'Evaluative': 0.7
                }
                derived['KnowledgeAssimilation'] = mapping.get(knowledge_value, 0.7)
            else:
                derived['KnowledgeAssimilation'] = knowledge_value
        
        return derived
    
    def _get_default_dimensions(self):
        """Return safe default dimensions in case of processing error"""
        return {
            'LearningStyle': 'Visual',
            'HoneyMumford': 'Pragmatist',
            'LearningVelocity-Pattern': 'AdaptivePace',
            'LearningVelocity-Timeframe': 'ModeratePrecision',
            'LearningVelocity-Retention': 'SlowAndRetain',
            'LearningVelocity-Efficiency': 'PriorKnowledge',
            'LearningVelocity-Measurement': 'ApplicationTesting',
            'MediaPreference': 0.7,
            'FeedbackUtilization': 0.7,
            'Learning-Adaptability': 0.6,
            'SkillAcquisition-Complexity': 0.7,
            'MotivationalSystem': 0.8,
            'KnowledgeAssimilation': 0.7
        }
    
    def _get_parameter_mapping(self, parameter, value, dimension):
        """
        Get the mapping score for a parameter value to a dimension
        
        Args:
            parameter: String - The parameter name
            value: Mixed - The parameter value
            dimension: String - The dimension to get the score for
            
        Returns:
            float or None - The mapping score, or None if no mapping exists
        """
        # Check if there's a mapping table for this parameter
        if parameter in self.parameter_mappings:
            param_map = self.parameter_mappings[parameter]
            
            # Check if the value exists in the mapping
            if value in param_map:
                value_map = param_map[value]
                
                # Check if the dimension exists in the value mapping
                if dimension in value_map:
                    return value_map[dimension]
        
        return None 