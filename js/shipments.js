// Sample tracking data. In a real system this would come from a backend API
// keyed by tracking number; here it's a static lookup for demo purposes.

const CITIES = {
  sanAntonio: { name: "San Antonio, TX", lat: 29.4241, lng: -98.4936 },
  dallas:     { name: "Dallas, TX",       lat: 32.7767, lng: -96.7970 },
  houston:    { name: "Houston, TX",      lat: 29.7604, lng: -95.3698 },
  austin:     { name: "Austin, TX",       lat: 30.2672, lng: -97.7431 }
};

function lerp(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, name: "En route" };
}

const STAGE_LABELS = ["Booked", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];

const SHIPMENTS = {
  "PAW-48213967": {
    petName: "Ruby",
    species: "dog",
    breed: "Terrier mix",
    photo: "assets/photos/ruby.jpg",
    origin: CITIES.sanAntonio,
    destination: CITIES.dallas,
    currentStageIndex: 2, // In Transit
    currentLocation: lerp(CITIES.sanAntonio, CITIES.dallas, 0.55),
    stageDates: {
      "Booked": "2026-09-10T09:00:00",
      "Picked Up": "2026-09-11T08:30:00",
      "In Transit": "2026-09-12T14:00:00"
    },
    events: [
      { date: "2026-09-12T14:00:00", location: "I-35, near Waco, TX", description: "In transit to destination facility." },
      { date: "2026-09-11T08:30:00", location: "San Antonio, TX", description: "Picked up from origin facility." },
      { date: "2026-09-11T07:15:00", location: "San Antonio, TX", description: "Health check completed, cleared for transport." },
      { date: "2026-09-10T09:00:00", location: "San Antonio, TX", description: "Shipment booked and confirmed." }
    ]
  },
  "PAW-77104582": {
    petName: "Bandit",
    species: "cat",
    breed: "Domestic shorthair",
    photo: "assets/photos/silas.jpg",
    origin: CITIES.austin,
    destination: CITIES.sanAntonio,
    currentStageIndex: 4, // Delivered
    currentLocation: CITIES.sanAntonio,
    stageDates: {
      "Booked": "2026-09-05T10:00:00",
      "Picked Up": "2026-09-06T09:00:00",
      "In Transit": "2026-09-06T13:00:00",
      "Out for Delivery": "2026-09-07T08:00:00",
      "Delivered": "2026-09-07T11:42:00"
    },
    events: [
      { date: "2026-09-07T11:42:00", location: "San Antonio, TX", description: "Delivered — signed for by recipient." },
      { date: "2026-09-07T08:00:00", location: "San Antonio, TX", description: "Out for delivery." },
      { date: "2026-09-06T13:00:00", location: "New Braunfels, TX", description: "In transit to destination facility." },
      { date: "2026-09-06T09:00:00", location: "Austin, TX", description: "Picked up from origin facility." },
      { date: "2026-09-05T10:00:00", location: "Austin, TX", description: "Shipment booked and confirmed." }
    ]
  },
  "PAW-90385271": {
    petName: "Mango",
    species: "cat",
    breed: "Orange tabby",
    photo: "assets/photos/tabby.jpg",
    origin: CITIES.houston,
    destination: CITIES.austin,
    currentStageIndex: 3, // Out for delivery
    currentLocation: lerp(CITIES.houston, CITIES.austin, 0.9),
    stageDates: {
      "Booked": "2026-09-13T08:00:00",
      "Picked Up": "2026-09-13T12:00:00",
      "In Transit": "2026-09-13T15:00:00",
      "Out for Delivery": "2026-09-14T08:30:00"
    },
    events: [
      { date: "2026-09-14T08:30:00", location: "Austin, TX", description: "Out for delivery to final destination." },
      { date: "2026-09-13T15:00:00", location: "Bastrop, TX", description: "In transit to destination facility." },
      { date: "2026-09-13T12:00:00", location: "Houston, TX", description: "Picked up from origin facility." },
      { date: "2026-09-13T08:00:00", location: "Houston, TX", description: "Shipment booked and confirmed." }
    ]
  },
  "PAW-15529043": {
    petName: "Max",
    species: "dog",
    breed: "Labrador mix",
    photo: null,
    origin: CITIES.dallas,
    destination: CITIES.houston,
    currentStageIndex: 0, // Booked
    currentLocation: CITIES.dallas,
    stageDates: {
      "Booked": "2026-09-14T09:15:00"
    },
    events: [
      { date: "2026-09-14T09:15:00", location: "Dallas, TX", description: "Shipment booked and confirmed. Awaiting pickup." }
    ]
  }
};
