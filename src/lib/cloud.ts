import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import type { AppData } from './storage'

const ROW_ID = 'vietnoms-main'

function getClient() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function loadCloudAppData(): Promise<AppData | null> {
  const supabase = getClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('schedule_data')
    .select('payload, updated_at')
    .eq('id', ROW_ID)
    .maybeSingle()

  if (error || !data?.payload) return null

  const payload = data.payload as AppData
  return {
    employees: payload.employees ?? [],
    schedule: payload.schedule,
    availability: payload.availability ?? {},
    updatedAt: data.updated_at ?? payload.updatedAt ?? new Date().toISOString(),
  }
}

export async function saveCloudAppData(data: AppData): Promise<void> {
  const supabase = getClient()
  if (!supabase) return

  const updatedAt = new Date().toISOString()
  const { error } = await supabase.from('schedule_data').upsert({
    id: ROW_ID,
    payload: { ...data, updatedAt },
    updated_at: updatedAt,
  })

  if (error) throw error
}

export function subscribeCloudAppData(onUpdate: (data: AppData) => void): () => void {
  const supabase = getClient()
  if (!supabase) return () => {}

  let channel: RealtimeChannel | null = supabase
    .channel('vietnoms-schedule-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'schedule_data', filter: `id=eq.${ROW_ID}` },
      async () => {
        const data = await loadCloudAppData()
        if (data) onUpdate(data)
      },
    )
    .subscribe()

  return () => {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }
}
