import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_EMPLOYEES } from '../data/employees'
import { loadCloudAppData, saveCloudAppData, subscribeCloudAppData } from '../lib/cloud'
import {
  type AppData,
  isCloudSyncEnabled,
  loadLocalAppData,
  saveLocalAppData,
} from '../lib/storage'
import {
  DAYS,
  LOCATIONS,
  type Day,
  type Employee,
  type EmployeeAvailability,
  type LocationId,
  type LocationSchedule,
  type ShiftAssignment,
  type ShiftType,
  type StaffDayStatus,
  emptySchedule,
  isManuallyAvailable,
} from '../types'

function normalizeSchedule(data: LocationSchedule): LocationSchedule {
  const next = emptySchedule()
  for (const location of LOCATIONS) {
    for (const day of DAYS) {
      const cell = data[location]?.[day] ?? []
      next[location][day] = cell.map((entry) => {
        if (typeof entry === 'string') {
          return { employeeId: entry, shift: 'full' as ShiftType }
        }
        return entry as ShiftAssignment
      })
    }
  }
  return next
}

function initialAppData(): AppData {
  const local = loadLocalAppData()
  if (local) {
    return {
      employees: local.employees.length > 0 ? local.employees : DEFAULT_EMPLOYEES,
      schedule: normalizeSchedule(local.schedule),
      availability: local.availability ?? {},
      updatedAt: local.updatedAt,
    }
  }

  return {
    employees: DEFAULT_EMPLOYEES,
    schedule: emptySchedule(),
    availability: {},
    updatedAt: new Date().toISOString(),
  }
}

function cloneSchedule(schedule: LocationSchedule): LocationSchedule {
  const next = emptySchedule()
  for (const location of LOCATIONS) {
    for (const day of DAYS) {
      next[location][day] = schedule[location][day].map((a) => ({ ...a }))
    }
  }
  return next
}

function removeFromCell(
  schedule: LocationSchedule,
  location: LocationId,
  day: Day,
  employeeId: string,
): LocationSchedule {
  const next = cloneSchedule(schedule)
  next[location][day] = next[location][day].filter((a) => a.employeeId !== employeeId)
  return next
}

function removeEmployeeFromSchedule(schedule: LocationSchedule, employeeId: string): LocationSchedule {
  const next = cloneSchedule(schedule)
  for (const location of LOCATIONS) {
    for (const day of DAYS) {
      next[location][day] = next[location][day].filter((a) => a.employeeId !== employeeId)
    }
  }
  return next
}

function findAssignmentOnDay(
  schedule: LocationSchedule,
  day: Day,
  employeeId: string,
): { location: LocationId; assignment: ShiftAssignment } | null {
  for (const location of LOCATIONS) {
    const assignment = schedule[location][day].find((a) => a.employeeId === employeeId)
    if (assignment) return { location, assignment }
  }
  return null
}

function isNewer(a: string, b: string): boolean {
  return new Date(a).getTime() > new Date(b).getTime()
}

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error'

