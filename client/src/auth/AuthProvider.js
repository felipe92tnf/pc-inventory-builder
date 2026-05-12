import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
const AuthContext = createContext(null);
function configurationAuthError(message) {
    return { message, status: 0, name: "AuthError" };
}
export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(() => supabaseConfigured);
    useEffect(() => {
        if (!supabase) {
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
        }
        let cancelled = false;
        void supabase.auth.getSession().then(({ data }) => {
            if (cancelled)
                return;
            setSession(data.session ?? null);
            setUser(data.session?.user ?? null);
            setLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
            setUser(nextSession?.user ?? null);
        });
        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);
    const signInWithPassword = useCallback(async (email, password) => {
        if (!supabase) {
            return {
                error: configurationAuthError("Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en client/.env (Supabase → Settings → API).")
            };
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    }, []);
    const signOut = useCallback(async () => {
        if (!supabase)
            return;
        await supabase.auth.signOut();
    }, []);
    const value = useMemo(() => ({
        user,
        session,
        loading,
        signInWithPassword,
        signOut
    }), [user, session, loading, signInWithPassword, signOut]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth debe usarse dentro de AuthProvider.");
    }
    return ctx;
}
