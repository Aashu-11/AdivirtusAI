import { CategorySummary } from '../types'

export interface RadarSkillData {
  subject: string
  value: number
  previousValue: number
  idealLevel: number
  topLevel: number
  fullMark: number
  icon: string
  growth: string
  nextMilestone: number
  description: string
  recommendations: string[]
  learningVelocity: string
  proficiencyLevel: string
  criticalGaps: string[]
  timeToNextLevel: string
  focusAreas: string[]
}

export const transformSkillDataForRadar = (categorySummaries: CategorySummary[]): RadarSkillData[] => {
  return categorySummaries.map(category => {
    // Calculate derived metrics
    const growth = category.averageCompetency > 0 ? Math.min(15, Math.round(category.averageCompetency * 0.15)) : 5
    const previousValue = Math.max(0, category.averageCompetency - growth)
    
    // Ideal level - using 70% as the expected competency level for most skills
    // This would typically come from the ideal skill matrix
    const idealLevel = 70
    
    // Top level should be 20% more than ideal but cannot exceed 100
    const topLevel = Math.min(100, idealLevel + 20)
    
    // Time calculation based on gaps
    const timeToNext = category.gapPercentage > 30 ? '6 months' :
                      category.gapPercentage > 15 ? '4 months' :
                      category.gapPercentage > 5 ? '3 months' : '2 months'
    
    // Critical gaps based on gap percentage
    const criticalGaps = category.gapPercentage > 20 
      ? ['Advanced Techniques', 'Industry Standards']
      : category.gapPercentage > 10
      ? ['Best Practices']
      : []

    return {
      subject: category.displayName,
      value: category.averageCompetency,
      previousValue,
      idealLevel,
      topLevel,
      fullMark: 100,
      icon: category.name,
      growth: `+${growth}%`,
      nextMilestone: Math.min(100, category.averageCompetency + 10),
      description: `Proficient in ${category.displayName.toLowerCase()} with ${category.totalSkills} skills assessed`,
      recommendations: [
        `Focus on ${category.displayName.toLowerCase()} development`,
        'Practice advanced techniques',
        'Seek mentorship opportunities'
      ],
      learningVelocity: growth > 10 ? 'High' : growth > 7 ? 'Medium' : 'Low',
      proficiencyLevel: category.averageCompetency > 80 ? 'Advanced' : 
                       category.averageCompetency > 60 ? 'Intermediate' : 'Beginner',
      criticalGaps,
      timeToNextLevel: timeToNext,
      focusAreas: [
        `${category.displayName} Fundamentals`,
        'Advanced Applications',
        'Industry Best Practices'
      ]
    }
  })
}

export const CHART_COLORS = {
  all: {
    stroke: '#2C7EFF',
    gradient: [
      { offset: '0%', color: '#2C7EFF', opacity: 0.9 },
      { offset: '50%', color: '#2563eb', opacity: 0.7 },
      { offset: '100%', color: '#1d4ed8', opacity: 0.5 }
    ]
  },
  current: {
    stroke: '#2C7EFF',
    gradient: [
      { offset: '0%', color: '#2C7EFF', opacity: 0.9 },
      { offset: '50%', color: '#2563eb', opacity: 0.7 },
      { offset: '100%', color: '#1d4ed8', opacity: 0.5 }
    ]
  },
  ideal: {
    stroke: '#10B981',
    fill: '#10B981',
    opacity: 0.25
  },
  top: {
    stroke: '#ef4444',
    fill: '#ef4444',
    opacity: 0.2
  }
}

export const VIEW_OPTIONS = [
  { id: 'all', label: 'All', color: '#2C7EFF' },
  { id: 'current', label: 'Current', color: '#2C7EFF' },
  { id: 'ideal', label: 'Ideal', color: '#10B981' },
  { id: 'top', label: 'Top', color: '#ef4444' }
] as const

export type ViewMode = typeof VIEW_OPTIONS[number]['id'] 