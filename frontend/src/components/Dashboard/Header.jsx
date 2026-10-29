import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";

// =========================================================
// Storage helper
// =========================================================

function getStoredValue(key) {
  return (
    localStorage.getItem(key) ||
    sessionStorage.getItem(key) ||
    ""
  );
}

// =========================================================
// Header
// =========================================================

function Header({ onMenuClick }) {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  // =========================================================
  // Employee information
  // =========================================================

  const userName =
    getStoredValue("userName") ||
    getStoredValue("full_name") ||
    "User";

  const userEmail =
    getStoredValue("userEmail") ||
    getStoredValue("email") ||
    "user@company.com";

  const userRole =
    getStoredValue("userRole") ||
    getStoredValue("role") ||
    "Employee";

  const avatarLetter =
    userName.trim().charAt(0).toUpperCase() || "U";

  // =========================================================
  // Close dropdowns when clicking outside
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================================================
  // Logout
  // =========================================================

  const handleLogout = () => {
    const keys = [
      "isLoggedIn",
      "userEmail",
      "userName",
      "full_name",
      "email",
      "userRole",
      "role",
      "rememberMe",
      "employeeAccessToken",
      "access_token",
      "token",
    ];

    keys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    toast.success("Logged out successfully.");

    setTimeout(() => {
      navigate("/login");
    }, 500);
  };

  // =========================================================
  // Profile
  // =========================================================

  const openProfile = () => {
    setProfileOpen(false);
    navigate("/profile");
  };

  const openSettings = () => {
    setProfileOpen(false);
    navigate("/settings");
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <header
      className="
        sticky
        top-0
        z-30
        h-16
        border-b
        border-[#E5E5E5]
        bg-white
      "
    >
      <div
        className="
          flex
          h-full
          items-center
          justify-between
          px-4
          sm:px-6
        "
      >

        {/* =====================================================
            Left
        ===================================================== */}

        <div className="flex min-w-0 items-center gap-3">

          {/* Mobile menu */}

          <button
            type="button"
            onClick={onMenuClick}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-[#666666]
              transition-colors
              hover:bg-[#F9EDEF]
              hover:text-[#7A1F2B]
              lg:hidden
            "
            aria-label="Open sidebar"
          >
            <FaBars className="text-sm" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[#171717]">
              Dashboard
            </h1>

            <p className="hidden truncate text-[10px] text-[#888888] sm:block">
              Enterprise Knowledge Overview
            </p>
          </div>
        </div>

        {/* =====================================================
            Right
        ===================================================== */}

        <div className="flex shrink-0 items-center gap-2">

          {/* ===================================================
              Notifications
          =================================================== */}

          <div
            ref={notificationRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() =>
                setNotificationsOpen(
                  (previous) => !previous
                )
              }
              className="
                relative
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                text-[#666666]
                transition-colors
                hover:bg-[#F9EDEF]
                hover:text-[#7A1F2B]
              "
              aria-label="Notifications"
            >
              <FaBell className="text-xs" />

              <span
                className="
                  absolute
                  right-2
                  top-2
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#7A1F2B]
                "
              />
            </button>

            {/* Notification dropdown */}

            {notificationsOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-12
                  w-80
                  overflow-hidden
                  rounded-xl
                  border
                  border-[#E5E5E5]
                  bg-white
                  shadow-[0_10px_30px_rgba(0,0,0,0.08)]
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    border-b
                    border-[#EEEEEE]
                    px-4
                    py-3
                  "
                >
                  <div>
                    <h3 className="text-sm font-semibold text-[#171717]">
                      Notifications
                    </h3>

                    <p className="mt-0.5 text-[10px] text-[#888888]">
                      Recent updates
                    </p>
                  </div>

                  <span
                    className="
                      rounded-full
                      bg-[#F9EDEF]
                      px-2
                      py-1
                      text-[9px]
                      font-semibold
                      text-[#7A1F2B]
                    "
                  >
                    2 new
                  </span>
                </div>

                <div className="divide-y divide-[#EEEEEE]">

                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);

                      toast.success(
                        "Your knowledge base is up to date."
                      );
                    }}
                    className="
                      flex
                      w-full
                      gap-3
                      px-4
                      py-3
                      text-left
                      transition-colors
                      hover:bg-[#FAFAFA]
                    "
                  >
                    <div
                      className="
                        mt-0.5
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[#EDF7F0]
                        text-[#3F8F62]
                      "
                    >
                      <FaCheckCircle className="text-xs" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#171717]">
                        Knowledge base updated
                      </p>

                      <p className="mt-1 text-[10px] text-[#777777]">
                        Your latest documents are ready.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);

                      toast(
                        "You can start a new conversation anytime.",
                        {
                          icon: "💬",
                        }
                      );
                    }}
                    className="
                      flex
                      w-full
                      gap-3
                      px-4
                      py-3
                      text-left
                      transition-colors
                      hover:bg-[#FAFAFA]
                    "
                  >
                    <div
                      className="
                        mt-0.5
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[#F9EDEF]
                        text-[#7A1F2B]
                      "
                    >
                      <FaInfoCircle className="text-xs" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#171717]">
                        Knowledge Assistant
                      </p>

                      <p className="mt-1 text-[10px] text-[#777777]">
                        Ask questions about your organization.
                      </p>
                    </div>
                  </button>

                </div>

                <div className="border-t border-[#EEEEEE] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);

                      toast(
                        "Notification center will be connected later.",
                        {
                          icon: "🔔",
                        }
                      );
                    }}
                    className="
                      w-full
                      text-center
                      text-[10px]
                      font-semibold
                      text-[#7A1F2B]
                      transition-colors
                      hover:text-[#5A1118]
                    "
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mx-1 hidden h-6 w-px bg-[#E5E5E5] sm:block" />

          {/* ===================================================
              User Profile
          =================================================== */}

          <div
            ref={profileRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  (previous) => !previous
                )
              }
              className="
                flex
                items-center
                gap-2
                rounded-lg
                px-2
                py-1.5
                transition-colors
                hover:bg-[#F9EDEF]
              "
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >

              {/* Avatar */}

              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#7A1F2B]
                  text-[11px]
                  font-bold
                  text-white
                "
              >
                {avatarLetter}
              </div>

              {/* User */}

              <div className="hidden max-w-[120px] text-left sm:block">
                <p className="truncate text-xs font-semibold text-[#171717]">
                  {userName}
                </p>

                <p className="truncate text-[10px] text-[#888888]">
                  {userRole}
                </p>
              </div>

              <FaChevronDown
                className={`
                  hidden
                  text-[9px]
                  text-[#888888]
                  transition-transform
                  duration-200
                  sm:block
                  ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />

            </button>

            {/* =================================================
                Profile dropdown
            ================================================= */}

            {profileOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-12
                  w-64
                  overflow-hidden
                  rounded-xl
                  border
                  border-[#E5E5E5]
                  bg-white
                  shadow-[0_10px_30px_rgba(0,0,0,0.08)]
                "
              >

                {/* User information */}

                <div className="border-b border-[#EEEEEE] px-4 py-4">
                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[#7A1F2B]
                        text-sm
                        font-bold
                        text-white
                      "
                    >
                      {avatarLetter}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#171717]">
                        {userName}
                      </p>

                      <p className="truncate text-[10px] text-[#777777]">
                        {userEmail}
                      </p>

                      <p className="mt-1 text-[9px] font-semibold text-[#7A1F2B]">
                        {userRole}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Menu */}

                <div className="p-2">

                  <button
                    type="button"
                    onClick={openProfile}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-lg
                      px-3
                      py-2.5
                      text-left
                      text-xs
                      text-[#444444]
                      transition-colors
                      hover:bg-[#F9EDEF]
                      hover:text-[#7A1F2B]
                    "
                  >
                    <FaUser className="w-4 text-[11px]" />

                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={openSettings}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-lg
                      px-3
                      py-2.5
                      text-left
                      text-xs
                      text-[#444444]
                      transition-colors
                      hover:bg-[#F9EDEF]
                      hover:text-[#7A1F2B]
                    "
                  >
                    <FaCog className="w-4 text-[11px]" />

                    <span>Settings</span>
                  </button>

                </div>

                {/* Logout */}

                <div className="border-t border-[#EEEEEE] p-2">

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-lg
                      px-3
                      py-2.5
                      text-left
                      text-xs
                      text-[#A33A45]
                      transition-colors
                      hover:bg-[#FDF0F1]
                    "
                  >
                    <FaSignOutAlt className="w-4 text-[11px]" />

                    <span>Sign out</span>
                  </button>

                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;