function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
}) {
  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={`
        w-full
        rounded-2xl
        border
        border-white/10
        bg-slate-900/70
        backdrop-blur-xl
        ${paddings[padding] || paddings.md}
        ${
          hover
            ? "transition-all duration-200 hover:border-white/15 hover:bg-slate-900/80"
            : ""
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;