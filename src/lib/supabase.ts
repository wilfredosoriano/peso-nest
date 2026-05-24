import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  'https://ncdsypavmjlrlypqbtgu.supabase.co',
  'sb_publishable_FXHii7I5F5QA6du-75Qp2g_UPB1LxXE',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Called once at app startup. Creates a persistent anonymous Supabase session
// so RLS policies (TO authenticated) apply to all subsequent queries.
// If a session already exists in AsyncStorage it is reused — no new user is created.
export const ensureAnonSession = async (): Promise<void> => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await supabase.auth.signInAnonymously();
  }
};
