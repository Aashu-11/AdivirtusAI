import { motion } from 'framer-motion'
import { tw, utils } from '@/config/design-system'

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
}

export default function SkillIntelligenceHub() {
  return (
    <motion.div 
      variants={itemVariants}
      className="p-6 rounded-2xl backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 12, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(59, 130, 246, 0.1)'
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg"
             style={{
               background: 'rgba(59, 130, 246, 0.15)',
               border: '1px solid rgba(59, 130, 246, 0.2)',
             }}>
          <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className={utils.cn(tw.text.primary, "text-xl font-medium")}>
          Skill Intelligence Hub
        </h3>
      </div>
      
      <p className={utils.cn(tw.text.secondary, "text-sm mb-4")}>
        AI-powered insights to accelerate your professional development
      </p>
      
      <div className="space-y-3">
        <div className="p-3 rounded-lg"
             style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className={utils.cn(tw.text.primary, "text-sm font-medium")}>
              Learning Recommendations
            </span>
            <span className="text-blue-400 text-xs px-2 py-1 bg-blue-500/10 rounded-full">
              AI Generated
            </span>
          </div>
          <p className={utils.cn(tw.text.tertiary, "text-xs")}>
            Personalized skill development pathways based on your profile
          </p>
        </div>
        
        <div className="p-3 rounded-lg"
             style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className={utils.cn(tw.text.primary, "text-sm font-medium")}>
              Market Intelligence
            </span>
            <span className="text-green-400 text-xs px-2 py-1 bg-green-500/10 rounded-full">
              Live Data
            </span>
          </div>
          <p className={utils.cn(tw.text.tertiary, "text-xs")}>
            Real-time industry trends and skill demand analytics
          </p>
        </div>
      </div>
    </motion.div>
  )
} 