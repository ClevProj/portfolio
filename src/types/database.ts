// Tipos das tabelas do Supabase
export interface Project {
  id: string
  title: string
  description: string
  image_url: string
  tags: string[]
  demo_url?: string
  github_url?: string
  featured: boolean
  tipo?: string
  status?: string
  created_at: string
  updated_at: string
}
