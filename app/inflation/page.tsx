import type { Metadata } from "next";
import { InflationDashboard } from "@/components/inflation/inflation-dashboard";

export const metadata: Metadata = {
  title: "India inflation tracker",
  description:
    "Explore official Indian CPI, CFPI, WPI, and labour price indices with historical trends and transparent source notes.",
};

export default function InflationPage() {
  return <InflationDashboard />;
}
