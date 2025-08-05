"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Share2,
  CheckCircle,
  MapPin,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

interface Report {
  ReportID: number;
  EmergencyType: string;
  EmerDescription: string;
  MediaPhoto: string;
  MediaVoice: string;
  SharedWith: string;
  Report_Location: string;
  Report_Status: string;
  ReporterID: number;
  Report_CreatedAt?: string;
}

interface Reporter {
  FullName: string;
  Email: string;
  Username: string;
  PhoneNumber: string;
  UserType: string;
  ProfilePhoto: string | null;
}

interface AddressResult {
  success: boolean;
  address?: string;
  error?: string;
}

async function getAddressFromCoords(
  lat: number,
  lng: number
): Promise<AddressResult> {
  try {
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return {
        success: false,
        error: "Invalid coordinates",
      };
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      {
        headers: {
          "User-Agent": "EmergencyReportApp/1.0 (emergency-report@example.com)",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
      return {
        success: true,
        address: data.display_name,
      };
    } else if (data && data.error) {
      return {
        success: false,
        error: data.error,
      };
    } else {
      return {
        success: false,
        error: "No address found for these coordinates",
      };
    }
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch address",
    };
  }
}

function AudioPlayer({
  base64String,
  index,
}: {
  base64String: string;
  index: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null
  );

  useEffect(() => {
    if (!base64String) {
      setError("No audio data available");
      setIsLoading(false);
      return;
    }

    const handleAudioProcessing = async () => {
      try {
        // Clean base64 string
        const cleanBase64 = base64String.replace(
          /^data:audio\/\w+;base64,/,
          ""
        );

        // Convert to Blob
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "audio/mpeg" });

        // Try File System Access API
        if ("showSaveFilePicker" in window) {
          try {
            // Save file to local storage
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: `emergency-recording-${index}.mp3`,
              types: [
                {
                  description: "Audio Files",
                  accept: { "audio/mpeg": [".mp3"] },
                },
              ],
            });

            // Create writable stream and write the blob
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();

            // Get the file back for playback
            const file = await handle.getFile();
            const url = URL.createObjectURL(file);

            setLocalAudioUrl(url);
            setFileHandle(handle);
          } catch (saveError) {
            console.warn("File System Access API error:", saveError);
            fallbackToMemoryPlayback(blob);
          }
        } else {
          fallbackToMemoryPlayback(blob);
        }
      } catch (err) {
        setError("Failed to process audio");
        console.error("Audio processing error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const fallbackToMemoryPlayback = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      setLocalAudioUrl(url);

      // Auto-download as fallback
      const a = document.createElement("a");
      a.href = url;
      a.download = `emergency-recording-${index}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    handleAudioProcessing();

    return () => {
      if (localAudioUrl) URL.revokeObjectURL(localAudioUrl);
    };
  }, [base64String, index]);

  const handlePlay = async () => {
    if (!audioRef.current) return;

    try {
      // If we have a file handle, verify we can access it
      if (fileHandle) {
        try {
          // Get fresh file reference in case it changed
          const file = await fileHandle.getFile();
          const url = URL.createObjectURL(file);
          setLocalAudioUrl(url);
          audioRef.current.src = url;
        } catch (accessError) {
          console.warn("Couldn't access saved file:", accessError);
          setError(
            "Couldn't access saved audio file. Please try playing again."
          );
          return;
        }
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      setError("Playback failed. Please allow audio playback.");
      console.error("Playback error:", err);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 text-sm">Setting up audio player...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">
            🎙️ Recording {index + 1}
          </span>
          {fileHandle && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Saved Locally
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center gap-2"
              disabled={!localAudioUrl}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Play
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Pause
            </button>
          )}
        </div>
      </div>

      {/* Audio element */}
      {localAudioUrl && (
        <div className="mt-2">
          <audio
            ref={audioRef}
            src={localAudioUrl}
            controls
            className="w-full"
            onEnded={() => setIsPlaying(false)}
          >
            Your browser does not support the audio element.
          </audio>
          <div className="text-xs text-gray-500 mt-1">
            {fileHandle
              ? "Playing from your local storage"
              : "Playing from temporary memory (file saved to downloads)"}
          </div>
        </div>
      )}
    </div>
  );
}

function LocationDisplay({ location }: { location: string }) {
  const [resolvedAddress, setResolvedAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!location || (!location.includes(",") && !location.includes(";"))) {
      setError("Invalid location format");
      return;
    }

    const parseAndResolveLocation = async () => {
      setIsLoading(true);
      setError("");

      try {
        const separator = location.includes(";") ? ";" : ",";
        const [latStr, lngStr] = location.split(separator).map((s) => s.trim());
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (isNaN(lat) || isNaN(lng)) {
          throw new Error("Invalid coordinates");
        }

        setCoordinates({ lat, lng });

        const result = await getAddressFromCoords(lat, lng);

        if (result.success && result.address) {
          setResolvedAddress(result.address);
        } else {
          setError(result.error || "Failed to resolve address");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse location"
        );
      } finally {
        setIsLoading(false);
      }
    };

    parseAndResolveLocation();
  }, [location]);

  const openInMaps = () => {
    if (coordinates) {
      const mapsUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      window.open(mapsUrl, "_blank");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-100 rounded-full">
          <MapPin className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-gray-600">Resolving address...</span>
            </div>
          ) : error ? (
            <div>
              <p className="text-red-600 text-sm mb-1">{error}</p>
              <p className="text-gray-500 text-sm">
                Raw coordinates: {location}
              </p>
            </div>
          ) : resolvedAddress ? (
            <div>
              <p className="text-gray-800 font-medium">{resolvedAddress}</p>
            </div>
          ) : (
            <p className="text-gray-600">No address available</p>
          )}
        </div>
      </div>

      {coordinates && (
        <button
          onClick={openInMaps}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Open in Google Maps
        </button>
      )}
    </div>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");
  const [report, setReport] = useState<Report | null>(null);
  const [reporter, setReporter] = useState<Reporter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!reportId) {
      setError("Missing report ID");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://myappapi-yo3p.onrender.com/getReportWithReporter?id=${reportId}`
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
          setReport(data.data.Report);
          setReporter(data.data.Reporter);
        } else {
          throw new Error(data.message || "Failed to fetch report data");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch report");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [reportId]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 text-lg">Loading emergency report...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md p-6 bg-red-50 rounded-xl border border-red-200 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Error Loading Report
          </h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  if (!report || !reporter)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
          <AlertTriangle className="w-10 h-10 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Data Found
          </h2>
          <p className="text-gray-600">
            The requested emergency report could not be found.
          </p>
        </div>
      </div>
    );

  const createdAt = report.Report_CreatedAt || new Date().toISOString();

  const statusConfig: Record<
    string,
    { color: string; icon: React.ReactNode; bgColor: string }
  > = {
    Pending: {
      color: "text-yellow-800",
      bgColor: "bg-yellow-100",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    "In Progress": {
      color: "text-blue-800",
      bgColor: "bg-blue-100",
      icon: <Clock className="w-5 h-5" />,
    },
    Resolved: {
      color: "text-green-800",
      bgColor: "bg-green-100",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
  };

  const urgencyLevels: Record<string, string> = {
    Fire: "High",
    Accident: "High",
    Theft: "Medium",
    Medical: "High",
    Other: "Low",
  };
  const urgencyColor: Record<string, string> = {
    High: "text-red-600",
    Medium: "text-yellow-600",
    Low: "text-green-600",
  };

  const status = report.Report_Status;
  const urgency = urgencyLevels[report.EmergencyType] || "Low";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            <span className="bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
              Emergency Report Details
            </span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Comprehensive information about the reported emergency situation
          </p>
        </header>

        {/* Emergency Details Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mb-8">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-red-50 to-blue-50 px-6 py-5 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Emergency Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    ID: #{report.ReportID}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-colors">
                  <CheckCircle className="w-5 h-5" />
                  <span>Mark Resolved</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Details */}
              <div className="space-y-6">
                {/* Emergency Type */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Emergency Type
                  </h3>
                  <p className="text-lg font-semibold text-gray-800">
                    {report.EmergencyType}
                  </p>
                </div>

                {/* Status and Urgency */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Status
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[status]?.color} ${statusConfig[status]?.bgColor}`}
                      >
                        {statusConfig[status]?.icon}
                        <span className="ml-1">{status}</span>
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Urgency
                    </h3>
                    <p
                      className={`text-lg font-semibold ${urgencyColor[urgency]}`}
                    >
                      {urgency}
                    </p>
                  </div>
                </div>

                {/* Reported Time */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Reported
                  </h3>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <time
                      title={new Date(createdAt).toLocaleString()}
                      className="text-gray-800"
                    >
                      {formatDistanceToNowStrict(new Date(createdAt), {
                        addSuffix: true,
                      })}
                    </time>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-800 whitespace-pre-line">
                    {report.EmerDescription}
                  </p>
                </div>

                {/* Location */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Location
                  </h3>
                  <LocationDisplay location={report.Report_Location} />
                </div>

                {/* Shared With */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Shared With
                  </h3>
                  <p className="text-gray-800">{report.SharedWith}</p>
                </div>

                {/* Contact Button */}
                {status === "Pending" && reporter?.PhoneNumber && (
                  <a
                    href={`tel:${reporter.PhoneNumber}`}
                    className="flex items-center justify-center gap-3 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    <PhoneCall className="w-5 h-5" />
                    <span>Contact Reporter Immediately</span>
                  </a>
                )}
              </div>

              {/* Right Column - Media */}
              <div className="space-y-6">
                {/* Photos */}
                {report.MediaPhoto && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Photo Evidence
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {report.MediaPhoto.split(";")
                        .filter(Boolean)
                        .map((img, idx) => (
                          <div
                            key={idx}
                            className="overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                          >
                            <Image
                              src={`data:image/jpeg;base64,${img}`}
                              alt={`Emergency photo ${idx + 1}`}
                              width={500}
                              height={300}
                              className="object-cover w-full h-48 hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Audio Recordings */}
                {report.MediaVoice && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                      Audio Recordings
                    </h3>
                    <div className="space-y-4">
                      {report.MediaVoice.split(";")
                        .filter(Boolean)
                        .map((audioData, index) => (
                          <AudioPlayer
                            key={index}
                            base64String={audioData}
                            index={index}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reporter Information Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Reporter Information
                </h2>
                <p className="text-sm text-gray-500">
                  Details about the person who reported this emergency
                </p>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                {reporter.ProfilePhoto ? (
                  <Image
                    src={
                      reporter.ProfilePhoto.startsWith("http")
                        ? reporter.ProfilePhoto
                        : `data:image/jpeg;base64,${reporter.ProfilePhoto}`
                    }
                    alt="profile"
                    width={160}
                    height={160}
                    className="rounded-xl border-4 border-white shadow-lg object-cover w-40 h-40"
                    unoptimized
                  />
                ) : (
                  <div className="w-40 h-40 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shadow-inner border border-gray-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Reporter Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-grow">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Full Name
                    </h3>
                    <p className="text-gray-800 font-medium">
                      {reporter.FullName}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Username
                    </h3>
                    <p className="text-gray-800">{reporter.Username}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="text-gray-800">{reporter.Email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Phone Number
                    </h3>
                    <p className="text-gray-800">{reporter.PhoneNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      User Type
                    </h3>
                    <p className="text-gray-800">{reporter.UserType}</p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={`tel:${reporter.PhoneNumber}`}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                    >
                      <PhoneCall className="w-5 h-5" />
                      Call Reporter
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">Loading emergency report...</p>
          </div>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
