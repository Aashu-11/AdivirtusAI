# Changelog

All notable changes to the AdiVirtus AI Technical Assessment System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2026-06-11

### Fixed

#### Technical Assessment User Experience
- **Fixed**: Users with completed SCT initial assessments being shown "No Questions Available" error instead of being redirected to their gap analysis
- **Resolved**: Authentication/session management issues preventing access to gap analysis data
- **Fixed**: Row Level Security (RLS) policy conflicts causing database access failures
- **Eliminated**: Brief flash of "No Questions Available" message during assessment status checking

#### Authentication & Session Management
- **Enhanced**: SkillCompetencyTest component with comprehensive authentication diagnostics
- **Added**: Smart user status checking that bypasses RLS issues using API endpoints
- **Implemented**: Fallback authentication mechanisms for improved reliability
- **Fixed**: Session persistence issues when transitioning between assessment phases

#### API Improvements
- **Created**: New simplified gap analysis endpoint `/api/gap-analysis/[id]` using service role authentication
- **Enhanced**: Debug API endpoint to support dynamic user ID parameters
- **Added**: Comprehensive error handling with detailed logging for troubleshooting
- **Updated**: useSkillGapData hook to use the new reliable authentication-free endpoint

### Enhanced

#### User Experience & Interface
- **Added**: Intelligent loading states with contextual messages during assessment status checking
- **Enhanced**: Loading experience with specific messages for different phases:
  - "Checking Assessment Status" during existing analysis verification
  - "Verifying your current assessment progress..." for status checking
  - "Loading Assessment" and "Preparing your personalized questions..." for normal flow
- **Improved**: Smooth redirection flow for users with completed assessments
- **Added**: Real-time status updates with appropriate toast notifications

#### Diagnostic Capabilities
- **Added**: Comprehensive debugging infrastructure for authentication flow tracking
- **Enhanced**: Console logging for better error identification and troubleshooting
- **Implemented**: Environment variable validation checks
- **Added**: Database connectivity testing for improved error diagnosis

### Changed

#### Assessment Flow Logic
- **Refactored**: Assessment status checking to use API-based validation instead of direct database queries
- **Enhanced**: Redirection logic with intelligent decision making:
  - Completed analysis → Automatic redirect to gap analysis page
  - Submitted but processing → Show "processing" message with status updates
  - Questions available → Continue with normal assessment flow
- **Improved**: Error handling with graceful fallbacks and user-friendly messages

#### Code Architecture
- **Added**: New state management for `isCheckingExistingAnalysis` to track analysis verification
- **Enhanced**: Component lifecycle management with proper state cleanup
- **Improved**: Separation of concerns between authentication, data fetching, and user interface states

### Security
- **Enhanced**: Service role usage for administrative database access bypassing user authentication issues
- **Maintained**: Proper user validation while improving reliability of data access
- **Added**: Additional authentication validation layers with comprehensive error reporting

## [1.3.0] - 2025-01-07

### Added

#### Enhanced Skills Taxonomy System
- **Implemented**: Comprehensive skills taxonomy with automatic metadata population
- **Added**: Smart subcategory classification for all skill types (technical_skills, domain_knowledge, soft_skills, SOPs)
- **Added**: Automatic alias generation for better skill searchability and matching
- **Added**: Contextual keyword extraction for enhanced skill discovery
- **Added**: Industry tag mapping for better skill organization and filtering
- **Added**: Dynamic confidence scoring based on source reliability and content quality
- **Added**: Rich metadata columns: subcategory, aliases, keywords, industry_tags, confidence_score

#### Intelligent Auto-Learning System
- **Implemented**: Self-learning skills system that automatically creates new skills
- **Added**: Smart auto-creation logic based on source type and skill patterns
- **Added**: Pending skills management with quality scoring and promotion criteria
- **Added**: Auto-promotion system for frequently requested skills (3+ occurrences)
- **Added**: Taxonomy health monitoring with recommendations for improvement
- **Added**: Batch learning capabilities for processing multiple skill requests
- **Added**: Conservative approach for job descriptions vs aggressive for trusted sources

#### Enhanced API Methods
- **Added**: `add_skill_to_taxonomy_enhanced()` - Creates skills with complete metadata in one call
- **Added**: `create_pending_skill_enhanced()` - Pre-generates metadata for faster skill promotion
- **Added**: Enhanced auto-learning integration with full metadata support
- **Added**: Advanced skill matching using normalized names and similarity scoring

#### Database Enhancements
- **Enhanced**: Skills taxonomy table with rich metadata columns for comprehensive skill data
- **Added**: Metadata JSONB column to pending_skills table for enhanced workflow
- **Implemented**: Advanced search capabilities using aliases, keywords, and industry tags
- **Added**: Database migration for enhanced metadata support

