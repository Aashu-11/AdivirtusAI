"""
Adivirtus AI Assessment Interpretation System
 
This module provides a compatibility layer for the new modular assessment interpreter.
"""

import logging
from .interpreter.base_interpreter import AssessmentInterpreter
from .interpreter.dimension_calculator import DimensionCalculator

logger = logging.getLogger(__name__)

# Create a singleton instance
_interpreter = AssessmentInterpreter()

def interpret_assessment(responses):
    """
    Interpret assessment responses to generate a learner profile
        
        Args:
        responses: Dict - Raw assessment responses
            
        Returns:
        Dict - Complete learner profile with all dimensions
    """
    logger.debug(f"Interpreter compatibility layer called with {len(responses)} responses")
    try:
        result = _interpreter.interpret_assessment(responses)
        logger.debug("Successfully completed interpretation")
        return result
    except Exception as e:
        logger.error(f"Error in interpret_assessment compatibility layer: {str(e)}", exc_info=True)
        raise 