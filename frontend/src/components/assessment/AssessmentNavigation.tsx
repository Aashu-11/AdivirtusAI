import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { ChevronLeft, ChevronRight, Send, Loader2, CheckCircle } from 'lucide-react'

interface AssessmentNavigationProps {
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  showPrevious: boolean
  showNext: boolean
  showSubmit: boolean
  isSubmitting: boolean
  canProceed: boolean
}

export default function AssessmentNavigation({
  onPrevious,
  onNext,
  onSubmit,
  showPrevious,
  showNext,
  showSubmit,
  isSubmitting,
  canProceed
}: AssessmentNavigationProps) {
  return (
    <div className="mt-8 sm:mt-10 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-4">
      <motion.button
        onClick={onPrevious}
        whileTap={{ scale: showPrevious ? 0.95 : 1 }}
        className={utils.cn(
          "group relative flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 rounded-xl font-medium",
          "text-sm sm:text-base transition-all duration-300 overflow-hidden",
          showPrevious 
            ? utils.cn(
                tw.bg.nested,
                tw.text.secondary,
                tw.border.primary,
                "border hover:border-gray-600/50 hover:bg-gray-800/50",
                "hover:text-white transform hover:scale-[1.02] active:scale-[0.98]",
                "shadow-lg hover:shadow-xl"
              )
            : utils.cn(
                tw.bg.nested, 
                tw.text.tertiary, 
                "cursor-not-allowed border border-gray-800/30"
              )
        )}
        disabled={!showPrevious}
      >
        {showPrevious && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        )}
        <ChevronLeft className={utils.cn(
          "w-4 h-4 transition-transform duration-300 relative z-10",
          showPrevious ? "group-hover:-translate-x-1" : ""
        )} />
        <span className="relative z-10">Previous</span>
      </motion.button>

      {showSubmit ? (
        <motion.button
          onClick={onSubmit}
          disabled={isSubmitting || !canProceed}
          whileTap={{ scale: canProceed && !isSubmitting ? 0.95 : 1 }}
          className={utils.cn(
            "group relative flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 rounded-xl font-medium",
            "text-sm sm:text-base transition-all duration-300 overflow-hidden",
            canProceed && !isSubmitting
              ? utils.cn(
                  "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
                  "text-white shadow-lg hover:shadow-xl hover:shadow-emerald-500/25",
                  "transform hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/30"
                )
              : utils.cn(
                  tw.bg.nested,
                  tw.text.tertiary,
                  "cursor-not-allowed border border-gray-800/30"
                )
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin relative z-10" />
              <span className="relative z-10">Submitting...</span>
            </>
          ) : (
            <>
              <span className="relative z-10">Submit Assessment</span>
              <CheckCircle className={utils.cn(
                "w-4 h-4 relative z-10 transition-transform duration-300",
                canProceed ? "group-hover:scale-110" : ""
              )} />
            </>
          )}
        </motion.button>
      ) : (
        <motion.button
          onClick={onNext}
          whileTap={{ scale: showNext && canProceed ? 0.95 : 1 }}
          disabled={!showNext || !canProceed}
          className={utils.cn(
            "group relative flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 rounded-xl font-medium",
            "text-sm sm:text-base transition-all duration-300 overflow-hidden",
            showNext && canProceed
              ? utils.cn(
                  "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
                  "text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25",
                  "transform hover:scale-[1.02] active:scale-[0.98] border border-blue-400/30"
                )
              : utils.cn(
                  tw.bg.nested,
                  tw.text.tertiary,
                  "cursor-not-allowed border border-gray-800/30"
                )
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10">Next</span>
          <ChevronRight className={utils.cn(
            "w-4 h-4 relative z-10 transition-transform duration-300",
            showNext && canProceed ? "group-hover:translate-x-1" : ""
          )} />
        </motion.button>
      )}
    </div>
  )
} 