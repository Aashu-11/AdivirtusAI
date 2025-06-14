import { useState, useEffect, useCallback, useRef } from 'react'
import { SkillMatrix } from '@/types/skills'
import { SkillNode, LayoutOptions, FilterOptions } from '../types/InteractiveSkillTree.types'

// Enhanced text width calculation with caching
export const useTextWidthCalculation = () => {
  const textWidthCache = useRef<Map<string, number>>(new Map())
  
  const calculateTextWidth = useCallback((text: string, fontSize: number = 12): number => {
    const cacheKey = `${text}-${fontSize}`
    if (textWidthCache.current.has(cacheKey)) {
      return textWidthCache.current.get(cacheKey)!
    }
    
    // Create canvas for accurate text measurement
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (context) {
      context.font = `${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
      const width = context.measureText(text).width
      textWidthCache.current.set(cacheKey, width)
      return width
    }
    
    // Fallback approximation
    const width = text.length * fontSize * 0.6
    textWidthCache.current.set(cacheKey, width)
    return width
  }, [])

  return { calculateTextWidth }
}

// Enhanced responsive dimensions with debouncing
export const useResponsiveDimensions = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>({
    orientation: 'horizontal',
    viewMode: 'tree',
    nodeSpacing: 1,
    levelSpacing: 1
  })

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const updateDimensions = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth
          const isMobile = window.innerWidth < 768
          const isTablet = window.innerWidth < 1024
          
          let height
          if (isMobile) {
            height = Math.min(400, window.innerHeight * 0.5)
          } else if (isTablet) {
            height = Math.min(500, window.innerHeight * 0.6)
          } else {
            height = Math.min(600, window.innerHeight * 0.7)
          }
          
          setDimensions({ 
            width: containerWidth, 
            height 
          })
          
          // Adjust layout options based on screen size
          setLayoutOptions(prev => ({
            ...prev,
            nodeSpacing: isMobile ? 0.8 : isTablet ? 1 : 1.2,
            levelSpacing: isMobile ? 0.8 : isTablet ? 1 : 1.2
          }))
        }
      }, 100)
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateDimensions)
    }
  }, [containerRef])

  return { dimensions, layoutOptions, setLayoutOptions }
}

// Process skill matrix data with better error handling
export const useSkillMatrixProcessing = (skillMatrix: SkillMatrix | null, calculateTextWidth: (text: string, fontSize?: number) => number) => {
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!skillMatrix) {
      setLoading(false)
      return
    }

    try {
      const nodes: SkillNode[] = []
      const allDependencies = new Map<string, string[]>()
      const dependencyStrengths = new Map<string, Map<string, number>>()
      const categories = new Set<string>()
      
      // First pass: create all nodes with enhanced properties
      Object.entries(skillMatrix).forEach(([category, categoryData]) => {
        categories.add(category)
        let skills: any[] = []
        
        if (Array.isArray(categoryData)) {
          skills = categoryData
        } else if (categoryData && 'skills' in categoryData && Array.isArray(categoryData.skills)) {
          skills = categoryData.skills
        }
        
        skills.forEach(skill => {
          if (!skill || !skill.name) return
          
          const nodeId = skill.id || `${category}-${skill.name.replace(/\s+/g, '-').toLowerCase()}`
          const competency = skill.competency || 0
          const targetLevel = skill.competency_level || 70
          const fontSize = window.innerWidth < 768 ? 10 : 12
          const textWidth = calculateTextWidth(skill.name, fontSize)
          
          nodes.push({
            id: nodeId,
            name: skill.name,
            category,
            competency,
            targetLevel,
            dependencies: [],
            description: skill.description,
            estimatedHours: Math.round((targetLevel - competency) / 10) * 5,
            resources: ['Documentation', 'Online Courses', 'Practice Projects'],
            level: 0,
            textWidth,
            radius: 8
          })
        })
      })
      
      setAvailableCategories(Array.from(categories).sort())
      
      // Second pass: establish dependencies with validation
      nodes.forEach(node => {
        if (skillMatrix[node.category] && !Array.isArray(skillMatrix[node.category])) {
          const categoryData = skillMatrix[node.category] as any
          if (categoryData.skills) {
            const skillData = categoryData.skills.find((s: any) => 
              (s.id && s.id === node.id) || s.name === node.name
            )
            
            if (skillData && skillData.dependencies) {
              const deps: string[] = []
              const strengths = new Map<string, number>()
              
              skillData.dependencies.forEach((dep: any) => {
                const depNode = nodes.find(n => n.id === dep.skillId)
                if (depNode && depNode.id !== node.id) {
                  deps.push(depNode.id)
                  strengths.set(depNode.id, Math.min(1, Math.max(0, dep.strength || 0.5)))
                }
              })
              
              if (deps.length > 0) {
                allDependencies.set(node.id, deps)
                dependencyStrengths.set(node.id, strengths)
              }
            }
          }
        }
      })
      
      // Intelligent dependency inference with limits
      nodes.forEach(node => {
        if (!allDependencies.has(node.id) || allDependencies.get(node.id)?.length === 0) {
          const potentialDeps = nodes.filter(n => 
            n.category === node.category && 
            n.competency > node.competency + 20 && 
            n.id !== node.id
          )
          
          if (potentialDeps.length > 0) {
            const sortedDeps = [...potentialDeps].sort((a, b) => b.competency - a.competency)
            const numDeps = Math.min(2, sortedDeps.length)
            const deps = sortedDeps.slice(0, numDeps).map(d => d.id)
            
            allDependencies.set(node.id, deps)
            
            const strengths = new Map<string, number>()
            deps.forEach(depId => {
              const strength = 0.3 + Math.random() * 0.4
              strengths.set(depId, strength)
            })
            dependencyStrengths.set(node.id, strengths)
          }
        }
      })
      
      // Detect and fix circular dependencies
      const detectAndFixCircularDependencies = () => {
        const visited = new Set<string>()
        const recursionStack = new Set<string>()
        
        const hasCycle = (nodeId: string): boolean => {
          visited.add(nodeId)
          recursionStack.add(nodeId)
          
          const deps = allDependencies.get(nodeId) || []
            for (const depId of deps) {
            if (!visited.has(depId)) {
              if (hasCycle(depId)) return true
            } else if (recursionStack.has(depId)) {
              // Remove the circular dependency
              allDependencies.set(nodeId, deps.filter(d => d !== depId))
              return true
            }
          }
          
          recursionStack.delete(nodeId)
          return false
        }
        
        for (const node of nodes) {
          if (!visited.has(node.id)) {
            hasCycle(node.id)
          }
        }
      }
      
      detectAndFixCircularDependencies()
      
      // Calculate hierarchical levels with better distribution
      const calculateLevels = () => {
        const levelMap = new Map<string, number>()
        const visited = new Set<string>()
        
        const calculateNodeLevel = (nodeId: string): number => {
          if (levelMap.has(nodeId)) {
            return levelMap.get(nodeId)!
          }
          
          if (visited.has(nodeId)) {
            return 0
          }
          
          visited.add(nodeId)
          
          const deps = allDependencies.get(nodeId) || []
          if (deps.length === 0) {
            levelMap.set(nodeId, 0)
            return 0
          }
          
          let maxLevel = -1
          for (const depId of deps) {
            const depLevel = calculateNodeLevel(depId)
            maxLevel = Math.max(maxLevel, depLevel)
          }
          
          const level = maxLevel + 1
          levelMap.set(nodeId, level)
          return level
        }
        
        // Calculate levels for all nodes
        nodes.forEach(node => {
          const level = calculateNodeLevel(node.id)
          node.level = level
        })
        
        // Normalize levels to start from 0
        const minLevel = Math.min(...Array.from(levelMap.values()))
        nodes.forEach(node => {
          node.level = (levelMap.get(node.id) || 0) - minLevel
        })
      }
      
      calculateLevels()
      
      // Add dependencies and calculate radius based on importance
      nodes.forEach(node => {
        const deps = allDependencies.get(node.id)
        if (deps) {
          node.dependencies = deps
          node.dependencyStrengths = dependencyStrengths.get(node.id)
        }
        
        // Calculate dynamic radius based on competency and dependencies
        const baseRadius = window.innerWidth < 768 ? 6 : 8
        const competencyFactor = node.competency / 100
        const dependencyFactor = 1 + (node.dependencies.length * 0.1)
        node.radius = baseRadius * (0.8 + competencyFactor * 0.4) * dependencyFactor
      })
      
      setSkillNodes(nodes)
      setLoading(false)
    } catch (error) {
      console.error('Error processing skill data:', error)
      setLoading(false)
    }
  }, [skillMatrix, calculateTextWidth])

  return { skillNodes, availableCategories, loading }
}

// Enhanced filtering with debouncing
export const useSkillFiltering = (skillNodes: SkillNode[]) => {
  const [filteredNodes, setFilteredNodes] = useState<SkillNode[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    competencyRange: [0, 100],
    showAchieved: true,
    showInProgress: true,
    showNeedsWork: true,
    searchTerm: ''
  })

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!skillNodes.length) return

      const filtered = skillNodes.filter(node => {
        // Search filter
        if (filterOptions.searchTerm) {
          const searchLower = filterOptions.searchTerm.toLowerCase()
          if (!node.name.toLowerCase().includes(searchLower) &&
              !node.category.toLowerCase().includes(searchLower) &&
              (!node.description || !node.description.toLowerCase().includes(searchLower))) {
            return false
          }
        }

        // Category filter
        if (filterOptions.categories.length > 0 && 
            !filterOptions.categories.includes(node.category)) {
          return false
        }

        // Competency range
        if (node.competency < filterOptions.competencyRange[0] || 
            node.competency > filterOptions.competencyRange[1]) {
          return false
        }

        // Status filters
        const isAchieved = node.competency >= node.targetLevel
        const isNeedsWork = node.competency < node.targetLevel * 0.5
        const isInProgress = !isAchieved && !isNeedsWork

        if (isAchieved && !filterOptions.showAchieved) return false
        if (isInProgress && !filterOptions.showInProgress) return false
        if (isNeedsWork && !filterOptions.showNeedsWork) return false

        return true
      })

      setFilteredNodes(filtered)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [skillNodes, filterOptions])

  return { filteredNodes, filterOptions, setFilterOptions }
} 