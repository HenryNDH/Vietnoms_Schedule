# Vietnoms Staff Schedule

A mobile-first web app for managing weekly employee schedules across two Vietnoms restaurant locations.

## Features

- **7-day grid** — Mon through Sun columns with drag-and-drop assignment
- **Two locations** — Downtown and Westside, each with its own weekly schedule
- **Touch-friendly** — Works on phones and tablets (long-press to drag on mobile)
- **Auto-save** — Schedule persists in browser localStorage

## Getting started

```bash
cd ~/Projects/vietnoms-schedule
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Usage

1. Pick a location tab (Downtown or Westside).
2. Drag staff from **Available Staff** into a day column.
3. Move people between days or back to the pool to unassign.
4. Use **Clear week** to reset the active location.

## Customize

- Employee list: `src/data/employees.ts`
- Location names: `src/types.ts` (`LOCATION_LABELS`)
