/** Direct API origin. Leave empty so the browser stays on this site and Next proxies to BACKEND_URL. */
export function apiUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
