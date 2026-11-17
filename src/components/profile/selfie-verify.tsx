"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { mutateCommunity, uploadAudioFile } from "@/lib/community-store";

export function SelfieVerify({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("Profile");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    setPreview(null);
    setFile(null);
    setError("");
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      })
      .catch(() => setError("blocked"));
    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!open || preview || !video || !stream) return;
    video.srcObject = stream;
    void video.play();
  }, [open, preview]);

  if (!open) return null;

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setFile(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
        setPreview(canvas.toDataURL("image/jpeg", 0.9));
      },
      "image/jpeg",
      0.9,
    );
  }

  async function save() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const uploaded = await uploadAudioFile(file);
      const result = await mutateCommunity<{ error?: string }>({
        action: "verifySelfie",
        avatarUrl: uploaded.url,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="font-display text-2xl text-[#222325]">{t("selfieTitle")}</h2>
        <p className="mt-1 text-sm text-[#62646a]">{t("selfieBody")}</p>
        <div className="mt-4 overflow-hidden rounded-xl bg-[#111]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="aspect-square w-full object-cover" />
          ) : (
            <video ref={videoRef} playsInline muted className="aspect-square w-full -scale-x-100 object-cover" />
          )}
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-600">
            {error === "blocked" ? t("selfieCameraBlocked") : error === "failed" ? t("selfieFailed") : error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full border border-[#e4e5e7] px-4 text-sm font-semibold"
          >
            {t("selfieCancel")}
          </button>
          {preview ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
                className="h-10 rounded-full border border-[#e4e5e7] px-4 text-sm font-semibold"
              >
                {t("selfieRetake")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="h-10 rounded-full bg-[#5B35F5] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? t("uploading") : t("selfieUse")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={capture}
              className="h-10 rounded-full bg-[#5B35F5] px-4 text-sm font-semibold text-white"
            >
              {t("selfieCapture")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
