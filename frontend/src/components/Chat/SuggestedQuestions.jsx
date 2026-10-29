import {
  FaFileAlt,
  FaUserTie,
  FaChartLine,
  FaProjectDiagram,
} from "react-icons/fa";

function SuggestedQuestions({ onSelectQuestion }) {
  const questions = [
    {
      question: "What is our leave policy?",
      description:
        "Find information about employee leave and holidays.",
      icon: FaFileAlt,
    },
    {
      question: "Explain the HR policy",
      description:
        "Get answers from your organization's HR documents.",
      icon: FaUserTie,
    },
    
  ];

  return (
    <section className="shrink-0 px-4 pb-4 sm:px-5">
      <div className="mx-auto w-full max-w-4xl">

        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8A]">
          Suggested questions
        </p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {questions.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.question}
                type="button"
                onClick={() =>
                  onSelectQuestion(item.question)
                }
                className="
                  group
                  flex
                  min-h-[58px]
                  items-center
                  gap-3
                  rounded-xl
                  border border-[#E4E4E4]
                  bg-white
                  px-3
                  py-2.5
                  text-left
                  shadow-sm
                  transition-all
                  duration-200
                  hover:border-[#E8C9CD]
                  hover:bg-[#F9EFF0]
                  active:scale-[0.99]
                "
              >
                {/* Icon */}
                <div
                  className="
                    flex h-8 w-8
                    shrink-0
                    items-center justify-center
                    rounded-lg
                    bg-[#F7E9EB]
                    text-[#7A1F2B]
                    transition-colors
                    group-hover:bg-white
                  "
                >
                  <Icon className="text-[10px]" />
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold text-[#171717]">
                    {item.question}
                  </p>

                  <p className="mt-0.5 truncate text-[9px] text-[#8A8A8A]">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SuggestedQuestions;