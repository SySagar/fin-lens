import type {
  InflationObservation,
  InflationResponse,
  InflationSourceStatus,
} from "@/lib/inflation/types";
import { OEA_CA_CERTIFICATES } from "@/lib/inflation/oea-ca";
import { fetchOfficial } from "@/lib/inflation/source-fetch";
import { readFirstWorksheet } from "@/lib/inflation/xlsx";

const MOSPI_CATALOGUE_URL =
  "https://api.mospi.gov.in/api/esankhyiki/cms/golden-sheet/list";
const MOSPI_DOWNLOAD_BASE =
  "https://api.mospi.gov.in/api/esankhyiki/file/download/";
const MOSPI_PAGE_URL =
  "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi";
const OEA_PAGE_URL = "https://eaindustry.nic.in/download_data_2223.asp";
const LABOUR_URL = "https://labourbureau.gov.in/";
const FETCH_TIMEOUT_MS = 25_000;
const MAX_CPI_MONTHS = 36;
const TRACKER_CACHE_MS = 15 * 60 * 1000;
let trackerCache: { expires: number; value: InflationResponse } | null = null;

type CatalogueRecord = {
  catalogue_code: number;
  table_name: string;
  ref_period: string;
  release_date?: string;
  file_name: string;
  file_path: string;
  data_source?: string;
};

type DraftObservation = Omit<
  InflationObservation,
  | "yoyInflationPercent"
  | "momChangePercent"
  | "previousValue"
  | "yearAgoValue"
> & { reportedYoy: number | null };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = cleanText(value).replace(/,/g, "");
  if (!text || text === "-" || text === "--") return null;
  const parsed = Number(text.replace(/%$/, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseReferenceMonth(value: string): { key: string; label: string } | null {
  const match = value.match(/([A-Za-z]+)\s+(\d{4})/);
  if (!match) return null;
  const longMonthIndex = MONTHS.findIndex(
    (month) => month.toLowerCase() === match[1].toLowerCase(),
  );
  const monthIndex = longMonthIndex >= 0
    ? longMonthIndex
    : MONTH_ABBREVIATIONS.findIndex(
        (month) => month.toLowerCase() === match[1].toLowerCase(),
      );
  if (monthIndex < 0) return null;
  return {
    key: `${match[2]}-${String(monthIndex + 1).padStart(2, "0")}`,
    label: `${MONTH_ABBREVIATIONS[monthIndex]} ${match[2]}`,
  };
}

function parsePublicationDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function monthOrder(key: string) {
  return Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7));
}

function addDraft(
  output: DraftObservation[],
  record: CatalogueRecord,
  referenceMonth: { key: string; label: string },
  baseYear: string,
  seriesId: string,
  seriesName: string,
  category: string,
  geography: string,
  indexValue: number | null,
  reportedYoy: number | null,
  sourceUrl: string,
  derived = false,
) {
  if (indexValue === null) return;
  output.push({
    seriesId,
    seriesName,
    category,
    referenceMonth: referenceMonth.key,
    periodLabel: referenceMonth.label,
    geography,
    baseYear,
    indexValue,
    publicationDate: parsePublicationDate(record.release_date),
    source: "MoSPI",
    sourceUrl,
    reportedYoy,
    ...(derived ? { derived: true } : {}),
  });
}

function parseNewCpiSheet(
  rows: unknown[][],
  record: CatalogueRecord,
  referenceMonth: { key: string; label: string },
  baseYear: string,
  sourceUrl: string,
  output: DraftObservation[],
) {
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => cleanText(cell).toLowerCase() === "division name"),
  );
  if (headerIndex < 0) return false;

  const monthIndex = headerIndex + 1;
  const indexColumns = [2, 3, 4];
  const yoyColumns = [5, 6, 7];
  const geographies = ["Rural", "Urban", "Combined"];

  for (const row of rows.slice(monthIndex + 1)) {
    const name = cleanText(row[1]);
    if (!name) continue;
    const isHeadline = /^all india$/i.test(name);
    const id = isHeadline ? "cpi-general" : `cpi-category-${slug(name)}`;
    const label = isHeadline ? "CPI — General" : `CPI — ${name}`;
    for (let index = 0; index < geographies.length; index += 1) {
      addDraft(
        output,
        record,
        referenceMonth,
        baseYear,
        id,
        label,
        isHeadline ? "General CPI" : name,
        geographies[index],
        numberOrNull(row[indexColumns[index]]),
        numberOrNull(row[yoyColumns[index]]),
        sourceUrl,
      );
    }
  }
  return true;
}

