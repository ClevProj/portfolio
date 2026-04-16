# Configuração do Supabase para o ClevProj

## 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Escolha sua organização
5. Dê um nome ao projeto (ex: `clevproj`)
6. Escolha uma senha forte para o banco de dados
7. Selecione a região mais próxima de você
8. Aguarde a criação do projeto

## 2. Configurar Variáveis de Ambiente

1. No painel do Supabase, vá para **Settings > API**
2. Copie a **Project URL** e a **anon public key**
3. Crie um arquivo `.env` na raiz do projeto:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas credenciais:
```env
PUBLIC_SUPABASE_URL=sua_url_aqui
PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

## 3. Criar Tabela no Banco de Dados

1. No painel do Supabase, vá para **SQL Editor**
2. Copie e cole o conteúdo do arquivo `supabase-schema.sql`
3. Clique em "Run" para executar o script

## 4. Inserir Dados Iniciais (Opcional)

### Projetos de Exemplo
```sql
INSERT INTO projects (title, description, image_url, tech_stack, demo_url, github_url, featured) VALUES
('Projeto 1', 'Descrição do primeiro projeto', '/images/project1.jpg', ARRAY['React', 'TypeScript', 'Tailwind'], 'https://demo1.com', 'https://github.com/user/project1', true),
('Projeto 2', 'Descrição do segundo projeto', '/images/project2.jpg', ARRAY['Next.js', 'Prisma', 'PostgreSQL'], 'https://demo2.com', 'https://github.com/user/project2', false);
```

## 5. Usar no Projeto

### Buscar Projetos
```typescript
import { getProjects, getFeaturedProjects } from '../utils/database'

// Todos os projetos
const projects = await getProjects()

// Apenas projetos em destaque
const featuredProjects = await getFeaturedProjects()
```

## 6. Segurança

O projeto já está configurado com:
- **Row Level Security (RLS)** habilitado
- Política de acesso de leitura pública para projetos

## 7. Deploy

Para deploy em produção:
1. Configure as variáveis de ambiente no seu serviço de hosting
2. Verifique se as URLs do Supabase estão corretas
3. Teste todas as funcionalidades

## Troubleshooting

### Erro de CORS
Verifique as configurações de CORS em **Settings > API** no painel do Supabase.

### Problemas de Conexão
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto Supabase está ativo
- Teste a conexão usando o SQL Editor

### Dados Não Aparecendo
- Verifique as políticas RLS
- Confirme se há dados na tabela projects
- Use o Table Editor para inspecionar os dados
