// ===== State =====
let listings = [];
let currentIndex = null;
let hasChanges = false;

// ===== Dynamic JSON Loader =====
// Fetches all studio JSON files directly from the filesystem directories
// so we never rely on a stale data.js snapshot.
const BUILDING_FILES = {
  aristotelous: [
    "studio1.json",
    "studio2.json",
    "studio3.json",
    "studio4.json",
  ],
  artemidos: ["studio1.json", "studio2.json"],
  kleious: [
    "studio1.json",
    "studio2.json",
    "studio3.json",
    "studio4.json",
    "studio5.json",
    "studio6.json",
    "studio7.json",
    "studio8.json",
    "studio9.json",
  ],
  saranti: ["studio1.json", "studio2.json"],
};

async function loadListings() {
  // Try fetching directly from JSON files (requires HTTP server)
  try {
    const results = [];
    for (const [building, files] of Object.entries(BUILDING_FILES)) {
      for (const file of files) {
        const path = `../${building}/${file}`;
        const res = await fetch(path);
        if (!res.ok) continue;
        const data = await res.json();
        data._meta = { building, file, path: `${building}/${file}` };
        results.push(data);
      }
    }
    if (results.length > 0) {
      console.log(`✅ Loaded ${results.length} listings from JSON files`);
      return results;
    }
  } catch (e) {
    console.warn(
      "Fetch failed (file:// protocol?), falling back to data.js",
      e,
    );
  }

  // Fallback: use data.js (run build-data.sh to refresh)
  if (typeof LISTINGS_DATA !== "undefined") {
    console.log(
      `📦 Using data.js fallback (${LISTINGS_DATA.length} listings). Run build-data.sh to refresh.`,
    );
    return JSON.parse(JSON.stringify(LISTINGS_DATA));
  }

  console.error(
    "No listing data available. Serve via HTTP or run build-data.sh",
  );
  return [];
}

const LISTING_LINKS = {
  "artemidos/studio1.json": [
    "https://housinganywhere.com/room/ut1337149/gr/Thessalon%C3%ADki/artemidos",
    "https://thessnest.com/listing/studio-in-thessaloniki-mpotsari/",
  ],
  "artemidos/studio2.json": [
    "https://housinganywhere.com/room/ut1287306/gr/Thessalon%C3%ADki/artemidos",
    "https://thessnest.com/listing/studio-in-thessaloniki-mpotsari-2/",
  ],
  "saranti/studio1.json": [
    "https://housinganywhere.com/room/ut1247530/gr/Thessalon%C3%ADki/papanastasiou-alexandrou",
    "https://thessnest.com/listing/studio-in-thessaloniki-papanastasiou-balcony/",
  ],
  "saranti/studio2.json": [
    "https://housinganywhere.com/room/ut1385034/gr/Thessalon%C3%ADki/papanastasiou-alexandrou",
    "https://thessnest.com/listing/studio-in-thessaloniki-papanastasiou/",
  ],
  "kleious/studio1.json": [
    "https://housinganywhere.com/room/ut1173198/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/student-housing-thessaloniki-kleious-4/",
  ],
  "kleious/studio2.json": [
    "https://housinganywhere.com/room/ut1340075/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/apartment-in-thessaloniki-ano-poli-kleious-4/",
  ],
  "kleious/studio3.json": [
    "https://housinganywhere.com/room/ut1385687/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/student-housing-thessaloniki-kleious-d2/",
  ],
  "kleious/studio4.json": [
    "https://housinganywhere.com/room/ut1549416/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/apartment-for-rent-near-city-college-kleious/",
  ],
  "kleious/studio5.json": [
    "https://housinganywhere.com/room/ut1645665/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/student-housing-thessaloniki-kleious-650/",
  ],
  "kleious/studio6.json": [
    "https://housinganywhere.com/room/ut1694879/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/apartment-for-rent-in-kleious-40m2/",
  ],
  "kleious/studio7.json": [
    "https://housinganywhere.com/room/ut1385260/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/student-housing-thessaloniki-kleious-city/?arrive=&depart=",
  ],
  "kleious/studio8.json": [
    "https://housinganywhere.com/room/ut1336624/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/student-housing-thessaloniki-kleious-terrace/",
  ],
  "kleious/studio9.json": [
    "https://housinganywhere.com/room/ut1205538/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/student-housing-thessaloniki-kleious-city-view/",
  ],
  "aristotelous/studio1.json": [
    "https://housinganywhere.com/room/ut1130356/gr/Thessalon%C3%ADki/aristotelous",
    "https://thessnest.com/listing/student-housing-thessaloniki-aristotelous-bright-studio/",
  ],
  "aristotelous/studio2.json": [
    "https://housinganywhere.com/room/ut1173176/gr/Thessalon%C3%ADki/aristotelous",
    "https://thessnest.com/listing/student-housing-thessaloniki-aristotelous-studio/",
  ],
  "aristotelous/studio3.json": [
    "https://housinganywhere.com/room/ut1632264/gr/Thessalon%C3%ADki/aristotelous",
    "https://thessnest.com/listing/student-housing-thessaloniki-terrace-studio/",
  ],
  "aristotelous/studio4.json": [
    "https://housinganywhere.com/room/ut990231/gr/Thessalon%C3%ADki/aristotelous",
    null,
  ],
};

