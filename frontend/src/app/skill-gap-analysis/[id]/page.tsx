'use client'

import { use } from 'react'
import { SkillGapAnalysisView } from './SkillGapAnalysisView'

export default function SkillGapAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  return <SkillGapAnalysisView baselineId={id} />
}
