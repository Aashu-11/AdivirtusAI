'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText,
  Download,
  Calendar,
  Filter,
  Send,
  Clock,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  PieChart,
  Share,
  Eye,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { HRDashboardData } from '@/types/hr-analytics'
import { hrAnalyticsService } from '@/services/hr-analytics'

interface ReportsTabProps {
  data: HRDashboardData | null
  organizationName: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'executive' | 'detailed' | 'compliance' | 'custom'
  icon: any
  frequency: 'on-demand' | 'weekly' | 'monthly' | 'quarterly'
  estimatedPages: number
  includesCharts: boolean
  dataPoints: string[]
  isPopular?: boolean
}

interface GeneratedReport {
  id: string
  name: string
  type: string
  generatedAt: Date
  size: string
  format: 'pdf' | 'excel' | 'csv'
  status: 'ready' | 'generating' | 'failed'
  downloadUrl?: string
}

interface ScheduledReport {
  id: string
  templateId: string
  name: string
  frequency: string
  nextRun: Date
  recipients: string[]
  isActive: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview of organizational skills health, critical gaps, and strategic recommendations',
    type: 'executive',
    icon: TrendingUp,
    frequency: 'monthly',
    estimatedPages: 5,
    includesCharts: true,
    dataPoints: ['Overall competency score', 'Critical gaps count', 'Department rankings', 'ROI projections'],
    isPopular: true
  },
  {
    id: 'skill-gap-analysis',
    name: 'Comprehensive Skills Gap Analysis',
    description: 'Detailed breakdown of all skill gaps across departments with employee-level insights',
    type: 'detailed',
    icon: Target,
    frequency: 'on-demand',
    estimatedPages: 25,
    includesCharts: true,
            dataPoints: ['Individual assessments', 'Department matrices', 'Priority recommendations', 'Training plans']
  },
  {
    id: 'compliance-report',
    name: 'Compliance & Risk Assessment',
    description: 'Regulatory compliance status, risk indicators, and mandatory training tracking',
    type: 'compliance',
    icon: AlertTriangle,
    frequency: 'quarterly',
    estimatedPages: 15,
    includesCharts: true,
    dataPoints: ['Compliance scores', 'Risk levels', 'Certification status', 'Audit trail'],
    isPopular: true
  },
  {
    id: 'department-deep-dive',
    name: 'Department Performance Analysis',
    description: 'Department-specific skills analysis with peer benchmarking and improvement plans',
    type: 'detailed',
    icon: Users,
    frequency: 'monthly',
    estimatedPages: 10,
    includesCharts: true,
    dataPoints: ['Team competencies', 'Individual rankings', 'Skill distributions', 'Growth trajectories']
  },
  {
    id: 'training-effectiveness',
    name: 'Training ROI & Effectiveness',
    description: 'Impact analysis of training programs with before/after comparisons and ROI calculations',
    type: 'detailed',
    icon: BarChart3,
    frequency: 'quarterly',
    estimatedPages: 12,
    includesCharts: true,
    dataPoints: ['Pre/post assessments', 'Skill improvements', 'Cost analysis', 'Success rates']
  },
  {
    id: 'workforce-planning',
    name: 'Strategic Workforce Planning',
    description: 'Future skills requirements, talent gaps, and hiring/training recommendations',
    type: 'executive',
    icon: PieChart,
    frequency: 'quarterly',
    estimatedPages: 18,
    includesCharts: true,
    dataPoints: ['Future skill needs', 'Gap projections', 'Hiring strategies', 'Budget planning']
  }
]

