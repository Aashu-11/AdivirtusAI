import { useState, useEffect } from 'react'
import { GapAnalysisData } from '../types'

export function useSkillGapData(baselineId: string) {
  const [gapData, setGapData] = useState<GapAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGapAnalysis = async () => {
      if (!baselineId) return

      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/gap-analysis/${baselineId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch gap analysis: ${response.statusText}`)
        }
        
        const data = await response.json()
        setGapData(data)
      } catch (err) {
        console.error('Error fetching gap analysis:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchGapAnalysis()
  }, [baselineId])

  return { gapData, loading, error }
} 