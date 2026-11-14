import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ActivityScreen } from "@/components/activity/activity-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Activity");
  return { title: t("title") };
}

export default function ActivityPage() {
  return <ActivityScreen />;
}
