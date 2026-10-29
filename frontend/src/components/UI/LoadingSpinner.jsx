function LoadingSpinner({
  size = "md",
  color = "blue",
  text = "",
}) {
  const sizes = {
    sm: "h-3.5 w-3.5 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-7 w-7 border-[3px]",
    xl: "h-9 w-9 border-[3px]",
  };

  const colors = {
    blue: "border-blue-400/30 border-t-blue-400",
    white: "border-white/30 border-t-white",
    green: "border-emerald-400/30 border-t-emerald-400",
    red: "border-red-400/30 border-t-red-400",
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <span
        role="status"
        aria-label="Loading"
        className={`
          inline-block
          shrink-0
          animate-spin
          rounded-full
          ${sizes[size] || sizes.md}
          ${colors[color] || colors.blue}
        `}
      />

      {text && (
        <span className="text-xs text-slate-400">
          {text}
        </span>
      )}
    </div>
  );
}

export default LoadingSpinner;