// ===== DOM References =====
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarNav = document.getElementById("sidebarNav");
const searchInput = document.getElementById("searchInput");
const listingCount = document.getElementById("listingCount");
const emptyState = document.getElementById("emptyState");
const detailView = document.getElementById("detailView");
const breadcrumb = document.getElementById("breadcrumb");
const tabs = document.getElementById("tabs");
const btnSave = document.getElementById("btnSave");
const btnCopyJson = document.getElementById("btnCopyJson");
const btnCopyHtml = document.getElementById("btnCopyHtml");
const btnDownload = document.getElementById("btnDownload");
const btnRebuild = document.getElementById("btnRebuild");
const toastContainer = document.getElementById("toastContainer");

// ===== Initialize =====
async function init() {
  listings = await loadListings();
  renderSidebar();
  bindEvents();
}

// ===== Sidebar =====
function renderSidebar(filter = "") {
  const groups = {};
  listings.forEach((listing, index) => {
    const building = listing._meta.building;
    if (!groups[building]) groups[building] = [];
    groups[building].push({ listing, index });
  });

  let html = "";
  let visibleCount = 0;

  const buildingNames = {
    aristotelous: "Aristotelous",
    artemidos: "Artemidos",
    kleious: "Kleious",
    saranti: "Saranti",
  };

  for (const [building, items] of Object.entries(groups)) {
    const filtered = items.filter(({ listing }) => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        listing.title.toLowerCase().includes(q) ||
        (listing.id + "").includes(q) ||
        listing._meta.file.toLowerCase().includes(q) ||
        (listing.location?.city || "").toLowerCase().includes(q)
      );
    });

    if (filtered.length === 0) continue;
    visibleCount += filtered.length;

    html += `
      <div class="nav-group">
        <div class="nav-group-header" data-building="${building}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          ${buildingNames[building] || building} (${filtered.length})
        </div>
        <div class="nav-group-items" id="group-${building}">
          ${filtered
            .map(
              ({ listing, index }) => `
            <div class="nav-item ${currentIndex === index ? "active" : ""}" data-index="${index}">
              <span class="nav-id">#${listing.id}</span>
              <span class="nav-title">${listing._meta.file.replace(".json", "")}</span>
              <span class="nav-price">€${listing.pricing?.price_per_month || "—"}</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  sidebarNav.innerHTML = html;
  listingCount.textContent = `${visibleCount} listing${visibleCount !== 1 ? "s" : ""}`;

  // Bind nav clicks
  sidebarNav.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const idx = parseInt(item.dataset.index);
      selectListing(idx);
    });
  });

  // Bind group toggle
  sidebarNav.querySelectorAll(".nav-group-header").forEach((header) => {
    header.addEventListener("click", () => {
      const building = header.dataset.building;
      const items = document.getElementById(`group-${building}`);
      header.classList.toggle("collapsed");
      items.classList.toggle("collapsed");
    });
  });
}

