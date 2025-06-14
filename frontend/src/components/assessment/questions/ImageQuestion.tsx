'use client'

import { motion } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { Image as ImageIcon } from 'lucide-react'

interface ImageQuestionProps {
  question: {
    id: string
    prompt: string
    media?: { url: string; alt: string }
    options?: Array<{ text: string; value: string }>
  }
  answer?: string
  onAnswer: (id: string, value: string) => void
}

export default function ImageQuestion({ question, answer, onAnswer }: ImageQuestionProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Image Section */}
      {question.media && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-2xl overflow-hidden shadow-lg"
        >
          <div className="aspect-video relative">
            <img 
              src={question.media.url} 
              alt={question.media.alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                <ImageIcon className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Question Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="w-full"
      >
        <h3 className={utils.cn(tw.text.primary, "text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed")}>
          {question.prompt}
        </h3>
      </motion.div>

      {/* Options Grid */}
      {question.options && (
        <div className="grid gap-3 sm:gap-4">
          {question.options.map((option, index) => (
            <motion.label
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: 0.2 + (index * 0.05), duration: 0.2 }
              }}
              key={`${question.id}-${option.value}-${index}`}
              className={utils.cn(
                "group relative flex items-center gap-4 p-5 sm:p-6 rounded-2xl",
                "backdrop-blur-sm transition-all duration-200 cursor-pointer",
                "hover:scale-[1.01] active:scale-[0.99]",
                answer === option.value 
                  ? "bg-blue-500/15 shadow-lg shadow-blue-500/20"
                  : "bg-white/5 hover:bg-white/10"
              )}
            >
              {/* Radio Button */}
              <div className={utils.cn(
                "flex-shrink-0 w-6 h-6 rounded-full border-2",
                "transition-all duration-200 flex items-center justify-center",
                answer === option.value 
                  ? "border-blue-500 bg-blue-500 scale-110 shadow-lg shadow-blue-500/30"
                  : "border-gray-600 group-hover:border-gray-500"
              )}>
                {answer === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="w-2.5 h-2.5 rounded-full bg-white"
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
                "flex-1 transition-colors duration-200 text-base sm:text-lg leading-relaxed",
                answer === option.value 
                  ? utils.cn(tw.text.primary, "font-medium") 
                  : utils.cn(tw.text.secondary, "group-hover:text-white")
              )}>
                {option.text}
              </span>

              {/* Background Gradient */}
              <motion.div
                initial={false}
                animate={answer === option.value ? { opacity: 1 } : { opacity: 0 }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"
                transition={{ duration: 0.2 }}
              />
            </motion.label>
          ))}
        </div>
      )}
    </div>
  )
} 