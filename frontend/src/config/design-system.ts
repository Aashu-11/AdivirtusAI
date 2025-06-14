/**
 * Adivirtus AI Platform - Design System Configuration
 * Centralized design tokens for colors, typography, spacing, and theming
 */

// === FONT FAMILIES ===
export const fonts = {
  primary: "'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;
 
// === COLOR PALETTE ===
export const colors = {
  // Background Colors (keep for D3.js and style attributes)
  background: {
    primary: '#000000',           // Main background
    secondary: '#0A0A0A',         // Secondary background, gradient end
    card: '#0A0A0C',             // Main card containers
    nested: '#151519',           // Nested components, icon backgrounds
    interactive: '#101010',       // Interactive elements
  },
  
  // Accent Colors
  blue: {
    primary: '#3B82F6',          // Primary actions, links, focus states
    secondary: '#1D4ED8',        // Buttons, progress bars
    border: 'rgba(59, 130, 246, 0.3)',     // Blue border variant
    borderDark: 'rgba(29, 78, 216, 0.3)',  // Darker blue border
  },
  
  rose: {
    primary: '#F43F5E',          // Critical importance, errors
    secondary: '#E11D48',        // Critical progress, urgent states
    border: 'rgba(244, 63, 94, 0.3)',      // Rose border variant
    borderDark: 'rgba(225, 29, 72, 0.3)',  // Darker rose border
  },
  
  amber: {
    primary: '#F59E0B',          // High importance, warnings
    secondary: '#D97706',        // High priority progress
    border: 'rgba(245, 158, 11, 0.3)',     // Amber border variant
    borderDark: 'rgba(217, 119, 6, 0.3)',  // Darker amber border
  },
  
  emerald: {
    primary: '#10B981',          // Success states, completed items
    secondary: '#059669',        // Success progress, positive states
    border: 'rgba(16, 185, 129, 0.3)',     // Emerald border variant
    borderDark: 'rgba(5, 150, 105, 0.3)',  // Darker emerald border
  },
  
  // Text Colors (keep for D3.js and style attributes)
  text: {
    primary: '#FFFFFF',          // Primary text, headings
    secondary: '#9CA3AF',        // Secondary text, descriptions
    tertiary: '#6B7280',         // Subtle text, metadata
  },
  
  // Border & UI Colors (keep for D3.js and style attributes)
  border: {
    primary: 'rgba(156, 163, 175, 0.3)',   // Main borders
    secondary: 'rgba(107, 114, 128, 0.3)', // Secondary borders
    subtle: 'rgba(156, 163, 175, 0.1)',    // Very subtle borders
  },
  
  // Gradients
  gradient: {
    background: 'linear-gradient(to bottom, #000000, #0A0A0A)',
    blue: 'linear-gradient(to right, #3B82F6, #1D4ED8)',
    emerald: 'linear-gradient(to right, #10B981, #059669)',
    amber: 'linear-gradient(to right, #F59E0B, #D97706)',
    rose: 'linear-gradient(to right, #F43F5E, #E11D48)',
  },
} as const;

// === TAILWIND CSS CLASSES WITH THEME SUPPORT ===
export const tw = {
  // Background Classes - now with dark mode support
  bg: {
    primary: 'bg-black dark:bg-white',
    secondary: 'bg-[#0A0A0A] dark:bg-gray-50',
    card: 'bg-[#0A0A0C] dark:bg-white',
    nested: 'bg-[#151519] dark:bg-gray-100',
    interactive: 'bg-[#101010] dark:bg-gray-200',
    gradient: 'bg-gradient-to-b from-black to-[#0A0A0A] dark:from-white dark:to-gray-50',
  },
  
  // Text Classes - now with dark mode support
  text: {
    primary: 'text-white dark:text-black',
    secondary: 'text-gray-400 dark:text-gray-600',
    tertiary: 'text-gray-500 dark:text-gray-500',
    blue: 'text-blue-400 dark:text-blue-600',
    rose: 'text-rose-400 dark:text-rose-600',
    amber: 'text-amber-400 dark:text-amber-600',
    emerald: 'text-emerald-400 dark:text-emerald-600',
  },
  
  // Border Classes - now with dark mode support
  border: {
    primary: 'border-gray-800/30 dark:border-gray-200',
    blue: 'border-blue-900/30 dark:border-blue-200',
    rose: 'border-rose-900/30 dark:border-rose-200',
    amber: 'border-amber-900/30 dark:border-amber-200',
    emerald: 'border-emerald-900/30 dark:border-emerald-200',
  },
  
  // Background Accent Classes - now with dark mode support
  bgAccent: {
    blue: 'bg-blue-500/10 dark:bg-blue-100',
    rose: 'bg-rose-500/10 dark:bg-rose-100',
    amber: 'bg-amber-500/10 dark:bg-amber-100',
    emerald: 'bg-emerald-500/10 dark:bg-emerald-100',
  },
  
  // Hover States - now with dark mode support
  hover: {
    blue: 'hover:bg-blue-500/20 hover:border-blue-900/50 dark:hover:bg-blue-200 dark:hover:border-blue-300',
    rose: 'hover:bg-rose-500/20 hover:border-rose-900/50 dark:hover:bg-rose-200 dark:hover:border-rose-300',
    amber: 'hover:bg-amber-500/20 hover:border-amber-900/50 dark:hover:bg-amber-200 dark:hover:border-amber-300',
    emerald: 'hover:bg-emerald-500/20 hover:border-emerald-900/50 dark:hover:bg-emerald-200 dark:hover:border-emerald-300',
    subtle: 'hover:border-gray-800/60 dark:hover:border-gray-300',
  },
  
  // Typography Classes - now with dark mode support
  typography: {
    mainHeading: 'text-3xl sm:text-4xl font-bold text-white dark:text-black',
    sectionHeading: 'text-xl font-semibold text-white dark:text-black tracking-wide',
    cardHeading: 'text-lg font-medium text-white dark:text-black tracking-wide',
    bodyText: 'text-sm text-gray-400 dark:text-gray-600 font-medium',
    smallLabel: 'text-xs text-gray-500 dark:text-gray-500',
    monoNumbers: 'font-mono font-bold text-white dark:text-black',
  },
  
  // Font Family Classes
  font: {
    primary: 'font-sans',
    mono: 'font-mono',
  },
} as const;

// === SPACING SCALE ===
export const spacing = {
  xs: '4px',    // gap-1
  sm: '8px',    // gap-2
  md: '16px',   // gap-4
  lg: '24px',   // gap-6
  xl: '32px',   // gap-8
  xxl: '48px',  // gap-12
} as const;

// === THEME CONFIGURATION ===
export type ThemeMode = 'dark' | 'light';

export const themes = {
  dark: {
    ...colors,
    mode: 'dark' as const,
  },
  // Light theme with proper color mappings
  light: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      card: '#F1F5F9',
      nested: '#E2E8F0',
      interactive: '#CBD5E1',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#64748B',
    },
    border: {
      primary: 'rgba(15, 23, 42, 0.1)',
      secondary: 'rgba(71, 85, 105, 0.1)',
      subtle: 'rgba(15, 23, 42, 0.05)',
    },
    blue: colors.blue,     // Keep accent colors the same
    rose: colors.rose,
    amber: colors.amber,
    emerald: colors.emerald,
    mode: 'light' as const,
  },
} as const;

