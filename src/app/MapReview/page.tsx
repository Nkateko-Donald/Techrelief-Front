"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const HeatmapComponent = dynamic(
  () => import("@/components/HeatmapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-gray-200 rounded-lg animate-pulse">
        Loading heatmap...
      </div>
    ),
  }
);

interface CrimeReport {
  ReportID: number;
  Report_Location: string;
}

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

const reportTypes = ["Crime", "Fire", "Natural Disaster", "SOS"];

export default function CrimeHeatmapPage() {
  const [heatData, setHeatData] = useState<HeatPoint[]>([]);
  const [selectedType, setSelectedType] = useState("Crime");

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch(
          `https://myappapi-yo3p.onrender.com/getReportsByType?type=${encodeURIComponent(
            selectedType
          )}`
        );
        const data = await res.json();

        if (data.success && Array.isArray(data.Reports)) {
          const points = data.Reports.map((report: CrimeReport) => {
            const [latStr, lngStr] = report.Report_Location.split(";");
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng, intensity: 1 };
            }
            return null;
          }).filter(Boolean) as HeatPoint[];
          setHeatData(points);
        }
      } catch (error) {
        console.error("Error loading reports:", error);
      }
    }

    fetchReports();
  }, [selectedType]);

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-semibold mb-4">{selectedType} Heatmap</h1>

      <div className="mb-6">
        <label htmlFor="typeFilter" className="block mb-1 text-sm font-medium">
          Filter by Report Type
        </label>
        <select
          id="typeFilter"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {reportTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {heatData.length > 0 ? (
        <HeatmapComponent data={heatData} />
      ) : (
        <div className="text-gray-500">Loading or no data available.</div>
      )}
    </div>
  );
}
