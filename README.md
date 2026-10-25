# Home Build Ledger

A minimal React app for tracking house construction expenses.

## Features
- Dashboard: total, monthly chart, category breakdown, filters by duration and category
- Calendar tab: daily totals per day, highlighted for big spending days, with a day detail list
- Filters: duration, category, text search, min/max amount and single date
- Expense table shows 10 or 15 rows per page with pagination
- Add, edit and delete expenses, with an optional bill photo and a preview
- Highlights for amounts over 10k, 20k and 50k
- Labour entries ask for the worker's name and the work done that day
- Contacts for dealers and contractors
- Monthly spend limit with a pop-up when crossed
- Export the filtered list to Excel or PDF
- Responsive from small phones to large desktops

## Run it
```
npm install
npm run dev
```
This starts two things together:
- the **API server** (port 3001), which stores everything in `server/data/`
- the **web app** (port 5173), exposed on your Wi-Fi

Open the `http://<your-ip>:5173` address Vite prints on any device on the same network.

### One-port production mode
```
npm run build
npm start
```
Everything is served from `http://<your-ip>:3001` (the server prints the Wi-Fi address).

Requires Node 18 or newer.

## Where the data lives
```
server/data/
  db.json       all expenses, contacts and the monthly limit
  uploads/      bill images (one file per bill)
```
- Every device reads and writes the same files through the server, and refreshes every 5 seconds.
- To back up or move your data, copy the `server/data` folder. Set `DATA_DIR=/some/path` to store it elsewhere.
- Changes are saved per record, so two devices editing different items never overwrite each other. Editing the same item at the same moment keeps the last save.
- There is no login. Run it on a trusted home network only.

## Structure
```
server/index.js      JSON-file API + image storage (no dependencies)
src/
  main.js            entry point
  App.js             dashboard, filters, limit, modals
  html.js            React + htm template helper
  styles.css         all styles (light and dark themes)
  components/        Amount, MonthChart, ExpenseForm, Contacts
  lib/
    format.js        categories, formatting, date ranges, image compression
    storage.js       talks to the server API
    export.js        Excel and PDF builders
    download.js      file saving
```

## API
- `GET /api/records` returns all records
- `PUT /api/records/:id` creates or replaces a record (a `bill` data-URL is saved as a file)
- `DELETE /api/records/:id` removes a record and its bill file
- `GET /uploads/<file>` returns a bill image

## Notes
- Email alerts are not included; the limit warning is an in-app pop-up.
- Templates use `htm` (JSX-like syntax in template strings), so no build plugin is needed.
