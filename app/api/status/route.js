import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const connected = !!(SUPABASE_URL && SUPABASE_KEY);
  let supabaseUrlMask = null;
  if (connected) {
    supabaseUrlMask = SUPABASE_URL.replace(/(.{10}).+/, "$1...");
  }

  return NextResponse.json({
    connected,
    supabaseUrl: supabaseUrlMask
  });
}
