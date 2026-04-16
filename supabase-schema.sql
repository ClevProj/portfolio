-- Crie esta tabela no seu projeto Supabase usando o SQL Editor

-- Tabela de Projetos
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  tech_stack TEXT[] DEFAULT '{}',
  demo_url TEXT,
  github_url TEXT,
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'wip',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints para garantir valores válidos
  CONSTRAINT check_status CHECK (status IN ('prod', 'wip'))
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Política de acesso (leitura pública)
CREATE POLICY "Enable read access for all users" ON projects
  FOR SELECT USING (true);

-- Índices para melhor performance
CREATE INDEX idx_projects_featured ON projects(featured);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_status ON projects(status);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
