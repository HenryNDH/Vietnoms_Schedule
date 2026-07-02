import { SHIFT_SHORT, type Employee, type ShiftType } from '../types'

interface EmployeeChipProps {
  employee: Employee
  shift?: ShiftType
  onClick?: () => void
  onDelete?: () => void
}

export function EmployeeChip({ employee, shift, onClick, onDelete }: EmployeeChipProps) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`employee-chip ${onClick ? 'employee-chip--clickable' : ''}`}
      onClick={onClick}
    >
      <div className="employee-chip__content">
        <span className="employee-chip__name">{employee.name}</span>
        <span className="employee-chip__role">{employee.role}</span>
        {shift && <span className="employee-chip__shift">{SHIFT_SHORT[shift]}</span>}
      </div>
      {onDelete && (
        <button
          type="button"
          className="employee-chip__delete"
          aria-label={`Remove ${employee.name}`}
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
        >
          ×
        </button>
      )}
    </Tag>
  )
}
