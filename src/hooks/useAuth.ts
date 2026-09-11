/**
 * useAuth.ts
 * ----------
 * Supabase Auth hook for admin panel.
 * Returns current session, user, and auth actions.
 */

import { useState, useEffect, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { AdminProfileRow, AdminPermissions } from "@/types/database.types";

export interface UseAuthResult {
  user: User | null;
  session: Session | null;
  profile: AdminProfileRow | null;
  loading: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permission: keyof AdminPermissions) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser]         = useState<User | null>(null);
  const [session, setSession]   = useState<Session | null>(null);
  const [profile, setProfile]   = useState<AdminProfileRow | null>(null);
  const [loading, setLoading]   = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as AdminProfileRow);
      } else {
        // Fallback profile for backward compatibility if user is authenticated
        setProfile({
          id: userId,
          team_member_id: null,
          full_name: "مدير النظام",
          role: "super_admin",
          permissions: {
            can_manage_news: true,
            can_manage_projects: true,
            can_manage_memberships: true,
            can_manage_team: true,
            can_manage_messages: true,
            can_manage_gallery: true,
            can_manage_admins: true,
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        void fetchProfile(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSession(sess);
        const currentUser = sess?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          void fetchProfile(currentUser.id).finally(() => setLoading(false));
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const hasPermission = useCallback((permission: keyof AdminPermissions): boolean => {
    if (!profile || !profile.is_active) return false;
    if (profile.role === "super_admin") return true;
    return Boolean(profile.permissions?.[permission]);
  }, [profile]);

  const isSuperAdmin = Boolean(profile?.is_active && profile?.role === "super_admin");

  async function signIn(
    email: string,
    password: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    setProfile(null);
  }

  const refetchProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  return {
    user,
    session,
    profile,
    loading,
    isSuperAdmin,
    hasPermission,
    signIn,
    signOut,
    refetchProfile,
  };
}

