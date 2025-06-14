# Adivirtus AI Platform - Design System Configuration

## Overview

This directory contains the centralized design system configuration for the Adivirtus AI platform. The design system provides consistent colors, typography, spacing, and component styles that can be easily maintained and updated across the entire project.

## File Structure

```
frontend/src/config/
├── design-system.ts           # Main design system configuration
├── design-system-examples.tsx # Usage examples and demos
└── README.md                  # This documentation
```

## Quick Start

### 1. Import the Design System

```typescript
// Import everything
import designSystem from '@/config/design-system';

// Import specific parts
import { colors, fonts, tw, components } from '@/config/design-system';
```

### 2. Use Colors

```typescript
// Raw color values (for inline styles)
<div style={{ backgroundColor: colors.background.card }}>

// Tailwind classes (recommended)
<div className={tw.bg.card}>

// Component variants (best practice)
<div className={components.card.primary}>
```

### 3. Use Typography

```typescript
// Font families
<div style={{ fontFamily: fonts.primary }}>  // Helvetica Neue
<div style={{ fontFamily: fonts.mono }}>     // JetBrains Mono (numbers only)

// Typography classes
<h1 className={tw.typography.mainHeading}>
<p className={tw.typography.bodyText}>
```

## Available Exports

### Core Configuration

| Export | Description | Usage |
|--------|-------------|-------|
| `colors` | Raw color values | `colors.blue.primary` |
| `fonts` | Font family definitions | `fonts.primary` |
| `tw` | Tailwind CSS classes | `tw.bg.card` |
| `components` | Pre-built component styles | `components.card.primary` |
| `spacing` | Spacing scale values | `spacing.md` |
| `themes` | Theme configurations | `themes.dark` |
| `animations` | Animation presets | `animations.framerMotion.item` |
| `utils` | Utility functions | `utils.cn()` |

### Color Palette

#### Background Colors
```typescript
colors.background.primary    // #000000 - Main background
colors.background.secondary  // #0A0A0A - Secondary background
colors.background.card       // #0A0A0C - Card containers
colors.background.nested     // #151519 - Nested components
colors.background.interactive // #101010 - Interactive elements
```

#### Accent Colors
```typescript
colors.blue.primary     // #3B82F6 - Primary actions
colors.blue.secondary   // #1D4ED8 - Buttons, progress bars
colors.rose.primary     // #F43F5E - Critical, errors
colors.amber.primary    // #F59E0B - Warnings, high priority
colors.emerald.primary  // #10B981 - Success, completed
```

#### Text Colors
```typescript
colors.text.primary     // #FFFFFF - Primary text
colors.text.secondary   // #9CA3AF - Secondary text
colors.text.tertiary    // #6B7280 - Subtle text
```

### Tailwind Classes

#### Backgrounds
```typescript
tw.bg.primary           // bg-black
tw.bg.card              // bg-[#0A0A0C]
tw.bg.nested            // bg-[#151519]
tw.bg.gradient          // bg-gradient-to-b from-black to-[#0A0A0A]
```

#### Text Colors
```typescript
tw.text.primary         // text-white
tw.text.secondary       // text-gray-400
tw.text.blue            // text-blue-400
tw.text.emerald         // text-emerald-400
```

#### Typography
```typescript
tw.typography.mainHeading     // text-3xl sm:text-4xl font-bold text-white
tw.typography.sectionHeading  // text-xl font-semibold text-white tracking-wide
tw.typography.cardHeading     // text-lg font-medium text-white tracking-wide
tw.typography.bodyText        // text-sm text-gray-400 font-medium
tw.typography.monoNumbers     // font-mono font-bold text-white
```

### Component Variants

#### Cards
```typescript
components.card.primary      // Primary card with backdrop blur
components.card.nested       // Nested card for inner content
components.card.interactive  // Interactive card with hover states
```

#### Buttons
```typescript
components.button.primary    // Primary blue button
components.button.secondary  // Secondary outline button
```

#### Badges
```typescript
components.badge.blue        // Blue information badge
components.badge.emerald     // Success badge
components.badge.amber       // Warning badge
components.badge.rose        // Error badge
```

#### Icon Containers
```typescript
components.iconContainer.blue     // Blue icon background
components.iconContainer.emerald  // Success icon background
components.iconContainer.amber    // Warning icon background
components.iconContainer.rose     // Error icon background
```

## Usage Patterns

### 1. Basic Component

