import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DayData, FinanceSettings, FixedScheduleItem } from '../types/finance';

const SUPABASE_CONFIG_STORAGE_KEY = 'tra_no_supabase_config_v1';
const DEVICE_ID_KEY = 'tra_no_device_id_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface CloudPayload {
  days: DayData[];
  settings: FinanceSettings;
  schedules: FixedScheduleItem[];
  updatedAt: string;
  deviceId: string;
}

// Generate or retrieve persistent local device ID
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// Get saved or env credentials
export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  const saved = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    } catch {
      return null;
    }
  }
  return null;
}

// Save config to localStorage
export function saveSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(
    SUPABASE_CONFIG_STORAGE_KEY,
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
  cachedClient = null; // Reset client
}

// Remove config
export function clearSupabaseConfig() {
  localStorage.removeItem(SUPABASE_CONFIG_STORAGE_KEY);
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getSupabaseConfig();
  if (!config || !config.url || !config.anonKey) return null;

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    return cachedClient;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }
}

const PRIMARY_ROW_ID = 'primary_plan';
const TABLE_NAME = 'app_sync';

/**
 * Fetch the latest data from Supabase
 */
export async function fetchCloudPlan(): Promise<CloudPayload | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from(TABLE_NAME)
      .select('data, updated_at')
      .eq('id', PRIMARY_ROW_ID)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch warning:', error.message);
      return null;
    }

    if (data && data.data) {
      return data.data as CloudPayload;
    }
    return null;
  } catch (err) {
    console.error('Fetch cloud plan error:', err);
    return null;
  }
}

/**
 * Push current plan to Supabase
 */
export async function pushCloudPlan(payload: CloudPayload): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from(TABLE_NAME)
      .upsert({
        id: PRIMARY_ROW_ID,
        data: payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('Supabase push error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Push cloud plan error:', err);
    return false;
  }
}

/**
 * Subscribe to realtime updates via WebSockets
 */
export function subscribeToCloudPlan(
  onUpdate: (payload: CloudPayload) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const myDeviceId = getDeviceId();

  const channel = client
    .channel('public:app_sync')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE_NAME,
        filter: `id=eq.${PRIMARY_ROW_ID}`
      },
      (payload) => {
        const newRecord = payload.new as { data?: CloudPayload };
        if (newRecord && newRecord.data) {
          // If updated by another device, notify listener
          if (newRecord.data.deviceId !== myDeviceId) {
            onUpdate(newRecord.data);
          }
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