// === COMPONENT VARIANTS ===
export const components = {
  card: {
    primary: `${tw.bg.card} backdrop-blur-xl rounded-2xl p-6 border ${tw.border.primary}`,
    nested: `${tw.bg.nested} rounded-xl p-4 border ${tw.border.primary}`,
    interactive: `${tw.bg.nested} rounded-xl p-4 border ${tw.border.primary} transition-all duration-300`,
  },
  
  button: {
    primary: `px-6 py-2 bg-blue-500 text-white dark:text-white rounded-lg hover:bg-blue-600 transition-colors font-medium`,
    secondary: `px-6 py-2 ${tw.bgAccent.blue} ${tw.text.blue} border ${tw.border.blue} rounded-lg ${tw.hover.blue} transition-colors font-medium`,
  },
  
  badge: {
    blue: `${tw.bgAccent.blue} ${tw.text.blue} border ${tw.border.blue}`,
    rose: `${tw.bgAccent.rose} ${tw.text.rose} border ${tw.border.rose}`,
    amber: `${tw.bgAccent.amber} ${tw.text.amber} border ${tw.border.amber}`,
    emerald: `${tw.bgAccent.emerald} ${tw.text.emerald} border ${tw.border.emerald}`,
  },
  
  iconContainer: {
    blue: `w-10 h-10 rounded-xl bg-blue-500 dark:bg-blue-600 text-white dark:text-white flex items-center justify-center border border-blue-400 dark:border-blue-500 hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-300`,
    rose: `w-10 h-10 rounded-xl bg-rose-500 dark:bg-rose-600 text-white dark:text-white flex items-center justify-center border border-rose-400 dark:border-rose-500 hover:bg-rose-600 dark:hover:bg-rose-700 transition-all duration-300`,
    amber: `w-10 h-10 rounded-xl bg-amber-500 dark:bg-amber-600 text-white dark:text-white flex items-center justify-center border border-amber-400 dark:border-amber-500 hover:bg-amber-600 dark:hover:bg-amber-700 transition-all duration-300`,
    emerald: `w-10 h-10 rounded-xl bg-emerald-500 dark:bg-emerald-600 text-white dark:text-white flex items-center justify-center border border-emerald-400 dark:border-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-all duration-300`,
  },
} as const;

// === ANIMATION UTILITIES ===
export const animations = {
  css: {
    transition: 'transition-all duration-300',
    hover: 'transform hover:scale-105',
    tap: 'active:scale-95',
  },
} as const;

// === RESPONSIVE UTILITIES ===
export const responsive = {
  breakpoints: {
    xs: '475px',    // Extra small devices
    sm: '640px',    // Small devices  
    md: '768px',    // Medium devices
    lg: '1024px',   // Large devices
    xl: '1280px',   // Extra large devices
    '2xl': '1536px' // 2X large devices
  },
  
  // Common responsive patterns
  grid: {
    mobile: 'grid-cols-1',
    tablet: 'sm:grid-cols-2',
    desktop: 'lg:grid-cols-3',
    wide: 'xl:grid-cols-4',
  },
  
  spacing: {
    mobile: 'p-4 gap-4',
    tablet: 'sm:p-6 sm:gap-6', 
    desktop: 'lg:p-8 lg:gap-8',
  },
  
  text: {
    mobile: 'text-sm',
    tablet: 'sm:text-base',
    desktop: 'lg:text-lg',
  }
} as const;

// === UTILITY FUNCTIONS ===
export const utils = {
  cn: (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ');
  },
} as const;

// === DESIGN SYSTEM EXPORT ===
export const designSystem = {
  fonts,
  colors,
  tw,
  spacing,
  themes,
  components,
  animations,
  utils,
  responsive,
} as const;

export default designSystem;

// === TYPE EXPORTS ===
export type DesignSystem = typeof designSystem;
export type ColorPalette = typeof colors;
export type ThemeConfig = typeof themes.dark;
export type ComponentVariants = typeof components;