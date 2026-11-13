"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PaymentCheck } from "@/components/orders/payment-check";
import { Link } from "@/i18n/navigation";
import { openChatWindow, useCommunityStore, useCurrentUser } from "@/lib/community-store";
import { formatNumber } from "@/lib/format";
import type { ServiceOrder } from "@/lib/db-types";

function when(value: string | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Step({
  label,
  at,
  locale,
  pending,
}: {
  label: string;
  at?: string;
  locale: string;
  pending: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-1 size-2 shrink-0 rounded-full ${at ? "bg-[#1dbf73]" : "bg-[#e4e5e7]"}`}
      />
      <span>
        <span className="block text-xs font-semibold text-[#222325]">{label}</span>
        <span className="block text-[11px] text-[#74767e]">{at ? when(at, locale) : pending}</span>
      </span>
    </li>
  );
}

function OrderCard({
  order,
  viewerId,
  otherName,
}: {
  order: ServiceOrder;
  viewerId: string;
  otherName: string;
}) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const otherId = order.buyerId === viewerId ? order.musicianId : order.buyerId;
  const work =
    order.status === "completed"
      ? t("statusCompleted")
      : order.status === "delivered"
        ? t("statusDelivered")
        : t("active");

  return (
    <article className="rounded-xl border border-[#e4e5e7] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[#222325]">{order.title}</h2>
          <p className="mt-1 text-xs text-[#74767e]">
            {t("with")}{" "}
            <Link href={`/u/${otherId}`} className="font-semibold text-[#222325] hover:text-[#1dbf73]">
              {otherName}
            </Link>
            {" · "}৳{formatNumber(order.priceBdt, locale)} · {order.deliveryDays}d
          </p>
        </div>
        <span className="rounded-full bg-[#e8f8ef] px-2.5 py-1 text-[11px] font-semibold text-[#0e7a49]">
          {work}
        </span>
      </div>
      {order.description ? (
        <p className="mt-3 text-sm leading-6 text-[#404145]">{order.description}</p>
      ) : null}
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        <Step label={t("placed")} at={order.createdAt} locale={locale} pending={t("notYet")} />
        <Step label={t("delivered")} at={order.deliveredAt} locale={locale} pending={t("notYet")} />
        <Step label={t("completed")} at={order.completedAt} locale={locale} pending={t("notYet")} />
      </ol>
      <PaymentCheck order={order} viewerId={viewerId} />
      <button
        type="button"
        onClick={() => openChatWindow(otherId)}
        className="mt-3 h-8 rounded-full border border-[#e4e5e7] px-3 text-[11px] font-semibold text-[#222325] hover:border-[#1dbf73]"
      >
        {t("openChat")}
      </button>
    </article>
  );
}

export function OrderHistory() {
  const t = useTranslations("Orders");
  const nav = useTranslations("Nav");
  const user = useCurrentUser();
  const { db } = useCommunityStore();
  const [side, setSide] = useState<"buying" | "selling">("buying");

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-[#222325]">{t("history")}</h1>
        <p className="mt-3 text-sm text-[#74767e]">{t("signIn")}</p>
        <Link
          href="/register"
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#1dbf73] px-4 text-sm font-semibold text-white"
        >
          {nav("register")}
        </Link>
      </main>
    );
  }

  const orders = [...db.orders]
    .filter((order) => (side === "buying" ? order.buyerId === user.id : order.musicianId === user.id))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[#222325]">{t("history")}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74767e]">{t("intro")}</p>
      <div className="mt-5 flex gap-2">
        {(["buying", "selling"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSide(item)}
            className={`h-9 rounded-full px-4 text-xs font-semibold ${
              side === item
                ? "bg-[#222325] text-white"
                : "border border-[#e4e5e7] bg-white text-[#404145]"
            }`}
          >
            {t(item)}
          </button>
        ))}
      </div>
      {orders.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-[#e4e5e7] bg-white px-4 py-8 text-center text-sm text-[#74767e]">
          {t("empty")}
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {orders.map((order) => {
            const otherId = order.buyerId === user.id ? order.musicianId : order.buyerId;
            const other = db.users.find((person) => person.id === otherId);
            return (
              <OrderCard
                key={order.id}
                order={order}
                viewerId={user.id}
                otherName={other?.name ?? otherId}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
