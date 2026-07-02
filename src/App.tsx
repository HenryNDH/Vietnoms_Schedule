import { useState } from 'react'
import { Header } from './components/Header'
import { LocationTabs } from './components/LocationTabs'
import { ScheduleGrid } from './components/ScheduleGrid'
import { EmployeePool } from './components/EmployeePool'
import { ShiftPickerModal } from './components/ShiftPickerModal'
import { useSchedule } from './hooks/useSchedule'
import { DAY_LABELS, LOCATION_LABELS, type Day, type PendingAssignment, type ShiftType } from './types'
import './App.css'

export default function App() {
  const {
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
  } = useSchedule()

  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null)

  const pendingEmployee = pendingAssignment ? getEmployee(pendingAssignment.employeeId) : undefined

  function handleShiftConfirm(shift: ShiftType) {
    if (!pendingAssignment) return
    assignShift(
      pendingAssignment.employeeId,
      pendingAssignment.location,
      pendingAssignment.day,
      shift,
    )
    setPendingAssignment(null)
  }

  function handleAssignStaff(employeeId: string) {
    if (!selectedDay) return
    if (getStaffDayStatus(employeeId, selectedDay, activeLocation) !== 'available') return

    setPendingAssignment({
      employeeId,
      location: activeLocation,
      day: selectedDay,
    })
  }

  function handleUnassignStaff(employeeId: string) {
    if (!selectedDay) return
    const employee = getEmployee(employeeId)
    if (!employee) return
    if (window.confirm(`Remove ${employee.name} from ${DAY_LABELS[selectedDay]}?`)) {
      unassignFromCell(employeeId, activeLocation, selectedDay)
    }
  }

  function handleRemoveFromGrid(employeeId: string, day: Day) {
    unassignFromCell(employeeId, activeLocation, day)
  }

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <LocationTabs active={activeLocation} onChange={setActiveLocation} />

        <div className="schedule-toolbar">
          <p className="schedule-toolbar__label">
            Weekly schedule — <strong>{LOCATION_LABELS[activeLocation]}</strong>
            {selectedDay && (
              <>
                {' '}
                · selected <strong>{DAY_LABELS[selectedDay]}</strong>
              </>
            )}
          </p>
          <button
            type="button"
            className="schedule-toolbar__clear"
            onClick={() => clearWeek(activeLocation)}
          >
            Clear week
          </button>
        </div>

        <ScheduleGrid
          location={activeLocation}
          schedule={schedule}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onRemoveAssignment={handleRemoveFromGrid}
          getEmployee={getEmployee}
        />

        <EmployeePool
          employees={employees}
          selectedDay={selectedDay}
          activeLocation={activeLocation}
          getStaffDayStatus={getStaffDayStatus}
          getAssignmentOnDay={getAssignmentOnDay}
          getOtherLocation={getOtherLocation}
          getAssignmentCount={getAssignmentCount}
          onAssignStaff={handleAssignStaff}
          onUnassignStaff={handleUnassignStaff}
          onToggleAvailability={(employeeId, isAvailable) => {
            if (selectedDay) setDayAvailability(employeeId, selectedDay, isAvailable)
          }}
          onAddEmployee={addEmployee}
          onDeleteEmployee={deleteEmployee}
        />
      </main>

      {pendingAssignment && pendingEmployee && (
        <ShiftPickerModal
          employee={pendingEmployee}
          day={pendingAssignment.day}
          location={pendingAssignment.location}
          onConfirm={handleShiftConfirm}
          onCancel={() => setPendingAssignment(null)}
        />
      )}
    </div>
  )
}
