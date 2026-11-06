export type FxRate = {
  /** INR per 1 USD */
  rate: number;
  /** Reference date in YYYY-MM-DD */
  date: string;
  source: string;
  sourceUrl: string;
};

const CDSL_DAILY_URL =
  "https://www.cdslindia.com/eservices/publications/fiidaily";
const FALLBACK_URL = "https://open.er-api.com/v6/latest/USD";

/**
 * CDSL converts FPI figures using the RBI reference rate. Prefer the rate
 * published in its latest daily report so conversions line up with the
 * data shown on this site.
 */
export function parseCdslRate(html: string): FxRate | null {
  const dateMatch = html.match(/(\d{2})-([A-Z]{3})-(\d{4})/);
  const rateMatch = html.match(
    /rowspan="\d+"[^>]*>\s*([1-9]\d{1,2}\.\d{2,6})\s*<\/td>/,
  );

  if (!dateMatch || !rateMatch) return null;

  const rate = Number(rateMatch[1]);
  // Sanity-check the parsed cell so another number on the page cannot be
  // mistaken for the USD/INR rate.
  if (!Number.isFinite(rate) || rate < 20 || rate > 200) return null;

  const [, day, month, year] = dateMatch;
  const months: Record<string, string> = {
    JAN: "01",
    FEB: "02",
    MAR: "03",
    APR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AUG: "08",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DEC: "12",
  };
  const monthNumber = months[month];
  if (!monthNumber) return null;

  return {
    rate,
    date: `${year}-${monthNumber}-${day}`,
    source: "RBI reference rate via CDSL",
    sourceUrl: CDSL_DAILY_URL,
  };
}

async function fetchCdslRate(): Promise<FxRate | null> {
  try {
    const response = await fetch(CDSL_DAILY_URL, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; MacroLens/0.1; +https://x.com/SySagar2)",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;
    return parseCdslRate(await response.text());
  } catch {
    return null;
  }
}

async function fetchFallbackRate(): Promise<FxRate | null> {
  try {
    const response = await fetch(FALLBACK_URL, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };

    const rate = data.rates?.INR;
    if (!rate || !Number.isFinite(rate)) return null;

    const updated = data.time_last_update_utc
      ? new Date(data.time_last_update_utc)
      : new Date();

    return {
      rate,
      date: updated.toISOString().slice(0, 10),
      source: "ExchangeRate-API",
      sourceUrl: "https://www.exchangerate-api.com",
    };
  } catch {
    return null;
  }
}

export async function fetchUsdInr(): Promise<FxRate | null> {
  return (await fetchCdslRate()) ?? (await fetchFallbackRate());
}
