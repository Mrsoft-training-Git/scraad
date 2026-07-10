// Vercel Edge Function: serves HTML with per-page OG tags for social crawlers,
// and hands real users the normal SPA (index.html).

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://hhhylhihtfdmbhhqzxqu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaHlsaGlodGZkbWJoaHF6eHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjEwODgsImV4cCI6MjA4OTMzNzA4OH0.V2g9b-mQbyb4W0h19QB6CwD-Y4uubMvMqRwA178sXTw";

const BOT_UA =
  /bot|crawler|spider|facebookexternalhit|facebot|whatsapp|telegram|slackbot|linkedinbot|twitterbot|discordbot|pinterest|redditbot|embedly|quora|outbrain|vkshare|w3c_validator|preview|snapchat|skypeuripreview|ia_archiver|applebot|googlebot|bingbot|duckduckbot|yandex|baiduspider/i;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function fetchRecord(table: "courses" | "programs", id: string) {
  const cols =
    table === "courses"
      ? "title,description,overview,image_url"
      : "title,short_description,description,banner_image_url";
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(
    id
  )}&select=${cols}&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function htmlPage(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
}) {
  const { title, description, image, url } = opts;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:secure_url" content="${esc(image)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
</head><body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<p><a href="${esc(url)}">Open ${esc(title)}</a></p>
</body></html>`;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const ua = req.headers.get("user-agent") || "";
  const isBot = BOT_UA.test(ua);

  const m = url.pathname.match(/^\/(courses|programs)\/([^/?#]+)/i);

  // Non-bot or non-matching path: pass through to the SPA index.html
  if (!isBot || !m) {
    const spa = await fetch(new URL("/index.html", url.origin).toString());
    return new Response(await spa.text(), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const table = m[1].toLowerCase() === "courses" ? "courses" : "programs";
  const id = m[2];

  const fallbackImage = `${url.origin}/placeholder.svg`;
  let title = "ScraAD | Scratch to Advance";
  let description =
    "ScraAd is a modern e-learning platform. Go from Scratch to Advance with professional courses, certifications, and hands-on training.";
  let image = fallbackImage;

  try {
    const row: any = await fetchRecord(table as any, id);
    if (row) {
      title = row.title || title;
      description =
        (table === "courses"
          ? row.overview || row.description
          : row.short_description || row.description) || description;
      // strip markdown/html tags roughly and clamp length
      description = String(description)
        .replace(/<[^>]+>/g, "")
        .replace(/[#*_>`~]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300);
      const img =
        table === "courses" ? row.image_url : row.banner_image_url;
      if (img) image = img;
    }
  } catch {
    // fall through with defaults
  }

  return new Response(
    htmlPage({ title, description, image, url: url.toString() }),
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=600",
      },
    }
  );
}
