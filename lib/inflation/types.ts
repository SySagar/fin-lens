export type InflationObservation = {
  seriesId: string;
  seriesName: string;
  category: string;
  referenceMonth: string;
  periodLabel: string;
  geography: string;
  baseYear: string;
  indexValue: number;
  yoyInflationPercent: number | null;
  momChangePercent: number | null;
  previousValue: number | null;
  yearAgoValue: number | null;
  publicationDate: string | null;
  source: string;
  sourceUrl: string;
  derived?: boolean;
};

export type InflationSourceStatus = {
  id: string;
  label: string;
  sourceUrl: string;
  fetchedAt: string | null;
  error: string | null;
};

export type InflationResponse = {
  fetchedAt: string;
  observations: InflationObservation[];
  sources: InflationSourceStatus[];
  limitations: Array<{ seriesId: string; label: string; reason: string }>;
};
