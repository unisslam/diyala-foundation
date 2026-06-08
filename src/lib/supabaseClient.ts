/**
 * supabaseClient.ts
 * -----------------
 * Initialises and exports the Supabase client singleton.
 *
 * Environment variables are loaded via Vite's import.meta.env.
 * Add the following keys to your .env.local file (never commit them):
 *
 *   VITE_SUPABASE_URL=https://<project-id>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
 */

import { createClient } from "@supabase/supabase-js";

// ── Validate required environment variables ─────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[Supabase] Missing environment variables.\n" +
      "Please create a `.env.local` file with:\n" +
      "  VITE_SUPABASE_URL=...\n" +
      "  VITE_SUPABASE_ANON_KEY=..."
  );
}

// ── Create singleton client ─────────────────────────────────────────
export const supabase = createClient<any>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Persist auth state in localStorage so users stay logged-in
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "diyala-foundation",
      },
    },
  }
);

// ── Storage helpers ─────────────────────────────────────────────────
export const BUCKETS = {
  /** Project images, documents */
  PROJECTS: "projects",
  /** News & media images */
  NEWS: "news",
  /** Gallery / media centre photos */
  GALLERY: "gallery",
  /** Team member avatars */
  TEAM: "team",
} as const;

/**
 * Builds a public URL for a file stored in Supabase Storage.
 * @param bucket  - One of the BUCKETS constants
 * @param path    - The storage path (e.g. "images/photo.jpg")
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
