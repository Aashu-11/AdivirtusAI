import * as d3 from 'd3'
import { SkillNode, D3LayoutProps } from '../types/InteractiveSkillTree.types'
import { getNodeColor, getNodeStrokeColor, truncateText, showTooltip, hideTooltip } from './skillTreeHelpers'
import { colors, fonts } from '../config/design-system'

// Enhanced tree layout with better spacing
export const createTreeLayout = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodes: SkillNode[],
  width: number,
  height: number,
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>,
  isMobile: boolean,
  layoutOptions: any,
  showLabels: boolean,
  setSelectedNode: (node: SkillNode | null) => void,
  setHoveredNode: (node: SkillNode | null) => void,
  selectedNode: SkillNode | null,
  hoveredNode: SkillNode | null
) => {
  // Create hierarchy with proper root handling
  const createHierarchy = () => {
    // Find nodes without dependencies (root nodes)
    const rootNodes = nodes.filter(n => n.dependencies.length === 0)
    
    if (rootNodes.length === 0) {
      // If no natural roots, use highest competency nodes
      const maxLevel = Math.max(...nodes.map(n => n.level))
      rootNodes.push(...nodes.filter(n => n.level === maxLevel))
    }
    
    // Create virtual root if multiple roots
    const virtualRoot: SkillNode = {
      id: 'virtual-root',
      name: 'Skills',
      category: '',
      competency: 0,
      targetLevel: 0,
      dependencies: [],
      level: -1,
      radius: 0
    }
    
    // Build hierarchy manually
    const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] as SkillNode[] }]))
    const rootNode = { ...virtualRoot, children: [] as SkillNode[] }
    
    // Connect nodes based on dependencies
    nodes.forEach(node => {
      if (node.dependencies.length === 0) {
        rootNode.children!.push(nodeMap.get(node.id)!)
      } else {
        // Add as child to first dependency for simplicity
        const parentId = node.dependencies[0]
        const parent = nodeMap.get(parentId)
        if (parent) {
          parent.children!.push(nodeMap.get(node.id)!)
        } else {
          rootNode.children!.push(nodeMap.get(node.id)!)
        }
      }
    })
    
    return d3.hierarchy(rootNode)
  }
  
  const root = createHierarchy()
  
  // Calculate dynamic spacing based on node count and text width
  const maxTextWidth = Math.max(...nodes.map(n => n.textWidth || 0))
  const avgNodeRadius = nodes.reduce((sum, n) => sum + (n.radius || 8), 0) / nodes.length
  
  const nodeHorizontalSpacing = Math.max(
    maxTextWidth + avgNodeRadius * 4,
    isMobile ? 80 : 120
  ) * layoutOptions.nodeSpacing
  
  const nodeVerticalSpacing = Math.max(
    avgNodeRadius * 4,
    isMobile ? 40 : 60
  ) * layoutOptions.levelSpacing
  
  // Create tree layout with dynamic size
  const treeLayout = layoutOptions.orientation === 'horizontal'
    ? d3.tree<SkillNode>()
        .size([height * 0.8, width * 0.7])
        .nodeSize([nodeVerticalSpacing, nodeHorizontalSpacing])
    : d3.tree<SkillNode>()
        .size([width * 0.8, height * 0.7])
        .nodeSize([nodeHorizontalSpacing, nodeVerticalSpacing])
  
  treeLayout(root)
  
  // Center the tree
  const bounds = {
    minX: Infinity, maxX: -Infinity,
    minY: Infinity, maxY: -Infinity
  }
  
  root.each(d => {
    if (d.data.id !== 'virtual-root') {
      const x = layoutOptions.orientation === 'horizontal' ? d.y : d.x
      const y = layoutOptions.orientation === 'horizontal' ? d.x : d.y
      bounds.minX = Math.min(bounds.minX, x)
      bounds.maxX = Math.max(bounds.maxX, x)
      bounds.minY = Math.min(bounds.minY, y)
      bounds.maxY = Math.max(bounds.maxY, y)
    }
  })
  
  const treeWidth = bounds.maxX - bounds.minX
  const treeHeight = bounds.maxY - bounds.minY
  const offsetX = -bounds.minX - treeWidth / 2
  const offsetY = -bounds.minY - treeHeight / 2
  
  // Draw links with curves
  const links = g.append('g')
    .attr('class', 'links')
    .selectAll('path')
    .data(root.links().filter(d => d.source.data.id !== 'virtual-root'))
    .join('path')
    .attr('d', layoutOptions.orientation === 'horizontal'
      ? d3.linkHorizontal<any, any>()
          .x(d => d.y + offsetX)
          .y(d => d.x + offsetY)
      : d3.linkVertical<any, any>()
          .x(d => d.x + offsetX)
          .y(d => d.y + offsetY)
    )
    .style('fill', 'none')
    .style('stroke', '#2563EB')
    .style('stroke-opacity', 0.3)
    .style('stroke-width', d => {
      const targetNode = nodes.find(n => n.id === d.target.data.id)
      const sourceNode = nodes.find(n => n.id === d.source.data.id)
      if (targetNode && sourceNode && targetNode.dependencyStrengths) {
        const strength = targetNode.dependencyStrengths.get(sourceNode.id) || 0.5
        return 1 + strength * 2
      }
      return 1.5
    })
    .style('stroke-dasharray', d => {
      const targetNode = nodes.find(n => n.id === d.target.data.id)
      const sourceNode = nodes.find(n => n.id === d.source.data.id)
      if (targetNode && sourceNode && targetNode.dependencyStrengths) {
        const strength = targetNode.dependencyStrengths.get(sourceNode.id) || 0.5
        return strength < 0.3 ? '3,3' : 'none'
      }
      return 'none'
    })
  
  // Draw nodes
  const nodeGroups = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(root.descendants().filter(d => d.data.id !== 'virtual-root'))
    .join('g')
    .attr('transform', d => layoutOptions.orientation === 'horizontal'
      ? `translate(${d.y + offsetX}, ${d.x + offsetY})`
      : `translate(${d.x + offsetX}, ${d.y + offsetY})`
    )
    .style('cursor', 'pointer')
  
  // Add node circles
  nodeGroups.append('circle')
    .attr('r', d => d.data.radius || 8)
    .style('fill', d => getNodeColor(d.data))
    .style('fill-opacity', 0.8)
    .style('stroke', d => getNodeStrokeColor(d.data, selectedNode, hoveredNode))
    .style('stroke-width', 2)
    .on('click', (event, d) => {
      event.stopPropagation()
      setSelectedNode(d.data)
    })
    .on('mouseenter', function(event, d) {
      setHoveredNode(d.data)
      showTooltip(event, d.data, tooltip)
      
      // Highlight connected nodes
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', (d.data.radius || 8) * 1.2)
        .style('fill-opacity', 1)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))')
    })
    .on('mouseleave', function(event, d) {
      setHoveredNode(null)
      hideTooltip(tooltip)
      
        d3.select(this)
        .transition()
        .duration(200)
        .attr('r', d.data.radius || 8)
        .style('fill-opacity', 0.8)
        .style('filter', 'none')
    })
  
  // Add competency arcs
  nodeGroups.each(function(d) {
    const node = d3.select(this)
    const radius = d.data.radius || 8
    
    const arcGenerator = d3.arc()
      .innerRadius(radius)
      .outerRadius(radius + 3)
      .startAngle(0)
      .endAngle((d.data.competency / 100) * 2 * Math.PI)
    
    node.append('path')
      .attr('d', arcGenerator as any)
      .style('fill', getNodeColor(d.data))
      .style('opacity', 0.6)
  })
  
  // Add labels with smart positioning
  if (showLabels) {
    nodeGroups.append('text')
    .attr('dy', d => {
        const radius = d.data.radius || 8
        return layoutOptions.orientation === 'horizontal'
          ? d.children ? -(radius + 5) : radius + 15
          : radius + 15
    })
    .attr('text-anchor', 'middle')
      .style('font-size', `${isMobile ? 10 : 11}px`)
    .style('font-weight', 500)
    .style('fill', colors.text.primary)
      .style('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.8)')
      .style('pointer-events', 'none')
      .style('font-family', fonts.primary)
      .text(d => truncateText(d.data.name, isMobile ? 12 : 18))
  }
}

