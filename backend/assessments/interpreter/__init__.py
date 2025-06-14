"""
Adivirtus AI Assessment Interpretation System - Package Initialization
"""

from .base_interpreter import AssessmentInterpreter

# Create a singleton instance
_interpreter = AssessmentInterpreter()

# Function for backward compatibility
def interpret_assessment(responses):
    """
    Interpret assessment responses to generate a learner profile
    
    Args:
        responses: Dict - Raw assessment responses
        
    Returns:
        Dict - Complete learner profile with all dimensions
    """
    return _interpreter.interpret_assessment(responses)

# Import other components for direct access
from .style_distribution import StyleDistribution
from .cognitive_load import CognitiveLoadCalculator
from .learning_velocity import VelocityPredictor

__all__ = [
    'AssessmentInterpreter',
    'StyleDistribution',
    'CognitiveLoadCalculator',
    'VelocityPredictor',
    'interpret_assessment'
] 