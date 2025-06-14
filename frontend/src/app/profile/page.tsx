'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'
import { colors, tw, components, animations, utils } from '@/config/design-system'

interface User {
  id: string
  email?: string
  created_at: string
  user_metadata?: {
    name?: string
    avatar_url?: string
  }
  user_data?: {
    age: number | null
    gender: string | null
    country: string | null
    company: string | null
    department: string | null
    job_title: string | null
    linkedin_url: string | null
    is_profile_complete: boolean
  }
}

interface EditState {
  isEditing: boolean
  field: 'name' | 'password' | 'professional_details' | null
}

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

export default function ProfilePage() {
  const searchParams = useSearchParams()
  const showFormParam = searchParams?.get('showForm')
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editState, setEditState] = useState<EditState>({ 
    isEditing: showFormParam === 'true', 
    field: showFormParam === 'true' ? 'professional_details' : null 
  })
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [professionalFormData, setProfessionalFormData] = useState<UserData>({
    age: null,
    gender: null,
    country: null,
    company: null,
    department: null,
    job_title: null,
    linkedin_url: null,
    is_profile_complete: false
  })
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await createClient().auth.getUser()
      setUser(user)
      setFormData(prev => ({ ...prev, name: user?.user_metadata?.name || '' }))
      setLoading(false)
      if (user) {
        const { data, error } = await createClient().from('user_data').select('*').eq('id', user.id).single()
        
        if (data) {
          setUserData(data)
          setProfessionalFormData(data)
        }
      }
    }
    
    getUser()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
  }

  const handleProfessionalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfessionalFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
  }

  const handleUpdateName = async () => {
    try {
      setLoading(true)
      const { data, error } = await createClient().auth.updateUser({
        data: { name: formData.name }
      })

      if (error) throw error

      setUser(data.user)
      setEditState({ isEditing: false, field: null })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    try {
      setLoading(true)
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('New passwords do not match')
      }

      const { error } = await createClient().auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      setEditState({ isEditing: false, field: null })
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfessionalDetails = async () => {
    try {
      setSavingProfile(true)
      setError(null)
      
      // Validate required fields
      if (!professionalFormData.age || !professionalFormData.gender || !professionalFormData.country || 
          !professionalFormData.company || !professionalFormData.department || !professionalFormData.job_title) {
        throw new Error('Please fill in all required fields')
      }

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Prepare the data for submission
      const userDataToSubmit = {
        ...professionalFormData,
        id: user.id,
        is_profile_complete: true
      }

      const { data, error } = await createClient().from('user_data').upsert(userDataToSubmit, {
          onConflict: 'id'
        })

      if (error) throw error

      setUserData(userDataToSubmit)
      setEditState({ isEditing: false, field: null })
      
      // Show success message or toast here
    } catch (err: any) {
      setError(err.message || 'Failed to update profile details')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className={utils.cn("min-h-screen flex items-center justify-center", tw.bg.primary)}>
        <div className={utils.cn("animate-spin w-8 h-8 border-2 rounded-full border-t-transparent", tw.text.blue)} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className={utils.cn("min-h-screen flex items-center justify-center", tw.bg.primary)}>
        <div className={tw.text.primary}>Please sign in to view your profile.</div>
      </div>
    )
  }

  const createdDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className={utils.cn("min-h-screen p-8", tw.bg.primary)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className={tw.typography.mainHeading}>Profile</h1>
          <div className={utils.cn("h-1 w-20 rounded-full mt-2", tw.text.blue)} 
               style={{ background: colors.gradient.blue }} />
        </div>

        {/* Profile Card */}
        <div className={utils.cn(components.card.primary, "shadow-2xl")}>
          {/* Avatar Section */}
          <div className="flex items-center space-x-6 mb-8">
            <div className={utils.cn(
              "w-24 h-24 rounded-full flex items-center justify-center shadow-lg ring-2",
              components.iconContainer.blue,
              tw.border.primary
            )}>
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className={utils.cn("text-4xl font-bold", tw.text.primary)}>
                  {(user.user_metadata?.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className={tw.typography.sectionHeading}>
                {user.user_metadata?.name || 'User'}
              </h2>
              <p className={utils.cn("flex items-center mt-1", tw.text.secondary)}>
                <svg className={utils.cn("w-4 h-4 mr-1.5", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user.email}
              </p>
              
              <div className="mt-3 flex items-center">
                <div className={utils.cn("h-2 w-2 rounded-full mr-2 animate-pulse", tw.text.emerald)}></div>
                <span className={utils.cn("text-xs font-medium", tw.text.emerald)}>Online</span>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-5">
            {/* Name Section */}
            <div className={utils.cn(components.card.nested, "p-5 rounded-xl border border-white/[0.06] hover:border-blue-500/20 transition-colors duration-300")}>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <svg className={utils.cn("w-5 h-5 text-blue-400 mr-2", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className={utils.cn("text-sm font-medium", tw.text.secondary)}>Name</div>
                </div>
                <button
                  onClick={() => setEditState({ isEditing: true, field: 'name' })}
                  className={utils.cn("text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center", tw.text.blue)}
                >
                  <svg className={utils.cn("w-4 h-4 mr-1", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>
              </div>
              {editState.isEditing && editState.field === 'name' ? (
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={utils.cn("w-full bg-[#111111]/80 rounded-xl px-4 py-2.5", tw.border.primary)}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateName}
                      disabled={loading}
                      className={utils.cn("px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg", tw.text.blue)}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditState({ isEditing: false, field: null })}
                      className={utils.cn("px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 rounded-lg transition-colors text-sm", tw.text.secondary)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={utils.cn("text-white/90 mt-1.5 text-lg font-medium", tw.text.primary)}>{user?.user_metadata?.name || 'Not set'}</div>
              )}
            </div>

            {/* Password Change Section */}
            <div className={utils.cn(components.card.nested, "p-5 rounded-xl border border-white/[0.06] hover:border-blue-500/20 transition-colors duration-300")}>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <svg className={utils.cn("w-5 h-5 text-blue-400 mr-2", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div className={utils.cn("text-sm font-medium", tw.text.secondary)}>Password</div>
                </div>
                <button
                  onClick={() => setEditState({ isEditing: true, field: 'password' })}
                  className={utils.cn("text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center", tw.text.blue)}
                >
                  <svg className={utils.cn("w-4 h-4 mr-1", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Change Password
                </button>
              </div>
              {editState.isEditing && editState.field === 'password' && (
                <div className="mt-3 space-y-3">
                  <div className="relative">
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="New password"
                      className={utils.cn("w-full bg-[#111111]/80 rounded-xl px-4 py-2.5 pl-10", tw.border.primary)}
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className={utils.cn("w-5 h-5 text-gray-500", tw.text.secondary)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      className={utils.cn("w-full bg-[#111111]/80 rounded-xl px-4 py-2.5 pl-10", tw.border.primary)}
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className={utils.cn("w-5 h-5 text-gray-500", tw.text.secondary)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdatePassword}
                      disabled={loading}
                      className={utils.cn("px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg", tw.text.blue)}
                    >
                      <svg className={utils.cn("w-4 h-4 mr-1.5", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Update Password
                    </button>
                    <button
                      onClick={() => {
                        setEditState({ isEditing: false, field: null })
                        setFormData(prev => ({ 
                          ...prev, 
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        }))
                      }}
                      className={utils.cn("px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 rounded-lg transition-colors text-sm", tw.text.secondary)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={utils.cn(components.card.nested, "p-5 rounded-xl border border-white/[0.06] hover:border-blue-500/20 transition-colors duration-300")}>
                <div className="flex items-center mb-2">
                  <svg className={utils.cn("w-5 h-5 text-blue-400 mr-2", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <div className={utils.cn("text-sm font-medium", tw.text.secondary)}>User ID</div>
                </div>
                <div className="relative group">
                  <code className={utils.cn("text-xs font-mono break-all select-all cursor-pointer", tw.text.primary)}>
                    {user.id}
                  </code>
                </div>
              </div>

              <div className={utils.cn(components.card.nested, "p-5 rounded-xl border border-white/[0.06] hover:border-blue-500/20 transition-colors duration-300")}>
                <div className="flex items-center mb-2">
                  <svg className={utils.cn("w-5 h-5 text-blue-400 mr-2", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6-6m-6 0l6 6" />
                  </svg>
                  <div className={utils.cn("text-sm font-medium", tw.text.secondary)}>Member Since</div>
                </div>
                <div className={utils.cn("text-sm font-medium", tw.text.primary)}>{createdDate}</div>
              </div>
            </div>

            {/* Professional Details Section */}
            <div className={utils.cn(components.card.nested, "p-5 rounded-xl border border-white/[0.06] hover:border-blue-500/20 transition-colors duration-300")}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <svg className={utils.cn("w-5 h-5 text-blue-400 mr-2", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                  <div className={utils.cn("text-sm font-medium", tw.text.secondary)}>Professional Details</div>
                </div>
                {!editState.isEditing && (
                  <button
                    onClick={() => setEditState({ isEditing: true, field: 'professional_details' })}
                    className={utils.cn("text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center", tw.text.blue)}
                  >
                    <svg className={utils.cn("w-4 h-4 mr-1", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    {userData?.is_profile_complete ? 'Edit' : 'Complete Profile'}
                  </button>
                )}
              </div>

              {editState.isEditing && editState.field === 'professional_details' ? (
                <div className="space-y-4">
                  {error && (
                    <div className={utils.cn("p-3 rounded-lg text-sm", tw.text.rose)}>
                      {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={utils.cn("block text-sm font-medium mb-2", tw.text.secondary)}>Age *</label>
                      <input
                        type="number"
                        name="age"
                        value={professionalFormData.age || ''}
                        onChange={handleProfessionalChange}
                        className={utils.cn("w-full bg-[#111111]/80 rounded-xl px-4 py-2.5", tw.border.primary)}
                        placeholder="25"
                      />
                    </div>
                    
                    <div>
                      <label className={utils.cn("block text-sm font-medium mb-2", tw.text.secondary)}>Gender *</label>
                      <select
                        name="gender"
                        value={professionalFormData.gender || ''}
                        onChange={handleProfessionalChange}
                        className={utils.cn("w-full bg-[#111111]/80 rounded-xl px-4 py-2.5", tw.border.primary)}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={utils.cn("block text-sm font-medium mb-2", tw.text.secondary)}>Country *</label>
                      <input
                        type="text"
                        name="country"
                        value={professionalFormData.country || ''}
                        onChange={handleProfessionalChange}
                        className={utils.cn("w-full bg-[#111111]/80 rounded-xl px-4 py-2.5", tw.border.primary)}
                        placeholder="United States"
                      />
                    </div>
                    
                    <div>
                      <label className={utils.cn("block text-sm font-medium mb-2", tw.text.secondary)}>Company *</label>
                      <input
                        type="text"
                        name="company"
                        value={professionalFormData.company || ''}
                        onChange={handleProfessionalChange}
                        className={utils.cn("w-full bg-[#111111]/80 rounded-xl px-4 py-2.5", tw.border.primary)}
                        placeholder="Acme Corp"
                      />
                    </div>
                    
                    <div>
                      <label className={utils.cn("block text-sm font-medium mb-2", tw.text.secondary)}>Department *</label>
                      <input
                        type="text"
                        name="department"
                        value={professionalFormData.department || ''}
                        onChange={handleProfessionalChange}
                        className={utils.cn("w-full bg-[#111111]/80 rounded-xl px-4 py-2.5", tw.border.primary)}
                        placeholder="Engineering"
                      />
                    </div>
                    
                    <div>
                      <label className={utils.cn("block text-sm font-medium mb-2", tw.text.secondary)}>Job Title *</label>
                      <input
                        type="text"
                        name="job_title"
                        value={professionalFormData.job_title || ''}
                        onChange={handleProfessionalChange}
                        className={utils.cn("w-full bg-[#111111]/80 rounded-xl px-4 py-2.5", tw.border.primary)}
                        placeholder="Software Engineer"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={utils.cn("block text-sm font-medium mb-2", tw.text.secondary)}>LinkedIn URL (Optional)</label>
                    <input
                      type="url"
                      name="linkedin_url"
                      value={professionalFormData.linkedin_url || ''}
                      onChange={handleProfessionalChange}
                      className={utils.cn("w-full bg-[#111111]/80 rounded-xl px-4 py-2.5", tw.border.primary)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleUpdateProfessionalDetails}
                      disabled={savingProfile}
                      className={utils.cn("px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl", tw.text.blue)}
                    >
                      {savingProfile ? 'Saving...' : 'Save Details'}
                    </button>
                    <button
                      onClick={() => {
                        setEditState({ isEditing: false, field: null })
                        setError(null)
                        if (userData) {
                          setProfessionalFormData(userData)
                        }
                      }}
                      className={utils.cn("px-6 py-2.5 text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 rounded-lg transition-colors", tw.text.secondary)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {userData?.is_profile_complete ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className={utils.cn("font-medium", tw.text.secondary)}>Age:</span>
                        <span className={utils.cn("ml-2", tw.text.primary)}>{userData.age}</span>
                      </div>
                      <div>
                        <span className={utils.cn("font-medium", tw.text.secondary)}>Gender:</span>
                        <span className={utils.cn("ml-2 capitalize", tw.text.primary)}>{userData.gender}</span>
                      </div>
                      <div>
                        <span className={utils.cn("font-medium", tw.text.secondary)}>Country:</span>
                        <span className={utils.cn("ml-2", tw.text.primary)}>{userData.country}</span>
                      </div>
                      <div>
                        <span className={utils.cn("font-medium", tw.text.secondary)}>Company:</span>
                        <span className={utils.cn("ml-2", tw.text.primary)}>{userData.company}</span>
                      </div>
                      <div>
                        <span className={utils.cn("font-medium", tw.text.secondary)}>Department:</span>
                        <span className={utils.cn("ml-2", tw.text.primary)}>{userData.department}</span>
                      </div>
                      <div>
                        <span className={utils.cn("font-medium", tw.text.secondary)}>Job Title:</span>
                        <span className={utils.cn("ml-2", tw.text.primary)}>{userData.job_title}</span>
                      </div>
                      {userData.linkedin_url && (
                        <div className="md:col-span-2">
                          <span className={utils.cn("font-medium", tw.text.secondary)}>LinkedIn:</span>
                          <a 
                            href={userData.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={utils.cn("ml-2 hover:underline", tw.text.blue)}
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={utils.cn("text-center py-8", tw.text.secondary)}>
                      <svg className={utils.cn("w-12 h-12 mx-auto mb-4 opacity-50", tw.text.blue)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Complete your profile to get personalized learning recommendations</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 