// Enhanced force layout with collision detection
export const createForceLayout = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodes: SkillNode[], 
  width: number, 
  height: number,
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>,
  isMobile: boolean,
  showLabels: boolean,
  setSelectedNode: (node: SkillNode | null) => void,
  setHoveredNode: (node: SkillNode | null) => void,
  selectedNode: SkillNode | null,
  hoveredNode: SkillNode | null
) => {
  // Create links
  const links: any[] = []
  nodes.forEach(node => {
    node.dependencies.forEach(depId => {
      const source = nodes.find(n => n.id === depId)
      if (source) {
      links.push({ 
          source: source,
          target: node,
          strength: node.dependencyStrengths?.get(depId) || 0.5
        })
      }
    })
  })
  
  // Create force simulation with collision detection
  const simulation = d3.forceSimulation(nodes as any)
    .force('link', d3.forceLink(links)
      .id((d: any) => d.id)
      .distance(d => {
        const baseDistance = isMobile ? 60 : 100
        return baseDistance * (2 - (d.strength || 0.5))
      })
      .strength(d => d.strength || 0.5))
    .force('charge', d3.forceManyBody()
      .strength(d => {
        const baseStrength = isMobile ? -150 : -200
        return baseStrength * ((d as any).radius / 8)
      }))
    .force('center', d3.forceCenter(0, 0))
    .force('collision', d3.forceCollide()
      .radius((d: any) => d.radius + 20)
      .strength(0.8))
    .force('x', d3.forceX(0).strength(0.05))
    .force('y', d3.forceY(0).strength(0.05))
  
  // Draw links
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .join('line')
    .style('stroke', '#2563EB')
    .style('stroke-opacity', d => 0.2 + d.strength * 0.4)
    .style('stroke-width', d => 1 + d.strength * 2)
    .style('stroke-dasharray', d => d.strength < 0.3 ? '3,3' : 'none')
  
  // Draw nodes
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .style('cursor', 'pointer')
    .call(d3.drag<any, any>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any)
  
  // Add circles
  node.append('circle')
    .attr('r', d => d.radius || 8)
    .style('fill', d => getNodeColor(d))
    .style('fill-opacity', 0.8)
    .style('stroke', d => getNodeStrokeColor(d, selectedNode, hoveredNode))
    .style('stroke-width', 2)
    .on('click', (event, d) => {
      event.stopPropagation()
      setSelectedNode(d)
    })
    .on('mouseenter', function(event, d) {
      setHoveredNode(d)
      showTooltip(event, d, tooltip)
      
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', (d.radius || 8) * 1.2)
        .style('fill-opacity', 1)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))')
    })
    .on('mouseleave', function(event, d) {
      setHoveredNode(null)
      hideTooltip(tooltip)
      
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', d.radius || 8)
        .style('fill-opacity', 0.8)
        .style('filter', 'none')
    })
  
  // Add competency arcs
  node.each(function(d) {
    const nodeGroup = d3.select(this)
    const radius = d.radius || 8
    
    const arcGenerator = d3.arc()
      .innerRadius(radius)
      .outerRadius(radius + 3)
      .startAngle(0)
      .endAngle((d.competency / 100) * 2 * Math.PI)
    
    nodeGroup.append('path')
      .attr('d', arcGenerator as any)
      .style('fill', getNodeColor(d))
      .style('opacity', 0.6)
  })
  
  // Add labels
  if (showLabels) {
    node.append('text')
      .attr('dy', d => (d.radius || 8) + 15)
    .attr('text-anchor', 'middle')
      .style('font-size', `${isMobile ? 10 : 11}px`)
      .style('font-weight', 500)
      .style('fill', colors.text.primary)
      .style('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.8)')
      .style('pointer-events', 'none')
      .style('font-family', fonts.primary)
      .text(d => truncateText(d.name, isMobile ? 12 : 18))
  }
  
  // Update positions on tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
    
    node.attr('transform', d => `translate(${d.x}, ${d.y})`)
  })
  
  // Drag functions
  function dragstarted(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }
  
  function dragged(event: any, d: any) {
    d.fx = event.x
    d.fy = event.y
  }
  
  function dragended(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0)
    if (!event.sourceEvent.shiftKey) {
    d.fx = null
    d.fy = null
    }
  }
} 