// ===== Select Listing =====
function selectListing(index) {
  if (hasChanges && currentIndex !== null) {
    if (!confirm("You have unsaved changes. Discard?")) return;
  }

  currentIndex = index;
  hasChanges = false;
  btnSave.disabled = true;

  // Update sidebar active
  sidebarNav.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", parseInt(item.dataset.index) === index);
  });

  // Show detail view
  emptyState.classList.add("hidden");
  detailView.classList.remove("hidden");

  const listing = listings[index];

  // Breadcrumb
  breadcrumb.innerHTML = `
    <span class="bc-building">${listing._meta.building}</span>
    <span class="bc-sep">/</span>
    <span class="bc-file">${listing._meta.file}</span>
  `;

  // Reset to overview tab
  switchTab("overview");

  // Render all panels
  renderOverview(listing);
  renderAbout(listing);
  renderAmenities(listing);
  renderPricing(listing);
  renderSeo(listing);
  renderJson(listing);
}

// ===== Tabs =====
function switchTab(tabName) {
  tabs.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("active", p.id === `panel-${tabName}`);
  });
}

// ===== Panel Renderers =====
function renderOverview(listing) {
  const panel = document.getElementById("panel-overview");
  const d = listing.details || {};
  const links = LISTING_LINKS[listing._meta.path] || [];

  panel.innerHTML = `
    <div class="listing-links">
      ${renderListingLink("HousingAnywhere", links[0])}
      ${renderListingLink("Thessnest", links[1])}
    </div>

    <input class="listing-title-input" id="field-title" value="${escapeHtml(listing.title)}" placeholder="Listing title">

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button class="featured-toggle ${listing.featured ? "on" : "off"}" id="toggleFeatured">
        ★ ${listing.featured ? "Featured" : "Not Featured"}
      </button>
      <span style="color:var(--text-tertiary);font-size:0.85rem">ID: ${listing.id}</span>
      <span style="color:var(--text-tertiary);font-size:0.85rem">Type: ${listing.type || "—"}</span>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">${d.size_sqm || "—"}</div>
        <div class="stat-label">Size (m²)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${d.guests || "—"}</div>
        <div class="stat-label">Guests</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${d.bedrooms ?? "—"}</div>
        <div class="stat-label">Bedrooms</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${d.beds || "—"}</div>
        <div class="stat-label">Beds</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${d.bathrooms || "—"}</div>
        <div class="stat-label">Bathrooms</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${d.previous_tenants ?? "—"}</div>
        <div class="stat-label">Past Tenants</div>
      </div>
    </div>

    <div class="panel-title">Location</div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Address</label>
        <input class="form-input" data-field="location.address" value="${escapeHtml(listing.location?.address || "")}">
      </div>
      <div class="form-group">
        <label class="form-label">Street</label>
        <input class="form-input" data-field="location.street" value="${escapeHtml(listing.location?.street || "")}">
      </div>
      <div class="form-group">
        <label class="form-label">City</label>
        <input class="form-input" data-field="location.city" value="${escapeHtml(listing.location?.city || "")}">
      </div>
      <div class="form-group">
        <label class="form-label">Zipcode</label>
        <input class="form-input" data-field="location.zipcode" value="${escapeHtml(listing.location?.zipcode || "")}">
      </div>
      <div class="form-group">
        <label class="form-label">Country</label>
        <input class="form-input" data-field="location.country" value="${escapeHtml(listing.location?.country || "")}">
      </div>
    </div>

    <div class="panel-divider"></div>

    <div class="panel-title">Details</div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Type</label>
        <input class="form-input" data-field="type" value="${escapeHtml(listing.type || "")}">
      </div>
      <div class="form-group">
        <label class="form-label">Size (m²)</label>
        <input class="form-input" type="number" data-field="details.size_sqm" value="${d.size_sqm ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Guests</label>
        <input class="form-input" type="number" data-field="details.guests" value="${d.guests ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Bedrooms</label>
        <input class="form-input" type="number" data-field="details.bedrooms" value="${d.bedrooms ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Beds</label>
        <input class="form-input" type="number" data-field="details.beds" value="${d.beds ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Bathrooms</label>
        <input class="form-input" type="number" data-field="details.bathrooms" value="${d.bathrooms ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Rooms</label>
        <input class="form-input" type="number" data-field="details.rooms" value="${d.rooms ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Previous Tenants</label>
        <input class="form-input" type="number" data-field="details.previous_tenants" value="${d.previous_tenants ?? ""}">
      </div>
    </div>

    <div class="panel-divider"></div>

    <div class="panel-title">Host</div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" data-field="host.name" value="${escapeHtml(listing.host?.name || "")}">
      </div>
      <div class="form-group">
        <label class="form-label">Country</label>
        <input class="form-input" data-field="host.country" value="${escapeHtml(listing.host?.country || "")}">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <div style="display:flex;align-items:center;gap:10px">
          <input class="form-input" data-field="host.status" value="${escapeHtml(listing.host?.status || "")}">
          ${listing.host?.status === "Verified" ? '<span class="host-badge verified">✓ Verified</span>' : ""}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Reviews Count</label>
        <input class="form-input" type="number" data-field="host.reviews_count" value="${listing.host?.reviews_count ?? ""}">
      </div>
    </div>

    ${
      listing.reviews && listing.reviews.length > 0
        ? `
      <div class="panel-divider"></div>
      <div class="panel-title">Reviews</div>
      ${listing.reviews
        .map(
          (r) => `
        <div class="review-card">
          <div class="review-header">
            <span class="review-author">${escapeHtml(r.author)}</span>
            <span class="review-rating">${escapeHtml(r.rating)}</span>
          </div>
          <div class="review-date">${escapeHtml(r.date)}</div>
          <div class="review-content">${escapeHtml(r.content)}</div>
        </div>
      `,
        )
        .join("")}
    `
        : ""
    }
  `;

  // Bind title
  document.getElementById("field-title").addEventListener("input", (e) => {
    listing.title = e.target.value;
    markChanged();
  });

  // Bind featured toggle
  document.getElementById("toggleFeatured").addEventListener("click", () => {
    listing.featured = !listing.featured;
    markChanged();
    renderOverview(listing);
  });

  // Bind all form inputs
  panel.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", (e) => {
      setNestedValue(
        listing,
        e.target.dataset.field,
        e.target.type === "number"
          ? e.target.value === ""
            ? null
            : Number(e.target.value)
          : e.target.value,
      );
      markChanged();
    });
  });
}

