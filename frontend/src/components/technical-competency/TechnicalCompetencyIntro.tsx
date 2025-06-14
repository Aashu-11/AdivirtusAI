import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface TechnicalCompetencyIntroProps {
  onStart: () => void
  isStarting: boolean
}

export default function TechnicalCompetencyIntro({ 
  onStart,
  isStarting
}: TechnicalCompetencyIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-8 mt-8"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex justify-center"
      >
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-6 rounded-xl border border-emerald-500/30 backdrop-blur-sm max-w-xl w-full">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/30 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white">Coming Soon</h3>
            <p className="text-gray-300">
              We're crafting a comprehensive assessment tool to help you showcase your technical skills.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
} 