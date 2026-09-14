# PawTrack

A lightweight web app for tracking cats and dogs — status (available, fostered, adopted, lost, found), profile details, and a full history timeline per pet.

## Features
- Add, edit, and remove pets
- Track each pet's status over time with a timeline
- Filter by species and status, search by name or breed
- Responsive layout, light/dark theme support
- No build step, no backend — data is stored in the browser via `localStorage`

## Running locally
Just open `index.html` in a browser, or serve the folder with any static file server:

```
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Tech
Plain HTML, CSS, and JavaScript — no frameworks or external dependencies.
