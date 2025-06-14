import { motion } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { Info } from 'lucide-react'

interface AssessmentHeaderProps {
  title: string
  description: string
}

export default function AssessmentHeader({ title, description }: AssessmentHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 sm:mb-10"
    >
      <div className="flex items-start">
        <div className="h-10 w-1 sm:h-12 sm:w-1.5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full mr-3 sm:mr-4 flex-shrink-0"></div>
        <div className="flex-1">
          <h1 className={utils.cn(tw.typography.mainHeading, "mb-3 sm:mb-4")}>
            {title}
          </h1>
          <p className={utils.cn(tw.typography.bodyText, "leading-relaxed max-w-3xl")}>
            {description}
          </p>
        </div>
      </div>
      
      <div className={utils.cn(
        "mt-6",
        components.card.nested,
        tw.bgAccent.blue,
        tw.border.blue,
        "relative overflow-hidden"
      )}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -z-10"></div>
        
        <div className="flex flex-col xs:flex-row xs:items-start gap-3">
          <div className={utils.cn(components.iconContainer.blue, "w-8 h-8 flex-shrink-0")}>
            <Info className="w-4 h-4" />
          </div>
          <p className={utils.cn(tw.typography.bodyText, "text-sm leading-relaxed")}>
            Please answer all questions truthfully for the most accurate assessment of your learning style. 
            Your responses help us tailor content to your specific preferences.
          </p>
        </div>
      </div>
    </motion.div>
  )
} 