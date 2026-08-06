// Canonical public site URL. All email links and auth redirect URLs must use
// this domain so recipients always land on the production site.
export const SITE_URL = "https://scraad.com";

export const siteUrl = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
