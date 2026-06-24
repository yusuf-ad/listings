import React from "react";

/**
 * Escapes characters for a regular expression match
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * React Component to render text with the search query highlighted.
 */
export function HighlightedText({ text, query }) {
  if (!query || !query.trim()) return <span>{text}</span>;
  const escapedQuery = escapeRegExp(query.trim());
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i}>{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

/**
 * Scans all fields in listings for the search query and returns matching items with snippets.
 */
export function performGlobalSearch(listings, query) {
  if (!query || !query.trim()) return [];
  
  const q = query.toLowerCase().trim();
  const results = [];

  listings.forEach((listing, index) => {
    const matches = [];
    let score = 0;

    const checkField = (fieldPath, text, label, tabName) => {
      if (!text) return;
      const str = String(text);
      const strLower = str.toLowerCase();
      if (strLower.includes(q)) {
        // Count occurrences to calculate relevance score
        let count = 0;
        let pos = strLower.indexOf(q);
        while (pos !== -1) {
          count++;
          pos = strLower.indexOf(q, pos + 1);
        }
        
        // Boost score for title/id matches
        const weight = (label === "ID" || label === "Title" || label === "File name") ? 10 : 2;
        score += count * weight;
        
        // Extract a snippet of text surrounding the first match
        const matchPos = strLower.indexOf(q);
        const start = Math.max(0, matchPos - 35);
        const end = Math.min(str.length, matchPos + q.length + 45);
        let snippet = str.substring(start, end);
        
        // Clean up newlines or extra spaces for formatting
        snippet = snippet.replace(/\s+/g, " ");
        
        if (start > 0) snippet = "..." + snippet;
        if (end < str.length) snippet = snippet + "...";

        // Prevent showing duplicate snippets for the same label
        if (!matches.some(m => m.field === label && m.text === snippet)) {
          matches.push({
            field: label,
            text: snippet,
            tab: tabName
          });
        }
      }
    };

    // 1. Search metadata/filename/building
    const fileBase = listing._meta?.file?.replace(".json", "") || "";
    checkField("file", fileBase, "File name", "overview");
    checkField("building", listing._meta?.building, "Building", "overview");
    checkField("id", listing.id, "ID", "overview");
    checkField("title", listing.title, "Title", "overview");
    checkField("type", listing.type, "Type", "overview");

    // 2. Search location
    if (listing.location) {
      checkField("location.address", listing.location.address, "Address", "overview");
      checkField("location.street", listing.location.street, "Street", "overview");
      checkField("location.city", listing.location.city, "City", "overview");
      checkField("location.country", listing.location.country, "Country", "overview");
    }

    // 3. Search about sections
    if (listing.about) {
      checkField("about.summary", listing.about.summary, "Summary", "about");
      if (Array.isArray(listing.about.sections)) {
        listing.about.sections.forEach((sect, si) => {
          const sectTitle = sect.title || `Section ${si + 1}`;
          checkField(`about.sections[${si}].title`, sect.title, `Section Title ("${sectTitle}")`, "about");
          checkField(`about.sections[${si}].content`, sect.content, `Section Content ("${sectTitle}")`, "about");
          if (Array.isArray(sect.highlights)) {
            sect.highlights.forEach((hl, hi) => {
              checkField(`about.sections[${si}].highlights[${hi}]`, hl, `Highlight point in "${sectTitle}"`, "about");
            });
          }
        });
      }
    }

    // 4. Search amenities
    if (Array.isArray(listing.amenities)) {
      listing.amenities.forEach((amenity, ai) => {
        checkField(`amenities[${ai}]`, amenity, "Amenity", "amenities");
      });
    }

    // 5. Search pricing rules
    if (listing.house_rules) {
      checkField("house_rules.additional_rules_info", listing.house_rules.additional_rules_info, "House Rules Info", "pricing");
    }

    // 6. Search SEO
    if (listing.seo) {
      checkField("seo.focus_keyword", listing.seo.focus_keyword, "SEO Focus Keyword", "seo");
      checkField("seo.seo_title", listing.seo.seo_title, "SEO Title", "seo");
      checkField("seo.permalink", listing.seo.permalink, "SEO Permalink", "seo");
      checkField("seo.seo_description", listing.seo.seo_description, "SEO Description", "seo");
    }

    if (matches.length > 0) {
      results.push({
        index,
        listing,
        score,
        matches: matches.slice(0, 3) // Return top 3 matches maximum
      });
    }
  });

  // Sort by relevance score descending
  return results.sort((a, b) => b.score - a.score);
}
