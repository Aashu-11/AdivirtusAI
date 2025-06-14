import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export function QuestionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton height={24} width="60%" />
      <Skeleton height={100} />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton height={48} />
        <Skeleton height={48} />
      </div>
    </div>
  )
} 