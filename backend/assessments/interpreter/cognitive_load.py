"""
Cognitive Load Calculator for assessment interpretation
"""

import math
import logging

logger = logging.getLogger(__name__)

class CognitiveLoadCalculator:
    """
    Handles calculation and mapping of cognitive load dimensions
    
    This class implements an improved model for measuring cognitive load across
    intrinsic, extraneous, and germane dimensions based on assessment responses.
    """
    
    def __init__(self):
        # Default cognitive load values if no data is available
        self.default_cognitive_load = {
            'intrinsic': 0.5,   # Complexity inherent to the material
            'extraneous': 0.5,  # Distractions and inefficient formats
            'germane': 0.5,     # Productive learning processes
            'management': 0.5   # How well the learner manages cognitive load
        }
        
        # Mapping of cognitive load management values to scores
        self.management_mappings = {
            'Refresh': {'management': 0.7, 'extraneous': 0.3},
            'Decompose': {'intrinsic': 0.7, 'management': 0.8},
            'Alternate': {'extraneous': 0.2, 'management': 0.6},
            'Dialogue': {'germane': 0.8, 'management': 0.7}
        }
        
        # Mapping for cognitive load indicators from indirect questions
        self.cognitive_indicators = {
            'DistractionSensitivity': {
                'HighSensitivity': {'extraneous': 0.8},
                'ModerateSensitivity': {'extraneous': 0.6},
                'LowSensitivity': {'extraneous': 0.4},
                'MinimalSensitivity': {'extraneous': 0.2}
            },
            'SkillAcquisition-Complexity': {
                'Holistic': {'intrinsic': 0.6, 'germane': 0.8},
                'Sequential': {'intrinsic': 0.4, 'germane': 0.7},
                'Application': {'intrinsic': 0.5, 'germane': 0.6},
                'ExampleFirst': {'intrinsic': 0.3, 'germane': 0.9}
            },
            'PsychologicalSafety': {
                'ExperimentalSafety': {'germane': 0.8},
                'StructuralClarity': {'germane': 0.6},
                'CollaborativeSafety': {'germane': 0.7},
                'AutonomousSafety': {'germane': 0.5}
            }
        }
    
    def calculate_load_dimensions(self, responses):
        """
        Calculate cognitive load dimensions based on responses
        
        Args:
            responses: Dict - Processed assessment responses
            
        Returns:
            Dict - Cognitive load dimensions (intrinsic, extraneous, germane, composite)
        """
        cognitive_load = self.default_cognitive_load.copy()
        
        # Direct cognitive load measure from CognitiveLoad-Management
        if 'CognitiveLoad-Management' in responses:
            management_value = responses['CognitiveLoad-Management']['value']
            mapping = self.management_mappings.get(management_value, {})
            
            for dimension, score in mapping.items():
                cognitive_load[dimension] = score
        
        # Process indirect cognitive load indicators
        for indicator, mappings in self.cognitive_indicators.items():
            if indicator in responses:
                value = responses[indicator]['value']
                if value in mappings:
                    for dimension, score in mappings[value].items():
                        # Weighted update to avoid overriding direct measures
                        current = cognitive_load[dimension]
                        cognitive_load[dimension] = (current * 0.7) + (score * 0.3)
        
        # Process answers to CognitiveLoad question (Q10)
        if 'CognitiveLoad' in responses:
            value = responses['CognitiveLoad']['value']
            
            # Map different cognitive elements to load dimensions
            if value == 'Analogical':
                cognitive_load['germane'] = max(cognitive_load['germane'], 0.8)
            elif value == 'Structural':
                cognitive_load['intrinsic'] = max(cognitive_load['intrinsic'], 0.3)
                cognitive_load['germane'] = max(cognitive_load['germane'], 0.7)
            elif value == 'Practical':
                cognitive_load['intrinsic'] = max(cognitive_load['intrinsic'], 0.5)
                cognitive_load['germane'] = max(cognitive_load['germane'], 0.6)
            elif value == 'Repetition':
                cognitive_load['intrinsic'] = max(cognitive_load['intrinsic'], 0.7)
                cognitive_load['germane'] = max(cognitive_load['germane'], 0.5)
        
        # Calculate composite score using an improved formula:
        # - High germane load is positive
        # - Low extraneous load is positive
        # - Intrinsic load effect depends on management ability
        management_factor = cognitive_load['management']
        intrinsic_impact = self._sigmoid_transform(cognitive_load['intrinsic'], management_factor)
        
        composite = (
            (0.4 * cognitive_load['germane']) + 
            (0.3 * (1 - cognitive_load['extraneous'])) + 
            (0.3 * (1 - intrinsic_impact))
        )
        
        return {
            'intrinsic': cognitive_load['intrinsic'],
            'extraneous': cognitive_load['extraneous'],
            'germane': cognitive_load['germane'],
            'management': cognitive_load['management'],
            'composite': composite
        }
    
    def _sigmoid_transform(self, value, factor):
        """
        Apply a sigmoid transformation to a value
        
        Args:
            value: float - Value to transform
            factor: float - Factor affecting the steepness of the sigmoid
            
        Returns:
            float - Transformed value (0-1)
        """
        # Center the sigmoid on 0.5
        centered = value - 0.5
        
        # Factor affects steepness (higher factor = steeper curve)
        steepness = 4 + (factor * 4)
        
        # Apply sigmoid
        transformed = 1 / (1 + math.exp(-steepness * centered))
        
        return transformed 