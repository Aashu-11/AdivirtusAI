'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TechnicalCompetencyHeader from '@/components/technical-competency/TechnicalCompetencyHeader'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { Wrench, Clock } from 'lucide-react'

export default function TechnicalCompetencyAssessmentPage() {
  return (
    <div className={utils.cn("min-h-screen", tw.bg.gradient, tw.text.primary)} style={{ fontFamily: fonts.primary }}>
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 sm:space-y-8"
        >
          <TechnicalCompetencyHeader 
            title="Technical Assessment"
            description="Our assessment tool is being crafted to help you showcase your skills"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={utils.cn(
              components.card.primary,
              "relative overflow-hidden"
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex flex-col xs:flex-row xs:items-start gap-4 mb-6">
              <div className={utils.cn(components.iconContainer.amber, "flex-shrink-0")}>
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className={utils.cn(tw.typography.sectionHeading, "mb-2")}>
                  Coming Soon
                </h2>
                <p className={utils.cn(tw.typography.bodyText, "leading-relaxed")}>
                  We're building something amazing for you!
                </p>
              </div>
            </div>
            
            <div className={utils.cn(
              components.card.nested,
              tw.bgAccent.emerald,
              tw.border.emerald,
              "relative overflow-hidden"
            )}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -z-10"></div>
              
              <div className="flex flex-col xs:flex-row xs:items-start gap-3">
                <div className={utils.cn(components.iconContainer.emerald, "flex-shrink-0 w-8 h-8")}>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className={utils.cn(tw.typography.cardHeading, "mb-2")}>
                    In Development
                  </h3>
                  <p className={utils.cn(tw.typography.bodyText, "text-sm leading-relaxed")}>
                    The technical competency assessment is currently under development. 
                    We're building a comprehensive tool to help you evaluate and showcase your technical skills.
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={utils.cn(components.badge.emerald, "px-3 py-1 rounded-full text-xs")}>
                      Assessment Engine
                    </span>
                    <span className={utils.cn(components.badge.blue, "px-3 py-1 rounded-full text-xs")}>
                      Skill Analysis
                    </span>
                    <span className={utils.cn(components.badge.amber, "px-3 py-1 rounded-full text-xs")}>
                      Progress Tracking
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
} 