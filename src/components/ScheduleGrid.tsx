import { DAYS, type Day, type LocationId } from '../types'
import type { Employee, LocationSchedule } from '../types'
import { DayColumn, DayColumnLegend } from './DayColumn'

interface ScheduleGridProps {
  location: LocationId
  schedule: LocationSchedule
  selectedDay: Day | null
  onSelectDay: (day: Day) => void
  onRemoveAssignment: (employeeId: string, day: Day) => void
  getEmployee: (id: string) => Employee | undefined
}

export function ScheduleGrid({
  location,
  schedule,
  selectedDay,
  onSelectDay,
  onRemoveAssignment,
  getEmployee,
}: ScheduleGridProps) {
  return (
    <div className="schedule-grid">
      <DayColumnLegend />
      <div className="schedule-grid__scroll">
        {DAYS.map((day) => (
          <DayColumn
            key={day}
            day={day}
            location={location}
            assignments={schedule[location][day]}
            isSelected={selectedDay === day}
            onSelectDay={onSelectDay}
            onRemoveAssignment={onRemoveAssignment}
            getEmployee={getEmployee}
          />
        ))}
      </div>
    </div>
  )
}
