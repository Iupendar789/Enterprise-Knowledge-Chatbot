import {
  FaHome,
  FaComments,
  FaFileAlt,
  FaHistory,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaBrain,
  FaTimes,
} from "react-icons/fa";

import { NavLink } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", icon: FaHome, path: "/dashboard" },
  { label: "Chat", icon: FaComments, path: "/chat" },
  { label: "Documents", icon: FaFileAlt, path: "/documents" },
  { label: "History", icon: FaHistory, path: "/history" },
];

function getStoredValue(key) {
  return (
    localStorage.getItem(key) ||
    sessionStorage.getItem(key) ||
    ""
  );
}

function Sidebar({ mobileOpen = false, onClose }) {
  const userName =
    getStoredValue("userName") ||
    getStoredValue("full_name") ||
    "User";

  const userEmail =
    getStoredValue("userEmail") ||
    getStoredValue("email") ||
    "user@company.com";

  const avatarLetter =
    userName.trim().charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
    const keysToRemove = [
      "isLoggedIn",
      "userEmail",
      "userName",
      "full_name",
      "email",
      "rememberMe",
      "employeeAccessToken",
      "access_token",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    window.location.href = "/login";
  };

  const getNavClass = ({ isActive }) =>
    `
      group flex h-10 w-full items-center gap-3 rounded-lg px-3
      text-sm transition-all duration-200
      ${
        isActive
          ? "border border-[#C5D9F0] bg-[#DCEAF9] font-semibold text-[#1E293B]"
          : "text-[#334155] hover:bg-[#E2EAF3] hover:text-[#0F172A]"
      }
    `;

  const getIconClass = (isActive) =>
    isActive
      ? "text-[#527FAF]"
      : "text-[#64748B] group-hover:text-[#334155]";

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64
          border-r border-[#D7E2EF] bg-[#EAF2FB]
          transition-transform duration-300
          lg:sticky lg:top-0 lg:z-20 lg:block lg:h-screen
          lg:w-64 lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full w-64 flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#D7E2EF] px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#C9DCEF] bg-[#DCEAF9]">
                <FaBrain className="text-sm text-[#527FAF]" />
              </div>

              <div className="leading-tight">
                <h1 className="text-sm font-semibold text-[#0F172A]">
                  Enterprise AI
                </h1>

                <p className="mt-1 text-[10px] text-[#475569]">
                  Knowledge Assistant
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] transition-colors hover:bg-[#DCE6F2] hover:text-[#0F172A] lg:hidden"
              aria-label="Close sidebar"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-6">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-[#475569]">
              Workspace
            </p>

            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={getNavClass}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 shrink-0 text-xs ${getIconClass(
                            isActive
                          )}`}
                        />

                        <span>{item.label}</span>

                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#527FAF]" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Account Navigation */}
            <div className="mt-8">
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                Account
              </p>

              <NavLink
                to="/profile"
                onClick={onClose}
                className={getNavClass}
              >
                {({ isActive }) => (
                  <>
                    <FaUser
                      className={`w-4 text-xs ${getIconClass(isActive)}`}
                    />
                    <span>Profile</span>
                  </>
                )}
              </NavLink>

              <NavLink
                to="/settings"
                onClick={onClose}
                className={({ isActive }) =>
                  `mt-1 ${getNavClass({ isActive })}`
                }
              >
                {({ isActive }) => (
                  <>
                    <FaCog
                      className={`w-4 text-xs ${getIconClass(isActive)}`}
                    />
                    <span>Settings</span>
                  </>
                )}
              </NavLink>
            </div>
          </nav>

          {/* Logged-in Employee Information */}
          <div className="shrink-0 border-t border-[#D7E2EF] p-3">
            <div className="flex items-center gap-3 px-2 py-2">
              {/* Employee Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C9DCEF] bg-[#DCEAF9] text-xs font-semibold text-[#355F8D]">
                {avatarLetter}
              </div>

              {/* Employee Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#1E293B]">
                  {userName}
                </p>

                <p className="truncate text-[10px] text-[#475569]">
                  {userEmail}
                </p>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#64748B] transition-all duration-200 hover:bg-[#FCE8E8] hover:text-[#B45353]"
                title="Sign out"
                aria-label="Sign out"
              >
                <FaSignOutAlt className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;