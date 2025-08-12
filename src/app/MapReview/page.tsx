"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import HeatmapComponent from "@/components/HeatmapComponent";

interface ReportWithSuburb {
  ReportID: number;
  Report_Location: string; // format "lat;lng"
  suburb: string;
}

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface SuburbCount {
  name: string;
  count: number;
}

interface SuburbApiResponse {
  success: boolean;
  reports: ReportWithSuburb[];
  uniqueSuburbs: string[];
  totalReports: number;
  uniqueSuburbCount: number;
}

const reportTypes = [
  "Crime",
  "Fire",
  "Natural Disaster",
  "SOS",
  "Suspicious Activity",
];

export default function CrimeHeatmapPage() {
  const [heatData, setHeatData] = useState<HeatPoint[]>([]);
  const [suburbs, setSuburbs] = useState<SuburbCount[]>([]);
  const [selectedType, setSelectedType] = useState("Crime");
  const [totalReports, setTotalReports] = useState(0);
  const [uniqueSuburbCount, setUniqueSuburbCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchReportsWithSuburbs() {
      setLoading(true);
      try {
        const res = await fetch(
          `https://myappapi-yo3p.onrender.com/getSuburbsByType?type=${encodeURIComponent(
            selectedType
          )}`
        );
        const data: SuburbApiResponse = await res.json();

        if (data.success && Array.isArray(data.reports)) {
          const pointMap: Record<string, number> = {};
          const points: HeatPoint[] = [];

          data.reports.forEach((report) => {
            const [latStr, lngStr] = report.Report_Location.split(";");
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);

            if (!isNaN(lat) && !isNaN(lng)) {
              const key = `${lat},${lng}`;
              pointMap[key] = (pointMap[key] || 0) + 1;
            }
          });

          Object.entries(pointMap).forEach(([key, count]) => {
            const [lat, lng] = key.split(",").map(Number);
            points.push({ lat, lng, intensity: count });
          });

          setHeatData(points);

          const suburbCounts: Record<string, number> = {};
          data.reports.forEach((r) => {
            suburbCounts[r.suburb] = (suburbCounts[r.suburb] || 0) + 1;
          });

          const suburbArray = Object.entries(suburbCounts).map(
            ([name, count]) => ({
              name,
              count,
            })
          );

          setSuburbs(suburbArray);
          setTotalReports(data.totalReports);
          setUniqueSuburbCount(data.uniqueSuburbCount);
        } else {
          setHeatData([]);
          setSuburbs([]);
          setTotalReports(0);
          setUniqueSuburbCount(0);
        }
      } catch (error) {
        console.error("Error loading reports with suburbs:", error);
        setHeatData([]);
        setSuburbs([]);
        setTotalReports(0);
        setUniqueSuburbCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchReportsWithSuburbs();
  }, [selectedType]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 md:p-12 font-sans text-gray-800">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900">
        {selectedType} Heatmap
      </h1>

      {/* Filter */}
      <div className="max-w-sm mx-auto mb-8">
        <label
          htmlFor="typeFilter"
          className="block mb-3 text-lg font-semibold text-gray-700"
        >
          Filter by Report Type
        </label>
        <select
          id="typeFilter"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-5 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          disabled={loading}
        >
          {reportTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Loading or content */}
      {loading ? (
        <div className="flex justify-center items-center text-gray-600 space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
          <span>Loading data...</span>
        </div>
      ) : heatData.length > 0 ? (
        <>
          {/* Stats */}
          <div className="max-w-4xl mx-auto mb-6 p-5 bg-white rounded-xl shadow-md flex justify-around text-center space-x-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-gray-500">
                Total Reports
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {totalReports.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-gray-500">
                Unique Suburbs
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {uniqueSuburbCount}
              </p>
            </div>
          </div>

          {/* Heatmap */}
          <div className="max-w-6xl mx-auto rounded-xl overflow-hidden shadow-lg border border-gray-300 mb-10 bg-white">
            <HeatmapComponent data={heatData} />
          </div>

          {/* Suburb List */}
          <section className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">
              Affected Suburbs ({suburbs.length})
            </h2>
            {suburbs.length > 0 ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suburbs
                    .sort((a, b) => b.count - a.count)
                    .map((suburb) => (
                      <div
                        key={suburb.name}
                        className="flex justify-between items-center border-b border-gray-200 pb-3 last:border-b-0"
                      >
                        <span className="text-base font-medium text-gray-800 truncate pr-2">
                          {suburb.name}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-semibold select-none">
                          {suburb.count}{" "}
                          {suburb.count === 1 ? "report" : "reports"}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Top 3 highlight */}
                <div className="mt-8 pt-6 border-t border-gray-300">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Most Affected Areas:
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {suburbs
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 3)
                      .map((suburb, index) => (
                        <div
                          key={suburb.name}
                          className={`px-4 py-2 rounded-full text-sm font-medium select-none ${
                            index === 0
                              ? "bg-red-100 text-red-800"
                              : index === 1
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          #{index + 1} {suburb.name} ({suburb.count})
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No suburb data available.
              </p>
            )}
          </section>

          {/* Bar Chart */}
          {suburbs.length > 0 && (
            <section className="max-w-6xl mx-auto mt-12">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                Top Suburbs by Report Count
              </h2>
              <div className="w-full h-80 bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={suburbs
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 10)}
                    margin={{ top: 20, right: 20, left: 10, bottom: 70 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={60}
                      tick={{ fontSize: 13, fill: "#444" }}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: "#444" }} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.1)" }}
                      formatter={(value: number) => [
                        `${value} report${value !== 1 ? "s" : ""}`,
                        "Reports",
                      ]}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="text-center text-gray-600 mt-12 text-lg">
          No data available for the selected report type.
        </div>
      )}
    </div>
  );
}
