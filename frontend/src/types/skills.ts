export interface SkillLevel {
  name: string;
  competency: number;
  competency_level?: number;
  description?: string;
  id?: string;
  skill_type?: 'technical' | 'soft_skills' | 'domain_knowledge' | 'sop';
  knowledge_areas?: string[];
  business_impact?: string;
  procedural_requirements?: string[];
  compliance_requirements?: string[];
  quality_standards?: string[];
  assessment_details?: {
    root_problem?: string;
    question_text?: string;
    assessment_type?: string;
    evidence?: string;
    question_id?: string;
    mapping_method?: string;
    comprehensive_analysis?: boolean;
    individual_qa_assessment?: boolean;
  };
  dependencies?: {
    skillId: string;
    type: string;
    strength: number;
  }[];
}

export interface SkillCategory {
  name?: string;
  description?: string;
  skills?: SkillLevel[];
  competency?: number;
  competency_level?: number;
}

export interface SkillMatrix {
  [category: string]: SkillCategory | SkillLevel[];
}

export interface SkillGap {
  id: string;
  name: string;
  category: string;
  skill_type?: 'technical' | 'soft_skills' | 'domain_knowledge' | 'sop';
  competency: number;
  root_problem: string;
  question_text?: string;
  assessment_type?: string;
  evidence?: string;
  description?: string;
  knowledge_areas?: string[];
  business_impact?: string;
  procedural_requirements?: string[];
  compliance_requirements?: string[];
}

export interface GapSummary {
  total_gaps: number;
  priority_gaps: number;
  average_competency: number;
  technical_gaps: number;
  soft_skill_gaps: number;
  domain_knowledge_gaps: number;
  sop_gaps: number;
  // Additional properties used in dashboard
  total_skills?: number;
  technical_skills?: number;
  soft_skills?: number;
  domain_knowledge_skills?: number;
  skills_with_gaps?: number;
  last_gap_analysis?: string;
}

export interface GapAnalysisDashboard {
  technical_skill_gaps: SkillGap[];
  soft_skill_gaps: SkillGap[];
  domain_knowledge_gaps: SkillGap[];
  sop_skill_gaps: SkillGap[];
  generated_at: string;
  summary: {
    total_skills: number;
    technical_skills: number;
    soft_skills: number;
    domain_knowledge_skills: number;
    sop_skills: number;
    skills_with_gaps: number;
    average_competency: number;
  };
}

// View types for skill visualization
export type SkillViewType = 'tree' | 'force' | 'radial';

export interface UserSkillViewPreference {
  userId: string;
  viewType: SkillViewType;
  savedArrangements?: {
    id: string;
    name: string;
    positions: {
      nodeId: string;
      x: number;
      y: number;
    }[];
    createdAt: string;
  }[];
}

export function calculateGapSummaryFromDashboard(dashboard: GapAnalysisDashboard): GapSummary {
  const technicalGaps = dashboard.technical_skill_gaps || []
  const softGaps = dashboard.soft_skill_gaps || []
  const domainGaps = dashboard.domain_knowledge_gaps || []
  const sopGaps = dashboard.sop_skill_gaps || []
  
  const allGaps = [...technicalGaps, ...softGaps, ...domainGaps, ...sopGaps]
  
  const totalGaps = allGaps.length
  const averageCompetency = totalGaps > 0 
    ? Math.round(allGaps.reduce((sum, gap) => sum + gap.competency, 0) / totalGaps)
    : 0
  
  const priorityGaps = allGaps.filter(gap => gap.competency < 60).length
  
  return {
    total_gaps: totalGaps,
    priority_gaps: priorityGaps,
    average_competency: averageCompetency,
    technical_gaps: technicalGaps.length,
    soft_skill_gaps: softGaps.length,
    domain_knowledge_gaps: domainGaps.length,
    sop_gaps: sopGaps.length
  }
} 