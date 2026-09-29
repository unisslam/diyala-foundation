/**
 * useMembershipTypeSettings.ts
 * ----------------------------
 * Reads and updates the `membership_type_selection` key in `app_settings`.
 *
 * Shape stored in DB:
 *   { enabled: boolean, available_types: MembershipType[] }
 *
 * - `enabled = false` → hide the type selector in JoinPage; force "regular"
 * - `enabled = true`  → show the full type selector card
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { MembershipType } from "@/types/database.types";

const SETTING_ID = "membership_type_selection";

export interface MembershipTypeSettings {
  enabled: boolean;
  available_types: MembershipType[];
}

const DEFAULT: MembershipTypeSettings = {
  enabled: false,
  available_types: ["regular", "founding", "student", "honorary"],
};

interface UseMembershipTypeSettingsReturn {
  settings: MembershipTypeSettings;
  loading: boolean;
  saving: boolean;
  update: (patch: Partial<MembershipTypeSettings>) => Promise<void>;
  reload: () => Promise<void>;
}

export function useMembershipTypeSettings(): UseMembershipTypeSettingsReturn {
  const [settings, setSettings] = useState<MembershipTypeSettings>(DEFAULT);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("id", SETTING_ID)
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        setSettings({ ...DEFAULT, ...(data.value as Partial<MembershipTypeSettings>) });
      }
    } catch {
      // Fail silently — defaults are safe
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const update = useCallback(async (patch: Partial<MembershipTypeSettings>): Promise<void> => {
    setSaving(true);
    const next = { ...settings, ...patch };
    setSettings(next); // Optimistic update
    try {
      const { error } = await supabase
        .from("app_settings")
        .update({ value: next, updated_at: new Date().toISOString() })
        .eq("id", SETTING_ID);
      if (error) throw error;
    } catch {
      // Revert on failure
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return { settings, loading, saving, update, reload };
}
