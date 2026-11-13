import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OrderHistory } from "@/components/orders/order-history";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Orders");
  return { title: t("title") };
}

export default function OrdersPage() {
  return <OrderHistory />;
}
