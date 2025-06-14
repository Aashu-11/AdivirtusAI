'use client'

import { Search, Filter, ZoomIn, ZoomOut, RotateCcw, Grid, List, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react'
import { LayoutOptions } from '../../types/InteractiveSkillTree.types'
import { tw, components, fonts, utils } from '@/config/design-system'

interface SkillTreeControlsProps {
  filteredNodesLength: number
  skillNodesLength: number
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  showLabels: boolean
  setShowLabels: (show: boolean) => void
  layoutOptions: LayoutOptions
  setLayoutOptions: (options: LayoutOptions | ((prev: LayoutOptions) => LayoutOptions)) => void
  zoomLevel: number
  handleZoom: (delta: number) => void
  resetView: () => void
  isFullscreen: boolean
  toggleFullscreen: () => void
}

export default function SkillTreeControls({
  filteredNodesLength,
  skillNodesLength,
  showFilters,
  setShowFilters,
  showLabels,
  setShowLabels,
  layoutOptions,
  setLayoutOptions,
  zoomLevel,
  handleZoom,
  resetView,
  isFullscreen,
  toggleFullscreen
}: SkillTreeControlsProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
      <div>
        <h3 className={utils.cn(tw.typography.cardHeading, "flex items-center gap-2")}>
          Interactive Skill Tree
          <span className={utils.cn(tw.typography.smallLabel, "font-normal")}>
            ({filteredNodesLength} of {skillNodesLength} skills)
          </span>
        </h3>
        <p className={utils.cn(tw.typography.smallLabel, "mt-1")}>
          Explore skill relationships and dependencies
        </p>
      </div>
      
      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={utils.cn(
            components.button.secondary,
            "px-3 py-1.5 text-sm flex items-center gap-2",
            tw.hover.blue
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
        </button>
        
        <button 
          onClick={() => setShowLabels(!showLabels)}
          className={utils.cn(
            components.button.secondary,
            "px-3 py-1.5 text-sm flex items-center gap-2",
            tw.hover.blue
          )}
        >
          {showLabels ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          Labels
        </button>
        
        <button
          onClick={() => setLayoutOptions(prev => ({
            ...prev,
            viewMode: prev.viewMode === 'tree' ? 'force' : 'tree'
          }))}
          className={utils.cn(
            components.button.secondary,
            "px-3 py-1.5 text-sm flex items-center gap-2",
            tw.hover.blue
          )}
        >
          {layoutOptions.viewMode === 'tree' ? <Grid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
          {layoutOptions.viewMode === 'tree' ? 'Force' : 'Tree'}
        </button>
        
        <button
          onClick={() => setLayoutOptions(prev => ({
            ...prev,
            orientation: prev.orientation === 'horizontal' ? 'vertical' : 'horizontal'
          }))}
          className={utils.cn(
            components.button.secondary,
            "px-3 py-1.5 text-sm flex items-center gap-2",
            tw.hover.blue,
            layoutOptions.viewMode === 'force' ? 'opacity-50 cursor-not-allowed' : ''
          )}
          disabled={layoutOptions.viewMode === 'force'}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Rotate
        </button>
        
        <div className={utils.cn("flex items-center gap-1 rounded-lg border px-1", tw.bg.nested, tw.border.primary)}>
          <button
            onClick={() => handleZoom(-0.2)}
            className={utils.cn("p-1.5 transition-colors", tw.text.secondary, tw.hover.blue)}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className={utils.cn("text-xs px-2", tw.text.tertiary)} style={{ fontFamily: fonts.mono }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.2)}
            className={utils.cn("p-1.5 transition-colors", tw.text.secondary, tw.hover.blue)}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <button
          onClick={resetView}
          className={utils.cn(
            components.button.secondary,
            "px-3 py-1.5 text-sm",
            tw.hover.blue
          )}
        >
          Reset
        </button>
        
        <button
          onClick={toggleFullscreen}
          className={utils.cn(
            components.button.secondary,
            "px-3 py-1.5 text-sm hidden lg:flex items-center gap-2",
            tw.hover.blue
          )}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
} 