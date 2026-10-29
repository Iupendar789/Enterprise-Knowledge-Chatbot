import { FaBrain } from "react-icons/fa";

function Logo({
  size = "md",
  centered = false,
  showText = true,
}) {
  const sizes = {
    sm: {
      container: "h-9 w-9 rounded-lg",
      icon: "text-sm",
      title: "text-sm",
      subtitle: "text-[10px]",
    },

    md: {
      container: "h-11 w-11 rounded-xl",
      icon: "text-lg",
      title: "text-base",
      subtitle: "text-xs",
    },

    lg: {
      container: "h-12 w-12 rounded-xl",
      icon: "text-xl",
      title: "text-lg",
      subtitle: "text-xs",
    },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div
      className={`
        flex
        items-center
        gap-3
        ${centered ? "justify-center" : "justify-start"}
      `}
    >
      {/* Icon */}
      <div
        className={`
          ${currentSize.container}
          flex
          shrink-0
          items-center
          justify-center
          border
          border-blue-400/30
          bg-blue-500/10
          shadow-lg
          shadow-blue-500/10
        `}
      >
        <FaBrain
          className={`${currentSize.icon} text-blue-400`}
        />
      </div>

      {/* Text */}
      {showText && (
        <div className="leading-tight">

          <h1
            className={`
              ${currentSize.title}
              font-semibold
              tracking-tight
              text-white
            `}
          >
            Enterprise AI
          </h1>

          <p
            className={`
              ${currentSize.subtitle}
              mt-1
              text-blue-400/80
            `}
          >
            Knowledge Assistant
          </p>

        </div>
      )}
    </div>
  );
}

export default Logo;