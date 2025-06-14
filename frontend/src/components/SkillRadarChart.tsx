'use client'

import { useEffect, useState } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { SkillMatrix, SkillLevel } from '@/types/skills';
import { TrendingUp } from 'lucide-react';
import { tw, components, colors, fonts, utils } from '@/config/design-system';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface SkillRadarChartProps {
  skillMatrix: SkillMatrix | null;
  numberOfSkills?: number;
}

export default function SkillRadarChart({ skillMatrix, numberOfSkills = 5 }: SkillRadarChartProps) {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[];
  } | null>(null);

  useEffect(() => {
    if (!skillMatrix) return;

    // Flatten all skills from all categories
    const allSkills: SkillLevel[] = [];
    Object.keys(skillMatrix).forEach(category => {
      try {
        // Skip metadata contexts
        if (category === 'sop_context' || category === 'domain_knowledge_context') {
          return;
        }

        const categoryData = skillMatrix[category];
        if (Array.isArray(categoryData)) {
          // Format: {category: SkillLevel[]}
          allSkills.push(...categoryData);
        } else if (categoryData && 'skills' in categoryData && Array.isArray(categoryData.skills)) {
          // Format: {category: {skills: SkillLevel[]}}
          allSkills.push(...categoryData.skills);
        }
      } catch (error) {
        console.error(`Error processing category: ${category}`, error);
      }
    });

    // Sort skills by competency (highest first) and take top N
    const topSkills = [...allSkills]
      .filter(skill => skill && skill.name && typeof skill.competency === 'number')
      .sort((a, b) => (b.competency || 0) - (a.competency || 0))
      .slice(0, numberOfSkills);

    // Prepare chart data
    if (topSkills.length > 0) {
      setChartData({
        labels: topSkills.map(skill => skill.name),
        datasets: [
          {
            label: 'Skill Competency',
            data: topSkills.map(skill => skill.competency || 0),
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderColor: 'rgba(59, 130, 246, 0.8)',
            borderWidth: 2,
          },
        ],
      });
    }
  }, [skillMatrix, numberOfSkills]);

  if (!chartData) {
    return (
      <div className={utils.cn("w-full h-[350px] flex items-center justify-center", components.card.primary)}>
        <div className="text-center">
          <div className={utils.cn(components.iconContainer.blue, "mb-4 mx-auto")}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className={utils.cn(tw.text.secondary, "font-medium")}>No skill data available</p>
          <p className={utils.cn(tw.typography.smallLabel, "mt-1")}>Complete an assessment to see your radar chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className={utils.cn("w-full", components.card.primary, tw.hover.subtle, "transition-all duration-300")} style={{ fontFamily: fonts.primary }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={tw.typography.cardHeading}>Top Skills Overview</h3>
          <p className={utils.cn(tw.typography.smallLabel, "mt-1")}>Your strongest competency areas</p>
        </div>
        <div className={components.iconContainer.blue}>
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>
      <div className="h-[300px] flex items-center justify-center">
        <Radar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: colors.background.card,
                titleColor: colors.text.primary,
                bodyColor: colors.text.secondary,
                borderColor: colors.border.primary,
                borderWidth: 1,
                titleFont: {
                  family: fonts.primary,
                  size: 13,
                  weight: 600,
                },
                bodyFont: {
                  family: fonts.mono,
                  size: 12,
                },
                callbacks: {
                  label: function(context) {
                    return `${context.parsed.r}% competency`;
                  }
                }
              },
            },
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20,
                  color: 'rgb(107, 114, 128)',
                  backdropColor: 'transparent',
                  font: {
                    family: fonts.mono,
                    size: 10,
                  },
                  callback: function(value) {
                    return value + '%';
                  }
                },
                grid: {
                  color: colors.border.primary,
                },
                pointLabels: {
                  color: 'rgb(156, 163, 175)',
                  font: {
                    family: fonts.primary,
                    size: 11,
                    weight: 500,
                  },
                },
                angleLines: {
                  color: colors.border.primary,
                },
              },
            },
            elements: {
              point: {
                radius: 4,
                backgroundColor: colors.blue.primary,
                borderColor: colors.blue.secondary,
                borderWidth: 2,
              },
              line: {
                borderWidth: 2,
              },
            },
          }}
        />
      </div>
    </div>
  );
} 