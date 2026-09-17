(function () {
  "use strict";

  function formatDateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
  }

  const trackForm = document.getElementById("trackForm");
  const trackingInput = document.getElementById("trackingInput");
  const resultView = document.getElementById("resultView");
  const notFound = document.getElementById("notFound");

  let map = null;
  let routeLayer = null;

  function renderStageTracker(shipment) {
    const container = document.getElementById("stageTracker");
    container.innerHTML = STAGE_LABELS.map((label, i) => {
      const isDone = i <= shipment.currentStageIndex;
      const isCurrent = i === shipment.currentStageIndex;
      const date = shipment.stageDates[label];
      return `
        <div class="stage ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}">
          <div class="stage-dot">${isDone ? "✓" : i + 1}</div>
          <div class="stage-label">${label}</div>
          <div class="stage-date">${date ? formatDateTime(date) : ""}</div>
        </div>
      `;
    }).join("");
  }

  function renderMap(shipment) {
    const mapEl = document.getElementById("map");
    mapEl.innerHTML = "";
    if (map) { map.remove(); map = null; }

    map = L.map("map", { scrollWheelZoom: false });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18
    }).addTo(map);

    const originLatLng = [shipment.origin.lat, shipment.origin.lng];
    const destLatLng = [shipment.destination.lat, shipment.destination.lng];
    const currentLatLng = [shipment.currentLocation.lat, shipment.currentLocation.lng];

    const originIcon = L.divIcon({ className: "map-pin map-pin-origin", html: "A", iconSize: [22, 22] });
    const destIcon = L.divIcon({ className: "map-pin map-pin-dest", html: "B", iconSize: [22, 22] });
    const petIcon = L.divIcon({ className: "map-pin-current", html: "<span class=\"pulse-dot\"></span>", iconSize: [18, 18] });

    L.marker(originLatLng, { icon: originIcon }).addTo(map).bindPopup(shipment.origin.name);
    L.marker(destLatLng, { icon: destIcon }).addTo(map).bindPopup(shipment.destination.name);

    routeLayer = L.polyline([originLatLng, destLatLng], {
      color: "#1f4fa3", weight: 3, dashArray: "6 8"
    }).addTo(map);

    if (shipment.currentStageIndex > 0 && shipment.currentStageIndex < STAGE_LABELS.length - 1) {
      L.marker(currentLatLng, { icon: petIcon }).addTo(map).bindPopup("Current location").openPopup();
    } else if (shipment.currentStageIndex === STAGE_LABELS.length - 1) {
      L.marker(destLatLng, { icon: petIcon }).addTo(map).bindPopup("Delivered here").openPopup();
    }

    map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });

    setTimeout(() => map.invalidateSize(), 50);
  }

  function renderEventLog(shipment) {
    const list = document.getElementById("eventLog");
    list.innerHTML = shipment.events.map(ev => `
      <li class="event-item">
        <div class="event-date">${formatDateTime(ev.date)}</div>
        <div class="event-desc"><strong>${ev.location}</strong> — ${ev.description}</div>
      </li>
    `).join("");
  }

  function getAdminShipments() {
    try {
      return JSON.parse(localStorage.getItem("pawtrack.adminShipments") || "{}");
    } catch (e) {
      return {};
    }
  }

  function showShipment(trackingNumber) {
    const key = trackingNumber.trim().toUpperCase();
    const shipment = SHIPMENTS[key] || getAdminShipments()[key];
    if (!shipment) {
      resultView.hidden = true;
      notFound.hidden = false;
      return;
    }
    notFound.hidden = true;
    resultView.hidden = false;

    const petPhotoEl = document.getElementById("petPhoto");
    petPhotoEl.hidden = !shipment.photo;
    if (shipment.photo) {
      petPhotoEl.src = shipment.photo;
      petPhotoEl.alt = shipment.petName;
    }
    document.getElementById("petName").textContent = shipment.petName;
    document.getElementById("petMeta").textContent =
      (shipment.species === "cat" ? "Cat" : "Dog") + " · " + shipment.breed;
    document.getElementById("trackingNumberDisplay").textContent = trackingNumber.trim().toUpperCase();
    document.getElementById("originName").textContent = shipment.origin.name;
    document.getElementById("destName").textContent = shipment.destination.name;

    const status = STAGE_LABELS[shipment.currentStageIndex];
    const pill = document.getElementById("statusPill");
    pill.textContent = status;
    pill.className = "status-pill status-" + status.replace(/\s+/g, "-");

    renderStageTracker(shipment);
    renderMap(shipment);
    renderEventLog(shipment);

    resultView.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  trackForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (trackingInput.value.trim()) showShipment(trackingInput.value);
  });

  document.querySelectorAll(".chip[data-demo]").forEach(chip => {
    chip.addEventListener("click", () => {
      trackingInput.value = chip.dataset.demo;
      showShipment(chip.dataset.demo);
    });
  });

  const preloadTracking = new URLSearchParams(window.location.search).get("track");
  if (preloadTracking) {
    trackingInput.value = preloadTracking;
    showShipment(preloadTracking);
  }
})();
