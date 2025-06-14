'use client'

import { motion } from 'framer-motion'
import MCQQuestion from './MCQQuestion'
import TextQuestion from './TextQuestion'
import ImageQuestion from './ImageQuestion'
import AudioQuestion from './AudioQuestion'
import LearningSpeedTest from '@/app/assessments/interactive-questions/LearningSpeedTest'
import { useState } from 'react'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'

interface QuestionWrapperProps {
  question: {
    id: string
    type: string
    prompt: string
    options?: Array<{ text: string; value: any }>
    media?: { type: string; url: string; alt: string }
  }
  answer?: any
  onAnswer: (id: string, value: any) => void
  currentQuestionNumber?: number
  isAnswerLocked?: boolean
}

export default function QuestionWrapper({ 
  question, 
  answer, 
  onAnswer, 
  currentQuestionNumber,
  isAnswerLocked 
}: QuestionWrapperProps) {
  const handleAnswer = (id: string, value: any) => {
    if (isAnswerLocked) return;
    if (value === undefined || value === null || 
        (Array.isArray(value) && value.length === 0) || 
        (typeof value === 'string' && value.trim() === '')) return;
    onAnswer(id, value);
  };

  // Ensure question type is properly set
  const questionType = question.type.toUpperCase() === 'MCQ' ? 'MCQ' : question.type;

  const renderQuestion = () => {
    switch (questionType) {
      case 'interactive':
        return (
          <div className="space-y-6">
            <div className="w-full">
              <h3 className={utils.cn(tw.text.primary, "text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed mb-6")}>
                {question.prompt}
              </h3>
            </div>
            <LearningSpeedTest onComplete={(result) => handleAnswer(question.id, result.speed)} />
          </div>
        )
      case 'MCQ':
        return (
          <MCQQuestion 
            question={{
              ...question,
              type: 'MCQ' // Explicitly set type
            }} 
            answer={answer} 
            onAnswer={handleAnswer}
          />
        )
      case 'text':
        return <TextQuestion question={question} answer={answer as string} onAnswer={handleAnswer} />
      case 'image':
        return <ImageQuestion question={question} answer={answer as string} onAnswer={handleAnswer} />
      case 'audio':
        return <AudioQuestion question={question} answer={answer as string} onAnswer={handleAnswer} />
      default:
        return <div>Unsupported question type</div>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 sm:p-8 lg:p-10 rounded-3xl backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 12, 0.7)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {renderQuestion()}
    </motion.div>
  )
} 