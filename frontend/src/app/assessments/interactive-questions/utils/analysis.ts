export function analyzeLearningSpeed(metrics: {
  visualTime: number
  visualAccuracy: number
  auditoryTime: number
  auditoryAccuracy: number
  totalTime: number
}): 'Fast' | 'Moderate' | 'Slow' {
  const speedScore = calculateSpeedScore(metrics)
  const accuracyScore = calculateAccuracyScore(metrics)
  
  // Combined score weighted 60% speed, 40% accuracy
  const combinedScore = (speedScore * 0.6) + (accuracyScore * 0.4)
  
  if (combinedScore >= 0.8) return 'Fast'
  if (combinedScore >= 0.5) return 'Moderate'
  return 'Slow'
}

function calculateSpeedScore(metrics: any) {
  // Normalize times against expected completion times
  const visualSpeedScore = Math.min(30000 / metrics.visualTime, 1)
  const auditorySpeedScore = Math.min(45000 / metrics.auditoryTime, 1)
  return (visualSpeedScore + auditorySpeedScore) / 2
}

function calculateAccuracyScore(metrics: any) {
  return (metrics.visualAccuracy + metrics.auditoryAccuracy) / 2
} 