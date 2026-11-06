import type { NseFlow, NseResponse } from "@/lib/flows/types";

const PAGE_URL = "https://www.nseindia.com/reports/fii-dii";
const API_URL = "https://www.nseindia.com/api/fiidiiTradeReact";
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

let cache: { expires: number; value: NseResponse } | null = null;
const CACHE_MS = 5 * 60 * 1000;

function toNumber(value: string | number | undefined) {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(value: string) {
  const match = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;

  const monthIndex = SHORT_MONTHS.findIndex(
    (name) => name.toLowerCase() === match[2].toLowerCase(),
  );
  if (monthIndex === -1) return null;

  const date = new Date(
    Date.UTC(Number(match[3]), monthIndex, Number(match[1]), 12),
  );
  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString().slice(0, 10);
}

async function readCookies() {
  try {
    const response = await fetch(PAGE_URL, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-IN,en;q=0.9",
      },
      cache: "no-store",
    });

    const getSetCookie = (
      response.headers as Headers & { getSetCookie?: () => string[] }
    ).getSetCookie;

    return (getSetCookie?.call(response.headers) ?? [])
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
  } catch {
    return "";
  }
}

export async function fetchNseSnapshot(): Promise<NseResponse> {
  if (cache && cache.expires > Date.now()) {
    return cache.value;
  }

  const cookie = await readCookies();

  const response = await fetch(API_URL, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/json, text/plain, */*",
      "accept-language": "en-IN,en;q=0.9",
      referer: PAGE_URL,
      ...(cookie ? { cookie } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`NSE request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    category?: string;
    date?: string;
    buyValue?: string;
    sellValue?: string;
    netValue?: string;
  }>;

  const rows: NseFlow[] = payload
    .filter((row) => row.category)
    .map((row) => ({
      category: String(row.category).replace(/\s+/g, " ").trim(),
      date: toIsoDate(String(row.date ?? "")) ?? new Date().toISOString().slice(0, 10),
      buy: toNumber(row.buyValue),
      sell: toNumber(row.sellValue),
      net: toNumber(row.netValue),
    }));

  if (rows.length === 0) {
    throw new Error("NSE returned no FII/DII rows");
  }

  const result: NseResponse = {
    source: "nse",
    sourceLabel: "NSE FII/FPI & DII trading activity",
    asOf: rows[0]?.date ?? null,
    fetchedAt: new Date().toISOString(),
    sourceUrl: PAGE_URL,
    rows,
    note: "Capital-market segment trading activity for the latest reported session. NSE does not publish a free historical series through this endpoint.",
  };

  cache = { expires: Date.now() + CACHE_MS, value: result };
  return result;
}
