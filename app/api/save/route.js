import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req) {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json(
      { error: "Supabase connection is not initialized. Cannot save." },
      { status: 500 }
    );
  }

  try {
    const { path: relativePath, data } = await req.json();

    if (!relativePath || !data) {
      return NextResponse.json(
        { error: "Missing path or data in request body" },
        { status: 400 }
      );
    }

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error: dbError } = await supabase
      .from("listings")
      .upsert(row, { onConflict: "id" });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
