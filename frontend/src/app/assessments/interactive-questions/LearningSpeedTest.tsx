'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IntroScreen } from './components/IntroScreen'
import { VisualTest } from './components/VisualTest'
import { AudioTest } from './components/AudioTest'
import { Quiz } from './components/Quiz'
import { CompleteScreen } from './components/CompleteScreen'
import { analyzeLearningSpeed } from './utils/analysis'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'

interface LearningSpeedTestProps {
  onComplete: (result: {
    speed: 'Fast' | 'Moderate' | 'Slow'
    metrics: {
      visualTime: number
      visualAccuracy: number
      auditoryTime: number
      auditoryAccuracy: number
      totalTime: number
    }
  }) => void
}

// Visual quiz questions
const visualQuestions = [
  {
    question: "What was discovered in the distant galaxy?",
    options: ["A black hole", "A pulsing star", "A new planet"],
    correct: "A pulsing star"
  },
  {
    question: "What did the signals contain?",
    options: ["Random noise", "Prime numbers", "Binary code"],
    correct: "Prime numbers"
  },
  {
    question: "What was the star doing?",
    options: ["Exploding", "Dying", "Communicating equations"],
    correct: "Communicating equations"
  }
]

// Audio quiz questions
const audioQuestions = [
  {
    question: "How long was the beep sound approximately?",
    options: ["5 seconds", "10 seconds", "15 seconds"],
    correct: "10 seconds"
  },
  {
    question: "What type of sound did you hear?",
    options: ["Musical tone", "Censor beep", "Alarm sound"],
    correct: "Censor beep"
  },
  {
    question: "Was the sound continuous or intermittent?",
    options: ["Continuous", "Intermittent", "Pulsing"],
    correct: "Continuous"
  }
]

export default function LearningSpeedTest({ onComplete }: LearningSpeedTestProps) {
  const [stage, setStage] = useState<'intro' | 'visual' | 'visualQuiz' | 'audio' | 'audioQuiz' | 'complete'>('intro')
  const [metrics, setMetrics] = useState({
    visualTime: 0,
    visualAccuracy: 0,
    auditoryTime: 0,
    auditoryAccuracy: 0,
    totalTime: 0
  })

  // Use state for startTime instead of Date.now() directly
  const [startTime] = useState(() => Date.now())

  const handleVisualComplete = (time: number) => {
    setMetrics(prev => ({ ...prev, visualTime: time }))
    setStage('visualQuiz')
  }

  const handleVisualQuizComplete = (accuracy: number) => {
    setMetrics(prev => ({ ...prev, visualAccuracy: accuracy }))
    setStage('audio')
  }

  const handleAudioComplete = (time: number) => {
    setMetrics(prev => ({ ...prev, auditoryTime: time }))
    setStage('audioQuiz')
  }

  const handleAudioQuizComplete = (accuracy: number) => {
    const finalMetrics = {
      ...metrics,
      auditoryAccuracy: accuracy,
      totalTime: Date.now() - startTime
    }
    
    const speed = analyzeLearningSpeed(finalMetrics)
    setMetrics(finalMetrics)
    setStage('complete')
    onComplete({ speed, metrics: finalMetrics })
  }

  return (
    <div className={utils.cn(
      "max-w-4xl mx-auto",
      components.card.nested,
      "relative overflow-hidden"
    )} style={{ fontFamily: fonts.primary }}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -z-10"></div>
      
      <AnimatePresence mode="wait">
        {stage === 'intro' && <IntroScreen onStart={() => setStage('visual')} />}
        {stage === 'visual' && <VisualTest onComplete={handleVisualComplete} />}
        {stage === 'visualQuiz' && (
          <Quiz 
            questions={visualQuestions} 
            onComplete={handleVisualQuizComplete} 
          />
        )}
        {stage === 'audio' && <AudioTest onComplete={handleAudioComplete} />}
        {stage === 'audioQuiz' && (
          <Quiz 
            questions={audioQuestions} 
            onComplete={handleAudioQuizComplete} 
          />
        )}
        {stage === 'complete' && <CompleteScreen metrics={metrics} />}
      </AnimatePresence>
    </div>
  )
} 