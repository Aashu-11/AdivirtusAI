'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown, Settings, TrendingUp, Award, Target, BookOpen, BarChart3, Clock, Calendar, ArrowUpRight } from 'lucide-react'

import InteractiveSkillTree from '@/components/InteractiveSkillTree'
import { SkillMatrix, GapSummary } from '@/types/skills'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'

// Create a custom notification component
function Notification({ message, type, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -50, x: "-50%" }}
      className={utils.cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-50 backdrop-blur-xl font-medium",
        tw.text.primary,
        type === 'success' 
          ? `${tw.bgAccent.emerald} border ${tw.border.emerald}` 
          : `${tw.bgAccent.rose} border ${tw.border.rose}`
      )}
      style={{ fontFamily: fonts.primary }}
    >
      <div className="flex items-center">
        <span>{message}</span>
        <button onClick={onDismiss} className={utils.cn("ml-4 transition-colors", tw.text.primary, "hover:opacity-80")}>
          ×
        </button>
      </div>
    </motion.div>
  )
}

// Enhanced Circular Progress Component
function CircularProgress({ percentage, size = 80, strokeWidth = 8, color = colors.blue.primary, label = "" }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border.subtle}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={tw.typography.monoNumbers + " text-sm"}>
          {percentage}%
        </span>
        {label && (
          <span className={tw.text.tertiary + " text-xs mt-1"}>{label}</span>
        )}
      </div>
    </div>
  );
}





interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

interface UserData {
  job_title?: string | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [gapSummary, setGapSummary] = useState<GapSummary | null>(null);
  const [skillMatrix, setSkillMatrix] = useState<SkillMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Mock learning activities for demonstration
  const recentActivities = [
    { title: "Advanced React Patterns", timestamp: "2 hours ago", progress: 78 },
    { title: "System Design Fundamentals", timestamp: "1 day ago", progress: 45 },
    { title: "TypeScript Deep Dive", timestamp: "3 days ago", progress: 92 },
  ];

  // Add click outside handler to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Helper function to get skills from a category (handles both formats)
  const getSkillsFromCategory = (matrix: SkillMatrix, category: string) => {
    if (!matrix || !category || !(category in matrix)) {
      console.warn(`Category "${category}" not found in matrix`);
      return [];
    }
    
    const categoryData = matrix[category];
    
    if (Array.isArray(categoryData)) {
      // Alternative format: {"category": [...skills]}
      return categoryData.map(skill => {
        if (typeof skill !== 'object' || skill === null) {
          return { name: 'Unknown Skill', competency: 0, competency_level: 0 };
        }
        
        // Ensure competency is a number
        if (skill.competency === undefined || skill.competency === null) {
          skill.competency = 0;
        }
        
        // Handle case where competency might be a string
        const competency = typeof skill.competency === 'string' 
          ? parseInt(skill.competency, 10) 
          : skill.competency;
        
        // Extract competency_level if available, otherwise default to competency
        let competency_level = skill.competency_level;
        if (competency_level === undefined || competency_level === null) {
          competency_level = 70; // Default value if competency_level is missing
        }
        
        // Handle case where competency_level might be a string
        if (typeof competency_level === 'string') {
          competency_level = parseInt(competency_level, 10);
        }
        
        return { 
          ...skill, 
          competency: isNaN(competency) ? 0 : competency,
          competency_level: isNaN(competency_level) ? 70 : competency_level
        };
      });
    } else if (categoryData && typeof categoryData === 'object') {
      if ('skills' in categoryData && Array.isArray(categoryData.skills)) {
        // Standard format: {"category": {"skills": [...skills]}}
        return (categoryData.skills || []).map(skill => {
          if (typeof skill !== 'object' || skill === null) {
            return { name: 'Unknown Skill', competency: 0, competency_level: 0 };
          }
          
          // Ensure competency is a number
          if (skill.competency === undefined || skill.competency === null) {
            skill.competency = 0;
          }
          
          // Handle case where competency might be a string
          const competency = typeof skill.competency === 'string' 
            ? parseInt(skill.competency, 10) 
            : skill.competency;
          
          // Extract competency_level if available, otherwise default to competency
          let competency_level = skill.competency_level;
          if (competency_level === undefined || competency_level === null) {
            competency_level = 70; // Default value if competency_level is missing
          }
          
          // Handle case where competency_level might be a string
          if (typeof competency_level === 'string') {
            competency_level = parseInt(competency_level, 10);
          }
          
          return { 
            ...skill, 
            competency: isNaN(competency) ? 0 : competency,
            competency_level: isNaN(competency_level) ? 70 : competency_level
          };
        });
      } else {
        // Try to interpret the object itself as a skill if it has a name and competency
        if ('name' in categoryData) {
          let competency = 0;
          if ('competency' in categoryData) {
            competency = typeof categoryData.competency === 'string' 
              ? parseInt(categoryData.competency as string, 10) 
              : (categoryData.competency as number || 0);
          }
          
          // Extract competency_level if available
          let competency_level = categoryData.competency_level;
          if (competency_level === undefined || competency_level === null) {
            competency_level = 70; // Default value if competency_level is missing
          }
          
          // Handle case where competency_level might be a string
          if (typeof competency_level === 'string') {
            competency_level = parseInt(competency_level as string, 10);
          }
          
          return [{ 
            ...categoryData as any, 
            competency: isNaN(competency) ? 0 : competency,
            competency_level: isNaN(competency_level) ? 70 : competency_level
          }];
        }
      }
    }
    
    return [];
  };

