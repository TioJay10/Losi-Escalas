import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://owfbmhfrndbqqqayzfee.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable__tCbNCYNnnW3ZnohhubrXw_fC0M88kH";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/freelancer-auth`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "login",
        system_id: String(body?.system_id || "").trim(),
        password: String(body?.password || ""),
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({ error: "invalid_response" }));

    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "freelancer_login_unavailable" }, { status: 502 });
  }
}
