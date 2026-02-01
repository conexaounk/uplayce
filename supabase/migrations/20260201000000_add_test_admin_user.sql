-- Script para adicionar um usuário admin de teste
-- Este script cria um usuário no auth.users e adiciona a role 'admin' na tabela user_roles

-- Nota: Este é um script de exemplo. Na prática, você precisará:
-- 1. Criar o usuário via Supabase Auth (UI ou API)
-- 2. Usar o ID do usuário criado e inserir na tabela user_roles

-- Exemplo de inserção após criar o usuário:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('USER_ID_HERE', 'admin');

-- Para ver todos os usuários e suas roles:
-- SELECT u.id, u.email, ur.role
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur ON u.id = ur.user_id;
