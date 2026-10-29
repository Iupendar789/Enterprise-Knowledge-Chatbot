import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordTooShort =
    password.length > 0 && password.length < 8;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Validate password
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------
      // 1. Employee Login
      // --------------------------------------------------

      const response = await fetch(
        `${API_URL}/api/auth/employee-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Employee login failed."
        );
      }

      // Make sure access token exists
      if (!data.access_token) {
        throw new Error(
          "Login succeeded, but the server did not return an access token."
        );
      }

      // --------------------------------------------------
      // 2. Clear previous admin session
      // --------------------------------------------------

      [
        "adminAccessToken",
        "adminEmail",
        "adminRole",
      ].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // --------------------------------------------------
      // 3. Save employee authentication information
      // --------------------------------------------------

      localStorage.setItem(
        "employeeAccessToken",
        data.access_token
      );

      localStorage.setItem(
        "employeeEmail",
        data.email || email.trim().toLowerCase()
      );

      localStorage.setItem(
        "employeeRole",
        data.role || "employee"
      );

      // Also keep the common token key
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      // --------------------------------------------------
      // 4. Fetch authenticated employee profile
      // --------------------------------------------------

      const profileResponse = await fetch(
        `${API_URL}/api/auth/employee-me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      );

      const profileData = await profileResponse
        .json()
        .catch(() => ({}));

      if (!profileResponse.ok) {
        throw new Error(
          profileData.detail ||
            "Login succeeded, but the employee profile could not be loaded."
        );
      }

      console.log(
        "Employee profile received:",
        profileData
      );

      // --------------------------------------------------
      // 5. Get employee name
      // --------------------------------------------------

      const fullName =
        profileData.full_name ||
        profileData.name ||
        data.full_name ||
        data.name ||
        "";

      // --------------------------------------------------
      // 6. Get employee email
      // --------------------------------------------------

      const employeeEmail =
        profileData.email ||
        data.email ||
        email.trim().toLowerCase();

      // --------------------------------------------------
      // 7. Get employee role
      // --------------------------------------------------

      const employeeRole =
        profileData.role ||
        data.role ||
        "employee";

      // --------------------------------------------------
      // 8. Store employee profile information
      // --------------------------------------------------

      if (fullName) {
        localStorage.setItem(
          "userName",
          fullName
        );

        localStorage.setItem(
          "full_name",
          fullName
        );

        localStorage.setItem(
          "name",
          fullName
        );
      } else {
        localStorage.removeItem("userName");
        localStorage.removeItem("full_name");
        localStorage.removeItem("name");
      }

      localStorage.setItem(
        "userEmail",
        employeeEmail
      );

      localStorage.setItem(
        "email",
        employeeEmail
      );

      localStorage.setItem(
        "employeeEmail",
        employeeEmail
      );

      localStorage.setItem(
        "employeeRole",
        employeeRole
      );

      // --------------------------------------------------
      // 9. Mark employee as logged in
      // --------------------------------------------------

      localStorage.setItem(
        "isLoggedIn",
        "true"
      );

      // --------------------------------------------------
      // 10. Debug information
      // --------------------------------------------------

      console.log("Employee login successful.");
      console.log("Employee name:", fullName);
      console.log("Employee email:", employeeEmail);
      console.log("Employee role:", employeeRole);

      // --------------------------------------------------
      // 11. Navigate to dashboard
      // --------------------------------------------------

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Employee login error:",
        err
      );

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
              Login Card
          -------------------------------------------------- */}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#E4E4E4] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.06)] sm:p-8"
          >

            {/* --------------------------------------------------
                Logo / Heading
            -------------------------------------------------- */}

            <div className="text-center">

              {/* Logo */}
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#7A1F2B] shadow-sm">
                <span className="text-xl font-bold tracking-tight text-white">
                  EK
                </span>
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1F2B]">
                Enterprise Knowledge Chatbot
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
                Employee Login
              </h1>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B6B6B]">
                Sign in to access your organization’s
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
                  htmlFor="employee-email"
                  className="mb-2 block text-sm font-medium text-[#171717]"
                >
                  Email
                </label>

                <input
                  id="employee-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter your email"
                  className="w-full rounded-lg border border-[#DCDCDC] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#A3A3A3] hover:border-[#C9C9C9] focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#F7E9EB]"
                />

              </div>

              {/* --------------------------------------------------
                  Password
              -------------------------------------------------- */}

              <div>

                <label
                  htmlFor="employee-password"
                  className="mb-2 block text-sm font-medium text-[#171717]"
                >
                  Password
                </label>

                <div className="flex overflow-hidden rounded-lg border border-[#DCDCDC] bg-white transition focus-within:border-[#7A1F2B] focus-within:ring-2 focus-within:ring-[#F7E9EB]">

                  <input
                    id="employee-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    aria-describedby="password-help"
                    aria-invalid={passwordTooShort}
                    placeholder="Enter your password"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[#171717] outline-none placeholder:text-[#A3A3A3]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="border-l border-[#E4E4E4] px-4 text-sm font-medium text-[#7A1F2B] transition hover:bg-[#F9EFF0]"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

                <p
                  id="password-help"
                  aria-live="polite"
                  className={`mt-2 text-xs ${
                    passwordTooShort
                      ? "text-[#B84A56]"
                      : "text-[#8A8A8A]"
                  }`}
                >
                  {passwordTooShort
                    ? `⚠ Enter at least 8 characters (${password.length}/8).`
                    : "Password must contain at least 8 characters."}
                </p>

              </div>

              {/* --------------------------------------------------
                  Login Button
              -------------------------------------------------- */}

              <button
                type="submit"
                disabled={
                  loading ||
                  password.length < 8
                }
                className="w-full rounded-lg bg-[#7A1F2B] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#641923] focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Signing in..."
                  : "Login"}
              </button>

            </div>

            {/* --------------------------------------------------
                Create Account
            -------------------------------------------------- */}

            <div className="mt-6 border-t border-[#EEEEEE] pt-5">

              <p className="text-center text-sm text-[#6B6B6B]">
                Don't have an account?{" "}

                <Link
                  to="/create-account"
                  className="font-semibold text-[#7A1F2B] hover:text-[#52141C]"
                >
                  Create Account
                </Link>
              </p>

            </div>

            {/* --------------------------------------------------
                Admin Login
            -------------------------------------------------- */}

            <Link
              to="/admin-login"
              className="mt-4 block w-full rounded-lg border border-[#7A1F2B] bg-white px-4 py-3 text-center text-sm font-semibold text-[#7A1F2B] transition hover:bg-[#F9EFF0]"
            >
              Admin Login
            </Link>

          </form>

          {/* --------------------------------------------------
              Footer
          -------------------------------------------------- */}

          <p className="mt-5 text-center text-xs text-[#8A8A8A]">
            Secure access to your organization’s
            knowledge platform
          </p>

        </div>
      </div>
    </main>
  );
}