import React from 'react';
import { CognitiveLoadFactors } from '@/types/assessment';
import { motion } from 'framer-motion';
import { tw, components, fonts, utils } from '@/config/design-system';

interface EnhancedCognitiveLoadDisplayProps {
  cognitiveLoadFactors: CognitiveLoadFactors;
}

const EnhancedCognitiveLoadDisplay = ({ cognitiveLoadFactors }: EnhancedCognitiveLoadDisplayProps) => {
  const factorLabels = {
    intrinsic: 'Content Complexity',
    extraneous: 'Distraction Sensitivity',
    germane: 'Schema Building',
    composite: 'Overall Capacity'
  };

  const factorDescriptions = {
    intrinsic: 'How well you handle inherent complexity in learning materials',
    extraneous: 'How sensitive you are to distractions and inefficient formats',
    germane: 'How effectively you build mental models when learning',
    composite: 'Your overall cognitive load capacity'
  };

  // Helper to get a color based on value (higher is better, except for extraneous)
  const getColorForValue = (key: string, value: number): string => {
    // For extraneous load, lower is better
    const score = key === 'extraneous' ? 1 - value : value;
    
    if (score > 0.75) return utils.cn(tw.bgAccent.emerald, tw.text.emerald, tw.border.emerald);
    if (score > 0.5) return utils.cn(tw.bgAccent.blue, tw.text.blue, tw.border.blue);
    if (score > 0.25) return utils.cn(tw.bgAccent.amber, tw.text.amber, tw.border.amber);
    return utils.cn(tw.bgAccent.rose, tw.text.rose, tw.border.rose);
  };

  // Helper to get progress bar color
  const getBarColor = (key: string): string => {
    return key === 'extraneous' ? 'bg-rose-500' : 'bg-blue-500';
  };

  return (
    <div>
      <h3 className={utils.cn(tw.typography.cardHeading, "mb-3")}>Cognitive Load Profile</h3>
      <p className={utils.cn(tw.typography.bodyText, "mb-4")}>
        This reflects how your brain processes different types of cognitive demands during learning.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(cognitiveLoadFactors).map(([key, value]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={utils.cn(components.card.nested, getColorForValue(key, value), "transition-all duration-300")}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className={utils.cn("font-medium", tw.text.primary)}>{factorLabels[key as keyof CognitiveLoadFactors]}</h4>
              <span className={utils.cn("text-sm font-semibold", tw.text.primary)} style={{ fontFamily: fonts.mono }}>{Math.round(value * 100)}%</span>
            </div>
            
            <div className={utils.cn("w-full rounded-full h-2.5", tw.bg.nested)}>
              <div 
                className={`h-2.5 rounded-full ${getBarColor(key)} transition-all duration-500`}
                style={{ width: `${Math.round(value * 100)}%` }}
              ></div>
            </div>
            
            <p className={utils.cn("mt-2 text-xs", tw.text.secondary)}>
              {factorDescriptions[key as keyof CognitiveLoadFactors]}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedCognitiveLoadDisplay; 