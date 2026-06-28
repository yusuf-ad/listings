"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { performGlobalSearch, HighlightedText } from "./search-utils";

const LISTING_LINKS = {
  "artemidos/listing1.json": [
    "https://housinganywhere.com/room/ut1337149/gr/Thessalon%C3%ADki/artemidos",
    "https://thessnest.com/listing/studio-thessaloniki-mpotsari/",
  ],
  "artemidos/listing2.json": [
    "https://housinganywhere.com/room/ut1287306/gr/Thessalon%C3%ADki/artemidos",
    "https://thessnest.com/listing/erasmus-housing-thessaloniki-mpotsari/",
  ],
  "saranti/listing1.json": [
    "https://housinganywhere.com/room/ut1247530/gr/Thessalon%C3%ADki/papanastasiou-alexandrou",
    "https://thessnest.com/listing/studio-thessaloniki-papanastasiou-balcony/",
  ],
  "saranti/listing2.json": [
    "https://housinganywhere.com/room/ut1385034/gr/Thessalon%C3%ADki/papanastasiou-alexandrou",
    "https://thessnest.com/listing/studio-thessaloniki-student-housing-papanastasiou/",
  ],
  "kleious/listing1.json": [
    "https://housinganywhere.com/room/ut1173198/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/student-housing-ano-poli/",
  ],
  "kleious/listing2.json": [
    "https://housinganywhere.com/room/ut1340075/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/ano-poli-student-apartment/",
  ],
  "kleious/listing3.json": [
    "https://housinganywhere.com/room/ut1385687/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/erasmus-apartment-ano-poli/",
  ],
  "kleious/listing4.json": [
    "https://housinganywhere.com/room/ut1549416/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/city-college-student-apartment/",
  ],
  "kleious/listing5.json": [
    "https://housinganywhere.com/room/ut1645665/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/aristotle-university-apartment/",
  ],
  "kleious/listing6.json": [
    "https://housinganywhere.com/room/ut1694879/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/student-apartment-ano-poli/",
  ],
  "kleious/listing7.json": [
    "https://housinganywhere.com/room/ut1385260/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/bright-student-apartment-ano-poli/",
  ],
  "kleious/listing8.json": [
    "https://housinganywhere.com/room/ut1336624/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/terrace-student-apartment-ano-poli/",
  ],
  "kleious/listing9.json": [
    "https://housinganywhere.com/room/ut1205538/gr/Thessalon%C3%ADki/kleious",
    "https://thessnest.com/listing/cozy-student-apartment-ano-poli/",
  ],
  "aristotelous/listing1.json": [
    "https://housinganywhere.com/room/ut1130356/gr/Thessalon%C3%ADki/aristotelous",
    "https://thessnest.com/listing/bright-studio-aristotelous-square/",
  ],
  "aristotelous/listing2.json": [
    "https://housinganywhere.com/room/ut1173176/gr/Thessalon%C3%ADki/aristotelous",
    "https://thessnest.com/listing/minimal-studio-aristotelous-square/",
  ],
  "aristotelous/listing3.json": [
    "https://housinganywhere.com/room/ut1632264/gr/Thessalon%C3%ADki/aristotelous",
    "https://thessnest.com/listing/terrace-studio-aristotelous-square/",
  ],
  "aristotelous/listing4.json": [
    "https://housinganywhere.com/room/ut990231/gr/Thessalon%C3%ADki/aristotelous",
    "https://thessnest.com/listing/central-studio-aristotelous-square/",
  ],
};

