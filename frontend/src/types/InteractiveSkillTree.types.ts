import * as d3 from 'd3'

export interface SkillNode {
  id: string
  name: string
  category: string
  competency: number
  targetLevel: number
  dependencies: string[]
  dependencyStrengths?: Map<string, number>
  description?: string
  estimatedHours?: number
  resources?: string[]
  level: number
  children?: SkillNode[]
  x?: number
  y?: number
  fx?: number
  fy?: number
  textWidth?: number
  radius?: number
}

export interface LayoutOptions {
  orientation: 'horizontal' | 'vertical'
  viewMode: 'tree' | 'force'
  nodeSpacing: number
  levelSpacing: number
}

export interface FilterOptions {
  categories: string[]
  competencyRange: [number, number]
  showAchieved: boolean
  showInProgress: boolean
  showNeedsWork: boolean
  searchTerm: string
}

export interface InteractiveSkillTreeProps {
  skillMatrix: any | null // Using any to match the original import
}

export interface D3LayoutProps {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  nodes: SkillNode[]
  width: number
  height: number
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>
  isMobile: boolean
  layoutOptions: LayoutOptions
  showLabels: boolean
  setSelectedNode: (node: SkillNode | null) => void
  setHoveredNode: (node: SkillNode | null) => void
} 