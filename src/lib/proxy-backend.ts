/** Forward a browser request to the Java API. The website stays on this host. */
export async function proxyBackend(request: Request, path: string) {
  const backend = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "");
  const incoming = new URL(request.url);
  const target = new URL(`${backend}${path.startsWith("/") ? path : `/${path}`}`);
  target.search = incoming.search;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  const range = request.headers.get("range");
  if (range) headers.set("range", range);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  const out = new Headers();
  for (const name of ["content-type", "content-range", "accept-ranges", "location"]) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  out.set("cache-control", "no-store");
  const cookies = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  for (const value of cookies) out.append("set-cookie", value);
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
