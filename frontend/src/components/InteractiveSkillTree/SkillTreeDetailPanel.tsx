'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { SkillNode } from '../../types/InteractiveSkillTree.types'
import { getNodeColor } from '../../utils/skillTreeHelpers'
import { tw, components, fonts, utils } from '@/config/design-system'

interface SkillTreeDetailPanelProps {
  selectedNode: SkillNode | null
  setSelectedNode: (node: SkillNode | null) => void
  skillNodes: SkillNode[]
}

export default function SkillTreeDetailPanel({
  selectedNode,
  setSelectedNode,
  skillNodes
}: SkillTreeDetailPanelProps) {
  return (
    <AnimatePresence mode="wait">
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className={utils.cn("w-full lg:w-96 rounded-xl border overflow-hidden", tw.bg.card, tw.border.primary)}
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={tw.typography.cardHeading}>{selectedNode.name}</h4>
                <p className={utils.cn(tw.typography.smallLabel, "mt-1")}>
                  {selectedNode.category.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className={utils.cn("p-1 rounded-lg transition-colors", tw.hover.subtle)}
              >
                <svg className={utils.cn("w-4 h-4", tw.text.tertiary)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Competency Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={tw.typography.smallLabel}>Competency Level</span>
                <span className={utils.cn(tw.text.primary, "text-xs")} style={{ fontFamily: fonts.mono }}>{selectedNode.competency}%</span>
                </div>
              <div className={utils.cn("h-2 rounded-full overflow-hidden", tw.bg.nested)}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedNode.competency}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: getNodeColor(selectedNode) }}
                />
              </div>
              {selectedNode.competency < selectedNode.targetLevel && (
                <div className="flex items-center justify-between mt-2">
                  <span className={tw.typography.smallLabel}>Target</span>
                  <span className={utils.cn(tw.text.blue, "text-xs")}>{selectedNode.targetLevel}%</span>
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className={utils.cn("p-3 rounded-lg border", tw.bg.nested, tw.border.primary)}>
                <p className={utils.cn(tw.typography.smallLabel, "mb-1")}>Gap to Target</p>
                <p className={utils.cn(tw.text.primary, "text-lg font-semibold")}>
                  {Math.max(0, selectedNode.targetLevel - selectedNode.competency)}%
                </p>
              </div>
              <div className={utils.cn("p-3 rounded-lg border", tw.bg.nested, tw.border.primary)}>
                <p className={utils.cn(tw.typography.smallLabel, "mb-1")}>Est. Hours</p>
                <p className={utils.cn(tw.text.primary, "text-lg font-semibold")}>
                  {selectedNode.estimatedHours || 0}h
                </p>
              </div>
            </div>
            
            {/* Dependencies */}
            {selectedNode.dependencies.length > 0 && (
              <div>
                <p className={utils.cn(tw.typography.smallLabel, "mb-2")}>Prerequisites</p>
                <div className="space-y-2 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb]:bg-gray-500 hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                  {selectedNode.dependencies.map(depId => {
                    const dep = skillNodes.find(n => n.id === depId)
                    if (!dep) return null
                    
                    const strength = selectedNode.dependencyStrengths?.get(depId) || 0.5
                    
                    return (
                      <div 
                        key={depId}
                        className={utils.cn(
                          "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all duration-200",
                          tw.bg.nested,
                          tw.border.primary,
                          tw.hover.blue
                        )}
                        onClick={() => setSelectedNode(dep)}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: getNodeColor(dep) }} />
                        <div className="flex-1 min-w-0">
                          <p className={utils.cn(tw.text.secondary, "text-sm truncate")}>{dep.name}</p>
                          <p className={utils.cn(tw.typography.smallLabel)}>{dep.competency}% / {dep.targetLevel}%</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={utils.cn("w-8 h-0.5 rounded-full overflow-hidden", tw.bg.nested)}>
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${strength * 100}%` }}
                            />
                          </div>
                          <span className={utils.cn(tw.typography.smallLabel)}>{Math.round(strength * 100)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Related Skills */}
            <div>
              <p className={utils.cn(tw.typography.smallLabel, "mb-2")}>Related Skills</p>
              <div className="space-y-2 max-h-32 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb]:bg-gray-500 hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                {skillNodes
                  .filter(n => 
                    n.category === selectedNode.category && 
                    n.id !== selectedNode.id &&
                    !selectedNode.dependencies.includes(n.id)
                  )
                  .slice(0, 3)
                  .map(rel => (
                    <div 
                      key={rel.id}
                      className={utils.cn(
                        "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all duration-200",
                        tw.bg.nested,
                        tw.border.primary,
                        tw.hover.blue
                      )}
                      onClick={() => setSelectedNode(rel)}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: getNodeColor(rel) }} />
                      <div className="flex-1 min-w-0">
                        <p className={utils.cn(tw.text.secondary, "text-sm truncate")}>{rel.name}</p>
                        <p className={utils.cn(tw.typography.smallLabel)}>{rel.competency}% / {rel.targetLevel}%</p>
                    </div>
            </div>
                  ))}
            </div>
          </div>
            
            {/* Description */}
            {selectedNode.description && (
              <div>
                <p className={utils.cn(tw.typography.smallLabel, "mb-2")}>Description</p>
                <p className={utils.cn(tw.text.secondary, "text-sm leading-relaxed")}>{selectedNode.description}</p>
        </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Empty state for detail panel */}
      {!selectedNode && (
        <div className={utils.cn("hidden lg:flex w-96 rounded-xl border items-center justify-center", tw.bg.card, tw.border.primary)}>
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <div className={utils.cn(components.iconContainer.blue, "h-12 w-12")}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
            <div>
              <p className={utils.cn(tw.text.secondary, "text-sm mb-1")}>Select a skill to view details</p>
              <p className={utils.cn(tw.typography.smallLabel)}>Click on any node to explore its properties and relationships</p>
        </div>
    </div>
        </div>
      )}
    </AnimatePresence>
  )
}