(function () {
  "use strict";

  if (typeof supabaseClient === "undefined") return;

  const loginPanel = document.getElementById("loginPanel");
  const dashboardPanel = document.getElementById("dashboardPanel");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logoutBtn");

  function showDashboard() {
    loginPanel.hidden = true;
    dashboardPanel.hidden = false;
    renderShipmentList();
  }

  function showLogin() {
    dashboardPanel.hidden = true;
    loginPanel.hidden = false;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in...";

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    if (error) {
      loginError.textContent = error.message || "Incorrect email or password.";
      loginError.hidden = false;
    } else {
      loginError.hidden = true;
      showDashboard();
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    showLogin();
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session) {
      showDashboard();
    } else {
      showLogin();
    }
  });

  /* ---------- shipment mapping ---------- */

  // Converts a database row (snake_case) into the shape the rest of this
  // file and app.js work with (camelCase), matching the old localStorage format.
  function fromRow(row) {
    return {
      trackingNumber: row.tracking_number,
      petName: row.pet_name,
      species: row.species,
      breed: row.breed,
      age: row.age,
      photo: row.photo,
      originAddress: row.origin_address,
      origin: row.origin,
      destination: row.destination,
      currentStageIndex: row.current_stage_index,
      currentLocation: row.current_location,
      stageDates: row.stage_dates,
      events: row.events,
      receiver: row.receiver
    };
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

  function generateTrackingNumber() {
    const digits = Math.floor(10000000 + Math.random() * 89999999);
    return "PPA-" + digits;
  }

  const ORIGIN_KEY = "pacificpetcareairways.lastOrigin";
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

    // Free map lookups can occasionally match the wrong town for a full
    // street address (ambiguous street names, incomplete map data) — a quick
    // confirmation catches that before it's saved.
    const confirmed = confirm(
      "We found:\nOrigin: " + originGeo.label + "\nDestination: " + destGeo.label +
      "\n\nCreate this shipment with these locations?"
    );
    if (!confirmed) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      return;
    }

    submitBtn.textContent = "Saving...";

    const now = todayIso();
    const photo = photoFile ? await readFileAsDataUrl(photoFile) : null;

    const row = {
      pet_name: petName,
      species,
      breed: breed || (species === "cat" ? "Domestic shorthair" : "Mixed breed"),
      age: age || "Unknown",
      photo,
      origin_address: originAddress,
      origin: { name: originGeo.label, lat: originGeo.lat, lng: originGeo.lng },
      destination: { name: destGeo.label, lat: destGeo.lat, lng: destGeo.lng },
      current_stage_index: 0,
      current_location: { name: originGeo.label, lat: originGeo.lat, lng: originGeo.lng },
      stage_dates: { "Booked": now },
      events: [
        { date: now, location: originGeo.label, description: notes || "Shipment booked and confirmed." }
      ],
      receiver
    };

    let trackingNumber;
    let insertError;
    for (let attempt = 0; attempt < 5; attempt++) {
      trackingNumber = generateTrackingNumber();
      const { error } = await supabaseClient
        .from("shipments")
        .insert({ tracking_number: trackingNumber, ...row });
      if (!error) {
        insertError = null;
        break;
      }
      insertError = error;
      if (error.code !== "23505") break; // not a duplicate-key collision, stop retrying
    }

    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;

    if (insertError) {
      alert("Couldn't save the shipment: " + insertError.message);
      return;
    }

    createForm.reset();
    newOriginInput.value = originAddress;
    localStorage.setItem(ORIGIN_KEY, originAddress);

    resultPanel.hidden = false;
    document.getElementById("resultTrackingNumber").textContent = trackingNumber;
    document.getElementById("resultTrackLink").href = "../track.html?track=" + encodeURIComponent(trackingNumber);
    resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });

    renderShipmentList();
  });

  const STAGE_ORDER = ["Booked", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];

  async function renderShipmentList() {
    const list = document.getElementById("shipmentList");
    const { data, error } = await supabaseClient
      .from("shipments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      list.innerHTML = '<p class="empty-state" style="padding:20px 0;">Couldn\'t load shipments: ' + escapeHtml(error.message) + '</p>';
      return;
    }

    const shipments = (data || []).map(fromRow);

    if (shipments.length === 0) {
      list.innerHTML = '<p class="empty-state" style="padding:20px 0;">No shipments created yet.</p>';
      return;
    }

    list.innerHTML = shipments.map((s) => {
      const trackingNumber = s.trackingNumber;
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

  document.getElementById("shipmentList").addEventListener("click", async (e) => {
    const advanceTN = e.target.getAttribute("data-advance");
    const deleteTN = e.target.getAttribute("data-delete");
    const detailsTN = e.target.getAttribute("data-details");

    if (detailsTN) {
      const panel = document.getElementById("details-" + detailsTN);
      if (panel) panel.hidden = !panel.hidden;
    }

    if (advanceTN) {
      const { data, error } = await supabaseClient
        .from("shipments")
        .select("*")
        .eq("tracking_number", advanceTN)
        .single();
      if (error || !data) return;

      const s = fromRow(data);
      const newIndex = s.currentStageIndex + 1;
      const stageName = STAGE_ORDER[newIndex];
      const now = todayIso();
      const stageDates = { ...s.stageDates, [stageName]: now };
      const events = [{ date: now, location: s.destination.name, description: stageName + "." }, ...s.events];

      await supabaseClient
        .from("shipments")
        .update({ current_stage_index: newIndex, stage_dates: stageDates, events })
        .eq("tracking_number", advanceTN);

      renderShipmentList();
    }

    if (deleteTN) {
      if (confirm("Delete this shipment? This cannot be undone.")) {
        await supabaseClient.from("shipments").delete().eq("tracking_number", deleteTN);
        renderShipmentList();
      }
    }
  });
})();
