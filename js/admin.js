(function () {
  "use strict";

  // ---------------------------------------------------------------
  // DEMO-ONLY credentials. This is a static site with no backend or
  // database, so there is no way to check a password securely here —
  // anyone who views this file (or the GitHub repo) can read these
  // values in plain text. This gate is for prototype/demo purposes
  // only and must NOT be relied on to protect a real business.
  // ---------------------------------------------------------------
  const ADMIN_EMAIL = "admin@pawtrack.example";
  const ADMIN_PASSWORD = "PawTrack2026!";

  const SESSION_KEY = "pawtrack.adminSession";
  const STORAGE_KEY = "pawtrack.adminShipments";

  const loginPanel = document.getElementById("loginPanel");
  const dashboardPanel = document.getElementById("dashboardPanel");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logoutBtn");

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  }

  function showDashboard() {
    loginPanel.hidden = true;
    dashboardPanel.hidden = false;
    renderShipmentList();
  }

  function showLogin() {
    dashboardPanel.hidden = true;
    loginPanel.hidden = false;
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      loginError.hidden = true;
      showDashboard();
    } else {
      loginError.hidden = false;
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  });

  /* ---------- shipment storage ---------- */

  function getAdminShipments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveAdminShipments(shipments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
  }

  function generateTrackingNumber() {
    const existing = new Set([
      ...Object.keys(typeof SHIPMENTS !== "undefined" ? SHIPMENTS : {}),
      ...Object.keys(getAdminShipments())
    ]);
    let candidate;
    do {
      const digits = Math.floor(10000000 + Math.random() * 89999999);
      candidate = "PAW-" + digits;
    } while (existing.has(candidate));
    return candidate;
  }

  function todayIso() {
    return new Date().toISOString();
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Reduces a geocoded address down to a city-level label, since the public
  // tracking page only ever shows city-level locations (see policies.html) —
  // this applies to both the pickup address and the receiver's address.
  function cityLevelLabel(addr) {
    if (!addr) return "";
    const city = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || addr.county;
    const region = addr.state || addr.state_district || addr.region;
    const country = addr.country;
    if (city && region) return city + ", " + region;
    if (city && country) return city + ", " + country;
    if (region && country) return region + ", " + country;
    return city || region || country || "";
  }

  async function geocodeAddress(query) {
    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=" + encodeURIComponent(query);
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error("Geocoding request failed");
    const results = await res.json();
    if (!results.length) return null;
    const r = results[0];
    const label = cityLevelLabel(r.address);
    if (!label) return null;
    return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label };
  }

  const ORIGIN_KEY = "pawtrack.lastOrigin";
  const createForm = document.getElementById("createShipmentForm");
  const resultPanel = document.getElementById("createResult");
  const newOriginInput = document.getElementById("newOrigin");

  const savedOrigin = localStorage.getItem(ORIGIN_KEY);
  if (savedOrigin) newOriginInput.value = savedOrigin;

  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const petName = document.getElementById("newPetName").value.trim();
    const species = document.getElementById("newSpecies").value;
    const breed = document.getElementById("newBreed").value.trim();
    const age = document.getElementById("newAge").value.trim();
    const originAddress = newOriginInput.value.trim();
    const notes = document.getElementById("newNotes").value.trim();
    const photoFile = document.getElementById("newPhoto").files[0];

    const receiver = {
      name: document.getElementById("receiverName").value.trim(),
      address: document.getElementById("receiverAddress").value.trim(),
      country: document.getElementById("receiverCountry").value.trim(),
      phone: document.getElementById("receiverPhone").value.trim(),
      email: document.getElementById("receiverEmail").value.trim()
    };

    if (!petName) {
      alert("Please fill in the pet's name.");
      return;
    }
    if (!originAddress) {
      alert("Please fill in the origin / pickup address.");
      return;
    }
    if (!receiver.name || !receiver.address || !receiver.country || !receiver.phone || !receiver.email) {
      alert("Please fill in all of the receiver's information.");
      return;
    }

    const submitBtn = createForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Looking up addresses...";

    const destinationQuery = receiver.address + ", " + receiver.country;

    let originGeo, destGeo;
    try {
      [originGeo, destGeo] = await Promise.all([geocodeAddress(originAddress), geocodeAddress(destinationQuery)]);
    } catch (err) {
      alert("Couldn't reach the map lookup service. Please check your connection and try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      return;
    }

    if (!originGeo || !destGeo) {
      alert("Couldn't find one of those addresses on the map. Try adding more detail, like a city and state/country.");
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      return;
    }

    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;

    // Free map lookups can occasionally match the wrong town for a full
    // street address (ambiguous street names, incomplete map data) — a quick
    // confirmation catches that before it's saved.
    const confirmed = confirm(
      "We found:\nOrigin: " + originGeo.label + "\nDestination: " + destGeo.label +
      "\n\nCreate this shipment with these locations?"
    );
    if (!confirmed) return;

    const trackingNumber = generateTrackingNumber();
    const now = todayIso();
    const photo = photoFile ? await readFileAsDataUrl(photoFile) : null;

    const shipment = {
      petName,
      species,
      breed: breed || (species === "cat" ? "Domestic shorthair" : "Mixed breed"),
      age: age || "Unknown",
      photo,
      originAddress,
      origin: { name: originGeo.label, lat: originGeo.lat, lng: originGeo.lng },
      destination: { name: destGeo.label, lat: destGeo.lat, lng: destGeo.lng },
      currentStageIndex: 0,
      currentLocation: { name: originGeo.label, lat: originGeo.lat, lng: originGeo.lng },
      stageDates: { "Booked": now },
      events: [
        { date: now, location: originGeo.label, description: notes || "Shipment booked and confirmed." }
      ],
      receiver
    };

    const shipments = getAdminShipments();
    shipments[trackingNumber] = shipment;
    saveAdminShipments(shipments);

    createForm.reset();
    newOriginInput.value = originAddress;
    localStorage.setItem(ORIGIN_KEY, originAddress);

    resultPanel.hidden = false;
    document.getElementById("resultTrackingNumber").textContent = trackingNumber;
    document.getElementById("resultTrackLink").href = "track.html?track=" + encodeURIComponent(trackingNumber);
    resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });

    renderShipmentList();
  });

  const STAGE_ORDER = ["Booked", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];

  function renderShipmentList() {
    const shipments = getAdminShipments();
    const list = document.getElementById("shipmentList");
    const entries = Object.entries(shipments).sort((a, b) => {
      const da = Object.values(a[1].stageDates)[0] || "";
      const db = Object.values(b[1].stageDates)[0] || "";
      return db.localeCompare(da);
    });

    if (entries.length === 0) {
      list.innerHTML = '<p class="empty-state" style="padding:20px 0;">No shipments created yet.</p>';
      return;
    }

    list.innerHTML = entries.map(([trackingNumber, s]) => {
      const status = STAGE_ORDER[s.currentStageIndex];
      const canAdvance = s.currentStageIndex < STAGE_ORDER.length - 1;
      return `
        <div class="admin-row-wrap">
          <div class="admin-row">
            ${s.photo ? `<img src="${s.photo}" alt="">` : `<div class="admin-row-noimg"></div>`}
            <div class="admin-row-info">
              <div class="admin-row-name">${escapeHtml(s.petName)} <span class="admin-row-tn">${trackingNumber}</span></div>
              <div class="admin-row-meta">${escapeHtml(s.origin.name)} &rarr; ${escapeHtml(s.destination.name)}${s.receiver ? " · to " + escapeHtml(s.receiver.name) : ""}</div>
            </div>
            <span class="status-pill status-${status.replace(/\s+/g, "-")}">${status}</span>
            <div class="admin-row-actions">
              ${s.receiver ? `<button class="btn btn-neutral btn-small" data-details="${trackingNumber}">Details</button>` : ""}
              ${canAdvance ? `<button class="btn btn-primary btn-small" data-advance="${trackingNumber}">Advance</button>` : ""}
              <button class="btn btn-danger btn-small" data-delete="${trackingNumber}">Delete</button>
            </div>
          </div>
          ${s.receiver ? `
          <div class="admin-row-details" id="details-${trackingNumber}" hidden>
            ${s.originAddress ? `<div><strong>Pickup Address:</strong> ${escapeHtml(s.originAddress)}</div>` : ""}
            <div><strong>Receiver:</strong> ${escapeHtml(s.receiver.name)}</div>
            <div><strong>Address:</strong> ${escapeHtml(s.receiver.address)}</div>
            <div><strong>Country:</strong> ${escapeHtml(s.receiver.country)}</div>
            <div><strong>Phone:</strong> ${escapeHtml(s.receiver.phone)}</div>
            <div><strong>Email:</strong> ${escapeHtml(s.receiver.email)}</div>
          </div>` : ""}
        </div>
      `;
    }).join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  document.getElementById("shipmentList").addEventListener("click", (e) => {
    const advanceTN = e.target.getAttribute("data-advance");
    const deleteTN = e.target.getAttribute("data-delete");
    const detailsTN = e.target.getAttribute("data-details");
    const shipments = getAdminShipments();

    if (detailsTN) {
      const panel = document.getElementById("details-" + detailsTN);
      if (panel) panel.hidden = !panel.hidden;
    }

    if (advanceTN && shipments[advanceTN]) {
      const s = shipments[advanceTN];
      s.currentStageIndex += 1;
      const stageName = STAGE_ORDER[s.currentStageIndex];
      s.stageDates[stageName] = todayIso();
      s.events.unshift({ date: todayIso(), location: s.destination.name, description: stageName + "." });
      saveAdminShipments(shipments);
      renderShipmentList();
    }

    if (deleteTN && shipments[deleteTN]) {
      if (confirm("Delete this shipment? This cannot be undone.")) {
        delete shipments[deleteTN];
        saveAdminShipments(shipments);
        renderShipmentList();
      }
    }
  });

  /* ---------- init ---------- */

  if (isLoggedIn()) {
    showDashboard();
  } else {
    showLogin();
  }
})();
