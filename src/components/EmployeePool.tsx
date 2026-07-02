import { type FormEvent, useMemo, useState } from 'react'
import {
  DAY_LABELS,
  LOCATION_LABELS,
  SHIFT_SHORT,
  type Day,
  type Employee,
  type LocationId,
  type StaffDayStatus,
} from '../types'
import { EmployeeChip } from './EmployeeChip'

interface EmployeePoolProps {
  employees: Employee[]
  selectedDay: Day | null
  activeLocation: LocationId
  getStaffDayStatus: (employeeId: string, day: Day, location: LocationId) => StaffDayStatus
  getAssignmentOnDay: (
    employeeId: string,
    day: Day,
    location: LocationId,
  ) => { shift: import('../types').ShiftType } | undefined
  getOtherLocation: (employeeId: string, day: Day, location: LocationId) => LocationId | null
  getAssignmentCount: (id: string) => number
  onAssignStaff: (employeeId: string) => void
  onUnassignStaff: (employeeId: string) => void
  onToggleAvailability: (employeeId: string, available: boolean) => void
  onAddEmployee: (name: string, role: string) => boolean
  onDeleteEmployee: (id: string) => void
}

const STATUS_LABELS: Record<StaffDayStatus, string> = {
  available: 'Available',
  unavailable: 'Off',
  'other-location': 'Other location',
  scheduled: 'Scheduled',
}

export function EmployeePool({
  employees,
  selectedDay,
  activeLocation,
  getStaffDayStatus,
  getAssignmentOnDay,
  getOtherLocation,
  getAssignmentCount,
  onAssignStaff,
  onUnassignStaff,
  onToggleAvailability,
  onAddEmployee,
  onDeleteEmployee,
}: EmployeePoolProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [showForm, setShowForm] = useState(false)

  const sortedStaff = useMemo(() => {
    if (!selectedDay) return employees

    const order: Record<StaffDayStatus, number> = {
      available: 0,
      scheduled: 1,
      'other-location': 2,
      unavailable: 3,
    }

    return [...employees].sort((a, b) => {
      const statusA = getStaffDayStatus(a.id, selectedDay, activeLocation)
      const statusB = getStaffDayStatus(b.id, selectedDay, activeLocation)
      return order[statusA] - order[statusB] || a.name.localeCompare(b.name)
    })
  }, [employees, selectedDay, activeLocation, getStaffDayStatus])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (onAddEmployee(name, role)) {
      setName('')
      setRole('')
      setShowForm(false)
    }
  }

  function handleDelete(employee: Employee) {
    const assignmentCount = getAssignmentCount(employee.id)
    const message =
      assignmentCount > 0
        ? `Remove ${employee.name}? They are scheduled for ${assignmentCount} day(s) this week.`
        : `Remove ${employee.name} from staff?`

    if (window.confirm(message)) {
      onDeleteEmployee(employee.id)
    }
  }

  return (
    <section className="employee-pool">
      <div className="employee-pool__header">
        <h2>
          {selectedDay
            ? `Staff · ${DAY_LABELS[selectedDay]} · ${LOCATION_LABELS[activeLocation]}`
            : 'Staff'}
        </h2>
        <div className="employee-pool__header-actions">
          <span className="employee-pool__count">{employees.length}</span>
          <button
            type="button"
            className="employee-pool__add-btn"
            onClick={() => setShowForm((open) => !open)}
          >
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="add-staff-form" onSubmit={handleSubmit}>
          <input
            className="add-staff-form__input"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoFocus
          />
          <input
            className="add-staff-form__input"
            type="text"
            placeholder="Role (e.g. Server)"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            required
          />
          <button type="submit" className="add-staff-form__submit">
            Add staff
          </button>
        </form>
      )}

      {!selectedDay ? (
        <p className="employee-pool__hint employee-pool__hint--prompt">
          Tap a day in the schedule above to see who is available.
        </p>
      ) : (
        <p className="employee-pool__hint">
          Tap available staff to assign. Toggle off for days they cannot work.
        </p>
      )}

      <div className="employee-pool__list">
        {!selectedDay ? (
          <p className="employee-pool__empty">No day selected.</p>
        ) : employees.length === 0 ? (
          <p className="employee-pool__empty">No staff yet. Tap + Add to get started.</p>
        ) : (
          sortedStaff.map((employee) => {
            const status = getStaffDayStatus(employee.id, selectedDay, activeLocation)
            const isAssignable = status === 'available'
            const otherLoc = getOtherLocation(employee.id, selectedDay, activeLocation)
            const assignment = getAssignmentOnDay(employee.id, selectedDay, activeLocation)
            const manuallyOff = status === 'unavailable'

            if (status === 'scheduled') {
              return (
                <div key={employee.id} className="staff-row staff-row--scheduled">
                  <div className="staff-row__info">
                    <span className="staff-row__name">{employee.name}</span>
                    <span className="staff-row__meta">
                      {employee.role} · {SHIFT_SHORT[assignment!.shift]}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="staff-row__unassign"
                    onClick={() => onUnassignStaff(employee.id)}
                  >
                    Remove
                  </button>
                </div>
              )
            }

            return (
              <div key={employee.id} className={`staff-row staff-row--${status}`}>
                {isAssignable ? (
                  <EmployeeChip
                    employee={employee}
                    onClick={() => onAssignStaff(employee.id)}
                    onDelete={() => handleDelete(employee)}
                  />
                ) : (
                  <div className="staff-row__static">
                    <div className="staff-row__info">
                      <span className="staff-row__name">{employee.name}</span>
                      <span className="staff-row__meta">{employee.role}</span>
                    </div>
                    <span className={`staff-row__status staff-row__status--${status}`}>
                      {status === 'other-location' && otherLoc
                        ? `At ${LOCATION_LABELS[otherLoc]}`
                        : STATUS_LABELS[status]}
                    </span>
                  </div>
                )}
                <label className="staff-row__toggle" title="Available this day?">
                  <input
                    type="checkbox"
                    checked={!manuallyOff}
                    disabled={status === 'other-location'}
                    onChange={(event) => onToggleAvailability(employee.id, event.target.checked)}
                  />
                  <span className="staff-row__toggle-label">
                    {manuallyOff ? 'Off' : 'On'}
                  </span>
                </label>
                {!isAssignable && status !== 'other-location' && (
                  <button
                    type="button"
                    className="staff-row__delete"
                    aria-label={`Remove ${employee.name}`}
                    onClick={() => handleDelete(employee)}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
