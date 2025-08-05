"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faSort,
  faFilter,
  faCheck,
  faEye,
  faTimes,
  faEnvelope,
  faUserPlus,
  faUserMinus,
  faExclamationCircle,
  faCog,
} from "@fortawesome/free-solid-svg-icons";

type Notification = {
  id: number;
  title: string;
  body: string;
  createdAt: Date;
  seen: boolean;
  type: "info" | "warning" | "alert" | "system";
};

const notifications: Notification[] = [
  {
    id: 1,
    title: "New user registered",
    body: "A new user with username 'jsmith' has just registered. Please verify their account details and assign appropriate permissions.",
    createdAt: new Date("2025-06-20T14:30:00"),
    seen: false,
    type: "info",
  },
  {
    id: 2,
    title: "Account deregistered",
    body: "User 'adoe' has deregistered their account on 28 Mar, 2025. All associated data has been archived per company policy.",
    createdAt: new Date("2025-06-19T09:15:00"),
    seen: true,
    type: "info",
  },
  {
    id: 3,
    title: "System Maintenance Scheduled",
    body: "Planned system maintenance is scheduled for this Saturday from 2:00 AM to 6:00 AM. All services will be temporarily unavailable during this window.",
    createdAt: new Date("2025-06-18T16:45:00"),
    seen: false,
    type: "system",
  },
  {
    id: 4,
    title: "Security Alert: Unusual Activity",
    body: "We detected unusual login attempts on your account from a new device. If this was not you, please reset your password immediately.",
    createdAt: new Date("2025-06-17T11:20:00"),
    seen: false,
    type: "alert",
  },
  {
    id: 5,
    title: "Permission Change Request",
    body: "User 'mjones' has requested elevated permissions for the finance module. Action required: review and approve/deny.",
    createdAt: new Date("2025-06-16T09:30:00"),
    seen: true,
    type: "warning",
  },
  {
    id: 6,
    title: "New Message Received",
    body: "You have received a new message from 'admin@company.com' regarding quarterly reports. Please review at your earliest convenience.",
    createdAt: new Date("2025-06-15T14:15:00"),
    seen: true,
    type: "info",
  },
];

const NotificationTypeIcon = ({ type }: { type: Notification["type"] }) => {
  const iconMap = {
    info: faEnvelope,
    warning: faExclamationCircle,
    alert: faExclamationCircle,
    system: faCog,
  };

  const colorMap = {
    info: "text-blue-500",
    warning: "text-yellow-500",
    alert: "text-red-500",
    system: "text-purple-500",
  };

  return (
    <div className={`${colorMap[type]} text-lg`}>
      <FontAwesomeIcon icon={iconMap[type]} />
    </div>
  );
};

export default function NotificationsClient() {
  const [active, setActive] = useState<Notification | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filter, setFilter] = useState<"all" | Notification["type"]>("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const sorted = useMemo(() => {
    let filtered = [...notifications];

    if (filter !== "all") {
      filtered = filtered.filter((n) => n.type === filter);
    }

    return filtered.sort((a, b) => {
      if (sortOrder === "newest") {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
    });
  }, [sortOrder, filter]);

  const markAsRead = (id: number) => {
    // In a real app, this would update the backend
    const notification = notifications.find((n) => n.id === id);
    if (notification) notification.seen = true;
  };

  const markAllAsRead = () => {
    notifications.forEach((n) => (n.seen = true));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faBell}
                  className="text-white text-2xl mr-3"
                />
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
              </div>
              <span className="bg-red-500 bg-opacity-20 text-white px-3 py-1 rounded-full text-sm">
                {notifications.filter((n) => !n.seen).length} unread
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="relative">
                <button
                  className="flex items-center bg-purple-400 bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <FontAwesomeIcon icon={faSort} className="mr-2" />
                  Sort: {sortOrder === "newest" ? "Newest" : "Oldest"}
                </button>

                {dropdownOpen && (
                  <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg overflow-hidden">
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        sortOrder === "newest"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setSortOrder("newest");
                        setDropdownOpen(false);
                      }}
                    >
                      Newest first
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        sortOrder === "oldest"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setSortOrder("oldest");
                        setDropdownOpen(false);
                      }}
                    >
                      Oldest first
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  className="flex items-center bg-purple-400 bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <FontAwesomeIcon icon={faFilter} className="mr-2" />
                  Filter:{" "}
                  {filter === "all"
                    ? "All"
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>

                {filterOpen && (
                  <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg overflow-hidden">
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === "all"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilter("all");
                        setFilterOpen(false);
                      }}
                    >
                      All notifications
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === "info"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilter("info");
                        setFilterOpen(false);
                      }}
                    >
                      Information
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === "warning"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilter("warning");
                        setFilterOpen(false);
                      }}
                    >
                      Warnings
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === "alert"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilter("alert");
                        setFilterOpen(false);
                      }}
                    >
                      Alerts
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === "system"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilter("system");
                        setFilterOpen(false);
                      }}
                    >
                      System
                    </button>
                  </div>
                )}
              </div>

              <button
                className="flex items-center bg-purple-400 bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition"
                onClick={markAllAsRead}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Mark all as read
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="divide-y">
            {sorted.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-gray-400 mb-4">
                  <FontAwesomeIcon icon={faBell} size="3x" />
                </div>
                <p className="text-gray-500">No notifications found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try changing your filter settings
                </p>
              </div>
            ) : (
              sorted.map((n) => (
                <div
                  key={n.id}
                  className={`p-5 hover:bg-gray-50 transition ${
                    !n.seen ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex">
                    <div className="mr-4 mt-1">
                      <NotificationTypeIcon type={n.type} />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-gray-900">
                          {n.title}
                          {!n.seen && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                          )}
                        </h3>
                        <div className="text-sm text-gray-500">
                          {format(n.createdAt, "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>

                      <p className="mt-1 text-gray-600 text-sm line-clamp-2">
                        {n.body}
                      </p>

                      <div className="mt-3 flex space-x-3">
                        <button
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          onClick={() => setActive(n)}
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          View details
                        </button>

                        {!n.seen && (
                          <button
                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                            onClick={() => markAsRead(n.id)}
                          >
                            <FontAwesomeIcon icon={faCheck} className="mr-1" />
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {active && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <NotificationTypeIcon type={active.type} />
                  <h3 className="ml-3 text-lg font-semibold text-white">
                    {active.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="text-white hover:text-gray-200"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">{active.body}</p>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {format(active.createdAt, "MMM d, yyyy 'at' h:mm a")}
                </div>

                <div className="flex space-x-3">
                  {!active.seen && (
                    <button
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                      onClick={() => {
                        markAsRead(active.id);
                        setActive(null);
                      }}
                    >
                      <FontAwesomeIcon icon={faCheck} className="mr-1" />
                      Mark as read
                    </button>
                  )}
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    onClick={() => setActive(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
