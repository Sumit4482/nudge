import { useEffect, useState } from 'react';
import { supabase, wallConfigured } from './supabase';

/** Who is signed in to the proof wall. */
export function useWallSession(): { configured: boolean; userId: string | null; email: string | null } {
  const [state, setState] = useState<{ userId: string | null; email: string | null }>({ userId: null, email: null });
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setState({ userId: data.session?.user.id ?? null, email: data.session?.user.email ?? null });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({ userId: session?.user.id ?? null, email: session?.user.email ?? null });
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return { configured: wallConfigured, ...state };
}
