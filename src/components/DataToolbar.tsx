import { useRef, type ChangeEvent } from 'react'
import type { AppData } from '../lib/storage'
import { downloadAppData, readAppDataFile } from '../lib/storage'
import type { SyncStatus } from '../hooks/useSchedule'

interface DataToolbarProps {
  syncStatus: SyncStatus
  lastSavedAt: string
  isCloudSyncEnabled: boolean
  getAppData: () => AppData
  onImport: (data: AppData) => void
}

function formatSavedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return 'just now'
  }
}

const STATUS_LABELS: Record<SyncStatus, string> = {
  local: 'Saved on this device',
  syncing: 'Saving…',
  synced: 'Synced for all devices',
  error: 'Cloud sync failed — saved locally',
}

export function DataToolbar({
  syncStatus,
  lastSavedAt,
  isCloudSyncEnabled,
  getAppData,
  onImport,
}: DataToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await readAppDataFile(file)
      onImport(data)
      window.alert('Schedule backup restored.')
    } catch {
      window.alert('Could not read that file. Pick a Vietnoms backup JSON.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section className="data-toolbar">
      <div className="data-toolbar__status">
        <span className={`data-toolbar__dot data-toolbar__dot--${syncStatus}`} />
        <div>
          <p className="data-toolbar__label">{STATUS_LABELS[syncStatus]}</p>
          <p className="data-toolbar__meta">
            Last saved {formatSavedAt(lastSavedAt)}
            {!isCloudSyncEnabled && ' · use Export to move to another phone'}
          </p>
        </div>
      </div>
      <div className="data-toolbar__actions">
        <button
          type="button"
          className="data-toolbar__btn"
          onClick={() => downloadAppData(getAppData())}
        >
          Export
        </button>
        <button
          type="button"
          className="data-toolbar__btn"
          onClick={() => fileInputRef.current?.click()}
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImport}
        />
      </div>
    </section>
  )
}
