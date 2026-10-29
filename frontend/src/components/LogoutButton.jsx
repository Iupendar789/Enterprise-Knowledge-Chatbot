import { useNavigate } from "react-router-dom";

export default function LogoutButton({ role = "employee" }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    const keys =
      role === "admin"
        ? ["adminAccessToken", "adminEmail", "adminRole"]
        : ["employeeAccessToken", "employeeEmail", "employeeRole"];

    keys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    navigate("/login", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
    >
      Logout
    </button>
  );
}