'use client'

import { motion } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { HelpCircle, CheckCircle2, Volume2 } from 'lucide-react'

interface AudioQuestionProps {
  question: {
    id: string
    prompt: string
    media?: { url: string; alt: string }
    options?: Array<{ text: string; value: string }>
  }
  answer?: string
  onAnswer: (id: string, value: string) => void
}

export default function AudioQuestion({ question, answer, onAnswer }: AudioQuestionProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Audio Section */}
      {question.media && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={utils.cn(
            "relative rounded-xl p-4 sm:p-6",
            tw.bg.nested,
            tw.border.primary,
            "border shadow-lg"
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={utils.cn(components.iconContainer.blue, "w-8 h-8 sm:w-10 sm:h-10")}>
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className={utils.cn(tw.typography.cardHeading, "text-sm sm:text-base")}>
              Audio Content
            </span>
          </div>
          <audio 
            controls 
            className="w-full h-10 sm:h-12"
            style={{
              filter: 'invert(1) hue-rotate(180deg)',
              borderRadius: '8px'
            }}
          >
            <source src={question.media.url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </motion.div>
      )}

      {/* Question Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col xs:flex-row xs:items-start gap-4"
      >
        <div className={utils.cn(components.iconContainer.blue, "flex-shrink-0 mt-1")}>
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className={utils.cn(tw.typography.sectionHeading, "text-lg sm:text-xl lg:text-2xl leading-relaxed")}>
            {question.prompt}
          </h3>
        </div>
      </motion.div>

      {/* Options Grid */}
      {question.options && (
        <div className="grid gap-3 sm:gap-4">
          {question.options.map((option, index) => (
            <motion.label
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: { delay: 0.3 + (index * 0.1) }
              }}
              key={`${question.id}-${option.value}-${index}`}
              className={utils.cn(
                "group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border",
                "backdrop-blur-sm transition-all duration-300 cursor-pointer",
                "transform hover:scale-[1.01] active:scale-[0.99]",
                answer === option.value 
                  ? utils.cn(
                      tw.border.blue,
                      tw.bgAccent.blue,
                      "shadow-lg shadow-blue-500/20"
                    )
                  : utils.cn(
                      tw.border.primary,
                      "hover:border-gray-600/50 hover:bg-white/5"
                    )
              )}
            >
              {/* Radio Button */}
              <div className={utils.cn(
                "flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2",
                "transition-all duration-300 flex items-center justify-center",
                answer === option.value 
                  ? utils.cn(
                      "border-blue-500 bg-blue-500 scale-110",
                      "shadow-lg shadow-blue-500/30"
                    )
                  : "border-gray-600 group-hover:border-gray-500"
              )}>
                {answer === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white"
                  />
                )}
              </div>

              {/* Hidden Input */}
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={answer === option.value}
                onChange={(e) => onAnswer(question.id, e.target.value)}
                className="sr-only"
              />

              {/* Option Text */}
              <span className={utils.cn(
                "flex-1 transition-colors duration-300 text-sm sm:text-base lg:text-lg",
                answer === option.value 
                  ? utils.cn(tw.text.primary, "font-medium") 
                  : utils.cn(tw.text.secondary, "group-hover:text-white")
              )}>
                {option.text}
              </span>

              {/* Selected Indicator */}
              {answer === option.value && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={utils.cn(components.iconContainer.blue, "w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0")}
                >
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.div>
              )}

              {/* Background Gradient */}
              <motion.div
                initial={false}
                animate={answer === option.value ? { opacity: 1 } : { opacity: 0 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            </motion.label>
          ))}
        </div>
      )}
    </div>
  )
} 