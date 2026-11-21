import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ensurePermission, setupNotifications } from '../notifications/focus';
import { currentUserId } from './api';
import { supabase } from './supabase';

export interface Cheer {
  id: number;
  name: string | null;
  created_at: string;
}

/** Your most recent cheers, newest first. Only the signed-in owner can read them. */
export async function fetchCheers(limit = 20): Promise<Cheer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('cheers').select('id,name,created_at').order('created_at', { ascending: false }).limit(limit);
  return error || !data ? [] : (data as Cheer[]);
}

/**
 * Save this phone's Expo push token so a cheer can reach you with the app closed.
 * Needs a development or production build with Firebase set up. In Expo Go this quietly does nothing.
 */
export async function registerPush(): Promise<boolean> {
  if (!supabase || Platform.OS === 'web') return false;
  try {
    const uid = await currentUserId();
    if (!uid) return false;
    await setupNotifications();
    if (!(await ensurePermission())) return false;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return false;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const { error } = await supabase.from('push_tokens').upsert({ token, user_id: uid, updated_at: new Date().toISOString() });
    return !error;
  } catch {
    return false;
  }
}
