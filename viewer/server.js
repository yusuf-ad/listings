#!/usr/bin/env node
/**
 * Local development server for the Listing Manager viewer.
 * - Serves static files from the project root (so JSON files are fetchable)
 * - Provides POST /api/rebuild to regenerate data.js from all studio JSON files
 * - Provides POST /api/save to write changes back to JSON files on disk
 *
 * Usage:  node viewer/server.js
 *         Then open http://localhost:3456/viewer/
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

// Load environment variables from parent folder .env
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase Client
let supabase = null;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("🔌 Supabase client initialized successfully.");
  } catch (err) {
    console.error("⚠️ Failed to initialize Supabase client:", err.message);
  }
} else {
  console.log("ℹ️ Supabase credentials not found in env. Running in Local Mode.");
}

const PORT = 3456;
const PROJECT_DIR = path.resolve(__dirname, "..");
const OUTPUT = path.join(__dirname, "data.js");
const BUILDINGS = ["aristotelous", "artemidos", "kleious", "saranti"];

// MIME types for static serving
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Local file-based listing retrieval logic has been removed as the app now runs strictly on Supabase.

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // API endpoint: Get Supabase status
  if (req.url === "/api/status" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        connected: supabase !== null,
        supabaseUrl: SUPABASE_URL ? SUPABASE_URL.replace(/(.{10}).+/, "$1...") : null,
      })
    );
    return;
  }

  // API endpoint: Get listings (exclusively from Supabase)
  if (req.url === "/api/listings" && req.method === "GET") {
    if (!supabase) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Supabase connection is not initialized. Please check your credentials in .env file." }));
      return;
    }

    supabase
      .from("listings")
      .select("*")
      .order("id", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("⚠️ Failed to load listings from Supabase:", error.message);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error.message }));
        } else {
          // Map DB columns to frontend expected keys (inject _meta)
          const mapped = data.map((row) => {
            const { building, file_name, created_at, updated_at, ...entry } = row;
            return {
              _meta: {
                building,
                file: file_name,
                path: `${building}/${file_name}`,
              },
              ...entry,
            };
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(mapped));
        }
      })
      .catch((err) => {
        console.error("⚠️ Supabase query promise error:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // API endpoint: Save listing JSON to Supabase (only)
  if (req.url === "/api/save" && req.method === "POST") {
    if (!supabase) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Supabase connection is not initialized. Cannot save." }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { path: relativePath, data } = JSON.parse(body);

        if (!relativePath || !data) {
          throw new Error("Missing path or data in request body");
        }

        // Parse building and file_name from relativePath (e.g. "aristotelous/studio1.json")
        const parts = relativePath.split('/');
        const buildingName = parts[0] || 'unknown';
        const fileName = parts[1] || 'studio.json';

        const row = {
          id: data.id,
          title: data.title || '',
          featured: typeof data.featured === 'boolean' ? data.featured : false,
          type: data.type || null,
          building: buildingName,
          file_name: fileName,
          location: data.location || null,
          about: data.about || null,
          details: data.details || null,
          amenities: data.amenities || [],
          pricing: data.pricing || null,
          house_rules: data.house_rules || null,
          host: data.host || null,
          seo: data.seo || null,
        };

        const { error: dbError } = await supabase
          .from("listings")
          .upsert(row, { onConflict: "id" });

        if (dbError) {
          throw dbError;
        }

        console.log(`🔌 Saved to Supabase ID ${data.id}.`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error(`⚠️ Supabase save error: ${err.message}`);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static files serving
  let filePath = path.join(
    PROJECT_DIR,
    req.url === "/" || req.url === "/viewer" || req.url === "/viewer/"
      ? "viewer/index.html"
      : req.url,
  );

  // If path is a directory but doesn't end in /, redirect or add index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // Security check: Must reside within project directory
  if (!filePath.startsWith(PROJECT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Access Denied");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeType = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mimeType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

server.listen(PORT, () => {
  console.log(
    `\n🏠 Listing Manager Server running at http://localhost:${PORT}/viewer/\n`,
  );
  console.log(`   GET  /api/listings  →  fetch listings from Supabase`);
  console.log(`   POST /api/save      →  save listing changes to Supabase\n`);
});
