'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import Select from 'react-select'
import { countryOptions, departmentOptions, jobTitleOptions } from '@/data/formOptions'

interface UserData {
  age: number | null
  gender: string | null
  country: string | null
  company: string | null
  department: string | null
  job_title: string | null
  linkedin_url: string | null
  is_profile_complete: boolean
}

export default function ProfileAssessment() {
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [userData, setUserData] = useState<UserData>({
    age: null,
    gender: null,
    country: null,
    company: null,
    department: null,
    job_title: null,
    linkedin_url: null,
    is_profile_complete: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [customDepartment, setCustomDepartment] = useState('')
  const [customJobTitle, setCustomJobTitle] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await createClient().auth.getUser()
      setUser(user)
      if (user) {
        const { data, error } = await createClient().from('user_data').select('*').eq('id', user.id).single()
        
        if (data) {
          setUserData(data)
          setSuccess(data.is_profile_complete)
        }
      }
    }
    getUser()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSelectChange = (field: keyof UserData, option: any) => {
    if (option.value === 'Other') {
      setUserData(prev => ({
        ...prev,
        [field]: null
      }))
      if (field === 'department') {
        setCustomDepartment('')
      } else if (field === 'job_title') {
        setCustomJobTitle('')
      }
    } else {
      setUserData(prev => ({
        ...prev,
        [field]: option.value
      }))
    }
  }

  const handleCustomInput = (field: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!userData.age || !userData.gender || !userData.country || !userData.company || 
          !userData.department || !userData.job_title) {
        throw new Error('Please fill in all required fields')
      }

      // Prepare the data for submission
      const userDataToSubmit = {
        id: user.id,
        age: parseInt(userData.age as any),
        gender: userData.gender,
        country: userData.country,
        company: userData.company,
        department: userData.department,
        job_title: userData.job_title,
        linkedin_url: userData.linkedin_url,
        is_profile_complete: true
      }

      console.log('Submitting data:', userDataToSubmit)

      const { data, error } = await createClient().from('user_data').upsert(userDataToSubmit, {
          onConflict: 'id'
        })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Successfully updated user data:', data)
      setSuccess(true)
    } catch (err: any) {
      console.error('Form submission error:', err)
      setError(err.message || 'Failed to save profile data')
    } finally {
      setLoading(false)
    }
  }

  if (!user || success) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 z-50"
    >
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#0A0A0A]/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Complete Your Profile</h3>
                    <p className="text-gray-400 text-sm">Help us personalize your experience</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Complete Now
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#0A0A0A]/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-white">Complete Your Profile</h3>
                  <p className="text-gray-400 text-sm mt-1">Help us personalize your experience</p>
                  
                  <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Age <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={userData.age || ''}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#111111]/80 rounded-lg px-3 py-2 text-white border border-gray-800/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="gender"
                        value={userData.gender || ''}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#111111]/80 rounded-lg px-3 py-2 text-white border border-gray-800/50"
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={countryOptions}
                        value={countryOptions.find(option => option.value === userData.country)}
                        onChange={(option) => handleSelectChange('country', option)}
                        required
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: 'rgba(17, 17, 17, 0.8)',
                            borderColor: 'rgba(31, 41, 55, 0.5)',
                            borderRadius: '0.5rem',
                            '&:hover': {
                              borderColor: 'rgba(59, 130, 246, 0.5)'
                            }
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: 'rgba(17, 17, 17, 0.95)',
                            border: '1px solid rgba(31, 41, 55, 0.5)',
                            borderRadius: '0.5rem',
                            backdropFilter: 'blur(12px)'
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(59, 130, 246, 0.2)'
                            }
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: 'white'
                          }),
                          input: (base) => ({
                            ...base,
                            color: 'white'
                          })
                        }}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Current Company <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={userData.company || ''}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#111111]/80 rounded-lg px-3 py-2 text-white border border-gray-800/50"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={departmentOptions}
                        value={departmentOptions.find(option => option.value === userData.department)}
                        onChange={(option) => handleSelectChange('department', option)}
                        required
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: 'rgba(17, 17, 17, 0.8)',
                            borderColor: 'rgba(31, 41, 55, 0.5)',
                            borderRadius: '0.5rem',
                            '&:hover': {
                              borderColor: 'rgba(59, 130, 246, 0.5)'
                            }
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: 'rgba(17, 17, 17, 0.95)',
                            border: '1px solid rgba(31, 41, 55, 0.5)',
                            borderRadius: '0.5rem',
                            backdropFilter: 'blur(12px)'
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(59, 130, 246, 0.2)'
                            }
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: 'white'
                          }),
                          input: (base) => ({
                            ...base,
                            color: 'white'
                          })
                        }}
                      />
                      {userData.department === null && (
                        <input
                          type="text"
                          value={customDepartment}
                          onChange={(e) => {
                            setCustomDepartment(e.target.value)
                            handleCustomInput('department', e.target.value)
                          }}
                          placeholder="Enter your department"
                          required
                          className="mt-2 w-full bg-[#111111]/80 rounded-lg px-3 py-2 text-white border border-gray-800/50"
                        />
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={jobTitleOptions}
                        value={jobTitleOptions.find(option => option.value === userData.job_title)}
                        onChange={(option) => handleSelectChange('job_title', option)}
                        required
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: 'rgba(17, 17, 17, 0.8)',
                            borderColor: 'rgba(31, 41, 55, 0.5)',
                            borderRadius: '0.5rem',
                            '&:hover': {
                              borderColor: 'rgba(59, 130, 246, 0.5)'
                            }
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: 'rgba(17, 17, 17, 0.95)',
                            border: '1px solid rgba(31, 41, 55, 0.5)',
                            borderRadius: '0.5rem',
                            backdropFilter: 'blur(12px)'
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(59, 130, 246, 0.2)'
                            }
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: 'white'
                          }),
                          input: (base) => ({
                            ...base,
                            color: 'white'
                          })
                        }}
                      />
                      {userData.job_title === null && (
                        <input
                          type="text"
                          value={customJobTitle}
                          onChange={(e) => {
                            setCustomJobTitle(e.target.value)
                            handleCustomInput('job_title', e.target.value)
                          }}
                          placeholder="Enter your job title"
                          required
                          className="mt-2 w-full bg-[#111111]/80 rounded-lg px-3 py-2 text-white border border-gray-800/50"
                        />
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn Profile URL</label>
                      <input
                        type="url"
                        name="linkedin_url"
                        value={userData.linkedin_url || ''}
                        onChange={handleChange}
                        className="w-full bg-[#111111]/80 rounded-lg px-3 py-2 text-white border border-gray-800/50"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>

                    {error && (
                      <div className="col-span-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="col-span-2 flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 text-white rounded-lg transition-colors ${
                          loading 
                            ? 'bg-blue-500/50 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                      >
                        {loading ? 'Saving...' : 'Complete Profile'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
} 