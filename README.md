# PawTrack

A courier-style tracking website for pet transport — enter a tracking number to see a live map, delivery-style progress stages, and a full event history, the same way you'd track a package.

## Features
- Tracking-number lookup with a FedEx/UPS-style results view
- Stage tracker: Booked → Picked Up → In Transit → Out for Delivery → Delivered
- Live map (Leaflet + OpenStreetMap) showing origin, destination, and current location
- Detailed event log with timestamps and locations
- Responsive layout, light/dark theme support

## Demo tracking numbers
- `PAW-48213967` — in transit
- `PAW-77104582` — delivered
- `PAW-90385271` — out for delivery
- `PAW-15529043` — just booked

## Running locally
Open `index.html` directly, or serve the folder with any static file server:

```
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Tech
Plain HTML, CSS, and JavaScript, plus [Leaflet](https://leafletjs.com/) for the map. No build step, no backend — shipment data is defined in `js/shipments.js`.
