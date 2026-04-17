import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_CATEGORIES = new Set(["bug", "idea", "praise", "other"]);

type RateEntry = { count: number; resetAt: number };
const rateMap = new Map<string, RateEntry>();
const WINDOW_MS = 3_600_000;
const MAX_PER_WINDOW = 5;

function extractIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function allow(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  if (entry.count >= MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { ok: true, retryAfter: 0 };
}

export async function POST(request: Request) {
  try {
    const ip = extractIp(request);
    const rl = allow(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait before sending more feedback." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const category = String(body.category || "").trim();
    const message = String(body.message || "").trim();
    const email = body.email ? String(body.email).trim().slice(0, 320) : null;
    const pageUrl = body.pageUrl ? String(body.pageUrl).slice(0, 2048) : null;

    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }
    if (message.length < 3 || message.length > 2000) {
      return NextResponse.json({ error: "Message must be 3–2000 characters." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;
    const admin = createAdminClient();
    const { error } = await admin.from("feedback").insert({
      user_id: user?.id ?? null,
      email: email || user?.email || null,
      category,
      message,
      page_url: pageUrl,
      user_agent: userAgent,
    });

    if (error) {
      console.error("[feedback] insert error:", error);
      return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback] error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
