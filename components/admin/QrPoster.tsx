"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface QrPosterProps {
  joinUrl: string;
  joinCode: string;
  workshopName: string;
}

const QR_SIZE = 260;

export function QrPoster({ joinUrl, joinCode, workshopName }: QrPosterProps) {
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  function handleDownload() {
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const padding = 24;
      const canvas = document.createElement("canvas");
      canvas.width = QR_SIZE + padding * 2;
      canvas.height = QR_SIZE + padding * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, padding, padding, QR_SIZE, QR_SIZE);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const safeName = workshopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "workshop";
      link.href = pngUrl;
      link.download = `${safeName}-qr-${joinCode}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    };
    image.src = url;
  }

  return (
    <div className="pulse-card flex flex-col items-center gap-4 p-6 text-center">
      <p className="pulse-kicker">Scan to join</p>
      <div ref={svgWrapperRef} className="rounded-xl bg-white p-3">
        <QRCodeSVG value={joinUrl} size={QR_SIZE} level="M" includeMargin />
      </div>
      <p className="font-display text-gradient text-3xl font-bold tracking-[0.2em]">{joinCode}</p>
      <p className="max-w-xs break-all text-xs text-muted">{joinUrl}</p>
      <button type="button" onClick={handleDownload} className="pulse-btn px-4 py-2 text-sm">
        Download QR (PNG)
      </button>
    </div>
  );
}

export default QrPoster;
