import { motion } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { CheckCircle, TrendingUp, Clock, Target } from 'lucide-react'

interface CompleteScreenProps {
  metrics: {
    visualTime: number
    visualAccuracy: number
    auditoryTime: number
    auditoryAccuracy: number
    totalTime: number
  }
}

export function CompleteScreen({ metrics }: CompleteScreenProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.round(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`
  }

  const formatAccuracy = (accuracy: number) => {
    return `${Math.round(accuracy * 100)}%`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6 sm:space-y-8"
    >
      {/* Success Header */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", damping: 25, stiffness: 300 }}
        className="flex flex-col items-center space-y-4"
      >
        <div className={utils.cn(components.iconContainer.emerald, "w-16 h-16 sm:w-20 sm:h-20")}>
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        
        <h2 className={utils.cn(tw.typography.sectionHeading, "text-xl sm:text-2xl lg:text-3xl")}>
          Assessment Complete!
        </h2>
      </motion.div>

      {/* Results Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={utils.cn(
          components.card.nested,
          tw.bgAccent.emerald,
          tw.border.emerald,
          "relative overflow-hidden"
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <div className={utils.cn(components.iconContainer.emerald, "w-12 h-12")}>
            <TrendingUp className="w-6 h-6" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className={utils.cn(tw.typography.cardHeading, "text-lg sm:text-xl")}>
              Processing Results
            </h3>
            <p className={utils.cn(tw.typography.bodyText, "text-sm sm:text-base leading-relaxed")}>
              Your learning profile is being analyzed and will be available shortly.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <div className={utils.cn(
              components.card.interactive,
              tw.bgAccent.blue,
              tw.border.blue,
              "text-center"
            )}>
              <div className={utils.cn(components.iconContainer.blue, "w-8 h-8 mx-auto mb-2")}>
                <Clock className="w-4 h-4" />
              </div>
              <div className={utils.cn(tw.typography.monoNumbers, "text-sm font-bold")}>
                {formatTime(metrics.totalTime)}
              </div>
              <div className={utils.cn(tw.typography.smallLabel, "text-xs")}>
                Total Time
              </div>
            </div>

            <div className={utils.cn(
              components.card.interactive,
              tw.bgAccent.emerald,
              tw.border.emerald,
              "text-center"
            )}>
              <div className={utils.cn(components.iconContainer.emerald, "w-8 h-8 mx-auto mb-2")}>
                <Target className="w-4 h-4" />
              </div>
              <div className={utils.cn(tw.typography.monoNumbers, "text-sm font-bold")}>
                {formatAccuracy((metrics.visualAccuracy + metrics.auditoryAccuracy) / 2)}
              </div>
              <div className={utils.cn(tw.typography.smallLabel, "text-xs")}>
                Avg. Accuracy
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
} 