'use client'

import React from 'react'
import { motion } from 'framer-motion'
import EnhancedCognitiveLoadDisplay from '@/components/EnhancedCognitiveLoadDisplay'
import EnhancedProbabilisticRangeDisplay from '@/components/EnhancedProbabilisticRangeDisplay'
import EnhancedConsistencyDisplay from '@/components/EnhancedConsistencyDisplay'
import { tw, components, animations, fonts, utils } from '@/config/design-system'

interface InterpretedResult {
  learnerProfile?: {
    velocityPrediction?: {
      cognitiveLoadFactors?: any
      probabilisticRanges?: any
    }
  }
  processingMetadata?: {
    version?: string
    responseConsistency?: any
  }
}

interface EnhancedLearningProfileProps {
  interpretationData: InterpretedResult | null
}

export default function EnhancedLearningProfile({ interpretationData }: EnhancedLearningProfileProps) {
  // Check if this is an enhanced interpretation (v1.1+)
  const hasEnhancedData = (): boolean => {
    if (!interpretationData?.processingMetadata?.version) return false;
    return parseFloat(interpretationData.processingMetadata.version) >= 1.1;
  };

  if (!hasEnhancedData()) return null;
  
  const { learnerProfile, processingMetadata } = interpretationData!;
  const { velocityPrediction } = learnerProfile!;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4" style={{ fontFamily: fonts.primary }}>
        <h2 className={tw.typography.sectionHeading}>Enhanced Learning Profile</h2>
        <span className={components.badge.blue}>
          v{processingMetadata!.version}
        </span>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
        style={{ fontFamily: fonts.primary }}
      >
        <p className={tw.typography.bodyText}>
          Our enhanced interpreter provides more detailed insights about your learning profile
          through advanced cognitive analysis and machine learning predictions.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cognitive Load Factors */}
          {velocityPrediction?.cognitiveLoadFactors && (
            <div className={components.card.primary}>
              <EnhancedCognitiveLoadDisplay 
                cognitiveLoadFactors={velocityPrediction.cognitiveLoadFactors} 
              />
            </div>
          )}
          
          {/* Probabilistic Time Ranges */}
          {velocityPrediction?.probabilisticRanges && (
            <div className={components.card.primary}>
              <EnhancedProbabilisticRangeDisplay 
                ranges={velocityPrediction.probabilisticRanges} 
              />
            </div>
          )}
        </div>
        
        {/* Response Consistency Section */}
        {processingMetadata?.responseConsistency && Object.keys(processingMetadata.responseConsistency).length > 0 && (
          <div className={components.card.primary}>
            <EnhancedConsistencyDisplay 
              consistencyData={processingMetadata.responseConsistency} 
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}