function renderAbout(listing) {
  const panel = document.getElementById("panel-about");
  const about = listing.about || {};

  panel.innerHTML = `
    <div class="panel-title">Summary</div>
    <div class="form-group full-width" style="margin-bottom:24px">
      <textarea class="form-textarea" id="aboutSummary" rows="4">${escapeHtml(about.summary || "")}</textarea>
    </div>

    <div class="panel-title">Sections</div>
    <div id="aboutSections">
      ${(about.sections || []).map((section, si) => renderSection(section, si)).join("")}
    </div>

    <button class="btn btn-ghost" id="btnAddSection" style="margin-top:16px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Add Section
    </button>
  `;

  // Bind summary
  document.getElementById("aboutSummary").addEventListener("input", (e) => {
    if (!listing.about) listing.about = {};
    listing.about.summary = e.target.value;
    markChanged();
  });

  // Bind add section
  document.getElementById("btnAddSection").addEventListener("click", () => {
    if (!listing.about) listing.about = {};
    if (!listing.about.sections) listing.about.sections = [];
    listing.about.sections.push({ title: "", content: "", highlights: [] });
    markChanged();
    renderAbout(listing);
  });

  // Bind section fields
  bindSectionEvents(listing);
}

function renderSection(section, si) {
  return `
    <div class="section-card" data-section="${si}">
      <div class="section-card-header">
        <span class="section-number">Section ${si + 1}</span>
        <button class="btn btn-danger btn-sm btn-delete-section" data-si="${si}">Delete</button>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Title</label>
        <input class="form-input section-title" data-si="${si}" value="${escapeHtml(section.title || "")}">
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Content</label>
        <textarea class="form-textarea section-content" data-si="${si}" rows="3">${escapeHtml(section.content || "")}</textarea>
      </div>
      <div class="form-label" style="margin-bottom:8px">Highlights</div>
      <div class="highlights-list" data-si="${si}">
        ${(section.highlights || [])
          .map(
            (h, hi) => `
          <div class="highlight-item">
            <input class="form-input highlight-input" data-si="${si}" data-hi="${hi}" value="${escapeHtml(h)}">
            <button class="btn-remove" data-si="${si}" data-hi="${hi}" title="Remove">✕</button>
          </div>
        `,
          )
          .join("")}
      </div>
      <button class="btn-add-highlight" data-si="${si}">+ Add Highlight</button>
    </div>
  `;
}

