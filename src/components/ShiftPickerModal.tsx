import { useState } from 'react'
import { DAY_LABELS, LOCATION_LABELS, SHIFT_LABELS, type Day, type LocationId, type ShiftType } from '../types'
import type { Employee } from '../types'

interface ShiftPickerModalProps {
  employee: Employee
  day: Day
  location: LocationId
  onConfirm: (shift: ShiftType) => void
  onCancel: () => void
}

export function ShiftPickerModal({ employee, day, location, onConfirm, onCancel }: ShiftPickerModalProps) {
  const [duration, setDuration] = useState<'full' | 'half' | null>(null)
  const [halfPart, setHalfPart] = useState<'morning' | 'night' | null>(null)

  function handleConfirm() {
    if (duration === 'full') {
      onConfirm('full')
      return
    }
    if (duration === 'half' && halfPart === 'morning') {
      onConfirm('morning')
      return
    }
    if (duration === 'half' && halfPart === 'night') {
      onConfirm('night')
    }
  }

  const canConfirm = duration === 'full' || (duration === 'half' && halfPart !== null)

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="modal shift-picker"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="shift-picker-title"
      >
        <h2 id="shift-picker-title" className="shift-picker__title">
          Assign {employee.name}
        </h2>
        <p className="shift-picker__subtitle">
          {DAY_LABELS[day]} · {LOCATION_LABELS[location]}
        </p>

        <div className="shift-picker__section">
          <p className="shift-picker__label">Shift length</p>
          <div className="shift-picker__options">
            <button
              type="button"
              className={`shift-picker__option ${duration === 'full' ? 'is-selected' : ''}`}
              onClick={() => {
                setDuration('full')
                setHalfPart(null)
              }}
            >
              Full day
            </button>
            <button
              type="button"
              className={`shift-picker__option ${duration === 'half' ? 'is-selected' : ''}`}
              onClick={() => setDuration('half')}
            >
              Half day
            </button>
          </div>
        </div>

        {duration === 'half' && (
          <div className="shift-picker__section">
            <p className="shift-picker__label">Which half?</p>
            <div className="shift-picker__options">
              <button
                type="button"
                className={`shift-picker__option ${halfPart === 'morning' ? 'is-selected' : ''}`}
                onClick={() => setHalfPart('morning')}
              >
                Morning half
              </button>
              <button
                type="button"
                className={`shift-picker__option ${halfPart === 'night' ? 'is-selected' : ''}`}
                onClick={() => setHalfPart('night')}
              >
                Night half
              </button>
            </div>
          </div>
        )}

        {duration === 'full' && (
          <p className="shift-picker__preview">{SHIFT_LABELS.full}</p>
        )}
        {duration === 'half' && halfPart && (
          <p className="shift-picker__preview">{SHIFT_LABELS[halfPart]}</p>
        )}

        <div className="shift-picker__actions">
          <button type="button" className="shift-picker__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="shift-picker__confirm"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  )
}
