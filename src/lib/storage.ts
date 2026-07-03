import type { Employee, EmployeeAvailability, LocationSchedule } from '../types'

export interface AppData {
  employees: Employee[]
  schedule: LocationSchedule
  availability: EmployeeAvailability
  updatedAt: string
}

export const APP_DATA_KEY = 'vietnoms-app-data-v1'

const LEGACY_KEYS = {
  schedule: 'vietnoms-schedule-v2',
  employees: 'vietnoms-employees-v3',
  availability: 'vietnoms-availability-v1',
} as const

export function loadLocalAppData(): AppData | null {
  try {
    const raw = localStorage.getItem(APP_DATA_KEY)
    if (raw) return JSON.parse(raw) as AppData

    const schedule = localStorage.getItem(LEGACY_KEYS.schedule)
    const employees = localStorage.getItem(LEGACY_KEYS.employees)
    const availability = localStorage.getItem(LEGACY_KEYS.availability)

    if (!schedule && !employees && !availability) return null

    return {
      schedule: schedule ? JSON.parse(schedule) : ({} as LocationSchedule),
      employees: employees ? JSON.parse(employees) : [],
      availability: availability ? JSON.parse(availability) : {},
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function saveLocalAppData(data: AppData): void {
  const payload: AppData = { ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(payload))
}

export function downloadAppData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `vietnoms-schedule-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export async function readAppDataFile(file: File): Promise<AppData> {
  const text = await file.text()
  const parsed = JSON.parse(text) as AppData
  if (!parsed.employees || !parsed.schedule) {
    throw new Error('Invalid backup file')
  }
  return {
    employees: parsed.employees,
    schedule: parsed.schedule,
    availability: parsed.availability ?? {},
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
  }
}

export function isCloudSyncEnabled(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}
