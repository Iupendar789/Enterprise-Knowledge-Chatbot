import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";

function getStoredValue(key) {
  return (
    localStorage.getItem(key) ||
    sessionStorage.getItem(key) ||
    ""
  );
}

function AdminRoute() {
  const adminToken = getStoredValue("adminAccessToken");
  const adminRole = getStoredValue("adminRole");
  const employeeToken = getStoredValue("employeeAccessToken");

  if (employeeToken) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!adminToken || adminRole !== "admin") {
    return <Navigate to="/admin-login" replace />;
  }

  return <Admin />;
}

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
        }}
      />

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/create-account"
          element={<CreateAccount />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/chat"
          element={<Chat />}
        />

        <Route
          path="/history"
          element={<History />}
        />

        <Route
          path="/documents"
          element={<Documents />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin"
          element={<AdminRoute />}
        />
        <Route
          path="/settings"
          element={<Settings />}
/>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </>
  );
}

export default App;