function bindSectionEvents(listing) {
  const panel = document.getElementById("panel-about");

  // Section title
  panel.querySelectorAll(".section-title").forEach((input) => {
    input.addEventListener("input", (e) => {
      listing.about.sections[e.target.dataset.si].title = e.target.value;
      markChanged();
    });
  });

  // Section content
  panel.querySelectorAll(".section-content").forEach((ta) => {
    ta.addEventListener("input", (e) => {
      listing.about.sections[e.target.dataset.si].content = e.target.value;
      markChanged();
    });
  });

  // Highlight input
  panel.querySelectorAll(".highlight-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const si = e.target.dataset.si;
      const hi = e.target.dataset.hi;
      listing.about.sections[si].highlights[hi] = e.target.value;
      markChanged();
    });
  });

  // Remove highlight
  panel.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const si = e.currentTarget.dataset.si;
      const hi = e.currentTarget.dataset.hi;
      listing.about.sections[si].highlights.splice(hi, 1);
      markChanged();
      renderAbout(listing);
    });
  });

  // Add highlight
  panel.querySelectorAll(".btn-add-highlight").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const si = e.currentTarget.dataset.si;
      listing.about.sections[si].highlights.push("");
      markChanged();
      renderAbout(listing);
    });
  });

  // Delete section
  panel.querySelectorAll(".btn-delete-section").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const si = parseInt(e.currentTarget.dataset.si);
      if (confirm("Delete this section?")) {
        listing.about.sections.splice(si, 1);
        markChanged();
        renderAbout(listing);
      }
    });
  });
}

function renderAmenities(listing) {
  const panel = document.getElementById("panel-amenities");
  const amenities = listing.amenities || [];

  panel.innerHTML = `
    <div class="panel-title">Amenities (${amenities.length})</div>
    <div class="amenities-grid" id="amenitiesGrid">
      ${amenities
        .map(
          (a, i) => `
        <div class="amenity-tag">
          ${escapeHtml(a)}
          <button class="remove-amenity" data-idx="${i}" title="Remove">✕</button>
        </div>
      `,
        )
        .join("")}
    </div>
    <div class="add-amenity-row">
      <input class="form-input" id="newAmenityInput" placeholder="Add amenity...">
      <button class="btn btn-ghost" id="btnAddAmenity">Add</button>
    </div>
  `;

  // Remove amenity
  panel.querySelectorAll(".remove-amenity").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx);
      listing.amenities.splice(idx, 1);
      markChanged();
      renderAmenities(listing);
    });
  });

  // Add amenity
  const addAmenity = () => {
    const input = document.getElementById("newAmenityInput");
    const val = input.value.trim();
    if (val) {
      if (!listing.amenities) listing.amenities = [];
      listing.amenities.push(val);
      markChanged();
      renderAmenities(listing);
    }
  };

  document
    .getElementById("btnAddAmenity")
    .addEventListener("click", addAmenity);
  document
    .getElementById("newAmenityInput")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") addAmenity();
    });
}

