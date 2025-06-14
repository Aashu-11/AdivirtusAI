import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { HelpCircle, CheckCircle2, Clock } from 'lucide-react'

interface QuizProps {
  questions: Array<{
    question: string
    options: string[]
    correct: string
  }>
  onComplete: (accuracy: number, time: number) => void
}

export function Quiz({ questions, onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [startTime] = useState(Date.now())
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleOptionClick = (option: string) => {
    setSelectedOption(option)
    
    // Add small delay for animation effect
    setTimeout(() => {
      const newAnswers = [...answers, option]
      setAnswers(newAnswers)

      if (newAnswers.length === questions.length) {
        const accuracy = newAnswers.reduce((acc, curr, idx) => 
          curr === questions[idx].correct ? acc + 1 : acc, 0) / questions.length
        onComplete(accuracy, Date.now() - startTime)
      } else {
        setCurrentQuestion(prev => prev + 1)
        setSelectedOption(null)
      }
    }, 500)
  }

  const questionProgressPercent = ((currentQuestion) / questions.length) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 sm:space-y-8"
    >
      {/* Header with Progress */}
      <div className={utils.cn(
        components.card.nested,
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      )}>
        <div className="flex items-center gap-3">
          <div className={utils.cn(components.iconContainer.blue, "w-8 h-8 sm:w-10 sm:h-10")}>
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className={utils.cn(tw.typography.smallLabel, "text-xs sm:text-sm")}>
              Question Progress
            </div>
            <div className={utils.cn(tw.typography.cardHeading, "text-sm sm:text-base")}>
              <span className={tw.text.blue}>{currentQuestion + 1}</span>
              <span className={utils.cn(tw.text.tertiary, "mx-1")}>/</span>
              <span>{questions.length}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Clock className={utils.cn("w-4 h-4", tw.text.blue)} />
          <div className={utils.cn(
            "h-2 sm:h-2.5 w-24 sm:w-32 rounded-full overflow-hidden",
            tw.bg.interactive
          )}>
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${questionProgressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
      
      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className={utils.cn(
            components.card.primary,
            "relative overflow-hidden"
          )}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
          
          {/* Question Header */}
          <div className="flex flex-col xs:flex-row xs:items-start gap-4 mb-6">
            <div className={utils.cn(components.iconContainer.blue, "flex-shrink-0 mt-1")}>
              <span className={utils.cn(tw.typography.monoNumbers, "text-sm")}>
                {currentQuestion + 1}
              </span>
            </div>
            <div className="flex-1">
              <h3 className={utils.cn(tw.typography.sectionHeading, "text-lg sm:text-xl lg:text-2xl leading-relaxed")}>
                {questions[currentQuestion].question}
              </h3>
            </div>
          </div>

          {/* Options */}
          <div className="grid gap-3 sm:gap-4">
            {questions[currentQuestion].options.map((option, index) => (
              <motion.button
                key={option}
                onClick={() => handleOptionClick(option)}
                disabled={selectedOption !== null}
                whileHover={{ scale: selectedOption === null ? 1.01 : 1 }}
                whileTap={{ scale: selectedOption === null ? 0.99 : 1 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={utils.cn(
                  "group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border",
                  "backdrop-blur-sm transition-all duration-300 text-left",
                  selectedOption === option
                    ? utils.cn(
                        tw.border.blue,
                        tw.bgAccent.blue,
                        "shadow-lg shadow-blue-500/20"
                      )
                    : utils.cn(
                        tw.border.primary,
                        "hover:border-gray-600/50 hover:bg-white/5",
                        selectedOption === null ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                      )
                )}
              >
                {/* Radio Button */}
                <div className={utils.cn(
                  "flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2",
                  "transition-all duration-300 flex items-center justify-center",
                  selectedOption === option 
                    ? utils.cn(
                        "border-blue-500 bg-blue-500 scale-110",
                        "shadow-lg shadow-blue-500/30"
                      )
                    : "border-gray-600 group-hover:border-gray-500"
                )}>
                  {selectedOption === option && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white"
                    />
                  )}
                </div>

                {/* Option Text */}
                <span className={utils.cn(
                  "flex-1 transition-colors duration-300 text-sm sm:text-base lg:text-lg",
                  selectedOption === option 
                    ? utils.cn(tw.text.primary, "font-medium") 
                    : utils.cn(tw.text.secondary, "group-hover:text-white")
                )}>
                  {option}
                </span>

                {/* Selected Indicator */}
                {selectedOption === option && (
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
                  animate={selectedOption === option ? { opacity: 1 } : { opacity: 0 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Overall Progress Bar */}
      <div className={utils.cn(components.card.nested, "space-y-3")}>
        <div className="flex items-center justify-between">
          <span className={utils.cn(tw.typography.smallLabel, "text-xs sm:text-sm")}>
            Overall Progress
          </span>
          <span className={utils.cn(tw.typography.smallLabel, "text-xs sm:text-sm")}>
            {Math.round(questionProgressPercent)}% Complete
          </span>
        </div>
        
        <div className={utils.cn(
          "w-full h-2 sm:h-2.5 rounded-full overflow-hidden",
          tw.bg.interactive
        )}>
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${questionProgressPercent}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>
    </motion.div>
  )
} 