#### Skill Coverage Calculation Improvements
- **Fixed**: Double-counting issue in technical skills coverage calculations (171.4% → accurate percentages)
- **Enhanced**: Coverage calculation using assignment plans instead of raw question metadata
- **Added**: Cross-validation between assignment plans and question metadata
- **Implemented**: Unique skill counting to prevent inflated coverage statistics

### Changed

#### Skill Management Architecture
- **Refactored**: Skills embedding service to support enhanced metadata creation
- **Improved**: Skill normalization for better matching (e.g., "JavaScript (ES6+)" → "javascript")
- **Enhanced**: Auto-learning decision engine with confidence-based promotion
- **Optimized**: Skills creation workflow with comprehensive metadata generation

#### Quality and Reliability
- **Enhanced**: Error logging and debugging capabilities for skill processing
- **Improved**: Skill name standardization for consistent taxonomy usage
- **Added**: Quality scoring system for pending skills based on frequency and source diversity
- **Implemented**: Comprehensive test suite for enhanced skills system validation

### Fixed

#### Critical Skills Issues
- **Resolved**: Skills coverage calculation showing impossible >100% percentages
- **Fixed**: Double-counting of skills across different question types
- **Eliminated**: Fallback skill creation (e.g., "fallback_javascript_(es6+)") in favor of canonical taxonomy skills
- **Fixed**: Skills Embedding Service failures that caused fallback to temporary skills

#### System Reliability
- **Improved**: Skill matching accuracy with enhanced normalization algorithms
- **Fixed**: Issues with skill standardization process for complex skill names
- **Enhanced**: Database consistency by using proper taxonomy skills instead of fallback entries

### Security
- **Enhanced**: Skills taxonomy with proper validation and sanitization
- **Added**: Confidence scoring to identify and prioritize high-quality skills
- **Implemented**: Source type validation for trusted skill creation

### Documentation
- **Added**: Comprehensive documentation for Enhanced Skills System (ENHANCED_SKILLS_SYSTEM.md)
- **Created**: Test suite documentation with validation scenarios
- **Documented**: Auto-learning system workflow and decision criteria
- **Added**: API usage examples for enhanced skill creation methods

### Performance
- **Optimized**: Skills search performance with enhanced indexing on metadata columns
- **Improved**: Batch processing for auto-learning skill promotion
- **Enhanced**: Database query optimization for skills taxonomy operations

## [1.2.0] - 2025-06-10

### Added

#### HR Analytics Dashboard
- **Implemented**: Comprehensive HR analytics dashboard with real-time data visualization
- **Added**: Organization-wide skill metrics and competency tracking
- **Added**: Team analytics with department-wise skill breakdown
- **Added**: Critical gap identification across technical, soft skills, domain knowledge, and SOP compliance
- **Added**: Employee competency distribution charts and heatmaps
- **Added**: Skill maturity heatmap visualization for department-level insights
- **Added**: Live update support with WebSocket integration for real-time data
- **Added**: HR role-based authentication and permissions system
- **Added**: Employee detail view with comprehensive skill breakdown

#### Advanced Gap Analysis Engine
- **Enhanced**: Gap analysis algorithm with AI-powered competency evaluation using GPT-4 and CrewAI
- **Added**: Multi-dimensional skill assessment across technical, soft skills, domain knowledge, and SOPs
- **Added**: Intelligent root cause analysis for skill deficiencies
- **Added**: Priority-based gap recommendations with business impact assessment
- **Added**: Compliance risk identification and tracking
- **Added**: Leadership readiness assessment and gap analysis
- **Added**: Domain expertise deficit analysis with productivity impact metrics

#### Reporting System
- **Added**: Comprehensive report generation system with multiple templates:
  - Executive Summary Reports (5 pages, monthly)
  - Comprehensive Skills Gap Analysis (25 pages, on-demand)
  - Compliance & Risk Assessment Reports (15 pages, quarterly)
  - Department Performance Analysis (10 pages, monthly)
  - Training ROI & Effectiveness Reports (12 pages, quarterly)
  - Strategic Workforce Planning Reports (18 pages, quarterly)
- **Added**: Export functionality for CSV, PDF, and Excel formats
- **Added**: Scheduled report generation with email delivery
- **Added**: Interactive report preview with charts and visualizations
- **Added**: Report template popularity tracking

