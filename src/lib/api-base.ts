/** Backend origin. Empty means the website and the API share one host (local Next.js). */
export function apiUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
