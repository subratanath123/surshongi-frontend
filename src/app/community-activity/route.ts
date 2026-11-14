import { connection } from "next/server";
import { proxyBackend } from "@/lib/proxy-backend";

export async function GET(request: Request) {
  await connection();
  return proxyBackend(request, "/community-activity");
}

export async function POST(request: Request) {
  await connection();
  return proxyBackend(request, "/community-activity");
}
