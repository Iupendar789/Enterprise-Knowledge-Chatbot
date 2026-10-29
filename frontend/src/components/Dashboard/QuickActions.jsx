import {
  FaComments,
  FaHistory,
  FaArrowRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    title: "Start a Chat",
    description: "Ask questions about your knowledge base",
    icon: FaComments,
    path: "/chat",
  },
  {
    title: "View History",
    description: "Review your previous conversations",
    icon: FaHistory,
    path: "/history",
  },
];

function QuickActions() {
  const navigate = useNavigate();

  const handleAction = (path) => {
    navigate(path);
  };

  return (
    <section>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-700">
          Quick Actions
        </h2>

        <p className="mt-1 text-[10px] text-slate-500">
          Get started with your knowledge assistant
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              type="button"
              onClick={() => handleAction(action.path)}
              className="
                group
                w-full
                rounded-xl
                border border-[#E5EAF0]
                bg-white
                p-4
                text-left
                transition-all
                duration-200
                hover:border-[#C9D9EB]
                hover:bg-[#F8FAFC]
                focus:outline-none
                focus:ring-2
                focus:ring-[#7BA7D9]/30
              "
            >
              <div className="flex items-start justify-between">
                {/* Icon */}
                <div
                  className="
                    flex h-9 w-9
                    items-center justify-center
                    rounded-lg
                    border border-[#E1EBF7]
                    bg-[#EAF2FB]
                    text-[#7BA7D9]
                    transition-all
                    duration-200
                    group-hover:bg-[#DCEAF9]
                  "
                >
                  <Icon className="text-xs" />
                </div>

                {/* Arrow */}
                <FaArrowRight
                  className="
                    mt-1
                    text-[9px]
                    text-slate-400
                    transition-all
                    duration-200
                    group-hover:translate-x-0.5
                    group-hover:text-[#7BA7D9]
                  "
                />
              </div>

              {/* Content */}
              <div className="mt-4">
                <h3
                  className="
                    text-xs
                    font-medium
                    text-slate-700
                    transition-colors
                    group-hover:text-[#527FAF]
                  "
                >
                  {action.title}
                </h3>

                <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default QuickActions;