const ReportTemplateCard = ({ 
  template, 
  onGenerate 
}: { 
  template: ReportTemplate; 
  onGenerate: (templateId: string) => void 
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'executive': return '#8B5CF6'
      case 'detailed': return '#3B82F6'
      case 'compliance': return '#EF4444'
      case 'custom': return '#10B981'
      default: return '#6B7280'
    }
  }

  const Icon = template.icon
  const typeColor = getTypeColor(template.type)

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200"
      style={{ background: 'rgba(10, 10, 12, 0.7)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${typeColor}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: typeColor }} />
          </div>
          <div>
            <h3 className={utils.cn('font-semibold', tw.text.primary)}>
              {template.name}
            </h3>
            <span 
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
            >
              {template.type.toUpperCase()}
            </span>
          </div>
        </div>
        
        {template.isPopular && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
            <span className="text-xs font-medium">Popular</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className={utils.cn('text-sm mb-4', tw.text.secondary)}>
        {template.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className={utils.cn('text-lg font-bold', tw.typography.monoNumbers, tw.text.primary)}>
            {template.estimatedPages}
          </p>
          <p className={utils.cn('text-xs', tw.text.tertiary)}>Pages</p>
        </div>
        <div className="text-center">
          <p className={utils.cn('text-lg font-bold text-blue-400', tw.typography.monoNumbers)}>
            {template.dataPoints.length}
          </p>
          <p className={utils.cn('text-xs', tw.text.tertiary)}>Data Points</p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className={utils.cn('text-xs', tw.text.tertiary)}>
            {template.frequency === 'on-demand' ? 'On-Demand' : `Generated ${template.frequency}`}
          </span>
        </div>
        {template.includesCharts && (
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3 h-3 text-blue-400" />
            <span className={utils.cn('text-xs', tw.text.tertiary)}>
              Interactive charts & visualizations
            </span>
          </div>
        )}
      </div>

      {/* Data Points */}
      <div className="mb-6">
        <h4 className={utils.cn('text-xs font-medium mb-2', tw.text.secondary)}>
          Includes:
        </h4>
        <div className="space-y-1">
          {template.dataPoints.slice(0, 3).map((point, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
              <span className={utils.cn('text-xs', tw.text.tertiary)}>{point}</span>
            </div>
          ))}
          {template.dataPoints.length > 3 && (
            <span className={utils.cn('text-xs', tw.text.tertiary)}>
              +{template.dataPoints.length - 3} more data points
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onGenerate(template.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Generate</span>
        </button>
        <button className="px-3 py-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button className="px-3 py-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 transition-colors">
          <Share className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

const RecentReportCard = ({ report }: { report: GeneratedReport }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#10B981'
      case 'generating': return '#F59E0B'
      case 'failed': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const statusColor = getStatusColor(report.status)

  return (
    <motion.div
      variants={cardVariants}
      className="p-4 rounded-xl backdrop-blur-xl border border-gray-700/30"
      style={{ background: 'rgba(10, 10, 12, 0.7)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className={utils.cn('font-medium', tw.text.primary)}>{report.name}</h3>
            <p className={utils.cn('text-xs', tw.text.tertiary)}>
              Generated {report.generatedAt.toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span 
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
          >
            {report.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={utils.cn('text-xs', tw.text.tertiary)}>
            {report.size} • {report.format.toUpperCase()}
          </span>
        </div>
        
        {report.status === 'ready' && (
          <button className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
            <Download className="w-3 h-3" />
            <span className="text-xs font-medium">Download</span>
          </button>
        )}
        
        {report.status === 'generating' && (
          <div className="flex items-center gap-1 text-yellow-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span className="text-xs">Processing...</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function ReportsTab({ data, organizationName }: ReportsTabProps) {
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  useEffect(() => {
    loadRecentReports()
    loadScheduledReports()
  }, [])

  const loadRecentReports = () => {
    // Simulate recent reports
    const reports: GeneratedReport[] = [
      {
        id: '1',
        name: 'Executive Summary - Q4 2024',
        type: 'executive',
        generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        size: '2.4 MB',
        format: 'pdf',
        status: 'ready',
        downloadUrl: '/reports/executive-q4-2024.pdf'
      },
      {
        id: '2',
        name: 'Skills Gap Analysis - Engineering',
        type: 'detailed',
        generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        size: '8.7 MB',
        format: 'pdf',
        status: 'ready',
        downloadUrl: '/reports/engineering-gaps-analysis.pdf'
      },
      {
        id: '3',
        name: 'Compliance Report - November',
        type: 'compliance',
        generatedAt: new Date(),
        size: '1.2 MB',
        format: 'pdf',
        status: 'generating'
      }
    ]
    setGeneratedReports(reports)
  }

  const loadScheduledReports = () => {
    // Simulate scheduled reports
    const scheduled: ScheduledReport[] = [
      {
        id: '1',
        templateId: 'executive-summary',
        name: 'Monthly Executive Summary',
        frequency: 'monthly',
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        recipients: ['ceo@adivirtus.ai', 'hr@adivirtus.ai'],
        isActive: true
      },
      {
        id: '2',
        templateId: 'compliance-report',
        name: 'Quarterly Compliance Review',
        frequency: 'quarterly',
        nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        recipients: ['compliance@adivirtus.ai', 'legal@adivirtus.ai'],
        isActive: true
      }
    ]
    setScheduledReports(scheduled)
  }

  const handleGenerateReport = async (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId)
    if (!template) return

    setIsGenerating(templateId)

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        type: template.type,
        generatedAt: new Date(),
        size: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 9)}MB`,
        format: 'pdf',
        status: 'ready',
        downloadUrl: `/reports/${templateId}-${Date.now()}.pdf`
      }

      setGeneratedReports(prev => [newReport, ...prev])
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGenerating(null)
    }
  }

  const exportData = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!data) return

    try {
      // Create a simple CSV export
      if (format === 'csv') {
        const csvData = `Organization,${organizationName}\nOverall Competency,${data.overview.overall_competency}%\nTechnical Coverage,${data.overview.technical_coverage}%\nSoft Skills Coverage,${data.overview.soft_skill_coverage}%\nDomain Coverage,${data.overview.domain_coverage}%\nSOP Coverage,${data.overview.sop_coverage}%`
        
        const blob = new Blob([csvData], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `hr-analytics-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error(`Error exporting ${format}:`, error)
    }
  }

  if (!data) {
    return (
      <div className="p-8 rounded-3xl backdrop-blur-xl border border-gray-600/30 text-center"
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
          No Data Available for Reports
        </h3>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Complete skill assessments to generate comprehensive reports.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={cardVariants}>
        <h2 className={utils.cn('text-2xl font-light tracking-tight', tw.text.primary)}>
          📊 Reports & Analytics Export
        </h2>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Generate comprehensive reports and export data for strategic decision making
        </p>
      </motion.div>

      {/* Export Options */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-8 h-8 text-green-400" />
            <h3 className={utils.cn('font-semibold', tw.text.primary)}>Export CSV</h3>
          </div>
          <p className={utils.cn('text-sm mb-4', tw.text.secondary)}>
            Download raw data in CSV format for analysis
          </p>
          <button
            onClick={() => exportData('csv')}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
          >
            Download CSV
          </button>
        </div>

        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            <h3 className={utils.cn('font-semibold', tw.text.primary)}>Executive Summary</h3>
          </div>
          <p className={utils.cn('text-sm mb-4', tw.text.secondary)}>
            High-level overview for leadership
          </p>
          <button
            onClick={() => exportData('pdf')}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
          >
            Generate Report
          </button>
        </div>

        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-purple-400" />
            <h3 className={utils.cn('font-semibold', tw.text.primary)}>Scheduled Reports</h3>
          </div>
          <p className={utils.cn('text-sm mb-4', tw.text.secondary)}>
            Set up automated report generation
          </p>
          <button className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors">
            Configure Schedule
          </button>
        </div>
      </motion.div>

      {/* Summary Stats for Reports */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <h3 className={utils.cn('text-sm font-medium mb-2', tw.text.secondary)}>Overall Score</h3>
          <p className={utils.cn('text-3xl font-bold text-green-400', tw.typography.monoNumbers)}>
            {Math.round(data.overview.overall_competency)}%
          </p>
        </div>

        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <h3 className={utils.cn('text-sm font-medium mb-2', tw.text.secondary)}>Critical Gaps</h3>
          <p className={utils.cn('text-3xl font-bold text-red-400', tw.typography.monoNumbers)}>
            {Object.values(data.critical_gaps || {}).reduce((sum, gaps: any) => 
              sum + (Array.isArray(gaps) ? gaps.length : 0), 0)}
          </p>
        </div>

        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <h3 className={utils.cn('text-sm font-medium mb-2', tw.text.secondary)}>Coverage</h3>
          <p className={utils.cn('text-3xl font-bold text-blue-400', tw.typography.monoNumbers)}>
            {Math.round((data.overview.technical_coverage + data.overview.soft_skill_coverage + data.overview.domain_coverage + data.overview.sop_coverage) / 4)}%
          </p>
        </div>

        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <h3 className={utils.cn('text-sm font-medium mb-2', tw.text.secondary)}>Departments</h3>
          <p className={utils.cn('text-3xl font-bold text-purple-400', tw.typography.monoNumbers)}>
            {data.team_analytics?.length || 0}
          </p>
        </div>
      </motion.div>

      {/* Report Templates */}
      <motion.div variants={cardVariants}>
        <h3 className={utils.cn('text-xl font-light tracking-tight mb-6', tw.text.primary)}>
          Available Report Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTemplates.map((template) => (
            <ReportTemplateCard 
              key={template.id} 
              template={template} 
              onGenerate={handleGenerateReport}
            />
          ))}
        </div>
      </motion.div>

      {/* Recent Reports */}
      {generatedReports.length > 0 && (
        <motion.div variants={cardVariants}>
          <h3 className={utils.cn('text-xl font-light tracking-tight mb-6', tw.text.primary)}>
            Recent Reports
          </h3>
          <div className="space-y-4">
            {generatedReports.slice(0, 5).map((report) => (
              <RecentReportCard key={report.id} report={report} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Generating Status */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="p-8 rounded-3xl backdrop-blur-xl border border-gray-600/30 text-center"
               style={{ background: 'rgba(10, 10, 12, 0.9)' }}>
            <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
              Generating Report
            </h3>
            <p className={utils.cn('text-sm', tw.text.secondary)}>
              Please wait while we compile your report...
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
} 