function parseOldCpiSheet(
  rows: unknown[][],
  record: CatalogueRecord,
  referenceMonth: { key: string; label: string },
  baseYear: string,
  sourceUrl: string,
  output: DraftObservation[],
) {
  const descriptionIndex = rows.findIndex((row) =>
    row.some((cell) => cleanText(cell).toLowerCase() === "description"),
  );
  if (descriptionIndex < 0) return false;

  const wantedMonth = Number(referenceMonth.key.slice(5, 7)) - 1;
  const wantedYear = referenceMonth.key.slice(2, 4);
  const headerCandidates = rows.slice(descriptionIndex, descriptionIndex + 5);
  const periodColumns = new Set<number>();
  for (const row of headerCandidates) {
    row.forEach((cell, index) => {
      const text = cleanText(cell).toLowerCase();
      if (!text.includes("index") || !text.includes(wantedYear)) return;
      if (
        text.includes(MONTHS[wantedMonth].toLowerCase()) ||
        text.includes(MONTH_ABBREVIATIONS[wantedMonth].toLowerCase())
      ) {
        periodColumns.add(index);
      }
    });
  }
  const sortedColumns = [...periodColumns].sort((a, b) => a - b);
  if (sortedColumns.length < 3) return false;
  const columns = sortedColumns.slice(-3);
  const geographies = ["Rural", "Urban", "Combined"];
  const weightedGroups: Array<{ weight: number; value: number; name: string }> = [];

  for (const row of rows.slice(descriptionIndex + 1)) {
    const description = cleanText(row[2] ?? row[0]);
    if (!description) continue;
    const normalized = description.toLowerCase();
    let seriesId = `cpi-category-${slug(description)}`;
    let seriesName = `CPI — ${description}`;
    let category = description;
    if (/^general index/i.test(description)) {
      seriesId = "cpi-general";
      seriesName = "CPI — General";
      category = "General CPI";
    } else if (/consumer food price index|\bcfpi\b/i.test(description)) {
      seriesId = "cfpi";
      seriesName = "Consumer Food Price Index (CFPI)";
      category = "Food inflation";
    }

    for (let index = 0; index < geographies.length; index += 1) {
      addDraft(
        output,
        record,
        referenceMonth,
        baseYear,
        seriesId,
        seriesName,
        category,
        geographies[index],
        numberOrNull(row[columns[index]]),
        null,
        sourceUrl,
      );
    }

    const groupNumber = numberOrNull(row[0]);
    const combinedWeight = numberOrNull(row[9]);
    const combinedIndex = numberOrNull(row[columns[2]]);
    if (
      groupNumber !== null &&
      Number.isInteger(groupNumber) &&
      combinedWeight !== null &&
      combinedIndex !== null &&
      !normalized.includes("food and beverages") &&
      !normalized.includes("fuel and light")
    ) {
      weightedGroups.push({
        weight: combinedWeight,
        value: combinedIndex,
        name: description,
      });
    }
  }

  const totalWeight = weightedGroups.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight > 0) {
    const coreIndex = weightedGroups.reduce(
      (sum, item) => sum + item.weight * item.value,
      0,
    ) / totalWeight;
    addDraft(
      output,
      record,
      referenceMonth,
      baseYear,
      "core-cpi",
      "Core CPI (derived)",
      "CPI excluding food and fuel groups",
      "Combined",
      coreIndex,
      null,
      sourceUrl,
      true,
    );
  }
  return true;
}

