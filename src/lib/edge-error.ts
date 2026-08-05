/**
 * Supabase `functions.invoke` masks server error bodies behind
 * "Edge Function returned a non-2xx status code". This pulls out the real message.
 */
export async function edgeErrorMessage(
  error: any,
  fallback = "Request failed",
): Promise<string> {
  try {
    const res: Response | undefined = error?.context;
    if (res && typeof res.json === "function") {
      const body = await res.clone().json().catch(() => null);
      if (body?.error) return String(body.error);
      const text = await res.clone().text().catch(() => "");
      if (text) return text.slice(0, 300);
    }
  } catch {
    /* ignore */
  }
  return error?.message || fallback;
}