  // Function to calculate skill gap summary from a skill matrix
  const calculateGapSummary = (skillMatrix: SkillMatrix | null): GapSummary => {
    if (!skillMatrix) {
      return {
        total_gaps: 0,
        priority_gaps: 0,
        average_competency: 0,
        technical_gaps: 0,
        soft_skill_gaps: 0,
        domain_knowledge_gaps: 0,
        sop_gaps: 0,
        skills_with_gaps: 0,
        total_skills: 0,
        technical_skills: 0,
        soft_skills: 0,
        domain_knowledge_skills: 0,
        last_gap_analysis: undefined
      };
    }
    
    let totalSkills = 0;
    let skillsWithGaps = 0;
    let technicalSkills = 0;
    let softSkills = 0;
    let domainKnowledgeSkills = 0;
    let competencySum = 0;
    
    // Process each category in the skill matrix
    Object.entries(skillMatrix).forEach(([categoryName, categoryData]) => {
      // Skip metadata contexts
      if (categoryName === 'sop_context' || categoryName === 'domain_knowledge_context') {
        return;
      }
      
      const categorySkills = getSkillsFromCategory(skillMatrix, categoryName);
      
      // Skip empty categories
      if (!categorySkills || categorySkills.length === 0) return;
      
      // Determine skill category type
      const isSoftSkills = ['soft_skills', 'communication', 'leadership', 'teamwork', 'management']
        .some(soft_cat => categoryName.toLowerCase().includes(soft_cat));
      const isDomainKnowledge = categoryName.toLowerCase().includes('domain_knowledge');
      
      // Process each skill
      categorySkills.forEach(skill => {
        if (!skill) return;
        
        totalSkills++;
        
        // Count by skill type
        if (isDomainKnowledge) {
          domainKnowledgeSkills++;
        } else if (isSoftSkills) {
          softSkills++;
        } else {
          technicalSkills++;
        }
        
        const competency = skill.competency || 0;
        competencySum += competency;
        
        // Check if this skill has low competency (gap)
        if (competency < 70) {
          skillsWithGaps++;
        }
      });
    });
    
    return {
      total_gaps: skillsWithGaps,
      priority_gaps: skillsWithGaps, // Assuming all gaps are priority for now
      average_competency: totalSkills > 0 ? Math.round((competencySum / totalSkills) * 10) / 10 : 0,
      technical_gaps: technicalSkills,
      soft_skill_gaps: softSkills,
      domain_knowledge_gaps: domainKnowledgeSkills,
      sop_gaps: 0,
      skills_with_gaps: skillsWithGaps,
      total_skills: totalSkills,
      technical_skills: technicalSkills,
      soft_skills: softSkills,
      domain_knowledge_skills: domainKnowledgeSkills,
      last_gap_analysis: undefined // This would come from the database if available
    };
  };