function renderPricing(listing) {
  const panel = document.getElementById("panel-pricing");
  const p = listing.pricing || {};
  const r = listing.house_rules || {};

  panel.innerHTML = `
    <div class="panel-title">Pricing</div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Price per Month (€)</label>
        <input class="form-input" type="number" step="0.01" data-field="pricing.price_per_month" value="${p.price_per_month ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Security Deposit (€)</label>
        <input class="form-input" type="number" step="0.01" data-field="pricing.security_deposit" value="${p.security_deposit ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Minimum Stay (months)</label>
        <input class="form-input" type="number" data-field="pricing.minimum_stay_months" value="${p.minimum_stay_months ?? ""}">
      </div>
      ${
        p.maximum_stay_months !== undefined
          ? `
      <div class="form-group">
        <label class="form-label">Maximum Stay (months)</label>
        <input class="form-input" type="number" data-field="pricing.maximum_stay_months" value="${p.maximum_stay_months ?? ""}">
      </div>`
          : ""
      }
      ${
        p.cleaning_fee !== undefined
          ? `
      <div class="form-group">
        <label class="form-label">Cleaning Fee (€)</label>
        <input class="form-input" type="number" step="0.01" data-field="pricing.cleaning_fee" value="${p.cleaning_fee ?? ""}">
      </div>`
          : ""
      }
    </div>

    <div class="form-checkbox-row">
      <input type="checkbox" class="form-checkbox" id="allowGuests" ${p.allow_additional_guests ? "checked" : ""}>
      <label class="form-checkbox-label" for="allowGuests">Allow additional guests</label>
    </div>

    <div class="panel-divider"></div>

    <div class="panel-title">House Rules</div>
    <div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))">
      <div class="form-checkbox-row">
        <input type="checkbox" class="form-checkbox" id="ruleSmoke" ${r.smoking_allowed ? "checked" : ""}>
        <label class="form-checkbox-label" for="ruleSmoke">Smoking allowed</label>
      </div>
      <div class="form-checkbox-row">
        <input type="checkbox" class="form-checkbox" id="rulePets" ${r.pets_allowed ? "checked" : ""}>
        <label class="form-checkbox-label" for="rulePets">Pets allowed</label>
      </div>
      <div class="form-checkbox-row">
        <input type="checkbox" class="form-checkbox" id="ruleParty" ${r.party_allowed ? "checked" : ""}>
        <label class="form-checkbox-label" for="ruleParty">Party allowed</label>
      </div>
      <div class="form-checkbox-row">
        <input type="checkbox" class="form-checkbox" id="ruleChildren" ${r.children_allowed ? "checked" : ""}>
        <label class="form-checkbox-label" for="ruleChildren">Children allowed</label>
      </div>
    </div>

    <div class="form-group full-width" style="margin-top:16px">
      <label class="form-label">Additional Rules Info</label>
      <textarea class="form-textarea" id="rulesInfo" rows="3">${escapeHtml(r.additional_rules_info || "")}</textarea>
    </div>
  `;

  // Bind pricing fields
  panel.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", (e) => {
      setNestedValue(
        listing,
        e.target.dataset.field,
        e.target.type === "number"
          ? e.target.value === ""
            ? null
            : Number(e.target.value)
          : e.target.value,
      );
      markChanged();
    });
  });

  // Checkboxes
  document.getElementById("allowGuests").addEventListener("change", (e) => {
    if (!listing.pricing) listing.pricing = {};
    listing.pricing.allow_additional_guests = e.target.checked;
    markChanged();
  });

  document.getElementById("ruleSmoke").addEventListener("change", (e) => {
    if (!listing.house_rules) listing.house_rules = {};
    listing.house_rules.smoking_allowed = e.target.checked;
    markChanged();
  });

  document.getElementById("rulePets").addEventListener("change", (e) => {
    if (!listing.house_rules) listing.house_rules = {};
    listing.house_rules.pets_allowed = e.target.checked;
    markChanged();
  });

  document.getElementById("ruleParty").addEventListener("change", (e) => {
    if (!listing.house_rules) listing.house_rules = {};
    listing.house_rules.party_allowed = e.target.checked;
    markChanged();
  });

  document.getElementById("ruleChildren").addEventListener("change", (e) => {
    if (!listing.house_rules) listing.house_rules = {};
    listing.house_rules.children_allowed = e.target.checked;
    markChanged();
  });

  document.getElementById("rulesInfo").addEventListener("input", (e) => {
    if (!listing.house_rules) listing.house_rules = {};
    listing.house_rules.additional_rules_info = e.target.value || null;
    markChanged();
  });
}

function renderSeo(listing) {
  const panel = document.getElementById("panel-seo");
  const seo = listing.seo || {};

  panel.innerHTML = `
    <div class="panel-title">SEO Settings</div>
    <div class="form-grid">
      <div class="form-group full-width">
        <label class="form-label">SEO Title</label>
        <input class="form-input" data-field="seo.seo_title" value="${escapeHtml(seo.seo_title || "")}">
        <small style="color:var(--text-tertiary);margin-top:4px">${(seo.seo_title || "").length}/60 characters</small>
      </div>
      <div class="form-group full-width">
        <label class="form-label">SEO Description</label>
        <textarea class="form-textarea" data-field="seo.seo_description" rows="2">${escapeHtml(seo.seo_description || "")}</textarea>
        <small style="color:var(--text-tertiary);margin-top:4px">${(seo.seo_description || "").length}/160 characters</small>
      </div>
      <div class="form-group">
        <label class="form-label">Focus Keyword</label>
        <input class="form-input" data-field="seo.focus_keyword" value="${escapeHtml(seo.focus_keyword || "")}">
      </div>
      <div class="form-group">
        <label class="form-label">Permalink</label>
        <input class="form-input" data-field="seo.permalink" value="${escapeHtml(seo.permalink || "")}">
      </div>
    </div>
  `;

  // Bind fields
  panel.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", (e) => {
      setNestedValue(listing, e.target.dataset.field, e.target.value);
      markChanged();
      // Update character counts
      renderSeoCounters(listing);
    });
  });
}

