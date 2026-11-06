import type {
  CdslField,
  CdslPeriod,
  CdslResponse,
  CdslValues,
  PeriodKind,
} from "@/lib/flows/types";

const BASE_URL = "https://www.cdslindia.com/eservices/Publications";
const USER_AGENT =
  "Mozilla/5.0 (compatible; FinLens/0.1; +https://x.com/SySagar2)";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

const FIELDS: CdslField[] = [
  "equity",
  "debtGeneral",
  "debtVRR",
  "debtFAR",
  "hybrid",
  "mfEquity",
  "mfDebt",
  "mfHybrid",
  "mfSolution",
  "mfOther",
  "aif",
];

type CacheEntry = { expires: number; value: CdslResponse };
const cache = new Map<string, CacheEntry>();
const CACHE_MS = 30 * 60 * 1000;

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    );
}

function cleanCell(value: string) {
  return decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value: string) {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === "--") return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(day: string, month: string, year: string) {
  const monthIndex = SHORT_MONTHS.findIndex(
    (name) => name.toLowerCase() === month.toLowerCase(),
  );
  if (monthIndex === -1) return null;

  const date = new Date(
    Date.UTC(Number(year), monthIndex, Number(day), 12),
  );
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function monthRange(year: number, monthIndex: number) {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function quarterRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function parseMonthlyLabel(label: string) {
  const match = label.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)-(\d{2})$/i,
  );
  if (!match) return null;

  const monthIndex = MONTHS.findIndex(
    (name) => name.toLowerCase() === match[1].toLowerCase(),
  );
  if (monthIndex === -1) return null;

  const year = 2000 + Number(match[2]);
  return {
    key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    label: `${MONTHS[monthIndex]} ${year}`,
    shortLabel: `${SHORT_MONTHS[monthIndex]} ${year}`,
    ...monthRange(year, monthIndex),
  };
}

function parseQuarterlyLabel(label: string) {
  const match = label.match(
    /^Q([1-4])\(([A-Za-z]{3})-([A-Za-z]{3})\)-(\d{4})$/i,
  );
  if (!match) return null;

  const quarter = Number(match[1]);
  const year = Number(match[4]);
  return {
    key: `${year}-Q${quarter}`,
    label: `Q${quarter} (${match[2]}–${match[3]}) ${year}`,
    shortLabel: `Q${quarter} ${year}`,
    ...quarterRange(year, quarter),
  };
}

export function parseCdslHtml(
  html: string,
  period: PeriodKind,
  year: number,
): CdslResponse {
  const tableMatch = html.match(
    /<table[^>]*id="dnrTable"[^>]*>([\s\S]*?)<\/table>/i,
  );
  if (!tableMatch) {
    throw new Error("CDSL table was not found in the response");
  }

  const rowMatches = [
    ...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi),
  ];

  const rows: CdslPeriod[] = [];
  const notes: string[] = [];
  let asOf: string | null = null;

  for (const rowMatch of rowMatches) {
    const cells = [
      ...rowMatch[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi),
    ].map((cell) => cleanCell(cell[1]));

    if (cells.length === 0) continue;

    const first = cells[0];

    if (!asOf) {
      const asOfMatch = first.match(
        /^\*\*\s*(\d{1,2})-([A-Za-z]{3})-(\d{4})/,
      );
      if (asOfMatch) {
        asOf = toIsoDate(asOfMatch[1], asOfMatch[2], asOfMatch[3]);
        continue;
      }
    }

    const label =
      period === "monthly"
        ? parseMonthlyLabel(first)
        : parseQuarterlyLabel(first);

    if (!label) {
      if (
        cells.length === 1 &&
        (first.startsWith("*") || first.startsWith("-"))
      ) {
        notes.push(first);
      }
      continue;
    }

    const values = {} as CdslValues;
    FIELDS.forEach((field, index) => {
      values[field] = toNumber(cells[index + 1] ?? "0");
    });

    const reportedTotal = toNumber(cells[FIELDS.length + 1] ?? "");
    values.total =
      reportedTotal ||
      FIELDS.reduce((sum, field) => sum + values[field], 0);

    rows.push({ ...label, values });
  }

  if (rows.length === 0) {
    throw new Error(`CDSL returned no ${period} rows for ${year}`);
  }

  return {
    source: "cdsl",
    sourceLabel: "CDSL FPI/FII net investment",
    period,
    year,
    asOf,
    fetchedAt: new Date().toISOString(),
    sourceUrl: `${BASE_URL}/${period === "monthly" ? "FIICalendar" : "FIIQuarterly"}`,
    rows,
    notes,
  };
}

export async function fetchCdslFlows(
  period: PeriodKind,
  year: number,
): Promise<CdslResponse> {
  const key = `${period}:${year}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  const page = period === "monthly" ? "FIICalendar" : "FIIQuarterly";
  const url = `${BASE_URL}/${page}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
      "content-type": "application/x-www-form-urlencoded",
      referer: url,
    },
    body: `selectedYear=${year}`,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`CDSL request failed with status ${response.status}`);
  }

  const result = parseCdslHtml(await response.text(), period, year);
  cache.set(key, { expires: Date.now() + CACHE_MS, value: result });
  return result;
}
