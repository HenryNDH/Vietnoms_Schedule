import { type Day, DAY_LABELS, type LocationId, type ShiftAssignment } from '../types'
import { EmployeeChip } from './EmployeeChip'
import type { Employee } from '../types'

interface DayColumnProps {
  day: Day
  location: LocationId
  assignments: ShiftAssignment[]
  isSelected: boolean
  onSelectDay: (day: Day) => void
  onRemoveAssignment: (employeeId: string, day: Day) => void
  getEmployee: (id: string) => Employee | undefined
}

export function DayColumn({
  day,
  assignments,
  isSelected,
  onSelectDay,
  onRemoveAssignment,
  getEmployee,
}: DayColumnProps) {
  function handleRemove(employeeId: string, name: string) {
    if (window.confirm(`Remove ${name} from ${DAY_LABELS[day]}?`)) {
      onRemoveAssignment(employeeId, day)
    }
  }

  return (
    <div className={`day-column ${isSelected ? 'is-selected' : ''}`}>
      <button
        type="button"
        className="day-column__header"
        onClick={() => onSelectDay(day)}
        aria-pressed={isSelected}
      >
        {DAY_LABELS[day]}
      </button>
      <div
        className={`day-column__dropzone ${assignments.length === 0 ? 'is-empty' : ''}`}
      >
        {assignments.length === 0 && (
          <span className="day-column__placeholder">
            {isSelected ? 'Tap staff below' : 'Tap day first'}
          </span>
        )}
        {assignments.map((assignment) => {
          const employee = getEmployee(assignment.employeeId)
          if (!employee) return null
          return (
            <EmployeeChip
              key={assignment.employeeId}
              employee={employee}
              shift={assignment.shift}
              onClick={() => handleRemove(assignment.employeeId, employee.name)}
            />
          )
        })}
      </div>
    </div>
  )
}

export function DayColumnLegend() {
  return (
    <p className="day-column-legend">
      Tap a <strong>day</strong> to select it, then tap staff below to assign.
    </p>
  )
}
