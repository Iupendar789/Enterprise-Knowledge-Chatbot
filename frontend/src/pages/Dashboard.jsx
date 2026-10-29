import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import WelcomeSection from "../components/Dashboard/WelcomeSection";
import StatsCards from "../components/Dashboard/StatsCards";
import RecentChats from "../components/Dashboard/RecentChats";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// =========================================================
// Storage helpers
// =========================================================

function getStoredValue(key) {
  return (
    localStorage.getItem(key) ||
    sessionStorage.getItem(key) ||
    ""
  );
}

function getEmployeeToken() {
  return (
    getStoredValue("employeeAccessToken") ||
    getStoredValue("access_token") ||
    getStoredValue("token")
  );
}

// =========================================================
// Dashboard
// =========================================================

function Dashboard() {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const [userName, setUserName] = useState(
    getStoredValue("userName") ||
      getStoredValue("full_name") ||
      "User"
  );

  const [userEmail, setUserEmail] = useState(
    getStoredValue("userEmail") ||
      getStoredValue("email") ||
      ""
  );

  const [loadingProfile, setLoadingProfile] = useState(true);

  // =========================================================
  // Load employee profile
  // =========================================================

  useEffect(() => {
    const loadEmployeeProfile = async () => {
      const token = getEmployeeToken();

      if (!token) {
        setLoadingProfile(false);
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/employee-me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Session expired.");
          }

          throw new Error(
            `Failed to load profile (${response.status}).`
          );
        }

        const data = await response.json();

        const name =
          data.full_name ||
          data.name ||
          getStoredValue("userName") ||
          getStoredValue("full_name") ||
          "User";

        const email =
          data.email ||
          getStoredValue("userEmail") ||
          getStoredValue("email") ||
          "";

        setUserName(name);
        setUserEmail(email);

        localStorage.setItem("userName", name);
        localStorage.setItem("full_name", name);

        if (email) {
          localStorage.setItem("userEmail", email);
          localStorage.setItem("email", email);
        }

        localStorage.setItem("userRole", "employee");
        localStorage.setItem("role", "employee");
      } catch (error) {
        console.error(
          "Failed to load employee profile:",
          error
        );

        const storedName =
          getStoredValue("userName") ||
          getStoredValue("full_name");

        const storedEmail =
          getStoredValue("userEmail") ||
          getStoredValue("email");

        if (storedName || storedEmail) {
          setUserName(storedName || "User");
          setUserEmail(storedEmail || "");
        } else {
          localStorage.removeItem(
            "employeeAccessToken"
          );
          localStorage.removeItem("access_token");
          localStorage.removeItem("token");

          sessionStorage.removeItem(
            "employeeAccessToken"
          );
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("token");

          navigate("/login");
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    loadEmployeeProfile();
  }, [navigate]);

  // =========================================================
  // Mobile sidebar
  // =========================================================

  const handleOpenSidebar = () => {
    setMobileOpen(true);
  };

  const handleCloseSidebar = () => {
    setMobileOpen(false);
  };

  // =========================================================
  // Loading
  // =========================================================

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8]">
        <div className="flex flex-col items-center">
          <div
            className="
              h-8
              w-8
              animate-spin
              rounded-full
              border-2
              border-[#E5E5E5]
              border-t-[#7A1F2B]
            "
          />

          <p className="mt-3 text-xs text-[#666666]">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // Dashboard UI
  // =========================================================

  return (
    <div className="min-h-screen w-full bg-[#F8F8F8] text-[#171717]">
      <div className="flex min-h-screen w-full">

        {/* =====================================================
            Sidebar
        ===================================================== */}

        <Sidebar
          mobileOpen={mobileOpen}
          onClose={handleCloseSidebar}
        />

        {/* =====================================================
            Main Area
        ===================================================== */}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">

          {/* Header */}

          <Header
            onMenuClick={handleOpenSidebar}
          />

          {/* ===================================================
              Main Dashboard
          =================================================== */}

          <main
            className="
              flex-1
              bg-[#F8F8F8]
              px-4
              py-5
              sm:px-6
              lg:px-8
            "
          >
            <div className="mx-auto w-full max-w-[1400px]">

              {/* =================================================
                  NovaTech Dashboard Title
              ================================================= */}

              <div
                className="
                  mb-6
                  flex
                  items-center
                  justify-center
                  text-center
                "
              >
                <h1
                  className="
                    text-2xl
                    font-bold
                    tracking-tight
                    text-[#171717]
                    sm:text-3xl
                  "
                >
                  Enterprise Knowledge Assistent
                </h1>
              </div>

              {/* =================================================
                  Welcome Section
              ================================================= */}

              <section className="mb-6">
                <WelcomeSection
                  userName={userName}
                />
              </section>

              {/* =================================================
                  Statistics
              ================================================= */}

              <section className="mb-6">
                <StatsCards />
              </section>

              {/* =================================================
                  Recent Conversations
              ================================================= */}

              <section>
                <RecentChats />
              </section>

              {/* =================================================
                  Account Information
              ================================================= */}

              <section className="mt-6">
                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    rounded-xl
                    border
                    border-[#E5E5E5]
                    bg-white
                    px-5
                    py-4
                    shadow-[0_2px_8px_rgba(0,0,0,0.03)]
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#171717]">
                      Signed in as
                    </p>

                    <p className="mt-1 truncate text-xs text-[#666666]">
                      {userEmail || "Employee account"}
                    </p>
                  </div>

                  <span
                    className="
                      inline-flex
                      w-fit
                      rounded-full
                      bg-[#F9EDEF]
                      px-3
                      py-1
                      text-[10px]
                      font-semibold
                      text-[#7A1F2B]
                    "
                  >
                    Employee
                  </span>
                </div>
              </section>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;