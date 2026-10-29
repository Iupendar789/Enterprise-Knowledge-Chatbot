import { FaFileAlt } from "react-icons/fa";

function SourceReferences({ sources = [] }) {
  if (!sources.length) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-600">
        Source pages
      </p>

      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => {
          // The backend currently returns page numbers, e.g. [1, 3].
          const page =
            typeof source === "number"
              ? source
              : source?.page;

          if (!page) {
            return null;
          }

          return (
            <div
              key={`${page}-${index}`}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-white/[0.07]
                bg-white/[0.02]
                px-3
                py-2
              "
            >
              <FaFileAlt className="text-[9px] text-blue-400" />

              <span className="text-[10px] text-slate-300">
                Page {page}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SourceReferences;