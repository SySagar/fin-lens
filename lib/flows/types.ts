export type PeriodKind = "monthly" | "quarterly";

export type CdslField =
  | "equity"
  | "debtGeneral"
  | "debtVRR"
  | "debtFAR"
  | "hybrid"
  | "mfEquity"
  | "mfDebt"
  | "mfHybrid"
  | "mfSolution"
  | "mfOther"
  | "aif";

export type CdslValues = Record<CdslField, number> & { total: number };

export type CdslPeriod = {
  key: string;
  label: string;
  shortLabel: string;
  start: string;
  end: string;
  values: CdslValues;
};

export type CdslResponse = {
  source: "cdsl";
  sourceLabel: string;
  period: PeriodKind;
  year: number;
  asOf: string | null;
  fetchedAt: string;
  sourceUrl: string;
  rows: CdslPeriod[];
  notes: string[];
};

export type NseFlow = {
  category: string;
  date: string;
  buy: number;
  sell: number;
  net: number;
};

export type NseResponse = {
  source: "nse";
  sourceLabel: string;
  asOf: string | null;
  fetchedAt: string;
  sourceUrl: string;
  rows: NseFlow[];
  note: string;
};
