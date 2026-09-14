(function () {
  "use strict";

  const STORAGE_KEY = "pawtrack.pets.v1";

  /* ---------- placeholder avatar generation ---------- */

  function placeholderPhoto(species, bg) {
    const emoji = species === "cat" ? "🐱" : "🐶";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <rect width="400" height="400" fill="${bg}"/>
      <text x="50%" y="54%" font-size="180" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function todayIso() {
    return new Date().toISOString();
  }

  /* ---------- seed data ---------- */

  function seedPets() {
    const now = todayIso();
    return [
      {
        id: uid(), name: "Ruby", species: "dog", breed: "Terrier mix", age: "1 year",
        status: "Available", photo: "assets/photos/ruby.jpg",
        notes: "Extremely friendly, loves belly rubs and other dogs. Still working on leash manners.",
        createdAt: now,
        history: [{ status: "Available", date: now, note: "Intake — ready for adoption." }]
      },
      {
        id: uid(), name: "Bandit", species: "cat", breed: "Domestic shorthair", age: "2 years",
        status: "Fostered", photo: "assets/photos/silas.jpg",
        notes: "A bit of a drama king. Loves costumes more than he lets on.",
        createdAt: now,
        history: [
          { status: "Available", date: now, note: "Intake — ready for adoption." },
          { status: "Fostered", date: now, note: "Placed with a foster family." }
        ]
      },
      {
        id: uid(), name: "Mango", species: "cat", breed: "Orange tabby", age: "3 years",
        status: "Available", photo: "assets/photos/tabby.jpg",
        notes: "Calm, affectionate lap cat. Good with children.",
        createdAt: now,
        history: [{ status: "Available", date: now, note: "Intake — ready for adoption." }]
      },
      {
        id: uid(), name: "Max", species: "dog", breed: "Labrador mix", age: "4 years",
        status: "Adopted", photo: placeholderPhoto("dog", "#f2b56b"),
        notes: "Went home with the Alvarez family. Loves fetch.",
        createdAt: now,
        history: [
          { status: "Available", date: now, note: "Intake — ready for adoption." },
          { status: "Adopted", date: now, note: "Adopted by the Alvarez family." }
        ]
      },
      {
        id: uid(), name: "Luna", species: "cat", breed: "Siamese mix", age: "6 months",
        status: "Available", photo: placeholderPhoto("cat", "#8fc4b0"),
        notes: "Playful kitten, needs a home with another cat for company.",
        createdAt: now,
        history: [{ status: "Available", date: now, note: "Intake — ready for adoption." }]
      },
      {
        id: uid(), name: "Rocky", species: "dog", breed: "Boxer mix", age: "5 years",
        status: "Lost", photo: placeholderPhoto("dog", "#e0937a"),
        notes: "Last seen near Riverbend Park. Wears a blue collar with tags.",
        createdAt: now,
        history: [
          { status: "Available", date: now, note: "Intake — ready for adoption." },
          { status: "Adopted", date: now, note: "Adopted by a local family." },
          { status: "Lost", date: now, note: "Reported missing from backyard." }
        ]
      }
    ];
  }

  /* ---------- storage ---------- */

  function loadPets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted storage, fall through to reseed */ }
    const seeded = seedPets();
    savePets(seeded);
    return seeded;
  }

  function savePets(pets) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }

  let pets = loadPets();
  let state = { species: "all", status: "all", search: "" };

  /* ---------- rendering ---------- */

  const grid = document.getElementById("petGrid");
  const emptyState = document.getElementById("emptyState");
  const statsBar = document.getElementById("statsBar");

  function statusBadge(status) {
    return `<span class="badge badge-${status}">${status}</span>`;
  }

  function renderStats() {
    const total = pets.length;
    const dogs = pets.filter(p => p.species === "dog").length;
    const cats = pets.filter(p => p.species === "cat").length;
    const available = pets.filter(p => p.status === "Available").length;

    statsBar.innerHTML = [
      ["Total pets", total],
      ["Dogs", dogs],
      ["Cats", cats],
      ["Available", available]
    ].map(([label, value]) => `
      <div class="stat-card">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    `).join("");
  }

  function filteredPets() {
    return pets.filter(p => {
      if (state.species !== "all" && p.species !== state.species) return false;
      if (state.status !== "all" && p.status !== state.status) return false;
      if (state.search) {
        const q = state.search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.breed || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  function renderGrid() {
    const list = filteredPets();
    emptyState.hidden = list.length !== 0;
    grid.innerHTML = list.map(p => `
      <article class="pet-card" data-id="${p.id}" tabindex="0" role="button" aria-label="View ${p.name}">
        <div class="pet-photo-wrap"><img src="${p.photo}" alt="${p.name}" loading="lazy"></div>
        <div class="pet-card-body">
          <div class="pet-card-name">${p.species === "cat" ? "🐱" : "🐶"} ${escapeHtml(p.name)}</div>
          <div class="pet-card-meta">${escapeHtml(p.breed || "")}${p.breed && p.age ? " · " : ""}${escapeHtml(p.age || "")}</div>
          ${statusBadge(p.status)}
        </div>
      </article>
    `).join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderAll() {
    renderStats();
    renderGrid();
  }

  /* ---------- filters ---------- */

  document.getElementById("speciesTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    document.querySelectorAll("#speciesTabs .tab").forEach(t => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    state.species = btn.dataset.species;
    renderGrid();
  });

  document.getElementById("statusFilter").addEventListener("change", (e) => {
    state.status = e.target.value;
    renderGrid();
  });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    renderGrid();
  });

  /* ---------- detail panel ---------- */

  const overlay = document.getElementById("overlay");
  const detailPanel = document.getElementById("detailPanel");
  const detailContent = document.getElementById("detailContent");
  let activePetId = null;

  const STATUS_OPTIONS = ["Available", "Fostered", "Adopted", "Lost", "Found"];

  function openDetail(id) {
    activePetId = id;
    renderDetail();
    overlay.hidden = false;
    detailPanel.hidden = false;
  }

  function closeDetail() {
    overlay.hidden = true;
    detailPanel.hidden = true;
    activePetId = null;
  }

  function renderDetail() {
    const p = pets.find(x => x.id === activePetId);
    if (!p) return closeDetail();

    const historyHtml = [...p.history].reverse().map(h => `
      <li class="history-item">
        <div class="history-status">${escapeHtml(h.status)}</div>
        <div class="history-date">${formatDate(h.date)}</div>
        ${h.note ? `<div>${escapeHtml(h.note)}</div>` : ""}
      </li>
    `).join("");

    detailContent.innerHTML = `
      <img class="detail-photo" src="${p.photo}" alt="${escapeHtml(p.name)}">
      <h2 class="detail-name">${p.species === "cat" ? "🐱" : "🐶"} ${escapeHtml(p.name)}</h2>
      <div class="detail-meta">${escapeHtml(p.breed || "Unknown breed")}${p.age ? " · " + escapeHtml(p.age) : ""}</div>
      ${statusBadge(p.status)}
      ${p.notes ? `<p class="detail-notes">${escapeHtml(p.notes)}</p>` : ""}

      <div class="detail-actions">
        <button class="btn btn-primary" id="editPetBtn">Edit</button>
      </div>

      <div class="status-update-row">
        <select id="newStatusSelect">
          ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <button class="btn btn-primary" id="updateStatusBtn">Update status</button>
      </div>

      <div class="history-title">Tracking history</div>
      <ul class="history-list">${historyHtml}</ul>
    `;

    document.getElementById("editPetBtn").addEventListener("click", () => openForm(p.id));
    document.getElementById("updateStatusBtn").addEventListener("click", () => {
      const newStatus = document.getElementById("newStatusSelect").value;
      if (newStatus === p.status) return;
      p.status = newStatus;
      p.history.push({ status: newStatus, date: todayIso(), note: "" });
      savePets(pets);
      renderDetail();
      renderAll();
    });
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".pet-card");
    if (card) openDetail(card.dataset.id);
  });
  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".pet-card");
    if (card) { e.preventDefault(); openDetail(card.dataset.id); }
  });

  document.getElementById("closeDetailBtn").addEventListener("click", closeDetail);
  overlay.addEventListener("click", () => { closeDetail(); closeForm(); });

  /* ---------- add / edit form ---------- */

  const formModal = document.getElementById("formModal");
  const petForm = document.getElementById("petForm");
  const formTitle = document.getElementById("formTitle");
  const deletePetBtn = document.getElementById("deletePetBtn");
  let pendingPhoto = null;

  function openForm(editId) {
    petForm.reset();
    pendingPhoto = null;
    document.getElementById("petId").value = editId || "";

    if (editId) {
      const p = pets.find(x => x.id === editId);
      formTitle.textContent = "Edit Pet";
      document.getElementById("petName").value = p.name;
      document.getElementById("petSpecies").value = p.species;
      document.getElementById("petStatus").value = p.status;
      document.getElementById("petBreed").value = p.breed || "";
      document.getElementById("petAge").value = p.age || "";
      document.getElementById("petNotes").value = p.notes || "";
      pendingPhoto = p.photo;
      deletePetBtn.hidden = false;
    } else {
      formTitle.textContent = "Add a Pet";
      deletePetBtn.hidden = true;
    }

    overlay.hidden = false;
    formModal.hidden = false;
    detailPanel.hidden = true;
  }

  function closeForm() {
    formModal.hidden = true;
    if (!activePetId) overlay.hidden = true;
  }

  document.getElementById("addPetBtn").addEventListener("click", () => openForm(null));
  document.getElementById("closeFormBtn").addEventListener("click", closeForm);

  document.getElementById("petPhotoFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { pendingPhoto = reader.result; };
    reader.readAsDataURL(file);
  });

  petForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("petId").value;
    const species = document.getElementById("petSpecies").value;
    const status = document.getElementById("petStatus").value;
    const name = document.getElementById("petName").value.trim();
    if (!name) return;

    if (id) {
      const p = pets.find(x => x.id === id);
      const statusChanged = p.status !== status;
      Object.assign(p, {
        name,
        species,
        status,
        breed: document.getElementById("petBreed").value.trim(),
        age: document.getElementById("petAge").value.trim(),
        notes: document.getElementById("petNotes").value.trim(),
        photo: pendingPhoto || p.photo
      });
      if (statusChanged) {
        p.history.push({ status, date: todayIso(), note: "Updated via edit form." });
      }
    } else {
      pets.push({
        id: uid(),
        name,
        species,
        status,
        breed: document.getElementById("petBreed").value.trim(),
        age: document.getElementById("petAge").value.trim(),
        notes: document.getElementById("petNotes").value.trim(),
        photo: pendingPhoto || placeholderPhoto(species, species === "cat" ? "#8fc4b0" : "#f2b56b"),
        createdAt: todayIso(),
        history: [{ status, date: todayIso(), note: "Added to tracker." }]
      });
    }

    savePets(pets);
    closeForm();
    renderAll();
  });

  deletePetBtn.addEventListener("click", () => {
    const id = document.getElementById("petId").value;
    if (!id) return;
    if (!confirm("Remove this pet from the tracker? This cannot be undone.")) return;
    pets = pets.filter(p => p.id !== id);
    savePets(pets);
    closeForm();
    closeDetail();
    renderAll();
  });

  /* ---------- init ---------- */

  renderAll();
})();
