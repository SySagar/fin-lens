import { NextResponse } from "next/server";
import { fetchUsdInr } from "@/lib/fx";

export async function GET() {
  const fx = await fetchUsdInr();

  if (!fx) {
    return NextResponse.json(
      { error: "USD/INR rate is currently unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.json(fx, {
    headers: {
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
    },
  });
}
