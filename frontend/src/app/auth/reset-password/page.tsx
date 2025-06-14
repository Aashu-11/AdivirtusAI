'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    // Check if we have a valid hash in the URL (means we came from a password reset email)
    const hash = window.location.hash
    if (!hash || !hash.includes('type=recovery')) {
      // If no valid hash, redirect to forgot password page
      router.push('/auth/forgot-password')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error
      
      setSuccess(true)
      // Automatically redirect after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#020202] to-[#050505] text-white p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
        {/* Keep the background effects and branding from the form */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-transparent blur-3xl"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 via-transparent to-transparent blur-3xl"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative"
        >
          <div className="bg-[#0A0A0A]/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-800/50 shadow-2xl relative">
            <div className="text-center space-y-4">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white">Password Updated!</h2>
              
              <p className="text-gray-400">
                Your password has been successfully reset.
              </p>

              <div className="bg-blue-500/10 rounded-xl p-4 mt-6 text-sm text-blue-300 border border-blue-500/20">
                <p>You will be redirected to the sign in page in a few seconds...</p>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full py-3 rounded-xl font-medium text-center transition-all duration-200
                    bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600
                    hover:from-blue-500 hover:via-blue-600 hover:to-blue-700
                    text-white shadow-lg"
                >
                  Sign In Now
                </button>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020202] to-[#050505] text-white p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
      {/* Branding in corner */}
      <div 
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 flex items-center space-x-3 z-10 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-lg font-bold text-white">A</span>
        </div>
        <span className="text-sm font-medium text-gray-400">Adivirtus AI</span>
      </div>

      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-transparent blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 via-transparent to-transparent blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

      <div className="w-full max-w-md relative">
        <div className="bg-[#0A0A0A]/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-800/50 shadow-2xl relative">
          {/* Decorative Corner Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] -z-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-tr-[100px] -z-10"></div>
          
          {/* Top Accent Line */}
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

          {/* Header Section */}
          <div className="mb-8 relative">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  Set New Password
                </h1>
                <p className="text-gray-400 mt-2">Create a new password for your account</p>
              </div>
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  className="w-full bg-[#111111]/80 rounded-xl px-4 py-3
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20
                    border border-gray-800/50 text-gray-100
                    placeholder-gray-500 transition-all duration-200"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setError(null)
                  }}
                  className="w-full bg-[#111111]/80 rounded-xl px-4 py-3
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20
                    border border-gray-800/50 text-gray-100
                    placeholder-gray-500 transition-all duration-200"
                  placeholder="Confirm new password"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-medium text-center transition-all duration-200
                bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600
                hover:from-blue-500 hover:via-blue-600 hover:to-blue-700
                text-white shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Updating...</span>
                </div>
              ) : 'Reset Password'}
            </button>
          </motion.form>

          {/* Enhanced Bottom Decoration */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent blur-sm"></div>
        </div>

        {/* Additional Decorative Elements */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Version Number */}
      <div className="absolute bottom-6 right-6 text-xs text-gray-600">
        v1.0.0
      </div>
    </div>
  )
} 