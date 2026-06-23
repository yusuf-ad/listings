#!/usr/bin/env node
/**
 * Script to synchronize local JSON listing files to Supabase.
 * Usage: npm run sync
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and SUPABASE_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PROJECT_DIR = __dirname;
const BUILDINGS = ["aristotelous", "artemidos", "kleious", "saranti"];

async function sync() {
  console.log('🔄 Starting listings synchronization to Supabase...');
  let totalFiles = 0;
  let successCount = 0;
  let failureCount = 0;

  for (const building of BUILDINGS) {
    const buildingDir = path.join(PROJECT_DIR, building);
    if (!fs.existsSync(buildingDir) || !fs.statSync(buildingDir).isDirectory()) {
      continue;
    }

    const files = fs
      .readdirSync(buildingDir)
      .filter((f) => f.startsWith("studio") && f.endsWith(".json"))
      .sort();

    for (const fileName of files) {
      const filePath = path.join(buildingDir, fileName);
      totalFiles++;
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const entry = JSON.parse(raw);

        if (!entry.id) {
          throw new Error('Missing ID in listing');
        }

        const row = {
          id: entry.id,
          title: entry.title || '',
          featured: typeof entry.featured === 'boolean' ? entry.featured : false,
          type: entry.type || null,
          building: building,
          file_name: fileName,
          location: entry.location || null,
          about: entry.about || null,
          details: entry.details || null,
          amenities: entry.amenities || [],
          pricing: entry.pricing || null,
          house_rules: entry.house_rules || null,
          host: entry.host || null,
          seo: entry.seo || null,
        };

        const { error } = await supabase
          .from('listings')
          .upsert(row, { onConflict: 'id' });

        if (error) {
          throw error;
        }

        console.log(`✅ Synced: ${building}/${fileName} -> Supabase ID ${entry.id}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed ${building}/${fileName}:`, err.message);
        failureCount++;
      }
    }
  }

  console.log(`\n📊 Synchronization Summary:`);
  console.log(`   Total Files Found: ${totalFiles}`);
  console.log(`   Successfully Synced: ${successCount}`);
  console.log(`   Failed: ${failureCount}`);
  if (failureCount === 0 && totalFiles > 0) {
    console.log('🎉 All listings successfully synchronized to Supabase!');
  }
}

sync();
