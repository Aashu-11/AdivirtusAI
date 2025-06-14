'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import * as d3 from 'd3'
import { SkillMatrix } from '@/types/skills'
import { SkillNode, InteractiveSkillTreeProps } from '../types/InteractiveSkillTree.types'
import { Grid } from 'lucide-react'
import { colors, fonts, tw, components, utils } from '@/config/design-system'

// Import custom hooks
import { 
  useTextWidthCalculation, 
  useResponsiveDimensions, 
  useSkillMatrixProcessing, 
  useSkillFiltering 
} from '../hooks/useSkillTree'

// Import components
import SkillTreeControls from './InteractiveSkillTree/SkillTreeControls'
import SkillTreeFilters from './InteractiveSkillTree/SkillTreeFilters'
import SkillTreeDetailPanel from './InteractiveSkillTree/SkillTreeDetailPanel'

// Import D3 layouts
import { createTreeLayout, createForceLayout } from '../utils/d3Layouts'

export default function InteractiveSkillTree({ skillMatrix }: InteractiveSkillTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLabels, setShowLabels] = useState(true)

  // Custom hooks
  const { calculateTextWidth } = useTextWidthCalculation()
  const { dimensions, layoutOptions, setLayoutOptions } = useResponsiveDimensions(containerRef)
  const { skillNodes, availableCategories, loading } = useSkillMatrixProcessing(skillMatrix, calculateTextWidth)
  const { filteredNodes, filterOptions, setFilterOptions } = useSkillFiltering(skillNodes)

  // Enhanced tree visualization with better layout
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredNodes.length === 0 || loading) return
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove()
    
    const { width, height } = dimensions
    const isMobile = width < 768
    
    // Adaptive margins
    const margin = {
      top: isMobile ? 20 : 40,
      right: isMobile ? 20 : 60,
      bottom: isMobile ? 20 : 40,
      left: isMobile ? 20 : 60
    }
    
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    // Create main group
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
    
    // Add background for better zoom/pan
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'transparent')
      .style('cursor', 'grab')
    
    const g = svg.append('g')
      .attr('class', 'main-group')
    
    // Enhanced zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        setZoomLevel(event.transform.k)
      })
      .filter(event => {
        // Allow zoom on wheel and pinch, pan on drag
        return event.type === 'wheel' || 
               event.type === 'touchstart' || 
               event.type === 'touchmove' ||
               (event.type === 'mousedown' && event.target.tagName === 'rect')
      })
    
    svg.call(zoom as any)
    
    // Smart initial view based on node count and screen size
    const nodeCount = filteredNodes.length
    const initialScale = isMobile 
      ? Math.min(0.8, 30 / nodeCount)
      : Math.min(1, 50 / nodeCount)
    
    svg.call(
      zoom.transform as any,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(initialScale)
    )
    
    // Create tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'skill-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', colors.background.nested)
      .style('color', colors.text.primary)
      .style('border-radius', '12px')
      .style('padding', isMobile ? '8px 12px' : '12px 16px')
      .style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.4)')
      .style('border', `1px solid ${colors.blue.border}`)
      .style('font-size', isMobile ? '11px' : '13px')
      .style('max-width', isMobile ? '200px' : '280px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('backdrop-filter', 'blur(10px)')
      .style('font-family', fonts.primary)
    
    if (layoutOptions.viewMode === 'tree') {
      createTreeLayout(
        g, 
        filteredNodes, 
        innerWidth, 
        innerHeight, 
        tooltip, 
        isMobile, 
        layoutOptions, 
        showLabels, 
        setSelectedNode, 
        setHoveredNode, 
        selectedNode, 
        hoveredNode
      )
    } else {
      createForceLayout(
        g, 
        filteredNodes, 
        innerWidth, 
        innerHeight, 
        tooltip, 
        isMobile, 
        showLabels, 
        setSelectedNode, 
        setHoveredNode, 
        selectedNode, 
        hoveredNode
      )
    }
    
    // Cleanup
    return () => {
      tooltip.remove()
    }
  }, [filteredNodes, loading, layoutOptions, dimensions, showLabels, selectedNode, hoveredNode])

  // Control functions
  const handleZoom = (delta: number) => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    const currentTransform = d3.zoomTransform(svg.node()!)
    const newScale = Math.max(0.1, Math.min(4, currentTransform.k + delta))
    
    svg.transition()
      .duration(300)
      .call(
        (d3.zoom<SVGSVGElement, unknown>() as any).transform,
        d3.zoomIdentity
          .translate(currentTransform.x, currentTransform.y)
          .scale(newScale)
      )
  }
  
  const resetView = () => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    const { width, height } = dimensions
    
    svg.transition()
      .duration(500)
      .call(
        (d3.zoom<SVGSVGElement, unknown>() as any).transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(1)
      )
  }
  
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className={utils.cn(components.card.primary, "min-h-[300px] flex items-center justify-center")} style={{ fontFamily: fonts.primary }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-blue-600/10 animate-pulse" />
          </div>
          <p className={tw.text.secondary + " text-sm"}>Loading skill tree...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!skillMatrix || skillNodes.length === 0) {
    return (
      <div className={utils.cn(components.card.primary, "min-h-[300px] flex flex-col items-center justify-center")} style={{ fontFamily: fonts.primary }}>
        <div className={utils.cn(components.iconContainer.blue, "h-16 w-16 mb-4")}>
          <Grid className="h-8 w-8" />
        </div>
        <p className={tw.text.primary + " text-base mb-2"}>No skill data available</p>
        <p className={tw.text.secondary + " text-sm"}>Add skills to visualize your learning journey</p>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className={utils.cn(components.card.primary, "p-4 md:p-6")}
      style={{ fontFamily: fonts.primary }}
    >
      {/* Header */}
      <SkillTreeControls
        filteredNodesLength={filteredNodes.length}
        skillNodesLength={skillNodes.length}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        layoutOptions={layoutOptions}
        setLayoutOptions={setLayoutOptions}
        zoomLevel={zoomLevel}
        handleZoom={handleZoom}
        resetView={resetView}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />
      
      {/* Filters Panel */}
      <SkillTreeFilters
        showFilters={showFilters}
        filterOptions={filterOptions}
        setFilterOptions={setFilterOptions}
        availableCategories={availableCategories}
      />
      
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Visualization */}
        <div 
          ref={containerRef} 
          className={utils.cn("flex-1 rounded-xl border overflow-hidden shadow-inner relative", tw.bg.nested, tw.border.primary)}
        >
          <svg 
            ref={svgRef} 
            className="w-full"
            style={{ height: `${dimensions.height}px` }}
          />
          
          {/* Legend */}
          <div className={utils.cn("absolute bottom-0 left-0 right-0 p-3 pointer-events-none", `bg-gradient-to-t from-[${colors.background.nested}] to-transparent`)}>
            <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className={tw.text.secondary}>Achieved</span>
                </div>
                <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className={tw.text.secondary}>In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className={tw.text.secondary}>Needs Work</span>
                </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-8 h-0.5 bg-blue-500/50" />
                <span className={tw.text.secondary}>Dependency</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detail Panel */}
        <SkillTreeDetailPanel
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          skillNodes={skillNodes}
        />
      </div>
    </motion.div>
  )
} 