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

export default function GrowthVelocityTracker() {
  return (
    <motion.div 
      variants={itemVariants}
      className="p-6 rounded-2xl backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 12, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(34, 197, 94, 0.1)'
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg"
             style={{
               background: 'rgba(34, 197, 94, 0.15)',
               border: '1px solid rgba(34, 197, 94, 0.2)',
             }}>
          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className={utils.cn(tw.text.primary, "text-xl font-medium")}>
          Growth Velocity Tracker
        </h3>
      </div>
      
      <p className={utils.cn(tw.text.secondary, "text-sm mb-4")}>
        Monitor your skill development acceleration over time
      </p>
      
      <div className="space-y-3">
        <div className="p-3 rounded-lg"
             style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className={utils.cn(tw.text.primary, "text-sm font-medium")}>
              Learning Velocity
            </span>
            <span className="text-green-400 text-xs px-2 py-1 bg-green-500/10 rounded-full">
              High
            </span>
          </div>
          <p className={utils.cn(tw.text.tertiary, "text-xs")}>
            Track your skill acquisition speed and optimization
          </p>
        </div>
        
        <div className="p-3 rounded-lg"
             style={{ background: 'rgba(251, 191, 36, 0.05)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className={utils.cn(tw.text.primary, "text-sm font-medium")}>
              Milestone Progress
            </span>
            <span className="text-yellow-400 text-xs px-2 py-1 bg-yellow-500/10 rounded-full">
              75%
            </span>
          </div>
          <p className={utils.cn(tw.text.tertiary, "text-xs")}>
            Progress towards your next skill development milestone
          </p>
        </div>
      </div>
    </motion.div>
  )
} 