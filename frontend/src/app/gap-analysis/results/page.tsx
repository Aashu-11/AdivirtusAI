'use client'

import { motion } from 'framer-motion'
import { BarChart3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GapAnalysisResults() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/technical-assessment" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessment
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-[#0A0A0A]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl text-center space-y-6 shadow-2xl shadow-blue-500/5"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <BarChart3 className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Gap Analysis Coming Soon</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            The gap analysis feature will be available in a future update. Thank you for completing the skill competency test.
          </p>
          
          <Link 
            href="/technical-assessment" 
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
            hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 
            shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transform hover:-translate-y-1 mt-4"
          >
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  )
} 