function renderSeoCounters(listing) {
  const panel = document.getElementById("panel-seo");
  const smalls = panel.querySelectorAll("small");
  if (smalls[0]) {
    const len = (listing.seo?.seo_title || "").length;
    smalls[0].textContent = `${len}/60 characters`;
    smalls[0].style.color = len > 60 ? "var(--red)" : "var(--text-tertiary)";
  }
  if (smalls[1]) {
    const len = (listing.seo?.seo_description || "").length;
    smalls[1].textContent = `${len}/160 characters`;
    smalls[1].style.color = len > 160 ? "var(--red)" : "var(--text-tertiary)";
  }
}

function renderJson(listing) {
  const panel = document.getElementById("panel-json");
  const cleanListing = getCleanListing(listing);

  panel.innerHTML = `
    <div class="panel-title">Raw JSON Editor</div>
    <textarea class="json-editor" id="jsonEditor">${JSON.stringify(cleanListing, null, 2)}</textarea>
    <div class="json-error" id="jsonError"></div>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn btn-ghost" id="btnFormatJson">Format</button>
      <button class="btn btn-primary" id="btnApplyJson">Apply Changes</button>
    </div>
  `;

  document.getElementById("btnFormatJson").addEventListener("click", () => {
    const editor = document.getElementById("jsonEditor");
    try {
      const parsed = JSON.parse(editor.value);
      editor.value = JSON.stringify(parsed, null, 2);
      document.getElementById("jsonError").style.display = "none";
    } catch (e) {
      showJsonError(e.message);
    }
  });

  document.getElementById("btnApplyJson").addEventListener("click", () => {
    const editor = document.getElementById("jsonEditor");
    try {
      const parsed = JSON.parse(editor.value);
      // Preserve meta
      const meta = listing._meta;
      Object.keys(listing).forEach((k) => delete listing[k]);
      listing._meta = meta;
      Object.assign(listing, parsed);
      markChanged();
      // Re-render all panels
      renderOverview(listing);
      renderAbout(listing);
      renderAmenities(listing);
      renderPricing(listing);
      renderSeo(listing);
      renderSidebar(searchInput.value);
      document.getElementById("jsonError").style.display = "none";
      showToast("JSON applied successfully", "success");
    } catch (e) {
      showJsonError(e.message);
    }
  });
}

function showJsonError(msg) {
  const el = document.getElementById("jsonError");
  el.textContent = "JSON Error: " + msg;
  el.style.display = "block";
}

// ===== Event Bindings =====
function bindEvents() {
  // Sidebar toggle
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // Search
  searchInput.addEventListener("input", (e) => {
    renderSidebar(e.target.value);
  });

  // Tabs
  tabs.addEventListener("click", (e) => {
    if (e.target.classList.contains("tab")) {
      switchTab(e.target.dataset.tab);
      // Refresh JSON panel when switching to it
      if (e.target.dataset.tab === "json" && currentIndex !== null) {
        renderJson(listings[currentIndex]);
      }
    }
  });

  // Copy JSON
  btnCopyJson.addEventListener("click", () => {
    if (currentIndex === null) return;
    const clean = getCleanListing(listings[currentIndex]);
    navigator.clipboard.writeText(JSON.stringify(clean, null, 2)).then(() => {
      showToast("JSON copied to clipboard", "success");
    });
  });

  // Copy HTML
  btnCopyHtml.addEventListener("click", () => {
    if (currentIndex === null) return;
    const htmlContent = generateAboutHtml(listings[currentIndex]);
    navigator.clipboard.writeText(htmlContent).then(() => {
      showToast("About section copied as HTML", "success");
    });
  });

  // Download JSON
  btnDownload.addEventListener("click", () => {
    if (currentIndex === null) return;
    const listing = listings[currentIndex];
    const clean = getCleanListing(listing);
    const blob = new Blob([JSON.stringify(clean, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = listing._meta.file;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded " + listing._meta.file, "success");
  });

  // Save
  btnSave.addEventListener("click", () => {
    if (currentIndex === null) return;
    saveListing(currentIndex);
  });

  // Keyboard shortcut: Ctrl/Cmd + S
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      if (currentIndex !== null && hasChanges) {
        saveListing(currentIndex);
      }
    }
  });

  // Rebuild
  if (btnRebuild) {
    btnRebuild.addEventListener("click", async () => {
      btnRebuild.disabled = true;
      const originalHtml = btnRebuild.innerHTML;
      btnRebuild.textContent = "Rebuilding...";
      try {
        const res = await fetch("/api/rebuild", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          showToast(data.message || "data.js successfully rebuilt!", "success");
          // Reload all listings in the app to sync with the rebuilt data
          listings = await loadListings();
          renderSidebar(searchInput.value);
          if (currentIndex !== null) {
            selectListing(currentIndex);
          }
        } else {
          const err = await res.json();
          showToast(
            "Rebuild failed: " + (err.error || "Unknown error"),
            "error",
          );
        }
      } catch (e) {
        console.error(e);
        showToast("Could not connect to server to rebuild.", "error");
      } finally {
        btnRebuild.disabled = false;
        btnRebuild.innerHTML = originalHtml;
      }
    });
  }
}

