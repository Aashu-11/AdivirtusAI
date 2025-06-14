'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { tw, components, utils, colors, designSystem, themes } from '@/config/design-system'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Palette, 
  Type, 
  Layout, 
  Check, 
  Copy, 
  Eye, 
  Code, 
  Sparkles, 
  Target,
  Zap,
  Heart,
  Star,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sun,
  Moon
} from 'lucide-react'

interface ColorCard {
  name: string
  value: string
  className: string
  bgClassName: string
  usage: string
  category: 'background' | 'text' | 'accent' | 'border'
}

interface ComponentExample {
  name: string
  description: string
  component: React.ReactNode
}

export default function DesignSystemPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'components' | 'principles'>('colors')
  // Local toggle for color values display only (not visual theme)
  const [displayMode, setDisplayMode] = useState<'dark' | 'light'>('dark')
  
  // Get global theme for actual visual appearance
  const { theme: globalTheme } = useTheme()

  // Color values based on display mode (for palette tiles only)
  const getColorValues = (mode: 'dark' | 'light') => {
    return mode === 'dark' ? colors : themes.light
  }

  const currentDisplayValues = getColorValues(displayMode)

  const backgroundColors: ColorCard[] = [
    {
      name: 'Primary Background',
      value: currentDisplayValues.background.primary,
      className: 'tw.bg.primary',
      bgClassName: tw.bg.primary,
      usage: 'Main application background',
      category: 'background'
    },
    {
      name: 'Secondary Background',
      value: currentDisplayValues.background.secondary,
      className: 'tw.bg.secondary',
      bgClassName: tw.bg.secondary,
      usage: 'Secondary surfaces and gradient ends',
      category: 'background'
    },
    {
      name: 'Card Background',
      value: currentDisplayValues.background.card,
      className: 'tw.bg.card',
      bgClassName: tw.bg.card,
      usage: 'Main card containers and surfaces',
      category: 'background'
    },
    {
      name: 'Nested Background',
      value: currentDisplayValues.background.nested,
      className: 'tw.bg.nested',
      bgClassName: tw.bg.nested,
      usage: 'Nested components and icon backgrounds',
      category: 'background'
    },
    {
      name: 'Interactive Background',
      value: currentDisplayValues.background.interactive,
      className: 'tw.bg.interactive',
      bgClassName: tw.bg.interactive,
      usage: 'Interactive elements and nodes',
      category: 'background'
    }
  ]

  const accentColors: ColorCard[] = [
    // Top row: Blue and Rose
    {
      name: 'Blue Primary',
      value: colors.blue.primary,
      className: 'tw.text.blue',
      bgClassName: 'bg-blue-500',
      usage: 'Primary actions, links, focus states',
      category: 'accent'
    },
    {
      name: 'Blue Secondary', 
      value: colors.blue.secondary,
      className: 'bg-blue-600',
      bgClassName: 'bg-blue-600',
      usage: 'Buttons, progress bars',
      category: 'accent'
    },
    {
      name: 'Rose Primary',
      value: colors.rose.primary,
      className: 'tw.text.rose',
      bgClassName: 'bg-rose-500',
      usage: 'Critical importance, errors',
      category: 'accent'
    },
    {
      name: 'Rose Secondary',
      value: colors.rose.secondary,
      className: 'bg-rose-600',
      bgClassName: 'bg-rose-600',
      usage: 'Critical progress, urgent states',
      category: 'accent'
    },
    // Bottom row: Emerald and Amber
    {
      name: 'Emerald Primary',
      value: colors.emerald.primary,
      className: 'tw.text.emerald',
      bgClassName: 'bg-emerald-500',
      usage: 'Success states, completed items',
      category: 'accent'
    },
    {
      name: 'Emerald Secondary',
      value: colors.emerald.secondary,
      className: 'bg-emerald-600',
      bgClassName: 'bg-emerald-600',
      usage: 'Success progress, positive states',
      category: 'accent'
    },
    {
      name: 'Amber Primary',
      value: colors.amber.primary,
      className: 'tw.text.amber',
      bgClassName: 'bg-amber-500',
      usage: 'High importance, warnings',
      category: 'accent'
    },
    {
      name: 'Amber Secondary',
      value: colors.amber.secondary,
      className: 'bg-amber-600',
      bgClassName: 'bg-amber-600',
      usage: 'High priority progress',
      category: 'accent'
    }
  ]

  // Define textColors here so it recalculates when displayMode changes
  const textColors: ColorCard[] = [
    {
      name: 'Primary Text',
      value: currentDisplayValues.text.primary,
      className: 'tw.text.primary',
      bgClassName: tw.text.primary,
      usage: 'Primary text, headings',
      category: 'text'
    },
    {
      name: 'Secondary Text',
      value: currentDisplayValues.text.secondary,
      className: 'tw.text.secondary',
      bgClassName: tw.text.secondary,
      usage: 'Secondary text, descriptions',
      category: 'text'
    },
    {
      name: 'Tertiary Text',
      value: currentDisplayValues.text.tertiary,
      className: 'tw.text.tertiary',
      bgClassName: tw.text.tertiary,
      usage: 'Subtle text, metadata',
      category: 'text'
    }
  ]

  const typographyExamples = [
    {
      name: 'Main Heading',
      className: 'tw.typography.mainHeading',
      sample: 'Learning Style Assessment',
      description: 'Page titles and main headings'
    },
    {
      name: 'Section Heading',
      className: 'tw.typography.sectionHeading',
      sample: 'Skill Gap Analysis',
      description: 'Section titles and component headings'
    },
    {
      name: 'Card Heading',
      className: 'tw.typography.cardHeading',
      sample: 'Learning Styles',
      description: 'Card titles and sub-headings'
    },
    {
      name: 'Body Text',
      className: 'tw.typography.bodyText',
      sample: 'Your learning profile is tailored to your unique learning style and preferences.',
      description: 'Descriptions and general content'
    },
    {
      name: 'Small Label',
      className: 'tw.typography.smallLabel',
      sample: '45% complete',
      description: 'Small labels, metadata, percentages'
    },
    {
      name: 'Mono Numbers',
      className: 'tw.typography.monoNumbers',
      sample: '120',
      description: 'Statistics, numbers, metrics'
    }
  ]

  const componentExamples: ComponentExample[] = [
    {
      name: 'Primary Card',
      description: 'Main container with backdrop blur and borders',
      component: (
        <div className={utils.cn(components.card.primary, "w-full h-24 flex items-center justify-center")}>
          <span className={tw.typography.cardHeading}>Primary Card</span>
        </div>
      )
    },
    {
      name: 'Nested Card',
      description: 'Secondary container for nested content',
      component: (
        <div className={utils.cn(components.card.nested, "w-full h-24 flex items-center justify-center")}>
          <span className={tw.typography.bodyText}>Nested Card</span>
        </div>
      )
    },
    {
      name: 'Interactive Card',
      description: 'Card with hover effects and transitions',
      component: (
        <div className={utils.cn(components.card.interactive, tw.hover.blue, "w-full h-24 flex items-center justify-center cursor-pointer")}>
          <span className={tw.typography.bodyText}>Interactive Card</span>
        </div>
      )
    },
    {
      name: 'Icon Containers',
      description: 'Colored icon containers with different variants',
      component: (
        <div className="flex gap-3">
          <div className={components.iconContainer.blue}>
            <Zap className="w-4 h-4" />
          </div>
          <div className={components.iconContainer.emerald}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className={components.iconContainer.rose}>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className={components.iconContainer.amber}>
            <Clock className="w-4 h-4" />
          </div>
        </div>
      )
    },
    {
      name: 'Primary Button',
      description: 'Main action button with gradient background',
      component: (
        <button className={components.button.primary}>
          Primary Action
        </button>
      )
    },
    {
      name: 'Secondary Button',
      description: 'Secondary action with accent styling',
      component: (
        <button className={components.button.secondary}>
          Secondary Action
        </button>
      )
    },
    {
      name: 'Color Badges',
      description: 'Status badges with different color variants',
      component: (
        <div className="flex gap-2 flex-wrap">
          <span className={utils.cn("px-3 py-1 rounded-full text-xs font-medium", components.badge.blue)}>
            Info
          </span>
          <span className={utils.cn("px-3 py-1 rounded-full text-xs font-medium", components.badge.emerald)}>
            Success
          </span>
          <span className={utils.cn("px-3 py-1 rounded-full text-xs font-medium", components.badge.amber)}>
            Warning
          </span>
          <span className={utils.cn("px-3 py-1 rounded-full text-xs font-medium", components.badge.rose)}>
            Error
          </span>
        </div>
      )
    }
  ]

  const copyToClipboard = async (text: string, colorName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedColor(colorName)
      setTimeout(() => setCopiedColor(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const tabContent = {
    colors: (
      <div className="space-y-12">
        {/* Display Mode Toggle - Only affects values shown, not visual theme */}
        <motion.div 
          variants={itemVariants} 
          className="flex justify-center mb-8"
        >
          <div className={utils.cn(components.card.nested, "p-2 flex items-center gap-2")}>
            <Sun className={utils.cn("w-4 h-4", displayMode === 'light' ? tw.text.amber : tw.text.tertiary)} />
            <button
              onClick={() => setDisplayMode(displayMode === 'dark' ? 'light' : 'dark')}
              className={utils.cn(
                "relative w-12 h-6 rounded-full transition-colors duration-300",
                displayMode === 'dark' ? "bg-blue-500" : "bg-gray-300"
              )}
            >
              <div className={utils.cn(
                "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300",
                displayMode === 'dark' ? "left-6" : "left-0.5"
              )} />
            </button>
            <Moon className={utils.cn("w-4 h-4", displayMode === 'dark' ? tw.text.blue : tw.text.tertiary)} />
            <span className={utils.cn(tw.typography.smallLabel, "ml-2")}>
              Showing {displayMode === 'dark' ? 'Dark' : 'Light'} Values
            </span>
          </div>
          <div className={utils.cn(components.card.nested, "p-2 ml-4 flex items-center gap-2")}>
            <Info className="w-4 h-4 text-blue-400" />
            <span className={utils.cn(tw.typography.smallLabel)}>
              Visual theme: {globalTheme} (change from sidebar)
            </span>
          </div>
        </motion.div>

        {/* Background Colors */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible">
          <motion.h3 variants={itemVariants} className={utils.cn(tw.typography.sectionHeading, "mb-6 flex items-center gap-3")}>
            <div className={components.iconContainer.blue}>
              <Layout className="w-4 h-4" />
            </div>
            Background Colors
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backgroundColors.map((color, index) => (
              <motion.div
                key={color.name}
                variants={itemVariants}
                className={utils.cn(components.card.nested, "group cursor-pointer")}
                onClick={() => copyToClipboard(color.value, color.name)}
              >
                <div className={utils.cn(
                  "w-full h-24 rounded-lg mb-4 border border-white/10 dark:border-white/10 relative overflow-hidden",
                  color.bgClassName
                )}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 dark:bg-black/20">
                    {copiedColor === color.name ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
                <h4 className={utils.cn(tw.typography.cardHeading, "mb-2")}>{color.name}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={tw.typography.smallLabel}>Value</span>
                    <code className={utils.cn(tw.typography.smallLabel, tw.text.blue)}>{color.value}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={tw.typography.smallLabel}>Class</span>
                    <code className={utils.cn(tw.typography.smallLabel, tw.text.emerald)}>{color.className}</code>
                  </div>
                  <p className={utils.cn(tw.typography.smallLabel, "mt-3")}>{color.usage}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Accent Colors */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible">
          <motion.h3 variants={itemVariants} className={utils.cn(tw.typography.sectionHeading, "mb-6 flex items-center gap-3")}>
            <div className={components.iconContainer.emerald}>
              <Sparkles className="w-4 h-4" />
            </div>
            Accent Colors
          </motion.h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {accentColors.map((color, index) => (
              <motion.div
                key={color.name}
                variants={itemVariants}
                className={utils.cn(components.card.nested, "group cursor-pointer")}
                onClick={() => copyToClipboard(color.value, color.name)}
              >
                <div className={utils.cn(
                  "w-full h-16 rounded-lg mb-3 border border-white/10 dark:border-white/10 relative overflow-hidden",
                  color.bgClassName
                )}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                    {copiedColor === color.name ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
                <h4 className={utils.cn(tw.typography.cardHeading, "text-sm mb-2")}>{color.name}</h4>
                <code className={utils.cn(tw.typography.smallLabel, tw.text.blue, "text-xs")}>{color.className}</code>
                <p className={utils.cn(tw.typography.smallLabel, "mt-2 text-xs")}>{color.usage}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Text Colors */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible">
          <motion.h3 variants={itemVariants} className={utils.cn(tw.typography.sectionHeading, "mb-6 flex items-center gap-3")}>
            <div className={components.iconContainer.amber}>
              <Type className="w-4 h-4" />
            </div>
            Text Colors
          </motion.h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {textColors.map((color, index) => (
              <motion.div
                key={`${color.name}-${displayMode}`}
                variants={itemVariants}
                className={utils.cn(components.card.nested, "group cursor-pointer")}
                onClick={() => copyToClipboard(color.value, color.name)}
              >
                <div 
                  className="w-full h-16 rounded-lg mb-3 border border-white/10 dark:border-white/10 relative overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: color.value }}
                >
                  <span className={utils.cn(
                    "font-semibold text-lg",
                    // Better contrast logic based on the actual background color
                    displayMode === 'dark' 
                      ? (color.name === 'Primary Text' ? "text-black" : 
                         color.name === 'Secondary Text' ? "text-white" : "text-white")
                      : (color.name === 'Primary Text' ? "text-white" : 
                         color.name === 'Secondary Text' ? "text-black" : "text-black")
                  )}>
                    Aa
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                    {copiedColor === color.name ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
                <h4 className={utils.cn(tw.typography.cardHeading, "text-sm mb-2")}>{color.name}</h4>
                <code className={utils.cn(tw.typography.smallLabel, tw.text.blue, "text-xs")}>{color.className}</code>
                <p className={utils.cn(tw.typography.smallLabel, "mt-2 text-xs")}>{color.usage}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    ),

    typography: (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {typographyExamples.map((typo, index) => (
          <motion.div
            key={typo.name}
            variants={itemVariants}
            className={components.card.nested}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className={utils.cn(tw.typography.cardHeading, "mb-2")}>{typo.name}</h3>
                <p className={utils.cn(tw.typography.bodyText, "mb-4")}>{typo.description}</p>
                <div className={utils.cn(components.card.interactive, "p-3")}>
                  <code className={utils.cn(tw.typography.smallLabel, tw.text.blue)}>{typo.className}</code>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-end">
                <div className={utils.cn(
                  typo.name === 'Main Heading' ? tw.typography.mainHeading :
                  typo.name === 'Section Heading' ? tw.typography.sectionHeading :
                  typo.name === 'Card Heading' ? tw.typography.cardHeading :
                  typo.name === 'Body Text' ? tw.typography.bodyText :
                  typo.name === 'Small Label' ? tw.typography.smallLabel :
                  typo.name === 'Mono Numbers' ? tw.typography.monoNumbers : '',
                  "text-center lg:text-right"
                )}>
                  {typo.sample}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    ),

    components: (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {componentExamples.map((component, index) => (
          <motion.div
            key={component.name}
            variants={itemVariants}
            className={components.card.nested}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className={utils.cn(tw.typography.cardHeading, "mb-2")}>{component.name}</h3>
                <p className={utils.cn(tw.typography.bodyText, "mb-4")}>{component.description}</p>
              </div>
              <div className="flex items-center justify-center lg:justify-end">
                {component.component}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    ),

    principles: (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} className={components.card.nested}>
            <div className="flex items-center gap-3 mb-4">
              <div className={components.iconContainer.blue}>
                <Target className="w-4 h-4" />
              </div>
              <h3 className={tw.typography.cardHeading}>Color Usage</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 bg-rose-500 rounded-full mt-0.5 flex-shrink-0"></div>
                <span className={tw.typography.bodyText}>
                  <span className={tw.text.rose}>Rose</span> for critical importance and urgent actions
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 bg-amber-500 rounded-full mt-0.5 flex-shrink-0"></div>
                <span className={tw.typography.bodyText}>
                  <span className={tw.text.amber}>Amber</span> for high priority and warning states
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
                <span className={tw.typography.bodyText}>
                  <span className={tw.text.blue}>Blue</span> for primary actions and information
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 bg-emerald-500 rounded-full mt-0.5 flex-shrink-0"></div>
                <span className={tw.typography.bodyText}>
                  <span className={tw.text.emerald}>Emerald</span> for success and completed states
                </span>
              </li>
            </ul>
          </motion.div>
          
          <motion.div variants={itemVariants} className={components.card.nested}>
            <div className="flex items-center gap-3 mb-4">
              <div className={components.iconContainer.emerald}>
                <Heart className="w-4 h-4" />
              </div>
              <h3 className={tw.typography.cardHeading}>Design Philosophy</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className={tw.typography.bodyText}>
                  Dark theme optimized for focus and reduced eye strain
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className={tw.typography.bodyText}>
                  Consistent spacing and typography hierarchy
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className={tw.typography.bodyText}>
                  Semantic color usage for intuitive user experience
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className={tw.typography.bodyText}>
                  Responsive design patterns for all screen sizes
                </span>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className={components.card.nested}>
          <div className="flex items-center gap-3 mb-4">
            <div className={components.iconContainer.amber}>
              <Code className="w-4 h-4" />
            </div>
            <h3 className={tw.typography.cardHeading}>Implementation Guidelines</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className={utils.cn(tw.typography.cardHeading, "text-base mb-3")}>Component Usage</h4>
              <ul className="space-y-2">
                <li className={tw.typography.bodyText}>• Use <code className={tw.text.blue}>components.card.primary</code> for main containers</li>
                <li className={tw.typography.bodyText}>• Apply <code className={tw.text.blue}>components.card.nested</code> for nested content</li>
                <li className={tw.typography.bodyText}>• Utilize <code className={tw.text.blue}>components.iconContainer</code> for consistent icons</li>
                <li className={tw.typography.bodyText}>• Use <code className={tw.text.blue}>utils.cn()</code> for combining classes</li>
              </ul>
            </div>
            <div>
              <h4 className={utils.cn(tw.typography.cardHeading, "text-base mb-3")}>Typography Best Practices</h4>
              <ul className="space-y-2">
                <li className={tw.typography.bodyText}>• Use <code className={tw.text.blue}>tw.typography.mainHeading</code> for page titles</li>
                <li className={tw.typography.bodyText}>• Apply <code className={tw.text.blue}>tw.typography.sectionHeading</code> for sections</li>
                <li className={tw.typography.bodyText}>• Use <code className={tw.text.blue}>tw.typography.monoNumbers</code> for metrics</li>
                <li className={tw.typography.bodyText}>• Maintain consistent line heights and spacing</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className={utils.cn("min-h-screen p-4 sm:p-6 lg:p-8", tw.bg.primary)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={components.iconContainer.blue}>
              <Palette className="w-6 h-6" />
            </div>
            <h1 className={tw.typography.mainHeading}>
              Design System
            </h1>
          </div>
          <p className={utils.cn(tw.typography.bodyText, "text-base max-w-3xl")}>
            Comprehensive design tokens, components, and guidelines for building consistent interfaces across the Adivirtus platform.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className={utils.cn(components.card.primary, "p-2")}>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'colors', label: 'Colors', icon: Palette },
                { key: 'typography', label: 'Typography', icon: Type },
                { key: 'components', label: 'Components', icon: Layout },
                { key: 'principles', label: 'Principles', icon: Star }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={utils.cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium",
                    activeTab === key
                      ? "bg-blue-500 text-white shadow-lg"
                      : utils.cn(tw.text.secondary, "hover:bg-white/5")
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {tabContent[activeTab]}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-8 border-t border-white/10"
        >
          <div className={utils.cn(components.card.nested, "text-center")}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className={components.iconContainer.emerald}>
                <Info className="w-4 h-4" />
              </div>
              <h3 className={tw.typography.cardHeading}>Need Help?</h3>
            </div>
            <p className={tw.typography.bodyText}>
              This design system is constantly evolving. For questions or suggestions, 
              please reach out to the design team.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 