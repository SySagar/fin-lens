import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { FlowsDashboard } from "@/components/flows/flows-dashboard";

export const metadata: Metadata = {
  title: "FII / DII flows",
  description:
    "Monthly and quarterly FII/FPI and DII net investment data for Indian markets, shown in INR crore or USD billion.",
};

async function Dashboard() {
  await connection();
  const now = new Date();
  return (
    <FlowsDashboard
      initialMonth={now.getMonth()}
      initialYear={now.getFullYear()}
    />
  );
}

function DashboardFallback() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-10 w-64 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-56 animate-pulse rounded bg-muted" />
        </div>
      </section>
    </main>
  );
}

export default function FiiDiiPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Dashboard />
    </Suspense>
  );
}