const BUILDING_NAMES = {
  aristotelous: "Aristotelous",
  artemidos: "Artemidos",
  kleious: "Kleious",
  saranti: "Saranti",
};

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBuildingCollapsed, setActiveBuildingCollapsed] = useState({});

  // Active Selected Listing States
  const [currentIndex, setCurrentIndex] = useState(null);
  const [activeListing, setActiveListing] = useState(null);
  const [originalListing, setOriginalListing] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [showAboutPreview, setShowAboutPreview] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState([]);

  // Command Menu Search States
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const searchInputRef = useRef(null);
  const searchDialogRef = useRef(null);

  // Fetch initial configuration & listings
  const loadData = async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const statusRes = await fetch("/api/status");
      if (statusRes.ok) {
        const status = await statusRes.json();
        setSupabaseConnected(status.connected);
        setSupabaseUrl(status.supabaseUrl || "");
      }
    } catch (err) {
      console.warn("Could not check Supabase status:", err);
    }

    try {
      const listingsRes = await fetch(`/api/listings?t=${Date.now()}`, { cache: "no-store" });
      if (listingsRes.ok) {
        const data = await listingsRes.json();
        setListings(data);

        // Update active listing with fresh data from database if a listing is currently selected
        if (activeListing && activeListing.id) {
          const freshItem = data.find(item => item.id === activeListing.id);
          if (freshItem) {
            setActiveListing(JSON.parse(JSON.stringify(freshItem)));
            setOriginalListing(JSON.parse(JSON.stringify(freshItem)));
            
            // Sync with JSON editor input state if we are not on JSON tab
            const clean = { ...freshItem };
            delete clean._meta;
            setJsonInput(JSON.stringify(clean, null, 2));
            setJsonError("");
          }
        }

        if (isManual) {
          showToast("Listings refreshed successfully from Supabase", "success");
        }
      } else {
        showToast("Failed to load listings from server API.", "error");
      }
    } catch (err) {
      console.error("Network error fetching listings:", err);
      showToast("Error connecting to backend listings API.", "error");
    } finally {
      if (isManual) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync form modifications to the raw JSON state
  useEffect(() => {
    if (activeListing && activeTab !== "json") {
      const clean = { ...activeListing };
      delete clean._meta;
      setJsonInput(JSON.stringify(clean, null, 2));
      setJsonError("");
    }
  }, [activeListing, activeTab]);

  // Helper to trigger toast messages
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Calculate matching search results dynamically
  const globalSearchResults = useMemo(() => {
    return performGlobalSearch(listings, globalSearchQuery);
  }, [listings, globalSearchQuery]);

  // Keyboard shortcut listener to toggle Command Menu
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Toggle search dialog with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchDialogOpen((open) => {
          if (!open) {
            setGlobalSearchQuery("");
            setSelectedResultIndex(0);
          }
          return !open;
        });
      }
      
      // Close search dialog with Escape
      if (e.key === "Escape" && searchDialogOpen) {
        e.preventDefault();
        setSearchDialogOpen(false);
      }
    };
    
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [searchDialogOpen]);

  // Auto-focus input when search dialog opens
  useEffect(() => {
    if (searchDialogOpen && searchInputRef.current) {
      // Small timeout to ensure DOM is fully rendered
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 50);
    }
  }, [searchDialogOpen]);

  // Handle arrow keys and enter in search dialog
  const handleDialogKeyDown = (e) => {
    if (globalSearchResults.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev + 1) % globalSearchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev - 1 + globalSearchResults.length) % globalSearchResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectSearchResult(selectedResultIndex);
    }
  };

  // Perform action when search result is selected
  const selectSearchResult = (resultIndex) => {
    const result = globalSearchResults[resultIndex];
    if (!result) return;
    
    // Select the listing in the main view
    selectListing(result.index);
    
    // Smart tab navigation: check if matches have specific tabs, switch to the first matched tab
    if (result.matches && result.matches.length > 0) {
      const bestMatchTab = result.matches[0].tab;
      if (bestMatchTab && ["overview", "about", "amenities", "pricing", "seo"].includes(bestMatchTab)) {
        setActiveTab(bestMatchTab);
      }
    }
    
    // Close the search dialog
    setSearchDialogOpen(false);
    setGlobalSearchQuery("");
  };

  // Group listings by building and sort naturally by filename
  const groupedListings = useMemo(() => {
    const groups = {};
    listings.forEach((listing, index) => {
      const building = listing._meta.building;
      if (!groups[building]) groups[building] = [];
      groups[building].push({ listing, index });
    });

    // Sort listings in each building group naturally by filename
    Object.keys(groups).forEach((building) => {
      groups[building].sort((a, b) =>
        a.listing._meta.file.localeCompare(b.listing._meta.file, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    });

    return groups;
  }, [listings]);

  // Handle Search Filter
  const filteredGroups = useMemo(() => {
    const groups = {};
    let count = 0;
    Object.entries(groupedListings).forEach(([building, items]) => {
      const filtered = items.filter(({ listing }) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          listing.title?.toLowerCase().includes(q) ||
          String(listing.id).includes(q) ||
          listing._meta.file?.toLowerCase().includes(q) ||
          listing.location?.city?.toLowerCase().includes(q)
        );
      });
      if (filtered.length > 0) {
        groups[building] = filtered;
        count += filtered.length;
      }
    });
    return { groups, count };
  }, [groupedListings, searchQuery]);

  // Select listing
  const selectListing = (index) => {
    if (isDirty) {
      if (!confirm("You have unsaved changes. Discard?")) return;
    }
    setCurrentIndex(index);
    const listingCopy = JSON.parse(JSON.stringify(listings[index]));
    setActiveListing(listingCopy);
    setOriginalListing(JSON.parse(JSON.stringify(listings[index])));
    
    // Set raw JSON input state
    const clean = { ...listingCopy };
    delete clean._meta;
    setJsonInput(JSON.stringify(clean, null, 2));
    setJsonError("");

    setActiveTab("overview");
  };

  // Check if current active listing is dirty
  const isDirty = useMemo(() => {
    if (!activeListing || !originalListing) return false;
    return JSON.stringify(activeListing) !== JSON.stringify(originalListing);
  }, [activeListing, originalListing]);

  // Handle Refresh from Supabase
  const handleRefresh = async () => {
    if (isDirty) {
      if (!confirm("You have unsaved changes. Refreshing will discard them. Continue?")) return;
    }
    await loadData(true);
  };

  // Pull Supabase data → overwrite local JSON files
  const handlePullToLocal = async () => {
    if (
      !confirm(
        "This will pull all listings from Supabase and overwrite the local JSON files. Continue?"
      )
    )
      return;
    setPulling(true);
    try {
      const res = await fetch("/api/pull-to-local", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(
          `✅ ${json.updated} of ${json.total} listings pulled from Supabase to local files.`,
          "success"
        );
      } else {
        showToast(`❌ Pull failed: ${json.error || "Unknown error"}`, "error");
      }
    } catch (err) {
      showToast(`❌ Connection error: ${err.message}`, "error");
    } finally {
      setPulling(false);
    }
  };

  // Safe setter helper for nested objects
  const updateActiveListing = (fieldPath, value) => {
    setActiveListing((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = fieldPath.split(".");
      let current = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  // Keyboard shortcut Ctrl/Cmd + S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) {
          handleSave();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, activeListing]);

  // Save changes to backend Supabase Route
  const handleSave = async () => {
    if (!activeListing) return;

    const oldPermalink = originalListing?.seo?.permalink;
    const newPermalink = activeListing?.seo?.permalink;
    let finalListing = { ...activeListing };

    if (oldPermalink && newPermalink && oldPermalink !== newPermalink) {
      if (!finalListing.seo) {
        finalListing.seo = {};
      }
      const seoCopy = { ...finalListing.seo };
      const currentHistory = seoCopy.link_history ? [...seoCopy.link_history] : [];
      
      if (!currentHistory.includes(oldPermalink)) {
        currentHistory.push(oldPermalink);
        seoCopy.link_history = currentHistory;
        finalListing.seo = seoCopy;
      }
    }

    // Clean metadata before sending to API
    const cleanListing = { ...finalListing };
    delete cleanListing._meta;

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: activeListing._meta.path,
          data: cleanListing,
        }),
      });

      if (res.ok) {
        // Update local listings state array
        const updatedListings = [...listings];
        updatedListings[currentIndex] = JSON.parse(JSON.stringify(finalListing));
        setListings(updatedListings);
        setActiveListing(JSON.parse(JSON.stringify(finalListing)));
        setOriginalListing(JSON.parse(JSON.stringify(finalListing)));
        showToast(`Saved ${activeListing._meta.building}/${activeListing._meta.file} successfully`, "success");
      } else {
        const err = await res.json();
        showToast("Save failed: " + (err.error || "Unknown error"), "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error connecting to server to save changes.", "error");
    }
  };

  // Copy JSON
  const handleCopyJson = () => {
    if (!activeListing) return;
    const clean = { ...activeListing };
    delete clean._meta;
    navigator.clipboard.writeText(JSON.stringify(clean, null, 2));
    showToast("JSON copied to clipboard!", "success");
  };

  // Copy HTML
  const handleCopyHtml = () => {
    if (!activeListing || !activeListing.about?.sections) return;
    const html = activeListing.about.sections
      .map((s) => {
        let content = `<h3>${s.title}</h3>\n${s.content}`;
        if (s.highlights && s.highlights.length > 0) {
          const items = s.highlights.map((h) => `  <li>${h}</li>`).join("\n");
          content += `\n<ul>\n${items}\n</ul>`;
        }
        return content;
      })
      .join("\n\n");
    navigator.clipboard.writeText(html);
    showToast("HTML copy successful!", "success");
  };

  // Download JSON
  const handleDownload = () => {
    if (!activeListing) return;
    const clean = { ...activeListing };
    delete clean._meta;
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeListing._meta.file;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Download started!", "success");
  };

  // Toggle building collapse
  const toggleBuilding = (building) => {
    setActiveBuildingCollapsed((prev) => ({
      ...prev,
      [building]: !prev[building],
    }));
  };

  // Dynamic state updates for sections
  const handleSectionChange = (sectionIndex, key, val) => {
    setActiveListing((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (!copy.about) copy.about = {};
      if (!copy.about.sections) copy.about.sections = [];
      copy.about.sections[sectionIndex][key] = val;
      return copy;
    });
  };

  const handleHighlightChange = (sectionIndex, highlightIndex, val) => {
    setActiveListing((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.about.sections[sectionIndex].highlights[highlightIndex] = val;
      return copy;
    });
  };

  const removeHighlight = (sectionIndex, highlightIndex) => {
    setActiveListing((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.about.sections[sectionIndex].highlights.splice(highlightIndex, 1);
      return copy;
    });
  };

  const addHighlight = (sectionIndex) => {
    setActiveListing((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (!copy.about.sections[sectionIndex].highlights) {
        copy.about.sections[sectionIndex].highlights = [];
      }
      copy.about.sections[sectionIndex].highlights.push("");
      return copy;
    });
  };

  const removeSection = (sectionIndex) => {
    if (!confirm("Delete this section?")) return;
    setActiveListing((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.about.sections.splice(sectionIndex, 1);
      return copy;
    });
  };

  const addSection = () => {
    setActiveListing((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (!copy.about) copy.about = {};
      if (!copy.about.sections) copy.about.sections = [];
      copy.about.sections.push({ title: "", content: "", highlights: [] });
      return copy;
    });
  };

  // Amenities methods
  const removeAmenity = (index) => {
    setActiveListing((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.amenities.splice(index, 1);
      return copy;
    });
  };

  const addAmenity = (val) => {
    if (!val.trim()) return;
    setActiveListing((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (!copy.amenities) copy.amenities = [];
      copy.amenities.push(val.trim());
      return copy;
    });
  };

  const handleJsonInputChange = (e) => {
    const val = e.target.value;
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      if (!parsed.id) {
        setJsonError("JSON must contain an 'id' field.");
        return;
      }
      setJsonError("");
      setActiveListing((prev) => ({
        ...prev,
        ...parsed,
        _meta: prev._meta,
      }));
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST"
      });
      if (res.ok) {
        window.location.href = "/login";
      } else {
        showToast("Logout failed.", "error");
      }
    } catch (e) {
      showToast("Error logging out.", "error");
    }
  };

  return (
    <div className="app">
      {/* Mobile overlay backdrop */}
      {mobileSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button className="mobile-hamburger" onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="mobile-topbar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Listing Manager</span>
        </div>
        {activeListing && (
          <span className="mobile-topbar-listing">{activeListing._meta.file.replace(".json", "")}</span>
        )}
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Listing Manager</span>
            <span
              id="supabaseStatus"
              className={`status-badge ${supabaseConnected ? "status-supabase" : "status-local"}`}
              title={supabaseConnected ? `Connected to Supabase (${supabaseUrl})` : "Supabase disconnected"}
            >
              {supabaseConnected ? "Supabase" : "Local"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              className="sidebar-toggle"
              onClick={handlePullToLocal}
              title="Supabase → Local JSON (Pull)"
              disabled={pulling || loading || refreshing}
              style={{ color: pulling ? "var(--text-muted)" : "var(--green, #4ade80)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={pulling ? "spin" : ""}
              >
                {pulling ? (
                  <>
                    <path d="M23 4v6h-6" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </>
                ) : (
                  <>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </>
                )}
              </svg>
            </button>
            <button
              className="sidebar-toggle"
              onClick={handleRefresh}
              title="Refresh from Supabase"
              disabled={refreshing || loading}
              style={{ color: "var(--accent)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={refreshing ? "spin" : ""}
              >
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
            <button className="sidebar-toggle" onClick={handleLogout} title="Log Out" style={{ color: "var(--red)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
            <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title="Toggle sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            {/* Close button — visible only on mobile */}
            <button className="sidebar-toggle mobile-close-btn" onClick={() => setMobileSidebarOpen(false)} title="Close sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="sidebar-search">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ cursor: "pointer" }}
            onClick={() => setSearchDialogOpen(true)}
            title="Open Global Search (⌘K)"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span
            className="sidebar-search-kbd"
            title="Open Global Search (⌘K)"
            onClick={() => setSearchDialogOpen(true)}
          >
            ⌘K
          </span>
        </div>

        <nav className="sidebar-nav">
          {loading ? (
            <div style={{ padding: "20px", color: "var(--text-tertiary)", fontSize: "0.9rem" }}>Loading database...</div>
          ) : (
            Object.entries(filteredGroups.groups).map(([building, items]) => {
              const isCollapsed = !!activeBuildingCollapsed[building];
              return (
                <div className="nav-group" key={building}>
                  <div className="nav-group-header" onClick={() => toggleBuilding(building)}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    {BUILDING_NAMES[building] || building} ({items.length})
                  </div>
                  <div className={`nav-group-items ${isCollapsed ? "collapsed" : ""}`}>
                    {items.map(({ listing, index }) => (
                      <div
                        className={`nav-item ${currentIndex === index ? "active" : ""}`}
                        key={listing.id}
                        onClick={() => { selectListing(index); setMobileSidebarOpen(false); }}
                      >
                        <span className="nav-id">#{listing.id}</span>
                        <span className="nav-title">{listing._meta.file.replace(".json", "")}</span>
                        <span className="nav-price">€{listing.pricing?.price_per_month || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        <div className="sidebar-footer">
          <span>{filteredGroups.count} listings</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main">
        {!activeListing ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <h2>Select a listing</h2>
            <p>Choose a property from the sidebar to view and edit its details.</p>
          </div>
        ) : (
          <div className="detail-view">
            {/* Top Bar */}
            <div className="detail-topbar">
              <div className="detail-breadcrumb">
                <span className="bc-building">{activeListing._meta.building}</span>
                <span className="bc-sep">/</span>
                <span className="bc-file">{activeListing._meta.file}</span>
              </div>
              <div className="detail-actions">
                <button className="btn btn-ghost" onClick={handleCopyJson} title="Copy JSON">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy JSON</span>
                </button>
                <button className="btn btn-ghost" onClick={handleCopyHtml} title="Copy About as HTML">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  <span>Copy HTML</span>
                </button>
                <button className="btn btn-ghost" onClick={handleDownload} title="Download JSON">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download</span>
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={!isDirty} title="Save changes">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
                Overview
              </button>
              <button className={`tab ${activeTab === "about" ? "active" : ""}`} onClick={() => setActiveTab("about")}>
                About
              </button>
              <button className={`tab ${activeTab === "amenities" ? "active" : ""}`} onClick={() => setActiveTab("amenities")}>
                Amenities
              </button>
              <button className={`tab ${activeTab === "pricing" ? "active" : ""}`} onClick={() => setActiveTab("pricing")}>
                Pricing & Rules
              </button>
              <button className={`tab ${activeTab === "seo" ? "active" : ""}`} onClick={() => setActiveTab("seo")}>
                SEO
              </button>
              <button className={`tab ${activeTab === "json" ? "active" : ""}`} onClick={() => setActiveTab("json")}>
                Raw JSON
              </button>
            </div>

            {/* Tab Panels */}
            <div className="tab-panels">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="tab-panel active">
                  <div className="listing-links">
                    {LISTING_LINKS[activeListing._meta.path]?.[0] ? (
                      <a
                        className="listing-link"
                        href={LISTING_LINKS[activeListing._meta.path][0]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <strong>HousingAnywhere</strong>
                        <span>{LISTING_LINKS[activeListing._meta.path][0]}</span>
                      </a>
                    ) : (
                      <span className="listing-link missing">
                        <strong>HousingAnywhere</strong>
                        <span>Missing</span>
                      </span>
                    )}

                    {activeListing.seo?.permalink || activeListing.seo?.thessnest_link || LISTING_LINKS[activeListing._meta.path]?.[1] ? (
                      <a
                        className="listing-link"
                        href={
                          activeListing.seo?.permalink
                            ? `https://thessnest.com/listing/${activeListing.seo.permalink}/`
                            : (activeListing.seo?.thessnest_link || LISTING_LINKS[activeListing._meta.path][1])
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <strong>Thessnest</strong>
                        <span>
                          {activeListing.seo?.permalink
                            ? `https://thessnest.com/listing/${activeListing.seo.permalink}/`
                            : (activeListing.seo?.thessnest_link || LISTING_LINKS[activeListing._meta.path][1])}
                        </span>
                      </a>
                    ) : (
                      <span className="listing-link missing">
                        <strong>Thessnest</strong>
                        <span>Missing</span>
                      </span>
                    )}
                  </div>

                  <input
                    className="listing-title-input"
                    value={activeListing.title || ""}
                    placeholder="Listing title"
                    onChange={(e) => updateActiveListing("title", e.target.value)}
                  />

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <button
                      className={`featured-toggle ${activeListing.featured ? "on" : "off"}`}
                      onClick={() => updateActiveListing("featured", !activeListing.featured)}
                    >
                      ★ {activeListing.featured ? "Featured" : "Not Featured"}
                    </button>
                    <span style={{ color: "var(--text-tertiary)", fontSize: "0.85rem" }}>ID: {activeListing.id}</span>
                    <span style={{ color: "var(--text-tertiary)", fontSize: "0.85rem" }}>Type: {activeListing.type || "—"}</span>
                  </div>

                  <div className="stats-row">
                    <div className="stat-card">
                      <div className="stat-value">{activeListing.details?.size_sqm || "—"}</div>
                      <div className="stat-label">Size (m²)</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{activeListing.details?.guests || "—"}</div>
                      <div className="stat-label">Guests</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{activeListing.details?.bedrooms ?? "—"}</div>
                      <div className="stat-label">Bedrooms</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{activeListing.details?.beds || "—"}</div>
                      <div className="stat-label">Beds</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{activeListing.details?.bathrooms || "—"}</div>
                      <div className="stat-label">Bathrooms</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{activeListing.details?.previous_tenants ?? "—"}</div>
                      <div className="stat-label">Past Tenants</div>
                    </div>
                  </div>

                  <div className="panel-title">Location</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input
                        className="form-input"
                        value={activeListing.location?.address || ""}
                        onChange={(e) => updateActiveListing("location.address", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Street</label>
                      <input
                        className="form-input"
                        value={activeListing.location?.street || ""}
                        onChange={(e) => updateActiveListing("location.street", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        className="form-input"
                        value={activeListing.location?.city || ""}
                        onChange={(e) => updateActiveListing("location.city", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Zipcode</label>
                      <input
                        className="form-input"
                        value={activeListing.location?.zipcode || ""}
                        onChange={(e) => updateActiveListing("location.zipcode", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input
                        className="form-input"
                        value={activeListing.location?.country || ""}
                        onChange={(e) => updateActiveListing("location.country", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="panel-divider"></div>

                  <div className="panel-title">Details</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <input
                        className="form-input"
                        value={activeListing.type || ""}
                        onChange={(e) => updateActiveListing("type", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Size (m²)</label>
                      <input
                        className="form-input"
                        type="number"
                        value={activeListing.details?.size_sqm ?? ""}
                        onChange={(e) =>
                          updateActiveListing("details.size_sqm", e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Guests</label>
                      <input
                        className="form-input"
                        type="number"
                        value={activeListing.details?.guests ?? ""}
                        onChange={(e) =>
                          updateActiveListing("details.guests", e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bedrooms</label>
                      <input
                        className="form-input"
                        type="number"
                        value={activeListing.details?.bedrooms ?? ""}
                        onChange={(e) =>
                          updateActiveListing("details.bedrooms", e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Beds</label>
                      <input
                        className="form-input"
                        type="number"
                        value={activeListing.details?.beds ?? ""}
                        onChange={(e) =>
                          updateActiveListing("details.beds", e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bathrooms</label>
                      <input
                        className="form-input"
                        type="number"
                        value={activeListing.details?.bathrooms ?? ""}
                        onChange={(e) =>
                          updateActiveListing("details.bathrooms", e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rooms</label>
                      <input
                        className="form-input"
                        type="number"
                        value={activeListing.details?.rooms ?? ""}
                        onChange={(e) =>
                          updateActiveListing("details.rooms", e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Previous Tenants</label>
                      <input
                        className="form-input"
                        type="number"
                        value={activeListing.details?.previous_tenants ?? ""}
                        onChange={(e) =>
                          updateActiveListing("details.previous_tenants", e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="panel-divider"></div>

                  <div className="panel-title">Host</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input
                        className="form-input"
                        value={activeListing.host?.name || ""}
                        onChange={(e) => updateActiveListing("host.name", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input
                        className="form-input"
                        value={activeListing.host?.country || ""}
                        onChange={(e) => updateActiveListing("host.country", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input
                          className="form-input"
                          value={activeListing.host?.status || ""}
                          onChange={(e) => updateActiveListing("host.status", e.target.value)}
                        />
                        {activeListing.host?.status === "Verified" && <span className="host-badge verified">✓ Verified</span>}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reviews Count</label>
                      <input
                        className="form-input"
                        type="number"
                        value={activeListing.host?.reviews_count ?? ""}
                        onChange={(e) =>
                          updateActiveListing("host.reviews_count", e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* About Tab */}
              {activeTab === "about" && (
                <div className="tab-panel active">
                  {/* About Tab Header with Preview Toggle */}
                  <div className="about-tab-header">
                    <div className="about-tab-header-left">
                      <span className="about-tab-title">About Content</span>
                    </div>
                    <button
                      className={`btn-preview-toggle ${showAboutPreview ? "active" : ""}`}
                      onClick={() => setShowAboutPreview((v) => !v)}
                      title={showAboutPreview ? "Hide Preview" : "Show Preview"}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {showAboutPreview ? "Edit" : "Preview"}
                    </button>
                  </div>

                  {showAboutPreview ? (
                    /* ── Preview Mode ── */
                    <div className="about-preview-wrapper">
                      <div className="about-preview-label">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Sitedeki görünüm — max-width: 750px
                      </div>
                      <div className="about-preview-frame">
                        <div
                          className="about-preview-content"
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              const sections = activeListing.about?.sections || [];
                              return sections
                                .map((s) => {
                                  let html = `<h3>${s.title || ""}</h3>\n${s.content || ""}`;
                                  if (s.highlights && s.highlights.length > 0) {
                                    const items = s.highlights.map((h) => `  <li>${h}</li>`).join("\n");
                                    html += `\n<ul>\n${items}\n</ul>`;
                                  }
                                  return html;
                                })
                                .join("\n\n");
                            })(),
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* ── Edit Mode ── */
                    <>
                      <div className="panel-title">Summary</div>
                      <div className="form-group full-width" style={{ marginBottom: "24px" }}>
                        <textarea
                          className="form-textarea"
                          rows={4}
                          value={activeListing.about?.summary || ""}
                          onChange={(e) => updateActiveListing("about.summary", e.target.value)}
                        />
                      </div>

                      <div className="panel-title">Sections</div>
                      <div>
                        {(activeListing.about?.sections || []).map((section, si) => (
                          <div className="section-card" key={si}>
                            <div className="section-card-header">
                              <span className="section-number">Section {si + 1}</span>
                              <button className="btn btn-danger btn-sm" onClick={() => removeSection(si)}>
                                Delete
                              </button>
                            </div>
                            <div className="form-group" style={{ marginBottom: "12px" }}>
                              <label className="form-label">Title</label>
                              <input
                                className="form-input"
                                value={section.title || ""}
                                onChange={(e) => handleSectionChange(si, "title", e.target.value)}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: "12px" }}>
                              <label className="form-label">Content</label>
                              <textarea
                                className="form-textarea"
                                rows={3}
                                value={section.content || ""}
                                onChange={(e) => handleSectionChange(si, "content", e.target.value)}
                              />
                            </div>
                            <div className="form-label" style={{ marginBottom: "8px" }}>
                              Highlights
                            </div>
                            <div className="highlights-list">
                              {(section.highlights || []).map((h, hi) => (
                                <div className="highlight-item" key={hi}>
                                  <input
                                    className="form-input"
                                    value={h || ""}
                                    onChange={(e) => handleHighlightChange(si, hi, e.target.value)}
                                  />
                                  <button className="btn-remove" onClick={() => removeHighlight(si, hi)} title="Remove">
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button className="btn-add-highlight" onClick={() => addHighlight(si)}>
                              + Add Highlight
                            </button>
                          </div>
                        ))}
                      </div>

                      <button className="btn btn-ghost" onClick={addSection} style={{ marginTop: "16px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Section
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Amenities Tab */}
              {activeTab === "amenities" && (
                <div className="tab-panel active">
                  <div className="panel-title">Amenities ({(activeListing.amenities || []).length})</div>
                  <div className="amenities-grid">
                    {(activeListing.amenities || []).map((a, i) => (
                      <div className="amenity-tag" key={i}>
                        {a}
                        <button className="remove-amenity" onClick={() => removeAmenity(i)} title="Remove">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="add-amenity-row">
                    <input
                      className="form-input"
                      id="newAmenityField"
                      placeholder="Add amenity..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addAmenity(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    />
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        const el = document.getElementById("newAmenityField");
                        if (el) {
                          addAmenity(el.value);
                          el.value = "";
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Pricing & Rules Tab */}
              {activeTab === "pricing" && (
                <div className="tab-panel active">
                  <div className="panel-title">Pricing</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Price per Month (€)</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        value={activeListing.pricing?.price_per_month ?? ""}
                        onChange={(e) =>
                          updateActiveListing(
                            "pricing.price_per_month",
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Security Deposit (€)</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        value={activeListing.pricing?.security_deposit ?? ""}
                        onChange={(e) =>
                          updateActiveListing(
                            "pricing.security_deposit",
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Minimum Stay (months)</label>
                      <input
                        className="form-input"
                        type="number"
                        value={activeListing.pricing?.minimum_stay_months ?? ""}
                        onChange={(e) =>
                          updateActiveListing(
                            "pricing.minimum_stay_months",
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    {activeListing.pricing?.maximum_stay_months !== undefined && (
                      <div className="form-group">
                        <label className="form-label">Maximum Stay (months)</label>
                        <input
                          className="form-input"
                          type="number"
                          value={activeListing.pricing?.maximum_stay_months ?? ""}
                          onChange={(e) =>
                            updateActiveListing(
                              "pricing.maximum_stay_months",
                              e.target.value === "" ? null : Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    )}
                    {activeListing.pricing?.cleaning_fee !== undefined && (
                      <div className="form-group">
                        <label className="form-label">Cleaning Fee (€)</label>
                        <input
                          className="form-input"
                          type="number"
                          step="0.01"
                          value={activeListing.pricing?.cleaning_fee ?? ""}
                          onChange={(e) =>
                            updateActiveListing(
                              "pricing.cleaning_fee",
                              e.target.value === "" ? null : Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-checkbox-row">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      id="allowGuestsCheck"
                      checked={!!activeListing.pricing?.allow_additional_guests}
                      onChange={(e) => updateActiveListing("pricing.allow_additional_guests", e.target.checked)}
                    />
                    <label className="form-checkbox-label" htmlFor="allowGuestsCheck">
                      Allow additional guests
                    </label>
                  </div>

                  <div className="panel-divider"></div>

                  <div className="panel-title">House Rules</div>
                  <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                    <div className="form-checkbox-row">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        id="ruleSmokeCheck"
                        checked={!!activeListing.house_rules?.smoking_allowed}
                        onChange={(e) => updateActiveListing("house_rules.smoking_allowed", e.target.checked)}
                      />
                      <label className="form-checkbox-label" htmlFor="ruleSmokeCheck">
                        Smoking allowed
                      </label>
                    </div>
                    <div className="form-checkbox-row">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        id="rulePetsCheck"
                        checked={!!activeListing.house_rules?.pets_allowed}
                        onChange={(e) => updateActiveListing("house_rules.pets_allowed", e.target.checked)}
                      />
                      <label className="form-checkbox-label" htmlFor="rulePetsCheck">
                        Pets allowed
                      </label>
                    </div>
                    <div className="form-checkbox-row">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        id="rulePartyCheck"
                        checked={!!activeListing.house_rules?.party_allowed}
                        onChange={(e) => updateActiveListing("house_rules.party_allowed", e.target.checked)}
                      />
                      <label className="form-checkbox-label" htmlFor="rulePartyCheck">
                        Party allowed
                      </label>
                    </div>
                    <div className="form-checkbox-row">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        id="ruleChildrenCheck"
                        checked={!!activeListing.house_rules?.children_allowed}
                        onChange={(e) => updateActiveListing("house_rules.children_allowed", e.target.checked)}
                      />
                      <label className="form-checkbox-label" htmlFor="ruleChildrenCheck">
                        Children allowed
                      </label>
                    </div>
                  </div>

                  <div className="form-group full-width" style={{ marginTop: "16px" }}>
                    <label className="form-label">Additional Rules Info</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={activeListing.house_rules?.additional_rules_info || ""}
                      onChange={(e) => updateActiveListing("house_rules.additional_rules_info", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === "seo" && (
                <div className="tab-panel active">
                  <div className="panel-title">SEO Optimization</div>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label className="form-label">Focus Keyword</label>
                    <input
                      className="form-input"
                      value={activeListing.seo?.focus_keyword || ""}
                      onChange={(e) => updateActiveListing("seo.focus_keyword", e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label className="form-label">SEO Title</label>
                    <input
                      className="form-input"
                      value={activeListing.seo?.seo_title || ""}
                      onChange={(e) => updateActiveListing("seo.seo_title", e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label className="form-label">Permalink / URL Slug</label>
                    <input
                      className="form-input"
                      value={activeListing.seo?.permalink || ""}
                      onChange={(e) => updateActiveListing("seo.permalink", e.target.value)}
                    />
                    {activeListing.seo?.permalink && (
                      <div style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--text-tertiary)" }}>Automatically Generated Link: </span>
                        <a
                          href={`https://thessnest.com/listing/${activeListing.seo.permalink}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--accent)", textDecoration: "underline" }}
                        >
                          https://thessnest.com/listing/{activeListing.seo.permalink}/
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: "20px" }}>
                    <label className="form-label">Link History (Previous Permalinks)</label>
                    <div style={{ 
                      background: "var(--bg-secondary)", 
                      border: "1px solid var(--border)", 
                      borderRadius: "var(--radius-md)", 
                      padding: "16px",
                      marginTop: "8px"
                    }}>
                      {activeListing.seo?.link_history && activeListing.seo.link_history.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {activeListing.seo.link_history.map((link, idx) => {
                            const displayLink = link.startsWith("http") ? link : `https://thessnest.com/listing/${link}/`;
                            return (
                              <div key={idx} style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "space-between", 
                                background: "var(--bg-tertiary)", 
                                padding: "10px 14px", 
                                borderRadius: "var(--radius-sm)", 
                                border: "1px solid var(--border)",
                                transition: "all 0.2s"
                              }}>
                                <a href={displayLink} target="_blank" rel="noopener noreferrer" style={{ 
                                  fontSize: "0.85rem", 
                                  color: "var(--accent)", 
                                  textDecoration: "underline",
                                  wordBreak: "break-all"
                                }}>
                                  {displayLink}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const history = [...activeListing.seo.link_history];
                                    history.splice(idx, 1);
                                    updateActiveListing("seo.link_history", history);
                                  }}
                                  style={{ 
                                    background: "rgba(220, 38, 38, 0.1)", 
                                    border: "none", 
                                    color: "var(--red)", 
                                    cursor: "pointer", 
                                    fontSize: "0.75rem",
                                    padding: "4px 8px",
                                    borderRadius: "var(--radius-sm)",
                                    fontWeight: "500",
                                    marginLeft: "12px",
                                    flexShrink: 0
                                  }}
                                  className="btn-delete-history"
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>
                          No previous links in history.
                        </div>
                      )}
                      
                      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Add old permalink or link manually..."
                          id="newHistoryItemInput"
                          style={{ flex: 1 }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = e.target.value.trim();
                              if (val) {
                                const history = activeListing.seo?.link_history ? [...activeListing.seo.link_history] : [];
                                if (!history.includes(val)) {
                                  history.push(val);
                                  updateActiveListing("seo.link_history", history);
                                  e.target.value = "";
                                }
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "0 16px", height: "38px" }}
                          onClick={() => {
                            const input = document.getElementById("newHistoryItemInput");
                            const val = input?.value.trim();
                            if (val) {
                              const history = activeListing.seo?.link_history ? [...activeListing.seo.link_history] : [];
                              if (!history.includes(val)) {
                                history.push(val);
                                updateActiveListing("seo.link_history", history);
                                input.value = "";
                              }
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">SEO Meta Description</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={activeListing.seo?.seo_description || ""}
                      onChange={(e) => updateActiveListing("seo.seo_description", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Raw JSON Tab */}
              {activeTab === "json" && (
                <div className="tab-panel active">
                  <div className="panel-title">Clean Listing JSON (Editable)</div>
                  <p style={{ color: "var(--text-tertiary)", fontSize: "0.85rem", marginBottom: "12px" }}>
                    You can edit the JSON text directly. The form fields will update automatically.
                  </p>
                  {jsonError && (
                    <div className="login-error" style={{ marginBottom: "12px", background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.2)", color: "var(--red)" }}>
                      ⚠️ {jsonError}
                    </div>
                  )}
                  <textarea
                    style={{
                      width: "100%",
                      height: "500px",
                      background: "var(--bg-tertiary)",
                      border: jsonError ? "1px solid var(--red)" : "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "16px",
                      fontSize: "0.85rem",
                      color: "var(--text-primary)",
                      fontFamily: "monospace",
                      outline: "none",
                      resize: "vertical",
                    }}
                    value={jsonInput}
                    onChange={handleJsonInputChange}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <div className="toast-container" id="toastContainer">
        {toasts.map((t) => (
          <div className={`toast ${t.type}`} key={t.id}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Global Search Dialog overlay */}
      {searchDialogOpen && (
        <div 
          className="command-overlay"
          onClick={() => setSearchDialogOpen(false)}
        >
          <div 
            className="command-dialog"
            onClick={(e) => e.stopPropagation()}
            ref={searchDialogRef}
          >
            <div className="command-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="command-input"
                placeholder="Search listings, amenities, rules, about contents..."
                value={globalSearchQuery}
                onKeyDown={handleDialogKeyDown}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setSelectedResultIndex(0);
                }}
              />
              <kbd className="command-header-kbd">ESC</kbd>
            </div>
            
            <div className="command-results">
              {globalSearchQuery.trim() === "" ? (
                <div className="command-empty">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "8px" }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Type a keyword or ID to start searching...</span>
                </div>
              ) : globalSearchResults.length === 0 ? (
                <div className="command-empty">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "8px" }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span>No listings match "{globalSearchQuery}"</span>
                </div>
              ) : (
                <>
                  <div className="command-group-title">
                    Matching Listings ({globalSearchResults.length})
                  </div>
                  {globalSearchResults.map((result, ri) => (
                    <button
                      key={result.listing.id}
                      className={`command-item ${selectedResultIndex === ri ? "focused" : ""}`}
                      onClick={() => selectSearchResult(ri)}
                      onMouseEnter={() => setSelectedResultIndex(ri)}
                    >
                      <div className="command-item-title-row">
                        <span className="command-item-path">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          </svg>
                          <span className="building-name">{result.listing._meta.building}</span>
                          <span>/</span>
                          <span>{result.listing._meta.file.replace(".json", "")}</span>
                        </span>
                        <span className="command-item-id">#{result.listing.id}</span>
                      </div>
                      
                      <div className="command-item-snippets">
                        {result.matches.map((match, mi) => (
                          <div key={mi} className="command-snippet-item">
                            <span className="command-snippet-field">{match.field}:</span>
                            <span className="command-snippet-text">
                              <HighlightedText text={match.text} query={globalSearchQuery} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
            
            <div className="command-footer">
              <div className="command-footer-kbd-list">
                <span className="command-footer-kbd-item">
                  <span className="command-footer-key">↑↓</span>
                  <span>Navigate</span>
                </span>
                <span className="command-footer-kbd-item">
                  <span className="command-footer-key">Enter</span>
                  <span>Select</span>
                </span>
                <span className="command-footer-kbd-item">
                  <span className="command-footer-key">Esc</span>
                  <span>Close</span>
                </span>
              </div>
              <div>
                <span>{globalSearchResults.length} matching listings</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
