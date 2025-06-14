import { motion } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { Clock, BarChart3 } from 'lucide-react'

interface AssessmentProgressProps {
  currentQuestion: number
  totalQuestions: number
  elapsedTime: number
  estimatedTime: number
}

export default function AssessmentProgress({
  currentQuestion,
  totalQuestions,
  elapsedTime,
  estimatedTime
}: AssessmentProgressProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const progress = (currentQuestion / totalQuestions) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={utils.cn(
        components.card.primary,
        "relative overflow-hidden"
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={utils.cn(components.iconContainer.blue, "w-10 h-10 sm:w-12 sm:h-12")}>
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className={utils.cn(tw.typography.smallLabel, "uppercase tracking-wider mb-1")}>
              Progress
            </div>
            <div className={utils.cn(tw.typography.cardHeading, "flex items-center text-sm sm:text-base")}>
              <span className={tw.text.blue}>{currentQuestion}</span>
              <span className={utils.cn(tw.text.tertiary, "mx-1.5")}>/</span>
              <span>{totalQuestions} Questions</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={utils.cn(components.iconContainer.blue, "w-10 h-10 sm:w-12 sm:h-12")}>
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className={utils.cn(tw.typography.smallLabel, "uppercase tracking-wider mb-1")}>
              Time
            </div>
            <div className={utils.cn(tw.typography.cardHeading, "flex items-center text-sm sm:text-base")}>
              <span className={tw.text.blue}>{formatTime(elapsedTime)}</span>
              <span className={utils.cn(tw.text.tertiary, "mx-1.5")}>/</span>
              <span>{formatTime(estimatedTime)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative">
        {/* Progress Bar Background */}
        <div className={utils.cn(
          "relative h-2 rounded-full overflow-hidden group",
          tw.bg.nested
        )}>
          {/* Progress Fill */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ 
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1]
            }}
          />
          
          {/* Shimmer Effect */}
          <motion.div
            className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['0%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          {/* Question Indicators */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex justify-between px-1">
              {Array.from({ length: totalQuestions }).map((_, i) => (
                <div
                  key={i}
                  className={utils.cn(
                    "w-1 h-1 rounded-full mt-0.5",
                    i < currentQuestion - 1 ? 'bg-blue-400' : 'bg-gray-700'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Progress Percentage */}
        <div className="flex items-center justify-between mt-3">
          <span className={utils.cn(tw.typography.smallLabel, "text-xs")}>
            {Math.round(progress)}% Complete
          </span>
          <span className={utils.cn(tw.typography.smallLabel, "text-xs")}>
            {totalQuestions - currentQuestion} remaining
          </span>
        </div>
      </div>
    </motion.div>
  )
} 