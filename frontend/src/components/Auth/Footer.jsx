function Footer() {
  return (
    <footer
      className="
        mx-auto
        flex
        w-full
        max-w-7xl
        items-center
        justify-between
        px-6
        py-4
        lg:px-12
        xl:px-16
      "
    >
      {/* Copyright */}
      <p className="text-xs text-slate-500">
        © 2026 Enterprise Knowledge AI
      </p>

      {/* Links */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="
            text-xs
            text-slate-500
            transition-colors
            hover:text-slate-300
          "
        >
          Privacy
        </button>

        <button
          type="button"
          className="
            text-xs
            text-slate-500
            transition-colors
            hover:text-slate-300
          "
        >
          Terms
        </button>

        <button
          type="button"
          className="
            text-xs
            text-slate-500
            transition-colors
            hover:text-slate-300
          "
        >
          Help
        </button>
      </div>
    </footer>
  );
}

export default Footer;