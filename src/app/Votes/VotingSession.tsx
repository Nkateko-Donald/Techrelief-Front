"use client";

import React, { useState, useEffect, useMemo } from "react";

// Define types based on the database tables
type User = {
  UserID: number;
  FullName: string;
  Email: string;
  ProfilePhoto?: string;
};

type Nomination = {
  NominationID: number;
  NomineeID: number;
  NominatedBy: number;
  Status: "Pending" | "Accepted" | "Rejected";
  NominatedAt: string;
  RespondedAt?: string;
  Message?: string;
  VoteCount: number;
};

type Vote = {
  VoteID: number;
  VoterID: number;
  NomineeID: number;
  VotedAt: string;
};

type VotingSettings = {
  SettingID?: number;
  VotingEnabled: boolean;
  StartDate: string;
  EndDate: string;
  UpdatedBy?: number;
  UpdatedAt?: string;
};

// Default profile icon component
const DefaultProfileIcon = ({ className = "w-12 h-12" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} text-gray-400`}
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
);

export default function VotingSessionPage() {
  const [votingSettings, setVotingSettings] = useState<VotingSettings>({
    VotingEnabled: false,
    StartDate: new Date().toISOString(),
    EndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState(1); // Replace with actual user ID from auth
  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch voting settings
        const settingsRes = await fetch(
          "https://myappapi-yo3p.onrender.com/api/voting-settings"
        );
        const settingsData = await settingsRes.json();
        setVotingSettings(settingsData);

        // Fetch nominations
        const nominationsRes = await fetch(
          "https://myappapi-yo3p.onrender.com/api/nominations"
        );
        const nominationsData = await nominationsRes.json();
        setNominations(nominationsData);

        // Fetch votes
        const votesRes = await fetch(
          "https://myappapi-yo3p.onrender.com/api/votes"
        );
        const votesData = await votesRes.json();
        setVotes(votesData);

        // Fetch users
        const usersRes = await fetch(
          "https://myappapi-yo3p.onrender.com/api/users-minimal"
        );
        const usersData = await usersRes.json();
        setUsers(usersData);

        // Fetch vote counts
        /*const countsRes = await fetch(
          "https://myappapi-yo3p.onrender.com/api/votes/count"
        );
        const countsData = await countsRes.json();
        setVoteCounts(countsData);*/
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle voting session
  const toggleVotingSession = async () => {
    const newSettings = {
      ...votingSettings,
      VotingEnabled: !votingSettings.VotingEnabled,
      UpdatedBy: currentUserId,
    };

    try {
      const response = await fetch("/api/voting-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setVotingSettings(newSettings);
        }
      }
    } catch (error) {
      console.error("Error updating voting settings:", error);
    }
  };

  // Update voting dates
  const updateVotingDates = async (start: Date, end: Date) => {
    const newSettings = {
      ...votingSettings,
      StartDate: start.toISOString(),
      EndDate: end.toISOString(),
      UpdatedBy: currentUserId,
    };

    try {
      const response = await fetch("/api/voting-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setVotingSettings(newSettings);
        }
      }
    } catch (error) {
      console.error("Error updating voting dates:", error);
    }
  };

  // Get user by ID
  const getUserById = (id: number) => {
    return users.find((user) => user.UserID === id);
  };

  // Get vote count for a nominee
  /*const getVoteCount = (nomineeId: number) => {
    return voteCounts[nomineeId] || 0;
  };*/

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Nomination details modal
  const NominationDetailsModal = ({
    nomination,
    onClose,
  }: {
    nomination: Nomination;
    onClose: () => void;
  }) => {
    const nominee = getUserById(nomination.NomineeID);
    const nominator = getUserById(nomination.NominatedBy);

    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="bg-white rounded-xl shadow-lg max-w-lg w-full">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Nomination Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center mb-6">
              <div className="relative">
                {nominee?.ProfilePhoto ? (
                  <img
                    src={nominee.ProfilePhoto}
                    alt={nominee.FullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <DefaultProfileIcon className="w-16 h-16" />
                )}
                <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-gray-800">{nominee?.FullName}</h3>
                <p className="text-sm text-gray-600">
                  Nominated by {nominator?.FullName}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">
                Nomination Message
              </h4>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {nomination.Message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Status</h4>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    nomination.Status === "Accepted"
                      ? "bg-green-100 text-green-800"
                      : nomination.Status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {nomination.Status}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">
                  Votes Received
                </h4>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-purple-600 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  <span className="text-gray-700 font-medium">
                    {nomination.VoteCount} votes
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Nominated At</h4>
                <p className="text-gray-600">
                  {formatDate(nomination.NominatedAt)}
                </p>
              </div>
              {nomination.RespondedAt && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">
                    Responded At
                  </h4>
                  <p className="text-gray-600">
                    {formatDate(nomination.RespondedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 rounded-b-xl flex justify-end">
            <button
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="page-inner">
      {selectedNomination && (
        <NominationDetailsModal
          nomination={selectedNomination}
          onClose={() => setSelectedNomination(null)}
        />
      )}

      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          borderRadius: "12px",
          background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
          padding: "1rem",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Voting Session Manager
                </h1>
                <p className="text-gray-600 mt-1">
                  Control and monitor ongoing voting sessions
                </p>
              </div>
              <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-medium">
                {votingSettings.VotingEnabled ? (
                  <span className="flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    Voting Active
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="h-2 w-2 bg-gray-500 rounded-full mr-2"></span>
                    Voting Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Voting Settings Card */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6 mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Session Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Status</h3>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={votingSettings.VotingEnabled}
                        onChange={toggleVotingSession}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                    <span className="ml-3 text-gray-700">
                      {votingSettings.VotingEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Start Date</h3>
                  <div className="text-gray-800 font-medium">
                    {formatDate(votingSettings.StartDate)}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700 mb-2">End Date</h3>
                  <div className="text-gray-800 font-medium">
                    {formatDate(votingSettings.EndDate)}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => {
                    const start = new Date();
                    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    updateVotingDates(start, end);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Set 1 Week Session
                </button>

                <button
                  onClick={() => {
                    const start = new Date();
                    const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    updateVotingDates(start, end);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg transition flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Set 24-Hour Session
                </button>

                <button
                  onClick={() => toggleVotingSession()}
                  className={`${
                    votingSettings.VotingEnabled
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white px-5 py-2 rounded-lg transition flex items-center`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    {votingSettings.VotingEnabled ? (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                  {votingSettings.VotingEnabled
                    ? "Stop Voting"
                    : "Start Voting"}
                </button>
              </div>
            </div>

            {/* Nominations Section */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Nominations</h2>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {nominations.length} nominations
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {nominations.map((nomination) => {
                  const nominee = getUserById(nomination.NomineeID);
                  const nominator = getUserById(nomination.NominatedBy);

                  return (
                    <div
                      key={nomination.NominationID}
                      className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden transition-transform hover:scale-[1.02]"
                    >
                      <div
                        className={`p-4 ${
                          nomination.Status === "Accepted"
                            ? "bg-green-50"
                            : nomination.Status === "Rejected"
                            ? "bg-red-50"
                            : "bg-yellow-50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="relative">
                              {nominee?.ProfilePhoto ? (
                                <img
                                  src={nominee.ProfilePhoto}
                                  alt={nominee.FullName}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                                />
                              ) : (
                                <DefaultProfileIcon />
                              )}
                              <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full p-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <h3 className="font-bold text-gray-800">
                                {nominee?.FullName || "Unknown User"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Nominated by{" "}
                                {nominator?.FullName || "Unknown User"}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              nomination.Status === "Accepted"
                                ? "bg-green-100 text-green-800"
                                : nomination.Status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {nomination.Status}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-gray-700 mb-4">
                          {nomination.Message || "No message provided"}
                        </p>

                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>
                            Nominated: {formatDate(nomination.NominatedAt)}
                          </span>
                          {nomination.RespondedAt && (
                            <span>
                              Responded: {formatDate(nomination.RespondedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex justify-between items-center">
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-purple-600 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                          <span className="text-gray-700 font-medium">
                            {nomination.VoteCount} votes
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedNomination(nomination)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center"
                        >
                          View Details
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Votes Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Recent Votes
                </h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {votes.length} votes
                </span>
              </div>

              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Voter
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Nominee
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {votes.map((vote) => {
                      const voter = getUserById(vote.VoterID);
                      const nominee = getUserById(vote.NomineeID);

                      return (
                        <tr key={vote.VoteID} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {voter?.ProfilePhoto ? (
                                <img
                                  src={voter.ProfilePhoto}
                                  alt={voter.FullName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10">
                                  <DefaultProfileIcon className="w-10 h-10" />
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {voter?.FullName || "Unknown User"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {voter?.Email || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {nominee?.ProfilePhoto ? (
                                <img
                                  src={nominee.ProfilePhoto}
                                  alt={nominee.FullName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10">
                                  <DefaultProfileIcon className="w-10 h-10" />
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {nominee?.FullName || "Unknown User"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {nominee?.Email || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(vote.VotedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="text-center text-white/80 text-sm mt-4">
            Voting Session Manager • Last updated:{" "}
            {formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>
    </div>
  );
}
