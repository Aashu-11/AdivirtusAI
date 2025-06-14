import Link from 'next/link'
import { tw, components, utils, fonts } from '@/config/design-system'

interface ErrorStateProps {
  error: string
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className={utils.cn('w-full py-8 sm:py-12 px-3 sm:px-4 lg:px-6', tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className={utils.cn('p-6 sm:p-8 rounded-2xl text-center max-w-md w-full', tw.bg.card, tw.border.primary)}>
            <div className="mb-4">
              <div className={utils.cn('w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4', tw.bgAccent.rose)}>
                <svg className={utils.cn('w-8 h-8', tw.text.rose)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className={utils.cn(tw.typography.sectionHeading, 'mb-2')}>
                Error Loading Analysis
              </h2>
              <p className={utils.cn(tw.text.secondary, 'mb-6 text-sm leading-relaxed')}>
                {error}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className={utils.cn(components.button.secondary, 'text-sm')}
              >
                Try Again
              </button>
              <Link 
                href="/learning-profile" 
                className={utils.cn(components.button.primary, 'text-sm')}
              >
                Back to Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 