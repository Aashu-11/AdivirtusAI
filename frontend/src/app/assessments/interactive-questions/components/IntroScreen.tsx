import { motion } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { Lightbulb, Eye, Volume2, Info, ArrowRight } from 'lucide-react'

interface IntroScreenProps {
  onStart: () => void
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6 sm:space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className={utils.cn(components.iconContainer.blue, "w-16 h-16 sm:w-20 sm:h-20")}>
          <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        
        <h2 className={utils.cn(tw.typography.sectionHeading, "text-xl sm:text-2xl lg:text-3xl")}>
          Learning Speed Assessment
        </h2>
      </div>
      
      {/* Info Card */}
      <div className={utils.cn(
        components.card.nested,
        "space-y-5 sm:space-y-6 relative overflow-hidden"
      )}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
        
        <p className={utils.cn(tw.typography.bodyText, "leading-relaxed text-sm sm:text-base")}>
          This interactive test will measure your learning speed through both visual and auditory exercises.
        </p>
        
        {/* Assessment Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={utils.cn(
              components.card.interactive,
              tw.bgAccent.blue,
              tw.border.blue,
              tw.hover.blue
            )}
          >
            <div className="flex items-start gap-3">
              <div className={utils.cn(components.iconContainer.blue, "w-8 h-8 flex-shrink-0")}>
                <Eye className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className={utils.cn(tw.typography.cardHeading, "text-sm sm:text-base mb-1")}>
                  Visual Assessment
                </h3>
                <p className={utils.cn(tw.typography.smallLabel, "text-xs sm:text-sm leading-relaxed")}>
                  Read a short story and answer questions about it
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={utils.cn(
              components.card.interactive,
              tw.bgAccent.blue,
              tw.border.blue,
              tw.hover.blue
            )}
          >
            <div className="flex items-start gap-3">
              <div className={utils.cn(components.iconContainer.blue, "w-8 h-8 flex-shrink-0")}>
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className={utils.cn(tw.typography.cardHeading, "text-sm sm:text-base mb-1")}>
                  Auditory Assessment
                </h3>
                <p className={utils.cn(tw.typography.smallLabel, "text-xs sm:text-sm leading-relaxed")}>
                  Listen to audio and recall information
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={utils.cn(
            "p-4 rounded-xl flex items-start gap-3",
            tw.bgAccent.blue,
            tw.border.blue,
            "border"
          )}
        >
          <div className={utils.cn(components.iconContainer.blue, "w-6 h-6 flex-shrink-0")}>
            <Info className="w-3 h-3" />
          </div>
          <p className={utils.cn(tw.typography.smallLabel, "text-xs sm:text-sm leading-relaxed flex-1")}>
            Please wear headphones for the audio portion, and try to minimize distractions during the assessment.
          </p>
        </motion.div>
      </div>
      
      {/* Start Button */}
      <motion.button
        onClick={onStart}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={utils.cn(
          "group relative px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-medium overflow-hidden",
          "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
          "text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25",
          "transition-all duration-300 border border-blue-400/30",
          "text-sm sm:text-base"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative flex items-center justify-center gap-2 sm:gap-3">
          <span>Start Assessment</span>
          <ArrowRight className={utils.cn(
            "w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300",
            "group-hover:translate-x-1"
          )} />
        </div>
      </motion.button>
    </motion.div>
  )
} 