function parseNewCpiStateSheet(
  rows: unknown[][],
  record: CatalogueRecord,
  referenceMonth: { key: string; label: string },
  baseYear: string,
  sourceUrl: string,
  output: DraftObservation[],
) {
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => cleanText(cell).toLowerCase() === "state"),
  );
  if (headerIndex < 0) return false;
  const geographies = ["Rural", "Urban", "Combined"];
  for (const row of rows.slice(headerIndex + 2)) {
    const state = cleanText(row[1]);
    if (!state || /^all india$/i.test(state) || /^note/i.test(state)) continue;
    for (let index = 0; index < geographies.length; index += 1) {
      addDraft(
        output,
        record,
        referenceMonth,
        baseYear,
        "cpi-general",
        "CPI — General",
        "General CPI",
        `${state} · ${geographies[index]}`,
        numberOrNull(row[index + 2]),
        numberOrNull(row[index + 5]),
        sourceUrl,
      );
    }
  }
  return true;
}

async function fetchCpiObservations(): Promise<{
  observations: InflationObservation[];
  fetchedAt: string;
}> {
  const firstResponse = await fetchOfficial(
    `${MOSPI_CATALOGUE_URL}?product=CPI&page=1&limit=100`,
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
  );
  if (!firstResponse.ok) {
    throw new Error(`MoSPI CPI catalogue returned ${firstResponse.status}`);
  }
  const first = (await firstResponse.json()) as {
    data?: CatalogueRecord[];
    meta_data?: { totalPages?: number };
  };
  const totalPages = Math.min(Math.max(first.meta_data?.totalPages ?? 1, 1), 10);
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => index + 2).map(
      async (page) => {
        const response = await fetchOfficial(
          `${MOSPI_CATALOGUE_URL}?product=CPI&page=${page}&limit=100`,
          { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
        );
        if (!response.ok) throw new Error(`MoSPI CPI catalogue returned ${response.status}`);
        return (await response.json()) as { data?: CatalogueRecord[] };
      },
    ),
  );
  const records = [...(first.data ?? []), ...remainingPages.flatMap((page) => page.data ?? [])];
  const monthlyRecords = records
    .filter((record) => {
      const title = record.table_name.toLowerCase();
      return (
        /annex-i\.xlsx$/i.test(record.file_name) &&
        (title.includes("division wise indices and inflation") ||
          title.includes("general, group and sub-group level cpi and cfpi numbers"))
      );
    })
    .map((record) => ({ record, period: parseReferenceMonth(record.ref_period) }))
    .filter((item): item is { record: CatalogueRecord; period: { key: string; label: string } } =>
      item.period !== null,
    )
    .sort((a, b) => monthOrder(b.period.key) - monthOrder(a.period.key));

  const unique = new Map<string, (typeof monthlyRecords)[number]>();
  for (const item of monthlyRecords) {
    const baseYear = item.record.table_name.match(/base\s*year\s*[:=]\s*(\d{4})/i)?.[1] ?? "2012";
    const key = `${item.period.key}:${baseYear}`;
    if (!unique.has(key)) unique.set(key, item);
  }
  const selectedRecords = [...unique.values()].slice(0, MAX_CPI_MONTHS);
  const drafts: DraftObservation[] = [];
  const failures: string[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(6, selectedRecords.length) }, async () => {
    while (cursor < selectedRecords.length) {
      const item = selectedRecords[cursor++];
      const { record, period } = item;
      const baseYear = record.table_name.match(/base\s*year\s*[:=]\s*(\d{4})/i)?.[1] ?? "2012";
      const sourceUrl = `${MOSPI_DOWNLOAD_BASE}${record.file_path.replace(/^\//, "")}${encodeURIComponent(record.file_name)}`;
      try {
        const response = await fetchOfficial(sourceUrl, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error(`download returned ${response.status}`);
        const rows = readFirstWorksheet(await response.arrayBuffer());
        const parsed =
          parseNewCpiSheet(rows, record, period, baseYear, sourceUrl, drafts) ||
          parseOldCpiSheet(rows, record, period, baseYear, sourceUrl, drafts);
        if (!parsed) failures.push(`${period.label}: unrecognized MoSPI CPI workbook layout`);
      } catch (error) {
        failures.push(
          `${period.label}: ${error instanceof Error ? error.message : "download failed"}`,
        );
      }
    }
  });
  await Promise.all(workers);
  if (drafts.length === 0) {
    throw new Error(failures[0] ?? "MoSPI CPI catalogue contained no parseable monthly data");
  }

  const latestStateTable = records
    .filter((record) => {
      const title = record.table_name.toLowerCase();
      return /annex-iii\.xlsx$/i.test(record.file_name) &&
        title.includes("state/ut wise general index and inflation");
    })
    .map((record) => ({ record, period: parseReferenceMonth(record.ref_period) }))
    .filter((item): item is { record: CatalogueRecord; period: { key: string; label: string } } =>
      item.period !== null,
    )
    .sort((a, b) => monthOrder(b.period.key) - monthOrder(a.period.key))[0];
  if (latestStateTable) {
    const { record, period } = latestStateTable;
    const baseYear = record.table_name.match(/base\s*year\s*[:=]\s*(\d{4})/i)?.[1] ?? "2024";
    const sourceUrl = `${MOSPI_DOWNLOAD_BASE}${record.file_path.replace(/^\//, "")}${encodeURIComponent(record.file_name)}`;
    try {
      const response = await fetchOfficial(sourceUrl, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`download returned ${response.status}`);
      parseNewCpiStateSheet(
        readFirstWorksheet(await response.arrayBuffer()),
        record,
        period,
        baseYear,
        sourceUrl,
        drafts,
      );
    } catch {
      // The all-India CPI series remains usable when the optional state table is unavailable.
    }
  }
  const observations = enrichObservations(drafts);
  return { observations, fetchedAt: new Date().toISOString() };
}

