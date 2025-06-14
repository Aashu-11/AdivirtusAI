interface TechnicalCompetencyHeaderProps {
  title: string
  description: string
}

export default function TechnicalCompetencyHeader({ 
  title, 
  description 
}: TechnicalCompetencyHeaderProps) {
  return (
    <div className="mb-10">
      <h1 className="text-4xl font-bold text-white mb-3">{title}</h1>
      <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-5" />
      <p className="text-gray-400 text-lg">{description}</p>
    </div>
  )
} 