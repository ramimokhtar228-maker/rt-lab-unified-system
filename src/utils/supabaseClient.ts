import { createClient, RealtimeChannel } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://tuwtwpqnqjvpaymayxpu.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d3R3cHFucWp2cGF5bWF5eHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzg5ODMsImV4cCI6MjEwODY1NDk4M30.ZDF23ITRcQWRRm66l1V8RhPGffIUGD9NqNq4VRCwARU';

// Initialize Supabase Client with persistent realtime options
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

export const REALTIME_CHANNEL_NAME = 'rt_lab_unified_sync_v2';
