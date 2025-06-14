'use client'

import { motion } from 'framer-motion';
import SkillRadarChart from './SkillRadarChart';
import AreasForImprovement from './AreasForImprovement';
import SkillsInProgress from './SkillsInProgress';
import { SkillMatrix } from '@/types/skills';
import { tw, fonts } from '@/config/design-system';

interface SkillMatrixOverviewProps {
  skillMatrix: SkillMatrix | null;
}

export default function SkillMatrixOverview({ skillMatrix }: SkillMatrixOverviewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full"
      style={{ fontFamily: fonts.primary }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-8"
      >
        <h2 className={tw.typography.sectionHeading + " mb-2"}>Skill Matrix Overview</h2>
        <p className={tw.typography.bodyText + " leading-relaxed"}>Your comprehensive skill development and learning progress dashboard</p>
      </motion.div>
      
      {/* Enhanced responsive grid with better spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="lg:col-span-1"
        >
          <SkillRadarChart skillMatrix={skillMatrix} />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="lg:col-span-1"
        >
          <AreasForImprovement skillMatrix={skillMatrix} />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="lg:col-span-1"
        >
          <SkillsInProgress skillMatrix={skillMatrix} />
        </motion.div>
      </div>
    </motion.div>
  );
} 