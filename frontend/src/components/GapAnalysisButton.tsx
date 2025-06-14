'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/utils/supabase/client'
import { BarChart3 } from 'lucide-react'

interface GapAnalysisButtonProps {
  sctInitialId: string
}

export function GapAnalysisButton({ sctInitialId }: GapAnalysisButtonProps) {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [baselineId, setBaselineId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [progressPercentage, setProgressPercentage] = useState(0)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()
  
  // Get the user's session token when the component mounts
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await createClient().auth.getSession()
        if (data.session?.access_token) {
          setAuthToken(data.session.access_token)
        } else {
          console.warn('No active Supabase session found')
        }
      } catch (err) {
        console.error('Error getting authentication session:', err)
      }
    }
    
    getSession()
  }, [])
  
  // Cleanup polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])
  
  // Effect to handle status changes and auto-redirect when complete
  useEffect(() => {
    if (status === 'completed' && baselineId) {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
      // Set a slight delay before redirecting to ensure data is fully processed
      setTimeout(() => {
        router.push(`/skill-gap-analysis/${baselineId}`)
      }, 1000)
    }
  }, [status, baselineId, router, pollingInterval])
  
  // Check if baseline already exists
  useEffect(() => {
    const checkForBaseline = async () => {
      if (!authToken || !sctInitialId) return
      
      try {
        const response = await fetch('/api/gap-analysis/check-baseline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ sctInitialId })
        })
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.exists) {
            setBaselineId(data.baselineId)
            setStatus(data.status)
            
            // If analysis is already completed or in progress, start polling
            if (data.status === 'in_progress') {
              setAnalyzing(true)
              startPollingStatus(data.baselineId)
            } else if (data.status === 'completed') {
              setAnalyzing(false)
              setLoading(false)
            }
          }
        }
      } catch (error) {
        console.error('Error checking baseline status:', error)
      }
    }
    
    if (authToken && sctInitialId) {
      checkForBaseline()
    }
  }, [authToken, sctInitialId])
  
  // Poll the status of the gap analysis
  const startPollingStatus = (baselineId: string) => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    
    // Set initial progress 
    setProgressPercentage(10)
    
    // Create a new polling interval
    const intervalId = setInterval(async () => {
      if (!authToken) return
      
      try {
        const response = await fetch(`/api/gap-analysis/status?baseline_id=${baselineId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setStatus(data.status)
          
          // Update progress percentage based on status
          if (data.status === 'in_progress') {
            // Increment progress by 5% each time, max 90%
            setProgressPercentage(prev => Math.min(prev + 5, 90))
          } else if (data.status === 'completed') {
            setProgressPercentage(100)
            setAnalyzing(false)
            // Clear the interval
            clearInterval(intervalId)
            setPollingInterval(null)
            
            // Redirect to results page
            router.push(`/skill-gap-analysis/${baselineId}`)
          } else if (data.status === 'failed') {
            setProgressPercentage(0)
            setAnalyzing(false)
            // Clear the interval
            clearInterval(intervalId)
            setPollingInterval(null)
            toast.error('Gap analysis failed. Please try again.')
          }
        }
      } catch (error) {
        console.error('Error polling gap analysis status:', error)
      }
    }, 3000) // Poll every 3 seconds
    
    setPollingInterval(intervalId)
  }
  
  const handleStartGapAnalysis = async () => {
    if (!authToken || !sctInitialId) {
      toast.error('Authentication required')
      return
    }
    
    try {
      setLoading(true)
      
      const response = await fetch('/api/gap-analysis/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          sctInitialId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.baselineId) {
        setBaselineId(data.baselineId)
        setStatus('in_progress')
        setAnalyzing(true)
        toast.success('Skill gap analysis started!')
        
        // Start polling for status updates
        startPollingStatus(data.baselineId)
      } else {
        toast.error('Failed to start gap analysis')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error starting gap analysis:', error)
      toast.error('Failed to start gap analysis')
      setLoading(false)
    }
  }
  
  // If analysis is already completed, show a button to view results
  if (status === 'completed' && baselineId) {
    return (
      <button
        onClick={() => router.push(`/skill-gap-analysis/${baselineId}`)}
        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 
        hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 
        shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 transform hover:-translate-y-1"
      >
        <BarChart3 className="w-5 h-5" />
        <span>View Skill Gap Analysis</span>
      </button>
    )
  }
  
  // If analysis is in progress, show a progress bar
  if (analyzing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-400">Analyzing skills...</p>
          <p className="text-xs text-gray-400">{progressPercentage}%</p>
        </div>
        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">This may take a minute or two to complete</p>
      </div>
    )
  }
  
  // Regular button to start analysis
  return (
    <button
      onClick={handleStartGapAnalysis}
      disabled={loading}
      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
      hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 
      shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transform hover:-translate-y-1 disabled:opacity-70 disabled:transform-none disabled:shadow-none"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <BarChart3 className="w-5 h-5" />
          <span>Analyze Skill Gaps</span>
        </>
      )}
    </button>
  )
} 