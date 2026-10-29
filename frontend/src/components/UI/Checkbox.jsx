function Checkbox({
  label,
  name,
  checked = false,
  onChange,
  disabled = false,
}) {
  return (
    <label
      className={`
        inline-flex
        cursor-pointer
        items-center
        gap-2.5
        select-none
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
      `}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="
          h-4
          w-4
          cursor-pointer
          rounded
          border
          border-white/20
          bg-slate-800
          accent-blue-600
          focus:ring-2
          focus:ring-blue-500/30
          disabled:cursor-not-allowed
        "
      />

      <span className="text-xs text-slate-400">
        {label}
      </span>
    </label>
  );
}

export default Checkbox;