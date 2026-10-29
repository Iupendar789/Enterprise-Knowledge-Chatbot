import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/admin-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Admin login failed."
        );
      }

      // Adjust this if your backend returns
      // the token under another key.
      const token = data.access_token;

      if (!token) {
        throw new Error(
          "Login succeeded, but the server did not return an access token."
        );
      }

      // Clear old employee/admin sessions
      localStorage.removeItem("employeeAccessToken");
      localStorage.removeItem("employeeRole");

      localStorage.setItem(
        "adminAccessToken",
        token
      );

      localStorage.setItem(
        "adminEmail",
        email
      );

      localStorage.setItem(
        "adminRole",
        "admin"
      );

      navigate("/admin", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F8F8] px-4 py-8 text-[#171717] sm:px-6 lg:px-8">

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">

        <div className="w-full max-w-md">

          {/* --------------------------------------------------
              Admin Login Card
          -------------------------------------------------- */}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#E4E4E4] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.06)] sm:p-8"
          >

            {/* --------------------------------------------------
                Logo / Heading
            -------------------------------------------------- */}

            <div className="text-center">

              {/* Admin Logo */}
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#52141C] shadow-sm">
                <span className="text-lg font-bold tracking-tight text-white">
                  AD
                </span>
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1F2B]">
                Enterprise Knowledge Chatbot
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
                Admin Login
              </h1>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B6B6B]">
                Sign in to manage the organization’s
                knowledge base.
              </p>

            </div>

            {/* --------------------------------------------------
                Error Message
            -------------------------------------------------- */}

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-lg border border-[#E5B8BD] bg-[#FBEDEF] px-4 py-3 text-sm text-[#8F2634]"
              >
                {error}
              </div>
            )}

            {/* --------------------------------------------------
                Form Fields
            -------------------------------------------------- */}

            <div className="mt-7 space-y-5">

              {/* --------------------------------------------------
                  Email
              -------------------------------------------------- */}

              <div>

                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-medium text-[#171717]"
                >
                  Email
                </label>

                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter admin email"
                  className="w-full rounded-lg border border-[#DCDCDC] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#A3A3A3] hover:border-[#C9C9C9] focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#F7E9EB]"
                />

              </div>

              {/* --------------------------------------------------
                  Password
              -------------------------------------------------- */}

              <div>

                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-medium text-[#171717]"
                >
                  Password
                </label>

                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter admin password"
                  className="w-full rounded-lg border border-[#DCDCDC] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#A3A3A3] hover:border-[#C9C9C9] focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#F7E9EB]"
                />

              </div>

              {/* --------------------------------------------------
                  Login Button
              -------------------------------------------------- */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#7A1F2B] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#641923] focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing in..."
                  : "Login as Admin"}
              </button>

            </div>

            {/* --------------------------------------------------
                Back to Employee Login
            -------------------------------------------------- */}

            <div className="mt-6 border-t border-[#EEEEEE] pt-5">

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full rounded-lg border border-[#D8D8D8] bg-white px-4 py-3 text-sm font-semibold text-[#52141C] transition hover:border-[#7A1F2B] hover:bg-[#F9EFF0]"
              >
                Back to Employee Login
              </button>

            </div>

          </form>

          {/* --------------------------------------------------
              Footer
          -------------------------------------------------- */}

          <p className="mt-5 text-center text-xs text-[#8A8A8A]">
            Administrative access to your organization’s
            knowledge platform
          </p>

        </div>

      </div>

    </main>
  );
}