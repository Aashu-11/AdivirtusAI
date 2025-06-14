import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function createClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies()
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This can happen when the cookies are accessed in a Server Component.
            // The cookie would still be set, but middleware will refresh session if needed.
            console.error('Error setting cookie:', error)
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies()
            cookieStore.delete({ name, ...options })
          } catch (error) {
            // This can happen when the cookies are accessed in a Server Component.
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
} 