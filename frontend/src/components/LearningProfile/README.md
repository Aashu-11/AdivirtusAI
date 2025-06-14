# Learning Profile Components

This directory contains the modular components for the Learning Profile page, improving code readability and maintainability.

## Components

### 1. LearningStyles
**File**: `LearningStyles.tsx`
**Purpose**: Displays learning style preferences and distribution
**Features**:
- Primary and secondary learning styles
- Learning style distribution charts
- Visual, Auditory, Kinesthetic, and ReadWrite style indicators
- Multimodal learning compatibility display

### 2. LearningRecommendations
**File**: `LearningRecommendations.tsx`
**Purpose**: Shows optimal content formats and learning environment preferences
**Features**:
- Recommended and alternative content formats
- Environment preferences (noise, lighting, arrangement, etc.)
- Dynamic color coding based on preference type
- Responsive grid layout

### 3. LearningVelocity
**File**: `LearningVelocity.tsx`
**Purpose**: Displays learning velocity metrics and phase analysis
**Features**:
- Learning phase distribution (Initial, Midpoint, Mastery)
- Phase velocity indicators
- Knowledge retention profile
- Learning speed analysis with time multiplier
- Course time estimation scenarios
- Probabilistic time ranges

### 4. FeedbackPreferences
**File**: `FeedbackPreferences.tsx`
**Purpose**: Shows optimal feedback approach and progress measurement preferences
**Features**:
- Feedback timing and type preferences
- Progress measurement preference indicators
- Dynamic styling based on feedback type
- Measurement preference comparison grid

### 5. EnhancedLearningProfile
**File**: `EnhancedLearningProfile.tsx`
**Purpose**: Displays advanced cognitive analysis (for v1.1+ interpretations)
**Features**:
- Enhanced cognitive load factors display
- Probabilistic range visualization
- Response consistency analysis
- Version-based conditional rendering

## Usage

```tsx
import LearningStyles from '@/components/LearningProfile/LearningStyles'
import LearningRecommendations from '@/components/LearningProfile/LearningRecommendations'
import LearningVelocity from '@/components/LearningProfile/LearningVelocity'
import FeedbackPreferences from '@/components/LearningProfile/FeedbackPreferences'
import EnhancedLearningProfile from '@/components/LearningProfile/EnhancedLearningProfile'

// In your page component
<LearningStyles learningStyles={learningStyles} />
<LearningRecommendations contentRecommendations={contentRecommendations} />
<LearningVelocity velocityPrediction={velocityPrediction} />
<FeedbackPreferences 
  contentRecommendations={contentRecommendations} 
  velocityPrediction={velocityPrediction} 
/>
<EnhancedLearningProfile interpretationData={interpretationData} />
```

## Design System Integration

All components follow the Adivirtus design system:
- **Colors**: Consistent background (#0A0A0C, #151519), accent colors, and borders
- **Typography**: Helvetica Neue for general text, JetBrains Mono for numerical values
- **Spacing**: Consistent padding, margins, and gap patterns
- **Animation**: Framer Motion with staggered delays for smooth entrance effects
- **Responsive**: Mobile-first design with proper breakpoints

## Benefits

1. **Code Readability**: Each section is now self-contained and easier to understand
2. **Maintainability**: Changes to individual sections don't affect others
3. **Reusability**: Components can be reused in other parts of the application
4. **Testing**: Each component can be tested independently
5. **Performance**: Potential for code splitting and lazy loading
6. **Collaboration**: Multiple developers can work on different sections simultaneously

## Type Safety

All components include proper TypeScript interfaces for:
- Props validation
- Data structure consistency
- Development-time error catching
- Better IDE support and autocomplete 