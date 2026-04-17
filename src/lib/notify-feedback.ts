const PRODUCT_NAME = "Steelvow";
const FROM_ADDRESS = `${PRODUCT_NAME} Feedback <noreply@penguinalley.com>`;
const TO_ADDRESS = "hello@penguinalley.com";

const CATEGORY_LABEL: Record<string, string> = {
  bug: "Bug",
  idea: "Idea",
  praise: "Praise",
  other: "Other",
};

type Payload = {
  category: string;
  message: string;
  email: string | null;
  pageUrl: string | null;
  userAgent: string | null;
  userId: string | null;
};

export async function notifyFeedback(p: Payload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[feedback/notify] RESEND_API_KEY not set — skipping email");
    return;
  }

  const categoryLabel = CATEGORY_LABEL[p.category] || p.category;
  const snippet = p.message.length > 60 ? `${p.message.slice(0, 60)}…` : p.message;
  const subject = `[${PRODUCT_NAME}] ${categoryLabel}: ${snippet}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 640px;">
      <h2 style="margin: 0 0 16px;">${PRODUCT_NAME} — New ${categoryLabel}</h2>
      <p style="white-space: pre-wrap; background: #f7f7f7; padding: 16px; border-radius: 8px; border-left: 4px solid #ea580c;">${escapeHtml(p.message)}</p>
      <table style="margin-top: 16px; font-size: 14px; color: #555;">
        <tr><td style="padding: 4px 12px 4px 0;"><strong>From:</strong></td><td>${p.email ? escapeHtml(p.email) : "<em>anonymous</em>"}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>User ID:</strong></td><td>${p.userId || "<em>unauth</em>"}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Page:</strong></td><td>${p.pageUrl ? `<a href="${escapeAttr(p.pageUrl)}">${escapeHtml(p.pageUrl)}</a>` : "—"}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>User-Agent:</strong></td><td style="font-family: monospace; font-size: 12px;">${p.userAgent ? escapeHtml(p.userAgent) : "—"}</td></tr>
      </table>
      <p style="margin-top: 24px; font-size: 12px; color: #888;">A product by Penguin Alley (penguinalley.com)</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TO_ADDRESS],
        reply_to: p.email || undefined,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[feedback/notify] resend error:", res.status, body);
    }
  } catch (err) {
    console.error("[feedback/notify] network error:", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
