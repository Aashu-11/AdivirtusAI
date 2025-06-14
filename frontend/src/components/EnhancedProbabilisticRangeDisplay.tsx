import React from 'react';
import { ProbabilisticRanges } from '@/types/assessment';
import { motion } from 'framer-motion';
import { tw, components, fonts, utils } from '@/config/design-system';

interface EnhancedProbabilisticRangeDisplayProps {
  ranges: ProbabilisticRanges;
}

const EnhancedProbabilisticRangeDisplay = ({ ranges }: EnhancedProbabilisticRangeDisplayProps) => {
  // Helper function to format the multiplier as time description
  const formatTimeMultiplier = (multiplier: number): string => {
    if (multiplier <= 1) return 'Faster than average';
    if (multiplier <= 1.3) return 'Slightly longer than average';
    if (multiplier <= 1.7) return 'Moderately longer than average';
    return 'Significantly longer than average';
  };

  return (
    <div>
      <h3 className={utils.cn(tw.typography.cardHeading, "mb-3")}>Learning Time Estimates</h3>
      <p className={utils.cn(tw.typography.bodyText, "mb-4")}>
        These ranges predict how quickly you may complete learning activities.
      </p>
      
      <div className={utils.cn(components.card.nested, "relative pt-6 pb-12")}>
        {/* Horizontal line */}
        <div className={utils.cn("absolute h-1 w-full top-12 rounded-full", tw.bg.nested)}></div>
        
        {/* Range labels */}
        <div className={utils.cn("flex justify-between text-xs mb-1 px-1", tw.text.tertiary)}>
          <span>Faster</span>
          <span>Average</span>
          <span>Slower</span>
        </div>
        
        {/* Timeline dots - only show dots, no labels on the line */}
        <div className="relative h-6">
          {/* Optimistic marker */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="absolute"
            style={{ 
              left: `${Math.min(Math.max((ranges.optimistic - 0.8) * 100 / 1.7), 0, 100)}%`, 
              top: 0 
            }}
          >
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          </motion.div>
          
          {/* Expected marker */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="absolute"
            style={{ 
              left: `${Math.min(Math.max((ranges.expected - 0.8) * 100 / 1.7), 0, 100)}%`, 
              top: 0 
            }}
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          </motion.div>
          
          {/* Conservative marker */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="absolute"
            style={{ 
              left: `${Math.min(Math.max((ranges.conservative - 0.8) * 100 / 1.7), 0, 100)}%`, 
              top: 0 
            }}
          >
            <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
          </motion.div>
        </div>
        
        {/* Legend below timeline */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center"
          >
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
            <div>
              <span className={utils.cn("text-xs font-medium block", tw.text.emerald)}>Optimistic</span>
              <span className={utils.cn("text-xs font-semibold", tw.text.primary)} style={{ fontFamily: fonts.mono }}>{ranges.optimistic.toFixed(1)}x</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center"
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <div>
              <span className={utils.cn("text-xs font-medium block", tw.text.blue)}>Expected</span>
              <span className={utils.cn("text-xs font-semibold", tw.text.primary)} style={{ fontFamily: fonts.mono }}>{ranges.expected.toFixed(1)}x</span>
              <span className={utils.cn("text-xs block mt-1", tw.text.secondary)}>{formatTimeMultiplier(ranges.expected)}</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex items-center"
          >
            <div className="w-3 h-3 bg-rose-500 rounded-full mr-2"></div>
            <div>
              <span className={utils.cn("text-xs font-medium block", tw.text.rose)}>Conservative</span>
              <span className={utils.cn("text-xs font-semibold", tw.text.primary)} style={{ fontFamily: fonts.mono }}>{ranges.conservative.toFixed(1)}x</span>
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className={utils.cn(components.card.nested, "mt-4")}>
        <p className={utils.cn("text-sm", tw.text.secondary)}>
          <span className={utils.cn("font-medium", tw.text.primary)}>What this means: </span> 
          These multipliers represent how your learning time compares to an average learner. 
          A multiplier of 1.0x means average pace, lower is faster, higher is more deliberate.
        </p>
      </div>
    </div>
  );
};

export default EnhancedProbabilisticRangeDisplay; 