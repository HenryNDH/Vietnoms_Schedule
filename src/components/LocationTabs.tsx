import { LOCATION_LABELS, LOCATIONS, type LocationId } from '../types'

interface LocationTabsProps {
  active: LocationId
  onChange: (location: LocationId) => void
}

export function LocationTabs({ active, onChange }: LocationTabsProps) {
  return (
    <div className="location-tabs" role="tablist" aria-label="Restaurant locations">
      {LOCATIONS.map((location) => (
        <button
          key={location}
          type="button"
          role="tab"
          aria-selected={active === location}
          className={`location-tabs__tab ${active === location ? 'is-active' : ''}`}
          onClick={() => onChange(location)}
        >
          {LOCATION_LABELS[location]}
        </button>
      ))}
    </div>
  )
}
