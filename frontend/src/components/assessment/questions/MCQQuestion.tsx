'use client'

import { motion } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'

interface MCQQuestionProps {
  question: {
    id: string
    prompt: string
    type: string
    options?: Array<{ text: string; value: any }>
  }
  answer?: any
  onAnswer: (id: string, value: any) => void
}

export default function MCQQuestion({ question, answer, onAnswer }: MCQQuestionProps) {
  if (!question.options) return null;

  const isOptionSelected = (optionValue: any): boolean => {
    if (answer === undefined) return false;
    
    if (typeof optionValue !== 'object' || optionValue === null) {
      return answer === optionValue;
    }
    
    if (typeof answer === 'object' && answer !== null) {
      return JSON.stringify(optionValue) === JSON.stringify(answer);
    }
    
    return false;
  };

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

      {/* Options Grid */}
      <div className="grid gap-3 sm:gap-4">
        {question.options.map((option, index) => (
          <motion.label
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: index * 0.05, duration: 0.2 }
            }}
            key={`${question.id}-${index}`}
            className={utils.cn(
              "group relative flex items-center gap-4 p-5 sm:p-6 rounded-2xl",
              "backdrop-blur-sm transition-all duration-200 cursor-pointer",
              "hover:scale-[1.01] active:scale-[0.99]",
              isOptionSelected(option.value)
                ? "bg-blue-500/15 shadow-lg shadow-blue-500/20"
                : "bg-white/5 hover:bg-white/10"
            )}
          >
            {/* Radio Button */}
            <div className={utils.cn(
              "flex-shrink-0 w-6 h-6 rounded-full border-2",
              "transition-all duration-200 flex items-center justify-center",
              isOptionSelected(option.value) 
                ? "border-blue-500 bg-blue-500 scale-110 shadow-lg shadow-blue-500/30"
                : "border-gray-600 group-hover:border-gray-500"
            )}>
              {isOptionSelected(option.value) && (
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
              checked={isOptionSelected(option.value)}
              onChange={() => onAnswer(question.id, option.value)}
              className="sr-only"
            />

            {/* Option Text */}
            <span className={utils.cn(
              "flex-1 transition-colors duration-200 text-base sm:text-lg leading-relaxed",
              isOptionSelected(option.value) 
                ? utils.cn(tw.text.primary, "font-medium") 
                : utils.cn(tw.text.secondary, "group-hover:text-white")
            )}>
              {option.text}
            </span>

            {/* Background Gradient */}
            <motion.div
              initial={false}
              animate={isOptionSelected(option.value) ? { opacity: 1 } : { opacity: 0 }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"
              transition={{ duration: 0.2 }}
            />
          </motion.label>
        ))}
      </div>
    </div>
  )
} 