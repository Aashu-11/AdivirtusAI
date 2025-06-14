export interface Question {
  id: string
  type: 'MCQ' | 'text' | 'image' | 'audio' | 'interactive'
  prompt: string
  options?: Array<{ text: string; value: string }>
  media?: { 
    type: string
    url: string
    alt: string 
  }
}

export interface BaseQuestionProps {
  question: Question
  answer?: string
  onAnswer: (id: string, value: string) => void
}

// Enhanced interpreter interfaces
export interface CognitiveLoadFactors {
  intrinsic: number;
  extraneous: number;
  germane: number;
  composite: number;
}

export interface ProbabilisticRanges {
  optimistic: number;
  expected: number;
  conservative: number;
}

export interface VelocityPrediction {
  /** Base calculated velocity score (0-1 scale, higher is faster) */
  baseVelocity: number;
  
  /** Time multiplier for estimating learning duration (lower is faster) */
  timeMultiplier: number;
  
  /** Estimated completion factor (synonym for timeMultiplier) */
  estimatedCompletionFactor: number;
  
  /** Confidence level in the prediction (0-1 scale) */
  confidenceLevel: number;
  
  /** Identified learning velocity pattern */
  pattern?: 'FastStart' | 'SteadyPace' | 'SlowStart' | 'AdaptivePace';
  
  /** Probabilistic ranges for time estimation */
  probabilisticRanges?: {
    /** Optimistic/best-case scenario time multiplier */
    optimistic: number;
    /** Expected/most likely time multiplier */
    expected: number;
    /** Conservative/worst-case scenario time multiplier */
    conservative: number;
  };
  
  /** Speed during different learning phases */
  phaseVelocity?: {
    /** Initial phase learning speed */
    initial: number;
    /** Middle phase learning speed */
    midpoint: number;
    /** Final phase learning speed */
    completion: number;
  };
  
  /** Time percentage spent in each learning phase */
  phaseDurations?: {
    /** Percentage of time in initial phase */
    initial: number;
    /** Percentage of time in middle phase */
    midpoint: number;
    /** Percentage of time in final phase */
    completion: number;
  };
  
  /** Knowledge retention capability */
  retentionProfile?: {
    /** Short-term retention capability (0-1 scale) */
    shortTerm: number;
    /** Medium-term retention capability (0-1 scale) */
    mediumTerm: number;
    /** Long-term retention capability (0-1 scale) */
    longTerm: number;
  };
  
  /** Preferred method of measuring learning progress */
  measurementPreference?: 'objective' | 'applied' | 'conceptual' | 'subjective';
  
  /** Time estimation precision based on self-reporting (0-1 scale) */
  timeframePrecision?: number;
  
  /** Cognitive load impact factors */
  cognitiveLoadFactors?: CognitiveLoadFactors;
  
  /** Component factors affecting learning velocity */
  factors?: {
    /** Ability to adapt to different learning contexts (0-1 scale) */
    adaptability: number;
    /** Ability to handle complexity (0-1 scale) */
    complexity: number;
    /** Motivation level (0-1 scale) */
    motivation: number;
    /** Cognitive load management ability (0-1 scale) */
    cognitiveManagement: number;
    /** Match between learning style and content delivery (0-1 scale) */
    styleMatch: number;
    /** Learning efficiency factor based on preferred approach (0-1 scale) */
    efficiencyFactor?: number;
  };
}

export interface LearnerProfile {
  learningStyles: {
    primary: string;
    secondary: string;
    scores: Record<string, number>;
    is_multimodal?: boolean;
    style_blend?: Array<{style: string, weight: number}>;
  };
  learningApproaches: {
    primary: string;
    secondary: string;
    scores: Record<string, number>;
  };
  optimalConditions: {
    timing: number;
    duration: number;
    environment: number;
  };
  contentPreferences: {
    sequencing: number;
    feedback: number;
    motivation: number;
    knowledgeIntegration: number;
  };
  velocityPrediction: VelocityPrediction;
  rawDimensions: Record<string, number>;
  cognitiveProfile?: CognitiveLoadFactors;
}

export interface ProcessingMetadata {
  confidence: number;
  processingTime: string;
  version: string;
  responseConsistency?: Record<string, number>;
  probabilisticTimeRanges?: ProbabilisticRanges;
  cognitiveLoadFactors?: CognitiveLoadFactors;
}

export interface InterpretedResult {
  status: string;
  timestamp: string;
  learnerProfile?: LearnerProfile;
  contentRecommendations?: {
    contentFormats: {
      recommended: string[];
      alternative: string[];
    };
    sequencing: {
      pattern: string[];
      approach: string;
    };
    environment: Record<string, string>;
    feedback: Record<string, string>;
    pacing: Record<string, string>;
    timeMultiplier: number;
    confidenceLevel: number;
  };
  rawResponses?: Record<string, string>;
  processingMetadata: ProcessingMetadata;
  error?: string;
} 