function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#020817]">

      {/* Base gradient */}
      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.16),transparent_32%),radial-gradient(circle_at_85%_75%,rgba(6,182,212,0.10),transparent_30%),linear-gradient(135deg,#020817_0%,#03122d_50%,#020817_100%)]
        "
      />

      {/* Top-left glow */}
      <div
        className="
          absolute
          -left-32
          -top-32
          h-96
          w-96
          rounded-full
          bg-blue-600/10
          blur-[100px]
        "
      />

      {/* Bottom-right glow */}
      <div
        className="
          absolute
          -bottom-40
          -right-40
          h-[500px]
          w-[500px]
          rounded-full
          bg-cyan-500/10
          blur-[120px]
        "
      />

      {/* Animated waves */}
      <svg
        className="absolute inset-0 h-full w-full opacity-60"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveBlue" x1="0" x2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
            <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Top wave */}
        <path
          d="M-100 250 C250 40 390 160 650 -60"
          fill="none"
          stroke="url(#waveBlue)"
          strokeWidth="1"
          filter="url(#glow)"
        />

        <path
          d="M-100 220 C220 20 400 140 680 -80"
          fill="none"
          stroke="#2563eb"
          strokeOpacity="0.25"
          strokeWidth="1"
        />

        {/* Bottom wave */}
        <path
          d="M300 950 C600 700 760 760 1000 900 C1200 1020 1370 950 1700 700"
          fill="none"
          stroke="url(#waveBlue)"
          strokeWidth="1"
          filter="url(#glow)"
        />

        <path
          d="M400 980 C650 730 800 790 1040 920 C1250 1030 1430 940 1700 650"
          fill="none"
          stroke="#2563eb"
          strokeOpacity="0.25"
          strokeWidth="1"
        />

        {/* Right wave */}
        <path
          d="M1370 600 C1460 490 1530 470 1700 350"
          fill="none"
          stroke="#06b6d4"
          strokeOpacity="0.5"
          strokeWidth="1"
        />
      </svg>

      {/* Top-left particles */}
      <div className="absolute left-0 top-10 h-36 w-64 opacity-50">
        <div className="absolute left-10 top-8 h-1 w-1 rounded-full bg-blue-400" />
        <div className="absolute left-20 top-14 h-1 w-1 rounded-full bg-blue-400" />
        <div className="absolute left-28 top-5 h-1 w-1 rounded-full bg-cyan-400" />
        <div className="absolute left-40 top-20 h-1 w-1 rounded-full bg-blue-400" />
        <div className="absolute left-52 top-12 h-1 w-1 rounded-full bg-blue-400" />
        <div className="absolute left-16 top-30 h-1 w-1 rounded-full bg-cyan-400" />
        <div className="absolute left-36 top-32 h-1 w-1 rounded-full bg-blue-400" />
        <div className="absolute left-60 top-28 h-1 w-1 rounded-full bg-blue-400" />
      </div>

      {/* Bottom-right particles */}
      <div className="absolute bottom-16 right-0 h-48 w-72 opacity-50">
        <div className="absolute right-10 top-8 h-1 w-1 rounded-full bg-blue-400" />
        <div className="absolute right-20 top-16 h-1 w-1 rounded-full bg-cyan-400" />
        <div className="absolute right-32 top-5 h-1 w-1 rounded-full bg-blue-400" />
        <div className="absolute right-44 top-20 h-1 w-1 rounded-full bg-blue-400" />
        <div className="absolute right-16 top-32 h-1 w-1 rounded-full bg-cyan-400" />
        <div className="absolute right-36 top-38 h-1 w-1 rounded-full bg-blue-400" />
        <div className="absolute right-52 top-28 h-1 w-1 rounded-full bg-blue-400" />
      </div>

      {/* Glowing points */}
      <div className="absolute left-[11%] top-[14%] h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_18px_6px_rgba(34,211,238,0.25)]" />

      <div className="absolute right-[8%] top-[47%] h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_18px_6px_rgba(34,211,238,0.25)]" />

      {/* Vignette */}
      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_center,transparent_30%,rgba(2,6,23,0.65)_100%)]
        "
      />
    </div>
  );
}

export default AnimatedBackground;