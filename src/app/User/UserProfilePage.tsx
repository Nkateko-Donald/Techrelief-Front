"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";

interface User {
  UserID: number;
  FullName: string;
  Email: string;
  Username: string;
  PhoneNumber: string;
  Passcode: string;
  UserType: string;
  CreatedAt: string;
  ProfilePhoto: string | null;
}

interface Report {
  ReportID: number;
  EmergencyType: string;
  EmerDescription: string;
  Report_Location: string;
  Report_Status: string;
  CreatedAt: string;
}

const UserProfilePage = () => {
  const searchParams = useSearchParams();
  const userIDParam = searchParams.get("userID");
  const userID = userIDParam ? parseInt(userIDParam) : null;

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  useEffect(() => {
    if (!userID) {
      setError("Invalid or missing user ID in URL.");
      setUser(null);
      return;
    }

    async function fetchUser() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://myappapi-yo3p.onrender.com/user?userID=${userID}`
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load user data.");
          setUser(null);
        } else {
          setUser(data.User);
        }
      } catch (err) {
        setError("An unexpected error occurred.");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchReports() {
      setReportsLoading(true);
      setReportsError(null);
      try {
        const response = await fetch(
          `https://myappapi-yo3p.onrender.com/getReportsByUser?userID=${userID}`
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load reports.");
        }

        setReports(data.reports || []);
      } catch (err: any) {
        setReportsError(err.message || "An unexpected error occurred.");
      } finally {
        setReportsLoading(false);
      }
    }

    fetchUser();
    fetchReports();
  }, [userID]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Investigating":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "On-Going":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case "Fire":
        return "🔥";
      case "Crime":
        return "🚨";
      case "SOS":
        return "🚨";
      default:
        return "⚠️";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Profile
          </h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading user profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6 sm:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="group flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Back to Dashboard
              </span>
            </button>

            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                User Profile
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Detailed information and activity
              </p>
            </div>
          </div>

          <div className="relative bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-2xl overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500">
                    {user.ProfilePhoto ? (
                      <img
                        src={user.ProfilePhoto}
                        alt="Profile"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                        {user.FullName.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-20 pb-8 px-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {user.FullName}
              </h2>
              <p className="text-gray-500 text-lg mb-6">@{user.Username}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50">
                  <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-900 text-sm break-all">
                    {user.Email}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200/50">
                  <Phone className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-semibold text-gray-900">
                    {user.PhoneNumber || "N/A"}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50">
                  <Shield className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">User Type</p>
                  <span className="inline-flex items-center px-3 py-1 bg-purple-200 text-purple-800 text-sm font-semibold rounded-full">
                    {user.UserType}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200/50">
                  <Calendar className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Member Since</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(user.CreatedAt).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    Activity Reports
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Recent reports submitted by this user
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {reports.length}
                  </p>
                  <p className="text-sm text-gray-500">Total Reports</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {reportsLoading && (
                <p className="text-gray-500 text-center">Loading reports...</p>
              )}
              {reportsError && (
                <p className="text-red-500 text-center">{reportsError}</p>
              )}

              {reports.map((report) => (
                <div
                  key={report.ReportID}
                  className="group relative bg-white border border-gray-200/50 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        {getEmergencyIcon(report.EmergencyType)}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {report.EmergencyType}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Report #{report.ReportID}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                        report.Report_Status
                      )}`}
                    >
                      {report.Report_Status}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {report.EmerDescription}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span>{report.Report_Location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span>
                        {new Date(report.CreatedAt).toLocaleString("en-GB", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:via-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              ))}

              {reports.length === 0 && !reportsLoading && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📄</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    No Reports Yet
                  </h4>
                  <p className="text-gray-500">
                    This user hasn't submitted any reports.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
