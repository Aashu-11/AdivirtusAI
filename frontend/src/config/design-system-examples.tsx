/**
 * Design System Usage Examples
 * Demonstrates how to use the centralized design system configuration
 */

import React from 'react';
import { motion } from 'framer-motion';
import designSystem, { 
  colors, 
  fonts, 
  tw, 
  components, 
  animations, 
  utils 
} from './design-system';

// === EXAMPLE 1: Using Raw Color Values ===
export const ColorExample: React.FC = () => {
  return (
    <div style={{ 
      backgroundColor: colors.background.card,
      color: colors.text.primary,
      fontFamily: fonts.primary 
    }}>
      <h1 style={{ color: colors.blue.primary }}>
        Using Raw Color Values
      </h1>
      <p style={{ color: colors.text.secondary }}>
        This text uses secondary color from the design system
      </p>
    </div>
  );
};

// === EXAMPLE 2: Using Tailwind CSS Classes ===
export const TailwindExample: React.FC = () => {
  return (
    <div className={`${tw.bg.card} ${tw.text.primary} p-6 rounded-2xl ${tw.border.primary} border`} 
         style={{ fontFamily: fonts.primary }}>
      <h1 className={`${tw.typography.mainHeading} ${tw.text.blue}`}>
        Using Tailwind Classes
      </h1>
      <p className={tw.typography.bodyText}>
        This uses predefined typography and color classes
      </p>
    </div>
  );
};

