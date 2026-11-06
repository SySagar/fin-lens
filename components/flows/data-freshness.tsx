"use client";

import { useEffect, useState } from "react";

const STALE_AFTER_MS = 60 * 60 * 1000;

function relativeLabel(diffMs: number) {
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function DataFreshness({ fetchedAt }: { fetchedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchedTime = new Date(fetchedAt).getTime();
  if (Number.isNaN(fetchedTime)) return null;

  const diff = Math.max(0, now - fetchedTime);
  const stale = diff > STALE_AFTER_MS;
  const timestamp = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(fetchedTime));

  return (
    <span
      title={`Retrieved ${timestamp} UTC`}
      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${
          stale ? "bg-negative" : "bg-positive"
        }`}
      />
      {stale ? `Stale · retrieved ${relativeLabel(diff)}` : `Retrieved ${relativeLabel(diff)}`}
    </span>
  );
}
