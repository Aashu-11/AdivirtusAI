'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import TechnicalCompetencyHeader from '@/components/technical-competency/TechnicalCompetencyHeader'
import TechnicalCompetencyIntro from '@/components/technical-competency/TechnicalCompetencyIntro'

export default function TechnicalCompetenciesPage() {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)
  
  const handleStartAssessment = () => {
    setIsStarting(true)
    // In a real implementation, this would navigate to the first question
    // or start the assessment process
    setTimeout(() => {
      router.push('/technical-competencies/assessment')
    }, 500)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TechnicalCompetencyHeader 
            title="Technical Competency Assessment"
            description="Evaluate your technical skills and create a personalized skill matrix"
          />
          
          <TechnicalCompetencyIntro 
            onStart={handleStartAssessment}
            isStarting={isStarting}
          />
        </motion.div>
      </div>
    </div>
  )
} 