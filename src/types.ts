export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Day = (typeof DAYS)[number]

export const DAY_LABELS: Record<Day, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

export const LOCATIONS = ['downtown', 'westside'] as const
export type LocationId = (typeof LOCATIONS)[number]

export const LOCATION_LABELS: Record<LocationId, string> = {
  downtown: 'Dufferin St',
  westside: 'Bathurst St',
}

export type ShiftType = 'full' | 'morning' | 'night'

export const SHIFT_LABELS: Record<ShiftType, string> = {
  full: 'Full day',
  morning: 'Morning half',
  night: 'Night half',
}

export const SHIFT_SHORT: Record<ShiftType, string> = {
  full: 'Full',
  morning: 'AM',
  night: 'PM',
}

export interface Employee {
  id: string
  name: string
  role: string
}

export interface ShiftAssignment {
  employeeId: string
  shift: ShiftType
}

export type DaySchedule = Record<Day, ShiftAssignment[]>

export type LocationSchedule = Record<LocationId, DaySchedule>

/** Per-employee per-day manual availability. Absent = available. `false` = marked off. */
export type EmployeeAvailability = Record<string, Partial<Record<Day, boolean>>>

export type StaffDayStatus = 'available' | 'unavailable' | 'other-location' | 'scheduled'

export interface PendingAssignment {
  employeeId: string
  location: LocationId
  day: Day
}

export function emptyDaySchedule(): DaySchedule {
  return {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  }
}

export function emptySchedule(): LocationSchedule {
  return {
    downtown: emptyDaySchedule(),
    westside: emptyDaySchedule(),
  }
}

export function isManuallyAvailable(
  availability: EmployeeAvailability,
  employeeId: string,
  day: Day,
): boolean {
  return availability[employeeId]?.[day] !== false
}
