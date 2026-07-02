import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_EMPLOYEES } from '../data/employees'
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

const SCHEDULE_STORAGE_KEY = 'vietnoms-schedule-v2'
const EMPLOYEES_STORAGE_KEY = 'vietnoms-employees-v3'
const AVAILABILITY_STORAGE_KEY = 'vietnoms-availability-v1'

function loadSchedule(): LocationSchedule {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY)
    if (!raw) return emptySchedule()
    const parsed = JSON.parse(raw) as LocationSchedule
    return normalizeSchedule(parsed)
  } catch {
    return emptySchedule()
  }
}

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

function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY)
    if (!raw) return DEFAULT_EMPLOYEES
    return JSON.parse(raw) as Employee[]
  } catch {
    return DEFAULT_EMPLOYEES
  }
}

function loadAvailability(): EmployeeAvailability {
  try {
    const raw = localStorage.getItem(AVAILABILITY_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as EmployeeAvailability
  } catch {
    return {}
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

export function useSchedule() {
  const [schedule, setSchedule] = useState<LocationSchedule>(loadSchedule)
  const [employees, setEmployees] = useState<Employee[]>(loadEmployees)
  const [availability, setAvailability] = useState<EmployeeAvailability>(loadAvailability)
  const [activeLocation, setActiveLocation] = useState<LocationId>('downtown')
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)

  useEffect(() => {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule))
  }, [schedule])

  useEffect(() => {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees))
  }, [employees])

  useEffect(() => {
    localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(availability))
  }, [availability])

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
  }
}
