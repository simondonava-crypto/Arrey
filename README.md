# Pacific Petcare Airways

A courier-style tracking website for pet transport — enter a tracking number to see a live map, delivery-style progress stages, and a full event history, the same way you'd track a package.

## Features
- Tracking-number lookup with a FedEx/UPS-style results view
- Stage tracker: Booked → Picked Up → In Transit → Out for Delivery → Delivered
- Live map (Leaflet + OpenStreetMap) showing origin, destination, and current location
- Admin dashboard for staff to create shipments, advance their stage, and delete them
- Crates & Carriers catalog
- Responsive layout, light/dark theme support, scroll-triggered reveal animations

## Backend
Shipment data lives in [Supabase](https://supabase.com) (Postgres + row-level security), not in this repo. To set it up:

1. Create a Supabase project.
2. Run `supabase-setup.sql` in its SQL Editor.
3. Create a staff login under Authentication → Users (this is what you sign into `/admin` with — there's no public sign-up).
4. Fill in `js/supabase-client.js` with that project's URL and anon key.

The public tracking page only ever reads from the `shipments_public` view, which excludes the receiver's contact info and exact pickup address — those stay staff-only.

## Running locally
Open `index.html` directly, or serve the folder with any static file server:

```
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Tech
Plain HTML, CSS, and JavaScript, plus [Leaflet](https://leafletjs.com/) for the map and the [Supabase JS client](https://supabase.com/docs/reference/javascript) for the backend. No build step.
