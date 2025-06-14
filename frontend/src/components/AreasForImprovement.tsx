'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SkillMatrix, SkillLevel } from '@/types/skills';
import { ArrowUpRight, Target } from 'lucide-react';
import Link from 'next/link';
import { tw, components, colors, fonts, utils } from '@/config/design-system';

interface AreasForImprovementProps {
  skillMatrix: SkillMatrix | null;
  numberOfGaps?: number;
}

interface SkillGap {
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
}

export default function AreasForImprovement({ skillMatrix, numberOfGaps = 3 }: AreasForImprovementProps) {
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);

  useEffect(() => {
    if (!skillMatrix) return;

    const allGaps: SkillGap[] = [];

    // Process each category in the skill matrix
    Object.keys(skillMatrix).forEach(category => {
      try {
        // Skip metadata contexts
        if (category === 'sop_context' || category === 'domain_knowledge_context') {
          return;
        }

        const categoryData = skillMatrix[category];
        let skills: SkillLevel[] = [];

        if (Array.isArray(categoryData)) {
          skills = categoryData;
        } else if (categoryData && 'skills' in categoryData && Array.isArray(categoryData.skills)) {
          skills = categoryData.skills;
        }

        // Find skills with gaps (where competency < competency_level)
        skills.forEach(skill => {
          if (!skill || !skill.name) return;

          const competency = skill.competency || 0;
          const targetLevel = skill.competency_level || 70; // Default target level

          if (competency < targetLevel) {
            const gap = targetLevel - competency;
            
            // Determine if this is a domain knowledge skill
            const isDomainKnowledge = category.toLowerCase().includes('domain_knowledge') || 
                                      skill.skill_type === 'domain_knowledge';
            
            allGaps.push({
              name: skill.name,
              category: isDomainKnowledge ? `${category} (Domain Knowledge)` : category,
              currentLevel: competency,
              targetLevel,
              gap
            });
          }
        });
      } catch (error) {
        console.error(`Error processing category: ${category}`, error);
      }
    });

    // Sort gaps by gap size (largest first) and take top N
    const topGaps = [...allGaps]
      .sort((a, b) => b.gap - a.gap)
      .slice(0, numberOfGaps);

    setSkillGaps(topGaps);
  }, [skillMatrix, numberOfGaps]);

  if (skillGaps.length === 0) {
    return (
      <div className={utils.cn("w-full", components.card.primary)} style={{ fontFamily: fonts.primary }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={tw.typography.cardHeading}>Areas for Improvement</h3>
            <p className={utils.cn(tw.typography.smallLabel, "mt-1")}>Skills that need attention</p>
          </div>
          <div className={components.iconContainer.emerald}>
            <Target className="w-5 h-5" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className={utils.cn(components.iconContainer.emerald, "w-16 h-16 mb-6")}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className={utils.cn(tw.text.primary, "font-medium text-base mb-2")}>Excellent Progress!</p>
          <p className={utils.cn(tw.typography.bodyText, "text-center leading-relaxed")}>No significant skill gaps identified. Keep up the great work and continue advancing your expertise.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={utils.cn("w-full", components.card.primary, tw.hover.subtle, "transition-all duration-300")} style={{ fontFamily: fonts.primary }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={tw.typography.cardHeading}>Areas for Improvement</h3>
          <p className={utils.cn(tw.typography.smallLabel, "mt-1")}>Priority skills requiring attention</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={components.iconContainer.rose}>
            <Target className="w-5 h-5" />
          </div>
          <Link 
            href="/skill-gap-analysis" 
            className={utils.cn(tw.text.blue, "text-xs font-medium flex items-center", tw.hover.blue, "transition-colors duration-200 group")}
          >
            View All
            <ArrowUpRight className="w-3 h-3 ml-1 group-hover:transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </div>
      <div className="space-y-4">
        {skillGaps.map((gap, index) => (
          <motion.div 
            key={`${gap.name}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={utils.cn(components.card.nested, tw.hover.subtle, "transition-all duration-300")}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h4 className={utils.cn(tw.text.primary, "font-medium text-sm truncate")}>{gap.name}</h4>
                <p className={utils.cn(tw.typography.smallLabel, "mt-1 capitalize")}>{gap.category}</p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className={utils.cn(components.badge.rose, "px-3 py-1.5 rounded-full text-xs font-medium")}>
                  <span style={{ fontFamily: fonts.mono }}>
                    {gap.gap}% gap
                  </span>
                </div>
              </div>
            </div>
            <div className={utils.cn("w-full h-2 rounded-full overflow-hidden", tw.bg.nested)}>
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${gap.currentLevel}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className={tw.typography.smallLabel}>
                Current: <span className={utils.cn(tw.text.blue, "font-medium")} style={{ fontFamily: fonts.mono }}>{gap.currentLevel}%</span>
              </span>
              <span className={tw.typography.smallLabel}>
                Target: <span className={utils.cn(tw.text.emerald, "font-medium")} style={{ fontFamily: fonts.mono }}>{gap.targetLevel}%</span>
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 