// ===== Save =====
async function saveListing(index) {
  const listing = listings[index];
  const clean = getCleanListing(listing);
  const json = JSON.stringify(clean, null, 2) + "\n";

  try {
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: listing._meta.path,
        data: clean,
      }),
    });
    if (res.ok) {
      hasChanges = false;
      btnSave.disabled = true;
      showToast(
        `Saved ${listing._meta.building}/${listing._meta.file} directly to disk`,
        "success",
      );
      return;
    } else {
      const err = await res.json();
      console.warn(
        "Direct save API returned error, falling back to download:",
        err.error,
      );
    }
  } catch (e) {
    console.warn("Direct save failed, falling back to download:", e);
  }

  // Fallback: download JSON
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = listing._meta.file;
  a.click();
  URL.revokeObjectURL(url);

  hasChanges = false;
  btnSave.disabled = true;
  showToast(
    `Saved ${listing._meta.building}/${listing._meta.file} (Downloaded)`,
    "success",
  );
}

// ===== Helpers =====
function getCleanListing(listing) {
  const clean = { ...listing };
  delete clean._meta;
  return clean;
}

function renderListingLink(label, url) {
  if (!url) {
    return `<span class="listing-link missing"><strong>${escapeHtml(label)}</strong><span>Missing</span></span>`;
  }

  return `<a class="listing-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(url)}</span></a>`;
}

function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function markChanged() {
  hasChanges = true;
  btnSave.disabled = false;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateAboutHtml(listing) {
  const about = listing.about || {};
  let html = "";

  // 1. Summary
  if (about.summary) {
    const trimmedSummary = about.summary.trim();
    if (trimmedSummary.startsWith("<p>") || trimmedSummary.startsWith("<div")) {
      html += trimmedSummary + "\n\n";
    } else {
      html += `<p>${trimmedSummary}</p>\n\n`;
    }
  }

  // 2. Table of Contents
  if (about.table_of_contents && about.table_of_contents.length > 0) {
    html += `<h3>Table of Contents</h3>\n<ul>\n`;
    about.table_of_contents.forEach(item => {
      html += `  <li>${item}</li>\n`;
    });
    html += `</ul>\n\n`;
  }

  // 3. Sections
  if (about.sections && about.sections.length > 0) {
    about.sections.forEach(section => {
      if (section.title) {
        html += `<h3>${section.title}</h3>\n`;
      }
      if (section.content) {
        html += `${section.content.trim()}\n`;
      }
      if (section.highlights && section.highlights.length > 0) {
        html += `<h4>Highlights</h4>\n<ul>\n`;
        section.highlights.forEach(h => {
          if (h.trim()) {
            html += `  <li>${h.trim()}</li>\n`;
          }
        });
        html += `</ul>\n`;
      }
      html += `\n`;
    });
  }

  return html.trim();
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${
        type === "success"
          ? '<polyline points="20 6 9 17 4 12"/>'
          : type === "error"
            ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
      }
    </svg>
    ${message}
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== Start =====
init();
