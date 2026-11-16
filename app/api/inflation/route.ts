import { NextResponse } from "next/server";
import { fetchInflationTracker } from "@/lib/sources/inflation";

export async function GET() {
  const result = await fetchInflationTracker();
  const complete = result.sources.every((source) => source.error === null);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": complete
        ? "public, max-age=900, stale-while-revalidate=1800"
        : "no-store",
    },
  });
}
