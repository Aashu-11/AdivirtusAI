import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function SecureProfilePage() {
  const supabase = await createClient()
  
  // Use getUser instead of getSession for secure authentication check
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    // Redirect to login if user is not authenticated
    redirect('/login')
  }
  
  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
        Secure Profile Page
      </h1>
      
      <div className="bg-[#0E0E0E] border border-gray-800/70 rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-medium text-white mb-4">User Information</h2>
        <div className="space-y-3">
          <div>
            <span className="text-gray-400">Email:</span>
            <span className="ml-2 text-white">{data.user.email}</span>
          </div>
          <div>
            <span className="text-gray-400">User ID:</span>
            <span className="ml-2 text-white">{data.user.id}</span>
          </div>
          <div>
            <span className="text-gray-400">Last Sign In:</span>
            <span className="ml-2 text-white">
              {new Date(data.user.last_sign_in_at || '').toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 