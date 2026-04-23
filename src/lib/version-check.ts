/**
 * Version check: detects when a new build has been deployed and auto-reloads
 * the page so the user always sees the latest version without needing a hard refresh.
 *
 * How it works:
 * - Vite stamps every build with hashed asset URLs inside index.html
 *   (e.g. /assets/index-AbCdE123.js).
 * - We periodically fetch index.html with cache-busting and compare the set of
 *   script/link asset hashes to the ones loaded in the current page.
 * - If they differ, a new deployment exists -> reload once.
 *
 * Skipped in dev / preview iframes to avoid disrupting editing.
 */

const CHECK_INTERVAL_MS = 60_000; // every 60s
const STORAGE_KEY = "scraad:last-reload";
const RELOAD_COOLDOWN_MS = 30_000; // never reload twice within 30s

const isDev = import.meta.env.DEV;

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname === "localhost");

function getCurrentAssetSignature(): string {
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]"))
    .map((s) => s.getAttribute("src") || "")
    .filter((src) => src.includes("/assets/"));
  const links = Array.from(document.querySelectorAll<HTMLLinkElement>("link[href]"))
    .map((l) => l.getAttribute("href") || "")
    .filter((href) => href.includes("/assets/"));
  return [...scripts, ...links].sort().join("|");
}

function extractAssetSignature(html: string): string {
  const matches = Array.from(html.matchAll(/(?:src|href)=["']([^"']*\/assets\/[^"']+)["']/g))
    .map((m) => m[1])
    .sort();
  return matches.join("|");
}

async function checkForNewVersion(currentSignature: string): Promise<boolean> {
  try {
    const res = await fetch(`/index.html?_=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return false;
    const html = await res.text();
    const remoteSignature = extractAssetSignature(html);
    if (!remoteSignature) return false;
    return remoteSignature !== currentSignature;
  } catch {
    return false;
  }
}

function safeReload() {
  const now = Date.now();
  const last = Number(sessionStorage.getItem(STORAGE_KEY) || 0);
  if (now - last < RELOAD_COOLDOWN_MS) return;
  sessionStorage.setItem(STORAGE_KEY, String(now));
  window.location.reload();
}

export function startVersionCheck() {
  // Skip in dev and inside preview iframes — would disrupt the Lovable editor.
  if (isDev || isInIframe || isPreviewHost) return;

  const baseline = getCurrentAssetSignature();
  if (!baseline) return;

  const tick = async () => {
    if (document.visibilityState !== "visible") return;
    const hasNew = await checkForNewVersion(baseline);
    if (hasNew) safeReload();
  };

  // Check on tab focus (user returning to the app)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });
  window.addEventListener("focus", tick);

  // Periodic check while the tab is open
  setInterval(tick, CHECK_INTERVAL_MS);

  // Initial check shortly after load
  setTimeout(tick, 5_000);
}
