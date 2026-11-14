import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HowGuide } from "@/components/how/how-guide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Guide");
  return { title: t("title") };
}

export default function HowPage() {
  return <HowGuide />;
}
