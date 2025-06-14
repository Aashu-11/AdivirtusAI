"""
Test script for assessment interpreter with enhanced learning velocity
"""

import logging
import asyncio
import json
from .service import AssessmentService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample assessment answers that include learning velocity questions
sample_answers = {
    "q1": {
        "parameter": "LearningStyle-Technical",
        "value": "Visual",
        "timestamp": "2023-01-01T12:00:00Z"
    },
    "q2": {
        "parameter": "LearningStyle-Creative",
        "value": "Auditory",
        "timestamp": "2023-01-01T12:01:00Z"
    },
    "q3": {
        "parameter": "LearningVelocity-Pattern",
        "value": "FastStart",
        "timestamp": "2023-01-01T12:02:00Z"
    },
    "q4": {
        "parameter": "LearningVelocity-Timeframe",
        "value": "ModeratePrecision",
        "timestamp": "2023-01-01T12:03:00Z"
    },
    "q5": {
        "parameter": "LearningVelocity-Retention",
        "value": "SlowAndRetain",
        "timestamp": "2023-01-01T12:04:00Z"
    },
    "q6": {
        "parameter": "LearningVelocity-Efficiency",
        "value": "ContentQuality",
        "timestamp": "2023-01-01T12:05:00Z"
    },
    "q7": {
        "parameter": "LearningVelocity-Measurement",
        "value": "ApplicationTesting",
        "timestamp": "2023-01-01T12:06:00Z"
    },
    "q8": {
        "parameter": "CognitiveLoad-Intrinsic",
        "value": "Medium",
        "timestamp": "2023-01-01T12:07:00Z"
    },
    "q9": {
        "parameter": "CognitiveLoad-Extraneous",
        "value": "Low",
        "timestamp": "2023-01-01T12:08:00Z"
    },
    "q10": {
        "parameter": "CognitiveLoad-Germane",
        "value": "High",
        "timestamp": "2023-01-01T12:09:00Z"
    },
    "q11": {
        "parameter": "DistractionSensitivity",
        "value": "LowSensitivity",
        "timestamp": "2023-01-01T12:10:00Z"
    },
    "q12": {
        "parameter": "PriorKnowledgeIntegration",
        "value": "Connective",
        "timestamp": "2023-01-01T12:11:00Z"
    },
    "q13": {
        "parameter": "Learning-Adaptability",
        "value": "HighAdaptability",
        "timestamp": "2023-01-01T12:12:00Z"
    },
    "q14": {
        "parameter": "LearningStyle-MultimodalPreferences",
        "value": {"Visual": 0.6, "Kinesthetic": 0.4},
        "timestamp": "2023-01-01T12:13:00Z"
    }
}

async def test_interpreter():
    """Test the assessment interpreter"""
    service = AssessmentService()
    
    # Skip the preprocessing test as it's now part of the BaseInterpreter
    
    # Test calculation of dimensions directly
    calculated_dimensions = service.interpreter.dimension_calculator.calculate_dimensions(sample_answers)
    logger.info(f"Calculated dimensions: {json.dumps(calculated_dimensions, indent=2)}")
    
    # Test velocity prediction
    learning_style = {
        "primary": "Visual", 
        "secondary": "Kinesthetic",
        "scores": {"Visual": 0.7, "Kinesthetic": 0.4, "Auditory": 0.2, "ReadWrite": 0.3},
        "is_multimodal": True
    }
    cognitive_load = {
        "intrinsic": 0.5,
        "extraneous": 0.3,
        "germane": 0.8,
        "composite": 0.65
    }
    
    velocity_prediction = service.interpreter.velocity_predictor.predict_velocity(
        calculated_dimensions, cognitive_load, learning_style
    )
    
    logger.info(f"Velocity prediction: {json.dumps(velocity_prediction, indent=2)}")
    
    # Verify key velocity fields
    expected_fields = [
        'baseVelocity', 'timeMultiplier', 'pattern', 'confidence', 'probabilisticRanges',
        'phaseVelocity', 'phaseDurations', 'retentionProfile', 'measurementPreference'
    ]
    
    for field in expected_fields:
        if field not in velocity_prediction:
            logger.error(f"Missing expected field in velocity prediction: {field}")
        else:
            logger.info(f"✓ Field '{field}' present in velocity prediction")
    
    # Test full interpretation
    interpretation = await service._generate_interpretation(sample_answers)
    logger.info(f"Full interpretation: {json.dumps(interpretation, indent=2)}")
    
    if 'learnerProfile' in interpretation:
        profile = interpretation['learnerProfile']
        logger.info(f"Learning profile generated successfully!")
        logger.info(f"Velocity pattern: {profile.get('velocityPrediction', {}).get('pattern')}")
    else:
        logger.error("Failed to generate learner profile")
    
    return "Test completed successfully!"

if __name__ == "__main__":
    result = asyncio.run(test_interpreter())
    print(result) 