import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaShieldAlt,
  FaIdBadge,
  FaSignOutAlt,
} from "react-icons/fa";

import toast from "react-hot-toast";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getEmployeeAuthHeaders() {
  const token =
    localStorage.getItem("employeeAccessToken") ||
    sessionStorage.getItem("employeeAccessToken") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/api/auth/employee-me`,
          {
            method: "GET",
            headers: getEmployeeAuthHeaders(),
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Your session has expired. Please log in again."
            );
          }

          throw new Error(
            `Could not load profile (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        setProfile(data);

        if (data.email) {
          localStorage.setItem(
            "userEmail",
            data.email
          );
        }

        if (data.full_name) {
          localStorage.setItem(
            "userName",
            data.full_name
          );
        }
      } catch (error) {
        console.error(
          "Loading profile failed:",
          error
        );

        toast.error(
          error.message ||
            "Could not load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("full_name");
    localStorage.removeItem("email");
    localStorage.removeItem("rememberMe");

    localStorage.removeItem("employeeAccessToken");
    localStorage.removeItem("access_token");

    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("full_name");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("rememberMe");

    sessionStorage.removeItem("employeeAccessToken");
    sessionStorage.removeItem("access_token");

    window.location.href = "/login";
  };

  const userName =
    profile?.full_name ||
    profile?.name ||
    "User";

  const userEmail =
    profile?.email ||
    "user@company.com";

  const userRole =
    profile?.role ||
    "employee";

  const avatarLetter =
    userName
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen w-full bg-[#F8F8F8] text-[#171717]">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-8 flex items-center gap-3">

          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              border-[#E4E4E4]
              bg-white
              text-[#5F5F5F]
              shadow-sm
              transition
              hover:border-[#D4D4D4]
              hover:bg-[#FAF5F6]
              hover:text-[#52141C]
            "
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <FaArrowLeft className="text-xs" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-[#171717] sm:text-xl">
              Profile
            </h1>

            <p className="mt-1 text-xs text-[#8A8A8A] sm:text-sm">
              View your account information.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">

              {/* Loading Spinner */}
              <div
                className="
                  mx-auto
                  h-8
                  w-8
                  animate-spin
                  rounded-full
                  border-2
                  border-[#E4E4E4]
                  border-t-[#7A1F2B]
                "
              />

              <p className="mt-3 text-xs text-[#8A8A8A]">
                Loading profile...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Profile Card */}
            <section
              className="
                overflow-hidden
                rounded-2xl
                border
                border-[#E4E4E4]
                bg-white
                shadow-sm
              "
            >
              {/* Profile Header */}
              <div
                className="
                  border-b
                  border-[#E4E4E4]
                  bg-[#F9EFF0]
                  px-5
                  py-6
                  sm:px-7
                "
              >
                <div className="flex items-center gap-4">

                  {/* Avatar */}
                  <div
                    className="
                      flex
                      h-16
                      w-16
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[#E8C9CE]
                      bg-white
                      text-xl
                      font-semibold
                      text-[#7A1F2B]
                      shadow-sm
                    "
                  >
                    {avatarLetter}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-[#171717] sm:text-lg">
                      {userName}
                    </h2>

                    <p className="mt-1 truncate text-xs text-[#5F5F5F]">
                      {userEmail}
                    </p>

                    {/* Role Badge */}
                    <div
                      className="
                        mt-2
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        border-[#E8C9CE]
                        bg-white
                        px-2.5
                        py-1
                      "
                    >
                      <FaShieldAlt className="text-[9px] text-[#7A1F2B]" />

                      <span className="text-[9px] font-medium uppercase tracking-wider text-[#7A1F2B]">
                        {userRole}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Information */}
              <div className="p-5 sm:p-7">

                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Account Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* Full Name */}
                  <div
                    className="
                      rounded-xl
                      border
                      border-[#E4E4E4]
                      bg-[#F8F8F8]
                      p-4
                      transition
                      hover:border-[#D4D4D4]
                    "
                  >
                    <div className="flex items-start gap-3">

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-[#F9EFF0]
                          text-[#7A1F2B]
                        "
                      >
                        <FaUser className="text-xs" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-[#8A8A8A]">
                          Full Name
                        </p>

                        <p className="mt-1 truncate text-sm text-[#171717]">
                          {userName}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Email */}
                  <div
                    className="
                      rounded-xl
                      border
                      border-[#E4E4E4]
                      bg-[#F8F8F8]
                      p-4
                      transition
                      hover:border-[#D4D4D4]
                    "
                  >
                    <div className="flex items-start gap-3">

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-[#F9EFF0]
                          text-[#7A1F2B]
                        "
                      >
                        <FaEnvelope className="text-xs" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-[#8A8A8A]">
                          Email Address
                        </p>

                        <p className="mt-1 truncate text-sm text-[#171717]">
                          {userEmail}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Role */}
                  <div
                    className="
                      rounded-xl
                      border
                      border-[#E4E4E4]
                      bg-[#F8F8F8]
                      p-4
                      transition
                      hover:border-[#D4D4D4]
                    "
                  >
                    <div className="flex items-start gap-3">

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-[#F9EFF0]
                          text-[#7A1F2B]
                        "
                      >
                        <FaIdBadge className="text-xs" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-[#8A8A8A]">
                          Account Role
                        </p>

                        <p className="mt-1 capitalize text-sm text-[#171717]">
                          {userRole}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Account Status */}
                  <div
                    className="
                      rounded-xl
                      border
                      border-[#E4E4E4]
                      bg-[#F8F8F8]
                      p-4
                      transition
                      hover:border-[#D4D4D4]
                    "
                  >
                    <div className="flex items-start gap-3">

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-[#EDF7F1]
                          text-[#3F8F62]
                        "
                      >
                        <FaShieldAlt className="text-xs" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-[#8A8A8A]">
                          Account Status
                        </p>

                        <p className="mt-1 text-sm text-[#3F8F62]">
                          Active
                        </p>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* Session Card */}
            <section
              className="
                rounded-2xl
                border
                border-[#E4E4E4]
                bg-white
                p-5
                shadow-sm
                sm:p-7
              "
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
                Account Session
              </h3>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-sm text-[#5F5F5F]">
                    You are currently signed in as{" "}
                    <span className="font-medium text-[#171717]">
                      {userEmail}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-[#8A8A8A]">
                    Your employee account is authenticated
                    through the Enterprise Knowledge Assistant.
                  </p>
                </div>

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    flex
                    shrink-0
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border
                    border-[#E8C9CE]
                    bg-[#FBEDEF]
                    px-4
                    py-2
                    text-xs
                    font-medium
                    text-[#B84A56]
                    transition
                    hover:bg-[#F8E1E5]
                  "
                >
                  <FaSignOutAlt className="text-[10px]" />
                  Sign Out
                </button>

              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;