export function useSchedule() {
  const initial = useMemo(() => initialAppData(), [])
  const [schedule, setSchedule] = useState<LocationSchedule>(initial.schedule)
  const [employees, setEmployees] = useState<Employee[]>(initial.employees)
  const [availability, setAvailability] = useState<EmployeeAvailability>(initial.availability)
  const [activeLocation, setActiveLocation] = useState<LocationId>('downtown')
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isCloudSyncEnabled() ? 'syncing' : 'local')
  const [lastSavedAt, setLastSavedAt] = useState(initial.updatedAt)

  const updatedAtRef = useRef(initial.updatedAt)
  const cloudTimerRef = useRef<number | null>(null)
  const skipNextCloudSaveRef = useRef(false)

  const persist = useCallback((next: Omit<AppData, 'updatedAt'>) => {
    const data: AppData = {
      ...next,
      updatedAt: new Date().toISOString(),
    }
    updatedAtRef.current = data.updatedAt
    setLastSavedAt(data.updatedAt)
    saveLocalAppData(data)

    if (!isCloudSyncEnabled()) {
      setSyncStatus('local')
      return
    }

    setSyncStatus('syncing')
    if (cloudTimerRef.current) window.clearTimeout(cloudTimerRef.current)
    cloudTimerRef.current = window.setTimeout(async () => {
      try {
        await saveCloudAppData(data)
        setSyncStatus('synced')
      } catch {
        setSyncStatus('error')
      }
    }, 800)
  }, [])

  const applyRemoteData = useCallback((data: AppData) => {
    if (!isNewer(data.updatedAt, updatedAtRef.current)) return
    skipNextCloudSaveRef.current = true
    updatedAtRef.current = data.updatedAt
    setLastSavedAt(data.updatedAt)
    setEmployees(data.employees)
    setSchedule(normalizeSchedule(data.schedule))
    setAvailability(data.availability ?? {})
    saveLocalAppData(data)
    setSyncStatus('synced')
  }, [])

  useEffect(() => {
    persist({ employees, schedule, availability })
  }, [employees, schedule, availability, persist])

  useEffect(() => {
    if (!isCloudSyncEnabled()) return

    let cancelled = false

    async function bootstrapCloud() {
      try {
        const cloud = await loadCloudAppData()
        if (cancelled) return

        if (cloud && isNewer(cloud.updatedAt, updatedAtRef.current)) {
          applyRemoteData(cloud)
        } else {
          await saveCloudAppData({
            employees,
            schedule,
            availability,
            updatedAt: updatedAtRef.current,
          })
        }
        setSyncStatus('synced')
      } catch {
        if (!cancelled) setSyncStatus('error')
      }
    }

    bootstrapCloud()
    const unsubscribe = subscribeCloudAppData((data) => {
      if (skipNextCloudSaveRef.current) {
        skipNextCloudSaveRef.current = false
        return
      }
      applyRemoteData(data)
    })

    return () => {
      cancelled = true
      unsubscribe()
      if (cloudTimerRef.current) window.clearTimeout(cloudTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const importAppData = useCallback((data: AppData) => {
    const normalized: AppData = {
      employees: data.employees,
      schedule: normalizeSchedule(data.schedule),
      availability: data.availability ?? {},
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    }
    updatedAtRef.current = normalized.updatedAt
    setEmployees(normalized.employees)
    setSchedule(normalized.schedule)
    setAvailability(normalized.availability)
    setLastSavedAt(normalized.updatedAt)
    saveLocalAppData(normalized)
    if (isCloudSyncEnabled()) {
      saveCloudAppData(normalized).catch(() => setSyncStatus('error'))
    }
  }, [])

  const employeeMap = useMemo(() => {
    return new Map(employees.map((employee) => [employee.id, employee]))
  }, [employees])

  const getStaffDayStatus = useCallback(
    (employeeId: string, day: Day, location: LocationId): StaffDayStatus => {
      if (!isManuallyAvailable(availability, employeeId, day)) {
        return 'unavailable'
      }

      const existing = findAssignmentOnDay(schedule, day, employeeId)
      if (!existing) return 'available'
      if (existing.location === location) return 'scheduled'
      return 'other-location'
    },
    [availability, schedule],
  )

  const getAssignmentOnDay = useCallback(
    (employeeId: string, day: Day, location: LocationId): ShiftAssignment | undefined => {
      return schedule[location][day].find((a) => a.employeeId === employeeId)
    },
    [schedule],
  )

  const getOtherLocation = useCallback(
    (employeeId: string, day: Day, currentLocation: LocationId): LocationId | null => {
      const existing = findAssignmentOnDay(schedule, day, employeeId)
      if (!existing || existing.location === currentLocation) return null
      return existing.location
    },
    [schedule],
  )

  const getAssignmentCount = useCallback(
    (employeeId: string): number => {
      let count = 0
      for (const location of LOCATIONS) {
        for (const day of DAYS) {
          if (schedule[location][day].some((a) => a.employeeId === employeeId)) count++
        }
      }
      return count
    },
    [schedule],
  )

  const assignShift = useCallback(
    (employeeId: string, location: LocationId, day: Day, shift: ShiftType) => {
      setSchedule((current) => {
        const status = getStaffDayStatus(employeeId, day, location)
        if (status === 'unavailable' || status === 'other-location') return current

        let next = removeFromCell(current, location, day, employeeId)
        next = cloneSchedule(next)
        next[location][day] = [...next[location][day], { employeeId, shift }]
        return next
      })
    },
    [getStaffDayStatus],
  )

  const unassignFromCell = useCallback((employeeId: string, location: LocationId, day: Day) => {
    setSchedule((current) => removeFromCell(current, location, day, employeeId))
  }, [])

  const setDayAvailability = useCallback((employeeId: string, day: Day, isAvailable: boolean) => {
    setAvailability((current) => {
      const next = { ...current }
      if (!next[employeeId]) next[employeeId] = {}
      if (isAvailable) {
        const days = { ...next[employeeId] }
        delete days[day]
        if (Object.keys(days).length === 0) {
          const { [employeeId]: _, ...rest } = next
          return rest
        }
        next[employeeId] = days
      } else {
        next[employeeId] = { ...next[employeeId], [day]: false }
      }
      return next
    })
  }, [])

  const addEmployee = useCallback((name: string, role: string) => {
    const trimmedName = name.trim()
    const trimmedRole = role.trim()
    if (!trimmedName || !trimmedRole) return false

    setEmployees((current) => [
      ...current,
      { id: crypto.randomUUID(), name: trimmedName, role: trimmedRole },
    ])
    return true
  }, [])

  const deleteEmployee = useCallback((employeeId: string) => {
    setEmployees((current) => current.filter((employee) => employee.id !== employeeId))
    setSchedule((current) => removeEmployeeFromSchedule(current, employeeId))
    setAvailability((current) => {
      const { [employeeId]: _, ...rest } = current
      return rest
    })
  }, [])

  const clearWeek = useCallback((location: LocationId) => {
    setSchedule((current) => {
      const next = cloneSchedule(current)
      for (const day of DAYS) {
        next[location][day] = []
      }
      return next
    })
  }, [])

  const getEmployee = useCallback(
    (id: string): Employee | undefined => employeeMap.get(id),
    [employeeMap],
  )

  return {
    schedule,
    activeLocation,
    setActiveLocation,
    selectedDay,
    setSelectedDay,
    employees,
    availability,
    assignShift,
    unassignFromCell,
    setDayAvailability,
    addEmployee,
    deleteEmployee,
    clearWeek,
    getEmployee,
    getAssignmentCount,
    getStaffDayStatus,
    getAssignmentOnDay,
    getOtherLocation,
    syncStatus,
    lastSavedAt,
    importAppData,
    isCloudSyncEnabled: isCloudSyncEnabled(),
  }
}
