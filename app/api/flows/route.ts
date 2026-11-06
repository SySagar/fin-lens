import { NextResponse } from "next/server";
import { fetchCdslFlows } from "@/lib/sources/cdsl";
import { fetchNseSnapshot } from "@/lib/sources/nse";
import type { PeriodKind } from "@/lib/flows/types";

const CURRENT_YEAR = new Date().getFullYear();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") ?? "cdsl";
  const period = (searchParams.get("period") ?? "monthly") as PeriodKind;
  const year = Number(searchParams.get("year") ?? CURRENT_YEAR);

  try {
    if (source === "nse") {
      const snapshot = await fetchNseSnapshot();
      return NextResponse.json(snapshot, {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      });
    }

    if (source !== "cdsl") {
      return NextResponse.json(
        { error: "Unknown source. Use source=cdsl or source=nse." },
        { status: 400 },
      );
    }

    if (period !== "monthly" && period !== "quarterly") {
      return NextResponse.json(
        { error: "Unknown period. Use period=monthly or period=quarterly." },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(year) ||
      year < 2002 ||
      year > CURRENT_YEAR
    ) {
      return NextResponse.json(
        { error: `Year must be between 2002 and ${CURRENT_YEAR}.` },
        { status: 400 },
      );
    }

    const flows = await fetchCdslFlows(period, year);
    return NextResponse.json(flows, {
      headers: {
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch flow data";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
