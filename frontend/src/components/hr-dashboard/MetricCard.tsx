'use client'

import { motion } from 'framer-motion'
import { tw, utils } from '@/config/design-system'
import { MetricCardProps } from '@/types/hr-analytics'

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  color = 'blue', 
  format = 'number' 
}: MetricCardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${Math.round(val)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(val);
      default:
        return val.toLocaleString();
    }
  };

  const getColorClasses = (colorName: string) => {
    const colorMap = {
      blue: {
        bg: tw.bgAccent.blue,
        text: tw.text.blue,
        border: tw.border.blue
      },
      emerald: {
        bg: tw.bgAccent.emerald,
        text: tw.text.emerald,
        border: tw.border.emerald
      },
      amber: {
        bg: tw.bgAccent.amber,
        text: tw.text.amber,
        border: tw.border.amber
      },
      rose: {
        bg: tw.bgAccent.rose,
        text: tw.text.rose,
        border: tw.border.rose
      }
    };
    return colorMap[colorName as keyof typeof colorMap] || colorMap.blue;
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={utils.cn(
        "p-6 rounded-xl border transition-all duration-300",
        tw.bg.card,
        tw.border.primary,
        "hover:shadow-lg hover:scale-[1.02]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={utils.cn(tw.typography.bodyText, "font-medium")}>
          {title}
        </h3>
        {trend && (
          <div className={utils.cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            colorClasses.bg,
            colorClasses.text
          )}>
            {getTrendIcon(trend.direction)}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-2">
        <span className={utils.cn(
          "text-2xl font-bold",
          tw.text.primary
        )}>
          {formatValue(value)}
        </span>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className={utils.cn(tw.typography.smallLabel, "leading-relaxed")}>
          {subtitle}
        </p>
      )}

      {/* Visual accent */}
      <div className={utils.cn(
        "mt-4 h-1 rounded-full",
        colorClasses.bg
      )} />
    </motion.div>
  );
} 