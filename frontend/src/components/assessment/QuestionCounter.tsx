import { motion } from "framer-motion";

export default function QuestionCounter({ current, total }: { current: number; total: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0A0A0A]/90 
        backdrop-blur-xl rounded-full px-6 py-3 border border-gray-800/50 
        shadow-lg shadow-black/20"
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: i === current - 1 ? 1.2 : 1,
                opacity: 1,
                transition: { 
                  delay: i * 0.05,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 
                ${i < current 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-400' 
                  : i === current - 1 
                    ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                    : 'bg-gray-700'
                }`}
            />
          ))}
        </div>
        <div className="w-px h-4 bg-gray-700/50" />
        <div className="text-sm font-medium">
          <span className="text-blue-400">{current}</span>
          <span className="text-gray-500 mx-1">/</span>
          <span className="text-gray-400">{total}</span>
        </div>
      </div>
    </motion.div>
  )
} 