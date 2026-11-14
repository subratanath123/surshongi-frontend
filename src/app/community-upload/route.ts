import { connection } from "next/server";
import { proxyBackend } from "@/lib/proxy-backend";

export async function POST(request: Request) {
  await connection();
  return proxyBackend(request, "/community-upload");
}
