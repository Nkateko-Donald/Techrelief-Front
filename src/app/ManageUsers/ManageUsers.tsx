"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SleepModal from "@/components/SleepModal";
import { usePathname } from "next/navigation"; // Correct import
import MisuseDetailsModal from "@/components/MisuseDetailsModal"; // New component
import FlagDetailsModal from "@/components/FlagDetailsModal"; // New component
//import { useLocation } from "react-router-dom";

interface CommunityMember {
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber: string;
  requests: number;
  responses: number;
  isActive: boolean;
  Role: string;
  flagCount: number;
  misuseCount: number; // New property
}

const CommunityMemberManagement = () => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showMisuseModal, setShowMisuseModal] = useState(false); // New state
  const [showFlagModal, setShowFlagModal] = useState(false); // New state
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(
    null
  );
  const [selectedMisuses, setSelectedMisuses] = useState<any[]>([]); // New state
  const [selectedFlags, setSelectedFlags] = useState<any[]>([]); // New state
  const [sortBy, setSortBy] = useState<
    "ID" | "Name" | "Responses" | "Flags" | "Misuses"
  >("ID");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const pathname = usePathname(); // Use this hook instead
  const isManageUsersPage = pathname === "/ManageUsers";

  const BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://myappapi-yo3p.onrender.com";

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching volunteers...");
      const volunteersRes = await fetch(`${BASE}/api/volunteers`);

      if (!volunteersRes.ok) {
        throw new Error("Failed to fetch volunteers");
      }

      const volunteersData = await volunteersRes.json();

      console.log("Fetching flag counts...");
      const flagRes = await fetch(`${BASE}/api/flags/counts`);
      const flagCountsData = flagRes.ok ? await flagRes.json() : {};

      console.log("Fetching misuse counts...");
      const misuseRes = await fetch(`${BASE}/api/misuses/counts`);
      const misuseCountsData = misuseRes.ok ? await misuseRes.json() : {};

      if (
        !volunteersData.volunteers ||
        !Array.isArray(volunteersData.volunteers)
      ) {
        throw new Error("Invalid volunteers data format");
      }

      const updatedVolunteers = volunteersData.volunteers.map(
        (volunteer: CommunityMember) => ({
          ...volunteer,
          flagCount: flagCountsData[volunteer.UserID.toString()] || 0,
          misuseCount: misuseCountsData[volunteer.UserID.toString()] || 0, // Add misuse count
        })
      );

      setMembers(updatedVolunteers);
    } catch (err: any) {
      console.error("Error fetching volunteers:", err);
      setError(err.message || "Failed to load community members");
    } finally {
      setLoading(false);
    }
  };

  // New function to handle opening misuse modal
  const handleOpenMisuseModal = async (userId: number) => {
    try {
      const response = await fetch(`${BASE}/api/misuses/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch misuse details");

      const misuses = await response.json();
      setSelectedMisuses(misuses);
      setShowMisuseModal(true);
    } catch (err) {
      console.error("Error fetching misuses:", err);
      setError("Failed to load misuse details");
    }
  };

  // Update the handleOpenFlagModal function
  const handleOpenFlagModal = async (userId: number) => {
    try {
      const response = await fetch(`${BASE}/api/flags/user/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch flag details");
      }
      const flags = await response.json();
      setSelectedFlags(flags);
      setShowFlagModal(true);
    } catch (err) {
      console.error("Error fetching flags:", err);
      setError("Failed to load flag details");
    }
  };

  //handle sleep
  const handleSleepUser = async (
    userId: number,
    durationHours: number,
    sleepType: string
  ) => {
    try {
      const response = await fetch(`${BASE}/api/sleep`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId,
          durationHours,
          sleepType, // Add this new parameter
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to put user to sleep");
      }

      setMembers(
        members.map((member) =>
          member.UserID === userId ? { ...member, isActive: false } : member
        )
      );

      setShowSleepModal(false);
    } catch (err: any) {
      console.error("Error putting user to sleep:", err);
      setError(err.message || "Failed to put user to sleep");
    }
  };

  // Add this useEffect hook in your component
  /*useEffect(() => {
    const checkSleepStatus = async () => {
      try {
        const response = await fetch(`${BASE}/api/sleep/check-expired`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          console.error("Failed to check sleep status");
        }
      } catch (err) {
        console.error("Error checking sleep status:", err);
      }
    };

    // Check sleep status on page load
    checkSleepStatus();

    // Optional: Set up periodic checks (every 5 minutes)
    const interval = setInterval(checkSleepStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);*/

  const sortedMembers = [...members].sort((a, b) => {
    if (sortBy === "Name") {
      return a.FullName.localeCompare(b.FullName);
    }
    if (sortBy === "Responses") {
      return b.responses - a.responses;
    }
    if (sortBy === "Flags") {
      return b.flagCount - a.flagCount;
    }
    if (sortBy === "Misuses") {
      // New sort option
      return b.misuseCount - a.misuseCount;
    }
    return a.UserID - b.UserID;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedMembers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(members.length / itemsPerPage);

  useEffect(() => {
    if (isManageUsersPage && currentUser?.UserID) {
      fetchVolunteers();
    }
  }, [currentUser, isManageUsersPage]);

  const getFlagIcon = (flagCount: number) => {
    if (flagCount === 0) return { icon: "fas fa-shield-alt", color: "#28a745" };
    if (flagCount <= 2) return { icon: "fas fa-flag", color: "#ffc107" };
    if (flagCount <= 5)
      return { icon: "fas fa-exclamation-triangle", color: "#fd7e14" };
    return { icon: "fas fa-ban", color: "#dc3545" };
  };
  const getMisuseIcon = (misuseCount: number) => {
    if (misuseCount === 0)
      return { icon: "fas fa-check-circle", color: "#28a745" };
    if (misuseCount <= 2)
      return { icon: "fas fa-exclamation-circle", color: "#ffc107" };
    if (misuseCount <= 5) return { icon: "fas fa-radiation", color: "#fd7e14" };
    return { icon: "fas fa-skull-crossbones", color: "#dc3545" };
  };

  if (loading) {
    return (
      <div className="page-inner">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            minHeight: "400px",
            background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div className="text-center">
            <div
              className="spinner-border mb-3"
              role="status"
              style={{
                width: "3rem",
                height: "3rem",
                borderColor: "rgba(255,255,255,0.3)",
                borderTopColor: "white",
              }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="fw-light">Loading community members...</h5>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-inner">
        <div
          className="alert alert-danger border-0 shadow-sm"
          style={{ borderRadius: "12px" }}
        >
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-circle fs-4 me-3 text-danger"></i>
            <div className="flex-grow-1">
              <h6 className="mb-1 fw-semibold">Error Loading Data</h6>
              <p className="mb-0 text-muted">{error}</p>
            </div>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={fetchVolunteers}
              style={{ borderRadius: "8px" }}
            >
              <i className="fas fa-sync me-1"></i> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-inner">
      <div
        className="card border-0 shadow-lg"
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
        }}
      >
        {/* Enhanced Header */}
        <div
          className="card-header border-0 py-4"
          style={{
            //background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="mb-1 fw-bold">
                <i className="fas fa-users me-2"></i>
                Community Management
              </h3>
              <p className="mb-0 opacity-75 small">
                Manage and monitor community members
              </p>
            </div>

            <div className="d-flex gap-3 align-items-center">
              {/* Stats Cards */}
              <div className="d-flex gap-2">
                <div
                  className="bg-purple-600 bg-opacity-20 px-3 py-2 rounded-pill"
                  style={{ backdropFilter: "blur(10px)" }}
                >
                  <small className="fw-semibold">
                    <i className="fas fa-user-check me-1"></i>
                    {members.filter((m) => m.isActive).length} Active
                  </small>
                </div>
                <div
                  className="bg-purple-700 bg-opacity-20 px-3 py-2 rounded-pill"
                  style={{ backdropFilter: "blur(10px)" }}
                >
                  <small className="fw-semibold">
                    <i className="fas fa-flag me-1"></i>
                    {members.reduce((sum, m) => sum + m.flagCount, 0)} Flags
                  </small>
                </div>
              </div>

              {/* Enhanced Dropdown */}
              <div className="dropdown position-relative ">
                <button
                  className="btn btn-red btn-sm dropdown-toggle shadow-sm fw-semibold"
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-expanded={isDropdownOpen}
                  style={{
                    background: "#ff0000",
                    borderRadius: "10px",
                    border: "none",
                    padding: "8px 16px",
                  }}
                >
                  <i className="fas fa-sort me-1"></i>
                  Sort by: {sortBy}
                </button>
                <ul
                  className={`dropdown-menu shadow-lg border-0 ${
                    isDropdownOpen ? "show" : ""
                  }`}
                  style={{
                    position: "absolute",
                    inset: "0px auto auto 0px",
                    margin: "0px",
                    transform: "translate(0px, 40px)",
                    display: isDropdownOpen ? "block" : "none",
                    zIndex: 1000,
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {["Name", "Responses", "ID", "Flags", "Misuses"].map(
                    (option) => (
                      <li key={option}>
                        <button
                          className="dropdown-item d-flex align-items-center py-2"
                          onClick={() => {
                            setSortBy(option as any);
                            setIsDropdownOpen(false);
                          }}
                          style={{ transition: "all 0.2s ease" }}
                        >
                          <i
                            className={`fas fa-${
                              option === "Name"
                                ? "user"
                                : option === "Responses"
                                ? "reply"
                                : option === "ID"
                                ? "hashtag"
                                : option === "Flags"
                                ? "flag"
                                : "exclamation"
                            } me-2 text-muted`}
                          ></i>
                          {option}
                        </button>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0" style={{ fontSize: "0.95rem" }}>
              {/* Updated Table Header */}
              <thead
                style={{
                  background: "#f8f9fa",
                  borderBottom: "2px solid #dee2e6",
                }}
              >
                <tr>
                  <th className="fw-bold text-dark py-3 px-4">
                    <i className="fas fa-user me-2 text-primary"></i>Name
                  </th>
                  <th className="fw-bold text-dark py-3">
                    <i className="fas fa-envelope me-2 text-info"></i>Email
                  </th>
                  {/* Removed PhoneNumber column */}
                  <th className="fw-bold text-dark py-3 text-center">
                    <i className="fas fa-paper-plane me-2 text-warning"></i>
                    Requests
                  </th>
                  <th className="fw-bold text-dark py-3 text-center">
                    <i className="fas fa-reply me-2 text-primary"></i>Responses
                  </th>
                  <th className="fw-bold text-dark py-3 text-center">
                    <i className="fas fa-flag me-2 text-danger"></i>Flags
                  </th>
                  {/* New Misuse Count column */}
                  <th className="fw-bold text-dark py-3 text-center">
                    <i className="fas fa-exclamation-circle me-2 text-purple"></i>
                    Misuses
                  </th>
                  <th className="fw-bold text-dark py-3 text-center">
                    <i className="fas fa-circle me-2 text-success"></i>Status
                  </th>
                  <th className="fw-bold text-dark py-3 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="text-muted">
                        <i className="fas fa-users fs-1 mb-3 d-block opacity-25"></i>
                        <h6 className="fw-light">No volunteers found</h6>
                        <small>
                          Try adjusting your filters or check back later
                        </small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((member, index) => {
                    const flagInfo = getFlagIcon(member.flagCount);
                    const misuseInfo = getMisuseIcon(member.misuseCount); // New function
                    return (
                      <tr
                        key={member.UserID}
                        className={
                          index % 2 === 0 ? "bg-light bg-opacity-25" : ""
                        }
                        style={{
                          transition: "all 0.2s ease",
                          borderLeft:
                            member.flagCount > 5
                              ? "4px solid #dc3545"
                              : member.flagCount > 2
                              ? "4px solid #fd7e14"
                              : member.flagCount > 0
                              ? "4px solid #ffc107"
                              : "4px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f1f3f4";
                          e.currentTarget.style.transform = "translateX(2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            index % 2 === 0
                              ? "rgba(248, 249, 250, 0.25)"
                              : "white";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{
                                width: "40px",
                                height: "40px",
                                background:
                                  "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
                                color: "white",
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                              }}
                            >
                              {member.FullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <a
                                href={`/User/${member.UserID}`}
                                className="text-decoration-none fw-semibold"
                                style={{
                                  color: "#495057",
                                  transition: "color 0.2s ease",
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  router.push(`/User?userID=${member.UserID}`);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = "#667eea";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = "#495057";
                                }}
                              >
                                {member.FullName}
                              </a>
                              <div className="small text-muted">
                                ID: #{member.UserID}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-muted">{member.Email}</div>
                        </td>
                        {/*<td className="py-3">
                          <span className="text-muted">
                            {member.PhoneNumber || (
                              <span className="text-muted fst-italic">
                                <i className="fas fa-minus me-1"></i>Not
                                provided
                              </span>
                            )}
                          </span>
                        </td>*/}
                        <td className="py-3 text-center">
                          <span
                            className="badge bg-white bg-opacity-10 text-warning border border-warning"
                            style={{
                              fontSize: "0.85rem",
                              padding: "6px 12px",
                              borderRadius: "20px",
                            }}
                          >
                            {member.requests}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className="badge bg-white bg-opacity-10 text-primary border border-primary"
                            style={{
                              fontSize: "0.85rem",
                              padding: "6px 12px",
                              borderRadius: "20px",
                            }}
                          >
                            {member.responses}
                          </span>
                        </td>
                        {/* Flag Count cell - now clickable */}
                        <td className="py-3 text-center">
                          <button
                            className="btn btn-link p-0"
                            onClick={() => handleOpenFlagModal(member.UserID)}
                            disabled={member.flagCount === 0}
                          >
                            <div className="d-flex align-items-center justify-content-center">
                              <i
                                className={`${flagInfo.icon} me-2`}
                                style={{
                                  color: flagInfo.color,
                                  fontSize: "1.1rem",
                                }}
                              ></i>
                              <span
                                className="badge fw-semibold"
                                style={{
                                  backgroundColor:
                                    member.flagCount > 0
                                      ? flagInfo.color
                                      : "#6c757d",
                                  color: "white",
                                  fontSize: "0.85rem",
                                  padding: "6px 10px",
                                  borderRadius: "15px",
                                  minWidth: "30px",
                                }}
                              >
                                {member.flagCount}
                              </span>
                            </div>
                          </button>
                        </td>

                        {/* New Misuse Count cell */}
                        <td className="py-3 text-center">
                          <button
                            className="btn btn-link p-0"
                            onClick={() => handleOpenMisuseModal(member.UserID)}
                            disabled={member.misuseCount === 0}
                          >
                            <div className="d-flex align-items-center justify-content-center">
                              <i
                                className={`${misuseInfo.icon} me-2`}
                                style={{ color: misuseInfo.color }}
                              ></i>
                              <span
                                className="badge fw-semibold"
                                style={{
                                  backgroundColor:
                                    member.misuseCount > 0
                                      ? misuseInfo.color
                                      : "#6c757d",
                                  color: "white",
                                }}
                              >
                                {member.misuseCount}
                              </span>
                            </div>
                          </button>
                        </td>
                        <td className="py-3 text-center">
                          <div className="d-flex align-items-center justify-content-center">
                            <div
                              className="rounded-circle me-2"
                              style={{
                                width: "12px",
                                height: "12px",
                                background: member.isActive
                                  ? "linear-gradient(45deg, #28a745, #20c997)"
                                  : "linear-gradient(45deg, #dc3545, #e74c3c)",
                                boxShadow: `0 0 0 3px ${
                                  member.isActive ? "#28a74520" : "#dc354520"
                                }`,
                              }}
                            ></div>
                            <span
                              className={`fw-semibold small ${
                                member.isActive ? "text-success" : "text-danger"
                              }`}
                            >
                              {member.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            className={`btn btn-sm fw-semibold ${
                              member.isActive
                                ? "btn-outline-danger"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() => {
                              setSelectedMember(member);
                              setShowSleepModal(true);
                            }}
                            disabled={!member.isActive}
                            style={{
                              borderRadius: "20px",
                              padding: "6px 16px",
                              transition: "all 0.2s ease",
                              minWidth: "90px",
                            }}
                            onMouseEnter={(e) => {
                              if (member.isActive) {
                                e.currentTarget.style.transform =
                                  "translateY(-1px)";
                                e.currentTarget.style.boxShadow =
                                  "0 4px 8px rgba(220, 53, 69, 0.3)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <i
                              className={`fas ${
                                member.isActive ? "fa-moon" : "fa-zzz"
                              } me-1`}
                            ></i>
                            {member.isActive ? "Sleep" : "Sleeping"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Pagination */}
        <div
          className="card-footer border-0 py-4"
          style={{ background: "#f8f9fa" }}
        >
          <nav aria-label="Page navigation">
            <ul className="pagination justify-content-center mb-3">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link border-0 fw-semibold"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    borderRadius: "8px 0 0 8px",
                    background: currentPage === 1 ? "#e9ecef" : "white",
                    color: currentPage === 1 ? "#6c757d" : "#f00000",
                  }}
                >
                  <i className="fas fa-angle-double-left me-1"></i>First
                </button>
              </li>

              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link border-0 fw-semibold"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  style={{
                    background: currentPage === 1 ? "#e9ecef" : "white",
                    color: currentPage === 1 ? "#6c757d" : "#f00000",
                  }}
                >
                  <i className="fas fa-angle-left me-1"></i>Previous
                </button>
              </li>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page =
                  Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (page > totalPages) return null;

                return (
                  <li
                    key={page}
                    className={`page-item ${
                      currentPage === page ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link border-0 fw-semibold"
                      onClick={() => setCurrentPage(page)}
                      style={{
                        background:
                          currentPage === page
                            ? "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)"
                            : "white",
                        color: currentPage === page ? "white" : "#f00000",
                        minWidth: "45px",
                      }}
                    >
                      {page}
                    </button>
                  </li>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <li className="page-item disabled">
                  <span className="page-link border-0 bg-white text-muted">
                    ...
                  </span>
                </li>
              )}

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link border-0 fw-semibold"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  style={{
                    background:
                      currentPage === totalPages ? "#e9ecef" : "white",
                    color: currentPage === totalPages ? "#6c757d" : "#f00000",
                  }}
                >
                  Next<i className="fas fa-angle-right ms-1"></i>
                </button>
              </li>

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link border-0 fw-semibold"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    borderRadius: "0 8px 8px 0",
                    background:
                      currentPage === totalPages ? "#e9ecef" : "white",
                    color: currentPage === totalPages ? "#6c757d" : "#f00000",
                  }}
                >
                  Last<i className="fas fa-angle-double-right ms-1"></i>
                </button>
              </li>
            </ul>
          </nav>

          <div
            className="text-center small"
            style={{
              background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: "600",
            }}
          >
            <i className="fas fa-info-circle me-1"></i>
            Page {currentPage} of {totalPages} • {members.length} total members
            •{members.filter((m) => m.isActive).length} active •
            {members.filter((m) => m.flagCount > 0).length} flagged
          </div>
        </div>
      </div>

      {/* New Modals */}
      {showMisuseModal && (
        <MisuseDetailsModal
          misuses={selectedMisuses}
          onClose={() => setShowMisuseModal(false)}
        />
      )}

      {showFlagModal && (
        <FlagDetailsModal
          flags={selectedFlags}
          onClose={() => setShowFlagModal(false)}
        />
      )}

      {/* Sleep Modal */}
      {showSleepModal && selectedMember && (
        <SleepModal
          member={selectedMember}
          onClose={() => setShowSleepModal(false)}
          onSleep={(
            duration,
            sleepType // Add sleepType parameter
          ) => handleSleepUser(selectedMember.UserID, duration, sleepType)}
        />
      )}
    </div>
  );
};

export default CommunityMemberManagement;
