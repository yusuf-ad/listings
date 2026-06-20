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

/**
 * Reads all studio*.json files from the building directories,
 * injects _meta, and writes data.js
 */
function rebuildData() {
  const allListings = [];

  for (const building of BUILDINGS) {
    const buildingDir = path.join(PROJECT_DIR, building);
    if (!fs.existsSync(buildingDir) || !fs.statSync(buildingDir).isDirectory())
      continue;

    const files = fs
      .readdirSync(buildingDir)
      .filter((f) => f.startsWith("studio") && f.endsWith(".json"))
      .sort();

    for (const fileName of files) {
      const filePath = path.join(buildingDir, fileName);
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(raw);
        const entry = {
          _meta: {
            building,
            file: fileName,
            path: `${building}/${fileName}`,
          },
          ...data,
        };
        allListings.push(entry);
      } catch (err) {
        console.error(`⚠️  Skipping ${building}/${fileName}: ${err.message}`);
      }
    }
  }

  const output = `const LISTINGS_DATA = ${JSON.stringify(allListings, null, 2)};\n`;
  fs.writeFileSync(OUTPUT, output, "utf-8");
  console.log(`✅ data.js rebuilt from ${allListings.length} JSON files.`);
  return allListings.length;
}

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

  // API endpoint: Rebuild data.js
  if (req.url === "/api/rebuild" && req.method === "POST") {
    try {
      const count = rebuildData();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          count,
          message: `Rebuilt data.js from ${count} JSON files.`,
        }),
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API endpoint: Save listing JSON to disk
  if (req.url === "/api/save" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { path: relativePath, data } = JSON.parse(body);

        if (!relativePath || !data) {
          throw new Error("Missing path or data in request body");
        }

        // Validate that path stays within project buildings
        const cleanPath = path
          .normalize(relativePath)
          .replace(/^(\.\.[\/\\])+/, "");
        const targetPath = path.join(PROJECT_DIR, cleanPath);

        // Security check: Must reside within one of the approved buildings
        const relativeToProject = path.relative(PROJECT_DIR, targetPath);
        const parts = relativeToProject.split(path.sep);
        if (
          parts.length !== 2 ||
          !BUILDINGS.includes(parts[0]) ||
          !parts[1].startsWith("studio") ||
          !parts[1].endsWith(".json")
        ) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "Access Denied: Invalid file path." }),
          );
          return;
        }

        fs.writeFileSync(
          targetPath,
          JSON.stringify(data, null, 2) + "\n",
          "utf-8",
        );
        console.log(`💾 Saved ${relativePath} to disk.`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
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
  console.log(`   POST /api/rebuild  →  regenerate data.js from JSON files`);
  console.log(
    `   POST /api/save     →  save updated listing JSON back to disk\n`,
  );
});
