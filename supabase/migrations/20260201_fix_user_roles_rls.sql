-- Adicionar uma policy mais permissiva para leitura de roles
-- Permitir que qualquer usuário autenticado leia a tabela user_roles sem restrição
-- (a segurança será validada no backend se necessário)

-- Remover a policy antiga se existir
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Criar nova policy que permite leitura para qualquer usuário autenticado
CREATE POLICY "Authenticated users can read user_roles"
ON public.user_roles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Manter as policies de INSERT, UPDATE, DELETE apenas para admins
-- DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
-- DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
-- DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
