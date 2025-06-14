import * as d3 from 'd3'
import { SkillNode } from '../types/InteractiveSkillTree.types'

// Helper functions
export const getNodeColor = (node: SkillNode): string => {
  const percentage = node.competency / node.targetLevel
  if (percentage >= 1) return '#10b981' // Green
  if (percentage < 0.5) return '#ef4444' // Red
  return '#3b82f6' // Blue
}

export const getNodeStrokeColor = (node: SkillNode, selectedNode: SkillNode | null, hoveredNode: SkillNode | null): string => {
  if (selectedNode?.id === node.id) return '#fbbf24' // Yellow for selected
  if (hoveredNode?.id === node.id) return '#60a5fa' // Light blue for hovered
  if (node.targetLevel - node.competency > 30) return '#ef4444' // Red for large gap
  return '#1e293b' // Default dark
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 2) + '...'
}

export const showTooltip = (
  event: MouseEvent,
  node: SkillNode,
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>
) => {
  const gap = node.targetLevel - node.competency
  const percentage = Math.round((node.competency / node.targetLevel) * 100)
  
  tooltip
    .style('visibility', 'visible')
    .style('opacity', '1')
    .html(`
      <div class="space-y-2">
        <div>
          <div class="font-semibold text-white">${node.name}</div>
          <div class="text-xs text-gray-400">${node.category.replace(/_/g, ' ')}</div>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-300"
              style="width: ${node.competency}%; background-color: ${getNodeColor(node)}"
            ></div>
          </div>
          <span class="text-xs font-mono text-white">${node.competency}%</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-gray-400">Target:</span>
            <span class="text-white ml-1">${node.targetLevel}%</span>
          </div>
          ${gap > 0 ? `
            <div>
              <span class="text-gray-400">Gap:</span>
              <span class="text-rose-400 ml-1">${gap}%</span>
            </div>
          ` : `
            <div>
              <span class="text-gray-400">Progress:</span>
              <span class="text-emerald-400 ml-1">${percentage}%</span>
            </div>
          `}
        </div>
        ${node.dependencies.length > 0 ? `
          <div class="text-xs">
            <span class="text-gray-400">Prerequisites:</span>
            <span class="text-blue-400 ml-1">${node.dependencies.length}</span>
          </div>
        ` : ''}
      </div>
    `)
    .style('left', `${event.pageX + 10}px`)
    .style('top', `${event.pageY - 10}px`)
}

export const hideTooltip = (tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>) => {
  tooltip
    .style('visibility', 'hidden')
    .style('opacity', '0')
} 