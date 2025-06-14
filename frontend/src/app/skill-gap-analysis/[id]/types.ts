export interface Skill {
  id: string
  name: string
  competency: number
  competency_level?: number
  description?: string
  assessment_details?: {
    root_problem?: string
    evidence?: string
    question_text?: string
  }
}

export interface SkillMatrix {
  [category: string]: {
    skills: Skill[]
  } | Skill[]
}

export interface CategorySummary {
  name: string
  displayName: string
  icon: React.ReactNode
  totalSkills: number
  averageCompetency: number
  skillsWithGaps: number
  gapPercentage: number
  matcher: (catName: string) => boolean
}

export interface GapAnalysisData {
  id: string
  status: string
  baseline_skill_matrix: SkillMatrix
  gap_analysis_dashboard?: {
    summary: {
      total_skills: number
      technical_skills: number
      soft_skills: number
      domain_knowledge_skills: number
      average_competency: number
    }
  }
}

export type CompetencyColorScheme = 'emerald' | 'amber' | 'rose' 