  // NEW: Function to calculate gap summary from dashboard (category-specific arrays)
  const calculateGapSummaryFromDashboard = (dashboard: any): GapSummary => {
    if (!dashboard) {
      return {
        total_gaps: 0,
        priority_gaps: 0,
        average_competency: 0,
        technical_gaps: 0,
        soft_skill_gaps: 0,
        domain_knowledge_gaps: 0,
        sop_gaps: 0,
        skills_with_gaps: 0,
        total_skills: 0,
        technical_skills: 0,
        soft_skills: 0,
        domain_knowledge_skills: 0,
        last_gap_analysis: undefined
      };
    }

    // Use summary if available (most accurate)
    if (dashboard.summary) {
      const technicalGaps = dashboard.technical_skill_gaps || [];
      const softGaps = dashboard.soft_skill_gaps || [];
      const domainGaps = dashboard.domain_knowledge_gaps || [];
      const sopGaps = dashboard.sop_skill_gaps || [];
      
      const totalGaps = technicalGaps.length + softGaps.length + domainGaps.length + sopGaps.length;
      const priorityGaps = [...technicalGaps, ...softGaps, ...domainGaps, ...sopGaps]
        .filter(gap => gap.competency < 60).length;
      
      return {
        total_gaps: totalGaps,
        priority_gaps: priorityGaps,
        average_competency: dashboard.summary.average_competency || 0,
        technical_gaps: technicalGaps.length,
        soft_skill_gaps: softGaps.length,
        domain_knowledge_gaps: domainGaps.length,
        sop_gaps: sopGaps.length,
        skills_with_gaps: dashboard.summary.skills_with_gaps || 0,
        total_skills: dashboard.summary.total_skills || 0,
        technical_skills: dashboard.summary.technical_skills || 0,
        soft_skills: dashboard.summary.soft_skills || 0,
        domain_knowledge_skills: dashboard.summary.domain_knowledge_skills || 0,
        last_gap_analysis: dashboard.generated_at || undefined
      };
    }

    // Fallback: Calculate from category-specific arrays
    const technicalGaps = dashboard.technical_skill_gaps || [];
    const softGaps = dashboard.soft_skill_gaps || [];
    const domainGaps = dashboard.domain_knowledge_gaps || [];
    const sopGaps = dashboard.sop_skill_gaps || [];
    
    const totalGaps = technicalGaps.length + softGaps.length + domainGaps.length + sopGaps.length;
    
    // Calculate average competency from gaps
    let competencySum = 0;
    let competencyCount = 0;
    
    [...technicalGaps, ...softGaps, ...domainGaps, ...sopGaps].forEach(gap => {
      if (gap.competency !== undefined) {
        competencySum += gap.competency;
        competencyCount++;
      }
    });
    
    const averageCompetency = competencyCount > 0 ? 
      Math.round((competencySum / competencyCount) * 10) / 10 : 0;
    
    const priorityGaps = [...technicalGaps, ...softGaps, ...domainGaps, ...sopGaps]
      .filter(gap => gap.competency < 60).length;
    
    return {
      total_gaps: totalGaps,
      priority_gaps: priorityGaps,
      average_competency: averageCompetency,
      technical_gaps: technicalGaps.length,
      soft_skill_gaps: softGaps.length,
      domain_knowledge_gaps: domainGaps.length,
      sop_gaps: sopGaps.length,
      skills_with_gaps: totalGaps,
      total_skills: totalGaps, // For gaps, this equals skills with gaps
      technical_skills: technicalGaps.length,
      soft_skills: softGaps.length,
      domain_knowledge_skills: domainGaps.length,
      last_gap_analysis: dashboard.generated_at || undefined
    };
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUser(user);
          
          // Try to get user data
          try {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('job_title')
              .eq('id', user.id)
              .single();
            
            if (userProfile) {
              setUserData(userProfile);
            }
          } catch (profileError) {
            console.log('No user profile found, using defaults');
          }
          
          // Try to get gap analysis data via the check-baseline endpoint
          try {
            const response = await fetch('/api/gap-analysis/check-baseline', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: user.id })
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('Gap analysis check response:', data);
              
              if (data.exists && data.baselineId) {
                console.log('Found existing baseline, fetching detailed data');
                
                // Try to get the detailed baseline data
                const { data: baselines } = await supabase
                  .from('baseline_skill_matrix')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('status', 'completed')
                  .order('created_at', { ascending: false })
                  .limit(1);
                
                if (baselines && baselines.length > 0) {
                  const latestBaseline = baselines[0];
                  const baselineId = latestBaseline.id;
                  
                  // If the baseline has a skill_matrix, use it directly to calculate gaps
                  if (latestBaseline.skill_matrix) {
                    console.log('Using skill_matrix from baseline directly');
                    const matrix = latestBaseline.skill_matrix as SkillMatrix;
                    setSkillMatrix(matrix);
                    const summary = calculateGapSummary(matrix);
                    
                    setGapSummary({
                      ...summary,
                      last_gap_analysis: latestBaseline.created_at
                    });
                    setLoading(false);
                    return;
                  }
                  
                  // Fallback: Fetch dashboard from the gap-analysis/bypass endpoint
                  console.log('Fetching full gap analysis data');
                  const dashRes = await fetch(`/api/gap-analysis/bypass?baseline_id=${baselineId}`);
                  if (dashRes.ok) {
                    const dashData = await dashRes.json();
                    
                    if (dashData.baseline_skill_matrix) {
                      // Calculate skill gaps from the baseline skill matrix
                      const matrix = dashData.baseline_skill_matrix as SkillMatrix;
                      setSkillMatrix(matrix);
                      const summary = calculateGapSummary(matrix);
                      
                      setGapSummary({
                        ...summary,
                        last_gap_analysis: dashData.analysis_completed_at || dashData.created_at || null
                      });
                    } else if (dashData.gap_analysis_dashboard?.summary) {
                      // Use the provided summary if available
                      const summary = dashData.gap_analysis_dashboard.summary;
                      const dashboardData = dashData.gap_analysis_dashboard;
                      setGapSummary({
                        total_gaps: (dashboardData.technical_skill_gaps?.length || 0) + 
                                   (dashboardData.soft_skill_gaps?.length || 0) + 
                                   (dashboardData.domain_knowledge_gaps?.length || 0) + 
                                   (dashboardData.sop_skill_gaps?.length || 0),
                        priority_gaps: [...(dashboardData.technical_skill_gaps || []), 
                                      ...(dashboardData.soft_skill_gaps || []), 
                                      ...(dashboardData.domain_knowledge_gaps || []), 
                                      ...(dashboardData.sop_skill_gaps || [])]
                                      .filter((gap: any) => gap.competency < 60).length,
                        average_competency: summary.average_competency || 0,
                        technical_gaps: dashboardData.technical_skill_gaps?.length || 0,
                        soft_skill_gaps: dashboardData.soft_skill_gaps?.length || 0,
                        domain_knowledge_gaps: dashboardData.domain_knowledge_gaps?.length || 0,
                        sop_gaps: dashboardData.sop_skill_gaps?.length || 0,
                        skills_with_gaps: summary.skills_with_gaps || 0,
                        total_skills: summary.total_skills || 0,
                        technical_skills: summary.technical_skills || 0,
                        soft_skills: summary.soft_skills || 0,
                        domain_knowledge_skills: summary.domain_knowledge_skills || 0,
                        last_gap_analysis: dashData.analysis_completed_at || dashData.created_at || undefined
                      });
                    }
                  } else {
                    console.error('Error fetching gap analysis data:', await dashRes.text());
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error in gap analysis:', err);
          }
        } else {
          // If no user is found, redirect to the sign-in page
          router.push('/auth/signin');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error);
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  if (loading) {
    return (
      <div className={utils.cn("min-h-screen flex items-center justify-center", tw.bg.primary)}>
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-blue-600/10 animate-pulse" />
        </div>
      </div>
    );
  }

  // If user is null and the app is not in a loading state,
  // we should show a signin button and message instead of
  // redirecting directly (as a fallback in case the useEffect redirect fails)
  if (!user) {
    return (
      <div className={utils.cn("min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-8 mx-auto">
            <span className={tw.typography.mainHeading + " text-4xl"} style={{ fontFamily: fonts.primary }}>A</span>
          </div>
          <h1 className={tw.typography.mainHeading + " mb-4"}>
            Welcome to Adivirtus AI
          </h1>
          <p className={tw.typography.bodyText + " mb-12 text-center max-w-md leading-relaxed"}>
            Discover your potential with personalized AI-powered learning experiences tailored just for you.
          </p>
          <Link 
            href="/auth/signin" 
            className={utils.cn(components.button.primary, "inline-flex items-center shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 active:scale-95")}
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    );
  }

  const name = user.user_metadata?.name || 'User';
  const jobTitle = userData?.job_title || 'Developer';
  const avatarUrl = user.user_metadata?.avatar_url;
  const email = user.email;
  const firstName = name.split(' ')[0];

  return (
    <div className={utils.cn("min-h-screen px-6 md:px-8 pt-4 pb-24 relative overflow-hidden", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
      {/* Ambient background effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/3 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/2 rounded-full blur-3xl" />
      
      {/* Enhanced iOS Style Navigation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute top-6 sm:top-8 right-6 sm:right-8 z-50"
        ref={menuRef}
      >
        <div className="relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={utils.cn(
              tw.bg.card, 
              "backdrop-blur-xl rounded-2xl px-4 py-3 border transition-all duration-300 shadow-2xl shadow-black/20",
              tw.border.primary,
              tw.hover.subtle
            )}
            aria-label="User menu"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className={tw.text.primary + " text-sm font-semibold"}>{name[0]}</span>
                )}
              </div>
              <span className={tw.text.primary + " text-sm font-medium hidden sm:block"}>{firstName}</span>
              <ChevronDown 
                className={utils.cn(
                  "w-4 h-4 transition-all duration-300",
                  tw.text.tertiary,
                  isUserMenuOpen ? 'transform rotate-180' : ''
                )} 
              />
            </div>
          </button>
          
          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={utils.cn(
                  "absolute right-0 mt-3 w-64 backdrop-blur-xl rounded-2xl shadow-2xl border overflow-hidden z-50",
                  tw.bg.card,
                  tw.border.primary
                )}
              >
                <div className="p-6 border-b border-white/[0.06]">
                  <p className={tw.text.primary + " text-base font-semibold"}>{name}</p>
                  <p className={tw.typography.smallLabel + " truncate mt-1"}>{email}</p>
                  {jobTitle && (
                    <div className="mt-3">
                      <span className={components.badge.blue}>
                        {jobTitle}
                      </span>
                    </div>
                  )}
                </div>
                <div className="py-2">
                  <Link 
                    href="/profile" 
                    className={utils.cn(
                      "flex items-center px-6 py-3 text-sm transition-all duration-200",
                      tw.text.secondary,
                      `hover:${tw.bg.nested}`,
                      tw.hover.subtle
                    )}
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4 mr-3" />
                    Profile Settings
                  </Link>
                  <Link 
                    href="/settings" 
                    className={utils.cn(
                      "flex items-center px-6 py-3 text-sm transition-all duration-200",
                      tw.text.secondary,
                      `hover:${tw.bg.nested} ${tw.hover.subtle}`
                    )}
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Preferences
                  </Link>
                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className={utils.cn(
                      "flex items-center w-full text-left px-6 py-3 text-sm transition-all duration-200",
                      tw.text.secondary,
                      tw.hover.rose
                    )}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Professional Header Section */}
      <div className="flex justify-between items-start mb-12 pt-20 sm:pt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start"
        >
          <div className="mb-4">
            <h1 className={tw.typography.mainHeading}>Welcome back, {firstName}!</h1>
          </div>
          <p className={tw.typography.bodyText + " leading-relaxed max-w-2xl"}>
            Comprehensive analysis of your technical competencies, skill development trajectory, and personalized learning recommendations powered by advanced AI assessment algorithms.
          </p>
        </motion.div>
      </div>

      <main className="space-y-8 pb-16 relative z-10">







        
        {/* Interactive Skill Tree */}
        {skillMatrix && <InteractiveSkillTree skillMatrix={skillMatrix} />}


      </main>

      {/* Professional Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={utils.cn("w-full text-center text-xs font-normal mt-12 py-6 border-t border-white/[0.04]", tw.text.tertiary)}
      >
        <div className="flex items-center justify-center space-x-4">
          <span style={{ fontFamily: fonts.mono }}>Adivirtus AI Platform v1.0.0</span>
          <span className={tw.text.tertiary}>|</span>
          <span>Professional Development Suite</span>
        </div>
      </motion.footer>
    </div>
  );
}
