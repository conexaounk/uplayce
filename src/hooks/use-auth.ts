import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Busca o role do usuário na tabela user_roles
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.log("Usuário sem role atribuído ou erro ao buscar");
        setUserRole(null);
        return;
      }

      setUserRole(data?.role || null);
    } catch (err) {
      console.error("Erro ao buscar user role:", err);
      setUserRole(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // Busca o role se houver usuário autenticado
      if (currentUser?.id) {
        fetchUserRole(currentUser.id);
      } else {
        setUserRole(null);
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Busca o role se houver usuário autenticado
        if (currentUser?.id) {
          fetchUserRole(currentUser.id);
        } else {
          setUserRole(null);
        }

        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
