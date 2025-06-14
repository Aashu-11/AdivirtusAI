'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Send, AlertCircle, Brain, CheckCircle2, ChartBar, Info, Type, X, CheckCircle, Award, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import SkillCompetencyTest from '@/components/skill-competency/SkillCompetencyTest'
import { useRouter } from 'next/navigation'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function TechnicalAssessment() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null)
  const [sopFile, setSopFile] = useState<File | null>(null)
  const [sopText, setSopText] = useState<string>('')
  const [sopMode, setSopMode] = useState<'upload' | 'text' | null>(null)
  const [domainKnowledgeFile, setDomainKnowledgeFile] = useState<File | null>(null)
  const [domainKnowledgeText, setDomainKnowledgeText] = useState<string>('')
  const [domainKnowledgeMode, setDomainKnowledgeMode] = useState<'upload' | 'text' | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [isCreatingBaseline, setIsCreatingBaseline] = useState(false)
  const [skillAssessmentCompleted, setSkillAssessmentCompleted] = useState(false)
  const router = useRouter()

  // Check if user has already submitted and get user ID
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { user } } = await createClient().auth.getUser()
        if (user?.id) {
          setUserId(user.id)
          
          // Check if user has already submitted
          const response = await fetch(`/api/assessments/check-submission?userId=${user.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (!response.ok) {
            throw new Error(`Failed to check submission status: ${response.status}`)
          }
          
          const data = await response.json()
          
          if (data.hasSubmitted) {
            setHasSubmitted(true)
            setCurrentStep(2)
            setAssessmentId(data.id)
            toast.info('You have already submitted your assessment')
          }

          // Check if skill assessment is completed
          const { data: sctData } = await createClient()
            .from('sct_initial')
            .select('answers')
            .eq('user_id', user.id)
            .single()
          
          if (sctData?.answers && sctData.answers.length > 0) {
            setSkillAssessmentCompleted(true)
          }
        }
      } catch (error) {
        console.error('Error checking submission status:', error)
        toast.error('Failed to check submission status')
      }
    }
    
    checkUserStatus()
  }, [])

  const validateFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file')
      return false
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be under 10MB')
      return false
    }
    return true
  }

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setResumeFile(file)
      setError(null)
    }
  }

  const handleJobDescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setJobDescriptionFile(file)
      setError(null)
    }
  }

  const handleSopUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setSopFile(file)
      setSopMode('upload')
      setSopText('') // Clear text if uploading file
      setError(null)
    }
  }

  const handleSopText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    
    // Set a reasonable character limit (e.g., 10,000 characters)
    if (value.length <= 10000) {
      setSopText(value)
      if (value.trim()) {
        setSopMode('text')
        setSopFile(null) // Clear file if typing text
      } else if (!value.trim()) {
        // If text is cleared, reset mode
        setSopMode(null)
      }
    } else {
      toast.error('SOP text must be under 10,000 characters')
    }
  }

  const clearSop = () => {
    setSopFile(null)
    setSopText('')
    setSopMode(null)
  }

  const handleDomainKnowledgeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setDomainKnowledgeFile(file)
      setDomainKnowledgeMode('upload')
      setDomainKnowledgeText('') // Clear text if uploading file
      setError(null)
    }
  }

  const handleDomainKnowledgeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    
    // Set a reasonable character limit (e.g., 10,000 characters)
    if (value.length <= 10000) {
      setDomainKnowledgeText(value)
      if (value.trim()) {
        setDomainKnowledgeMode('text')
        setDomainKnowledgeFile(null) // Clear file if typing text
      } else if (!value.trim()) {
        // If text is cleared, reset mode
        setDomainKnowledgeMode(null)
      }
    } else {
      toast.error('Domain knowledge text must be under 10,000 characters')
    }
  }

  const clearDomainKnowledge = () => {
    setDomainKnowledgeFile(null)
    setDomainKnowledgeText('')
    setDomainKnowledgeMode(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!userId) {
      toast.error('Please sign in to submit files')
      return
    }

    if (hasSubmitted) {
      toast.error('You have already submitted your assessment files')
      return
    }

    if (!resumeFile || !jobDescriptionFile) {
      toast.error('Please upload both resume and job description files')
      return
    }

    if (!validateFile(resumeFile) || !validateFile(jobDescriptionFile)) {
      return
    }

    // Validate SOP file if one is uploaded
    if (sopFile && !validateFile(sopFile)) {
      return
    }

    // Validate Domain Knowledge file if one is uploaded
    if (domainKnowledgeFile && !validateFile(domainKnowledgeFile)) {
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('job_description', jobDescriptionFile)
      formData.append('userId', userId)

      // Add SOP data if provided
      if (sopMode === 'upload' && sopFile) {
        formData.append('sop', sopFile)
        formData.append('sop_type', 'file')
      } else if (sopMode === 'text' && sopText.trim()) {
        formData.append('sop_text', sopText)
        formData.append('sop_type', 'text')
      }

      // Add Domain Knowledge data if provided
      if (domainKnowledgeMode === 'upload' && domainKnowledgeFile) {
        formData.append('domain_knowledge', domainKnowledgeFile)
        formData.append('domain_knowledge_type', 'file')
      } else if (domainKnowledgeMode === 'text' && domainKnowledgeText.trim()) {
        formData.append('domain_knowledge_text', domainKnowledgeText)
        formData.append('domain_knowledge_type', 'text')
      }

      // Use the backend URL from environment or default to localhost
      const response = await fetch(`${BACKEND_URL}/api/assessments/upload-technical-assessment/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${(await createClient().auth.getSession()).data.session?.access_token}`,
        },
      })

      const responseData = await response.text()
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} - ${responseData}`)
      }

      let result
      try {
        result = JSON.parse(responseData)
      } catch (parseError) {
        console.error('Failed to parse JSON response:', responseData)
        throw new Error('Invalid response format from server')
      }

      if (!result.success) {
        throw new Error(result.message || 'Upload failed')
      }

      setAssessmentId(result.assessment_id)
      setHasSubmitted(true)
      setCurrentStep(2)
      toast.success('Documents uploaded successfully! Please complete the skill assessment.')

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleViewResults = async () => {
    if (!assessmentId) {
      toast.error('No assessment ID found')
      return
    }

    setIsCreatingBaseline(true)
    try {
      // Create baseline first
      const baselineResponse = await fetch('/api/gap-analysis/check-baseline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sctInitialId: assessmentId }),
      })

      if (!baselineResponse.ok) {
        throw new Error('Failed to create baseline')
      }

      const baselineData = await baselineResponse.json()
      
      if (baselineData.baselineId) {
        router.push(`/skill-gap-analysis/${baselineData.baselineId}`)
      } else {
        throw new Error('No baseline ID returned')
      }
    } catch (error) {
      console.error('Error creating baseline:', error)
      toast.error('Failed to generate analysis results')
    } finally {
      setIsCreatingBaseline(false)
    }
  }

  const StepHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8">
        <div className="flex items-center space-x-4">
          <div className={utils.cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-sm backdrop-blur-xl",
            currentStep === 1 
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" 
              : currentStep > 1 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "bg-white/10 text-gray-400"
          )}>
            {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
          </div>
          <span className={utils.cn(
            "font-medium",
            currentStep === 1 ? tw.text.primary : currentStep > 1 ? tw.text.emerald : tw.text.tertiary
          )}>
            Upload Documents
          </span>
        </div>
        
        <div className={utils.cn(
          "w-16 h-0.5 rounded-full",
          currentStep >= 2 ? "bg-emerald-500" : "bg-white/20"
        )} />
        
        <div className="flex items-center space-x-4">
          <div className={utils.cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-sm backdrop-blur-xl",
            currentStep === 2 
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" 
              : "bg-white/10 text-gray-400"
          )}>
            2
          </div>
          <span className={utils.cn(
            "font-medium",
            currentStep === 2 ? tw.text.primary : tw.text.tertiary
          )}>
            Skill Assessment
          </span>
        </div>
      </div>

      {/* Step Title and Description */}
      <div className="text-center space-y-4">
        <motion.h1 
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={utils.cn(
            'text-4xl sm:text-5xl font-light tracking-tight mb-4',
            tw.text.primary
          )}
        >
          {currentStep === 1 ? 'Upload Your Documents' : 'Complete Your Assessment'}
        </motion.h1>
        <motion.p 
          key={`desc-${currentStep}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={utils.cn(
            'text-lg font-light leading-relaxed max-w-2xl mx-auto',
            tw.text.secondary
          )}
        >
          {currentStep === 1 
            ? 'Upload your resume and job description to begin the AI-powered skill analysis process'
            : 'Answer the generated questions to complete your technical competency evaluation'
          }
        </motion.p>
      </div>
    </motion.div>
  )

  if (currentStep === 2) {
    return (
      <div className={utils.cn("min-h-screen", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-6xl mx-auto mb-8 sm:mb-12">
            <StepHeader />
          </div>
          <div className="mt-8 sm:mt-12">
            <SkillCompetencyTest onCompleted={() => setSkillAssessmentCompleted(true)} />
            {skillAssessmentCompleted && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex justify-center"
              >
                <button
                  onClick={handleViewResults}
                  disabled={isCreatingBaseline}
                  className={utils.cn(
                    "px-8 py-4 bg-blue-500 text-white rounded-2xl font-medium transition-all",
                    "hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-3 text-base"
                  )}
                >
                  {isCreatingBaseline ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Results...
                    </>
                  ) : (
                    <>
                      <ChartBar className="w-5 h-5" />
                      View Analysis Results
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={utils.cn("min-h-screen", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <StepHeader />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-12 space-y-8"
        >
          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-3xl backdrop-blur-xl"
            style={{
              background: 'rgba(10, 10, 12, 0.7)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className={utils.cn(tw.text.primary, "text-xl font-medium mb-3")}>
                  How it works
                </h3>
                <p className={utils.cn(tw.text.secondary, "text-base leading-relaxed")}>
                  Upload your resume and the job description PDF files. Our AI system will analyze both documents to identify 
                  skill gaps and provide targeted assessments. This process helps evaluate your technical competencies
                  against the job requirements.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl"
              style={{ background: 'rgba(239, 68, 68, 0.08)' }}
            >
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className={utils.cn(tw.text.rose, "leading-relaxed")}>
                  {error}
                </p>
              </div>
            </motion.div>
          )}

          {/* Upload Form */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit} 
            className="space-y-8"
          >
            {/* Resume Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <label className={utils.cn(tw.text.primary, "text-lg font-medium")}>
                  Resume
                </label>
              </div>
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className={utils.cn(
                    "cursor-pointer flex items-center p-6 rounded-2xl transition-all",
                    "hover:scale-[1.02] hover:shadow-lg",
                    resumeFile ? "bg-emerald-500/10" : "bg-white/5 hover:bg-white/10"
                  )}
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  <div className={utils.cn(
                    "p-3 rounded-xl flex-shrink-0",
                    resumeFile ? "bg-emerald-500/20" : "bg-blue-500/20"
                  )}>
                    <FileText className={utils.cn(
                      "w-6 h-6",
                      resumeFile ? "text-emerald-400" : "text-blue-400"
                    )} />
                  </div>
                  <div className="flex-1 ml-4 min-w-0">
                    <span className={utils.cn(
                      tw.text.primary, 
                      "text-base font-medium truncate block"
                    )}>
                      {resumeFile ? resumeFile.name : 'Choose your resume file'}
                    </span>
                    <p className={utils.cn(tw.text.secondary, "text-sm mt-1")}>
                      PDF format only, max 10MB
                    </p>
                  </div>
                  <div className={utils.cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    resumeFile ? "bg-emerald-500/20" : "bg-blue-500/20"
                  )}>
                    {resumeFile ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Upload className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Job Description Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <label className={utils.cn(tw.text.primary, "text-lg font-medium")}>
                  Job Description
                </label>
              </div>
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleJobDescriptionUpload}
                  className="hidden"
                  id="job-description-upload"
                />
                <label
                  htmlFor="job-description-upload"
                  className={utils.cn(
                    "cursor-pointer flex items-center p-6 rounded-2xl transition-all",
                    "hover:scale-[1.02] hover:shadow-lg",
                    jobDescriptionFile ? "bg-emerald-500/10" : "bg-white/5 hover:bg-white/10"
                  )}
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  <div className={utils.cn(
                    "p-3 rounded-xl flex-shrink-0",
                    jobDescriptionFile ? "bg-emerald-500/20" : "bg-blue-500/20"
                  )}>
                    <FileText className={utils.cn(
                      "w-6 h-6",
                      jobDescriptionFile ? "text-emerald-400" : "text-blue-400"
                    )} />
                  </div>
                  <div className="flex-1 ml-4 min-w-0">
                    <span className={utils.cn(
                      tw.text.primary, 
                      "text-base font-medium truncate block"
                    )}>
                      {jobDescriptionFile ? jobDescriptionFile.name : 'Choose the job description file'}
                    </span>
                    <p className={utils.cn(tw.text.secondary, "text-sm mt-1")}>
                      PDF format only, max 10MB
                    </p>
                  </div>
                  <div className={utils.cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    jobDescriptionFile ? "bg-emerald-500/20" : "bg-blue-500/20"
                  )}>
                    {jobDescriptionFile ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Upload className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* SOP Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <label className={utils.cn(tw.text.primary, "text-lg font-medium")}>
                  Standard Operating Procedures (SOP)
                </label>
                <span className={utils.cn(
                  "px-3 py-1 text-xs font-medium rounded-full",
                  "bg-amber-500/20 text-amber-400"
                )}>
                  Optional
                </span>
              </div>
              
              {/* SOP Mode Selection */}
              {!sopMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSopMode('upload')}
                    className={utils.cn(
                      "p-6 rounded-2xl text-left transition-all",
                      "bg-white/5 hover:bg-white/10 hover:scale-[1.02]"
                    )}
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <Upload className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className={utils.cn(tw.text.primary, "font-medium mb-1")}>
                          Upload PDF
                        </h3>
                        <p className={utils.cn(tw.text.secondary, "text-sm")}>
                          Upload SOP as PDF file
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setSopMode('text')}
                    className={utils.cn(
                      "p-6 rounded-2xl text-left transition-all",
                      "bg-white/5 hover:bg-white/10 hover:scale-[1.02]"
                    )}
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <Type className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className={utils.cn(tw.text.primary, "font-medium mb-1")}>
                          Type Text
                        </h3>
                        <p className={utils.cn(tw.text.secondary, "text-sm")}>
                          Enter SOP as text
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* SOP Upload Mode */}
              {sopMode === 'upload' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={utils.cn(tw.text.primary, "font-medium")}>
                      Upload SOP PDF
                    </span>
                    <button
                      type="button"
                      onClick={clearSop}
                      className={utils.cn(
                        "p-2 rounded-lg transition-colors",
                        "hover:bg-white/10",
                        tw.text.tertiary
                      )}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleSopUpload}
                      className="hidden"
                      id="sop-upload"
                    />
                    <label
                      htmlFor="sop-upload"
                      className={utils.cn(
                        "cursor-pointer flex items-center p-6 rounded-2xl transition-all",
                        "hover:scale-[1.02] hover:shadow-lg",
                        sopFile ? "bg-emerald-500/10" : "bg-white/5 hover:bg-white/10"
                      )}
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <div className={utils.cn(
                        "p-3 rounded-xl flex-shrink-0",
                        sopFile ? "bg-emerald-500/20" : "bg-blue-500/20"
                      )}>
                        <FileText className={utils.cn(
                          "w-6 h-6",
                          sopFile ? "text-emerald-400" : "text-blue-400"
                        )} />
                      </div>
                      <div className="flex-1 ml-4 min-w-0">
                        <span className={utils.cn(
                          tw.text.primary, 
                          "text-base font-medium truncate block"
                        )}>
                          {sopFile ? sopFile.name : 'Choose SOP PDF file'}
                        </span>
                        <p className={utils.cn(tw.text.secondary, "text-sm mt-1")}>
                          PDF format only, max 10MB
                        </p>
                      </div>
                      <div className={utils.cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        sopFile ? "bg-emerald-500/20" : "bg-blue-500/20"
                      )}>
                        {sopFile ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Upload className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* SOP Text Mode */}
              {sopMode === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={utils.cn(tw.text.primary, "font-medium")}>
                      Enter SOP Text
                    </span>
                    <button
                      type="button"
                      onClick={clearSop}
                      className={utils.cn(
                        "p-2 rounded-lg transition-colors",
                        "hover:bg-white/10",
                        tw.text.tertiary
                      )}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative p-6 rounded-2xl bg-white/5"
                       style={{ backdropFilter: 'blur(10px)' }}>
                    <textarea
                      value={sopText}
                      onChange={handleSopText}
                      rows={12}
                      className={utils.cn(
                        "w-full bg-transparent border-0 resize-y focus:outline-none min-h-[200px] max-h-[400px]",
                        tw.text.primary,
                        "placeholder:text-gray-500"
                      )}
                      placeholder="Enter your Standard Operating Procedures here..."
                    />
                    {sopText.trim() && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={utils.cn(tw.text.secondary, "text-sm")}>
                      {sopText.length} / 10,000 characters
                    </p>
                    {sopText.length > 8000 && (
                      <p className={utils.cn(tw.text.amber, "text-sm")}>
                        {10000 - sopText.length} characters remaining
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Domain Knowledge Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-blue-400" />
                <label className={utils.cn(tw.text.primary, "text-lg font-medium")}>
                  Domain Knowledge
                </label>
                <span className={utils.cn(
                  "px-3 py-1 text-xs font-medium rounded-full",
                  "bg-amber-500/20 text-amber-400"
                )}>
                  Optional
                </span>
              </div>
              
              <p className={utils.cn(tw.text.secondary, "text-sm leading-relaxed")}>
                Share any domain-specific knowledge or technical documentation that's relevant to your role. This helps create more targeted assessments.
              </p>

              {!domainKnowledgeMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDomainKnowledgeMode('upload')}
                    className={utils.cn(
                      "p-6 rounded-2xl text-left transition-all",
                      "bg-white/5 hover:bg-white/10 hover:scale-[1.02]"
                    )}
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <Upload className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className={utils.cn(tw.text.primary, "font-medium mb-1")}>
                          Upload PDF
                        </h3>
                        <p className={utils.cn(tw.text.secondary, "text-sm")}>
                          Upload domain documentation
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setDomainKnowledgeMode('text')}
                    className={utils.cn(
                      "p-6 rounded-2xl text-left transition-all",
                      "bg-white/5 hover:bg-white/10 hover:scale-[1.02]"
                    )}
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <Type className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className={utils.cn(tw.text.primary, "font-medium mb-1")}>
                          Type Text
                        </h3>
                        <p className={utils.cn(tw.text.secondary, "text-sm")}>
                          Enter domain knowledge
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Domain Knowledge Upload Mode */}
              {domainKnowledgeMode === 'upload' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={utils.cn(tw.text.primary, "font-medium")}>
                      Upload Domain Knowledge PDF
                    </span>
                    <button
                      type="button"
                      onClick={clearDomainKnowledge}
                      className={utils.cn(
                        "p-2 rounded-lg transition-colors",
                        "hover:bg-white/10",
                        tw.text.tertiary
                      )}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleDomainKnowledgeUpload}
                      className="hidden"
                      id="domain-knowledge-upload"
                    />
                    <label
                      htmlFor="domain-knowledge-upload"
                      className={utils.cn(
                        "cursor-pointer flex items-center p-6 rounded-2xl transition-all",
                        "hover:scale-[1.02] hover:shadow-lg",
                        domainKnowledgeFile ? "bg-emerald-500/10" : "bg-white/5 hover:bg-white/10"
                      )}
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <div className={utils.cn(
                        "p-3 rounded-xl flex-shrink-0",
                        domainKnowledgeFile ? "bg-emerald-500/20" : "bg-blue-500/20"
                      )}>
                        <Brain className={utils.cn(
                          "w-6 h-6",
                          domainKnowledgeFile ? "text-emerald-400" : "text-blue-400"
                        )} />
                      </div>
                      <div className="flex-1 ml-4 min-w-0">
                        <span className={utils.cn(
                          tw.text.primary, 
                          "text-base font-medium truncate block"
                        )}>
                          {domainKnowledgeFile ? domainKnowledgeFile.name : 'Choose domain knowledge PDF'}
                        </span>
                        <p className={utils.cn(tw.text.secondary, "text-sm mt-1")}>
                          PDF format only, max 10MB
                        </p>
                      </div>
                      <div className={utils.cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        domainKnowledgeFile ? "bg-emerald-500/20" : "bg-blue-500/20"
                      )}>
                        {domainKnowledgeFile ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Upload className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Domain Knowledge Text Mode */}
              {domainKnowledgeMode === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={utils.cn(tw.text.primary, "font-medium")}>
                      Enter Domain Knowledge
                    </span>
                    <button
                      type="button"
                      onClick={clearDomainKnowledge}
                      className={utils.cn(
                        "p-2 rounded-lg transition-colors",
                        "hover:bg-white/10",
                        tw.text.tertiary
                      )}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative p-6 rounded-2xl bg-white/5"
                       style={{ backdropFilter: 'blur(10px)' }}>
                    <textarea
                      value={domainKnowledgeText}
                      onChange={handleDomainKnowledgeText}
                      rows={12}
                      className={utils.cn(
                        "w-full bg-transparent border-0 resize-y focus:outline-none min-h-[200px] max-h-[400px]",
                        tw.text.primary,
                        "placeholder:text-gray-500"
                      )}
                      placeholder="Enter your domain-specific knowledge here..."
                    />
                    {domainKnowledgeText.trim() && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={utils.cn(tw.text.secondary, "text-sm")}>
                      {domainKnowledgeText.length} / 10,000 characters
                    </p>
                    {domainKnowledgeText.length > 8000 && (
                      <p className={utils.cn(tw.text.amber, "text-sm")}>
                        {10000 - domainKnowledgeText.length} characters remaining
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-8"
            >
              <button
                type="submit"
                disabled={!resumeFile || !jobDescriptionFile || isUploading}
                className={utils.cn(
                  "w-full py-4 px-8 rounded-2xl font-medium text-base transition-all",
                  "bg-blue-500 text-white hover:bg-blue-600",
                  "hover:shadow-lg hover:shadow-blue-500/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-3"
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading Documents...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Documents
                  </>
                )}
              </button>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  )
} 