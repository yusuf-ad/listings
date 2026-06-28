import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json(
      { error: "Supabase connection is not initialized. Please check your credentials in .env file." },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, updated: 0, message: "No listings found in Supabase." });
    }

    const projectRoot = process.cwd();
    let updatedCount = 0;
    const results = [];

    for (const row of data) {
      const { building, file_name, created_at, updated_at, ...entry } = row;

      if (!building || !file_name) {
        results.push({ id: row.id, status: "skipped", reason: "Missing building or file_name" });
        continue;
      }

      const dirPath = path.join(projectRoot, building);
      const filePath = path.join(dirPath, file_name);

      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      try {
        fs.writeFileSync(filePath, JSON.stringify(entry, null, 2) + "\n", "utf8");
        updatedCount++;
        results.push({ id: row.id, path: `${building}/${file_name}`, status: "updated" });
      } catch (fsError) {
        results.push({ id: row.id, path: `${building}/${file_name}`, status: "error", reason: fsError.message });
      }
    }

    return NextResponse.json({
      success: true,
      total: data.length,
      updated: updatedCount,
      results,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