// === EXAMPLE 3: Using Component Variants ===
export const ComponentExample: React.FC = () => {
  return (
    <div style={{ fontFamily: fonts.primary }}>
      {/* Primary Card */}
      <div className={components.card.primary}>
        <h2 className={tw.typography.sectionHeading}>Primary Card</h2>
         
        {/* Nested Card */}
        <div className={components.card.nested}>
          <p className={tw.typography.bodyText}>Nested content area</p>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <button className={components.button.primary}>
            Primary Button
          </button>
          <button className={components.button.secondary}>
            Secondary Button
          </button>
        </div>
        
        {/* Badges */}
        <div className="flex gap-2 mt-4">
          <span className={components.badge.blue}>Blue Badge</span>
          <span className={components.badge.emerald}>Success Badge</span>
          <span className={components.badge.amber}>Warning Badge</span>
          <span className={components.badge.rose}>Error Badge</span>
        </div>
        
        {/* Icon Containers */}
        <div className="flex gap-2 mt-4">
          <div className={components.iconContainer.blue}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className={components.iconContainer.emerald}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

// === EXAMPLE 4: Using Framer Motion Animations ===
export const AnimationExample: React.FC = () => {
  return (
    <div style={{ fontFamily: fonts.primary }}>
      <motion.div
        variants={animations.framerMotion.container}
        initial="hidden"
        animate="visible"
        className={components.card.primary}
      >
        <motion.h2 
          variants={animations.framerMotion.item}
          className={tw.typography.sectionHeading}
        >
          Animated Section
        </motion.h2>
        
        <motion.div 
          variants={animations.framerMotion.item}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <motion.div 
            variants={animations.framerMotion.item}
            className={components.card.nested}
          >
            <p className={tw.typography.bodyText}>Animated card 1</p>
          </motion.div>
          
          <motion.div 
            variants={animations.framerMotion.item}
            className={components.card.nested}
          >
            <p className={tw.typography.bodyText}>Animated card 2</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// === EXAMPLE 5: Using Utility Functions ===
export const UtilityExample: React.FC = () => {
  // Combine classes safely
  const cardClasses = utils.cn(
    components.card.primary,
    'hover:scale-105',
    animations.css.transition
  );
  
  // Get responsive classes
  const gridClasses = utils.cn(
    'grid',
    utils.responsive.mobile,
    utils.responsive.tablet,
    utils.responsive.desktop
  );
  
  return (
    <div style={{ fontFamily: fonts.primary }}>
      <div className={cardClasses}>
        <h2 className={tw.typography.sectionHeading}>Utility Functions</h2>
        
        <div className={gridClasses + ' gap-4'}>
          <div className={components.card.nested}>
            <span className={components.badge.blue}>Responsive</span>
          </div>
          <div className={components.card.nested}>
            <span className={components.badge.emerald}>Grid</span>
          </div>
          <div className={components.card.nested}>
            <span className={components.badge.amber}>Layout</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// === EXAMPLE 6: Theme-aware Component ===
interface ThemeAwareProps {
  isDark?: boolean;
}

export const ThemeAwareExample: React.FC<ThemeAwareProps> = ({ isDark = true }) => {
  const currentTheme = isDark ? designSystem.themes.dark : designSystem.themes.light;
  
  return (
    <div 
      style={{ 
        backgroundColor: currentTheme.background.card,
        color: currentTheme.text.primary,
        fontFamily: fonts.primary 
      }}
      className="p-6 rounded-2xl border"
    >
      <h2 style={{ color: currentTheme.blue.primary }}>
        Theme-Aware Component
      </h2>
      <p style={{ color: currentTheme.text.secondary }}>
        This component adapts to {isDark ? 'dark' : 'light'} theme
      </p>
      
      {/* Numbers with mono font */}
      <div className={tw.font.mono} style={{ color: currentTheme.text.primary }}>
        <strong>Statistics: 1,234 users</strong>
      </div>
    </div>
  );
};

// === COMPLETE USAGE EXAMPLE ===
export const CompleteExample: React.FC = () => {
  return (
    <div className={tw.bg.gradient} style={{ fontFamily: fonts.primary }}>
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Main Heading */}
        <h1 className={tw.typography.mainHeading}>
          Design System Showcase
        </h1>
        <p className={tw.typography.bodyText}>
          Complete example using the Adivirtus design system
        </p>
        
        {/* Grid Layout */}
        <motion.div
          variants={animations.framerMotion.container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
        >
          {/* Feature Card 1 */}
          <motion.div 
            variants={animations.framerMotion.item}
            className={components.card.primary}
          >
            <div className={components.iconContainer.blue + ' mb-4'}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={tw.typography.cardHeading}>Learning Styles</h3>
            <p className={tw.typography.bodyText}>
              Personalized learning recommendations
            </p>
            <span className={components.badge.blue}>Primary</span>
          </motion.div>
          
          {/* Feature Card 2 */}
          <motion.div 
            variants={animations.framerMotion.item}
            className={components.card.primary}
          >
            <div className={components.iconContainer.emerald + ' mb-4'}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <h3 className={tw.typography.cardHeading}>Progress Tracking</h3>
            <p className={tw.typography.bodyText}>
              Real-time learning analytics
            </p>
            <span className={components.badge.emerald}>Success</span>
          </motion.div>
          
          {/* Feature Card 3 */}
          <motion.div 
            variants={animations.framerMotion.item}
            className={components.card.primary}
          >
            <div className={components.iconContainer.amber + ' mb-4'}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h3 className={tw.typography.cardHeading}>Adaptive Content</h3>
            <p className={tw.typography.bodyText}>
              AI-powered content delivery
            </p>
            <span className={components.badge.amber}>High Priority</span>
          </motion.div>
        </motion.div>
        
        {/* Statistics Section */}
        <motion.div 
          variants={animations.framerMotion.item}
          className={components.card.primary + ' mt-8'}
        >
          <h2 className={tw.typography.sectionHeading}>Platform Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className={components.card.nested}>
              <div className={tw.typography.monoNumbers + ' text-2xl'}>1,234</div>
              <div className={tw.typography.smallLabel}>Active Users</div>
            </div>
            <div className={components.card.nested}>
              <div className={tw.typography.monoNumbers + ' text-2xl text-emerald-400'}>89%</div>
              <div className={tw.typography.smallLabel}>Success Rate</div>
            </div>
            <div className={components.card.nested}>
              <div className={tw.typography.monoNumbers + ' text-2xl text-blue-400'}>456</div>
              <div className={tw.typography.smallLabel}>Courses</div>
            </div>
            <div className={components.card.nested}>
              <div className={tw.typography.monoNumbers + ' text-2xl text-amber-400'}>12.5h</div>
              <div className={tw.typography.smallLabel}>Avg. Time</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CompleteExample; 