import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True when the project URL and anon key are set in .env. The anon key is safe in the app because row level security guards the data. */
export const wallConfigured = !!url && !!key;

export const supabase = wallConfigured
  ? createClient(url as string, key as string, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;

/** Public address of a photo in the wall bucket. */
export const wallImageUrl = (path: string) => `${url}/storage/v1/object/public/wall/${path}`;
