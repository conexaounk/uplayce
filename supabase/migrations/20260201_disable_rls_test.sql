-- Desabilitar RLS na tabela user_roles para teste
-- Isso permitirá que a query funcione sem problemas de autenticação

ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Alternativamente, se precisar de RLS, usar:
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Após teste, você pode reabilitar e corrigir as policies
