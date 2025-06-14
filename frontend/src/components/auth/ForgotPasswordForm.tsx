'use client'

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Create an array of refs for the OTP input fields
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize the refs array when the component mounts
  useEffect(() => {
    inputRefs.current = Array(6).fill(null).map((_, i) => inputRefs.current[i] || null)
  }, [])

  // Update the OTP value when individual digits change
  useEffect(() => {
    const otpString = otpValues.join('')
    setOtp(otpString)
  }, [otpValues])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Explicitly set redirectTo to null to ensure OTP is used instead of magic link
        redirectTo: null
      })

      if (error) throw error
      
      setEmailSent(true)
      setOtpValues(Array(6).fill(''))
      
      // Focus on the first input after a short delay
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus()
        }
      }, 100)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      })

      if (error) throw error
      
      setOtpVerified(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      
      // Navigate to sign in page
      router.push('/auth/signin')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Handle input change for individual OTP digits
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return
    
    // Update the OTP values array
    const newOtpValues = [...otpValues]
    newOtpValues[index] = value.slice(0, 1) // Take only the first character
    setOtpValues(newOtpValues)
    
    // If a digit was entered, move focus to the next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }
  
  // Handle key presses in OTP fields
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      // If current field is empty and backspace is pressed, move to previous field
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Move to previous field on left arrow
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      // Move to next field on right arrow
      inputRefs.current[index + 1]?.focus()
    }
  }
  
  // Handle paste events to fill multiple OTP fields
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text/plain').trim()
    
    // Check if pasted content is numeric and has valid length
    if (!/^\d+$/.test(pasteData)) return
    
    // Fill in as many fields as we have digits
    const newOtpValues = [...otpValues]
    pasteData.split('').forEach((char, idx) => {
      if (idx < 6) {
        newOtpValues[idx] = char
      }
    })
    
    setOtpValues(newOtpValues)
    
    // Focus the next empty field or the last field
    const nextEmptyIndex = newOtpValues.findIndex(val => !val)
    if (nextEmptyIndex >= 0 && nextEmptyIndex < 6) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }

  // Render the password reset form (after OTP has been verified)
  if (otpVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#020202] to-[#050505] text-white p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
        {/* Keep the background effects and branding from the form */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-transparent blur-3xl"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 via-transparent to-transparent blur-3xl"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
        </div>

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative"
        >
          <div className="bg-[#0A0A0A]/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-800/50 shadow-2xl relative">
            <div className="mb-8 relative">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-full"></div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    Reset Password
                  </h1>
                  <p className="text-gray-400 mt-2">Create a new password for your account</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-6">
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

              <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#111111]/80 rounded-xl px-4 py-3
                      focus:outline-none focus:ring-2 focus:ring-blue-500/20
                      border border-gray-800/50 text-gray-100
                      placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                </div>
              </div>

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
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#111111]/80 rounded-xl px-4 py-3
                      focus:outline-none focus:ring-2 focus:ring-blue-500/20
                      border border-gray-800/50 text-gray-100
                      placeholder-gray-500 transition-all duration-200"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>

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
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  // Render the OTP verification form
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#020202] to-[#050505] text-white p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
        {/* Keep the background effects and branding from the form */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-transparent blur-3xl"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 via-transparent to-transparent blur-3xl"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
        </div>

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative"
        >
          <div className="bg-[#0A0A0A]/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-800/50 shadow-2xl relative">
            <div className="mb-8 relative">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-full"></div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    Verify OTP
                  </h1>
                  <p className="text-gray-400 mt-2">Enter the verification code sent to your email</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
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

              <div className="space-y-4">
                <label htmlFor="otp-1" className="block text-sm font-medium text-gray-300">
                  Verification Code (OTP)
                </label>
                
                {/* New OTP input fields */}
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div 
                      key={index} 
                      className="w-full max-w-[60px] relative"
                    >
                      <input
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        id={`otp-${index + 1}`}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otpValues[index]}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        maxLength={1}
                        className="w-full aspect-square text-center text-xl font-bold bg-[#111111]/80 rounded-xl
                          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/80
                          border border-gray-800/50 text-gray-100 transition-all duration-200
                          hover:border-gray-700/70"
                        required
                      />
                      {index < 5 && (
                        <div className="hidden sm:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-gray-500">-</div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Hidden input for form submission */}
                <input 
                  type="hidden" 
                  name="otp" 
                  value={otp} 
                  required
                />
              </div>

              <div className="mt-4 text-sm text-gray-400 bg-blue-900/10 p-4 rounded-xl border border-blue-900/20">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Please check your email inbox for the 6-digit verification code. If you don't see it, check your spam folder.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={`w-full py-3 rounded-xl font-medium text-center transition-all duration-200
                  bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600
                  hover:from-blue-500 hover:via-blue-600 hover:to-blue-700
                  text-white shadow-lg ${(loading || otp.length !== 6) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying...</span>
                  </div>
                ) : 'Verify Code'}
              </button>

              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Resend code
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  // Render the form to request a password reset
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020202] to-[#050505] text-white p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-transparent blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 via-transparent to-transparent blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
      </div>

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="bg-[#0A0A0A]/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-800/50 shadow-2xl relative">
          <div className="mb-8 relative">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  Reset Password
                </h1>
                <p className="text-gray-400 mt-2">Enter your email to receive a verification code</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-6">
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

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111111]/80 rounded-xl px-4 py-3
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20
                    border border-gray-800/50 text-gray-100
                    placeholder-gray-500 transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

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
                  <span>Sending...</span>
                </div>
              ) : 'Send Reset Code'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/auth/signin')}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
} 