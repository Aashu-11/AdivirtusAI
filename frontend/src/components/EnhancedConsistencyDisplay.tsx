import React from 'react';
import { motion } from 'framer-motion';
import { tw, components, fonts, utils } from '@/config/design-system';

interface EnhancedConsistencyDisplayProps {
  consistencyData: Record<string, number>;
}

// Helper function to format parameter names
const formatParameterName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/[-_]/g, ' ');
};

// Helper function to get color based on consistency value
const getConsistencyColor = (value: number): string => {
  if (value > 0.8) return 'text-emerald-400 dark:text-emerald-600';
  if (value > 0.6) return 'text-blue-400 dark:text-blue-600';
  if (value > 0.4) return 'text-amber-400 dark:text-amber-600';
  return 'text-rose-400 dark:text-rose-600';
};

// Helper function to get bar color based on consistency value
const getConsistencyBarColor = (value: number): string => {
  if (value > 0.8) return 'bg-emerald-500';
  if (value > 0.6) return 'bg-blue-500';
  if (value > 0.4) return 'bg-amber-500';
  return 'bg-rose-500';
};

const EnhancedConsistencyDisplay = ({ consistencyData }: EnhancedConsistencyDisplayProps) => {
  // Get max 6 items to display
  const topItems = Object.entries(consistencyData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div>
      <h3 className={utils.cn(tw.typography.cardHeading, "mb-3")}>Response Consistency</h3>
      <p className={utils.cn(tw.typography.bodyText, "mb-4")}>
        Higher consistency indicates more reliable assessment results for each parameter.
      </p>
      
      <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topItems.map(([key, value], index) => (
            <motion.div 
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
              className="flex flex-col"
            >
              <div className="flex justify-between items-center">
                <span className={utils.cn("text-sm font-medium", tw.text.primary)}>{formatParameterName(key)}</span>
                <span className={utils.cn("text-xs font-medium", getConsistencyColor(value))} style={{ fontFamily: fonts.mono }}>
                  {Math.round(value * 100)}%
                </span>
              </div>
              <div className={utils.cn("w-full rounded-full h-2 mt-2", tw.bg.nested)}>
                <div 
                  className={`h-2 rounded-full ${getConsistencyBarColor(value)} transition-all duration-500`}
                  style={{ width: `${Math.round(value * 100)}%` }}
                ></div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {topItems.length === 0 && (
          <p className={utils.cn(tw.text.secondary, "text-center py-4")}>No consistency data available</p>
        )}
      </div>
    </div>
  );
};

export default EnhancedConsistencyDisplay; 