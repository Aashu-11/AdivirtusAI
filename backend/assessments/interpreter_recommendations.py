"""
Adivirtus AI Assessment Interpretation System - Recommendations Module
 
This module contains methods for generating content delivery recommendations
and learning recommendations based on interpreted assessment results.
"""

import math
import logging

logger = logging.getLogger(__name__)

class InterpreterRecommendations:
    """
    Methods for generating recommendations based on assessment results.
    """
    
    def __init__(self):
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
        
        # Sequencing patterns based on learning styles
        self.sequencing_patterns = {
            'Holistic': {
                'name': 'Conceptual Framework First',
                'description': 'Start with big-picture concepts and theory before diving into details',
                'steps': ['concept-overview', 'theory-introduction', 'detailed-explanation', 'practical-examples', 'direct-application']
            },
            'Sequential': {
                'name': 'Step-by-Step Progressive',
                'description': 'Linear progression through increasingly complex topics',
                'steps': ['basic-introduction', 'foundational-concepts', 'guided-practice', 'complex-scenarios', 'open-ended-application']
            },
            'Application': {
                'name': 'Application-Driven Learning',
                'description': 'Learn through direct application with just-in-time theory',
                'steps': ['minimal-introduction', 'hands-on-practice', 'theory-when-needed', 'problem-solving', 'skill-refinement']
            },
            'ExampleFirst': {
                'name': 'Example-Based Learning',
                'description': 'Start with concrete examples before introducing abstract concepts',
                'steps': ['worked-examples', 'pattern-recognition', 'concept-extraction', 'principle-explanation', 'independent-application']
            }
        }
        
        # Learning environment recommendations
        self.environment_recommendations = {
            'HighSensitivity': {
                'noise': 'Minimal to none',
                'visual': 'Clean, uncluttered environment',
                'interruptions': 'Strict no-interruption policy',
                'environment': 'Dedicated learning space',
                'duration': 'Shorter sessions with more frequent breaks'
            },
            'ModerateSensitivity': {
                'noise': 'Low background noise acceptable',
                'visual': 'Moderately organized environment',
                'interruptions': 'Limited interruptions',
                'environment': 'Semi-dedicated space',
                'duration': 'Standard session length with regular breaks'
            },
            'LowSensitivity': {
                'noise': 'Moderate background noise acceptable',
                'visual': 'Some visual stimulation may be beneficial',
                'interruptions': 'Can resume easily after interruptions',
                'environment': 'Adaptable to various settings',
                'duration': 'Longer sessions with fewer breaks'
            },
            'MinimalSensitivity': {
                'noise': 'Can function well even with background noise',
                'visual': 'Highly adaptable to different environments',
                'interruptions': 'Can handle frequent task-switching',
                'environment': 'Portable learning in various contexts',
                'duration': 'Flexible session length based on content'
            }
        }
        
        # Feedback system configurations
        self.feedback_configurations = {
            'Immediate': {
                'timing': 'Continuous real-time feedback',
                'frequency': 'After each step or sub-task',
                'detail': 'Brief, actionable feedback focused on current task',
                'mechanism': 'Automated checking, inline validation, or live coaching',
                'progression': 'Must meet criteria before advancing'
            },
            'Interval': {
                'timing': 'Regular scheduled checkpoints',
                'frequency': 'After major sections or modules',
                'detail': 'Comprehensive review of recent work',
                'mechanism': 'Progress quizzes, submission reviews, milestone validations',
                'progression': 'Flexible advancement with revisiting as needed'
            },
            'OnDemand': {
                'timing': 'Available when requested',
                'frequency': 'Learner-controlled',
                'detail': 'Targeted to specific questions or concerns',
                'mechanism': 'Help systems, mentoring, peer review when requested',
                'progression': 'Self-determined pacing'
            },
            'Retrospective': {
                'timing': 'After completion of major components',
                'frequency': 'Infrequent, summative assessments',
                'detail': 'Comprehensive evaluation of outcomes',
                'mechanism': 'Final projects, comprehensive assessments, portfolio reviews',
                'progression': 'Independent work with major milestones'
            }
        }
        
        # Learning velocity prediction models
        self.velocity_predictions = {
            'FastStart': {
                'initialProgress': 'Rapid acquisition of fundamentals',
                'midpointDynamics': 'May plateau when reaching complex topics',
                'completionProfile': 'Additional time needed for mastery of advanced concepts',
                'recommendedPacing': 'Front-load new concepts, reserve more time for later stages',
                'schedulingTips': 'Start with intensive sessions, transition to spaced practice'
            },
            'SteadyPace': {
                'initialProgress': 'Methodical foundation building',
                'midpointDynamics': 'Consistent progress throughout',
                'completionProfile': 'Even time distribution across learning journey',
                'recommendedPacing': 'Regular, evenly-spaced learning sessions',
                'schedulingTips': 'Create consistent routine with similar session lengths'
            },
            'SlowStart': {
                'initialProgress': 'Takes time to build initial understanding',
                'midpointDynamics': 'Accelerates once fundamentals are established',
                'completionProfile': 'Often completes final stages quickly',
                'recommendedPacing': 'Allocate more time for early concepts, can increase pace later',
                'schedulingTips': 'Longer initial sessions with comprehensive reviews'
            },
            'AdaptivePace': {
                'initialProgress': 'Variable depending on content complexity',
                'midpointDynamics': 'May alternate between rapid progress and consolidation periods',
                'completionProfile': 'Uneven but effective progression',
                'recommendedPacing': 'Flexible schedule adapted to complexity of current topic',
                'schedulingTips': 'Mix focused sessions for challenging concepts with quicker reviews'
            }
        }
    
    def generate_content_delivery_recommendations(self, learner_profile):
        """
        Generate content delivery recommendations based on learner profile
        
        Args:
            learner_profile: Dict - Comprehensive learner profile
            
        Returns:
            Dict - Content delivery recommendations
        """
        primary_style = learner_profile['learningStyles']['primary']
        secondary_style = learner_profile['learningStyles']['secondary']
        
        # Get recommended content formats
        primary_formats = self.content_format_matrix.get(primary_style, {}).get('primary', [])
        secondary_formats = self.content_format_matrix.get(secondary_style, {}).get('secondary', [])
        
        # Get recommended sequencing pattern
        complexity_approach = self.determine_complexity_approach(learner_profile)
        sequencing_pattern = self.sequencing_patterns.get(complexity_approach, self.sequencing_patterns['Sequential'])
        
        # Get environmental recommendations
        distraction_sensitivity = self.determine_sensitivity_level(learner_profile)
        environment_recs = self.environment_recommendations.get(distraction_sensitivity, self.environment_recommendations['ModerateSensitivity'])
        
        # Get feedback recommendations
        feedback_preference = self.determine_feedback_preference(learner_profile)
        feedback_recs = self.feedback_configurations.get(feedback_preference, self.feedback_configurations['Interval'])
        
        # Get velocity predictions
        velocity_pattern = self.determine_velocity_pattern(learner_profile)
        velocity_recs = self.velocity_predictions.get(velocity_pattern, self.velocity_predictions['SteadyPace'])
        
        # Get velocity data from the new structure
        velocity_prediction = learner_profile.get('velocityPrediction', {})
        time_multiplier = velocity_prediction.get('timeMultiplier', 1.0)
        confidence = velocity_prediction.get('confidence', 0.7)
        
        return {
            'contentFormats': {
                'recommended': primary_formats.copy(),
                'alternative': secondary_formats.copy()
            },
            'sequencing': {
                'pattern': sequencing_pattern,
                'approach': complexity_approach
            },
            'environment': environment_recs,
            'feedback': feedback_recs,
            'pacing': velocity_recs,
            'timeMultiplier': time_multiplier,
            'confidenceLevel': confidence
        }
    
    def determine_complexity_approach(self, learner_profile):
        """
        Determine the complexity approach from the learner profile
        
        Args:
            learner_profile: Dict - Comprehensive learner profile
            
        Returns:
            String - Complexity approach identifier
        """
        # Extract relevant dimension values
        content_sequencing = learner_profile.get('contentPreferences', {}).get('sequencing', 0.5)
        
        # Use rawDimensions if available for more precise data
        raw_dimensions = learner_profile.get('rawDimensions', {})
        content_sequencing = raw_dimensions.get('ContentSequencing', content_sequencing)
        
        # Simple heuristic for determining approach
        if content_sequencing > 0.7 and learner_profile.get('learningApproaches', {}).get('primary') == 'Theorist':
            return 'Holistic'
        elif content_sequencing < 0.3 and learner_profile.get('learningApproaches', {}).get('primary') == 'Pragmatist':
            return 'ExampleFirst'
        elif content_sequencing > 0.5 and learner_profile.get('learningStyles', {}).get('primary') == 'Kinesthetic':
            return 'Application'
        else:
            return 'Sequential'
    
    def determine_sensitivity_level(self, learner_profile):
        """
        Determine distraction sensitivity level from learner profile
        
        Args:
            learner_profile: Dict - Comprehensive learner profile
            
        Returns:
            String - Sensitivity level identifier
        """
        # Extract relevant dimension values
        environment = learner_profile.get('optimalConditions', {}).get('environment', 0.5)
        
        # Check if we have enhanced cognitive load data available
        cognitive_profile = learner_profile.get('cognitiveProfile', {})
        if cognitive_profile:
            # Extraneous load is a direct measure of sensitivity to distractions
            extraneous_load = cognitive_profile.get('extraneous', 0.5)
            
            # Higher extraneous load score = more sensitive to distractions
            if extraneous_load > 0.8:
                return 'HighSensitivity'
            elif extraneous_load > 0.6:
                return 'ModerateSensitivity'
            elif extraneous_load > 0.4:
                return 'LowSensitivity'
            else:
                return 'MinimalSensitivity'
        
        # Fall back to original threshold-based classification if enhanced data not available
        if environment > 0.8:
            return 'HighSensitivity'
        if environment > 0.5:
            return 'ModerateSensitivity'
        if environment > 0.3:
            return 'LowSensitivity'
        return 'MinimalSensitivity'
    
    def determine_feedback_preference(self, learner_profile):
        """
        Determine feedback preference from learner profile
        
        Args:
            learner_profile: Dict - Comprehensive learner profile
            
        Returns:
            String - Feedback preference identifier
        """
        # Extract relevant dimension values
        feedback_mechanism = learner_profile.get('contentPreferences', {}).get('feedback', 0.5)
        
        # Simple threshold-based classification
        if feedback_mechanism > 0.8:
            return 'Immediate'
        if feedback_mechanism > 0.5:
            return 'Interval'
        if feedback_mechanism > 0.3:
            return 'OnDemand'
        return 'Retrospective'
    
    def determine_velocity_pattern(self, learner_profile):
        """
        Determine velocity pattern from learner profile
        
        Args:
            learner_profile: Dict - Comprehensive learner profile
            
        Returns:
            String - Velocity pattern identifier
        """
        # Check if the new velocity predictor has already determined the pattern
        velocity_prediction = learner_profile.get('velocityPrediction', {})
        if 'pattern' in velocity_prediction:
            return velocity_prediction['pattern']
        
        # Extract relevant values
        base_velocity = velocity_prediction.get('baseVelocity', 0.5)
        learning_approach = learner_profile.get('learningApproaches', {}).get('primary', 'SteadyPace')
        
        # Check if we have enhanced cognitive load data
        cognitive_profile = learner_profile.get('cognitiveProfile', {})
        if cognitive_profile:
            intrinsic_load = cognitive_profile.get('intrinsic', 0.5)
            extraneous_load = cognitive_profile.get('extraneous', 0.5)
            germane_load = cognitive_profile.get('germane', 0.5)
            
            # Use the enhanced cognitive factors for more precise determination
            if germane_load > 0.7 and intrinsic_load > 0.6:
                # High schema building and handles complexity well - likely a fast starter
                if learning_approach in ['Activist', 'Theorist']:
                    return 'FastStart'
                    
            if extraneous_load < 0.3 and intrinsic_load < 0.4:
                # Low distraction and prefers simpler content - steady pace likely
                return 'SteadyPace'
                
            if intrinsic_load < 0.4 and germane_load > 0.7:
                # Builds schemas quickly but prefers simpler content - likely starts slow then accelerates
                if learning_approach in ['Reflector', 'Pragmatist']:
                    return 'SlowStart'
                    
            if extraneous_load > 0.7:
                # Highly affected by distractions - adaptive pace may be best
                return 'AdaptivePace'
        
        # Fall back to original pattern determination if enhanced data not available
        # Combine velocity and learning approach for pattern selection
        if base_velocity > 0.7 and learning_approach == 'Activist':
            return 'FastStart'
        if base_velocity < 0.4 and learning_approach == 'Reflector':
            return 'SlowStart'
        if learning_approach == 'Theorist':
            return 'SteadyPace'
        if learning_approach == 'Pragmatist':
            return 'AdaptivePace'
        
        # Default based on velocity alone
        if base_velocity > 0.7:
            return 'FastStart'
        if base_velocity < 0.4:
            return 'SlowStart'
        return 'SteadyPace'
    

    

    

    

    
    def map_timing_to_time_of_day(self, timing):
        """
        Map timing value to time of day
        
        Args:
            timing: float - Optimal timing value
            
        Returns:
            String - Time of day recommendation
        """
        if timing > 0.75:
            return 'Morning (5am-9am)'
        if timing > 0.5:
            return 'Midday (10am-2pm)'
        if timing > 0.25:
            return 'Afternoon (3pm-7pm)'
        return 'Evening (8pm-12am)'
    
    def map_duration_to_minutes(self, duration):
        """
        Map duration value to minutes
        
        Args:
            duration: float - Optimal duration value
            
        Returns:
            int - Duration in minutes
        """
        if duration > 0.75:
            return 120  # 2 hours
        if duration > 0.5:
            return 90  # 1.5 hours
        if duration > 0.25:
            return 45  # 45 minutes
        return 25  # 25 minutes
    
    def determine_optimal_frequency(self, learner_profile):
        """
        Determine optimal frequency of learning sessions
        
        Args:
            learner_profile: Dict - Comprehensive learner profile
            
        Returns:
            String - Frequency recommendation
        """
        # Extract relevant factors
        velocity_pattern = self.determine_velocity_pattern(learner_profile)
        cognitive_load = learner_profile['contentPreferences']['knowledgeIntegration']
        
        # Determine frequency based on learning pattern
        if velocity_pattern == 'FastStart' and cognitive_load > 0.7:
            return 'Daily sessions with weekend break'
        elif velocity_pattern == 'SlowStart':
            return 'Every other day with reflection periods'
        elif velocity_pattern == 'SteadyPace':
            return 'Regular 3-4 sessions per week'
        else:
            return 'Flexible schedule with at least 3 sessions per week'
    
    def capitalize(self, s):
        """
        Helper method to capitalize first letter
        
        Args:
            s: String - String to capitalize
            
        Returns:
            String - Capitalized string
        """
        return s.replace('-', ' ').capitalize() 