import { useMemo, createElement } from 'react'
import { BarChart3, Users, BookOpen, FileText } from 'lucide-react'
import { GapAnalysisData, CategorySummary, Skill, SkillMatrix } from '../types'

export function useSkillCategories(gapData: GapAnalysisData | null) {
  const getSkillsFromCategory = (skillMatrix: SkillMatrix, categoryName: string): Skill[] => {
    if (!skillMatrix || !skillMatrix[categoryName]) return []
    
    const categoryData = skillMatrix[categoryName]
    
    if (Array.isArray(categoryData)) {
      return categoryData.filter(skill => skill && typeof skill === 'object')
    } else if (categoryData && typeof categoryData === 'object' && 'skills' in categoryData) {
      return categoryData.skills || []
    }
    
    return []
  }

  const categorySummaries = useMemo((): CategorySummary[] => {
    if (!gapData?.baseline_skill_matrix) return []

    const categories = [
      {
        name: 'technical',
        displayName: 'Technical Skills',
        icon: createElement(BarChart3, { className: "h-4 w-4 sm:h-5 sm:w-5" }),
        matcher: (catName: string) => 
          !['soft_skills', 'communication', 'leadership', 'teamwork', 'management', 'domain_knowledge', 'standard_operating_principles', 'standard_operating_procedures'].some(soft => catName.toLowerCase().includes(soft))
      },
      {
        name: 'soft_skills',
        displayName: 'Soft Skills',
        icon: createElement(Users, { className: "h-4 w-4 sm:h-5 sm:w-5" }),
        matcher: (catName: string) => 
          ['soft_skills', 'communication', 'leadership', 'teamwork', 'management'].some(soft => catName.toLowerCase().includes(soft))
      },
      {
        name: 'domain_knowledge',
        displayName: 'Domain Knowledge',
        icon: createElement(BookOpen, { className: "h-4 w-4 sm:h-5 sm:w-5" }),
        matcher: (catName: string) => 
          catName.toLowerCase().includes('domain_knowledge')
      },
      {
        name: 'standard_operating_principles',
        displayName: 'Standard Operating Principles',
        icon: createElement(FileText, { className: "h-4 w-4 sm:h-5 sm:w-5" }),
        matcher: (catName: string) => 
          catName.toLowerCase().includes('standard_operating_principles') || 
          catName.toLowerCase().includes('standard_operating_procedures') || 
          catName.toLowerCase().includes('sop')
      }
    ]

    return categories.map(category => {
      let totalSkills = 0
      let competencySum = 0
      let skillsWithGaps = 0

      Object.entries(gapData.baseline_skill_matrix).forEach(([catName, catData]) => {
        if (catName === 'sop_context' || catName === 'domain_knowledge_context') return
        
        if (category.matcher(catName)) {
          const skills = getSkillsFromCategory(gapData.baseline_skill_matrix, catName)
          skills.forEach(skill => {
            if (skill) {
              totalSkills++
              const competency = skill.competency || skill.competency_level || 0
              competencySum += competency
              if (competency < 70) {
                skillsWithGaps++
              }
            }
          })
        }
      })

      const averageCompetency = totalSkills > 0 ? Math.round(competencySum / totalSkills) : 0
      const gapPercentage = totalSkills > 0 ? Math.round((skillsWithGaps / totalSkills) * 100) : 0

      return {
        ...category,
        totalSkills,
        averageCompetency,
        skillsWithGaps,
        gapPercentage
      }
    })
  }, [gapData])

  const getSkillsByCategory = useMemo(() => {
    return (categoryName: string): Skill[] => {
      if (!gapData?.baseline_skill_matrix) return []

      const allSkills: Skill[] = []
      const categoryMatcher = categorySummaries.find(cat => cat.name === categoryName)?.matcher

      if (!categoryMatcher) return []

      Object.entries(gapData.baseline_skill_matrix).forEach(([catName, catData]) => {
        if (catName === 'sop_context' || catName === 'domain_knowledge_context') return
        
        if (categoryMatcher(catName)) {
          const skills = getSkillsFromCategory(gapData.baseline_skill_matrix, catName)
          allSkills.push(...skills)
        }
      })

      return allSkills.sort((a, b) => {
        const aComp = a.competency || a.competency_level || 0
        const bComp = b.competency || b.competency_level || 0
        return aComp - bComp // Sort by competency ascending (gaps first)
      })
    }
  }, [gapData, categorySummaries])

  return { categorySummaries, getSkillsByCategory }
} 