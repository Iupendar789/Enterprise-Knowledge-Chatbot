import {
  FaSearch,
  FaMagic,
  FaShieldAlt,
  FaBrain,
} from "react-icons/fa";

const features = [
  {
    icon: FaSearch,
    title: "Intelligent Search",
    description:
      "Find relevant information quickly across your organization's knowledge.",
  },
  {
    icon: FaMagic,
    title: "AI-Powered Answers",
    description:
      "Get clear, contextual answers instead of searching through documents manually.",
  },
  {
    icon: FaShieldAlt,
    title: "Enterprise Ready",
    description:
      "Designed with secure knowledge access and reliable information retrieval in mind.",
  },
];

function FeatureSection() {
  return (
    <div className="max-w-2xl">

      {/* Brand */}
      <div className="mb-8 flex items-center gap-3">

        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-blue-400/30
            bg-blue-500/10
            shadow-lg
            shadow-blue-500/10
          "
        >
          <FaBrain className="text-lg text-blue-400" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-200">
            Enterprise Knowledge AI
          </p>

          <p className="mt-0.5 text-xs text-blue-400">
            Smart Search · Real Answers · Better Decisions
          </p>
        </div>

      </div>

      {/* Heading */}
      <h1
        className="
          max-w-2xl
          text-4xl
          font-semibold
          leading-[1.12]
          tracking-tight
          text-white
          xl:text-5xl
        "
      >
        Turn your organization's
        <span className="block text-blue-400">
          knowledge into answers.
        </span>
      </h1>

      {/* Description */}
      <p
        className="
          mt-6
          max-w-xl
          text-sm
          leading-6
          text-slate-400
          xl:text-base
        "
      >
        Connect your enterprise knowledge with an intelligent AI assistant
        that helps teams find information, understand documents, and make
        faster decisions.
      </p>

      {/* Features */}
      <div className="mt-9 space-y-7">

        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className="flex items-start gap-4"
            >

              {/* Icon */}
              <div
                className={`
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border
                  ${
                    index === 2
                      ? "border-cyan-400/20 bg-cyan-400/10"
                      : "border-blue-400/20 bg-blue-500/10"
                  }
                `}
              >
                <Icon
                  className={`
                    text-sm
                    ${
                      index === 2
                        ? "text-cyan-400"
                        : "text-blue-400"
                    }
                  `}
                />
              </div>

              {/* Text */}
              <div className="pt-0.5">

                <h3 className="text-sm font-semibold text-slate-200">
                  {feature.title}
                </h3>

                <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
                  {feature.description}
                </p>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default FeatureSection;