#### Design System & UI/UX Improvements
- **Implemented**: Custom design system with centralized tokens for colors, typography, and spacing
- **Added**: Dark mode support with automatic theme switching
- **Added**: Responsive design patterns for mobile, tablet, and desktop
- **Added**: Consistent component variants (cards, buttons, badges, icons)
- **Added**: Framer Motion animations throughout the application
- **Added**: Interactive skill trees with D3.js visualization
- **Added**: Modern glassmorphism effects with backdrop blur
- **Enhanced**: Navigation with collapsible sidebar and user menu
- **Added**: Loading states and skeleton screens for better UX

#### Question Generation & Assessment Improvements
- **Enhanced**: AI-powered question generation using advanced prompts
- **Added**: Context-aware question generation based on job requirements
- **Added**: Multi-level difficulty questions for comprehensive assessment
- **Added**: Scenario-based questions for practical skill evaluation
- **Added**: Dynamic question mapping to skill matrix elements
- **Added**: Real-time assessment progress tracking

### Changed

#### Architecture & Performance
- **Migrated**: Frontend to Next.js 15 with App Router for better performance
- **Upgraded**: React to version 19 for improved concurrent features
- **Optimized**: Database queries with proper indexing and caching
- **Enhanced**: API response times with Redis caching for analytics data
- **Improved**: Code splitting and lazy loading for faster initial load
- **Refactored**: Component structure for better maintainability

#### Authentication & Security
- **Enhanced**: Supabase authentication with improved session management
- **Added**: Row-level security (RLS) policies for all database tables
- **Implemented**: JWT token validation in Django backend
- **Added**: Secure API endpoints with proper authentication middleware
- **Enhanced**: Cookie security with httpOnly and secure flags

#### Data Processing
- **Improved**: Assessment interpretation with more accurate AI models
- **Enhanced**: Skill matrix normalization for better consistency
- **Added**: Batch processing for large-scale analytics generation
- **Optimized**: PDF processing with improved text extraction

### Fixed

#### Critical Bugs
- **Fixed**: Authentication persistence issues across page navigations
- **Fixed**: Skill ID mapping inconsistencies in gap analysis
- **Fixed**: CORS errors in API communication
- **Fixed**: Database connection pooling issues under high load
- **Fixed**: Memory leaks in real-time update subscriptions
- **Fixed**: Type errors in TypeScript interfaces

#### UI/UX Issues
- **Fixed**: Responsive design breakpoints for mobile devices
- **Fixed**: Chart rendering issues in Safari browsers
- **Fixed**: Dropdown menu z-index conflicts
- **Fixed**: Form validation error display
- **Fixed**: Loading state race conditions

### Removed

#### Deprecated Features
- **Removed**: Personalized learning roadmaps feature (27 files removed)
  - Removed backend Django app: `personalized_roadmap`
  - Removed frontend pages and components for roadmap visualization
  - Removed CrewAI roadmap generation agents
  - Removed database migrations for roadmap tables
- **Removed**: Legacy authentication code using deprecated Supabase packages
- **Removed**: Unused API endpoints and redundant service files
- **Removed**: Old UI components replaced by design system

### Security
- **Added**: Input sanitization for all user inputs
- **Added**: Rate limiting on API endpoints
- **Enhanced**: XSS protection in React components
- **Added**: SQL injection prevention in Django ORM queries

### Documentation
- **Completely Rewritten**: README.md with comprehensive setup and development guide
- **Added**: API documentation with request/response examples
- **Added**: Component development guide with full workflow
- **Added**: Design system usage documentation
- **Added**: Deployment guides for Vercel and Railway
- **Added**: Troubleshooting section with common issues

### Performance
- **Optimized**: Image loading with Next.js Image component
- **Added**: Service Worker for offline capability
- **Implemented**: Database query optimization with proper indexes
- **Added**: CDN integration for static assets
- **Reduced**: Bundle size by 40% through code splitting

## [1.1.9] - 2025-05-16

### UI Enhancements

- **Improved**: Enhanced OTP input interface with individual digit boxes for better user experience
- **Added**: Auto-focus and keyboard navigation between OTP input fields
- **Added**: Paste functionality for OTP codes to improve usability
- **Enhanced**: Visual styling of OTP verification page with clearer instructions

## [1.1.8] - 2025-05-15

### Authentication Improvements

- **Fixed**: Password reset now correctly uses OTP verification instead of email links
- **Enhanced**: Improved UX for password reset flow with clearer instructions
- **Added**: Ability to change email or resend code in password reset flow

## [1.1.7] - 2025-05-14

### Authentication Improvements

- **Enhanced**: Reimplemented password reset flow using OTP verification instead of email links
- **Added**: Three-step password reset process (email entry, OTP verification, password change)
- **Fixed**: Bug in signup page that incorrectly showed verification page for already registered emails
- **Improved**: Error handling for existing account detection during registration

