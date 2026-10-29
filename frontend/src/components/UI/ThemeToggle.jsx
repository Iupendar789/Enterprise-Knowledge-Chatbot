import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return true;
  });

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        darkMode
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        darkMode
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-lg
        border
        border-white/10
        bg-slate-900/70
        text-slate-400
        shadow-lg
        shadow-black/10
        backdrop-blur-xl
        transition-all
        duration-200
        hover:border-white/20
        hover:bg-slate-800
        hover:text-white
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500/30
      "
    >
      {darkMode ? (
        <FaSun className="text-xs" />
      ) : (
        <FaMoon className="text-xs" />
      )}
    </button>
  );
}

export default ThemeToggle;