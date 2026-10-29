import { FaBrain } from "react-icons/fa";

function TypingIndicator() {
  return (
    <div
      className="w-full border-y border-white/[0.04] bg-white/[0.015] py-5"
      role="status"
      aria-live="polite"
      aria-label="Enterprise AI is thinking"
    >
      <div className="mx-auto flex w-full max-w-3xl gap-3 px-5">
        {/* AI Avatar */}
        <div
          aria-hidden="true"
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            border
            border-blue-400/10
            bg-blue-500/10
            text-blue-400
          "
        >
          <FaBrain className="text-[10px]" />
        </div>

        {/* Typing Content */}
        <div className="min-w-0 flex-1">
          {/* Name */}
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium text-slate-300">
              Enterprise AI
            </p>

            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] text-blue-400">
              AI
            </span>
          </div>

          {/* Typing Animation */}
          <div className="mt-3 flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-blue-400
                motion-safe:animate-bounce
                motion-reduce:animate-none
              "
            />

            <span
              aria-hidden="true"
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-blue-400
                motion-safe:animate-bounce
                motion-reduce:animate-none
                [animation-delay:150ms]
              "
            />

            <span
              aria-hidden="true"
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-blue-400
                motion-safe:animate-bounce
                motion-reduce:animate-none
                [animation-delay:300ms]
              "
            />

            <span className="ml-1 text-[10px] text-slate-600">
              Thinking...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;