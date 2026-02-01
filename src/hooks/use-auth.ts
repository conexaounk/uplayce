import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Busca o role do usuário na tabela user_roles
  const fetchUserRole = useCallback(async (userId: string) => {
    console.log("Fetching role for user:", userId);
    try {
      // TEMP: Retorna admin = true para todos para testes
      console.log("TEMPORARY: Setting all users as admin");
      setUserRole("admin");
      return;

      // TODO: Remover depois de testar - código original abaixo:
      /*
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");

      if (error) {
        console.log("Erro ao buscar roles:", error.message);
        setUserRole(null);
        return;
      }

      const userRoleRecord = data?.find((r: any) => r.user_id === userId);
      const role = userRoleRecord?.role || null;
      setUserRole(role);
      */
    } catch (err) {
      console.error("Erro ao buscar user role:", err);
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // Busca o role se houver usuário autenticado
      if (currentUser?.id) {
        await fetchUserRole(currentUser.id);
      } else {
        setUserRole(null);
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Busca o role se houver usuário autenticado
        if (currentUser?.id) {
          await fetchUserRole(currentUser.id);
        } else {
          setUserRole(null);
        }

        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const logout = async () => {
    setUserRole(null);
    await supabase.auth.signOut();
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  return {
    user,
    userRole,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: userRole === "admin",
    logout,
    login,
    signup,
  };
}
