'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { SkillMatrix, SkillLevel } from '@/types/skills';
import Link from 'next/link';
import { tw, components, colors, fonts, utils, animations } from '@/config/design-system';

interface SkillsInProgressProps {
  skillMatrix: SkillMatrix | null;
  numberOfSkills?: number;
}

interface ProgressSkill {
  name: string;
  progress: number;
  category: string;
  status: 'in-progress' | 'completed' | 'just-started';
}

export default function SkillsInProgress({ skillMatrix, numberOfSkills = 3 }: SkillsInProgressProps) {
  const [progressSkills, setProgressSkills] = useState<ProgressSkill[]>([]);

  // Helper function to determine the skill status based on progress
  const getSkillStatus = (progress: number): 'in-progress' | 'completed' | 'just-started' => {
    if (progress >= 90) return 'completed';
    if (progress >= 30) return 'in-progress';
    return 'just-started';
  };

  useEffect(() => {
    if (!skillMatrix) return;

    const allSkills: ProgressSkill[] = [];

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

        // Process skills and get their progress
        skills.forEach(skill => {
          if (!skill || !skill.name) return;

          const competency = skill.competency || 0;
          const targetLevel = skill.competency_level || 70; // Default target level

          // Calculate progress as a percentage of the target
          let progress = Math.round((competency / targetLevel) * 100);
          if (progress > 100) progress = 100; // Cap at 100%

          // Determine if this is a domain knowledge skill for categorization
          const isDomainKnowledge = category.toLowerCase().includes('domain_knowledge') || 
                                    skill.skill_type === 'domain_knowledge';

          // Add to the skills array
          allSkills.push({
            name: skill.name,
            progress,
            category: isDomainKnowledge ? `${category} (Domain Knowledge)` : category,
            status: getSkillStatus(progress)
          });
        });
      } catch (error) {
        console.error(`Error processing category: ${category}`, error);
      }
    });

    // Filter for in-progress skills (between 30% and 90%)
    // If not enough in-progress skills, include just-started ones too
    let inProgressSkills = allSkills.filter(skill => skill.status === 'in-progress');
    
    if (inProgressSkills.length < numberOfSkills) {
      const justStarted = allSkills.filter(skill => skill.status === 'just-started');
      inProgressSkills = [...inProgressSkills, ...justStarted];
    }

    // Sort by progress (highest first) and take top N
    const topSkills = inProgressSkills
      .sort((a, b) => b.progress - a.progress)
      .slice(0, numberOfSkills);

    setProgressSkills(topSkills);
  }, [skillMatrix, numberOfSkills]);

  // Helper function to determine the progress color
  const getProgressColor = (status: 'in-progress' | 'completed' | 'just-started') => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-emerald-400 to-emerald-600';
      case 'in-progress': return 'bg-gradient-to-r from-blue-400 to-blue-600';
      case 'just-started': return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-600';
    }
  };

  // Helper function to get status badge colors
  const getStatusBadgeColor = (status: 'in-progress' | 'completed' | 'just-started') => {
    switch (status) {
      case 'completed': return components.badge.emerald;
      case 'in-progress': return components.badge.blue;
      case 'just-started': return components.badge.amber;
      default: return components.badge.blue;
    }
  };

  if (progressSkills.length === 0) {
    return (
      <div className={utils.cn("w-full", components.card.primary)} style={{ fontFamily: fonts.primary }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={tw.typography.cardHeading}>Skills In Progress</h3>
            <p className={utils.cn(tw.typography.smallLabel, "mt-1")}>Active learning journey</p>
          </div>
          <div className={components.iconContainer.blue}>
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className={utils.cn(components.iconContainer.blue, "w-16 h-16 mb-6", tw.border.primary)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className={utils.cn(tw.text.primary, "font-medium text-base mb-2")}>Ready to Begin</p>
          <p className={utils.cn(tw.typography.bodyText, "text-center leading-relaxed mb-6")}>No skills in active development. Start your learning journey today!</p>
          <Link 
            href="/technical-assessment" 
            className={utils.cn(components.button.primary, "inline-flex items-center shadow-xl shadow-blue-500/20", animations.css.tap)}
          >
            Start Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={utils.cn("w-full", components.card.primary, tw.hover.subtle, "transition-all duration-300")} style={{ fontFamily: fonts.primary }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={tw.typography.cardHeading}>Skills In Progress</h3>
          <p className={utils.cn(tw.typography.smallLabel, "mt-1")}>Currently developing competencies</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={components.iconContainer.blue}>
            <Zap className="w-5 h-5" />
          </div>
          <Link 
            href="/learning-profile" 
            className={utils.cn(tw.text.blue, "text-xs font-medium flex items-center", tw.hover.blue, "transition-colors duration-200 group")}
          >
            Learning Profile
            <ArrowRight className="w-3 h-3 ml-1 group-hover:transform group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </div>
      <div className="space-y-4">
        {progressSkills.map((skill, index) => (
          <motion.div 
            key={`${skill.name}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={utils.cn(components.card.nested, tw.hover.subtle, "transition-all duration-300")}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h4 className={utils.cn(tw.text.primary, "font-medium text-sm truncate")}>{skill.name}</h4>
                <p className={utils.cn(tw.typography.smallLabel, "mt-1 capitalize")}>{skill.category}</p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className={utils.cn(getStatusBadgeColor(skill.status), "px-3 py-1.5 rounded-full")}>
                  <span className="text-xs font-medium" style={{ fontFamily: fonts.mono }}>
                    {skill.progress}%
                  </span>
                </div>
              </div>
            </div>
            <div className={utils.cn("w-full h-2 rounded-full overflow-hidden", tw.bg.nested)}>
              <div 
                className={`h-full ${getProgressColor(skill.status)} rounded-full transition-all duration-500`}
                style={{ width: `${skill.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className={tw.typography.smallLabel}>
                Status: <span className={`font-medium ${
                  skill.status === 'completed' ? tw.text.emerald : 
                  skill.status === 'in-progress' ? tw.text.blue : 
                  tw.text.amber
                }`}>
                  {skill.status === 'completed' ? 'Nearly Mastered' : 
                  skill.status === 'in-progress' ? 'Developing' : 
                  'Just Started'}
                </span>
              </span>
              <span className={tw.typography.smallLabel}>
                Target: <span className={utils.cn(tw.text.emerald, "font-medium")} style={{ fontFamily: fonts.mono }}>100%</span>
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 