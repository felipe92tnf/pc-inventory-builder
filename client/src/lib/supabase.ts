import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

/** `true` cuando existen URL y anon key (p. ej. en `client/.env`). */
export const supabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

/**
 * Cliente browser: sesión persistente (localStorage), refresco de tokens y detección en URL.
 * Es `null` si faltan variables de entorno (la UI muestra instrucciones en login).
 */
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