function parseWpiMonth(value: unknown) {
  const match = cleanText(value).match(/^([A-Za-z]{3})[- ](\d{2,4})$/);
  if (!match) return null;
  const monthIndex = MONTH_ABBREVIATIONS.findIndex(
    (month) => month.toLowerCase() === match[1].toLowerCase(),
  );
  if (monthIndex < 0) return null;
  const year = match[2].length === 2 ? 2000 + Number(match[2]) : Number(match[2]);
  return { key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`, label: `${match[1]} ${year}` };
}

async function fetchWpiObservations(): Promise<{
  observations: InflationObservation[];
  fetchedAt: string;
}> {
  const pageResponse = await fetchOfficial(OEA_PAGE_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": "Mozilla/5.0 (compatible; FinLens/0.1)" },
    additionalCa: OEA_CA_CERTIFICATES,
  });
  if (!pageResponse.ok) throw new Error(`OEA WPI page returned ${pageResponse.status}`);
  const page = await pageResponse.text();
  const workbookPath = page.match(/(?:https?:)?\/\/[^"'\s>]*wpi_monthly_index_\d+\.xlsx|(?:\.\.\/)?indx_download_2223\/wpi_monthly_index_\d+\.xlsx/i)?.[0];
  if (!workbookPath) throw new Error("OEA monthly WPI workbook link was not found");
  const workbookUrl = new URL(workbookPath.replace(/^\.\.\//, ""), OEA_PAGE_URL).toString();
  const workbookResponse = await fetchOfficial(workbookUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": "Mozilla/5.0 (compatible; FinLens/0.1)" },
    additionalCa: OEA_CA_CERTIFICATES,
  });
  if (!workbookResponse.ok) throw new Error(`OEA WPI workbook returned ${workbookResponse.status}`);
  const rows = readFirstWorksheet(await workbookResponse.arrayBuffer());
  const header = rows[0] ?? [];
  const monthColumns = header
    .map((value, index) => ({ index, period: parseWpiMonth(value) }))
    .filter((item): item is { index: number; period: { key: string; label: string } } => item.period !== null);
  const categories = [
    { match: /^All Commodities$/i, id: "wpi-all", name: "WPI — All Commodities" },
    { match: /^I\s+PRIMARY ARTICLES$/i, id: "wpi-primary", name: "WPI — Primary Articles" },
    { match: /^II\s+FUEL\s*&\s*POWER$/i, id: "wpi-fuel", name: "WPI — Fuel & Power" },
    { match: /^III\.?\s+MANUFACTURED PRODUCTS$/i, id: "wpi-manufactured", name: "WPI — Manufactured Products" },
  ];
  const drafts: DraftObservation[] = [];
  for (const row of rows.slice(1)) {
    const level = cleanText(row[0]);
    const name = cleanText(row[1]);
    const category = categories.find(
      (item) => item.match.test(name) && (item.id === "wpi-all" ? level === "ALL" : level === "Major Group"),
    );
    if (!category) continue;
    for (const column of monthColumns) {
      const indexValue = numberOrNull(row[column.index]);
      if (indexValue === null) continue;
      drafts.push({
        seriesId: category.id,
        seriesName: category.name,
        category: name,
        referenceMonth: column.period.key,
        periodLabel: column.period.label,
        geography: "All India",
        baseYear: "2022-23",
        indexValue,
        publicationDate: null,
        source: "Office of the Economic Adviser",
        sourceUrl: workbookUrl,
        reportedYoy: null,
      });
    }
  }
  if (drafts.length === 0) throw new Error("OEA workbook contained no recognized WPI series");
  return { observations: enrichObservations(drafts), fetchedAt: new Date().toISOString() };
}

function extractCells(block: string, className: string) {
  const regex = new RegExp(`<div[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/div>`, "gi");
  return [...block.matchAll(regex)].map((match) => cleanText(match[1]));
}

function parseLabourMonth(value: string) {
  const match = value.match(/^([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const monthIndex = MONTH_ABBREVIATIONS.findIndex(
    (month) => month.toLowerCase() === match[1].toLowerCase(),
  );
  if (monthIndex < 0) return null;
  return { key: `${match[2]}-${String(monthIndex + 1).padStart(2, "0")}`, label: `${match[1]} ${match[2]}` };
}

function findLabourBlock(html: string, title: string) {
  const start = html.toLowerCase().indexOf(title.toLowerCase());
  if (start < 0) return "";
  const next = html.indexOf('class="mapPanelSt', start);
  return html.slice(start, next < 0 ? start + 16_000 : next);
}

async function fetchLabourObservations(): Promise<{
  observations: InflationObservation[];
  fetchedAt: string;
}> {
  const response = await fetchOfficial(LABOUR_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": "Mozilla/5.0 (compatible; FinLens/0.1)" },
  });
  if (!response.ok) throw new Error(`Labour Bureau page returned ${response.status}`);
  const html = await response.text();
  const drafts: DraftObservation[] = [];
  const iwBlock = findLabourBlock(html, "CPI-IW [General Index");
  const iwCells = extractCells(iwBlock, "col-sm-6 col py-1");
  for (let index = 0; index + 1 < iwCells.length; index += 2) {
    const period = parseLabourMonth(iwCells[index]);
    const value = numberOrNull(iwCells[index + 1]);
    if (!period || value === null) continue;
    drafts.push({
      seriesId: "cpi-iw",
      seriesName: "CPI-IW — Industrial Workers",
      category: "General Index",
      referenceMonth: period.key,
      periodLabel: period.label,
      geography: "All India",
      baseYear: "2016",
      indexValue: value,
      publicationDate: null,
      source: "Labour Bureau",
      sourceUrl: LABOUR_URL,
      reportedYoy: null,
    });
  }

  const alrlBlock = findLabourBlock(html, "CPI-AL/RL [General Index");
  const alrlCells = extractCells(alrlBlock, "col-sm-4 col py-1");
  for (let index = 0; index + 2 < alrlCells.length; index += 3) {
    const period = parseLabourMonth(alrlCells[index]);
    const alValue = numberOrNull(alrlCells[index + 1]);
    const rlValue = numberOrNull(alrlCells[index + 2]);
    if (!period) continue;
    for (const item of [
      { id: "cpi-al", name: "CPI-AL — Agricultural Labourers", value: alValue },
      { id: "cpi-rl", name: "CPI-RL — Rural Labourers", value: rlValue },
    ]) {
      if (item.value === null) continue;
      drafts.push({
        seriesId: item.id,
        seriesName: item.name,
        category: "General Index",
        referenceMonth: period.key,
        periodLabel: period.label,
        geography: "All India",
        baseYear: "2019",
        indexValue: item.value,
        publicationDate: null,
        source: "Labour Bureau",
        sourceUrl: LABOUR_URL,
        reportedYoy: null,
      });
    }
  }
  if (drafts.length === 0) throw new Error("Labour Bureau page contained no CPI index values");
  return { observations: enrichObservations(drafts), fetchedAt: new Date().toISOString() };
}

function enrichObservations(drafts: DraftObservation[]) {
  const groups = new Map<string, DraftObservation[]>();
  for (const item of drafts) {
    const key = `${item.seriesId}|${item.geography}|${item.baseYear}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const result: InflationObservation[] = [];
  for (const items of groups.values()) {
    const byMonth = new Map(
      items.sort((a, b) => monthOrder(a.referenceMonth) - monthOrder(b.referenceMonth))
        .map((item) => [item.referenceMonth, item]),
    );
    for (const item of byMonth.values()) {
      const currentOrder = monthOrder(item.referenceMonth);
      const previous = byMonth.get(
        `${Math.floor((currentOrder - 2) / 12)}-${String(((currentOrder - 2) % 12) + 1).padStart(2, "0")}`,
      );
      const yearAgo = byMonth.get(
        `${Number(item.referenceMonth.slice(0, 4)) - 1}-${item.referenceMonth.slice(5, 7)}`,
      );
      const mom = previous && previous.indexValue !== 0
        ? ((item.indexValue / previous.indexValue) - 1) * 100
        : null;
      const calculatedYoy = yearAgo && yearAgo.indexValue !== 0
        ? ((item.indexValue / yearAgo.indexValue) - 1) * 100
        : null;
      result.push({
        ...item,
        yoyInflationPercent: item.reportedYoy ?? calculatedYoy,
        momChangePercent: mom,
        previousValue: previous?.indexValue ?? null,
        yearAgoValue: yearAgo?.indexValue ?? null,
      });
    }
  }
  return result.sort(
    (a, b) => monthOrder(a.referenceMonth) - monthOrder(b.referenceMonth) || a.seriesName.localeCompare(b.seriesName),
  );
}

async function settleSource(
  id: string,
  label: string,
  sourceUrl: string,
  loader: () => Promise<{ observations: InflationObservation[]; fetchedAt: string }>,
): Promise<{ observations: InflationObservation[]; status: InflationSourceStatus }> {
  try {
    const result = await loader();
    return {
      observations: result.observations,
      status: { id, label, sourceUrl, fetchedAt: result.fetchedAt, error: null },
    };
  } catch (error) {
    return {
      observations: [],
      status: {
        id,
        label,
        sourceUrl,
        fetchedAt: null,
        error: error instanceof Error ? error.message : "Source could not be loaded",
      },
    };
  }
}

export async function fetchInflationTracker(): Promise<InflationResponse> {
  if (trackerCache && trackerCache.expires > Date.now()) return trackerCache.value;
  const [cpi, wpi, labour] = await Promise.all([
    settleSource("mospi", "MoSPI — Consumer Price Index", MOSPI_PAGE_URL, fetchCpiObservations),
    settleSource("oea", "Office of the Economic Adviser — WPI", OEA_PAGE_URL, fetchWpiObservations),
    settleSource("labour", "Labour Bureau — CPI-IW and CPI-AL/RL", LABOUR_URL, fetchLabourObservations),
  ]);
  const observations = [...cpi.observations, ...wpi.observations, ...labour.observations];
  const result: InflationResponse = {
    fetchedAt: new Date().toISOString(),
    observations,
    sources: [cpi.status, wpi.status, labour.status],
    limitations: [
      {
        seriesId: "gdp-deflator",
        label: "GDP Deflator",
        reason:
          "The RBI DBIE is the official reference, but a stable public downloadable time series was not verified for this release. No value is estimated from unrelated series.",
      },
    ],
  };
  if (result.sources.every((source) => source.error === null)) {
    trackerCache = { expires: Date.now() + TRACKER_CACHE_MS, value: result };
  }
  return result;
}
