"""
Learning Velocity Predictor for assessment interpretation
"""

import math
import logging

logger = logging.getLogger(__name__)

class VelocityPredictor:
    """
    Predicts learning velocity and time estimates based on assessment data
    
    This class implements an improved model for estimating learning speed
    and time requirements based on empirically-derived factors.
    """
    
    def __init__(self):
        # Base velocity patterns
        self.velocity_patterns = {
            'FastStart': {
                'initial_pace': 0.8,
                'midpoint_pace': 0.6,
                'completion_pace': 0.4,
                'pattern_factor': 1.2
            },
            'SteadyPace': {
                'initial_pace': 0.6, 
                'midpoint_pace': 0.6,
                'completion_pace': 0.6,
                'pattern_factor': 1.0
            },
            'SlowStart': {
                'initial_pace': 0.4,
                'midpoint_pace': 0.6,
                'completion_pace': 0.8,
                'pattern_factor': 1.3
            },
            'AdaptivePace': {
                'initial_pace': 0.7,
                'midpoint_pace': 0.7,
                'completion_pace': 0.5,
                'pattern_factor': 0.9
            }
        }
        
        # Empirically-derived weights for velocity factors
        self.velocity_weights = {
            # Primary factors
            'adaptability': 0.12,      # Learning-Adaptability
            'cognitive_load': 0.15,    # Cognitive load composite
            'complexity': 0.12,        # SkillAcquisition-Complexity
            'motivation': 0.15,        # MotivationalSystem
            
            # Secondary factors
            'media_match': 0.05,       # MediaPreference alignment with content
            'prior_knowledge': 0.05,   # PriorKnowledgeIntegration
            'learning_style': 0.05,    # Match between content and style
            
            # New direct velocity factors
            'velocity_pattern': 0.12,  # LearningVelocity-Pattern
            'velocity_timeframe': 0.06, # LearningVelocity-Timeframe
            'velocity_retention': 0.05, # LearningVelocity-Retention
            'velocity_efficiency': 0.08, # LearningVelocity-Efficiency
        }
        
        # Velocity timeframe prediction accuracy mapping
        self.timeframe_precision = {
            'HighPrecision': 0.9,
            'ModeratePrecision': 0.7,
            'LowPrecision': 0.5,
            'VeryLowPrecision': 0.3
        }
        
        # Velocity efficiency factor mapping
        self.efficiency_factor = {
            'ContentQuality': {'visual_weight': 0.7, 'factor': 0.8},
            'PracticeOpportunity': {'kinesthetic_weight': 0.8, 'factor': 0.85},
            'PriorKnowledge': {'factor': 0.9},
            'FocusEnvironment': {'factor': 0.75}
        }
        
        # Velocity measurement preference mapping
        self.measurement_preference = {
            'MilestoneTracking': 'objective',
            'ApplicationTesting': 'applied',
            'TeachingEffectiveness': 'conceptual',
            'ConfidenceLevel': 'subjective'
        }
        
        # Time multiplier ranges (empirically calibrated)
        self.time_multiplier = {
            'min': 0.75,     # Best case: 25% faster than baseline
            'max': 2.0,      # Worst case: 2x baseline time
            'baseline': 1.0  # Standard estimation baseline
        }
    
    def predict_velocity(self, dimensions, cognitive_load, learning_style):
        """
        Predict learning velocity based on assessment dimensions
        
        Args:
            dimensions: Dict - Calculated dimension values
            cognitive_load: Dict - Cognitive load dimensions
            learning_style: Dict - Learning style information
            
        Returns:
            Dict - Velocity prediction and time estimates
        """
        # Extract key factors from dimensions
        adaptability = self._get_adaptability_score(dimensions)
        complexity = self._get_complexity_score(dimensions)
        motivation = dimensions.get('MotivationalSystem', 0.5)
        
        # Cognitive load composite score
        cognitive_score = cognitive_load.get('composite', 0.5)
        
        # Media and style alignment factors
        media_match = dimensions.get('MediaPreference', 0.5)
        prior_knowledge = dimensions.get('KnowledgeAssimilation', 0.5)
        
        # Extract new direct velocity metrics
        velocity_pattern_score = self._get_velocity_pattern_score(dimensions)
        velocity_timeframe = self._get_velocity_timeframe_score(dimensions)
        velocity_retention = self._get_velocity_retention_score(dimensions)
        velocity_efficiency = self._get_velocity_efficiency_score(dimensions, learning_style)
        
        # Calculate style alignment bonus (match between content and learning style)
        style_match = self._calculate_style_match(learning_style)
        
        # Calculate weighted velocity score
        weights = self.velocity_weights
        velocity_score = (
            (weights['adaptability'] * adaptability) +
            (weights['cognitive_load'] * cognitive_score) +
            (weights['complexity'] * complexity) +
            (weights['motivation'] * motivation) +
            (weights['media_match'] * media_match) +
            (weights['prior_knowledge'] * prior_knowledge) +
            (weights['learning_style'] * style_match) +
            (weights['velocity_pattern'] * velocity_pattern_score) +
            (weights['velocity_timeframe'] * velocity_timeframe) +
            (weights['velocity_retention'] * velocity_retention) +
            (weights['velocity_efficiency'] * velocity_efficiency)
        )
        
        # Determine velocity pattern
        pattern_key = self._determine_velocity_pattern(dimensions)
        pattern = self.velocity_patterns[pattern_key]
        
        # Apply pattern factor
        adjusted_velocity = velocity_score * pattern['pattern_factor']
        
        # Normalize to 0-1 range
        normalized_velocity = max(0.0, min(1.0, adjusted_velocity))
        
        # Calculate time multiplier (lower velocity = higher multiplier)
        min_mult = self.time_multiplier['min']
        max_mult = self.time_multiplier['max']
        time_mult = max_mult - (normalized_velocity * (max_mult - min_mult))
        
        # Get measurement preference
        measurement = self._get_measurement_preference(dimensions)
        
        # Calculate confidence and variance
        confidence, variance = self._calculate_confidence(
            dimensions, normalized_velocity, cognitive_load, velocity_timeframe
        )
        
        # Generate retention profile
        retention_profile = self._generate_retention_profile(
            velocity_retention, pattern_key, cognitive_load
        )
        
        # Calculate phase durations as percentages of total time
        phase_durations = self._calculate_phase_durations(pattern)
        
        # Generate prediction results
        return {
            'baseVelocity': normalized_velocity,
            'pattern': pattern_key,
            'timeMultiplier': time_mult,
            'estimatedCompletionFactor': time_mult,
            'confidence': confidence,
            'probabilisticRanges': {
                'optimistic': max(min_mult, time_mult * (1 - variance)),
                'expected': time_mult,
                'conservative': min(max_mult, time_mult * (1 + variance))
            },
            'phaseVelocity': {
                'initial': pattern['initial_pace'] * normalized_velocity,
                'midpoint': pattern['midpoint_pace'] * normalized_velocity,
                'completion': pattern['completion_pace'] * normalized_velocity
            },
            'phaseDurations': phase_durations,
            'retentionProfile': retention_profile,
            'measurementPreference': measurement,
            'timeframePrecision': velocity_timeframe,
            'factors': {
                'adaptability': adaptability,
                'complexity': complexity,
                'motivation': motivation,
                'cognitiveManagement': cognitive_score,
                'styleMatch': style_match,
                'efficiencyFactor': velocity_efficiency
            }
        }
    
    def _get_adaptability_score(self, dimensions):
        """Calculate adaptability score from relevant dimensions"""
        adaptability_value = dimensions.get('Learning-Adaptability', 0.5)
        
        # Map categorical values to scores
        if isinstance(adaptability_value, str):
            mapping = {
                'HighAdaptability': 0.9,
                'MediumAdaptability': 0.7,
                'LowAdaptability': 0.4,
                'PreemptiveAdaptability': 0.8
            }
            return mapping.get(adaptability_value, 0.5)
        
        return adaptability_value
    
    def _get_complexity_score(self, dimensions):
        """Calculate complexity handling score from relevant dimensions"""
        complexity_value = dimensions.get('SkillAcquisition-Complexity', 0.5)
        
        # Map categorical values to scores
        if isinstance(complexity_value, str):
            mapping = {
                'Holistic': 0.7,
                'Sequential': 0.6,
                'Application': 0.8,
                'ExampleFirst': 0.9
            }
            return mapping.get(complexity_value, 0.5)
        
        return complexity_value
    
    def _get_velocity_pattern_score(self, dimensions):
        """Calculate velocity pattern score from direct velocity questions"""
        pattern_value = dimensions.get('LearningVelocity-Pattern', 'AdaptivePace')
        
        # Map categorical values to scores
        mapping = {
            'FastStart': 0.85,
            'SteadyPace': 0.7,
            'SlowStart': 0.6,
            'AdaptivePace': 0.75
        }
        return mapping.get(pattern_value, 0.7)
    
    def _get_velocity_timeframe_score(self, dimensions):
        """Calculate velocity timeframe precision from direct question"""
        timeframe_value = dimensions.get('LearningVelocity-Timeframe', 'ModeratePrecision')
        
        # Map categorical values to scores using the timeframe precision mapping
        return self.timeframe_precision.get(timeframe_value, 0.7)
    
    def _get_velocity_retention_score(self, dimensions):
        """Calculate velocity retention effects from direct question"""
        retention_value = dimensions.get('LearningVelocity-Retention', 'SlowAndRetain')
        
        # Map categorical values to scores
        mapping = {
            'FastAndRetain': 0.85,    # Fast learning with good retention (ideal)
            'SlowAndRetain': 0.75,    # Slower but effective retention
            'UnrelatedRetention': 0.65,  # No correlation (baseline score)
            'VariableRetention': 0.70   # Topic-dependent (slightly above baseline)
        }
        return mapping.get(retention_value, 0.65)
    
    def _get_velocity_efficiency_score(self, dimensions, learning_style):
        """Calculate velocity efficiency factor from direct question"""
        efficiency_value = dimensions.get('LearningVelocity-Efficiency', 'PriorKnowledge')
        
        # Get style preferences
        visual_preference = learning_style.get('scores', {}).get('Visual', 0.25)
        kinesthetic_preference = learning_style.get('scores', {}).get('Kinesthetic', 0.25)
        
        # Get base efficiency factor
        efficiency_data = self.efficiency_factor.get(efficiency_value, {'factor': 0.7})
        base_factor = efficiency_data.get('factor', 0.7)
        
        # Apply style alignment bonus if relevant
        if 'visual_weight' in efficiency_data and visual_preference > 0.4:
            # Stronger bonus if visual is their primary preference and they selected visual content
            visual_bonus = efficiency_data['visual_weight'] * visual_preference * 0.3
            base_factor += visual_bonus
            
        if 'kinesthetic_weight' in efficiency_data and kinesthetic_preference > 0.4:
            # Stronger bonus if kinesthetic is their primary preference and they selected practice
            kinesthetic_bonus = efficiency_data['kinesthetic_weight'] * kinesthetic_preference * 0.3
            base_factor += kinesthetic_bonus
            
        # Normalize to 0-1 range
        return min(1.0, base_factor)
    
    def _get_measurement_preference(self, dimensions):
        """Get user's preferred method of measuring learning progress"""
        measurement_value = dimensions.get('LearningVelocity-Measurement', 'ApplicationTesting')
        return self.measurement_preference.get(measurement_value, 'applied')
    
    def _calculate_style_match(self, learning_style):
        """Calculate match between learning style and typical content delivery"""
        # Style distribution - common content tends to favor visual and reading/writing
        content_styles = {
            'Visual': 0.40,      # Most content has strong visual elements
            'Auditory': 0.15,    # Less content is purely auditory
            'Kinesthetic': 0.20, # Interactive content is growing but still limited
            'ReadWrite': 0.25    # Text-based content is still prominent
        }
        
        # Get user's style preferences
        style_scores = learning_style.get('scores', {})
        
        # Calculate weighted match score
        match_score = 0.0
        for style, content_weight in content_styles.items():
            user_preference = style_scores.get(style, 0.25)  # Default to even distribution
            style_match = 1.0 - abs(user_preference - content_weight)  # Higher when preference matches content
            match_score += style_match * content_weight  # Weight by content availability
            
        # For multimodal learners, add a flexibility bonus
        if learning_style.get('is_multimodal', False):
            match_score *= 1.15  # 15% bonus for adaptability
            match_score = min(1.0, match_score)  # Cap at 1.0
            
        return match_score
    
    def _determine_velocity_pattern(self, dimensions):
        """Determine the velocity pattern based on direct question"""
        pattern_value = dimensions.get('LearningVelocity-Pattern', None)
        
        # If we have direct pattern information, use it
        if pattern_value in self.velocity_patterns:
            return pattern_value
            
        # Otherwise, infer from other dimensions
        adaptability = self._get_adaptability_score(dimensions)
        complexity_handling = self._get_complexity_score(dimensions)
        
        # Default pattern decision tree
        if complexity_handling > 0.7:
            # Good at handling complexity
            if adaptability > 0.7:
                # Both adaptable and handles complexity well
                return 'AdaptivePace'
            else:
                # Good with complexity but less adaptable - likely consistent
                return 'SteadyPace'
        else:
            # Less comfortable with complexity
            if adaptability > 0.6:
                # Adaptable but needs time with complex topics
                return 'FastStart'
            else:
                # Takes time to build understanding
                return 'SlowStart'
    
    def _calculate_confidence(self, dimensions, velocity, cognitive_load, timeframe_precision=0.7):
        """
        Calculate confidence level and variance for velocity predictions
        
        Args:
            dimensions: Dict of assessment dimensions
            velocity: Base velocity score
            cognitive_load: Cognitive load factors
            timeframe_precision: User's ability to estimate learning time
            
        Returns:
            tuple: (confidence_level, variance)
        """
        # Start with timeframe precision as base confidence
        # This directly measures user's self-reported ability to predict learning time
        base_confidence = timeframe_precision
        
        # Cognitive load confidence modifier
        # Lower intrinsic load = higher confidence, higher extraneous load = lower confidence
        intrinsic = cognitive_load.get('intrinsic', 0.5)
        extraneous = cognitive_load.get('extraneous', 0.5)
        cognitive_confidence = (1 - intrinsic * 0.3) - (extraneous * 0.4)
        
        # Consistency in responses affects confidence
        # Get explicit consistency metrics if available
        consistency = 0.85  # Default high consistency
        if 'consistency_scores' in dimensions:
            consistency_avg = sum(dimensions['consistency_scores'].values()) / len(dimensions['consistency_scores'])
            consistency = min(1.0, max(0.5, consistency_avg))
        
        # Response rate (faster = more instinctive = potentially more reliable)
        response_time_factor = 1.0  # Default - neutral impact
        if 'avg_response_time' in dimensions:
            avg_time = dimensions['avg_response_time']
            # Normalize average time between 0.85 and 1.1
            response_time_factor = 1.1 - (min(1.0, max(0.0, avg_time / 20.0)) * 0.25)
        
        # Calculate overall confidence (weighted factors)
        confidence = (
            (base_confidence * 0.4) +            # Time estimation accuracy
            (cognitive_confidence * 0.2) +       # Cognitive factors
            (consistency * 0.3) +                # Response consistency
            (response_time_factor * 0.1)         # Response time factor
        )
        
        # Cap confidence between 0.4 and 0.95
        confidence = min(0.95, max(0.4, confidence))
        
        # Calculate variance based on confidence
        # Higher confidence = lower variance in time predictions
        variance = (1.0 - confidence) * 0.6
        
        return confidence, variance
    
    def _generate_retention_profile(self, retention_score, pattern_key, cognitive_load):
        """
        Generate a retention profile based on learning velocity pattern and retention factors
        
        Args:
            retention_score: Score from velocity retention question
            pattern_key: The learning velocity pattern
            cognitive_load: Cognitive load factors
            
        Returns:
            dict: Retention profile with short, medium, and long-term retention scores
        """
        # Base retention values by pattern type
        pattern_retention = {
            'FastStart': {'short': 0.85, 'medium': 0.65, 'long': 0.55},
            'SteadyPace': {'short': 0.80, 'medium': 0.75, 'long': 0.70},
            'SlowStart': {'short': 0.75, 'medium': 0.80, 'long': 0.75},
            'AdaptivePace': {'short': 0.85, 'medium': 0.70, 'long': 0.65}
        }
        
        # Get base values for the selected pattern
        base_retention = pattern_retention.get(pattern_key, pattern_retention['AdaptivePace'])
        
        # Cognitive load factors affect retention (especially germane load)
        # Higher germane load = better long-term retention
        germane = cognitive_load.get('germane', 0.5)
        germane_modifier = (germane - 0.5) * 0.3  # Scale to +/- 15%
        
        # Apply modifiers based on retention score and cognitive load
        short_term = base_retention['short'] * (1 + (retention_score - 0.7) * 0.2)
        medium_term = base_retention['medium'] * (1 + (retention_score - 0.7) * 0.3 + germane_modifier * 0.5)
        long_term = base_retention['long'] * (1 + (retention_score - 0.7) * 0.4 + germane_modifier)
        
        # Normalize to 0-1 range
        return {
            'shortTerm': min(1.0, max(0.5, short_term)),
            'mediumTerm': min(1.0, max(0.4, medium_term)),
            'longTerm': min(1.0, max(0.3, long_term))
        }
    
    def _calculate_phase_durations(self, pattern):
        """
        Calculate the percentage of total learning time spent in each phase
        
        Args:
            pattern: Velocity pattern data
            
        Returns:
            dict: Percentage duration of each phase
        """
        # Calculate relative durations based on pace
        # Slower pace = longer duration
        initial_duration = 100 / (pattern['initial_pace'] * 3)
        midpoint_duration = 100 / (pattern['midpoint_pace'] * 3)
        completion_duration = 100 / (pattern['completion_pace'] * 3)
        
        # Calculate total and normalize to percentages
        total_duration = initial_duration + midpoint_duration + completion_duration
        
        return {
            'initial': round(initial_duration / total_duration * 100),
            'midpoint': round(midpoint_duration / total_duration * 100),
            'completion': round(completion_duration / total_duration * 100)
        } 