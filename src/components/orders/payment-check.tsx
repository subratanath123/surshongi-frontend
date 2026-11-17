"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { mutateCommunity } from "@/lib/community-store";
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

export function PaymentCheck({
  order,
  viewerId,
}: {
  order: ServiceOrder;
  viewerId: string;
}) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const status = order.paymentStatus ?? "none";
  const isBuyer = order.buyerId === viewerId;
  const isSeller = order.musicianId === viewerId;
  const [trx, setTrx] = useState(order.bkashTrxId ?? "");
  const [note, setNote] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const data = await mutateCommunity<{ error?: string }>(payload);
      if (data.error) setError(data.error);
    } catch {
      setError(locale === "bn" ? "সেভ হয়নি। আবার চেষ্টা করো।" : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveTrx(event: FormEvent) {
    event.preventDefault();
    await run({ action: "submitBkashTrx", orderId: order.id, bkashTrxId: trx.trim() });
  }

  async function confirm() {
    await run({ action: "confirmBkashPayment", orderId: order.id });
  }

  async function dispute(event: FormEvent) {
    event.preventDefault();
    await run({ action: "disputeBkashPayment", orderId: order.id, note: note.trim() });
    setDisputing(false);
    setNote("");
  }

  const badge =
    status === "confirmed"
      ? t("statusConfirmed")
      : status === "submitted"
        ? t("statusSubmitted")
        : status === "disputed"
          ? t("statusDisputed")
          : t("statusNone");

  const tone =
    status === "confirmed"
      ? "border-[#0D8BFF] bg-[#E7F3FF] text-[#0B184D]"
      : status === "disputed"
        ? "border-[#e4e5e7] bg-[#fff4f4] text-[#9b1c1c]"
        : "border-[#e4e5e7] bg-[#fafafa] text-[#404145]";

  return (
    <div className={`mt-2 rounded-lg border p-2.5 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold">{t("paymentTitle")}</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold">{badge}</span>
      </div>

      {status === "none" ? (
        <p className="mt-1 text-[11px] leading-5">{isBuyer ? t("noneBuyer") : t("noneSeller")}</p>
      ) : null}
      {status === "submitted" ? (
        <p className="mt-1 text-[11px] leading-5">
          {isSeller ? t("submittedSeller") : t("submittedBuyer")}
        </p>
      ) : null}
      {status === "confirmed" ? <p className="mt-1 text-[11px] leading-5">{t("confirmed")}</p> : null}
      {status === "disputed" ? <p className="mt-1 text-[11px] leading-5">{t("disputed")}</p> : null}

      {order.bkashTrxId ? (
        <p className="mt-1.5 font-mono text-xs font-semibold tracking-wide">{order.bkashTrxId}</p>
      ) : null}
      {order.paymentSubmittedAt ? (
        <p className="mt-1 text-[10px] opacity-80">
          {t("buyerSubmitted")} · {when(order.paymentSubmittedAt, locale)}
        </p>
      ) : null}
      {order.paymentConfirmedAt ? (
        <p className="text-[10px] opacity-80">
          {t("sellerConfirmed")} · {when(order.paymentConfirmedAt, locale)}
        </p>
      ) : null}
      {order.paymentDisputeNote ? (
        <p className="mt-1 text-[11px] leading-5">{order.paymentDisputeNote}</p>
      ) : null}

      {isBuyer && status !== "confirmed" ? (
        <form onSubmit={(event) => void saveTrx(event)} className="mt-2 space-y-1.5">
          <label className="block text-[10px] font-semibold" htmlFor={`trx-${order.id}`}>
            {t("trxLabel")}
          </label>
          <input
            id={`trx-${order.id}`}
            value={trx}
            onChange={(event) => setTrx(event.target.value.toUpperCase())}
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
            placeholder="8N7A6B5C4D"
            className="h-8 w-full rounded-md border border-[#e4e5e7] bg-white px-2 font-mono text-xs uppercase outline-none focus:border-[#0D8BFF]"
          />
          <p className="text-[10px] opacity-80">{t("trxHint")}</p>
          <button
            type="submit"
            disabled={busy || trx.trim().length < 6}
            className="h-8 rounded-full bg-primary px-3 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "…" : t("saveTrx")}
          </button>
        </form>
      ) : null}

      {isSeller && status === "submitted" ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirm()}
            className="h-8 rounded-full bg-primary px-3 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            {busy && !disputing ? "…" : t("confirm")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setDisputing((open) => !open)}
            className="h-8 rounded-full border border-[#e4e5e7] bg-white px-3 text-[11px] font-semibold"
          >
            {t("dispute")}
          </button>
        </div>
      ) : null}

      {isSeller && disputing && status === "submitted" ? (
        <form onSubmit={(event) => void dispute(event)} className="mt-2 space-y-1.5">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={240}
            rows={2}
            placeholder={t("disputeNote")}
            className="w-full rounded-md border border-[#e4e5e7] bg-white px-2 py-1.5 text-xs outline-none focus:border-[#0D8BFF]"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-8 rounded-full bg-[#222325] px-3 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "…" : t("sendDispute")}
          </button>
        </form>
      ) : null}

      {error ? <p className="mt-1.5 text-[11px] font-medium text-[#9b1c1c]">{error}</p> : null}
    </div>
  );
}
