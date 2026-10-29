import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Input({
  name,
  label,
  type = "text",
  placeholder = "",
  value = "",
  onChange,
  icon,
  error = "",
  required = false,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className="mb-2 block text-xs font-medium text-slate-300"
        >
          {label}
          {required && (
            <span className="ml-1 text-blue-400">*</span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <span
            className="
              pointer-events-none
              absolute
              left-3.5
              top-1/2
              -translate-y-1/2
              text-xs
              text-slate-500
            "
          >
            {icon}
          </span>
        )}

        {/* Input */}
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={
            name === "email"
              ? "email"
              : name === "password"
              ? "current-password"
              : "off"
          }
          className={`
            h-11
            w-full
            rounded-xl
            border
            bg-white/[0.03]
            text-sm
            text-white
            outline-none
            placeholder:text-slate-600
            transition-all
            duration-200
            disabled:cursor-not-allowed
            disabled:opacity-50
            ${
              error
                ? "border-red-500/50 focus:border-red-500"
                : "border-white/10 focus:border-blue-500/50"
            }
            ${icon ? "pl-10" : "px-3.5"}
            ${isPassword ? "pr-10" : "pr-3.5"}
            focus:bg-white/[0.05]
            focus:ring-2
            focus:ring-blue-500/10
          `}
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            className="
              absolute
              right-3.5
              top-1/2
              -translate-y-1/2
              text-xs
              text-slate-500
              transition-colors
              hover:text-slate-300
              disabled:cursor-not-allowed
            "
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-1.5 text-[11px] text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;