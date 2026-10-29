import LoadingSpinner from "./LoadingSpinner";

function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  className = "",
}) {
  const variants = {
    primary: `
      border border-blue-500/20
      bg-blue-600
      text-white
      hover:bg-blue-500
      active:bg-blue-700
      shadow-lg shadow-blue-900/20
    `,

    secondary: `
      border border-white/10
      bg-white/[0.06]
      text-slate-200
      hover:bg-white/[0.10]
    `,

    outline: `
      border border-white/10
      bg-transparent
      text-slate-300
      hover:border-white/20
      hover:bg-white/[0.04]
      hover:text-white
    `,

    danger: `
      border border-red-500/20
      bg-red-600
      text-white
      hover:bg-red-500
    `,

    success: `
      border border-emerald-500/20
      bg-emerald-600
      text-white
      hover:bg-emerald-500
    `,
  };

  const sizes = {
    sm: "h-9 px-3 text-xs rounded-lg",
    md: "h-11 px-4 text-sm rounded-xl",
    lg: "h-12 px-5 text-sm rounded-xl",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        font-medium
        transition-all
        duration-200
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500/30
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" color="white" />
          <span>Signing in...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;