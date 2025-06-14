import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function useAssessment(userId: string) {
  return useQuery({
    queryKey: ['assessment', userId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lsa_assessment')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      return data
    }
  })
} 