## [1.1.6] - 2025-05-13

### Auth Improvements

- **Added**: Forgot password functionality with email-based password reset
- **Added**: Password reset page for setting new password after clicking reset link
- **Fixed**: User experience issue where signing up with an existing email would incorrectly show verification page
- **Enhanced**: Authentication workflow with better error handling and user feedback

## [1.1.5] - 2025-05-12

### Authentication Enhancements

#### Supabase Authentication Modernization
- **Migrated**: Upgraded from deprecated Supabase auth package to the recommended `@supabase/ssr` package
- **Added**: Comprehensive authentication documentation in both main and frontend README files
- **Implemented**: Improved server-side and client-side authentication patterns
- **Fixed**: Cookie handling issues in API routes and middleware
- **Enhanced**: Security improvements with proper session management

#### Frontend Authentication
- **Added**: User profile dropdown menu with sign-out functionality in dashboard
- **Fixed**: CORS headers and inconsistent response formatting in API endpoints
- **Enhanced**: Proper error handling for authentication failures
- **Implemented**: Protected route patterns using server components

#### Backend Authentication
- **Fixed**: Security issues with hardcoded credentials
- **Improved**: Clean separation between client and server authentication
- **Enhanced**: Middleware implementation for automatic session refresh

### Documentation
- **Added**: Authentication section to main README.md for developer reference
- **Added**: Practical authentication code examples in frontend README.md
- **Documented**: Security best practices for Supabase authentication
- **Improved**: API route authentication documentation

## [1.1.4] - 2025-05-10

### Onboarding Assessment (Backend & Data)

#### Assessment Questions Overhaul
- **Added**: New, more descriptive and scenario-based questions to `questions.json` for the onboarding assessment, focusing on:
  - Learning velocity (pattern, timeframe estimation, retention, efficiency, measurement)
  - VARK learning style (contextual, multimodal, technology, logical processing, self-assessment)
  - Cognitive load, motivation, adaptability, and feedback utilization
- **Changed**: 
  - Rewrote the main LearningVelocity question for clarity and depth.
  - Enhanced prompts to be more workplace-relevant and to distinguish between modalities.
  - Improved option texts for clarity and realism with more precise percentage ranges.
  - Enhanced phrasing for all learning velocity questions to be more direct and concise.
- **Split**: The large monolithic `questions.json` was split into multiple files for maintainability:
  - Core questions, resources, and metadata are now separated.
  - Each question type (velocity, style, cognitive, etc.) can be managed independently.
- **Removed**: Outdated or redundant questions that overlapped with new, more targeted ones.

#### Assessment Interpreter & Velocity Metrics
- **Added**: 
  - Specialized scoring functions for new velocity metrics in the interpreter.
  - Retention profile and phase duration calculations.
  - Confidence calculation now incorporates user-reported precision.
  - More detailed velocity pattern detection and phase analysis.
  - Robust preprocessing of raw answers with consistency scoring.
  - Better handling of multimodal learning styles.
- **Changed**: 
  - Improved error handling and logging in the interpreter.
  - Enhanced the `CombinedInterpreter` to support new question types and modular file structure.
  - Refined the mapping from question options to normalized scores for better accuracy.
  - Improved style matching algorithm with weighted content distribution analysis.
- **Fixed**: 
  - TypeError in `_generate_interpretation` (service.py) when extracting consistency scores.
  - Added missing `calculate_dimensions` method to `CombinedInterpreter`.
  - Fixed dimension calculator's mapping references and error handling.
  - Enhanced test coverage with comprehensive assessment test script.
- **Removed**: 
  - Legacy code paths and unused interpreter logic.

### Frontend

#### Learning Profile Page
- **Added**: 
  - Modern, infographic-style visualizations for:
    - VARK learning style (with icons, color-coded bars, and compatibility indicators)
    - Learning velocity (phase distribution, circular gauge, retention profile)
    - Optimal learning environment and feedback approach (with icons, color, and grid layouts)
  - Enhanced grid layout for better responsiveness and grouping of metrics.
- **Changed**: 
  - Improved overall responsiveness and mobile support.
  - Refactored the structure for easier maintenance and future extensibility.
  - Updated the VARK section to be more visually appealing and "cooler."
  - Optimal Learning Environment and Feedback Approach now use more intellectual, infographic designs (not just boxes).
- **Fixed**: 
  - Type error with `is_multimodal` in the VARK component.
  - Alignment and overflow issues in grid layouts.
