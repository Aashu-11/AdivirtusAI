import { tw, utils, fonts } from '@/config/design-system'

export function LoadingState() {
  return (
    <div className={utils.cn('w-full py-8 sm:py-12 px-3 sm:px-4 lg:px-6', tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-6 sm:mb-8">
            <div className={utils.cn('h-6 sm:h-8 lg:h-10 rounded mb-3 w-3/4 max-w-md', tw.bg.nested)}></div>
            <div className={utils.cn('h-4 sm:h-5 rounded w-full max-w-2xl', tw.bg.nested)}></div>
          </div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={utils.cn('h-28 sm:h-32 lg:h-36 rounded-2xl', tw.bg.card)}></div>
            ))}
          </div>
          
          {/* Controls skeleton */}
          <div className={utils.cn('h-16 sm:h-20 rounded-2xl mb-6', tw.bg.card)}></div>
          
          {/* Skills list skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={utils.cn('h-20 sm:h-24 rounded-2xl', tw.bg.card)}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 