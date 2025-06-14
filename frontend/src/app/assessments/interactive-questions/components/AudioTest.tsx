'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { Volume2, Play, Headphones, RefreshCw, Loader2 } from 'lucide-react'

const AUDIO_URL = '/censor-beep-10sec-8113.mp3'

interface AudioTestProps {
  onComplete: (time: number) => void
}

export function AudioTest({ onComplete }: AudioTestProps) {
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    audioRef.current = new Audio(AUDIO_URL)
    audioRef.current.preload = 'auto'
    
    const handleError = () => {
      setError('Failed to load audio. Please try again.')
      setIsPlaying(false)
    }

    audioRef.current.addEventListener('error', handleError)
    audioRef.current.addEventListener('ended', handleAudioEnd)
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('error', handleError)
        audioRef.current.removeEventListener('ended', handleAudioEnd)
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(progress)
    }
  }

  const handleAudioEnd = () => {
    setIsPlaying(false)
    setTimeout(() => {
      onComplete(Date.now() - startTimeRef.current)
    }, 1500)
  }

  const handleStart = async () => {
    try {
      setIsReady(true)
      setIsPlaying(true)
      startTimeRef.current = Date.now()
      await audioRef.current?.play()
    } catch (err) {
      setError('Failed to play audio. Please try again.')
      setIsPlaying(false)
    }
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className={utils.cn(
          components.card.nested,
          tw.bgAccent.rose,
          tw.border.rose,
          "relative overflow-hidden"
        )}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -z-10"></div>
          <div className="flex flex-col items-center gap-4">
            <div className={utils.cn(components.iconContainer.rose, "w-12 h-12")}>
              <Volume2 className="w-6 h-6" />
            </div>
            <p className={utils.cn(tw.typography.bodyText, tw.text.rose)}>
              {error}
            </p>
          </div>
        </div>
        
        <motion.button
          onClick={() => window.location.reload()}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          className={utils.cn(
            "group relative px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-medium overflow-hidden",
            "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700",
            "text-white shadow-lg hover:shadow-xl hover:shadow-rose-500/25",
            "transition-all duration-300 border border-rose-400/30",
            "text-sm sm:text-base"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-center gap-2 sm:gap-3">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Retry</span>
          </div>
        </motion.button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 sm:space-y-8"
    >
      {!isReady ? (
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center space-y-4">
            <div className={utils.cn(components.iconContainer.blue, "w-12 h-12 sm:w-16 sm:h-16")}>
              <Volume2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className={utils.cn(tw.typography.sectionHeading, "text-lg sm:text-xl lg:text-2xl")}>
              Audio Learning Test
            </h3>
          </div>

          {/* Instructions */}
          <div className={utils.cn(
            components.card.nested,
            tw.bgAccent.blue,
            tw.border.blue,
            "relative overflow-hidden"
          )}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -z-10"></div>
            <div className="flex flex-col items-center gap-4">
              <div className={utils.cn(components.iconContainer.blue, "w-10 h-10")}>
                <Headphones className="w-5 h-5" />
              </div>
              <p className={utils.cn(tw.typography.bodyText, "text-sm sm:text-base leading-relaxed text-center")}>
                You will hear a short audio clip. 
                Listen carefully as you'll be asked questions about it.
              </p>
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            onClick={handleStart}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            className={utils.cn(
              "group relative px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-medium overflow-hidden",
              "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
              "text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25",
              "transition-all duration-300 border border-blue-400/30",
              "text-sm sm:text-base"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2 sm:gap-3">
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Start Listening</span>
            </div>
          </motion.button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Audio Status Display */}
          <div className={utils.cn(
            components.card.nested,
            "h-32 sm:h-40 flex items-center justify-center overflow-hidden relative"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
            
            <motion.div
              key={isPlaying ? 'playing' : 'complete'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-4"
            >
              <div className={utils.cn(
                components.iconContainer.blue, 
                "w-12 h-12 sm:w-16 sm:h-16",
                isPlaying ? "animate-pulse" : ""
              )}>
                {isPlaying ? (
                  <Volume2 className="w-6 h-6 sm:w-8 sm:h-8" />
                ) : (
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                )}
              </div>
              
              <p className={utils.cn(
                tw.typography.sectionHeading,
                "text-center text-base sm:text-lg lg:text-xl",
                isPlaying ? tw.text.blue : tw.text.blue
              )}>
                {isPlaying ? 'Listening...' : 'Preparing questions...'}
              </p>
            </motion.div>
          </div>

          {/* Progress Section */}
          <div className={utils.cn(components.card.nested, "space-y-3 sm:space-y-4")}>
            {/* Progress Bar */}
            <div className="relative">
              <div className={utils.cn(
                "w-full h-2 sm:h-2.5 rounded-full overflow-hidden",
                tw.bg.interactive
              )}>
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Progress Label */}
            <div className="flex justify-center">
              <span className={utils.cn(tw.typography.smallLabel, "text-xs sm:text-sm")}>
                {isPlaying ? 'Audio Playing' : 'Audio Complete'}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
} 