- **Removed**: 
  - Outdated static layouts and replaced with dynamic, data-driven components.

#### Types & Interfaces
- **Changed**: 
  - Updated `assessment.ts` types to support new properties (e.g., `is_multimodal`, `style_blend`).
  - Improved type safety for new velocity and cognitive metrics.
  - Added comprehensive JSDoc comments to all interface properties.
  - Refined type definitions with precise enumerated values.

#### Assessment Results Page
- **Added**:
  - "Force Process" button on the onboarding assessment result page to manually trigger interpretation when results are pending.
  - Visual loading state and success message after forcing process.
  - Automatic page refresh after forcing process to show updated results.
- **Fixed**:
  - Enhanced the UI layout for the processing status section for better visual hierarchy.

### Documentation & Structure
- **Documented**: 
  - All new question formats and interpreter logic.
  - Frontend component structure and prop requirements.
  - Detailed type definitions with JSDoc comments.
- **Split**: 
  - Assessment logic and question data into modular files for easier updates.
- **Added**:
  - Comprehensive test suite for assessment interpreter and velocity metrics.
  - Default value handling for graceful error recovery.

## [1.1.3] - 2025-05-08

### Added
- Enhanced learning profile visualization with improved UI components
- Added EnhancedCognitiveLoadDisplay component for detailed cognitive factor analysis
- Added EnhancedProbabilisticRangeDisplay for learning time estimates with confidence ranges
- Added EnhancedConsistencyDisplay to show response consistency metrics
- Implemented version checking to display enhanced data for interpreter v1.1+

### Changed
- Improved UI for learning time estimates with better visual spacing and responsive legend
- Replaced yellowish gradients with indigo color scheme for better visual hierarchy
- Made time estimate displays more readable on mobile devices
- Restructured learning profile page layout for better information organization

### Fixed
- Fixed visual clutter in the probabilistic time range display
- Improved responsiveness of cognitive load display on smaller screens
- Enhanced color contrast for better accessibility

## [1.1.2] - 2025-05-07

### Added
- Implemented comprehensive assessment interpretation system for the Adivirtus AI platform
- Added backend components for processing user assessment data from lsa_assessment table
- Added AssessmentInterpreter class for calculating learning dimensions (VARK and Honey & Mumford)
- Added InterpreterRecommendations class for generating content delivery recommendations
- Added automated processing of results when users complete assessments
- Added "Force Process" button to manually process pending interpretations in AssessmentSummary component
- Added JSONB query filtering to properly retrieve pending assessment interpretations
- Added real-time status updates with polling for interpretation results

### Fixed
- Fixed assessment interpretation backend processing with improved JSONB query syntax
- Fixed React hooks error in assessment page redirection logic
- Fixed onboarding assessment page to redirect to dashboard when already completed
- Fixed dashboard welcome message to properly display user's name
- Cleaned up AssessmentSummary component by removing unnecessary information sections
- Ensured proper environment variable handling in backend service

## [1.1.1] - 2025-05-06

### Fixed
- Authentication persistence issues when navigating to assessment tab
- Enhanced Supabase client with persistent sessions and auto-refresh
- Improved dashboard storage with multi-level fallback mechanisms
- Added detailed error handling for missing database columns
- Fixed missing skill ID matching with normalization function
- Resolved CrewAI compatibility issues across different versions
- Improved error recovery in fetchUserData function

## [1.1.0] - 2025-05-05

### Added
- Normalized skill ID system to handle case sensitivity and format inconsistencies
- Enhanced logging with color-coded terminal output for competency levels
- Multiple fallback mechanisms for dashboard storage
- Comprehensive project documentation in README.md
- Cursor rules for code quality and best practices
- Visual skill competency summary in terminal output

### Fixed
- Skill ID mapping issues that prevented correct competency updates
- Gap analysis failures when skill IDs had format variations
- Database column existence checking to prevent errors with missing columns
- CrewAI version compatibility issues with fallback to older format
- Edge case handling for nested JSON structures

### Changed
- Improved skill matching algorithm with name-based fallback
- Enhanced error handling with specific exception types
- Updated competency evaluation logic for better accuracy
- Restructured logging to provide clearer diagnostic information

## [1.0.0] - 2025-04-24

### Added
- Initial release of Technical Assessment System
- Resume and job description parsing with GPT-4
- Skill matrix generation from job requirements
- Technical question generation based on required skills
- Automated competency evaluation using CrewAI agents
- Gap analysis with root problem identification
- Skill dashboard generation
- Integration with Supabase for data storage
- Django backend with RESTful API endpoints
- Basic error handling and logging
- PDF extraction capabilities
- Support for various skill matrix formats 