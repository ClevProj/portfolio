import { supabase } from '../lib/supabase'
import type { Project } from '../types/database'


// Projects
export async function getProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Project[]
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

export async function getFeaturedProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Project[]
  } catch (error) {
    console.error('Error fetching featured projects:', error)
    return []
  }
}
