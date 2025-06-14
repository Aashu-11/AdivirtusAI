import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { Eye, Play, Loader2 } from 'lucide-react'

const STORY_SEGMENTS = [
  "In a distant galaxy, scientists discovered a unique phenomenon.",
  "A star that pulsed with mathematical precision, sending signals.",
  "These signals contained patterns that resembled prime numbers.",
  "After months of study, they realized it wasn't random at all.",
  "The star was actually communicating complex equations."
]

const ITERATIONS = 3
const SEGMENT_DURATION = 800 // 0.8 seconds per segment

interface VisualTestProps {
  onComplete: (time: number) => void
}

export function VisualTest({ onComplete }: VisualTestProps) {
  const [currentSegment, setCurrentSegment] = useState(0)
  const [startTime] = useState(Date.now())
  const [isReady, setIsReady] = useState(false)
  const [iteration, setIteration] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!isReady || isComplete) return

    const timer = setInterval(() => {
      setCurrentSegment(prev => {
        if (prev === STORY_SEGMENTS.length - 1) {
          if (iteration === ITERATIONS - 1) {
            setIsComplete(true)
            onComplete(Date.now() - startTime)
            return prev
          }
          setIteration(i => i + 1)
          return 0
        }
        return prev + 1
      })
    }, SEGMENT_DURATION)

    return () => clearInterval(timer)
  }, [isReady, iteration, isComplete, onComplete, startTime])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 sm:space-y-8"
    >
      {!isReady ? (
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center space-y-4">
            <div className={utils.cn(components.iconContainer.blue, "w-12 h-12 sm:w-16 sm:h-16")}>
              <Eye className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className={utils.cn(tw.typography.sectionHeading, "text-lg sm:text-xl lg:text-2xl")}>
              Visual Learning Test
            </h3>
          </div>

          {/* Instructions */}
          <div className={utils.cn(
            components.card.nested,
            tw.bgAccent.blue,
            tw.border.blue,
            "relative overflow-hidden"
          )}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -z-10"></div>
            <p className={utils.cn(tw.typography.bodyText, "text-sm sm:text-base leading-relaxed")}>
              The story will cycle <strong className={tw.text.blue}>{ITERATIONS} times</strong> rapidly. 
              Try to memorize as much as you can.
            </p>
          </div>

          {/* Start Button */}
          <motion.button
            onClick={() => setIsReady(true)}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
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
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Start Reading</span>
            </div>
          </motion.button>
        </div>
      ) : (
        <>
          {/* Story Display */}
          <div className={utils.cn(
            components.card.nested,
            "h-32 sm:h-40 flex items-center justify-center overflow-hidden relative"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
            
            <AnimatePresence mode="wait">
              <motion.p
                key={`${iteration}-${currentSegment}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={utils.cn(
                  tw.typography.sectionHeading,
                  "text-center text-base sm:text-lg lg:text-xl leading-relaxed px-4"
                )}
              >
                {!isComplete ? STORY_SEGMENTS[currentSegment] : 
                  <span className={utils.cn("flex items-center gap-3", tw.text.blue)}>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Preparing questions...
                  </span>
                }
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress Section */}
          <div className={utils.cn(components.card.nested, "space-y-3 sm:space-y-4")}>
            {/* Progress Bar */}
            <div className="relative">
              <div className={utils.cn(
                "w-full h-2 sm:h-2.5 rounded-full overflow-hidden",
                tw.bg.interactive
              )}>
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((iteration * STORY_SEGMENTS.length + currentSegment + 1) / (STORY_SEGMENTS.length * ITERATIONS)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Progress Labels */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={utils.cn(components.iconContainer.blue, "w-6 h-6")}>
                  <span className={utils.cn(tw.typography.monoNumbers, "text-xs")}>
                    {iteration + 1}
                  </span>
                </div>
                <span className={utils.cn(tw.typography.smallLabel, "text-xs sm:text-sm")}>
                  Iteration {iteration + 1}/{ITERATIONS}
                </span>
              </div>
              
              <span className={utils.cn(tw.typography.smallLabel, "text-xs sm:text-sm")}>
                Line {currentSegment + 1}/{STORY_SEGMENTS.length}
              </span>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
} 