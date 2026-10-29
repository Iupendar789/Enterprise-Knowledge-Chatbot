function Divider({ text = "OR" }) {
  return (
    <div className="flex items-center gap-3">
      {/* Left Line */}
      <div className="h-px flex-1 bg-white/10" />

      {/* Text */}
      <span className="text-[10px] font-medium tracking-wider text-slate-500">
        {text}
      </span>

      {/* Right Line */}
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export default Divider;