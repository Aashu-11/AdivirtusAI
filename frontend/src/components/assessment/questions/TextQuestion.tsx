'use client'

import { motion } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { Edit3 } from 'lucide-react'

interface TextQuestionProps {
  question: {
    id: string
    prompt: string
  }
  answer?: string
  onAnswer: (id: string, value: string) => void
}

export default function TextQuestion({ question, answer, onAnswer }: TextQuestionProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Question Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <h3 className={utils.cn(tw.text.primary, "text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed")}>
          {question.prompt}
        </h3>
      </motion.div>

      {/* Answer Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <Edit3 className={utils.cn("w-5 h-5", tw.text.blue)} />
          <label className={utils.cn(tw.text.primary, "font-medium text-base")}>
            Your Answer
          </label>
        </div>
        
        <div className="relative">
          <textarea
            value={answer || ''}
            onChange={(e) => onAnswer(question.id, e.target.value)}
            className={utils.cn(
              "w-full h-40 sm:h-48 p-5 sm:p-6 rounded-2xl resize-none",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/10",
              "transition-all duration-200",
              "bg-white/5 hover:bg-white/8",
              tw.text.primary,
              "placeholder-gray-500 text-base sm:text-lg leading-relaxed"
            )}
            placeholder="Type your detailed answer here... Be specific and provide examples where possible."
          />
          <div className="absolute bottom-4 right-4 opacity-60">
            <span className={utils.cn(tw.text.tertiary, "text-sm")}>
              {answer ? `${answer.length} characters` : 'Start typing...'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 