```tsx
import { tw, fonts } from '@/config/design-system';

export const MyComponent = () => {
  return (
    <div className={tw.bg.card} style={{ fontFamily: fonts.primary }}>
      <h1 className={tw.typography.mainHeading}>Page Title</h1>
      <p className={tw.typography.bodyText}>Description text</p>
    </div>
  );
};
```

### 2. Using Component Variants

```tsx
import { components, tw } from '@/config/design-system';

export const FeatureCard = () => {
  return (
    <div className={components.card.primary}>
      <div className={components.iconContainer.blue}>
        <svg className="w-5 h-5" />
      </div>
      <h3 className={tw.typography.cardHeading}>Feature Title</h3>
      <span className={components.badge.emerald}>New</span>
    </div>
  );
};
```

### 3. Theme-Aware Component

```tsx
import designSystem, { fonts } from '@/config/design-system';

interface Props {
  theme?: 'dark' | 'light';
}

export const ThemeComponent = ({ theme = 'dark' }: Props) => {
  const currentTheme = designSystem.themes[theme];
  
  return (
    <div 
      style={{ 
        backgroundColor: currentTheme.background.card,
        color: currentTheme.text.primary,
        fontFamily: fonts.primary 
      }}
    >
      Content adapts to theme
    </div>
  );
};
```

### 4. Using Animations

```tsx
import { motion } from 'framer-motion';
import { animations, components } from '@/config/design-system';

export const AnimatedCard = () => {
  return (
    <motion.div
      variants={animations.framerMotion.item}
      initial="hidden"
      animate="visible"
      className={components.card.primary}
    >
      <h2>Animated Content</h2>
    </motion.div>
  );
};
```

### 5. Using Utilities

```tsx
import { utils, components } from '@/config/design-system';

export const UtilityExample = () => {
  const cardClasses = utils.cn(
    components.card.primary,
    'hover:scale-105',
    'transition-transform duration-300'
  );
  
  const gridClasses = utils.cn(
    'grid',
    utils.responsive.mobile,
    utils.responsive.tablet,
    utils.responsive.desktop
  );
  
  return (
    <div className={cardClasses}>
      <div className={gridClasses}>
        Grid content
      </div>
    </div>
  );
};
```

## Best Practices

### 1. Font Usage
- **Use `fonts.primary`** for all text content (Helvetica Neue)
- **Use `fonts.mono`** ONLY for numbers, statistics, and data
- **Apply font styles** via `style={{ fontFamily: fonts.primary }}`

### 2. Color Consistency
- **Use accent colors** consistently: Blue for primary actions, Emerald for success, Amber for warnings, Rose for errors
- **Use `tw` classes** instead of raw color values when possible
- **Use component variants** for common patterns

### 3. Responsive Design
- **Use utility responsive classes**: `utils.responsive.mobile`, `utils.responsive.tablet`, etc.
- **Follow mobile-first approach**: Base styles for mobile, then enhance for larger screens
- **Use consistent spacing**: `gap-4`, `gap-6` patterns from the spacing scale

### 4. Theme Preparation
- **Use theme-aware patterns** when colors need to change
- **Access colors through `themes`** object for future light mode support
- **Keep accent colors consistent** across themes

## Migration Guide

### Converting Existing Components

1. **Replace hardcoded colors**:
   ```tsx
   // Before
   <div className="bg-[#0A0A0C] border-white/[0.06]">
   
   // After
   <div className={`${tw.bg.card} ${tw.border.primary} border`}>
   ```

2. **Use component variants**:
   ```tsx
   // Before
   <div className="bg-[#0A0A0C] backdrop-blur-xl rounded-2xl p-6 border border-gray-800/30">
   
   // After
   <div className={components.card.primary}>
   ```

3. **Standardize typography**:
   ```tsx
   // Before
   <h1 className="text-4xl font-bold text-white">
   
   // After
   <h1 className={tw.typography.mainHeading}>
   ```

## Future Enhancements

- **Light Theme**: Complete light theme implementation
- **Additional Variants**: More component variants as needed
- **Animation Library**: Expanded animation presets
- **CSS Variables**: Generate CSS custom properties for runtime theme switching
- **Design Tokens**: Export design tokens for other tools/platforms

## Contributing

When adding new colors or components:

1. **Add to the appropriate section** in `design-system.ts`
2. **Include both raw values and Tailwind classes**
3. **Create component variants** for common use cases
4. **Update this README** with new documentation
5. **Add examples** to `design-system-examples.tsx`

---

For questions or suggestions about the design system, please refer to the examples file or reach out to the design team. 